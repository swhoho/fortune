/**
 * 사용자 관련 TanStack Query 훅
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/** 사용자 프로필 타입 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  createdAt: string;
  emailNotificationsEnabled: boolean;
  yearlyReminderEnabled: boolean;
  preferredLanguage: string;
}

/** 프로필 수정 데이터 타입 */
export interface ProfileUpdateData {
  name?: string;
  emailNotificationsEnabled?: boolean;
  yearlyReminderEnabled?: boolean;
  preferredLanguage?: string;
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

/** 질문 아이템 타입 */
export interface QuestionItem {
  id: string;
  analysisId: string;
  analysis?: AnalysisItem;
  question: string;
  answer: string;
  creditsUsed: number;
  createdAt: string;
}

/** 분석별 그룹화된 질문 */
export interface GroupedQuestions {
  analysis: AnalysisItem;
  questions: Omit<QuestionItem, 'analysisId' | 'analysis'>[];
}

/** 질문 기록 응답 타입 */
export interface QuestionsResponse {
  questions: QuestionItem[];
  groupedByAnalysis: GroupedQuestions[];
  totalCount: number;
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
 * 프로필 수정 훅
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '프로필 수정 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
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

/**
 * 질문 기록 조회 훅
 * @param search 검색어 (선택)
 * @param analysisId 특정 분석 ID (선택)
 */
export function useQuestionsList(search?: string, analysisId?: string) {
  return useQuery<QuestionsResponse>({
    queryKey: ['user', 'questions', { search, analysisId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (analysisId) params.set('analysisId', analysisId);

      const url = `/api/user/questions${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('질문 기록 로드 실패');
      }
      return res.json();
    },
  });
}
