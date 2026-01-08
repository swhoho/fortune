'use client';

/**
 * 최근 프로필 미니 카드
 * 홈화면 "최근 프로필" 영역용 축소 카드
 */
import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { ProfileResponse } from '@/types/profile';

interface RecentProfileCardProps {
  /** 프로필 데이터 */
  profile: ProfileResponse;
  /** 애니메이션 인덱스 (stagger) */
  index: number;
}

/**
 * 최근 프로필 미니 카드
 */
function RecentProfileCardComponent({ profile, index }: RecentProfileCardProps) {
  const router = useRouter();
  const locale = useLocale();

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formattedDate = profile.birthDate.replace(/-/g, '.');

  // 클릭 핸들러
  const handleClick = useCallback(() => {
    router.push(`/${locale}/profiles/${profile.id}`);
  }, [router, locale, profile.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[#333] bg-[#1a1a1a] p-3 transition-all duration-200 hover:border-[#d4af37]/30 hover:bg-[#242424]"
    >
      {/* 아바타 아이콘 */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#333] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
        <User className="h-5 w-5 text-[#d4af37]" />
      </div>

      {/* 이름 + 생년월일 */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{profile.name}</p>
        <p className="text-sm text-gray-400">{formattedDate}</p>
      </div>

      {/* 화살표 */}
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#d4af37]" />
    </motion.div>
  );
}

export const RecentProfileCard = memo(RecentProfileCardComponent);
