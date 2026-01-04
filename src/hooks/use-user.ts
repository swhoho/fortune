/**
 * 사용자 관련 TanStack Query 훅
 * v2.0: 레거시 분석/질문 기록 훅 제거
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errors/handler';

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

/**
 * 사용자 프로필 조회 훅
 */
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        await handleApiError(res, '프로필 로드 실패');
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
        await handleApiError(res, '프로필 수정 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
