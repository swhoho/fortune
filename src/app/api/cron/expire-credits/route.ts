/**
 * GET /api/cron/expire-credits
 * 만료된 크레딧 처리 Cron Job
 *
 * Vercel Cron: 매일 자정 실행 (UTC 00:00 = KST 09:00)
 *
 * 처리 내용:
 * 1. 만료된 크레딧 조회 (expires_at < NOW() AND remaining > 0)
 * 2. 각 트랜잭션의 remaining을 0으로 설정
 * 3. expiry 타입 트랜잭션 기록 추가
 * 4. users.credits 동기화
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

    // 2. 만료된 크레딧 조회
    const { data: expiredCredits, error: fetchError } = await supabase
      .from('credit_transactions')
      .select('id, user_id, remaining')
      .gt('remaining', 0)
      .lt('expires_at', new Date().toISOString())
      .in('type', ['purchase', 'subscription', 'bonus', 'refund']);

    if (fetchError) {
      console.error('[CronExpireCredits] 조회 오류:', fetchError);
      return NextResponse.json({ error: '만료 크레딧 조회 실패' }, { status: 500 });
    }

    if (!expiredCredits?.length) {
      return NextResponse.json({
        success: true,
        message: '만료된 크레딧 없음',
        processed: 0,
      });
    }

    console.log(`[CronExpireCredits] 만료 크레딧 ${expiredCredits.length}개 발견`);

    // 3. 사용자별 그룹핑
    const userExpiries = new Map<string, { ids: string[]; total: number }>();
    for (const credit of expiredCredits) {
      const existing = userExpiries.get(credit.user_id) || { ids: [], total: 0 };
      existing.ids.push(credit.id);
      existing.total += credit.remaining;
      userExpiries.set(credit.user_id, existing);
    }

    // 4. 각 사용자별 처리
    let processedCount = 0;
    for (const [userId, { ids, total }] of Array.from(userExpiries.entries())) {
      // 4.1 remaining을 0으로 설정
      const { error: updateError } = await supabase
        .from('credit_transactions')
        .update({ remaining: 0 })
        .in('id', ids);

      if (updateError) {
        console.error(`[CronExpireCredits] 크레딧 업데이트 실패: userId=${userId}`, updateError);
        continue;
      }

      // 4.2 현재 사용 가능한 크레딧 계산
      const { data: available } = await supabase
        .from('credit_transactions')
        .select('remaining')
        .eq('user_id', userId)
        .gt('remaining', 0)
        .in('type', ['purchase', 'subscription', 'bonus', 'refund'])
        .or('expires_at.is.null,expires_at.gt.now()');

      const newBalance = available?.reduce((sum, c) => sum + c.remaining, 0) || 0;

      // 4.3 만료 기록 추가
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        type: 'expiry',
        amount: -total,
        balance_after: newBalance,
        description: `크레딧 만료 (${ids.length}건, ${total}C)`,
      });

      // 4.4 users.credits 동기화
      await supabase
        .from('users')
        .update({ credits: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);

      processedCount += ids.length;
      console.log(`[CronExpireCredits] userId=${userId}: ${total}C 만료, 새 잔액: ${newBalance}C`);
    }

    return NextResponse.json({
      success: true,
      message: `크레딧 만료 처리 완료`,
      processed: processedCount,
      users: userExpiries.size,
    });
  } catch (error) {
    console.error('[CronExpireCredits] 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
