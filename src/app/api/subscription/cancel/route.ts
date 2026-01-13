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

    // 3. 구독 취소 처리 (canceled_at만 설정, status는 active 유지)
    // current_period_end까지는 서비스 이용 가능
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // status는 active 유지! 기간 만료 후 cron에서 expired로 변경
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[Subscription] 취소 업데이트 오류:', updateError);
      return NextResponse.json({ error: '구독 취소에 실패했습니다' }, { status: 500 });
    }

    // 4. users 테이블은 업데이트하지 않음 (기간 만료 전까지 active 유지)

    console.log(
      `[Subscription] 구독 취소: userId=${user.id}, subscriptionId=${subscription.id}, periodEnd=${subscription.current_period_end}`
    );

    // 취소 예정 상태 반환 (status는 여전히 active지만 canceledAt이 설정됨)
    return NextResponse.json({
      success: true,
      message: '구독이 취소 예정되었습니다',
      subscription: {
        id: subscription.id,
        status: 'active', // DB 상태와 일치 (기간 만료 전까지 active 유지)
        canceledAt: new Date().toISOString(),
        periodEnd: subscription.current_period_end,
        willExpireAt: subscription.current_period_end, // 만료 예정일
      },
    });
  } catch (error) {
    console.error('[Subscription] 구독 취소 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
