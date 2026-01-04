/**
 * 사용자 관련 TanStack Query 훅
 * v2.0: 레거시 분석/질문 기록 훅 제거
 * v2.1: useAuth 훅 추가 (로그인 상태 확인)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { handleApiError } from '@/lib/errors/handler';
import type { User } from '@supabase/supabase-js';

/** 인증 상태 타입 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * 인증 상태 확인 훅
 * Supabase Auth 세션을 실시간으로 추적
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 현재 세션 확인
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    checkSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

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
