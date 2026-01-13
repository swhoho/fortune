'use client';

import { motion } from 'framer-motion';

interface TraitBarProps {
  /** 특성명 (의지력, 사교력 등) */
  label: string;
  /** 점수 (0-100) */
  value: number;
  /** 색상 분기 기준선 (기본 50) */
  threshold?: number;
  /** 애니메이션 딜레이 (초) */
  delay?: number;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 특성 막대 컴포넌트
 * Task 15.2: 단일 가로 막대 그래프
 *
 * 레이아웃: [라벨] ████████░░░░░░░░░░ [퍼센트]
 * 색상: threshold 미만 = 주황, 이상 = 빨강
 */
export function TraitBar({
  label,
  value,
  threshold = 50,
  delay = 0,
  className = '',
}: TraitBarProps) {
  // 값 범위 제한 (0-100)
  const clampedValue = Math.max(0, Math.min(100, value));

  // 기준선 기준 색상 결정
  const getBarColor = () => {
    return clampedValue < threshold ? '#f59e0b' : '#22c55e';
  };

  const barColor = getBarColor();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`flex items-center gap-3 ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* 라벨 영역 - 고정 너비 (5자 한글 대응) */}
      <div className="w-20 shrink-0">
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>

      {/* 막대 영역 - flex-1 */}
      <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-[#2a2a2a]">
        {/* 채움 막대 */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{
            duration: 0.8,
            delay: delay + 0.2,
            ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
          }}
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            background: `linear-gradient(90deg, ${barColor}90, ${barColor})`,
            boxShadow: `0 0 8px ${barColor}30`,
          }}
        />

        {/* 미묘한 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
      </div>

      {/* 퍼센트 표시 - 고정 너비 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.6 }}
        className="w-10 shrink-0 text-right"
      >
        <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
          {clampedValue}점
        </span>
      </motion.div>
    </motion.div>
  );
}
