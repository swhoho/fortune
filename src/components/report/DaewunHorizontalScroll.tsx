'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReportDaewunItem } from '@/types/report';

interface DaewunHorizontalScrollProps {
  daewun: ReportDaewunItem[];
  currentAge?: number;
  className?: string;
}

/**
 * 대운 가로 스크롤 컴포넌트
 * Task 12.3: 수평 스크롤 대운 카드 (8개)
 */
export function DaewunHorizontalScroll({
  daewun,
  currentAge,
  className = '',
}: DaewunHorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 핸들러
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  /**
   * 현재 대운 확인
   * 마지막 대운의 경우 endAge를 무한대로 설정하여 항상 포함되도록 처리
   */
  const isCurrentDaewun = (item: ReportDaewunItem, index: number) => {
    if (!currentAge || currentAge < 0) return false;

    // 현재 아이템 이후의 대운 찾기
    const nextItem = daewun[index + 1];
    // 마지막 대운인 경우 endAge를 무한대로 설정
    const endAge = nextItem ? nextItem.age : Infinity;

    return currentAge >= item.age && currentAge < endAge;
  };

  // 카드 애니메이션
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`relative ${className}`}
    >
      {/* 좌측 스크롤 버튼 */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1a1a1a]/90 text-[#d4af37] shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-[#2a2a2a]"
        aria-label="이전 대운"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* 우측 스크롤 버튼 */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1a1a1a]/90 text-[#d4af37] shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-[#2a2a2a]"
        aria-label="다음 대운"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 좌측 그라데이션 */}
      <div className="pointer-events-none absolute left-8 top-0 z-[5] h-full w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />

      {/* 우측 그라데이션 */}
      <div className="pointer-events-none absolute right-8 top-0 z-[5] h-full w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />

      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-10 py-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-3"
        >
          {daewun.map((item, index) => {
            const isCurrent = isCurrentDaewun(item, index);
            const nextItem = daewun[index + 1];
            const endYear = nextItem ? nextItem.startYear - 1 : null;
            return (
              <motion.div
                key={`${item.age}-${index}`}
                variants={cardVariants}
                className={`flex snap-center flex-col items-center rounded-xl px-4 py-3 transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#d4af37]/20 to-[#d4af37]/5 ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#0a0a0a]'
                    : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                } `}
              >
                {/* 나이 */}
                <div
                  className={`mb-2 rounded-full px-3 py-1 text-xs font-bold ${
                    isCurrent ? 'bg-[#d4af37] text-[#1a1a1a]' : 'bg-[#2a2a2a] text-gray-400'
                  }`}
                >
                  {item.age}세
                </div>

                {/* 천간 */}
                <span
                  className={`font-serif text-xl font-bold ${
                    isCurrent ? 'text-[#d4af37]' : 'text-[#d4af37]/80'
                  }`}
                >
                  {item.stem}
                </span>

                {/* 지지 */}
                <span
                  className={`font-serif text-xl font-bold ${
                    isCurrent ? 'text-[#d4af37]' : 'text-[#d4af37]/80'
                  }`}
                >
                  {item.branch}
                </span>

                {/* 연도 범위 */}
                <span className="mt-2 text-[10px] text-gray-500">
                  {item.startYear}년{endYear ? `~${endYear}년` : '~'}
                </span>

                {/* 현재 대운 표시 */}
                {isCurrent && (
                  <div className="mt-1 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
