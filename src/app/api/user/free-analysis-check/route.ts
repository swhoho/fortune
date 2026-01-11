/**
 * Free Analysis Check API
 * GET /api/user/free-analysis-check - 최초 무료 분석 자격 확인
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

/**
 * GET /api/user/free-analysis-check
 * 사용자의 최초 무료 분석 자격 확인
 * 응답: { eligible: boolean }
 */
export async function GET() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const supabase = getSupabaseAdmin();

    // 2. users.first_free_used 확인
    const { data: userData, error } = await supabase
      .from('users')
      .select('first_free_used')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[API] 사용자 조회 실패:', error);
      return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
        status: getStatusCode(API_ERRORS.SERVER_ERROR),
      });
    }

    // 3. 무료 분석 자격: first_free_used가 false면 자격 있음
    const eligible = userData?.first_free_used === false;

    return NextResponse.json({
      success: true,
      eligible,
    });
  } catch (error) {
    console.error('[API] /api/user/free-analysis-check GET 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
