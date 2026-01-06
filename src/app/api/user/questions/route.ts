/**
 * GET /api/user/questions
 * 사용자의 전체 질문 히스토리 조회 (v2.0)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { getSupabaseAdmin } from '@/lib/supabase/client';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

/** 질문 조인 결과 타입 */
interface QuestionWithProfile {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  profile_id: string;
  profiles: { name: string }[] | null;
}

/**
 * GET /api/user/questions
 * 모든 프로필의 질문 히스토리 조회
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      const error = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(error, { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) });
    }

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 사용자의 모든 질문 조회 (프로필 정보 포함)
    const { data: questions, error } = await supabase
      .from('report_questions')
      .select(
        `
        id,
        question,
        answer,
        created_at,
        profile_id,
        profiles:profile_id (
          name
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] 질문 조회 실패:', error);
      const errorResponse = createErrorResponse(API_ERRORS.SERVER_ERROR);
      return NextResponse.json(errorResponse, { status: getStatusCode(API_ERRORS.SERVER_ERROR) });
    }

    // 응답 형식 정리 (타입 안전하게 캐스팅)
    const questionsData = (questions || []) as QuestionWithProfile[];
    const formattedQuestions = questionsData.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      createdAt: q.created_at,
      profileId: q.profile_id,
      profileName: q.profiles?.[0]?.name || '알 수 없음',
    }));

    return NextResponse.json({
      success: true,
      data: formattedQuestions,
    });
  } catch (error) {
    console.error('[API] GET /api/user/questions 에러:', error);
    const errorResponse = createErrorResponse(API_ERRORS.SERVER_ERROR);
    return NextResponse.json(errorResponse, { status: getStatusCode(API_ERRORS.SERVER_ERROR) });
  }
}

export const dynamic = 'force-dynamic';
