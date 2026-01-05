/**
 * 후속 질문 관련 TanStack Query 훅
 * v2.1: 비동기/폴링 방식 지원
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

/** 질문 상태 타입 */
export type QuestionStatus = 'generating' | 'completed' | 'failed';

/** 질문 히스토리 아이템 (프로필별) */
export interface QuestionItem {
  id: string;
  question: string;
  answer: string | null;
  status?: QuestionStatus;
  error_message?: string;
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

/** 질문 응답 데이터 (비동기) */
export interface AskQuestionResponse {
  questionId: string;
  status: QuestionStatus;
  pollUrl: string;
  creditsUsed: number;
  remainingCredits: number;
}

/** 폴링 응답 데이터 */
export interface QuestionPollResponse {
  questionId: string;
  question: string;
  status: QuestionStatus;
  answer: string | null;
  error: string | null;
  createdAt: string;
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
 * AI 후속 질문 훅 (비동기/폴링 방식)
 */
export function useAskQuestion() {
  const queryClient = useQueryClient();
  const [pollingQuestionId, setPollingQuestionId] = useState<string | null>(null);
  const [pollingProfileId, setPollingProfileId] = useState<string | null>(null);
  const [pollResult, setPollResult] = useState<QuestionPollResponse | null>(null);

  // 폴링 로직
  useEffect(() => {
    if (!pollingQuestionId || !pollingProfileId) return;

    let attempts = 0;
    const maxAttempts = 60; // 최대 2분 (2초 간격)
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/profiles/${pollingProfileId}/report/question/${pollingQuestionId}`
        );
        if (!res.ok) {
          throw new Error('폴링 실패');
        }

        const json = await res.json();
        const data = json.data as QuestionPollResponse;

        if (data.status === 'completed' || data.status === 'failed') {
          // 완료 또는 실패 시 폴링 중지
          clearInterval(intervalId);
          setPollResult(data);
          setPollingQuestionId(null);
          setPollingProfileId(null);

          // 질문 히스토리 갱신
          queryClient.invalidateQueries({ queryKey: ['questions', pollingProfileId] });
          queryClient.invalidateQueries({ queryKey: ['questions', 'all'] });
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollResult({
            ...data,
            status: 'failed',
            error: '응답 시간이 초과되었습니다',
          });
          setPollingQuestionId(null);
          setPollingProfileId(null);
        }
      } catch (error) {
        console.error('폴링 에러:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollingQuestionId(null);
          setPollingProfileId(null);
        }
      }
    };

    // 즉시 첫 폴링 실행
    poll();
    // 2초 간격으로 폴링
    intervalId = setInterval(poll, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollingQuestionId, pollingProfileId, queryClient]);

  const mutation = useMutation<AskQuestionResponse, Error, AskQuestionData>({
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
    onSuccess: (data, variables) => {
      // 폴링 시작
      setPollResult(null);
      setPollingQuestionId(data.questionId);
      setPollingProfileId(variables.profileId);

      // 크레딧 갱신
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      // 질문 히스토리 즉시 갱신 (generating 상태 표시)
      queryClient.invalidateQueries({ queryKey: ['questions', variables.profileId] });
    },
  });

  // 폴링 중인지 여부
  const isPolling = !!pollingQuestionId;

  // 최종 결과
  const completedAnswer = pollResult?.status === 'completed' ? pollResult.answer : null;
  const failedError = pollResult?.status === 'failed' ? pollResult.error : null;

  // 폴링 결과 초기화
  const resetPollResult = useCallback(() => {
    setPollResult(null);
  }, []);

  return {
    ...mutation,
    isPolling,
    pollResult,
    completedAnswer,
    failedError,
    resetPollResult,
  };
}

/**
 * 섹션 재분석 상태 타입
 */
export type ReanalysisStatus = 'processing' | 'completed' | 'failed';

/** 재분석 요청 데이터 */
export interface ReanalyzeSectionData {
  profileId: string;
  sectionType: 'personality' | 'aptitude' | 'fortune';
}

/** 재분석 응답 데이터 (비동기) */
export interface ReanalyzeSectionResponse {
  reanalysisId: string;
  sectionType: string;
  status: ReanalysisStatus;
  pollUrl: string;
  creditsUsed: number;
  remainingCredits: number;
}

/** 재분석 폴링 응답 */
export interface ReanalysisPollResponse {
  reanalysisId: string;
  sectionType: string;
  status: ReanalysisStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
}

/**
 * 섹션 재분석 훅 (비동기/폴링 방식)
 */
export function useReanalyzeSection() {
  const queryClient = useQueryClient();
  const [pollingReanalysisId, setPollingReanalysisId] = useState<string | null>(null);
  const [pollingProfileId, setPollingProfileId] = useState<string | null>(null);
  const [pollResult, setPollResult] = useState<ReanalysisPollResponse | null>(null);

  // 폴링 로직
  useEffect(() => {
    if (!pollingReanalysisId || !pollingProfileId) return;

    let attempts = 0;
    const maxAttempts = 90; // 최대 3분 (2초 간격)
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/profiles/${pollingProfileId}/report/reanalyze/${pollingReanalysisId}`
        );
        if (!res.ok) {
          throw new Error('폴링 실패');
        }

        const json = await res.json();
        const data = json.data as ReanalysisPollResponse;

        if (data.status === 'completed' || data.status === 'failed') {
          // 완료 또는 실패 시 폴링 중지
          clearInterval(intervalId);
          setPollResult(data);
          setPollingReanalysisId(null);
          setPollingProfileId(null);

          // 리포트 갱신
          queryClient.invalidateQueries({ queryKey: ['report', pollingProfileId] });
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollResult({
            ...data,
            status: 'failed',
            error: '응답 시간이 초과되었습니다',
          });
          setPollingReanalysisId(null);
          setPollingProfileId(null);
        }
      } catch (error) {
        console.error('폴링 에러:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPollingReanalysisId(null);
          setPollingProfileId(null);
        }
      }
    };

    // 즉시 첫 폴링 실행
    poll();
    // 2초 간격으로 폴링
    intervalId = setInterval(poll, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollingReanalysisId, pollingProfileId, queryClient]);

  const mutation = useMutation<ReanalyzeSectionResponse, Error, ReanalyzeSectionData>({
    mutationFn: async ({ profileId, sectionType }) => {
      const res = await fetch(`/api/profiles/${profileId}/report/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '재분석 실패');
      }

      const json = await res.json();
      return json.data;
    },
    onSuccess: (data, variables) => {
      // 폴링 시작
      setPollResult(null);
      setPollingReanalysisId(data.reanalysisId);
      setPollingProfileId(variables.profileId);

      // 크레딧 갱신
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });

  // 폴링 중인지 여부
  const isPolling = !!pollingReanalysisId;

  // 최종 결과
  const completedResult = pollResult?.status === 'completed' ? pollResult.result : null;
  const failedError = pollResult?.status === 'failed' ? pollResult.error : null;

  // 폴링 결과 초기화
  const resetPollResult = useCallback(() => {
    setPollResult(null);
  }, []);

  return {
    ...mutation,
    isPolling,
    pollResult,
    completedResult,
    failedError,
    resetPollResult,
  };
}
