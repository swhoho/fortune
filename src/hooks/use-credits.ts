/**
 * 크레딧 관련 TanStack Query 훅
 * Task 23: 크레딧 연동
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SERVICE_CREDITS } from '@/lib/stripe';
import { handleApiError } from '@/lib/errors/handler';

// 하위 호환성을 위해 re-export
export { isInsufficientCreditsError } from '@/lib/errors/handler';

/** 크레딧 확인 응답 타입 */
interface CreditCheckResponse {
  sufficient?: boolean;
  current: number;
  required?: number;
  remaining?: number;
  shortfall?: number;
}

/** Query Keys */
export const creditKeys = {
  all: ['credits'] as const,
  balance: () => [...creditKeys.all, 'balance'] as const,
  check: (required?: number) => [...creditKeys.all, 'check', required] as const,
};

/**
 * 크레딧 잔액 조회 훅
 */
export function useCreditsBalance() {
  return useQuery<CreditCheckResponse>({
    queryKey: creditKeys.balance(),
    queryFn: async () => {
      const res = await fetch('/api/user/credits/check');
      if (!res.ok) {
        await handleApiError(res, '크레딧 조회 실패');
      }
      return res.json();
    },
    staleTime: 30 * 1000, // 30초간 캐시
    refetchOnWindowFocus: true,
  });
}

/**
 * 크레딧 충분 여부 확인 훅
 * @param required 필요한 크레딧 양
 */
export function useCreditsCheck(required: number) {
  return useQuery<CreditCheckResponse>({
    queryKey: creditKeys.check(required),
    queryFn: async () => {
      const res = await fetch(`/api/user/credits/check?required=${required}`);
      if (!res.ok) {
        await handleApiError(res, '크레딧 확인 실패');
      }
      return res.json();
    },
    staleTime: 10 * 1000, // 10초간 캐시
    enabled: required > 0,
  });
}

/**
 * 프로필 리포트 크레딧 확인 훅
 * SERVICE_CREDITS.profileReport (50C) 기준
 */
export function useReportCreditsCheck() {
  return useCreditsCheck(SERVICE_CREDITS.profileReport);
}

/**
 * 섹션 재분석 크레딧 확인 훅
 * SERVICE_CREDITS.sectionReanalysis (5C) 기준
 */
export function useSectionReanalysisCreditsCheck() {
  return useCreditsCheck(SERVICE_CREDITS.sectionReanalysis);
}

/**
 * 크레딧 캐시 무효화 훅
 * 크레딧 차감 후 잔액 갱신에 사용
 */
export function useInvalidateCredits() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: creditKeys.all });
  };
}

/**
 * 크레딧 차감 시뮬레이션 훅 (낙관적 업데이트용)
 * @param amount 차감할 크레딧 양
 */
export function useOptimisticCreditDeduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      // 실제 차감은 API에서 처리
      return { amount };
    },
    onMutate: async (amount) => {
      // 이전 캐시 스냅샷
      await queryClient.cancelQueries({ queryKey: creditKeys.balance() });
      const previousBalance = queryClient.getQueryData<CreditCheckResponse>(creditKeys.balance());

      // 낙관적 업데이트
      if (previousBalance) {
        queryClient.setQueryData<CreditCheckResponse>(creditKeys.balance(), {
          ...previousBalance,
          current: previousBalance.current - amount,
        });
      }

      return { previousBalance };
    },
    onError: (_err, _amount, context) => {
      // 에러 시 롤백
      if (context?.previousBalance) {
        queryClient.setQueryData(creditKeys.balance(), context.previousBalance);
      }
    },
    onSettled: () => {
      // 완료 후 서버 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: creditKeys.all });
    },
  });
}
