'use client';

/**
 * 리포트 생성 중 페이지
 * Task 22: 로딩 UI
 *
 * 타이머 기반 진행률 시뮬레이션 + 폴링으로 완료 확인
 * 완료 시 리포트 페이지로 자동 리다이렉트
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import {
  PipelineProcessingScreen,
  PIPELINE_STEPS,
} from '@/components/analysis/PipelineProcessingScreen';
import type { PipelineStep, StepStatus } from '@/lib/ai/types';

/** 폴링 간격 (ms) */
const POLLING_INTERVAL = 3000;

/** 최대 폴링 횟수 (3분 = 60회) */
const MAX_POLL_COUNT = 60;

/** 예상 총 시간 (초) */
const ESTIMATED_TOTAL_TIME = 60;

/** 단계별 예상 시간 (초) */
const STEP_TIMINGS: Record<PipelineStep, { start: number; end: number }> = {
  manseryeok: { start: 0, end: 5 },
  jijanggan: { start: 5, end: 10 },
  basic_analysis: { start: 10, end: 20 },
  personality: { start: 20, end: 30 },
  aptitude: { start: 20, end: 30 }, // 병렬 실행
  fortune: { start: 20, end: 30 }, // 병렬 실행
  scoring: { start: 30, end: 40 },
  visualization: { start: 40, end: 50 },
  saving: { start: 50, end: 58 },
  complete: { start: 58, end: 60 },
};

