/**
 * POST /api/analysis/pipeline
 * 멀티스텝 AI 사주 분석 파이프라인 API
 * Task 6: v2.0 멀티스텝 파이프라인 설계
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { createAnalysisPipeline } from '@/lib/ai/pipeline';
import type { GeminiAnalysisInput, FocusArea, PipelineProgress } from '@/lib/ai';
import { z } from 'zod';

/**
 * 기둥 데이터 스키마
 */
const pillarSchema = z.object({
  stem: z.string().min(1, '천간이 필요합니다'),
  branch: z.string().min(1, '지지가 필요합니다'),
  element: z.string().min(1, '오행이 필요합니다'),
  stemElement: z.string().min(1, '천간 오행이 필요합니다'),
  branchElement: z.string().min(1, '지지 오행이 필요합니다'),
});

/**
 * 파이프라인 요청 검증 스키마
 */
const pipelineRequestSchema = z.object({
  // 사주 기둥 정보
  pillars: z.object({
    year: pillarSchema,
    month: pillarSchema,
    day: pillarSchema,
    hour: pillarSchema,
  }),
  // 대운 정보 (선택)
  daewun: z
    .array(
      z.object({
        startAge: z.number(),
        endAge: z.number(),
        stem: z.string(),
        branch: z.string(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  // 집중 영역 (선택)
  focusArea: z.enum(['wealth', 'love', 'career', 'health', 'overall']).optional(),
  // 사용자 질문 (선택)
  question: z.string().max(500).optional(),
  // 언어
  language: z.enum(['ko', 'en', 'ja', 'zh-CN', 'zh-TW']).optional().default('ko'),
  // 파이프라인 옵션
  options: z
    .object({
      enableParallel: z.boolean().default(true),
      retryCount: z.number().min(0).max(5).default(2),
    })
    .optional(),
});

/**
 * 에러 코드에 따른 HTTP 상태 코드 반환
 */
function getStatusCodeFromError(code?: string): number {
  switch (code) {
    case 'INVALID_INPUT':
      return 400;
    case 'INVALID_API_KEY':
    case 'MODEL_NOT_FOUND':
      return 500;
    case 'RATE_LIMIT':
      return 429;
    case 'TIMEOUT':
      return 504;
    default:
      return 500;
  }
}

/**
 * POST /api/analysis/pipeline
 * 멀티스텝 사주 분석 파이프라인 실행
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 2. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = pipelineRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '요청 데이터가 올바르지 않습니다',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { pillars, daewun, focusArea, question, language, options } = validationResult.data;

    // 3. 파이프라인 인스턴스 생성 (팩토리 함수 사용)
    const pipeline = createAnalysisPipeline({
      enableParallel: options?.enableParallel ?? true,
      retryCount: 1, // 60초 타임아웃 대비 재시도 1회로 고정
      onProgress: (progress: PipelineProgress) => {
        console.log(`[Pipeline API] 진행: ${progress.currentStep} (${progress.progressPercent}%)`);
      },
      onStepComplete: (step, _result) => {
        console.log(`[Pipeline API] 단계 완료: ${step}`);
      },
      onError: (step, error) => {
        console.error(`[Pipeline API] 에러 발생: ${step}`, error);
      },
    });

    const input: GeminiAnalysisInput = {
      pillars,
      daewun,
      focusArea: focusArea as FocusArea | undefined,
      question,
      language: language as 'ko' | 'en' | 'ja' | 'zh',
    };

    console.log('[Pipeline API] 파이프라인 시작', {
      userId: user.id,
      language,
      enableParallel: options?.enableParallel ?? true,
    });

    // 4. 파이프라인 실행
    const result = await pipeline.execute(input);

    // 5. 결과 반환
    if (!result.success) {
      console.error('[Pipeline API] 파이프라인 실패', {
        failedStep: result.failedStep,
        error: result.error,
      });

      const statusCode = getStatusCodeFromError(result.error?.code);

      return NextResponse.json(
        {
          success: false,
          error: result.error?.message ?? 'AI 분석에 실패했습니다',
          code: result.error?.code,
          failedStep: result.failedStep,
          partialResults: result.partialResults,
        },
        { status: statusCode }
      );
    }

    const totalDuration = Date.now() - startTime;

    console.log('[Pipeline API] 파이프라인 완료', {
      userId: user.id,
      totalDuration: `${totalDuration}ms`,
      pipelineDuration: `${result.data?.pipelineMetadata.totalDuration}ms`,
    });

    return NextResponse.json({
      success: true,
      data: {
        finalResult: result.data?.finalResult,
        intermediateResults: result.data?.intermediateResults,
        pipelineMetadata: result.data?.pipelineMetadata,
      },
    });
  } catch (error) {
    console.error('[Pipeline API] 예상치 못한 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * API 라우트 설정
 * 멀티스텝 파이프라인은 60초 타임아웃
 */
export const maxDuration = 60; // Vercel serverless function 타임아웃
export const dynamic = 'force-dynamic'; // 항상 동적 실행
