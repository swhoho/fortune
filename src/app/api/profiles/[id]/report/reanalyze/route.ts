/**
 * POST /api/profiles/[id]/report/reanalyze
 * Task 23: 섹션 재분석 API (v2.1 - 비동기/폴링 방식, 5C 크레딧 차감)
 *
 * 허용된 섹션: personality, aptitude, fortune
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS, REANALYZABLE_SECTIONS } from '@/lib/stripe';
import { z } from 'zod';

/** 재분석 요청 스키마 */
const reanalyzeSchema = z.object({
  sectionType: z.enum(['personality', 'aptitude', 'fortune']),
});

/**
 * POST /api/profiles/[id]/report/reanalyze
 * 특정 섹션만 재분석 (비동기 - 즉시 반환)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 1. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = reanalyzeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 요청입니다',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { sectionType } = validationResult.data;

    // 허용된 섹션인지 확인
    if (!REANALYZABLE_SECTIONS.includes(sectionType)) {
      return NextResponse.json({ error: '재분석이 허용되지 않는 섹션입니다' }, { status: 400 });
    }

    // 2. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 3. 기존 리포트 확인
    const { data: existingReport, error: reportError } = await supabase
      .from('profile_reports')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError) {
      console.error('[API] 리포트 조회 실패:', reportError);
      return NextResponse.json({ error: '리포트 조회에 실패했습니다' }, { status: 500 });
    }

    if (!existingReport) {
      return NextResponse.json({ error: '재분석할 리포트가 없습니다' }, { status: 404 });
    }

    // 4. 크레딧 확인 및 차감 (원자적 연산)
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: SERVICE_CREDITS.sectionReanalysis,
    });

    if (creditError) {
      console.error('[API] 크레딧 차감 RPC 오류:', creditError);
      return NextResponse.json(
        { error: '크레딧 처리 중 오류가 발생했습니다', code: 'CREDIT_ERROR' },
        { status: 500 }
      );
    }

    const deductResult = creditResult?.[0];
    if (!deductResult?.success) {
      if (deductResult?.error_message === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json(
          {
            error: '크레딧이 부족합니다',
            code: 'INSUFFICIENT_CREDITS',
            required: SERVICE_CREDITS.sectionReanalysis,
            current: deductResult.new_credits,
          },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const newCredits = deductResult.new_credits;

    // 5. 재분석 로그 생성 (status: processing)
    const { data: reanalysisLog, error: logError } = await supabase
      .from('reanalysis_logs')
      .insert({
        report_id: existingReport.id,
        profile_id: profileId,
        user_id: userId,
        section_type: sectionType,
        credits_used: SERVICE_CREDITS.sectionReanalysis,
        status: 'processing',
      })
      .select('id')
      .single();

    if (logError || !reanalysisLog) {
      console.error('[API] 재분석 로그 저장 실패:', logError);
      // 크레딧 환불
      await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: -SERVICE_CREDITS.sectionReanalysis,
      });
      return NextResponse.json({ error: '재분석 시작에 실패했습니다' }, { status: 500 });
    }

    // 6. Python 백엔드에 비동기 작업 위임
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

    try {
      await fetch(`${pythonApiUrl}/api/analysis/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reanalysis_id: reanalysisLog.id,
          report_id: existingReport.id,
          profile_id: profileId,
          user_id: userId,
          section_type: sectionType,
          pillars: existingReport.pillars,
          daewun: existingReport.daewun || [],
          jijanggan: existingReport.jijanggan,
          existing_analysis: existingReport.analysis || {},
          language: 'ko',
        }),
      });
    } catch (pythonError) {
      console.error('[API] Python 백엔드 호출 실패:', pythonError);
      // Python 호출 실패해도 DB에는 저장되어 있으므로 진행
    }

    console.log('[API] 섹션 재분석 시작:', {
      profileId,
      sectionType,
      reanalysisId: reanalysisLog.id,
    });

    // 7. 즉시 응답 (폴링 URL 제공)
    return NextResponse.json({
      success: true,
      data: {
        reanalysisId: reanalysisLog.id,
        sectionType,
        status: 'processing',
        pollUrl: `/api/profiles/${profileId}/report/reanalyze/${reanalysisLog.id}`,
        creditsUsed: SERVICE_CREDITS.sectionReanalysis,
        remainingCredits: newCredits,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/profiles/[id]/report/reanalyze 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
