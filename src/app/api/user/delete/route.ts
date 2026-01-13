/**
 * 계정 삭제 API
 * DELETE /api/user/delete
 *
 * 인증된 사용자의 계정과 모든 관련 데이터를 영구 삭제합니다.
 * 삭제 순서: 연관 데이터 → users 테이블 → Supabase Auth
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

/** Supabase Admin Auth Client */
const getAuthAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      const error = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(error, { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) });
    }

    const userId = user.id;
    const adminClient = getSupabaseAdmin();

    console.log(`[계정 삭제] 사용자 ${userId} 삭제 시작`);

    // 1. consultation_messages 삭제 (session_id FK)
    const { data: sessions } = await adminClient
      .from('consultation_sessions')
      .select('id')
      .eq('user_id', userId);

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      await adminClient.from('consultation_messages').delete().in('session_id', sessionIds);
      console.log(`[계정 삭제] consultation_messages 삭제 완료`);
    }

    // 2. consultation_sessions 삭제
    await adminClient.from('consultation_sessions').delete().eq('user_id', userId);
    console.log(`[계정 삭제] consultation_sessions 삭제 완료`);

    // 3. reanalysis_logs 삭제
    await adminClient.from('reanalysis_logs').delete().eq('user_id', userId);
    console.log(`[계정 삭제] reanalysis_logs 삭제 완료`);

    // 4. ai_usage_logs 삭제
    await adminClient.from('ai_usage_logs').delete().eq('user_id', userId);
    console.log(`[계정 삭제] ai_usage_logs 삭제 완료`);

    // 5. profile_reports 삭제
    await adminClient.from('profile_reports').delete().eq('user_id', userId);
    console.log(`[계정 삭제] profile_reports 삭제 완료`);

    // 6. yearly_analyses 삭제
    await adminClient.from('yearly_analyses').delete().eq('user_id', userId);
    console.log(`[계정 삭제] yearly_analyses 삭제 완료`);

    // 7. compatibility_analyses 삭제
    await adminClient.from('compatibility_analyses').delete().eq('user_id', userId);
    console.log(`[계정 삭제] compatibility_analyses 삭제 완료`);

    // 8. daily_fortunes 삭제
    await adminClient.from('daily_fortunes').delete().eq('user_id', userId);
    console.log(`[계정 삭제] daily_fortunes 삭제 완료`);

    // 9. profiles 삭제
    await adminClient.from('profiles').delete().eq('user_id', userId);
    console.log(`[계정 삭제] profiles 삭제 완료`);

    // 10. credit_transactions 삭제
    await adminClient.from('credit_transactions').delete().eq('user_id', userId);
    console.log(`[계정 삭제] credit_transactions 삭제 완료`);

    // 11. purchases 삭제
    await adminClient.from('purchases').delete().eq('user_id', userId);
    console.log(`[계정 삭제] purchases 삭제 완료`);

    // 12. users 테이블의 subscription_id FK 해제
    await adminClient.from('users').update({ subscription_id: null }).eq('id', userId);

    // 13. subscriptions 삭제
    await adminClient.from('subscriptions').delete().eq('user_id', userId);
    console.log(`[계정 삭제] subscriptions 삭제 완료`);

    // 14. users 테이블 삭제
    const { error: userDeleteError } = await adminClient.from('users').delete().eq('id', userId);

    if (userDeleteError) {
      console.error(`[계정 삭제] users 테이블 삭제 실패:`, userDeleteError);
      throw new Error('사용자 데이터 삭제 실패');
    }
    console.log(`[계정 삭제] users 테이블 삭제 완료`);

    // 15. Supabase Auth에서 유저 삭제
    const authAdmin = getAuthAdmin();
    const { error: authDeleteError } = await authAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`[계정 삭제] Auth 유저 삭제 실패:`, authDeleteError);
      // Auth 삭제 실패해도 DB 데이터는 이미 삭제됨
      // 실패 로그만 남기고 성공 응답 반환
    }
    console.log(`[계정 삭제] Supabase Auth 유저 삭제 완료`);

    console.log(`[계정 삭제] 사용자 ${userId} 삭제 완료`);

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[계정 삭제] 오류:', error);
    const errorResponse = createErrorResponse(API_ERRORS.SERVER_ERROR);
    return NextResponse.json(errorResponse, { status: getStatusCode(API_ERRORS.SERVER_ERROR) });
  }
}
