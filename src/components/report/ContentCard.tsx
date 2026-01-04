'use client';

import { motion } from 'framer-motion';

interface ContentCardProps {
  /** 라벨 (주 재능, 재능의 상태 등) */
  label: string;
  /** 제목 */
  title: string;
  /** 본문 내용 (긴 텍스트 지원) */
  content: string;
  /** 스타일 변형 */
  variant?: 'default' | 'highlight';
  /** 애니메이션 딜레이 (초) */
  delay?: number;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 콘텐츠 카드 컴포넌트
 * Task 16.3: 재능/커리어 설명 카드
 *
 * 기존 PersonalityCard와 유사하나:
 * - content 영역이 더 넓음 (긴 설명 지원)
 * - 질문 형태의 title 지원
 */
export function ContentCard({
  label,
  title,
  content,
  variant = 'default',
  delay = 0,
  className = '',
}: ContentCardProps) {
  const isHighlight = variant === 'highlight';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + delay }}
      className={`relative overflow-hidden rounded-xl p-5 ${
        isHighlight
          ? 'bg-gradient-to-br from-[#1a1a1a] to-[#252525] ring-1 ring-[#d4af37]/30'
          : 'bg-[#1a1a1a]'
      } ${className} `}
    >
      {/* 배경 장식 (하이라이트 시) */}
      {isHighlight && (
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#d4af37]/5 blur-2xl" />
      )}

      <div className="relative z-10">
        {/* 라벨 태그 */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + delay }}
          className={`mb-3 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
            isHighlight ? 'bg-[#d4af37] text-[#1a1a1a]' : 'bg-[#d4af37]/20 text-[#d4af37]'
          } `}
        >
          {label}
        </motion.span>

        {/* 제목 (질문 형태 가능) */}
        <motion.h4
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + delay }}
          className="mb-3 font-serif text-base font-semibold leading-snug text-white"
        >
          {title}
        </motion.h4>

        {/* 본문 내용 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 + delay }}
          className="text-sm leading-relaxed text-gray-400"
        >
          {content}
        </motion.p>
      </div>

      {/* 하단 악센트 라인 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.6 + delay }}
        className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${
          isHighlight
            ? 'bg-gradient-to-r from-[#d4af37] via-[#d4af37]/50 to-transparent'
            : 'bg-gradient-to-r from-[#d4af37]/30 to-transparent'
        } `}
      />
    </motion.div>
  );
}
