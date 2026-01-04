/**
 * GET /api/analysis/yearly/:id
 * 신년 분석 결과 조회 API
 * Task 20: 특정 연도에 대한 월별 상세 운세 분석 결과 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/analysis/yearly/:id
 * 신년 분석 결과 조회
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const analysisId = params.id;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 신년 분석 결과 조회 (권한 확인 포함)
    const { data: analysis, error: analysisError } = await supabase
      .from('yearly_analyses')
      .select(
        `
        id,
        target_year,
        pillars,
        daewun,
        current_daewun,
        gender,
        analysis,
        language,
        credits_used,
        existing_analysis_id,
        created_at
      `
      )
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      console.error('[API] 신년 분석 조회 실패:', analysisError);
      return NextResponse.json({ error: '신년 분석 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        targetYear: analysis.target_year,
        pillars: analysis.pillars,
        daewun: analysis.daewun,
        currentDaewun: analysis.current_daewun,
        gender: analysis.gender,
        analysis: analysis.analysis,
        language: analysis.language,
        creditsUsed: analysis.credits_used,
        existingAnalysisId: analysis.existing_analysis_id,
        createdAt: analysis.created_at,
      },
    });
  } catch (error) {
    console.error('[API] /api/analysis/yearly/:id 에러:', error);
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
