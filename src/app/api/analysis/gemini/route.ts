/**
 * POST /api/analysis/gemini
 * Gemini AI 사주 분석 API 엔드포인트
 * 기존 API 패턴(src/app/api/payment) 참조
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { sajuAnalyzer } from '@/lib/ai';
import type { GeminiAnalysisInput, FocusArea } from '@/lib/ai';
import { z } from 'zod';
import {
  AUTH_ERRORS,
  API_ERRORS,
  ANALYSIS_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

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
 * 요청 검증 스키마 (Zod)
 */
const analysisRequestSchema = z.object({
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
  // 사용자 질문 (선택, 500자 제한)
  question: z.string().max(500, '질문은 500자를 초과할 수 없습니다').optional(),
  // 언어 (선택, 기본값: ko)
  language: z.enum(['ko', 'en', 'ja', 'zh']).optional().default('ko'),
});

/**
 * 내부 AI 에러 코드를 표준 에러 코드로 매핑
 */
function mapAiErrorToStandardCode(code?: string): typeof ANALYSIS_ERRORS[keyof typeof ANALYSIS_ERRORS] {
  switch (code) {
    case 'INVALID_INPUT':
      return ANALYSIS_ERRORS.INVALID_SAJU_DATA;
    case 'INVALID_API_KEY':
    case 'MODEL_NOT_FOUND':
      return ANALYSIS_ERRORS.AI_CONFIG_ERROR;
    case 'RATE_LIMIT':
      return ANALYSIS_ERRORS.AI_RATE_LIMITED;
    case 'TIMEOUT':
      return ANALYSIS_ERRORS.TIMEOUT;
    default:
      return ANALYSIS_ERRORS.AI_SERVICE_ERROR;
  }
}

/**
 * POST /api/analysis/gemini
 * Gemini AI를 활용한 사주 분석 요청
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        createErrorResponse(AUTH_ERRORS.UNAUTHORIZED),
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
    }

    // 2. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = analysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          VALIDATION_ERRORS.INVALID_INPUT,
          undefined,
          JSON.stringify(validationResult.error.flatten())
        ),
        { status: getStatusCode(VALIDATION_ERRORS.INVALID_INPUT) }
      );
    }

    const input: GeminiAnalysisInput = {
      pillars: validationResult.data.pillars,
      daewun: validationResult.data.daewun,
      focusArea: validationResult.data.focusArea as FocusArea | undefined,
      question: validationResult.data.question,
      language: validationResult.data.language as 'ko' | 'en' | 'ja' | 'zh',
    };

    // 3. AI 분석 실행 (30초 타임아웃)
    console.log('[API] /api/analysis/gemini 분석 시작', {
      userId: user.id,
      focusArea: input.focusArea,
      language: input.language,
    });

    const analysisResult = await sajuAnalyzer.analyze(input, {
      timeout: 30000,
      retryCount: 2,
    });

    // 4. 결과 반환
    if (!analysisResult.success) {
      console.error('[API] /api/analysis/gemini 분석 실패', analysisResult.error);

      const errorCode = mapAiErrorToStandardCode(analysisResult.error?.code);

      return NextResponse.json(
        createErrorResponse(
          errorCode,
          undefined,
          analysisResult.error?.message
        ),
        { status: getStatusCode(errorCode) }
      );
    }

    // 5. 성공 응답
    console.log('[API] /api/analysis/gemini 분석 완료', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: analysisResult.data,
    });
  } catch (error) {
    // 예상치 못한 에러 처리
    console.error('[API] /api/analysis/gemini 에러:', error);

    return NextResponse.json(
      createErrorResponse(
        API_ERRORS.SERVER_ERROR,
        undefined,
        error instanceof Error ? error.message : undefined
      ),
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}

/**
 * API 라우트 설정
 * 30초 타임아웃을 위한 maxDuration 설정
 */
export const maxDuration = 30; // Vercel serverless function 타임아웃
export const dynamic = 'force-dynamic'; // 항상 동적 실행
