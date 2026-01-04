/**
 * 파이프라인 전용 타입 정의
 * v2.1: AnalysisPipeline 클래스 분해
 */

import type {
  PipelineStep,
  StepStatus,
  PipelineProgress,
  PipelineOptions,
  PipelineResponse,
  PipelineIntermediateResults,
  GeminiApiError,
  SupportedLanguage,
} from '../types';

// 기존 타입 re-export
export type {
  PipelineStep,
  StepStatus,
  PipelineProgress,
  PipelineOptions,
  PipelineResponse,
  PipelineIntermediateResults,
  GeminiApiError,
  SupportedLanguage,
};

/** 단계별 기본 타임아웃 (밀리초) */
export const DEFAULT_STEP_TIMEOUTS: Record<PipelineStep, number> = {
  manseryeok: 10000, // 10초
  jijanggan: 5000, // 5초
  basic_analysis: 15000, // 15초
  personality: 12000, // 12초
  aptitude: 12000, // 12초
  fortune: 12000, // 12초
  scoring: 2000, // 2초
  visualization: 8000, // 8초
  saving: 3000, // 3초
  complete: 0,
};

/** 단계 순서 (인덱스 계산용) */
export const PIPELINE_STEPS: PipelineStep[] = [
  'manseryeok',
  'jijanggan',
  'basic_analysis',
  'personality',
  'aptitude',
  'fortune',
  'scoring',
  'visualization',
  'saving',
  'complete',
];

/** 초기 단계 상태 */
export const getInitialStepStatuses = (): Record<PipelineStep, StepStatus> => ({
  manseryeok: 'pending',
  jijanggan: 'pending',
  basic_analysis: 'pending',
  personality: 'pending',
  aptitude: 'pending',
  fortune: 'pending',
  scoring: 'pending',
  visualization: 'pending',
  saving: 'pending',
  complete: 'pending',
});

/** 재시도 불가능한 에러 코드 */
export const NON_RETRYABLE_ERROR_CODES = [
  'INVALID_INPUT',
  'INVALID_API_KEY',
  'MODEL_NOT_FOUND',
] as const;

/** 파이프라인 컨텍스트 인터페이스 */
export interface IPipelineContext {
  intermediateResults: PipelineIntermediateResults;
  stepStatuses: Record<PipelineStep, StepStatus>;
  stepDurations: Partial<Record<PipelineStep, number>>;
  startedAt: Date | null;
  pythonApiUrl: string;

  updateStepStatus(step: PipelineStep, status: StepStatus): void;
  getProgress(currentStep: PipelineStep): PipelineProgress;
  getCurrentFailedStep(): PipelineStep | undefined;
}

/** 단계 실행기 인터페이스 */
export interface IStepExecutor {
  execute<T>(
    step: PipelineStep,
    executor: () => Promise<T>,
    options?: { skipRetry?: boolean }
  ): Promise<T>;
}

/** 재시도 관리자 인터페이스 */
export interface IRetryManager {
  executeWithRetry<T>(executor: () => Promise<T>, step: PipelineStep): Promise<T>;
}

/** 진행률 추적기 인터페이스 */
export interface IProgressTracker {
  getProgress(currentStep: PipelineStep): PipelineProgress;
  estimateRemainingTime(currentIndex: number): number;
}
