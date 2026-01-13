/**
 * 프로필 관련 TanStack Query 훅
 * Task 3-5: 프로필 CRUD 연동
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfileResponse, ProfileListResponse, ProfileSingleResponse } from '@/types/profile';
import type { CreateProfileInput, UpdateProfileInput } from '@/lib/validations/profile';
import { handleApiError } from '@/lib/errors/handler';
import { trackCreateProfile } from '@/lib/analytics';

/** Query Keys */
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters?: { sort?: string }) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};

/**
 * 프로필 목록 조회 훅
 * @param sort 정렬 방식 ('name' | 'created')
 */
export function useProfiles(sort?: 'name' | 'created') {
  return useQuery<ProfileResponse[]>({
    queryKey: profileKeys.list({ sort }),
    queryFn: async () => {
      const res = await fetch('/api/profiles');
      if (!res.ok) {
        await handleApiError(res, '프로필 목록 로드 실패');
      }
      const data: ProfileListResponse = await res.json();

      // 클라이언트 사이드 정렬
      let profiles = data.data || [];
      if (sort === 'name') {
        profiles = [...profiles].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      }
      // sort === 'created'는 API 기본값 (최신순)

      return profiles;
    },
    staleTime: 0, // 항상 stale로 간주 → 리포트 상태 변경 즉시 반영
    refetchOnMount: 'always', // 페이지 진입 시 항상 최신 상태 조회
  });
}

/**
 * 프로필 상세 조회 훅
 * @param id 프로필 ID
 */
export function useProfile(id: string) {
  return useQuery<ProfileResponse>({
    queryKey: profileKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${id}`);
      if (!res.ok) {
        await handleApiError(res, '프로필 로드 실패');
      }
      const data: ProfileSingleResponse = await res.json();
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * 프로필 생성 훅
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        await handleApiError(res, '프로필 생성 실패');
      }

      return (await res.json()) as ProfileSingleResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      // GA4: 프로필 생성 이벤트 (첫 프로필이면 is_first=true)
      trackCreateProfile(data.data?.isPrimary ?? false);
    },
  });
}

/**
 * 프로필 수정 훅
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProfileInput }) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        await handleApiError(res, '프로필 수정 실패');
      }

      return (await res.json()) as ProfileSingleResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
    },
  });
}

/**
 * 프로필 삭제 훅
 */
export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        await handleApiError(res, '프로필 삭제 실패');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * 대표 프로필 설정 훅
 */
export function useSetPrimaryProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profiles/${id}/set-primary`, {
        method: 'POST',
      });

      if (!res.ok) {
        await handleApiError(res, '대표 프로필 설정 실패');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}
