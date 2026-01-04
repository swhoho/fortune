/**
 * POST /api/profiles/[id]/report/reanalyze
 * Task 23: 섹션 재분석 API (5C 크레딧 차감)
 *
 * 허용된 섹션: personality, aptitude, fortune
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS, REANALYZABLE_SECTIONS } from '@/lib/stripe';
import { logAiUsage } from '@/lib/ai/usage-logger';
import { z } from 'zod';

/** 재분석 요청 스키마 */
const reanalyzeSchema = z.object({
  sectionType: z.enum(['personality', 'aptitude', 'fortune']),
});

/**
 * POST /api/profiles/[id]/report/reanalyze
 * 특정 섹션만 재분석 (5C 차감)
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

    // 4. 크레딧 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    if (userData.credits < SERVICE_CREDITS.sectionReanalysis) {
      return NextResponse.json(
        {
          error: '크레딧이 부족합니다',
          code: 'INSUFFICIENT_CREDITS',
          required: SERVICE_CREDITS.sectionReanalysis,
          current: userData.credits,
        },
        { status: 402 }
      );
    }

    // 5. 크레딧 차감
    const newCredits = userData.credits - SERVICE_CREDITS.sectionReanalysis;
    await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // 6. 섹션 재분석 실행
    const { sectionResult: newSectionResult, tokenUsage } = await reanalyzeSectionAsync(
      sectionType,
      existingReport
    );

    // 7. 리포트 업데이트
    const updatedAnalysis = {
      ...(existingReport.analysis || {}),
      [sectionType]: newSectionResult,
    };

    await supabase
      .from('profile_reports')
      .update({
        analysis: updatedAnalysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingReport.id);

    // 8. 재분석 이력 기록
    await supabase.from('reanalysis_logs').insert({
      report_id: existingReport.id,
      profile_id: profileId,
      user_id: userId,
      section_type: sectionType,
      credits_used: SERVICE_CREDITS.sectionReanalysis,
    });

    // 9. AI 사용량 로깅
    if (tokenUsage) {
      await logAiUsage({
        userId,
        featureType: 'section_reanalysis',
        creditsUsed: SERVICE_CREDITS.sectionReanalysis,
        inputTokens: tokenUsage.inputTokens,
        outputTokens: tokenUsage.outputTokens,
        model: 'gemini-3-pro-preview',
        profileId,
        reportId: existingReport.id as string,
        metadata: { sectionType },
      });
    }

    console.log('[API] 섹션 재분석 완료:', {
      profileId,
      sectionType,
      creditsUsed: SERVICE_CREDITS.sectionReanalysis,
    });

    return NextResponse.json({
      success: true,
      sectionType,
      newResult: newSectionResult,
      creditsUsed: SERVICE_CREDITS.sectionReanalysis,
      remainingCredits: newCredits,
    });
  } catch (error) {
    console.error('[API] POST /api/profiles/[id]/report/reanalyze 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 섹션 재분석 실행 (실제 AI 파이프라인)
 */
async function reanalyzeSectionAsync(
  sectionType: string,
  existingReport: Record<string, unknown>
): Promise<{
  sectionResult: Record<string, unknown>;
  tokenUsage?: { inputTokens: number; outputTokens: number };
}> {
  const { createAnalysisPipeline } = await import('@/lib/ai/pipeline');
  // const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

  // 기존 만세력 데이터 사용
  const pillars = existingReport.pillars as Record<string, unknown>;
  const daewun = existingReport.daewun as unknown[];
  const jijanggan = existingReport.jijanggan as Record<string, unknown>;
  const analysis = existingReport.analysis as Record<string, unknown>;

  if (!pillars) {
    throw new Error('만세력 데이터가 없습니다');
  }

  // 파이프라인 생성
  const pipeline = createAnalysisPipeline({
    enableParallel: false, // 단일 단계만 실행하므로 병렬 불필요
    retryCount: 1,
  });

  // 이전 결과 복원
  pipeline.hydrate(
    {
      manseryeok: {
        pillars: pillars as unknown as import('@/lib/ai/types').SajuPillarsData,
        daewun: daewun as unknown as import('@/lib/ai/types').DaewunData[],
        jijanggan: jijanggan as unknown as import('@/lib/ai/types').JijangganData,
      },
      basicAnalysis:
        analysis?.basicAnalysis as unknown as import('@/lib/ai/types').BasicAnalysisResult,
      personality:
        sectionType !== 'personality'
          ? (analysis?.personality as unknown as import('@/lib/ai/types').PersonalityResult)
          : undefined,
      aptitude:
        sectionType !== 'aptitude'
          ? (analysis?.aptitude as unknown as import('@/lib/ai/types').AptitudeResult)
          : undefined,
      fortune:
        sectionType !== 'fortune'
          ? (analysis?.fortune as unknown as import('@/lib/ai/types').FortuneResult)
          : undefined,
    },
    sectionType as import('@/lib/ai/types').PipelineStep
  );

  // 해당 단계만 재실행
  const result = await pipeline.executeFromStep(
    {
      pillars: pillars as unknown as import('@/lib/ai/types').SajuPillarsData,
      daewun: daewun as unknown as import('@/lib/ai/types').DaewunData[],
      language: 'ko',
    },
    sectionType as import('@/lib/ai/types').PipelineStep
  );

  if (!result.success) {
    throw new Error(result.error?.message || '재분석 실패');
  }

  // 해당 섹션의 새 결과 반환
  const newSectionResult =
    result.data?.intermediateResults?.[sectionType as keyof typeof result.data.intermediateResults];

  // 토큰 사용량 추출
  const tokenUsage = result.data?.pipelineMetadata?.tokenUsage;

  return {
    sectionResult: {
      ...(newSectionResult as Record<string, unknown>),
      reanalyzed: true,
      reanalyzedAt: new Date().toISOString(),
    },
    tokenUsage: tokenUsage
      ? { inputTokens: tokenUsage.inputTokens, outputTokens: tokenUsage.outputTokens }
      : undefined,
  };
}

export const dynamic = 'force-dynamic';
