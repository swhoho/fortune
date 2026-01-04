/**
 * /api/profiles/[id]/report API
 * Task 22-23: 리포트 생성 및 조회
 *
 * POST: 리포트 생성 시작 (50C 크레딧 차감)
 * GET: 완료된 리포트 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS } from '@/lib/stripe';
import { logAiUsage } from '@/lib/ai/usage-logger';
import { z } from 'zod';

/** 리포트 생성 요청 스키마 */
const generateReportSchema = z.object({
  retryFromStep: z.string().optional(),
});

/**
 * GET /api/profiles/[id]/report
 * 완료된 리포트 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 1. 프로필 소유권 확인
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

    // 2. 리포트 조회
    const { data: report, error: reportError } = await supabase
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

    if (!report) {
      return NextResponse.json({ error: '리포트가 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/[id]/report 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * POST /api/profiles/[id]/report
 * 리포트 생성 시작 (백그라운드 작업)
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

    // 요청 본문 파싱
    let body = {};
    try {
      body = await request.json();
    } catch {
      // 빈 본문 허용
    }

    const validationResult = generateReportSchema.safeParse(body);
    const retryFromStep = validationResult.success
      ? validationResult.data.retryFromStep
      : undefined;

    // 1. 프로필 조회 및 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 2. 이미 진행 중인 리포트가 있는지 확인
    const { data: existingReport } = await supabase
      .from('profile_reports')
      .select('id, status')
      .eq('profile_id', profileId)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle();

    if (existingReport && !retryFromStep) {
      return NextResponse.json({
        success: true,
        message: '이미 리포트 생성이 진행 중입니다',
        reportId: existingReport.id,
        pollUrl: `/api/profiles/${profileId}/report/status`,
      });
    }

    // 3. 크레딧 확인 (재시도가 아닌 경우에만)
    if (!retryFromStep) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
      }

      if (user.credits < SERVICE_CREDITS.profileReport) {
        return NextResponse.json(
          {
            error: '크레딧이 부족합니다',
            code: 'INSUFFICIENT_CREDITS',
            required: SERVICE_CREDITS.profileReport,
            current: user.credits,
          },
          { status: 402 }
        );
      }

      // 4. 크레딧 차감
      const newCredits = user.credits - SERVICE_CREDITS.profileReport;
      await supabase
        .from('users')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // 5. 리포트 레코드 생성/업데이트
    let reportId: string;

    if (retryFromStep && existingReport) {
      // 재시도: 기존 레코드 상태 업데이트
      reportId = existingReport.id;
      await supabase
        .from('profile_reports')
        .update({
          status: 'pending',
          current_step: retryFromStep,
          error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    } else {
      // 신규 생성
      const { data: newReport, error: insertError } = await supabase
        .from('profile_reports')
        .insert({
          profile_id: profileId,
          user_id: userId,
          status: 'pending',
          current_step: 'manseryeok',
          progress_percent: 0,
          step_statuses: {
            manseryeok: 'pending',
            jijanggan: 'pending',
            basic_analysis: 'pending',
            personality: 'pending',
            aptitude: 'pending',
            fortune: 'pending',
            scoring: 'pending',
            visualization: 'pending',
            saving: 'pending',
          },
          credits_used: SERVICE_CREDITS.profileReport,
        })
        .select('id')
        .single();

      if (insertError || !newReport) {
        console.error('[API] 리포트 생성 실패:', insertError);
        return NextResponse.json({ error: '리포트 생성에 실패했습니다' }, { status: 500 });
      }

      reportId = newReport.id;
    }

    // 6. 파이프라인 동기 실행 (Vercel Serverless에서 완료 대기)
    await startPipelineAsync(supabase, reportId, profile, retryFromStep);

    return NextResponse.json({
      success: true,
      message: '리포트 생성이 완료되었습니다',
      reportId,
      pollUrl: `/api/profiles/${profileId}/report/status`,
    });
  } catch (error) {
    console.error('[API] POST /api/profiles/[id]/report 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 백그라운드 파이프라인 실행 (비동기)
 * 실제 AnalysisPipeline 클래스 사용
 */
