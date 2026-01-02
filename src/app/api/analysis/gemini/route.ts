/**
 * POST /api/analysis/gemini
 * Gemini AI 사주 분석 API 엔드포인트
 * 기존 API 패턴(src/app/api/payment) 참조
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sajuAnalyzer } from '@/lib/ai';
import type { GeminiAnalysisInput, FocusArea } from '@/lib/ai';
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
 * POST /api/analysis/gemini
 * Gemini AI를 활용한 사주 분석 요청
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 2. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = analysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '요청 데이터가 올바르지 않습니다',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
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
      userId: session.user.id,
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

      const statusCode = getStatusCodeFromError(analysisResult.error?.code);

      return NextResponse.json(
        {
          error: analysisResult.error?.message ?? 'AI 분석에 실패했습니다',
          code: analysisResult.error?.code,
        },
        { status: statusCode }
      );
    }

    // 5. 성공 응답
    console.log('[API] /api/analysis/gemini 분석 완료', {
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: analysisResult.data,
    });
  } catch (error) {
    // 예상치 못한 에러 처리
    console.error('[API] /api/analysis/gemini 에러:', error);

    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * API 라우트 설정
 * 30초 타임아웃을 위한 maxDuration 설정
 */
export const maxDuration = 30; // Vercel serverless function 타임아웃
export const dynamic = 'force-dynamic'; // 항상 동적 실행
