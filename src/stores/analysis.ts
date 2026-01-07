/**
 * 사주 분석 상태 관리 스토어
 */
import { create } from 'zustand';
import type {
  FocusArea,
  SajuInput,
  LoadingStep,
  PillarsHanja,
  DaewunItem,
  Jijanggan,
} from '@/types/saju';
import type { ProfileResponse } from '@/types/profile';
import type {
  SajuAnalysisResult,
  YearlyAnalysisResult,
  PipelineStep,
  StepStatus,
  PipelineIntermediateResults,
} from '@/lib/ai/types';

/** 신년 분석 로딩 단계 (Task 20 추가) */
type YearlyLoadingStep = 'manseryeok' | 'ai_analysis' | 'saving' | 'complete';

/** 온보딩 단계 (확장) */
type OnboardingStep = 'info' | 'focus' | 'question' | 'payment' | 'processing' | 'result';

/** 질문 아이템 타입 (Task 16 추가) */
interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

/** 파이프라인 에러 타입 (Task 6 추가) */
interface PipelineError {
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
  daewun_analysis: 'pending',
  scoring: 'pending',
  visualization: 'pending',
  saving: 'pending',
  complete: 'pending',
});

/** 분석 요청 상태 */
interface AnalysisState {
  // 온보딩 단계
  currentStep: OnboardingStep;

  // 사용자 입력
  sajuInput: SajuInput | null;
  focusArea: FocusArea | null;
  question: string;

  // 로딩 상태 (Task 8 추가)
  isLoading: boolean;
  loadingStep: LoadingStep | null;

  // 분석 결과 (Task 8 추가)
  analysisResult: SajuAnalysisResult | null;
  pillarImage: string | null; // Base64 이미지
  pillarsData: PillarsHanja | null;
  daewunData: DaewunItem[] | null;
  jijangganData: Jijanggan | null;

  // 에러 (Task 8 추가)
  error: string | null;

  // 후속 질문 상태 (Task 16 추가)
  questions: QuestionItem[];
  isQuestionLoading: boolean;
  questionError: string | null;

  // 신년 분석 상태 (Task 20 추가)
  targetYear: number | null;
  existingAnalysisId: string | null;

  // Task 24.1: 프로필 연동
  selectedProfileId: string | null;
  selectedProfile: ProfileResponse | null;
  yearlyResult: YearlyAnalysisResult | null;
  isYearlyLoading: boolean;
  yearlyLoadingStep: YearlyLoadingStep | null;
  yearlyError: string | null;

  // 기존 액션
  setStep: (step: OnboardingStep) => void;
  setSajuInput: (input: SajuInput) => void;
  setFocusArea: (area: FocusArea) => void;
  setQuestion: (question: string) => void;
  reset: () => void;

  // 새로운 액션 (Task 8 추가)
  setLoading: (isLoading: boolean, step?: LoadingStep | null) => void;
  setAnalysisResult: (result: SajuAnalysisResult) => void;
  setPillarImage: (image: string) => void;
  setPillarsData: (pillars: PillarsHanja, daewun: DaewunItem[], jijanggan: Jijanggan) => void;
  setError: (error: string | null) => void;
  resetAnalysis: () => void;

  // 후속 질문 액션 (Task 16 추가)
  setQuestions: (questions: QuestionItem[]) => void;
  addQuestion: (question: QuestionItem) => void;
  setQuestionLoading: (loading: boolean) => void;
  setQuestionError: (error: string | null) => void;

  // 신년 분석 액션 (Task 20 추가)
  setTargetYear: (year: number) => void;
  setExistingAnalysisId: (id: string | null) => void;

  // Task 24.1: 프로필 연동 액션
  setSelectedProfile: (profile: ProfileResponse | null) => void;
  clearSelectedProfile: () => void;
  setYearlyResult: (result: YearlyAnalysisResult) => void;
  setYearlyLoading: (isLoading: boolean, step?: YearlyLoadingStep | null) => void;
  setYearlyError: (error: string | null) => void;
  resetYearly: () => void;

  // ============================================
  // Task 6: 멀티스텝 파이프라인 상태
  // ============================================

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

