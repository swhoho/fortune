'use client';

import { motion } from 'framer-motion';

interface KeywordBadgeProps {
  /** 키워드 텍스트 */
  text: string;
  /** 스타일 변형 */
  variant?: 'primary' | 'secondary';
  /** 애니메이션 딜레이 (초) */
  delay?: number;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 키워드 뱃지 컴포넌트
 * Task 16.2: 적성 키워드 표시용 뱃지
 *
 * variant:
 * - primary: 금색 배경, 어두운 텍스트 (강조)
 * - secondary: 투명 배경, 금색 테두리 (보조)
 */
export function KeywordBadge({
  text,
  variant = 'secondary',
  delay = 0,
  className = '',
}: KeywordBadgeProps) {
  const isPrimary = variant === 'primary';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
      className={`inline-flex cursor-default items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
        isPrimary
          ? 'bg-[#e5c358] text-[#1a1a1a] font-semibold'
          : 'border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20'
      } ${className} `}
    >
      {text}
    </motion.span>
  );
}
