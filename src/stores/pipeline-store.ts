/**
 * 분석 파이프라인 실행 상태 관리 스토어
 * - 멀티스텝 파이프라인 진행 상태
 * - 단계별 상태 및 진행률
 * - 에러 처리 및 재시도 로직
 */
import { create } from 'zustand';
import type {
  PipelineStep,
  StepStatus,
  PipelineIntermediateResults,
} from '@/lib/ai/types';

/** 파이프라인 에러 타입 */
export interface PipelineError {
  step: PipelineStep;
  error: string;
  retryable: boolean;
}

/** 초기 파이프라인 단계 상태 */
const getInitialStepStatuses = (): Record<PipelineStep, StepStatus> => ({
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

/** 파이프라인 상태 인터페이스 */
interface PipelineState {
  // 파이프라인 진행 상태
  isPipelineRunning: boolean;
  currentPipelineStep: PipelineStep | null;
  stepStatuses: Record<PipelineStep, StepStatus>;
  progressPercent: number;
  estimatedTimeRemaining: number;

  // 중간 결과 (단계별 누적)
  intermediateResults: PipelineIntermediateResults;

  // 파이프라인 메타데이터
  pipelineStartedAt: Date | null;
  stepDurations: Partial<Record<PipelineStep, number>>;

  // 에러 상태 (복구 가능)
  pipelineError: PipelineError | null;

  // 액션
  startPipeline: () => void;
  updateStepStatus: (step: PipelineStep, status: StepStatus) => void;
  updatePipelineProgress: (step: PipelineStep, percent: number, remaining: number) => void;
  setIntermediateResult: <K extends keyof PipelineIntermediateResults>(
    key: K,
    value: PipelineIntermediateResults[K]
  ) => void;
  recordStepDuration: (step: PipelineStep, duration: number) => void;
  setPipelineError: (step: PipelineStep, error: string, retryable?: boolean) => void;
  retryFromStep: (step: PipelineStep) => void;
  completePipeline: () => void;
  resetPipeline: () => void;
}

/** 초기 상태 */
const initialState = {
  isPipelineRunning: false,
  currentPipelineStep: null as PipelineStep | null,
  stepStatuses: getInitialStepStatuses(),
  progressPercent: 0,
  estimatedTimeRemaining: 0,
  intermediateResults: {} as PipelineIntermediateResults,
  pipelineStartedAt: null as Date | null,
  stepDurations: {} as Partial<Record<PipelineStep, number>>,
  pipelineError: null as PipelineError | null,
};

/** 파이프라인 단계 순서 */
const PIPELINE_STEPS: PipelineStep[] = [
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

/**
 * 파이프라인 스토어
 * @example
 * const { isPipelineRunning, startPipeline } = usePipelineStore();
 * startPipeline();
 */
export const usePipelineStore = create<PipelineState>((set) => ({
  ...initialState,

  startPipeline: () =>
    set({
      isPipelineRunning: true,
      currentPipelineStep: 'manseryeok',
      stepStatuses: getInitialStepStatuses(),
      progressPercent: 0,
      estimatedTimeRemaining: 60,
      pipelineStartedAt: new Date(),
      pipelineError: null,
      intermediateResults: {},
      stepDurations: {},
    }),

  updateStepStatus: (step, status) =>
    set((state) => ({
      currentPipelineStep: step,
      stepStatuses: { ...state.stepStatuses, [step]: status },
    })),

  updatePipelineProgress: (step, percent, remaining) =>
    set({
      currentPipelineStep: step,
      progressPercent: percent,
      estimatedTimeRemaining: remaining,
    }),

  setIntermediateResult: (key, value) =>
    set((state) => ({
      intermediateResults: {
        ...state.intermediateResults,
        [key]: value,
      },
    })),

  recordStepDuration: (step, duration) =>
    set((state) => ({
      stepDurations: { ...state.stepDurations, [step]: duration },
    })),

  setPipelineError: (step, error, retryable = true) =>
    set({
      isPipelineRunning: false,
      pipelineError: { step, error, retryable },
    }),

  retryFromStep: (step) =>
    set((state) => {
      const retryIndex = PIPELINE_STEPS.indexOf(step);
      const newStatuses = { ...state.stepStatuses };

      PIPELINE_STEPS.slice(retryIndex).forEach((s) => {
        newStatuses[s] = 'pending';
      });

      return {
        isPipelineRunning: true,
        stepStatuses: newStatuses,
        currentPipelineStep: step,
        pipelineError: null,
      };
    }),

  completePipeline: () =>
    set((state) => ({
      isPipelineRunning: false,
      currentPipelineStep: 'complete',
      stepStatuses: { ...state.stepStatuses, complete: 'completed' },
      progressPercent: 100,
      estimatedTimeRemaining: 0,
    })),

  resetPipeline: () => set(initialState),
}));
