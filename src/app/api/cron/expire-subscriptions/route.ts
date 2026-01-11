/**
 * GET /api/cron/expire-subscriptions
 * 만료된 구독 처리 Cron Job
 *
 * Vercel Cron: 매일 자정 실행 (UTC 00:00 = KST 09:00)
 *
 * 처리 내용:
 * 1. 만료된 active 구독 조회 (current_period_end < NOW())
 * 2. status를 'expired'로 변경
 * 3. users.subscription_status 업데이트
 *
 * 참고: Mock 모드에서는 자동 갱신 없음
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // 1. Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 로컬 개발 환경에서는 허용
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = getSupabaseAdmin();

    // 2. 만료된 active 구독 조회
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString());

    if (fetchError) {
      console.error('[CronExpireSubscriptions] 조회 오류:', fetchError);
      return NextResponse.json({ error: '만료 구독 조회 실패' }, { status: 500 });
    }

    if (!expiredSubscriptions?.length) {
      return NextResponse.json({
        success: true,
        message: '만료된 구독 없음',
        processed: 0,
      });
    }

    console.log(`[CronExpireSubscriptions] 만료 구독 ${expiredSubscriptions.length}개 발견`);

    // 3. 각 구독 처리
    let processedCount = 0;
    for (const subscription of expiredSubscriptions) {
      // 3.1 구독 status 업데이트
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error(
          `[CronExpireSubscriptions] 구독 업데이트 실패: subscriptionId=${subscription.id}`,
          updateError
        );
        continue;
      }

      // 3.2 users.subscription_status 업데이트
      await supabase
        .from('users')
        .update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.user_id);

      processedCount++;
      console.log(
        `[CronExpireSubscriptions] 구독 만료: subscriptionId=${subscription.id}, userId=${subscription.user_id}`
      );
    }

    return NextResponse.json({
      success: true,
      message: '구독 만료 처리 완료',
      processed: processedCount,
    });
  } catch (error) {
    console.error('[CronExpireSubscriptions] 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
