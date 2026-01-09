/**
 * GET /api/analysis/compatibility/:id
 * 궁합 분석 상태/결과 조회 API (폴링용)
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
 * GET /api/analysis/compatibility/:id
 * 궁합 분석 상태/결과 조회 (폴링)
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
      .from('compatibility_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      console.error('[API] 궁합 분석 조회 실패:', analysisError);
      return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
        status: getStatusCode(API_ERRORS.NOT_FOUND),
      });
    }

    // 3. 이미 완료된 경우 바로 반환
    if (analysis.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        progressPercent: 100,
        data: normalizeKeys({
          id: analysis.id,
          profileIdA: analysis.profile_id_a,
          profileIdB: analysis.profile_id_b,
          analysisType: analysis.analysis_type,

          // 만세력 데이터
          pillarsA: analysis.pillars_a,
          pillarsB: analysis.pillars_b,
          daewunA: analysis.daewun_a,
          daewunB: analysis.daewun_b,

          // Python 점수 결과
          totalScore: analysis.total_score,
          scores: analysis.scores,
          traitScoresA: analysis.trait_scores_a,
          traitScoresB: analysis.trait_scores_b,
          interactions: analysis.interactions,

          // Gemini 분석 결과
          relationshipType: analysis.relationship_type,
          traitInterpretation: analysis.trait_interpretation,
          conflictAnalysis: analysis.conflict_analysis,
          marriageFit: analysis.marriage_fit,
          mutualInfluence: analysis.mutual_influence,

          // 메타
          language: analysis.language,
          creditsUsed: analysis.credits_used,
          failedSteps: analysis.failed_steps,
          createdAt: analysis.created_at,
        }),
      });
    }

    // 4. 실패한 경우
    if (analysis.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: analysis.error || '분석에 실패했습니다',
        failedSteps: analysis.failed_steps,
      });
    }

    // 5. 진행 중인 경우 Python 백엔드에서 상태 조회
    if (analysis.job_id) {
      const pythonApiUrl = getPythonApiUrl();

      try {
        const statusRes = await fetch(
          `${pythonApiUrl}/api/analysis/compatibility/${analysis.job_id}/status`
        );

        if (statusRes.ok) {
          const statusData = await statusRes.json();

          // Python에서 완료된 경우 (이미 DB 업데이트됨)
          if (statusData.status === 'completed') {
            // DB 다시 조회
            const { data: updatedAnalysis } = await supabase
              .from('compatibility_analyses')
              .select('*')
              .eq('id', analysisId)
              .single();

            if (updatedAnalysis) {
              return NextResponse.json({
                success: true,
                status: 'completed',
                progressPercent: 100,
                data: normalizeKeys({
                  id: updatedAnalysis.id,
                  profileIdA: updatedAnalysis.profile_id_a,
                  profileIdB: updatedAnalysis.profile_id_b,
                  analysisType: updatedAnalysis.analysis_type,
                  pillarsA: updatedAnalysis.pillars_a,
                  pillarsB: updatedAnalysis.pillars_b,
                  daewunA: updatedAnalysis.daewun_a,
                  daewunB: updatedAnalysis.daewun_b,
                  totalScore: updatedAnalysis.total_score,
                  scores: updatedAnalysis.scores,
                  traitScoresA: updatedAnalysis.trait_scores_a,
                  traitScoresB: updatedAnalysis.trait_scores_b,
                  interactions: updatedAnalysis.interactions,
                  relationshipType: updatedAnalysis.relationship_type,
                  traitInterpretation: updatedAnalysis.trait_interpretation,
                  conflictAnalysis: updatedAnalysis.conflict_analysis,
                  marriageFit: updatedAnalysis.marriage_fit,
                  mutualInfluence: updatedAnalysis.mutual_influence,
                  language: updatedAnalysis.language,
                  creditsUsed: updatedAnalysis.credits_used,
                  failedSteps: updatedAnalysis.failed_steps,
                  createdAt: updatedAnalysis.created_at,
                }),
              });
            }
          }

          // Python에서 실패한 경우
          if (statusData.status === 'failed') {
            return NextResponse.json({
              success: false,
              status: 'failed',
              error: statusData.error || '분석에 실패했습니다',
              failedSteps: statusData.failed_steps,
            });
          }

          // 진행 중 (Python 상태 반환)
          return NextResponse.json({
            success: true,
            status: statusData.status,
            progressPercent: statusData.progress_percent || 0,
            currentStep: statusData.current_step,
            stepStatuses: statusData.step_statuses,
          });
        }

        // Python 404: Job Store에 없음 → DB fallback으로 이미 처리됨
        // Python에서 DB fallback 후에도 404면 DB 직접 조회
        if (statusRes.status === 404) {
          console.log('[API] Python 404 - DB 상태 반환');
          // DB에 이미 완료 상태가 있을 수 있음 (중간 저장으로)
          const { data: refreshedAnalysis } = await supabase
            .from('compatibility_analyses')
            .select('*')
            .eq('id', analysisId)
            .single();

          if (refreshedAnalysis?.status === 'completed') {
            return NextResponse.json({
              success: true,
              status: 'completed',
              progressPercent: 100,
              data: normalizeKeys({
                id: refreshedAnalysis.id,
                profileIdA: refreshedAnalysis.profile_id_a,
                profileIdB: refreshedAnalysis.profile_id_b,
                analysisType: refreshedAnalysis.analysis_type,
                pillarsA: refreshedAnalysis.pillars_a,
                pillarsB: refreshedAnalysis.pillars_b,
                daewunA: refreshedAnalysis.daewun_a,
                daewunB: refreshedAnalysis.daewun_b,
                totalScore: refreshedAnalysis.total_score,
                scores: refreshedAnalysis.scores,
                traitScoresA: refreshedAnalysis.trait_scores_a,
                traitScoresB: refreshedAnalysis.trait_scores_b,
                interactions: refreshedAnalysis.interactions,
                relationshipType: refreshedAnalysis.relationship_type,
                traitInterpretation: refreshedAnalysis.trait_interpretation,
                conflictAnalysis: refreshedAnalysis.conflict_analysis,
                marriageFit: refreshedAnalysis.marriage_fit,
                mutualInfluence: refreshedAnalysis.mutual_influence,
                language: refreshedAnalysis.language,
                creditsUsed: refreshedAnalysis.credits_used,
                failedSteps: refreshedAnalysis.failed_steps,
                createdAt: refreshedAnalysis.created_at,
              }),
            });
          }

          if (refreshedAnalysis?.status === 'failed') {
            return NextResponse.json({
              success: false,
              status: 'failed',
              error: refreshedAnalysis.error || '분석에 실패했습니다',
              failedSteps: refreshedAnalysis.failed_steps,
            });
          }

          // 여전히 processing이면 DB 상태 반환 (중간 저장된 진행 상태)
          if (refreshedAnalysis) {
            return NextResponse.json({
              success: true,
              status: refreshedAnalysis.status || 'processing',
              progressPercent: refreshedAnalysis.progress_percent || 0,
              currentStep: refreshedAnalysis.current_step,
              stepStatuses: refreshedAnalysis.step_statuses || {},
            });
          }
        }
      } catch (pythonError) {
        console.error('[API] Python 상태 조회 실패:', pythonError);
        // Python 조회 실패 시 DB에서 최신 상태 반환
      }
    }

    // 6. DB 상태 반환 (중간 저장된 진행 상태 포함)
    return NextResponse.json({
      success: true,
      status: analysis.status || 'pending',
      progressPercent: analysis.progress_percent || 0,
      currentStep: analysis.current_step,
      stepStatuses: analysis.step_statuses || {},
    });
  } catch (error) {
    console.error('[API] /api/analysis/compatibility/:id 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
