/**
 * 온보딩 플로우 상태 관리 스토어
 * - 분석 플로우의 단계별 진행 상태
 * - 사용자 입력 데이터 (사주 정보, 집중 영역, 질문)
 */
import { create } from 'zustand';
import type { FocusArea, SajuInput } from '@/types/saju';

/** 온보딩 단계 */
export type OnboardingStep = 'info' | 'focus' | 'question' | 'payment' | 'processing' | 'result';

/** 온보딩 상태 인터페이스 */
interface OnboardingState {
  // 상태
  currentStep: OnboardingStep;
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

/** 초기 상태 */
const initialState = {
  currentStep: 'info' as OnboardingStep,
  sajuInput: null,
  focusArea: null,
  question: '',
};

/**
 * 온보딩 스토어
 * @example
 * const { currentStep, setStep } = useOnboardingStore();
 * setStep('focus');
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setSajuInput: (input) => set({ sajuInput: input }),

  setFocusArea: (area) => set({ focusArea: area }),

  setQuestion: (question) => set({ question }),

  reset: () => set(initialState),
}));
