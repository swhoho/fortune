/**
 * POST /api/analysis/pipeline/retry
 * 멀티스텝 파이프라인 재시도 API
 * Task 6: 에러 복구 로직
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { createAnalysisPipeline } from '@/lib/ai/pipeline';
import type {
  GeminiAnalysisInput,
  FocusArea,
  PipelineStep,
  PipelineIntermediateResults,
} from '@/lib/ai';
import { z } from 'zod';

/**
 * PillarData Zod 스키마
 * src/lib/ai/types.ts의 PillarData 인터페이스 기반
 */
const pillarSchema = z.object({
  stem: z.string(),
  branch: z.string(),
  element: z.string(),
  stemElement: z.string(),
  branchElement: z.string(),
});

/**
 * DaewunData Zod 스키마
 * src/lib/ai/types.ts의 DaewunData 인터페이스 기반
 */
const daewunSchema = z.object({
  startAge: z.number(),
  endAge: z.number(),
  stem: z.string(),
  branch: z.string(),
  description: z.string().optional(),
});

/**
 * 재시도 요청 스키마
 */
const retryRequestSchema = z.object({
  // 재시도 시작 단계
  fromStep: z.enum([
    'manseryeok',
    'jijanggan',
    'basic_analysis',
    'personality',
    'aptitude',
    'fortune',
    'scoring',
    'visualization',
    'saving',
  ]),
  // 기존 분석 입력 데이터
  input: z.object({
    pillars: z.object({
      year: pillarSchema,
      month: pillarSchema,
      day: pillarSchema,
      hour: pillarSchema,
    }),
    daewun: z.array(daewunSchema).optional(),
    focusArea: z.string().optional(),
    question: z.string().optional(),
    language: z.string().optional(),
  }),
  // 이전에 완료된 중간 결과 (선택)
  previousResults: z.record(z.string(), z.unknown()).optional(),
  // 파이프라인 옵션
  options: z
    .object({
      enableParallel: z.boolean().optional(),
      retryCount: z.number().optional(),
    })
    .optional(),
});

/**
 * POST /api/analysis/pipeline/retry
 * 실패한 단계부터 파이프라인 재시도
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const validationResult = retryRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '요청 데이터가 올바르지 않습니다',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fromStep, input, previousResults, options } = validationResult.data;

    console.log('[Pipeline Retry API] 재시도 시작', {
      userId: user.id,
      fromStep,
      hasPreviousResults: !!previousResults,
    });

    // 3. 새 파이프라인 인스턴스 생성 (팩토리 함수 사용)
    const pipeline = createAnalysisPipeline({
      enableParallel: options?.enableParallel ?? true,
      retryCount: 1, // 60초 타임아웃 대비 재시도 1회로 고정
    });

    const geminiInput: GeminiAnalysisInput = {
      pillars: input.pillars,
      daewun: input.daewun,
      focusArea: input.focusArea as FocusArea | undefined,
      question: input.question,
      language: (input.language || 'ko') as 'ko' | 'en' | 'ja' | 'zh',
    };

    // 4. 이전 결과가 있으면 상태 복원
    if (previousResults && Object.keys(previousResults).length > 0) {
      pipeline.hydrate(previousResults as PipelineIntermediateResults, fromStep as PipelineStep);
    }

    // 5. 특정 단계부터 파이프라인 재실행
    const result = await pipeline.executeFromStep(geminiInput, fromStep as PipelineStep);

    // 5. 결과 반환
    if (!result.success) {
      console.error('[Pipeline Retry API] 재시도 실패', {
        failedStep: result.failedStep,
        error: result.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error?.message ?? '재시도에 실패했습니다',
          code: result.error?.code,
          failedStep: result.failedStep,
          partialResults: result.partialResults,
        },
        { status: 500 }
      );
    }

    const totalDuration = Date.now() - startTime;

    console.log('[Pipeline Retry API] 재시도 완료', {
      userId: user.id,
      fromStep,
      totalDuration: `${totalDuration}ms`,
    });

    return NextResponse.json({
      success: true,
      retried: true,
      fromStep,
      data: {
        finalResult: result.data?.finalResult,
        intermediateResults: result.data?.intermediateResults,
        pipelineMetadata: result.data?.pipelineMetadata,
      },
    });
  } catch (error) {
    console.error('[Pipeline Retry API] 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
