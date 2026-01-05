'use client';

import { motion } from 'framer-motion';
import type { ReportProfileInfo } from '@/types/report';

interface ProfileInfoHeaderProps extends ReportProfileInfo {
  className?: string;
}

/**
 * 프로필 정보 헤더 컴포넌트
 * Task 12.1: 이름, 생년월일, 나이 표시
 */
export function ProfileInfoHeader({
  name,
  gender,
  birthDate,
  birthTime,
  calendarType,
  age,
  className = '',
}: ProfileInfoHeaderProps) {
  const genderText = gender === 'male' ? '남' : '여';

  const calendarLabel = {
    solar: '양력',
    lunar: '음력',
    lunar_leap: '음력(윤달)',
  }[calendarType];

  /**
   * 날짜 포맷팅 (크로스 브라우징 호환)
   * Safari에서 new Date(string) 파싱 이슈 방지
   */
  const formatDate = (dateString: string) => {
    // YYYY-MM-DD 형식 직접 파싱 (Safari 호환)
    const parts = dateString.split(/[-T]/);
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // fallback: ISO 형식이 아닌 경우
    return dateString;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-6 ${className}`}
    >
      {/* 배경 장식 */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-[#d4af37]/5 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-[#d4af37]/5 blur-2xl" />

      <div className="relative z-10">
        {/* 이름 + 성별/나이 */}
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-2xl font-bold tracking-wide text-white">{name}</h2>
          <span className="text-sm text-[#d4af37]">
            ({genderText}, {age}세)
          </span>
        </div>

        {/* 생년월일 정보 */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded bg-[#d4af37]/20 px-2 text-xs font-medium text-[#d4af37]">
              생일
            </span>
            <span className="text-sm text-gray-300">
              {calendarLabel} {formatDate(birthDate)}
              {birthTime && ` ${birthTime}`}
            </span>
          </div>

          {/* 만 나이 표시 */}
          {typeof age === 'number' && !isNaN(age) && (
            <p className="text-xs text-gray-500">
              만 {age - 1}세 ({Math.floor((age - 1) / 10) * 10}대)
            </p>
          )}
        </div>
      </div>

      {/* 금색 악센트 라인 */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />
    </motion.div>
  );
}
