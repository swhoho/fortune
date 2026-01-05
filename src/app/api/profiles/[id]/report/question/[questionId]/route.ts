/**
 * GET /api/profiles/:id/report/question/:questionId
 * 후속 질문 상태 폴링 엔드포인트
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

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
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 3. 질문 레코드 조회
    const { data: question, error: questionError } = await supabase
      .from('report_questions')
      .select('id, question, answer, status, error_message, created_at')
      .eq('id', questionId)
      .eq('profile_id', profileId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: '질문을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
