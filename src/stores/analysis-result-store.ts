/**
 * 분석 결과 상태 관리 스토어
 * - 분석 결과 데이터
 * - 사주 데이터 (pillars, daewun, jijanggan)
 * - 후속 질문 상태
 */
import { create } from 'zustand';
import type { LoadingStep, PillarsHanja, DaewunItem, Jijanggan } from '@/types/saju';
import type { SajuAnalysisResult } from '@/lib/ai/types';

/** 질문 아이템 타입 */
export interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

/** 분석 결과 상태 인터페이스 */
interface AnalysisResultState {
  // 로딩 상태
  isLoading: boolean;
  loadingStep: LoadingStep | null;

  // 분석 결과
  analysisResult: SajuAnalysisResult | null;
  pillarImage: string | null;
  pillarsData: PillarsHanja | null;
  daewunData: DaewunItem[] | null;
  jijangganData: Jijanggan | null;

  // 에러
  error: string | null;

  // 후속 질문 상태
  questions: QuestionItem[];
  isQuestionLoading: boolean;
  questionError: string | null;

  // 액션
  setLoading: (isLoading: boolean, step?: LoadingStep | null) => void;
  setAnalysisResult: (result: SajuAnalysisResult) => void;
  setPillarImage: (image: string) => void;
  setPillarsData: (pillars: PillarsHanja, daewun: DaewunItem[], jijanggan: Jijanggan) => void;
  setError: (error: string | null) => void;
  resetAnalysis: () => void;

  // 후속 질문 액션
  setQuestions: (questions: QuestionItem[]) => void;
  addQuestion: (question: QuestionItem) => void;
  setQuestionLoading: (loading: boolean) => void;
  setQuestionError: (error: string | null) => void;
}

/** 초기 상태 */
const initialState = {
  isLoading: false,
  loadingStep: null,
  analysisResult: null,
  pillarImage: null,
  pillarsData: null,
  daewunData: null,
  jijangganData: null,
  error: null,
  questions: [] as QuestionItem[],
  isQuestionLoading: false,
  questionError: null,
};

/**
 * 분석 결과 스토어
 * @example
 * const { analysisResult, setAnalysisResult } = useAnalysisResultStore();
 * setAnalysisResult(result);
 */
export const useAnalysisResultStore = create<AnalysisResultState>((set) => ({
  ...initialState,

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

  resetAnalysis: () => set(initialState),

  // 후속 질문 액션
  setQuestions: (questions) => set({ questions }),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
      questionError: null,
    })),

  setQuestionLoading: (loading) => set({ isQuestionLoading: loading }),

  setQuestionError: (error) => set({ questionError: error, isQuestionLoading: false }),
}));
