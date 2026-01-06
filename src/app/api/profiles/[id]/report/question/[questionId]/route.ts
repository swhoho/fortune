/**
 * GET /api/profiles/:id/report/question/:questionId
 * 후속 질문 상태 폴링 엔드포인트
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

/**
 * GET /api/profiles/:id/report/question/:questionId
 * 특정 질문의 상태 및 결과 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const { id: profileId, questionId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.NOT_FOUND), {
        status: getStatusCode(PROFILE_ERRORS.NOT_FOUND),
      });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.FORBIDDEN), {
        status: getStatusCode(AUTH_ERRORS.FORBIDDEN),
      });
    }

    // 3. 질문 레코드 조회
    const { data: question, error: questionError } = await supabase
      .from('report_questions')
      .select('id, question, answer, status, error_message, created_at')
      .eq('id', questionId)
      .eq('profile_id', profileId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
        status: getStatusCode(API_ERRORS.NOT_FOUND),
      });
    }

    // 4. 상태에 따른 응답
    return NextResponse.json({
      success: true,
      data: {
        questionId: question.id,
        question: question.question,
        status: question.status, // generating | completed | failed
        answer: question.status === 'completed' ? question.answer : null,
        error: question.status === 'failed' ? question.error_message : null,
        createdAt: question.created_at,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/:id/report/question/:questionId 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
