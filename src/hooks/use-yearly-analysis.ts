/**
 * 신년 분석 관련 TanStack Query 훅
 * 기존 분석 존재 여부 확인
 */
import { useQuery } from '@tanstack/react-query';

/** 기존 분석 조회 응답 타입 */
interface ExistingAnalysisResponse {
  exists: boolean;
  analysisId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/** Query Keys */
export const yearlyAnalysisKeys = {
  all: ['yearly-analysis'] as const,
  check: (profileId: string, year: number) =>
    [...yearlyAnalysisKeys.all, 'check', profileId, year] as const,
};

/**
 * 기존 신년 분석 존재 여부 확인 훅
 * @param profileId 프로필 ID
 * @param year 분석 연도
 */
export function useExistingYearlyAnalysis(profileId: string | null, year: number | null) {
  return useQuery<ExistingAnalysisResponse>({
    queryKey: yearlyAnalysisKeys.check(profileId ?? '', year ?? 0),
    queryFn: async () => {
      const res = await fetch(`/api/analysis/yearly/check?profileId=${profileId}&year=${year}`);
      if (!res.ok) {
        return { exists: false };
      }
      return res.json();
    },
    enabled: !!profileId && !!year,
    staleTime: 30000, // 30초 캐싱
    refetchOnWindowFocus: false,
  });
}
