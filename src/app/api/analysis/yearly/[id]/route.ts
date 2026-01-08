/**
 * GET /api/analysis/yearly/:id
 * 신년 분석 상태/결과 조회 API (폴링용)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

/**
 * snake_case → camelCase 변환 (재귀)
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 객체 키를 snake_case → camelCase로 변환 (재귀)
 */
function normalizeKeys<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(normalizeKeys) as T;
  if (typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = normalizeKeys(value);
  }
  return result as T;
}

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
 * GET /api/analysis/yearly/:id
 * 신년 분석 상태/결과 조회 (폴링)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 2. DB에서 분석 레코드 조회
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

    // 3. 이미 완료된 경우 바로 반환
    // v2.5: 개별 컬럼 우선, analysis 폴백 (롤백 안전성)
    if (analysis.status === 'completed') {
      // 개별 컬럼에서 분석 결과 조합 (없으면 analysis 폴백)
      // yearlyAdvice는 snake_case 키일 수 있으므로 정규화 적용
      const rawYearlyAdvice = analysis.yearly_advice ?? analysis.analysis?.yearlyAdvice;
      const analysisResult = {
        year: analysis.overview?.year ?? analysis.analysis?.year,
        summary: analysis.overview?.summary ?? analysis.analysis?.summary,
        yearlyTheme: analysis.overview?.yearlyTheme ?? analysis.analysis?.yearlyTheme,
        overallScore: analysis.overview?.overallScore ?? analysis.analysis?.overallScore,
        monthlyFortunes: analysis.monthly_fortunes ?? analysis.analysis?.monthlyFortunes,
        yearlyAdvice: rawYearlyAdvice ? normalizeKeys(rawYearlyAdvice) : null,
        classicalReferences: analysis.classical_refs ?? analysis.analysis?.classicalReferences,
        quarterlyHighlights: analysis.analysis?.quarterlyHighlights ?? [],
      };

      // 최소한의 데이터가 있는지 확인
      if (!analysisResult.year && !analysis.analysis) {
        return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
          status: getStatusCode(API_ERRORS.NOT_FOUND),
        });
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        progressPercent: 100,
        data: {
          id: analysis.id,
          targetYear: analysis.target_year,
          pillars: analysis.pillars,
          daewun: analysis.daewun,
          currentDaewun: analysis.current_daewun,
          gender: analysis.gender,
          analysis: analysisResult,
          language: analysis.language,
          creditsUsed: analysis.credits_used,
          createdAt: analysis.created_at,
        },
      });
    }

    // 4. 진행 중인 경우 Python 백엔드에서 상태 조회
    if (analysis.job_id) {
      const pythonApiUrl = getPythonApiUrl();

      try {
        const statusRes = await fetch(`${pythonApiUrl}/api/analysis/yearly/${analysis.job_id}`);

        if (statusRes.ok) {
          const statusData = await statusRes.json();

          // Python에서 완료된 경우 DB 업데이트
          if (statusData.status === 'completed' && statusData.result) {
            await supabase
              .from('yearly_analyses')
              .update({
                status: 'completed',
                analysis: statusData.result,
                updated_at: new Date().toISOString(),
              })
              .eq('id', analysisId);

            // yearlyAdvice 키 정규화 적용
            const normalizedResult = {
              ...statusData.result,
              yearlyAdvice: statusData.result.yearlyAdvice
                ? normalizeKeys(statusData.result.yearlyAdvice)
                : null,
            };

            return NextResponse.json({
              success: true,
              status: 'completed',
              progressPercent: 100,
              data: {
                id: analysis.id,
                targetYear: analysis.target_year,
                pillars: analysis.pillars,
                daewun: analysis.daewun,
                currentDaewun: analysis.current_daewun,
                gender: analysis.gender,
                analysis: normalizedResult,
                language: analysis.language,
                creditsUsed: analysis.credits_used,
                createdAt: analysis.created_at,
              },
            });
          }

          // Python에서 실패한 경우
          if (statusData.status === 'failed') {
            await supabase
              .from('yearly_analyses')
              .update({
                status: 'failed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', analysisId);

            return NextResponse.json({
              success: false,
              status: 'failed',
              error: statusData.error || '분석에 실패했습니다',
            });
          }

          // 진행 중
          return NextResponse.json({
            success: true,
            status: statusData.status,
            progressPercent: statusData.progress_percent || 0,
            currentStep: statusData.current_step,
          });
        }
      } catch (pythonError) {
        console.error('[API] Python 상태 조회 실패:', pythonError);
        // Python 조회 실패해도 현재 상태 반환
      }
    }

    // 5. 상태 불명확한 경우
    return NextResponse.json({
      success: true,
      status: analysis.status || 'pending',
      progressPercent: 0,
    });
  } catch (error) {
    console.error('[API] /api/analysis/yearly/:id 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
