/**
 * Google Play 구매 검증 API
 * POST /api/payment/google/verify
 *
 * Capacitor Android 앱에서 Google Play 결제 후 검증 요청
 */
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// 상품별 크레딧 매핑
const CREDIT_AMOUNTS: Record<string, number> = {
  credits_30: 30,
  credits_50: 50,
  credits_100: 110, // 100 + 10 보너스
  credits_200: 230, // 200 + 30 보너스
};

// Supabase 서비스 롤 클라이언트
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Google Play Developer API 클라이언트
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

    // 크레딧 수량 확인
    const creditsToAdd = CREDIT_AMOUNTS[productId];
    if (!creditsToAdd) {
      return NextResponse.json({ error: '유효하지 않은 상품입니다' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 중복 검증 확인
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', purchaseToken) // purchaseToken을 고유 ID로 사용
      .single();

    if (existingPurchase) {
      return NextResponse.json({ error: '이미 처리된 구매입니다' }, { status: 400 });
    }

    // Google Play Developer API로 구매 검증
    try {
      const androidPublisher = await getAndroidPublisher();
      const packageName = 'app.fortune30.saju';

      const purchaseResult = await androidPublisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });

      // 구매 상태 확인 (0 = purchased, 1 = canceled)
      if (purchaseResult.data.purchaseState !== 0) {
        return NextResponse.json({ error: '구매가 완료되지 않았습니다' }, { status: 400 });
      }

      // 구매 승인 (acknowledge)
      if (!purchaseResult.data.acknowledgementState) {
        await androidPublisher.purchases.products.acknowledge({
          packageName,
          productId,
          token: purchaseToken,
        });
      }

      // 상품 소비 (consume) - 소모성 상품 재구매 가능하게 함
      // Google Play에서 일회성 상품은 consume 처리해야 동일 상품 재구매 가능
      await androidPublisher.purchases.products.consume({
        packageName,
        productId,
        token: purchaseToken,
      });
    } catch (googleError) {
      console.error('Google Play API 오류:', googleError);

      // 개발 환경에서는 Google API 없이도 테스트 가능
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Google Play 검증 실패' }, { status: 400 });
      }
      console.warn('개발 환경: Google Play 검증 스킵');
    }

    // 구매 기록 저장
    const { error: insertError } = await supabase.from('purchases').insert({
      user_id: userId,
      amount: 0, // Google Play에서 직접 처리
      credits: creditsToAdd,
      stripe_session_id: purchaseToken, // purchaseToken을 고유 ID로 저장
      status: 'completed',
      payment_method: 'google_play',
    });

    if (insertError) {
      console.error('구매 기록 저장 실패:', insertError);
      return NextResponse.json({ error: '구매 기록 저장 실패' }, { status: 500 });
    }

    // 사용자 크레딧 업데이트
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('사용자 조회 실패:', userError);
      return NextResponse.json({ error: '사용자 조회 실패' }, { status: 500 });
    }

    const newCredits = (userData?.credits || 0) + creditsToAdd;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('크레딧 업데이트 실패:', updateError);
      return NextResponse.json({ error: '크레딧 업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credits: creditsToAdd,
      newBalance: newCredits,
      orderId,
    });
  } catch (error) {
    console.error('Google Play 검증 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
