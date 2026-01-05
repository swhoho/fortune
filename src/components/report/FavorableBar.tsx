'use client';

import { motion } from 'framer-motion';

interface FavorableBarProps {
  /** 순풍운 비율 (0-100) */
  favorablePercent: number;
  /** 역풍운 비율 (0-100) */
  unfavorablePercent: number;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 순풍운/역풍운 비율 막대 그래프
 * 대운 분석에서 운의 흐름을 시각적으로 표현
 */
export function FavorableBar({
  favorablePercent,
  unfavorablePercent,
  compact = false,
}: FavorableBarProps) {
  // 비율 정규화 (합이 100이 아닐 경우 대비)
  const total = favorablePercent + unfavorablePercent;
  const normalizedFavorable = total > 0 ? (favorablePercent / total) * 100 : 50;
  const normalizedUnfavorable = total > 0 ? (unfavorablePercent / total) * 100 : 50;

  return (
    <div className={`w-full ${compact ? 'space-y-2' : 'space-y-3'}`}>
      {/* 순풍운 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={`font-medium text-[#f59e0b] ${compact ? 'text-xs' : 'text-sm'}`}>
            순풍 운
          </span>
          <span className={`font-bold text-[#f59e0b] ${compact ? 'text-xs' : 'text-sm'}`}>
            {Math.round(favorablePercent)}%
          </span>
        </div>
        <div className={`relative w-full overflow-hidden rounded-full bg-[#2a2a2a] ${compact ? 'h-2' : 'h-3'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${normalizedFavorable}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]"
            style={{
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
            }}
          />
          {/* 빛나는 효과 */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5, repeat: 0 }}
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </div>
      </div>

      {/* 역풍운 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={`font-medium text-[#ef4444] ${compact ? 'text-xs' : 'text-sm'}`}>
            역풍 운
          </span>
          <span className={`font-bold text-[#ef4444] ${compact ? 'text-xs' : 'text-sm'}`}>
            {Math.round(unfavorablePercent)}%
          </span>
        </div>
        <div className={`relative w-full overflow-hidden rounded-full bg-[#2a2a2a] ${compact ? 'h-2' : 'h-3'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${normalizedUnfavorable}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ef4444] to-[#f87171]"
            style={{
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
            }}
          />
          {/* 빛나는 효과 */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.6, repeat: 0 }}
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
