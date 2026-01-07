/**
 * AI 상담(컨설팅) 관련 TanStack Query 훅
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import type {
  ConsultationSession,
  GetSessionsResponse,
  GetMessagesResponse,
  CreateSessionResponse,
  SendMessageResponse,
  SendMessageRequest,
} from '@/types/consultation';

/**
 * 세션 목록 조회 훅
 * @param profileId - 프로필 ID
 */
export function useConsultationSessions(profileId: string | null) {
  return useQuery<ConsultationSession[]>({
    queryKey: ['consultation', 'sessions', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const res = await fetch(`/api/profiles/${profileId}/consultation/sessions`);

      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('세션 목록을 불러올 수 없습니다');
      }

      const json: GetSessionsResponse = await res.json();
      return json.data?.sessions || [];
    },
    enabled: !!profileId,
    staleTime: 30000, // 30초
    refetchOnWindowFocus: true,
  });
}

/**
 * 세션 메시지 조회 훅
 * @param profileId - 프로필 ID
 * @param sessionId - 세션 ID
 */
export function useConsultationMessages(profileId: string | null, sessionId: string | null) {
  return useQuery<GetMessagesResponse['data'] | null>({
    queryKey: ['consultation', 'messages', sessionId],
    queryFn: async () => {
      if (!profileId || !sessionId) return null;

      const res = await fetch(
        `/api/profiles/${profileId}/consultation/sessions/${sessionId}/messages`
      );

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('메시지를 불러올 수 없습니다');
      }

      const json: GetMessagesResponse = await res.json();
      return json.data || null;
    },
    enabled: !!profileId && !!sessionId,
    staleTime: 10000, // 10초
    refetchOnWindowFocus: true,
  });
}

/**
 * 새 세션 생성 훅
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation<CreateSessionResponse['data'], Error, { profileId: string; title?: string }>({
    mutationFn: async ({ profileId, title }) => {
      const res = await fetch(`/api/profiles/${profileId}/consultation/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const json: CreateSessionResponse = await res.json();

      if (!res.ok) {
        const error = json as { error?: string; code?: string };
        // 크레딧 부족 에러 특별 처리
        if (res.status === 402 || error.code === 'INSUFFICIENT_CREDITS') {
          const insufficientError = new Error(error.error || '크레딧이 부족합니다');
          (insufficientError as Error & { code: string }).code = 'INSUFFICIENT_CREDITS';
          throw insufficientError;
        }
        throw new Error(error.error || '세션 생성에 실패했습니다');
      }

      return json.data!;
    },
    onSuccess: (_, variables) => {
      // 세션 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ['consultation', 'sessions', variables.profileId],
      });
      // 크레딧 갱신
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });
}

/**
 * 메시지 전송 훅 (중복 요청 방지 적용)
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);

  return useMutation<
    SendMessageResponse['data'],
    Error,
    {
      profileId: string;
      sessionId: string;
      content: string;
      messageType: 'user_question' | 'user_clarification';
      skipClarification?: boolean;
    }
  >({
    mutationFn: async ({ profileId, sessionId, content, messageType, skipClarification }) => {
      // 중복 요청 방지
      if (isSubmittingRef.current) {
        throw new Error('이미 요청 중입니다');
      }
      isSubmittingRef.current = true;

      try {
        const res = await fetch(
          `/api/profiles/${profileId}/consultation/sessions/${sessionId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              messageType,
              skipClarification,
            } as SendMessageRequest),
          }
        );

        const json: SendMessageResponse = await res.json();

        if (!res.ok) {
          const error = json as { error?: string; code?: string };
          throw new Error(error.error || '메시지 전송에 실패했습니다');
        }

        return json.data!;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    onSuccess: (data, variables) => {
      // 메시지 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ['consultation', 'messages', variables.sessionId],
      });
      // 세션 목록 갱신 (상태/질문 수 변경됨)
      queryClient.invalidateQueries({
        queryKey: ['consultation', 'sessions', variables.profileId],
      });
    },
  });
}

/**
 * 캐시 무효화 훅
 */
export function useInvalidateConsultation() {
  const queryClient = useQueryClient();

  return {
    invalidateSessions: (profileId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['consultation', 'sessions', profileId],
      });
    },
    invalidateMessages: (sessionId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['consultation', 'messages', sessionId],
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation'] });
    },
  };
}
