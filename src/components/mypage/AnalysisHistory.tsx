'use client';

/**
 * 프로필 리포트 기록 탭 컴포넌트
 * v2.0: analyses 테이블 → profile_reports + profiles 테이블로 전환
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProfiles } from '@/hooks/use-profiles';
import { calculateAge } from '@/lib/date';
import type { ProfileResponse } from '@/types/profile';

/** 성별 라벨 */
const GENDER_LABEL: Record<string, string> = {
  male: '남성',
  female: '여성',
};

/** 날짜 포맷팅 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 상대 시간 포맷팅 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

/** 프로필 카드 컴포넌트 */
function ProfileCard({ profile, index }: { profile: ProfileResponse; index: number }) {
  const age = calculateAge(profile.birthDate);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl bg-[#1a1a1a] p-5 transition-all hover:bg-[#242424]"
    >
      {/* 장식적 배경 요소 */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 프로필 아이콘 */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#242424] text-lg">
            {profile.gender === 'male' ? '👤' : '👩'}
          </div>
          <div>
            <p className="text-xs text-gray-500">{formatRelativeTime(profile.createdAt)}</p>
            <h3 className="font-serif font-semibold text-white">{profile.name}</h3>
          </div>
        </div>
        <span className="rounded-full bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#d4af37]">
          {GENDER_LABEL[profile.gender] || profile.gender}
        </span>
      </div>

      {/* 정보 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-lg bg-[#242424] px-2.5 py-1 text-xs text-gray-400">
          {formatDate(profile.birthDate)}
        </span>
        <span className="inline-flex items-center rounded-lg bg-[#242424] px-2.5 py-1 text-xs text-gray-400">
          {age}세
        </span>
        {profile.birthTime && (
          <span className="inline-flex items-center rounded-lg bg-[#242424] px-2.5 py-1 text-xs text-gray-400">
            {profile.birthTime}
          </span>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1 border-[#d4af37]/30 text-[#d4af37] transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/5"
        >
          <Link href={`/profiles/${profile.id}`}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            상세 보기
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white hover:shadow-md"
        >
          <Link href={`/profiles/${profile.id}/report`}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
            리포트
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}

/** 빈 상태 컴포넌트 */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[#333] bg-[#1a1a1a] px-8 py-16 text-center"
    >
      {/* 장식적 아이콘 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
        <svg
          className="h-10 w-10 text-[#d4af37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-white">등록된 프로필이 없습니다</h3>
      <p className="mb-6 text-gray-400">프로필을 등록하고 사주 리포트를 생성해보세요</p>
      <Button
        asChild
        className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-6 py-3 text-white shadow-md hover:shadow-lg"
      >
        <Link href="/profiles/new">
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          프로필 등록하기
        </Link>
      </Button>
    </motion.div>
  );
}

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-[#1a1a1a] p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#242424]" />
              <div>
                <div className="mb-1 h-3 w-12 rounded bg-[#242424]" />
                <div className="h-4 w-24 rounded bg-[#242424]" />
              </div>
            </div>
            <div className="h-6 w-10 rounded-full bg-[#242424]" />
          </div>
          <div className="mb-4 flex gap-2">
            <div className="h-6 w-24 rounded-lg bg-[#242424]" />
            <div className="h-6 w-12 rounded-lg bg-[#242424]" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-[#242424]" />
            <div className="h-9 flex-1 rounded-lg bg-[#242424]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalysisHistory() {
  const { data: profiles, isLoading } = useProfiles();

  return (
    <div>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-xl font-bold text-white">프로필 리포트</h2>
          <p className="mt-1 text-sm text-gray-400">등록된 프로필과 사주 리포트를 확인하세요</p>
        </div>
        {profiles && profiles.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-[#242424] px-3 py-1 text-sm font-medium text-gray-400 sm:inline-flex">
              총 {profiles.length}명
            </span>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#242424]"
            >
              <Link href="/profiles/new">+ 프로필 추가</Link>
            </Button>
          </div>
        )}
      </motion.div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !profiles || profiles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile, index) => (
            <ProfileCard key={profile.id} profile={profile} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
