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

/** 단계별 기본 타임아웃 (밀리초) - AI 분석은 5분, 기타는 1분 */
export const DEFAULT_STEP_TIMEOUTS: Record<PipelineStep, number> = {
  manseryeok: 300000, // 5분
  jijanggan: 60000, // 1분
  basic_analysis: 300000, // 5분 (Gemini API 응답 대기)
  personality: 300000, // 5분
  aptitude: 300000, // 5분
  fortune: 300000, // 5분
  scoring: 60000, // 1분
  visualization: 300000, // 5분
  saving: 60000, // 1분
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