/** 리포트 상태 응답 타입 */
interface ReportStatusResponse {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: PipelineStep | null;
  progressPercent: number;
  stepStatuses: Record<PipelineStep, StepStatus>;
  estimatedTimeRemaining: number;
  error?: {
    step: PipelineStep;
    message: string;
    retryable: boolean;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 경과 시간 기반으로 현재 단계와 상태 계산
 */
function calculateSimulatedState(elapsedSeconds: number): {
  currentStep: PipelineStep;
  stepStatuses: Record<PipelineStep, StepStatus>;
  progressPercent: number;
} {
  const stepStatuses: Record<PipelineStep, StepStatus> = {} as Record<PipelineStep, StepStatus>;
  let currentStep: PipelineStep = 'manseryeok';

  for (const step of PIPELINE_STEPS) {
    const timing = STEP_TIMINGS[step];
    if (elapsedSeconds >= timing.end) {
      stepStatuses[step] = 'completed';
    } else if (elapsedSeconds >= timing.start) {
      stepStatuses[step] = 'in_progress';
      currentStep = step;
    } else {
      stepStatuses[step] = 'pending';
    }
  }

  // 진행률 계산 (최대 95%까지만 - 완료는 서버 응답으로)
  const progressPercent = Math.min(95, Math.round((elapsedSeconds / ESTIMATED_TOTAL_TIME) * 100));

  return { currentStep, stepStatuses, progressPercent };
}

export default function GeneratingPage({ params }: PageProps) {
  const router = useRouter();

  const [profileId, setProfileId] = useState<string>('');
  const [status, setStatus] = useState<ReportStatusResponse | null>(null);
  const [, setPollCount] = useState(0);
  const [error, setError] = useState<{
    step: PipelineStep;
    error: string;
    retryable: boolean;
  } | null>(null);

  // 타이머 기반 시뮬레이션 상태
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // params 처리 (Promise 또는 일반 객체 모두 지원)
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setProfileId(p.id));
    } else {
      setProfileId((params as { id: string }).id);
    }
  }, [params]);

  // 타이머 시작 (1초마다 업데이트)
  useEffect(() => {
    if (!isGenerating) return;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGenerating]);

  /**
   * 리포트 생성 시작 함수
   * @param retryFromStep 재시도할 단계 (실패한 경우)
   */
  const startReportGeneration = useCallback(
    (retryFromStep?: string) => {
      if (!profileId) return;

      // 타이머 시작
      setIsGenerating(true);
      setError(null);
      setElapsedTime(0);

      // 리포트 생성 시작 (비동기로 - 응답 대기하지 않음)
      fetch(`/api/profiles/${profileId}/report`, {
        method: 'POST',
        headers: retryFromStep ? { 'Content-Type': 'application/json' } : undefined,
        body: retryFromStep ? JSON.stringify({ retryFromStep }) : undefined,
      })
        .then(async (startRes) => {
          if (!startRes.ok) {
            const errorData = await startRes.json();
            // 크레딧 부족
            if (startRes.status === 402) {
              router.push(`/profiles/${profileId}?error=insufficient_credits`);
              return;
            }
            throw new Error(errorData.error || '리포트 생성 시작 실패');
          }
          // 완료됨 - 폴링에서 완료 확인 후 리다이렉트
        })
        .catch((err) => {
          console.error('리포트 생성 실패:', err);
          setError({
            step: 'manseryeok',
            error: err instanceof Error ? err.message : '리포트 생성에 실패했습니다.',
            retryable: true,
          });
        });
    },
    [profileId, router]
  );

  /**
   * 상태 폴링 함수
   */
  const pollStatus = useCallback(async () => {
    if (!profileId) return;

    try {
      const res = await fetch(`/api/profiles/${profileId}/report/status`);

      if (!res.ok) {
        // 404: 아직 생성 시작 안됨
        if (res.status === 404) {
          startReportGeneration();
          return;
        }
        throw new Error('상태 조회 실패');
      }

      const data: ReportStatusResponse = await res.json();
      setStatus(data);

      // 완료 시 리포트 페이지로 이동
      if (data.status === 'completed') {
        if (timerRef.current) clearInterval(timerRef.current);
        router.push(`/profiles/${profileId}/report`);
        return;
      }

      // 진행 중이면 타이머 시작 (이미 시작 안된 경우)
      if (data.status === 'in_progress' && !isGenerating) {
        setIsGenerating(true);
      }

      // pending 상태인 경우 - POST /report 재호출 (기존 실패 후 페이지 재진입 시)
      if (data.status === 'pending' && !isGenerating) {
        startReportGeneration();
        return;
      }

      // 실패한 경우 - 재시도 가능하면 자동으로 재시작 (크레딧 이미 차감됨)
      if (data.status === 'failed') {
        if (timerRef.current) clearInterval(timerRef.current);

        if (data.error) {
          // 에러 상태 설정 (재시작 버튼 표시를 위해)
          setError({
            step: data.error.step,
            error: data.error.message,
            retryable: data.error.retryable,
          });
        } else {
          // 에러 정보 없이 실패한 경우
          setError({
            step: 'manseryeok',
            error: '리포트 생성에 실패했습니다.',
            retryable: true,
          });
        }
      }
    } catch (err) {
      console.error('폴링 오류:', err);
    }
  }, [profileId, router, isGenerating, startReportGeneration]);

  /**
   * 폴링 루프
   */
  useEffect(() => {
    if (!profileId) return;

    // 초기 폴링
    pollStatus();

    // 폴링 인터벌 설정
    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= MAX_POLL_COUNT) {
          // 타임아웃
          setError({
            step: 'saving',
            error: '분석 시간이 초과되었습니다. 다시 시도해주세요.',
            retryable: true,
          });
          return prev;
        }
        pollStatus();
        return prev + 1;
      });
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [profileId, pollStatus]);

  /**
   * 재시도 핸들러
   */
  const handleRetry = async (step: PipelineStep) => {
    setPollCount(0);
    startReportGeneration(step);
  };

  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push(`/profiles/${profileId}`);
  };

  // 시뮬레이션된 상태 계산 (타이머 기반)
  const simulatedState = calculateSimulatedState(elapsedTime);

  // 서버 stepStatuses 우선 사용 (에러/진행 중 모두)
  // 에러 화면에서도 완료된 단계를 정확히 표시하기 위함
  const displayStepStatuses =
    status?.stepStatuses && Object.keys(status.stepStatuses).length > 0
      ? status.stepStatuses
      : simulatedState.stepStatuses;

  const displayCurrentStep =
    status?.status === 'in_progress' && status?.currentStep
      ? status.currentStep
      : simulatedState.currentStep;

  const displayProgress =
    status?.status === 'in_progress' && status?.progressPercent
      ? Math.max(status.progressPercent, simulatedState.progressPercent)
      : simulatedState.progressPercent;

  // 남은 시간 계산 (예상 총 시간 - 경과 시간)
  const remainingTime = Math.max(0, ESTIMATED_TOTAL_TIME - elapsedTime);

  return (
    <PipelineProcessingScreen
      currentStep={isGenerating ? displayCurrentStep : null}
      stepStatuses={displayStepStatuses}
      progressPercent={isGenerating ? displayProgress : 0}
      estimatedTimeRemaining={remainingTime}
      error={error}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}
