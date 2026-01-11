/**
 * POST /api/subscription/cancel
 * 구독 취소 API (Mock - 즉시 취소)
 *
 * 실제 구현 시에는 기간 종료까지 유지해야 하지만,
 * Mock에서는 즉시 만료 처리
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

    // 3. 구독 취소 처리
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

    // 4. users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    console.log(`[Subscription] 구독 취소: userId=${user.id}, subscriptionId=${subscription.id}`);

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다 (테스트 모드)',
      subscription: {
        id: subscription.id,
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        // 실제 구현에서는 기간 종료까지 유지
        // periodEnd: subscription.current_period_end,
      },
    });
  } catch (error) {
    console.error('[Subscription] 구독 취소 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
