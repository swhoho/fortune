'use client';

import { motion } from 'framer-motion';

interface PersonalityCardProps {
  label: string;
  summary: string;
  description: string;
  variant?: 'default' | 'highlight';
  delay?: number;
  className?: string;
}

/**
 * 성격 카드 컴포넌트
 * Task 13.2: 라벨 + 요약 + 설명 카드
 */
export function PersonalityCard({
  label,
  summary,
  description,
  variant = 'default',
  delay = 0,
  className = '',
}: PersonalityCardProps) {
  const isHighlight = variant === 'highlight';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + delay }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-xl p-5 transition-shadow ${
        isHighlight
          ? 'bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] ring-1 ring-[#d4af37]/30'
          : 'bg-[#1a1a1a] hover:shadow-lg hover:shadow-[#d4af37]/5'
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

        {/* 요약 텍스트 */}
        <motion.h4
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + delay }}
          className="mb-3 font-serif text-lg font-semibold leading-snug text-white"
        >
          {summary}
        </motion.h4>

        {/* 설명 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 + delay }}
          className="text-sm leading-relaxed text-gray-400"
        >
          {description}
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
