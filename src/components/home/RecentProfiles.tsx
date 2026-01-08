'use client';

/**
 * 최근 프로필 영역
 * 홈화면 프로필 관리 섹션 하단에 배치
 */
import { useTranslations } from 'next-intl';
import { useProfiles } from '@/hooks/use-profiles';
import { RecentProfileCard } from './RecentProfileCard';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** 표시할 최근 프로필 수 */
const MAX_RECENT_PROFILES = 3;

/**
 * 최근 프로필 영역 컴포넌트
 */
export function RecentProfiles() {
  const t = useTranslations('home');
  const { data: profiles, isLoading } = useProfiles('created');

  // 최근 프로필 3개만 추출
  const recentProfiles = profiles?.slice(0, MAX_RECENT_PROFILES) ?? [];

  // 프로필 없고 로딩 중 아니면 렌더링 안함
  if (!isLoading && recentProfiles.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* 섹션 제목 */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-light" style={{ color: BRAND_COLORS.primary }}>
          ✦
        </span>
        <h3 className="text-sm font-medium uppercase tracking-widest text-gray-400">
          {t('sections.recentProfiles')}
        </h3>
        <div
          className="ml-3 h-px flex-1"
          style={{
            background: `linear-gradient(to right, ${BRAND_COLORS.primary}30, transparent)`,
          }}
        />
      </div>

      {/* 프로필 목록 또는 스켈레톤 */}
      <div className="space-y-2">
        {isLoading ? (
          // 로딩 스켈레톤
          <>
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#333] bg-[#1a1a1a] p-3"
              >
                <div className="h-10 w-10 animate-pulse rounded-lg bg-[#333]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-[#333]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[#333]" />
                </div>
              </div>
            ))}
          </>
        ) : (
          // 프로필 카드 목록
          recentProfiles.map((profile, index) => (
            <RecentProfileCard key={profile.id} profile={profile} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
