'use client';

import { motion } from 'framer-motion';
import { TraitBar } from './TraitBar';

/** 특성 아이템 */
export interface TraitItem {
  /** 특성명 */
  label: string;
  /** 점수 (0-100) */
  value: number;
}

interface TraitGraphProps {
  /** 그래프 제목 */
  title: string;
  /** 부제목 (선택) */
  subtitle?: string;
  /** 특성 목록 */
  traits: TraitItem[];
  /** 색상 분기 기준선 (기본 50) */
  threshold?: number;
  /** 범례 표시 여부 */
  showLegend?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 특성 그래프 컴포넌트
 * Task 15.1: 10개 성격 특성 가로 막대 그래프
 *
 * 구조:
 * - 헤더 (제목 + 부제목)
 * - 범례 (■ 50%미만 ■ 50%이상)
 * - TraitBar 리스트 (staggered 애니메이션)
 */
export function TraitGraph({
  title,
  subtitle,
  traits,
  threshold = 50,
  showLegend = true,
  className = '',
}: TraitGraphProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl bg-[#1a1a1a] p-5 ${className}`}
    >
      {/* 헤더 영역 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* 제목 + 부제목 */}
        <div className="flex items-center gap-3">
          {/* 제목 태그 */}
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center rounded-md bg-[#d4af37] px-2.5 py-1 text-xs font-bold text-[#1a1a1a]"
          >
            {title}
          </motion.span>

          {/* 부제목 */}
          {subtitle && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-sm text-gray-400"
            >
              {subtitle}
            </motion.span>
          )}
        </div>

        {/* 범례 */}
        {showLegend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-center gap-4 text-xs text-gray-400"
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
              <span>{threshold}%미만</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
              <span>{threshold}%이상</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* 특성 바 리스트 */}
      <div className="space-y-2.5">
        {traits.map((trait, index) => (
          <TraitBar
            key={trait.label}
            label={trait.label}
            value={trait.value}
            threshold={threshold}
            delay={0.1 * index}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {traits.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500">표시할 특성이 없습니다</div>
      )}
    </motion.div>
  );
}
