/**
 * GET /api/analysis/:id
 * 분석 결과 조회 API
 * Task 16: 후속 질문을 위한 분석 데이터 + 질문 히스토리 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/analysis/:id
 * 분석 결과 및 관련 질문 히스토리 조회
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const analysisId = params.id;
    const userId = session.user.id;
    const supabase = getSupabaseAdmin();

    // 2. 분석 결과 조회 (권한 확인 포함)
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select(
        `
        id,
        type,
        birth_datetime,
        timezone,
        is_lunar,
        gender,
        question,
        focus_area,
        pillars,
        daewun,
        analysis,
        pillar_card_url,
        credits_used,
        created_at
      `
      )
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      console.error('[API] 분석 조회 실패:', analysisError);
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    // 3. 관련 질문 히스토리 조회
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(
        `
        id,
        question,
        answer,
        credits_used,
        created_at
      `
      )
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.warn('[API] 질문 조회 실패:', questionsError);
      // 질문 조회 실패해도 분석 결과는 반환
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        type: analysis.type,
        birthDatetime: analysis.birth_datetime,
        timezone: analysis.timezone,
        isLunar: analysis.is_lunar,
        gender: analysis.gender,
        initialQuestion: analysis.question,
        focusArea: analysis.focus_area,
        pillars: analysis.pillars,
        daewun: analysis.daewun,
        analysis: analysis.analysis,
        pillarImage: analysis.pillar_card_url,
        creditsUsed: analysis.credits_used,
        createdAt: analysis.created_at,
        questions: questions || [],
      },
    });
  } catch (error) {
    console.error('[API] /api/analysis/:id 에러:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
