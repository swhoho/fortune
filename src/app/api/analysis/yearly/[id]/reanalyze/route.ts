/**
 * POST /api/analysis/yearly/[id]/reanalyze
 * 신년 분석 특정 단계 재분석 API (무료)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

/** 재분석 가능한 단계 유형 */
const REANALYZABLE_STEPS = [
  'yearly_advice',
  'key_dates',
  'classical_refs',
  'monthly_1_3',
  'monthly_4_6',
  'monthly_7_9',
  'monthly_10_12',
] as const;

/** 재분석 요청 스키마 */
const reanalyzeSchema = z.object({
  stepType: z.enum(REANALYZABLE_STEPS),
});

/**
 * Python API URL 가져오기
 */
function getPythonApiUrl(): string {
  let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  if (!pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
    pythonApiUrl = `https://${pythonApiUrl}`;
  }
  return pythonApiUrl;
}

/**
 * POST /api/analysis/yearly/[id]/reanalyze
 * 신년 분석 특정 단계 재분석 (크레딧 무료)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const { id: analysisId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 요청 본문 파싱 및 검증
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

    const { stepType } = validationResult.data;

    // 3. 분석 레코드 조회 및 소유권 확인
    const { data: analysis, error: analysisError } = await supabase
      .from('yearly_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      console.error('[API] 신년 분석 조회 실패:', analysisError);
      return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
        status: getStatusCode(API_ERRORS.NOT_FOUND),
      });
    }

    // 4. Python 백엔드에 재분석 요청 (크레딧 차감 없음 - 무료)
    const pythonApiUrl = getPythonApiUrl();

    console.log('[API] Python 백엔드에 신년 분석 재분석 요청:', {
      analysisId,
      stepType,
    });

    const pythonResponse = await fetch(`${pythonApiUrl}/api/analysis/yearly/reanalyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        step_type: stepType,
        pillars: analysis.pillars,
        daewun: analysis.daewun || [],
        target_year: analysis.target_year,
        language: analysis.language || 'ko',
        existing_analysis: analysis.analysis || {},
      }),
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error('[API] Python 재분석 API 호출 실패:', errorData);
      return NextResponse.json(
        { error: '재분석에 실패했습니다', details: errorData.detail },
        { status: 500 }
      );
    }

    const pythonResult = await pythonResponse.json();

    console.log('[API] 신년 분석 재분석 완료:', {
      analysisId,
      stepType,
      success: pythonResult.success,
    });

    // 5. 성공 응답 (Python 응답 중첩 풀기)
    const resultData = pythonResult.data?.result || pythonResult.data;
    return NextResponse.json({
      success: true,
      message: '재분석이 완료되었습니다',
      data: {
        analysisId,
        stepType,
        result: resultData,
      },
    });
  } catch (error) {
    console.error('[API] /api/analysis/yearly/[id]/reanalyze 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
