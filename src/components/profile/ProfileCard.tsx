'use client';

/**
 * 프로필 카드 컴포넌트
 * Task 4.3: ProfileCard
 */
import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProfileResponse } from '@/types/profile';
import { calculateAge } from '@/lib/date';

interface ProfileCardProps {
  /** 프로필 데이터 */
  profile: ProfileResponse;
  /** 애니메이션 인덱스 (stagger) */
  index: number;
  /** 선택 핸들러 (프로필 전달) */
  onSelect?: (profile: ProfileResponse) => void;
}

/** 달력 유형 라벨 */
const CALENDAR_LABELS: Record<string, string> = {
  solar: '양력',
  lunar: '음력',
  lunar_leap: '윤달',
};

/** 리포트 상태별 배지 정보 (다크 테마) */
const REPORT_STATUS_INFO: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  completed: {
    label: '분석 완료',
    className: 'bg-green-950/50 text-green-400 border border-green-900/50',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  in_progress: {
    label: '분석 중',
    className: 'bg-blue-950/50 text-blue-400 border border-blue-900/50',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  pending: {
    label: '대기 중',
    className: 'bg-yellow-950/50 text-yellow-400 border border-yellow-900/50',
    icon: <Loader2 className="h-3 w-3" />,
  },
  failed: {
    label: '분석 실패',
    className: 'bg-red-950/50 text-red-400 border border-red-900/50',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

/**
 * 프로필 카드
 */
function ProfileCardComponent({ profile, index, onSelect }: ProfileCardProps) {
  const t = useTranslations('profile');
  const age = calculateAge(profile.birthDate);

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formattedDate = profile.birthDate.replace(/-/g, '.');

  // 클릭 핸들러 (안정적인 참조)
  const handleClick = useCallback(() => {
    onSelect?.(profile);
  }, [onSelect, profile]);

  // 리포트 상태 정보
  const reportStatusInfo = profile.reportStatus ? REPORT_STATUS_INFO[profile.reportStatus] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md ${
        profile.reportStatus === 'failed'
          ? 'border-red-900/50 bg-red-950/20'
          : 'border-[#333] bg-[#1a1a1a] hover:border-[#d4af37]/30 hover:bg-[#242424]'
      }`}
    >
      {/* 장식적 배경 요소 */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* 헤더: 아이콘 + 이름 + 화살표 */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 아바타 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border border-[#333]">
            <User className="h-6 w-6 text-[#d4af37]" />
          </div>

          {/* 이름 + 메타 정보 */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white">{profile.name}</h3>
            <p className="text-sm text-gray-400">
              {formattedDate} ({t('detail.age', { age })}) ·{' '}
              {profile.gender === 'male' ? t('form.male') : t('form.female')}
            </p>
          </div>
        </div>

        {/* 화살표 아이콘 */}
        <ChevronRight className="h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#d4af37]" />
      </div>

      {/* 태그 영역 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* 달력 유형 배지 */}
        <span className="inline-flex items-center rounded-full bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#d4af37] border border-[#d4af37]/20">
          {CALENDAR_LABELS[profile.calendarType] || profile.calendarType}
        </span>

        {/* 출생 시간 (있을 경우) */}
        {profile.birthTime && (
          <span className="inline-flex items-center rounded-full bg-[#242424] px-2.5 py-1 text-xs font-medium text-gray-400 border border-[#333]">
            {profile.birthTime}
          </span>
        )}

        {/* 리포트 상태 배지 */}
        {reportStatusInfo && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${reportStatusInfo.className}`}
          >
            {reportStatusInfo.icon}
            {reportStatusInfo.label}
          </span>
        )}
      </div>
    </motion.article>
  );
}

export const ProfileCard = memo(ProfileCardComponent);
