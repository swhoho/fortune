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

    // 2. 기존 리포트 확인 (pending, in_progress, failed 모두)
    const { data: existingReport } = await supabase
      .from('profile_reports')
      .select('id, status, credits_used, current_step')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 이미 진행 중인 리포트가 있는 경우 (재시도 요청이 아닐 때)
    if (existingReport?.status === 'in_progress' && !retryFromStep) {
      return NextResponse.json({
        success: true,
        message: '이미 리포트 생성이 진행 중입니다',
        reportId: existingReport.id,
        pollUrl: `/api/profiles/${profileId}/report/status`,
      });
    }

    // 3. 크레딧 무료 재시도 조건 확인
    // - 기존 리포트가 있고 credits_used > 0이면 크레딧 차감 없이 재시도
    // - 재시도 요청(retryFromStep)인 경우도 무료
    const isRetryWithCredits =
      existingReport &&
      existingReport.credits_used > 0 &&
      (existingReport.status === 'failed' || existingReport.status === 'pending');

    const shouldDeductCredits = !retryFromStep && !isRetryWithCredits;

    // 4. 크레딧 확인 및 차감 (신규 생성인 경우에만)
    if (shouldDeductCredits) {
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

      // 크레딧 차감
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

    // 기존 리포트가 있으면 재사용 (failed, pending 상태)
    if (
      existingReport &&
      (existingReport.status === 'failed' || existingReport.status === 'pending')
    ) {
      // 재시도: 기존 레코드 상태 업데이트
      reportId = existingReport.id;
      const startStep = retryFromStep || existingReport.current_step || 'manseryeok';

      await supabase
        .from('profile_reports')
        .update({
          status: 'pending',
          current_step: startStep,
          progress_percent: 0,
          error: null,
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      console.log(`[API] 리포트 재시도 (무료): ${reportId}, 시작 단계: ${startStep}`);
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
 * 파이프라인 동기 실행
 * Vercel Serverless에서 완료까지 대기
 * v2.2: 만세력 재사용 + 단계별 즉시 저장
 */
async function startPipelineAsync(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reportId: string,
  profile: Record<string, unknown>,
  retryFromStep?: string
) {
  const { createAnalysisPipeline } = await import('@/lib/ai/pipeline');

  // PYTHON_API_URL에 프로토콜 없으면 https:// 자동 추가
  let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  if (pythonApiUrl && !pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
    pythonApiUrl = `https://${pythonApiUrl}`;
  }

  try {
    // 1. 기존 리포트에서 pillars 확인 (재시도 시 재사용)
    const { data: existingData } = await supabase
      .from('profile_reports')
      .select('pillars, daewun, jijanggan, analysis')
      .eq('id', reportId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let manseryeokData: { pillars: any; daewun: any };

    // 기존 pillars가 있고 재시도인 경우 재사용 (manseryeok 단계가 아닌 경우)
    if (existingData?.pillars && retryFromStep && retryFromStep !== 'manseryeok') {
      console.log('[Pipeline] 기존 만세력 데이터 재사용');
      manseryeokData = {
        pillars: existingData.pillars,
        daewun: existingData.daewun,
      };
    } else {
      // 만세력 API 호출 (신규 또는 manseryeok 단계 재시도)
      const birthDate = new Date(profile.birth_date as string);
      const birthTime = (profile.birth_time as string) || '12:00';
      const [hour, minute] = birthTime.split(':').map(Number);
      birthDate.setHours(hour || 12, minute || 0, 0, 0);

      console.log('[Pipeline] 만세력 API 호출 시작');
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

      manseryeokData = await manseryeokRes.json();

      // 만세력 계산 직후 DB에 즉시 저장
      await supabase
        .from('profile_reports')
        .update({
          pillars: manseryeokData.pillars,
          daewun: manseryeokData.daewun,
          current_step: 'jijanggan',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      console.log('[Pipeline] 만세력 데이터 DB 저장 완료');
    }

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
      onStepComplete: async (step, result) => {
        console.log(`[Pipeline] ${step} 완료`);

        // 주요 단계 완료 시 중간 결과 DB 즉시 저장
        if (step === 'jijanggan' && result) {
          await supabase
            .from('profile_reports')
            .update({
              jijanggan: result,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 지장간 데이터 DB 저장 완료');
        }

        if (step === 'basic_analysis' && result) {
          const { data: current } = await supabase
            .from('profile_reports')
            .select('analysis')
            .eq('id', reportId)
            .single();

          await supabase
            .from('profile_reports')
            .update({
              analysis: { ...current?.analysis, basicAnalysis: result },
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 기본분석 데이터 DB 저장 완료');
        }

        if (step === 'personality' && result) {
          const { data: current } = await supabase
            .from('profile_reports')
            .select('analysis')
            .eq('id', reportId)
            .single();

          await supabase
            .from('profile_reports')
            .update({
              analysis: { ...current?.analysis, personality: result },
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 성격분석 데이터 DB 저장 완료');
        }

        if (step === 'aptitude' && result) {
          const { data: current } = await supabase
            .from('profile_reports')
            .select('analysis')
            .eq('id', reportId)
            .single();

          await supabase
            .from('profile_reports')
            .update({
              analysis: { ...current?.analysis, aptitude: result },
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 적성분석 데이터 DB 저장 완료');
        }

        if (step === 'fortune' && result) {
          const { data: current } = await supabase
            .from('profile_reports')
            .select('analysis')
            .eq('id', reportId)
            .single();

          await supabase
            .from('profile_reports')
            .update({
              analysis: { ...current?.analysis, fortune: result },
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 재물운 데이터 DB 저장 완료');
        }

        if (step === 'scoring' && result) {
          await supabase
            .from('profile_reports')
            .update({
              scores: result,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 점수 데이터 DB 저장 완료');
        }

        if (step === 'visualization' && result) {
          await supabase
            .from('profile_reports')
            .update({
              visualization_url: (result as { pillarImage?: string })?.pillarImage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reportId);
          console.log('[Pipeline] 시각화 데이터 DB 저장 완료');
        }
      },
      onError: async (step, error) => {
        console.error(`[Pipeline] ${step} 실패:`, error);
      },
    });

    // 재시도인 경우 이전 결과 복원 (existingData 재사용)
    if (retryFromStep && existingData) {
      pipeline.hydrate(
        {
          manseryeok: {
            pillars: existingData.pillars || manseryeokData.pillars,
            daewun: existingData.daewun || manseryeokData.daewun,
            jijanggan: existingData.jijanggan,
          },
          basicAnalysis: existingData.analysis?.basicAnalysis,
          personality: existingData.analysis?.personality,
          aptitude: existingData.analysis?.aptitude,
          fortune: existingData.analysis?.fortune,
        },
        retryFromStep as import('@/lib/ai/types').PipelineStep
      );
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

    // 3. 최종 결과 저장 (finalResult 추가)
    await supabase
      .from('profile_reports')
      .update({
        status: 'completed',
        current_step: null,
        progress_percent: 100,
        estimated_time_remaining: 0,
        analysis: {
          basicAnalysis: result.data?.intermediateResults?.basicAnalysis,
          personality: result.data?.intermediateResults?.personality,
          aptitude: result.data?.intermediateResults?.aptitude,
          fortune: result.data?.intermediateResults?.fortune,
          finalResult: result.data?.finalResult,
        },
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
}

export const dynamic = 'force-dynamic';
