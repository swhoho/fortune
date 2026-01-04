'use client';

/**
 * 프로필 선택 컴포넌트
 * Task 24.1.2: 신년 운세 페이지에서 프로필 선택 UI
 */
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Calendar, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ProfileResponse } from '@/types/profile';
import { calculateAge } from '@/lib/date';

/** 달력 유형 라벨 */
const CALENDAR_LABELS: Record<string, Record<string, string>> = {
  ko: { solar: '양력', lunar: '음력', lunar_leap: '윤달' },
  en: { solar: 'Solar', lunar: 'Lunar', lunar_leap: 'Lunar Leap' },
  ja: { solar: '陽暦', lunar: '陰暦', lunar_leap: '閏月' },
  'zh-CN': { solar: '阳历', lunar: '阴历', lunar_leap: '闰月' },
  'zh-TW': { solar: '陽曆', lunar: '陰曆', lunar_leap: '閏月' },
};

interface ProfileSelectorProps {
  /** 프로필 목록 */
  profiles: ProfileResponse[];
  /** 선택된 프로필 ID */
  selectedId: string | null;
  /** 선택 핸들러 */
  onSelect: (profile: ProfileResponse | null) => void;
  /** 로딩 상태 */
  loading?: boolean;
  /** 언어 코드 */
  locale?: string;
}

/**
 * 프로필 선택기
 * 신년 운세 분석 시 프로필을 선택하는 카드 형태 UI
 */
export function ProfileSelector({
  profiles,
  selectedId,
  onSelect,
  loading = false,
  locale = 'ko',
}: ProfileSelectorProps) {
  const t = useTranslations('profile');

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formatDate = (dateStr: string) => dateStr.replace(/-/g, '.');

  // 달력 유형 라벨
  const getCalendarLabel = (type: string) =>
    CALENDAR_LABELS[locale]?.[type] || CALENDAR_LABELS['ko']?.[type] || type;

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-8 w-8 text-[#d4af37]" />
        </motion.div>
      </div>
    );
  }

  // 프로필이 없을 경우 빈 상태
  if (profiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-dashed border-[#d4af37]/30 bg-gradient-to-br from-[#fefdfb] via-white to-[#f8f6f0] p-8"
      >
        {/* 장식적 배경 */}
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#d4af37]/5 to-transparent" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-tr from-[#d4af37]/5 to-transparent" />

        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
            <UserPlus className="h-8 w-8 text-[#d4af37]" />
          </div>

          <h3 className="font-serif text-lg font-semibold text-[#1a1a1a]">
            {t('empty.title', { defaultValue: '등록된 프로필이 없습니다' })}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {t('empty.subtitle', { defaultValue: '분석할 프로필을 먼저 등록해주세요' })}
          </p>

          <Link
            href="/profiles/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-6 py-3 font-medium text-white shadow-md transition-all hover:shadow-lg hover:brightness-105"
          >
            <UserPlus className="h-5 w-5" />
            {t('empty.addButton', { defaultValue: '프로필 등록하기' })}
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/10">
          <User className="h-5 w-5 text-[#d4af37]" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">
            {t('selector.title', { defaultValue: '프로필 선택' })}
          </h3>
          <p className="text-sm text-gray-500">
            {t('selector.subtitle', { defaultValue: '분석할 프로필을 선택하세요' })}
          </p>
        </div>
      </div>

      {/* 프로필 목록 */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {profiles.map((profile, index) => {
            const isSelected = selectedId === profile.id;
            const age = calculateAge(profile.birthDate);

            return (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(isSelected ? null : profile)}
                className={`group relative w-full overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-[#d4af37] bg-gradient-to-r from-[#d4af37]/10 to-[#d4af37]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* 선택 시 배경 효과 */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedBg"
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-[#d4af37]/10 to-transparent"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <div className="flex items-center gap-4">
                  {/* 라디오 버튼 */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                      isSelected ? 'border-[#d4af37] bg-[#d4af37]' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="h-2 w-2 rounded-full bg-white"
                      />
                    )}
                  </div>

                  {/* 아바타 */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white'
                        : 'bg-gradient-to-br from-[#f8f6f0] to-[#ebe8e0] text-[#d4af37]'
                    }`}
                  >
                    <span className="font-serif text-lg font-bold">{profile.name.charAt(0)}</span>
                  </div>

                  {/* 프로필 정보 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-serif text-base font-semibold text-[#1a1a1a]">
                        {profile.name}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200 ${
                          isSelected
                            ? 'bg-[#d4af37]/20 text-[#b8962d]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {profile.gender === 'male'
                          ? t('form.male', { defaultValue: '남성' })
                          : t('form.female', { defaultValue: '여성' })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(profile.birthDate)} (
                        {t('detail.age', { age, defaultValue: `${age}세` })})
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>{getCalendarLabel(profile.calendarType)}</span>
                      {profile.birthTime && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{profile.birthTime}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 선택 체크 아이콘 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', bounce: 0.4 }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4af37]"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 프로필 추가 링크 */}
      <Link
        href="/profiles/new"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-all hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 hover:text-[#d4af37]"
      >
        <UserPlus className="h-4 w-4" />
        {t('selector.addNew', { defaultValue: '새 프로필 추가' })}
      </Link>
    </motion.div>
  );
}
