/**
 * 후속 질문 관련 TanStack Query 훅
 * v2.0: 프로필 리포트 기반 질문
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/** 질문 히스토리 아이템 (프로필별) */
export interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

/** 전체 질문 히스토리 아이템 */
export interface AllQuestionItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  profileId: string;
  profileName: string;
}

/** 질문 요청 데이터 */
export interface AskQuestionData {
  profileId: string;
  question: string;
}

/** 질문 응답 데이터 */
export interface AskQuestionResponse {
  questionId: string;
  answer: string;
  creditsUsed: number;
  remainingCredits: number;
}

/**
 * 프로필별 질문 히스토리 조회 훅
 */
export function useQuestionHistory(profileId: string | null) {
  return useQuery<QuestionItem[]>({
    queryKey: ['questions', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(`/api/profiles/${profileId}/report/question`);
      if (!res.ok) {
        throw new Error('질문 히스토리 로드 실패');
      }
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!profileId,
  });
}

/**
 * 전체 질문 히스토리 조회 훅 (모든 프로필)
 */
export function useAllQuestions() {
  return useQuery<AllQuestionItem[]>({
    queryKey: ['questions', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/user/questions');
      if (!res.ok) {
        // 404면 빈 배열 반환 (아직 질문 없음)
        if (res.status === 404) return [];
        throw new Error('질문 히스토리 로드 실패');
      }
      const json = await res.json();
      return json.data || [];
    },
  });
}

/**
 * AI 후속 질문 훅
 */
export function useAskQuestion() {
  const queryClient = useQueryClient();

  return useMutation<AskQuestionResponse, Error, AskQuestionData>({
    mutationFn: async ({ profileId, question }) => {
      const res = await fetch(`/api/profiles/${profileId}/report/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '질문 실패');
      }

      const json = await res.json();
      return json.data;
    },
    onSuccess: (_, variables) => {
      // 질문 히스토리 갱신
      queryClient.invalidateQueries({ queryKey: ['questions', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'all'] });
      // 크레딧 갱신
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
