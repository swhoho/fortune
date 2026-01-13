/**
 * POST /api/subscription/start
 * 구독 시작 API (Mock - 결제 없이 즉시 활성화)
 *
 * 혜택:
 * - 오늘의 운세 접근권
 * - 월 50C 크레딧 지급 (1개월 만료)
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { addCredits } from '@/lib/credits';

/** 구독 가격 (KRW) */
const SUBSCRIPTION_PRICE = 2900;

/** 월간 지급 크레딧 */
const MONTHLY_CREDITS = 50;

export async function POST() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 이미 구독 중인지 확인
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_start, current_period_end, price')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      // 이미 구독 중이면 에러 대신 성공으로 반환 (크레딧 추가 지급 없음)
      return NextResponse.json({
        success: true,
        subscription: {
          id: existingSub.id,
          status: 'active',
          periodStart: existingSub.current_period_start,
          periodEnd: existingSub.current_period_end,
          price: existingSub.price,
        },
        alreadySubscribed: true,
        creditsAdded: 0,
        message: '이미 구독 중입니다',
      });
    }

    // 3. 구독 기간 계산 (1개월)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // 4. 구독 레코드 생성
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        price: SUBSCRIPTION_PRICE,
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('[Subscription] 구독 생성 실패:', subError);
      return NextResponse.json({ error: '구독 생성에 실패했습니다' }, { status: 500 });
    }

    // 5. 월 50C 크레딧 지급 (1개월 만료)
    const { success: creditsAdded, newBalance } = await addCredits({
      userId: user.id,
      amount: MONTHLY_CREDITS,
      type: 'subscription',
      subscriptionId: subscription.id,
      expiresInMonths: 1,
      description: '구독 월간 크레딧',
      supabase,
    });

    if (!creditsAdded) {
      console.error('[Subscription] 크레딧 지급 실패');
      // 구독 삭제 롤백
      await supabase.from('subscriptions').delete().eq('id', subscription.id);
      return NextResponse.json({ error: '크레딧 지급에 실패했습니다' }, { status: 500 });
    }

    // 6. users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    console.log(`[Subscription] 구독 시작: userId=${user.id}, subscriptionId=${subscription.id}`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: 'active',
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        price: SUBSCRIPTION_PRICE,
      },
      creditsAdded: MONTHLY_CREDITS,
      newBalance,
      message: '구독이 시작되었습니다 (테스트 모드)',
    });
  } catch (error) {
    console.error('[Subscription] 구독 시작 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
