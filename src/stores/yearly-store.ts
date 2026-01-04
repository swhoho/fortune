/**
 * 신년 분석 상태 관리 스토어
 * - 신년 분석 전용 상태
 * - 프로필 연동 상태
 * - 신년 분석 결과 및 로딩 상태
 */
import { create } from 'zustand';
import type { ProfileResponse } from '@/types/profile';
import type { YearlyAnalysisResult } from '@/lib/ai/types';

/** 신년 분석 로딩 단계 (세분화된 진행 상태) */
export type YearlyLoadingStep =
  | 'init' // 초기화
  | 'fetch_saju' // 사주 정보 불러오기
  | 'build_prompt' // 신년 분석 준비
  | 'ai_analysis' // AI 운세 분석 중
  | 'save_result' // 결과 저장
  | 'complete'; // 완료

/** 신년 분석 상태 인터페이스 */
interface YearlyState {
  // 상태
  targetYear: number | null;
  existingAnalysisId: string | null;
  selectedProfileId: string | null;
  selectedProfile: ProfileResponse | null;
  yearlyResult: YearlyAnalysisResult | null;
  isYearlyLoading: boolean;
  yearlyLoadingStep: YearlyLoadingStep | null;
  yearlyError: string | null;

  // 액션
  setTargetYear: (year: number) => void;
  setExistingAnalysisId: (id: string | null) => void;
  setSelectedProfile: (profile: ProfileResponse | null) => void;
  clearSelectedProfile: () => void;
  setYearlyResult: (result: YearlyAnalysisResult) => void;
  setYearlyLoading: (isLoading: boolean, step?: YearlyLoadingStep | null) => void;
  setYearlyError: (error: string | null) => void;
  resetYearly: () => void;
}

/** 초기 상태 */
const initialState = {
  targetYear: null,
  existingAnalysisId: null,
  selectedProfileId: null,
  selectedProfile: null,
  yearlyResult: null,
  isYearlyLoading: false,
  yearlyLoadingStep: null,
  yearlyError: null,
};

/**
 * 신년 분석 스토어
 * @example
 * const { targetYear, setTargetYear } = useYearlyStore();
 * setTargetYear(2025);
 */
export const useYearlyStore = create<YearlyState>((set) => ({
  ...initialState,

  setTargetYear: (year) => set({ targetYear: year }),

  setExistingAnalysisId: (id) => set({ existingAnalysisId: id }),

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

  setYearlyResult: (result) => set({ yearlyResult: result }),

  setYearlyLoading: (isLoading, step = null) =>
    set({ isYearlyLoading: isLoading, yearlyLoadingStep: step }),

  setYearlyError: (error) => set({ yearlyError: error, isYearlyLoading: false }),

  resetYearly: () => set(initialState),
}));
