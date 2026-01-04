'use client';

/**
 * 프로필 목록 컴포넌트
 * Task 4.2: ProfileList
 */
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ProfileCard } from './ProfileCard';
import { EmptyProfiles } from './EmptyProfiles';
import type { ProfileResponse } from '@/types/profile';

interface ProfileListProps {
  /** 프로필 목록 */
  profiles: ProfileResponse[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 정렬 방식 */
  sortOrder: 'name' | 'created';
  /** 정렬 변경 핸들러 */
  onSortChange: (sort: 'name' | 'created') => void;
  /** 프로필 선택 핸들러 */
  onSelectProfile?: (profile: ProfileResponse) => void;
}

/**
 * 로딩 스켈레톤
 */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-24 rounded bg-gray-200" />
              <div className="h-4 w-40 rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-12 rounded-full bg-gray-200" />
            <div className="h-6 w-16 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 프로필 목록
 */
export function ProfileList({
  profiles,
  isLoading,
  sortOrder,
  onSortChange,
  onSelectProfile,
}: ProfileListProps) {
  const t = useTranslations('profile');

  // 정렬 토글
  const toggleSort = () => {
    onSortChange(sortOrder === 'created' ? 'name' : 'created');
  };

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 빈 상태
  if (profiles.length === 0) {
    return <EmptyProfiles />;
  }

  return (
    <div className="space-y-4">
      {/* 헤더: 개수 + 정렬 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <span className="text-sm text-gray-500">
          {t('list.totalCount', { count: profiles.length })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSort}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1a1a1a]"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'name' ? t('list.sortByName') : t('list.sortByDate')}
        </Button>
      </motion.div>

      {/* 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((profile, index) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            index={index}
            onClick={() => onSelectProfile?.(profile)}
          />
        ))}
      </div>
    </div>
  );
}
