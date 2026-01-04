'use client';

/**
 * 리포트 생성 중 페이지
 * Task 22: 로딩 UI
 *
 * 5초 폴링으로 파이프라인 진행 상태 확인
 * 완료 시 리포트 페이지로 자동 리다이렉트
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import {
  PipelineProcessingScreen,
  PIPELINE_STEPS,
} from '@/components/analysis/PipelineProcessingScreen';
import type { PipelineStep, StepStatus } from '@/lib/ai/types';

/** 폴링 간격 (ms) */
const POLLING_INTERVAL = 5000;

/** 최대 폴링 횟수 (5분 = 60회) */
const MAX_POLL_COUNT = 60;

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

  // params 처리
  useEffect(() => {
    params.then((p) => setProfileId(p.id));
  }, [params]);

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
          // 리포트 생성 시작
          const startRes = await fetch(`/api/profiles/${profileId}/report`, {
            method: 'POST',
          });

          if (!startRes.ok) {
            const errorData = await startRes.json();
            // 크레딧 부족
            if (startRes.status === 402) {
              router.push(`/profiles/${profileId}?error=insufficient_credits`);
              return;
            }
            throw new Error(errorData.error || '리포트 생성 시작 실패');
          }
          return;
        }
        throw new Error('상태 조회 실패');
      }

      const data: ReportStatusResponse = await res.json();
      setStatus(data);

      // 완료 시 리포트 페이지로 이동
      if (data.status === 'completed') {
        router.push(`/profiles/${profileId}/report`);
        return;
      }

      // 실패 시 에러 상태 설정
      if (data.status === 'failed' && data.error) {
        setError({
          step: data.error.step,
          error: data.error.message,
          retryable: data.error.retryable,
        });
      }
    } catch (err) {
      console.error('폴링 오류:', err);
    }
  }, [profileId, router]);

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
    setError(null);
    setPollCount(0);

    try {
      const res = await fetch(`/api/profiles/${profileId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retryFromStep: step }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '재시도 실패');
      }

      // 폴링 재시작
      pollStatus();
    } catch (err) {
      console.error('재시도 오류:', err);
      setError({
        step,
        error: err instanceof Error ? err.message : '재시도에 실패했습니다.',
        retryable: true,
      });
    }
  };

  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    router.push(`/profiles/${profileId}`);
  };

  // 초기 상태 (status가 없을 때)
  const initialStepStatuses: Record<PipelineStep, StepStatus> = PIPELINE_STEPS.reduce(
    (acc, step) => {
      acc[step] = 'pending';
      return acc;
    },
    {} as Record<PipelineStep, StepStatus>
  );

  return (
    <PipelineProcessingScreen
      currentStep={status?.currentStep || null}
      stepStatuses={status?.stepStatuses || initialStepStatuses}
      progressPercent={status?.progressPercent || 0}
      estimatedTimeRemaining={status?.estimatedTimeRemaining || 60}
      error={error}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}
