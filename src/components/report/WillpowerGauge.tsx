'use client';

import { motion } from 'framer-motion';

interface WillpowerGaugeProps {
  score: number;
  description: string;
  averageLine?: number;
  className?: string;
}

/**
 * 의지력 게이지 컴포넌트
 * Task 13.1: 프로그레스 바 + 50% 기준선
 */
export function WillpowerGauge({
  score,
  description,
  averageLine = 50,
  className = '',
}: WillpowerGaugeProps) {
  // 점수에 따른 색상 결정
  const getScoreColor = (value: number) => {
    if (value >= 70) return '#22c55e'; // green
    if (value >= 50) return '#d4af37'; // gold
    if (value >= 30) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const scoreColor = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl bg-[#1a1a1a] p-5 ${className}`}
    >
      {/* 헤더 영역 */}
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* 라벨 태그 */}
          <span className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-md bg-[#d4af37] px-2.5 py-1 text-xs font-bold text-[#1a1a1a]">
            의지력
          </span>
          {/* 설명 텍스트 */}
          <span className="text-sm leading-relaxed text-gray-400">{description}</span>
        </div>

        {/* 평균 표시 */}
        <span className="flex-shrink-0 text-xs text-gray-500">평균 {averageLine}%</span>
      </div>

      {/* 게이지 영역 */}
      <div className="relative">
        {/* 배경 바 */}
        <div
          className="h-4 w-full overflow-hidden rounded-full bg-[#2a2a2a]"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`의지력 점수: ${score}%`}
        >
          {/* 채움 바 */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' as const }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`,
              boxShadow: `0 0 12px ${scoreColor}40`,
            }}
          />
        </div>

        {/* 평균 기준선 */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="absolute top-0 h-full w-0.5"
          style={{ left: `${averageLine}%` }}
        >
          <div className="h-full w-full border-l-2 border-dashed border-gray-500" />
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-gray-500">
            평균
          </div>
        </motion.div>

        {/* 점수 표시 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="absolute top-0 h-full"
          style={{ left: `${Math.min(score, 95)}%` }}
        >
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: scoreColor,
              color: score >= 50 ? '#1a1a1a' : '#ffffff',
            }}
          >
            {score}%
          </div>
        </motion.div>
      </div>

      {/* 하단 범례 */}
      <div className="mt-6 flex justify-between text-[10px] text-gray-500">
        <span>약함</span>
        <span>보통</span>
        <span>강함</span>
      </div>
    </motion.div>
  );
}
