'use client';

import { motion } from 'framer-motion';
import type { PillarsHanja } from '@/types/saju';

interface SajuTableProps {
  pillars: PillarsHanja;
  name?: string;
  age?: number;
  className?: string;
}

/**
 * 사주명식 테이블 컴포넌트
 * Task 12.2: 시/일/월/년 + 천간/지지 테이블
 */
export function SajuTable({ pillars, name, age, className = '' }: SajuTableProps) {
  const columns = [
    { key: 'hour', label: '時', pillar: pillars.hour },
    { key: 'day', label: '日', pillar: pillars.day },
    { key: 'month', label: '月', pillar: pillars.month },
    { key: 'year', label: '年', pillar: pillars.year },
  ];

  // 컬럼 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] ${className}`}
    >
      {/* 헤더 */}
      <div className="border-b border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-3">
        <h3 className="text-center font-serif text-lg font-semibold text-[#d4af37]">사주명식</h3>
      </div>

      {/* 테이블 */}
      <div className="p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex justify-center gap-1"
        >
          {/* 4기둥 */}
          {columns.map(({ key, label, pillar }) => (
            <motion.div
              key={key}
              variants={columnVariants}
              className="flex w-16 flex-col items-center"
            >
              {/* 헤더 라벨 */}
              <div className="mb-2 flex h-8 w-full items-center justify-center rounded-t-lg bg-[#2a2a2a]">
                <span className="text-sm font-medium text-gray-400">{label}</span>
              </div>

              {/* 천간 */}
              <div className="flex h-14 w-full items-center justify-center border-x border-t border-[#3a3a3a] bg-[#1f1f1f]">
                <span
                  className="font-serif text-2xl font-bold text-[#d4af37]"
                  aria-label={`천간: ${pillar.stem}`}
                  role="text"
                >
                  {pillar.stem}
                </span>
              </div>

              {/* 지지 */}
              <div className="flex h-14 w-full items-center justify-center border border-[#3a3a3a] bg-[#1f1f1f]">
                <span
                  className="font-serif text-2xl font-bold text-[#d4af37]"
                  aria-label={`지지: ${pillar.branch}`}
                  role="text"
                >
                  {pillar.branch}
                </span>
              </div>
            </motion.div>
          ))}

          {/* 구분 열 (이름/나이) */}
          {(name || age) && (
            <motion.div variants={columnVariants} className="flex w-16 flex-col items-center">
              {/* 헤더 */}
              <div className="mb-2 flex h-8 w-full items-center justify-center rounded-t-lg bg-[#d4af37]/10">
                <span className="text-sm font-medium text-[#d4af37]">구분</span>
              </div>

              {/* 건명 */}
              <div className="flex h-14 w-full items-center justify-center border-x border-t border-[#d4af37]/30 bg-[#d4af37]/5">
                <span className="text-sm font-medium text-[#d4af37]">
                  {name ? `${name.slice(0, 3)}` : '건명'}
                </span>
              </div>

              {/* 나이 */}
              <div className="flex h-14 w-full items-center justify-center border border-[#d4af37]/30 bg-[#d4af37]/5">
                <span className="text-lg font-bold text-[#d4af37]">{age ? `${age}세` : ''}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
