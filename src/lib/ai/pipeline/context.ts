/**
 * PipelineContext - 파이프라인 공유 상태 관리
 * v2.1: AnalysisPipeline 클래스 분해
 *
 * 모든 매니저/실행기가 공유하는 단일 상태 소스 (Single Source of Truth)
 */

import type {
  PipelineStep,
  StepStatus,
  PipelineProgress,
  PipelineIntermediateResults,
  PipelineOptions,
} from './types';
import { PIPELINE_STEPS, DEFAULT_STEP_TIMEOUTS, getInitialStepStatuses } from './types';

/**
 * PipelineContext 클래스
 * 파이프라인 상태의 단일 소스
 */
export class PipelineContext {
  readonly abortController: AbortController;
  readonly pythonApiUrl: string;
  readonly stepTimeouts: Record<PipelineStep, number>;
  readonly enableParallel: boolean;
  readonly retryCount: number;

  intermediateResults: PipelineIntermediateResults = {};
  stepStatuses: Record<PipelineStep, StepStatus>;
  stepDurations: Partial<Record<PipelineStep, number>> = {};
  startedAt: Date | null = null;

  private options?: PipelineOptions;

  constructor(options?: PipelineOptions) {
    this.abortController = new AbortController();
    // PYTHON_API_URL에 프로토콜 없으면 https:// 자동 추가
    let apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }
    this.pythonApiUrl = apiUrl;
    this.retryCount = options?.retryCount ?? 1;
    this.enableParallel = options?.enableParallel ?? true;
    this.stepStatuses = getInitialStepStatuses();
    this.stepTimeouts = {
      ...DEFAULT_STEP_TIMEOUTS,
      ...options?.stepTimeouts,
    };
    this.options = options;
  }

  /**
   * 파이프라인 시작
   */
  start(): void {
    this.startedAt = new Date();
    this.intermediateResults = {};
    this.stepDurations = {};
    this.stepStatuses = getInitialStepStatuses();
  }

  /**
   * 상태 복원 (재시도용)
   */
  hydrate(results: PipelineIntermediateResults, fromStep: PipelineStep): void {
    this.intermediateResults = { ...results };
    const fromIndex = PIPELINE_STEPS.indexOf(fromStep);

    PIPELINE_STEPS.forEach((step, index) => {
      if (index < fromIndex) {
        this.stepStatuses[step] = 'completed';
      } else {
        this.stepStatuses[step] = 'pending';
      }
    });

    console.log(`[PipelineContext] 상태 복원: ${fromStep}부터 재시작`);
  }

  /**
   * 단계 상태 업데이트 (원자적)
   */
  updateStepStatus(step: PipelineStep, status: StepStatus): void {
    this.stepStatuses[step] = status;
  }

  /**
   * 단계 완료 기록
   */
  markStepCompleted(step: PipelineStep, duration: number): void {
    this.stepStatuses[step] = 'completed';
    this.stepDurations[step] = duration;
  }

  /**
   * 단계 실패 기록
   */
  markStepFailed(step: PipelineStep, duration: number): void {
    this.stepStatuses[step] = 'failed';
    this.stepDurations[step] = duration;
  }

  /**
   * 진행 상태 계산
   */
  getProgress(currentStep: PipelineStep): PipelineProgress {
    const completedSteps = PIPELINE_STEPS.filter(
      (s) => this.stepStatuses[s] === 'completed'
    ).length;

    const progressPercent = Math.round((completedSteps / (PIPELINE_STEPS.length - 1)) * 100);

    return {
      currentStep,
      stepStatuses: { ...this.stepStatuses },
      progressPercent,
      estimatedTimeRemaining: this.estimateRemainingTime(currentStep),
      startedAt: this.startedAt!,
      lastUpdatedAt: new Date(),
    };
  }

  /**
   * 남은 시간 추정
   */
  estimateRemainingTime(currentStep: PipelineStep): number {
    const currentIndex = PIPELINE_STEPS.indexOf(currentStep);
    let remaining = 0;

    for (let i = currentIndex; i < PIPELINE_STEPS.length; i++) {
      const step = PIPELINE_STEPS[i];
      if (step) {
        remaining += this.stepTimeouts[step];
      }
    }

    return Math.round(remaining / 1000); // 초 단위
  }

  /**
   * 현재 실패한 단계 찾기
   */
  getCurrentFailedStep(): PipelineStep | undefined {
    return PIPELINE_STEPS.find((s) => this.stepStatuses[s] === 'failed');
  }

  /**
   * 총 소요 시간 계산
   */
  getTotalDuration(): number {
    if (!this.startedAt) return 0;
    return Date.now() - this.startedAt.getTime();
  }

  /**
   * 파이프라인 중단
   */
  abort(): void {
    this.abortController.abort();
  }

  /**
   * 중단 여부 확인
   */
  isAborted(): boolean {
    return this.abortController.signal.aborted;
  }

  /**
   * 옵션 콜백 호출
   */
  notifyProgress(currentStep: PipelineStep): void {
    this.options?.onProgress?.(this.getProgress(currentStep));
  }

  notifyStepComplete<T>(step: PipelineStep, result: T): void {
    this.options?.onStepComplete?.(step, result);
  }

  notifyError(step: PipelineStep, error: { code: string; message: string }): void {
    this.options?.onError?.(step, error);
  }
}
