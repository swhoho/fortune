/**
 * 사주 분석 상태 관리 스토어
 */
import { create } from 'zustand';
import type { FocusArea, SajuInput } from '@/types/saju';

/** 온보딩 단계 */
type OnboardingStep = 'info' | 'focus' | 'question' | 'payment';

/** 분석 요청 상태 */
interface AnalysisState {
  // 온보딩 단계
  currentStep: OnboardingStep;

  // 사용자 입력
  sajuInput: SajuInput | null;
  focusArea: FocusArea | null;
  question: string;

  // 액션
  setStep: (step: OnboardingStep) => void;
  setSajuInput: (input: SajuInput) => void;
  setFocusArea: (area: FocusArea) => void;
  setQuestion: (question: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'info' as OnboardingStep,
  sajuInput: null,
  focusArea: null,
  question: '',
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setSajuInput: (input) => set({ sajuInput: input }),

  setFocusArea: (area) => set({ focusArea: area }),

  setQuestion: (question) => set({ question }),

  reset: () => set(initialState),
}));
