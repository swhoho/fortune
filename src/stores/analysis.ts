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
import type { SajuAnalysisResult, YearlyAnalysisResult } from '@/lib/ai/types';

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
  setYearlyResult: (result: YearlyAnalysisResult) => void;
  setYearlyLoading: (isLoading: boolean, step?: YearlyLoadingStep | null) => void;
  setYearlyError: (error: string | null) => void;
  resetYearly: () => void;
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
  yearlyResult: null,
  isYearlyLoading: false,
  yearlyLoadingStep: null,
  yearlyError: null,
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
      yearlyResult: null,
      isYearlyLoading: false,
      yearlyLoadingStep: null,
      yearlyError: null,
    }),
}));
