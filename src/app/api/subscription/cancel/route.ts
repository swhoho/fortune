/**
 * POST /api/subscription/cancel
 * 구독 취소 API
 *
 * 취소 시 다음 결제만 취소하고, current_period_end까지는 혜택 유지
 * - status: 'canceled'로 변경
 * - canceled_at: 취소 시점 기록
 * - current_period_end까지는 서비스 이용 가능
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 활성 구독 조회
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json({ error: '활성 구독이 없습니다' }, { status: 400 });
    }

    // 3. 구독 취소 처리 (status: 'canceled', 기간 종료까지 유지)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Subscription] 취소 업데이트 오류:', updateError);
      return NextResponse.json({ error: '구독 취소에 실패했습니다' }, { status: 500 });
    }

    // 4. users 테이블 구독 상태 업데이트 (canceled = 취소 예정, 기간 종료 시 expired)
    await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    console.log(
      `[Subscription] 구독 취소: userId=${user.id}, subscriptionId=${subscription.id}, periodEnd=${subscription.current_period_end}`
    );

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다',
      subscription: {
        id: subscription.id,
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        periodEnd: subscription.current_period_end,
      },
    });
  } catch (error) {
    console.error('[Subscription] 구독 취소 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