async function startPipelineAsync(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reportId: string,
  profile: Record<string, unknown>,
  retryFromStep?: string
) {
  // 비동기로 실행 (응답 차단 안함)
  (async () => {
    const { createAnalysisPipeline } = await import('@/lib/ai/pipeline');
    // PYTHON_API_URL에 프로토콜 없으면 https:// 자동 추가
    let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    if (
      pythonApiUrl &&
      !pythonApiUrl.startsWith('http://') &&
      !pythonApiUrl.startsWith('https://')
    ) {
      pythonApiUrl = `https://${pythonApiUrl}`;
    }

    try {
      // 1. 프로필에서 만세력 계산 (Python API)
      const birthDate = new Date(profile.birth_date as string);
      const birthTime = (profile.birth_time as string) || '12:00';
      const [hour, minute] = birthTime.split(':').map(Number);
      birthDate.setHours(hour || 12, minute || 0, 0, 0);

      const manseryeokRes = await fetch(`${pythonApiUrl}/api/manseryeok/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDatetime: birthDate.toISOString(),
          timezone: 'GMT+9',
          isLunar: profile.calendar_type === 'lunar',
          gender: profile.gender,
        }),
      });

      if (!manseryeokRes.ok) {
        throw new Error('만세력 계산 실패');
      }

      const manseryeokData = await manseryeokRes.json();

      // 2. 파이프라인 생성 및 실행
      const pipeline = createAnalysisPipeline({
        enableParallel: true,
        retryCount: 1,
        onProgress: async (progress) => {
          // 진행 상태 업데이트
          await supabase
            .from('profile_reports')
            .update({
              status: 'in_progress',
              current_step: progress.currentStep,
              progress_percent: progress.progressPercent,
              step_statuses: progress.stepStatuses,
              estimated_time_remaining: progress.estimatedTimeRemaining,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
        },
        onStepComplete: async (step, _result) => {
          console.log(`[Pipeline] ${step} 완료`);
        },
        onError: async (step, error) => {
          console.error(`[Pipeline] ${step} 실패:`, error);
        },
      });

      // 재시도인 경우 이전 결과 복원
      if (retryFromStep) {
        const { data: prevReport } = await supabase
          .from('profile_reports')
          .select('pillars, daewun, jijanggan, analysis')
          .eq('id', reportId)
          .single();

        if (prevReport) {
          pipeline.hydrate(
            {
              manseryeok: {
                pillars: prevReport.pillars,
                daewun: prevReport.daewun,
                jijanggan: prevReport.jijanggan,
              },
              basicAnalysis: prevReport.analysis?.basicAnalysis,
              personality: prevReport.analysis?.personality,
              aptitude: prevReport.analysis?.aptitude,
              fortune: prevReport.analysis?.fortune,
            },
            retryFromStep as import('@/lib/ai/types').PipelineStep
          );
        }
      }

      // 파이프라인 실행
      const result = retryFromStep
        ? await pipeline.executeFromStep(
            {
              pillars: manseryeokData.pillars,
              daewun: manseryeokData.daewun || [],
              language: 'ko',
            },
            retryFromStep as import('@/lib/ai/types').PipelineStep
          )
        : await pipeline.execute({
            pillars: manseryeokData.pillars,
            daewun: manseryeokData.daewun || [],
            language: 'ko',
          });

      if (!result.success) {
        throw new Error(result.error?.message || '파이프라인 실행 실패');
      }

      // 3. 결과 저장
      await supabase
        .from('profile_reports')
        .update({
          status: 'completed',
          current_step: null,
          progress_percent: 100,
          estimated_time_remaining: 0,
          pillars: manseryeokData.pillars,
          daewun: manseryeokData.daewun,
          jijanggan: result.data?.intermediateResults?.manseryeok?.jijanggan,
          analysis: {
            basicAnalysis: result.data?.intermediateResults?.basicAnalysis,
            personality: result.data?.intermediateResults?.personality,
            aptitude: result.data?.intermediateResults?.aptitude,
            fortune: result.data?.intermediateResults?.fortune,
            finalResult: result.data?.finalResult,
          },
          scores: result.data?.intermediateResults?.scores,
          visualization_url: result.data?.intermediateResults?.visualization?.pillarImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      // 4. AI 사용량 로깅
      const tokenUsage = result.data?.pipelineMetadata?.tokenUsage;
      if (tokenUsage) {
        await logAiUsage({
          userId: profile.user_id as string,
          featureType: 'report_generation',
          creditsUsed: SERVICE_CREDITS.profileReport,
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          model: 'gemini-3-pro-preview',
          profileId: profile.id as string,
          reportId,
          metadata: {
            parallelExecuted: result.data?.pipelineMetadata?.parallelExecuted,
            totalDuration: result.data?.pipelineMetadata?.totalDuration,
          },
        });
      }

      console.log('[Pipeline] 리포트 생성 완료:', reportId);
    } catch (error) {
      console.error('[Pipeline] 리포트 생성 실패:', error);

      // 실패한 단계 찾기
      const failedStep = (error as { failedStep?: string })?.failedStep || 'unknown';

      // 에러 기록
      await supabase
        .from('profile_reports')
        .update({
          status: 'failed',
          error: {
            step: failedStep,
            message: error instanceof Error ? error.message : '알 수 없는 오류',
            retryable: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    }
  })();
}

export const dynamic = 'force-dynamic';