  // 파이프라인 액션
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

const initialState = {
  currentStep: 'info' as OnboardingStep,
  sajuInput: null,
  focusArea: null,
  question: '',
  // Task 8 추가 초기값
  isLoading: false,
  loadingStep: null,
  analysisResult: null,
  pillarImage: null,
  pillarsData: null,
  daewunData: null,
  jijangganData: null,
  error: null,
  // Task 16 추가 초기값
  questions: [] as QuestionItem[],
  isQuestionLoading: false,
  questionError: null,
  // Task 20 추가 초기값
  targetYear: null,
  existingAnalysisId: null,
  // Task 24.1: 프로필 연동 초기값
  selectedProfileId: null,
  selectedProfile: null,
  yearlyResult: null,
  isYearlyLoading: false,
  yearlyLoadingStep: null,
  yearlyError: null,
  // Task 6: 파이프라인 초기값
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

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,

  // 기존 액션
  setStep: (step) => set({ currentStep: step }),

  setSajuInput: (input) => set({ sajuInput: input }),

  setFocusArea: (area) => set({ focusArea: area }),

  setQuestion: (question) => set({ question }),

  reset: () => set(initialState),

  // 새로운 액션 (Task 8 추가)
  setLoading: (isLoading, step = null) => set({ isLoading, loadingStep: step }),

  setAnalysisResult: (result) => set({ analysisResult: result }),

  setPillarImage: (image) => set({ pillarImage: image }),

  setPillarsData: (pillars, daewun, jijanggan) =>
    set({
      pillarsData: pillars,
      daewunData: daewun,
      jijangganData: jijanggan,
    }),

  setError: (error) => set({ error, isLoading: false }),

  resetAnalysis: () =>
    set({
      isLoading: false,
      loadingStep: null,
      analysisResult: null,
      pillarImage: null,
      pillarsData: null,
      daewunData: null,
      jijangganData: null,
      error: null,
      questions: [],
      isQuestionLoading: false,
      questionError: null,
    }),

  // 후속 질문 액션 (Task 16 추가)
  setQuestions: (questions) => set({ questions }),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
      questionError: null,
    })),

  setQuestionLoading: (loading) => set({ isQuestionLoading: loading }),

  setQuestionError: (error) => set({ questionError: error, isQuestionLoading: false }),

  // 신년 분석 액션 (Task 20 추가)
  setTargetYear: (year) => set({ targetYear: year }),

  setExistingAnalysisId: (id) => set({ existingAnalysisId: id }),

  setYearlyResult: (result) => set({ yearlyResult: result }),

  setYearlyLoading: (isLoading, step = null) =>
    set({ isYearlyLoading: isLoading, yearlyLoadingStep: step }),

  setYearlyError: (error) => set({ yearlyError: error, isYearlyLoading: false }),

  resetYearly: () =>
    set({
      targetYear: null,
      existingAnalysisId: null,
      selectedProfileId: null,
      selectedProfile: null,
      yearlyResult: null,
      isYearlyLoading: false,
      yearlyLoadingStep: null,
      yearlyError: null,
    }),

  // Task 24.1: 프로필 연동 액션 구현
  setSelectedProfile: (profile) =>
    set({
      selectedProfile: profile,
      selectedProfileId: profile?.id ?? null,
    }),

  clearSelectedProfile: () =>
    set({
      selectedProfile: null,
      selectedProfileId: null,
    }),

  // ============================================
  // Task 6: 멀티스텝 파이프라인 액션
  // ============================================

  startPipeline: () =>
    set({
      isPipelineRunning: true,
      currentPipelineStep: 'manseryeok',
      stepStatuses: getInitialStepStatuses(),
      progressPercent: 0,
      estimatedTimeRemaining: 60, // 예상 60초
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
      // 실패한 단계부터 pending으로 리셋
      const steps: PipelineStep[] = [
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
      const retryIndex = steps.indexOf(step);
      const newStatuses = { ...state.stepStatuses };

      steps.slice(retryIndex).forEach((s) => {
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

  resetPipeline: () =>
    set({
      isPipelineRunning: false,
      currentPipelineStep: null,
      stepStatuses: getInitialStepStatuses(),
      progressPercent: 0,
      estimatedTimeRemaining: 0,
      intermediateResults: {},
      pipelineStartedAt: null,
      stepDurations: {},
      pipelineError: null,
    }),
}));
