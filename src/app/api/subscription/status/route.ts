/**
 * GET /api/subscription/status
 * 현재 구독 상태 조회 API
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 활성 또는 대기 중인 구독 조회 (active, past_due)
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: 결과 없음 (정상)
      console.error('[Subscription] 조회 오류:', error);
      return NextResponse.json({ error: '구독 조회에 실패했습니다' }, { status: 500 });
    }

    // 3. 구독 없음
    if (!subscription) {
      return NextResponse.json({
        active: false,
        subscription: null,
      });
    }

    // 4. 구독 만료 여부 체크
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const isExpired = periodEnd < now;

    if (isExpired) {
      // 만료된 구독은 status 업데이트 (Cron Job에서도 처리하지만 실시간 체크)
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      await supabase
        .from('users')
        .update({ subscription_status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      return NextResponse.json({
        active: false,
        subscription: {
          ...subscription,
          status: 'expired',
        },
      });
    }

    // 5. 활성 구독 반환
    return NextResponse.json({
      active: subscription.status === 'active',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        periodStart: subscription.current_period_start,
        periodEnd: subscription.current_period_end,
        price: subscription.price,
        createdAt: subscription.created_at,
        canceledAt: subscription.canceled_at,
        payappRebillNo: subscription.payapp_rebill_no,
      },
    });
  } catch (error) {
    console.error('[Subscription] 상태 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
