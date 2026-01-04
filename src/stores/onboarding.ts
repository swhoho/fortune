/**
 * 온보딩 상태 관리 스토어
 * Task 20: 신년 분석 페이지에서 사용
 */
import { create } from 'zustand';
import type { PillarsHanja, DaewunItem } from '@/types/saju';

interface OnboardingState {
  // 생년월일 정보
  birthDate: string | null;
  birthTime: string | null;
  timezone: string;
  isLunar: boolean;
  gender: 'male' | 'female' | null;

  // 사주 데이터 (만세력 결과)
  pillars: PillarsHanja | null;
  daewun: DaewunItem[] | null;

  // 액션
  setBirthInfo: (info: {
    birthDate: string;
    birthTime?: string;
    timezone?: string;
    isLunar?: boolean;
    gender: 'male' | 'female';
  }) => void;
  setPillars: (pillars: PillarsHanja) => void;
  setDaewun: (daewun: DaewunItem[]) => void;
  reset: () => void;
}

const initialState = {
  birthDate: null,
  birthTime: null,
  timezone: 'Asia/Seoul',
  isLunar: false,
  gender: null as 'male' | 'female' | null,
  pillars: null,
  daewun: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setBirthInfo: (info) =>
    set({
      birthDate: info.birthDate,
      birthTime: info.birthTime ?? null,
      timezone: info.timezone ?? 'Asia/Seoul',
      isLunar: info.isLunar ?? false,
      gender: info.gender,
    }),

  setPillars: (pillars) => set({ pillars }),

  setDaewun: (daewun) => set({ daewun }),

  reset: () => set(initialState),
}));
