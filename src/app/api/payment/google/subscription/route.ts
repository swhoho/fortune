/**
 * Google Play 구독 검증 API
 * POST /api/payment/google/subscription
 *
 * Capacitor Android 앱에서 Google Play 구독 결제 후 검증 요청
 * - 구독 상태 확인
 * - subscriptions 테이블에 기록
 * - users.subscription_status 업데이트
 * - 월 50C 크레딧 지급
 */
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { addCredits } from '@/lib/credits/add';

/** 구독 플랜 정보 */
const SUBSCRIPTION_PLAN = {
  productId: 'subscription_premium_monthly',
  name: '프리미엄 구독',
  price: 3900,
  credits: 50, // 월 50C 지급
};

/** Supabase 서비스 롤 클라이언트 */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Google Play Developer API 클라이언트 */
async function getAndroidPublisher() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  return google.androidpublisher({
    version: 'v3',
    auth,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { purchaseToken, productId, userId, orderId } = await request.json();

    // 필수 파라미터 검증
    if (!purchaseToken || !productId || !userId) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 });
    }

    // 상품 ID 검증
    if (productId !== SUBSCRIPTION_PLAN.productId) {
      return NextResponse.json({ error: '유효하지 않은 구독 상품입니다' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 중복 검증 확인 (purchaseToken으로)
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('google_purchase_token', purchaseToken)
      .single();

    if (existingSubscription) {
      return NextResponse.json({ error: '이미 처리된 구독입니다' }, { status: 400 });
    }

    // 기존 활성 구독 확인
    const { data: activeSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (activeSubscription) {
      return NextResponse.json({ error: '이미 활성 구독이 있습니다' }, { status: 400 });
    }

    // Google Play Developer API로 구독 검증
    let expiryTimeMillis: number | null = null;
    let startTimeMillis: number | null = null;

    try {
      const androidPublisher = await getAndroidPublisher();
      const packageName = 'ai.mastersinsight.app';

      const subscriptionResult = await androidPublisher.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      const data = subscriptionResult.data;

      // 구독 상태 확인
      // paymentState: 0=pending, 1=received, 2=free trial, 3=pending deferred
      if (data.paymentState !== 1 && data.paymentState !== 2) {
        return NextResponse.json({ error: '구독 결제가 완료되지 않았습니다' }, { status: 400 });
      }

      // 취소 여부 확인
      if (data.cancelReason !== undefined && data.cancelReason !== null) {
        return NextResponse.json({ error: '취소된 구독입니다' }, { status: 400 });
      }

      expiryTimeMillis = parseInt(data.expiryTimeMillis || '0', 10);
      startTimeMillis = parseInt(data.startTimeMillis || '0', 10);

      // 구독 승인 (acknowledge)
      if (!data.acknowledgementState) {
        await androidPublisher.purchases.subscriptions.acknowledge({
          packageName,
          subscriptionId: productId,
          token: purchaseToken,
        });
      }
    } catch (googleError) {
      console.error('Google Play API 오류:', googleError);

      // 개발 환경에서는 Google API 없이도 테스트 가능
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Google Play 검증 실패' }, { status: 400 });
      }
      console.warn('개발 환경: Google Play 검증 스킵');

      // 개발 환경 기본값
      const now = Date.now();
      startTimeMillis = now;
      expiryTimeMillis = now + 30 * 24 * 60 * 60 * 1000; // 30일 후
    }

    // 구독 기간 계산
    const periodStart = startTimeMillis ? new Date(startTimeMillis) : new Date();
    const periodEnd = expiryTimeMillis
      ? new Date(expiryTimeMillis)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 구독 레코드 생성
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        price: SUBSCRIPTION_PLAN.price,
        payment_method: 'google_play',
        google_purchase_token: purchaseToken,
        google_order_id: orderId,
      })
      .select('id')
      .single();

    if (subError || !subscription) {
      console.error('구독 레코드 생성 실패:', subError);
      return NextResponse.json({ error: '구독 레코드 생성 실패' }, { status: 500 });
    }

    // users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // 최초 크레딧 지급 (50C, 1개월 만료)
    const { success: creditsAdded, newBalance } = await addCredits({
      userId,
      amount: SUBSCRIPTION_PLAN.credits,
      type: 'subscription',
      subscriptionId: subscription.id,
      expiresInMonths: 1,
      description: `${SUBSCRIPTION_PLAN.name} 최초 크레딧 (Google Play)`,
      supabase,
    });

    if (!creditsAdded) {
      console.error('크레딧 지급 실패');
    }

    console.log('[Google Play Subscription] 구독 생성 완료:', {
      userId,
      subscriptionId: subscription.id,
      orderId,
      credits: SUBSCRIPTION_PLAN.credits,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      credits: SUBSCRIPTION_PLAN.credits,
      newBalance,
      periodEnd: periodEnd.toISOString(),
    });
  } catch (error) {
    console.error('Google Play 구독 검증 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * Google Play 실시간 개발자 알림 (RTDN) 웹훅
 * 구독 갱신, 취소, 일시정지 등의 이벤트 처리
 *
 * 참고: 이 기능은 추후 Cloud Pub/Sub 설정 후 활성화
 */
// export async function handleRTDN(notification: GooglePlayNotification) {
//   // subscriptionNotification.notificationType:
//   // 1: SUBSCRIPTION_RECOVERED - 복구
//   // 2: SUBSCRIPTION_RENEWED - 갱신
//   // 3: SUBSCRIPTION_CANCELED - 취소
//   // 4: SUBSCRIPTION_PURCHASED - 최초 구매
//   // 5: SUBSCRIPTION_ON_HOLD - 보류
//   // 6: SUBSCRIPTION_IN_GRACE_PERIOD - 유예 기간
//   // 7: SUBSCRIPTION_RESTARTED - 재시작
//   // 12: SUBSCRIPTION_REVOKED - 취소/환불
//   // 13: SUBSCRIPTION_EXPIRED - 만료
// }
