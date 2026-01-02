/**
 * 사용자 관련 TanStack Query 훅
 */
import { useQuery } from '@tanstack/react-query';

/** 사용자 프로필 타입 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  createdAt: string;
}

/** 분석 기록 아이템 타입 */
export interface AnalysisItem {
  id: string;
  type: string;
  focusArea: string | null;
  createdAt: string;
  creditsUsed: number;
}

/** 분석 기록 응답 타입 */
export interface AnalysisListResponse {
  analyses: AnalysisItem[];
}

/**
 * 사용자 프로필 조회 훅
 */
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        throw new Error('프로필 로드 실패');
      }
      return res.json();
    },
  });
}

/**
 * 분석 기록 조회 훅
 */
export function useAnalysisList() {
  return useQuery<AnalysisListResponse>({
    queryKey: ['analysis', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/analysis/list');
      if (!res.ok) {
        throw new Error('분석 기록 로드 실패');
      }
      return res.json();
    },
  });
}
