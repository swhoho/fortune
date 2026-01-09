'use client';

/**
 * 궁합 분석 - 점수 바 컴포넌트
 * 그라데이션과 애니메이션 효과
 */

import { motion } from 'framer-motion';

interface ScoreBarProps {
  score: number;
  label: string;
  sublabel?: string;
  color?: 'gold' | 'pink' | 'blue' | 'green';
  delay?: number;
  showValue?: boolean;
}

const colorSchemes = {
  gold: {
    bar: 'linear-gradient(90deg, #c9a227, #d4af37, #e0c040)',
    glow: 'rgba(212, 175, 55, 0.4)',
    text: '#d4af37',
  },
  pink: {
    bar: 'linear-gradient(90deg, #ec4899, #f472b6, #f9a8d4)',
    glow: 'rgba(236, 72, 153, 0.4)',
    text: '#f472b6',
  },
  blue: {
    bar: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
    glow: 'rgba(59, 130, 246, 0.4)',
    text: '#60a5fa',
  },
  green: {
    bar: 'linear-gradient(90deg, #22c55e, #4ade80, #86efac)',
    glow: 'rgba(34, 197, 94, 0.4)',
    text: '#4ade80',
  },
};

export function ScoreBar({
  score,
  label,
  sublabel,
  color = 'gold',
  delay = 0,
  showValue = true,
}: ScoreBarProps) {
  const scheme = colorSchemes[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {/* 라벨 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{label}</span>
          {sublabel && (
            <span className="text-xs text-gray-500">({sublabel})</span>
          )}
        </div>
        {showValue && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
            className="text-sm font-semibold tabular-nums"
            style={{ color: scheme.text }}
          >
            {score}점
          </motion.span>
        )}
      </div>

      {/* 바 트랙 */}
      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/5">
        {/* 진행 바 */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{
            duration: 1,
            delay: delay + 0.1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: scheme.bar,
            boxShadow: `0 0 12px ${scheme.glow}`,
          }}
        >
          {/* 광택 효과 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
          />
        </motion.div>

        {/* 눈금 마커 (50점 위치) */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
      </div>
    </motion.div>
  );
}

/**
 * 이중 비교 바 (A vs B)
 */
interface DualScoreBarProps {
  label: string;
  scoreA: number;
  scoreB: number;
  nameA?: string;
  nameB?: string;
  delay?: number;
}

export function DualScoreBar({
  label,
  scoreA,
  scoreB,
  nameA = 'A',
  nameB = 'B',
  delay = 0,
}: DualScoreBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* 라벨 */}
      <div className="mb-3 text-center">
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>

      {/* A 점수 */}
      <div className="mb-2 flex items-center gap-3">
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #d4af37, #c9a227)',
            color: '#000',
          }}
          title={nameA}
        >
          {nameA.charAt(0)}
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scoreA}%` }}
            transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #c9a227, #d4af37)',
              boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
            }}
          />
        </div>
        <span className="w-8 text-right text-xs tabular-nums text-gray-400">{scoreA}</span>
      </div>

      {/* B 점수 */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #ec4899, #db2777)',
            color: '#fff',
          }}
          title={nameB}
        >
          {nameB.charAt(0)}
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scoreB}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #db2777, #ec4899)',
              boxShadow: '0 0 8px rgba(236, 72, 153, 0.3)',
            }}
          />
        </div>
        <span className="w-8 text-right text-xs tabular-nums text-gray-400">{scoreB}</span>
      </div>

      {/* 차이 표시 */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          차이: <span className="text-gray-400">{Math.abs(scoreA - scoreB)}점</span>
        </span>
      </div>
    </motion.div>
  );
}
