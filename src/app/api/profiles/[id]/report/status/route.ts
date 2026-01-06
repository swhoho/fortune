/**
 * GET /api/profiles/[id]/report/status
 * 리포트 생성 상태 폴링 API
 *
 * v2.0: Python 백엔드 폴링 추가
 * - DB 상태 조회 + Python job 상태 조회
 * - 완료 시 DB 업데이트
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { PipelineStep, StepStatus } from '@/lib/ai/types';

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
 * 남은 시간 추정 (초)
 * 예상 총 시간 60초 기준
 */
function estimateRemainingTime(progressPercent: number): number {
  const ESTIMATED_TOTAL_TIME = 60;
  const remaining = Math.max(0, ESTIMATED_TOTAL_TIME * (1 - progressPercent / 100));
  return Math.round(remaining);
}

/**
 * GET /api/profiles/[id]/report/status
 * 현재 리포트 생성 상태 조회
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

    // 2. 가장 최근 리포트 상태 조회
    const { data: report, error: reportError } = await supabase
      .from('profile_reports')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError) {
      console.error('[API] 리포트 상태 조회 실패:', reportError);
      return NextResponse.json({ error: '상태 조회에 실패했습니다' }, { status: 500 });
    }

    // 리포트가 없는 경우
    if (!report) {
      return NextResponse.json({ error: '진행 중인 리포트가 없습니다' }, { status: 404 });
    }

    // 3. 이미 완료된 경우 - DB 데이터 반환
    if (report.status === 'completed') {
      return NextResponse.json({
        status: 'completed' as const,
        currentStep: null,
        progressPercent: 100,
        stepStatuses: report.step_statuses as Record<PipelineStep, StepStatus>,
        estimatedTimeRemaining: 0,
      });
    }

    // 4. 실패한 경우 - 에러 정보 포함
    if (report.status === 'failed') {
      const errorInfo = report.error as {
        step?: string;
        message?: string;
        retryable?: boolean;
      } | null;
      return NextResponse.json({
        status: 'failed' as const,
        currentStep: report.current_step as PipelineStep | null,
        progressPercent: report.progress_percent || 0,
        stepStatuses: report.step_statuses as Record<PipelineStep, StepStatus>,
        estimatedTimeRemaining: 0,
        error: errorInfo
          ? {
              step: errorInfo.step || report.current_step || 'unknown',
              message: errorInfo.message || '분석에 실패했습니다',
              retryable: errorInfo.retryable ?? true,
            }
          : null,
      });
    }

    // 5. 진행 중인 경우 - Python 백엔드에서 최신 상태 조회
    let pythonUnavailable = false;

    if (report.job_id) {
      const pythonApiUrl = getPythonApiUrl();

      try {
        const statusRes = await fetch(`${pythonApiUrl}/api/analysis/report/${report.job_id}`, {
          cache: 'no-store',
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();

          // Python에서 완료된 경우 - DB도 업데이트
          if (statusData.status === 'completed') {
            // DB 상태 업데이트 (Python에서 완료됐으면 DB도 동기화)
            if (report.status !== 'completed') {
              await supabase
                .from('profile_reports')
                .update({
                  status: 'completed',
                  progress_percent: 100,
                  step_statuses: statusData.step_statuses || report.step_statuses,
                  current_step: null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', report.id);
            }

            return NextResponse.json({
              status: 'completed' as const,
              currentStep: null,
              progressPercent: 100,
              stepStatuses: statusData.step_statuses || report.step_statuses,
              estimatedTimeRemaining: 0,
            });
          }

          // Python에서 실패한 경우
          if (statusData.status === 'failed') {
            return NextResponse.json({
              status: 'failed' as const,
              currentStep: statusData.current_step || report.current_step,
              progressPercent: statusData.progress_percent || 0,
              stepStatuses: statusData.step_statuses || report.step_statuses,
              estimatedTimeRemaining: 0,
              error: {
                step:
                  statusData.error_step ||
                  statusData.current_step ||
                  report.current_step ||
                  'unknown',
                message: statusData.error || '분석에 실패했습니다',
                retryable: statusData.retryable ?? true,
              },
            });
          }

          // 진행 중 - Python 상태 반환
          return NextResponse.json({
            status: statusData.status as 'pending' | 'in_progress',
            currentStep: statusData.current_step as PipelineStep | null,
            progressPercent: statusData.progress_percent || 0,
            stepStatuses: statusData.step_statuses as Record<PipelineStep, StepStatus>,
            estimatedTimeRemaining: estimateRemainingTime(statusData.progress_percent || 0),
          });
        } else if (statusRes.status === 404) {
          // Python에서 job을 찾을 수 없음 (서버 재시작 등으로 메모리 손실)
          pythonUnavailable = true;
          console.warn('[API] Python job not found (404), checking for stale job');
        }
      } catch (pythonError) {
        pythonUnavailable = true;
        console.warn('[API] Python 상태 조회 실패 (DB 상태 사용):', pythonError);
      }
    }

    // 6. Stale job 감지 - Python 404 + DB in_progress + 5분 이상 경과
    if (pythonUnavailable && report.status === 'in_progress' && report.updated_at) {
      const updatedAt = new Date(report.updated_at);
      const now = new Date();
      const elapsedMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

      // 5분 이상 업데이트 없으면 stale job으로 판단
      if (elapsedMinutes > 5) {
        console.warn(
          `[API] Stale job detected: report_id=${report.id}, elapsed=${elapsedMinutes.toFixed(1)}분`
        );

        // DB 상태를 failed로 업데이트
        await supabase
          .from('profile_reports')
          .update({
            status: 'failed',
            error: {
              step: report.current_step || 'unknown',
              message: '분석 서버 연결이 끊어졌습니다. 다시 시도해주세요.',
              retryable: true,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', report.id);

        return NextResponse.json({
          status: 'failed' as const,
          currentStep: report.current_step as PipelineStep | null,
          progressPercent: report.progress_percent || 0,
          stepStatuses: report.step_statuses || {},
          estimatedTimeRemaining: 0,
          error: {
            step: report.current_step || 'unknown',
            message: '분석 서버 연결이 끊어졌습니다. 다시 시도해주세요.',
            retryable: true,
          },
        });
      }
    }

    // 7. Python 조회 실패 또는 job_id 없는 경우 - DB 상태 반환
    return NextResponse.json({
      status: report.status as 'pending' | 'in_progress',
      currentStep: report.current_step as PipelineStep | null,
      progressPercent: report.progress_percent || 0,
      stepStatuses: report.step_statuses || {},
      estimatedTimeRemaining: estimateRemainingTime(report.progress_percent || 0),
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/[id]/report/status 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
