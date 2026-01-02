/**
 * 사용자 질문 기록 조회 API
 * GET /api/user/questions
 *
 * 인증된 사용자의 모든 질문 기록을 분석별로 그룹화하여 반환합니다.
 * 쿼리 파라미터:
 * - search: 질문/답변 검색어
 * - analysisId: 특정 분석의 질문만 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/** 질문 기록 조회 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const analysisId = searchParams.get('analysisId');

    const supabase = getSupabaseAdmin();

    // 먼저 사용자의 분석 ID 목록 조회
    const { data: userAnalyses, error: analysesError } = await supabase
      .from('analyses')
      .select('id, type, focus_area, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (analysesError) {
      console.error('분석 조회 실패:', analysesError);
      return NextResponse.json({ error: '분석 기록을 불러올 수 없습니다' }, { status: 500 });
    }

    if (!userAnalyses || userAnalyses.length === 0) {
      return NextResponse.json({ questions: [], groupedByAnalysis: [] });
    }

    // 분석 ID 필터링
    let analysisIds = userAnalyses.map((a) => a.id);
    if (analysisId) {
      if (!analysisIds.includes(analysisId)) {
        return NextResponse.json({ error: '해당 분석에 접근할 권한이 없습니다' }, { status: 403 });
      }
      analysisIds = [analysisId];
    }

    // 질문 조회 쿼리 구성
    let query = supabase
      .from('questions')
      .select('id, analysis_id, question, answer, credits_used, created_at')
      .in('analysis_id', analysisIds)
      .order('created_at', { ascending: false });

    // 검색어 필터 (ilike를 사용한 부분 문자열 매칭)
    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('질문 조회 실패:', questionsError);
      return NextResponse.json({ error: '질문 기록을 불러올 수 없습니다' }, { status: 500 });
    }

    // 분석별로 그룹화
    const analysisMap = new Map(
      userAnalyses.map((a) => [
        a.id,
        {
          id: a.id,
          type: a.type,
          focusArea: a.focus_area,
          createdAt: a.created_at,
        },
      ])
    );

    const groupedByAnalysis = userAnalyses
      .filter((a) => (analysisId ? a.id === analysisId : true))
      .map((analysis) => ({
        analysis: {
          id: analysis.id,
          type: analysis.type,
          focusArea: analysis.focus_area,
          createdAt: analysis.created_at,
        },
        questions: (questions || [])
          .filter((q) => q.analysis_id === analysis.id)
          .map((q) => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            creditsUsed: q.credits_used,
            createdAt: q.created_at,
          })),
      }))
      .filter((group) => group.questions.length > 0 || analysisId);

    // 전체 질문 목록 (플랫하게)
    const allQuestions = (questions || []).map((q) => ({
      id: q.id,
      analysisId: q.analysis_id,
      analysis: analysisMap.get(q.analysis_id),
      question: q.question,
      answer: q.answer,
      creditsUsed: q.credits_used,
      createdAt: q.created_at,
    }));

    return NextResponse.json({
      questions: allQuestions,
      groupedByAnalysis,
      totalCount: allQuestions.length,
    });
  } catch (error) {
    console.error('질문 기록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
