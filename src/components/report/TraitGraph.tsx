'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TraitBar } from './TraitBar';

/** 특성 아이템 */
export interface TraitItem {
  /** 특성명 */
  label: string;
  /** 점수 (0-100) */
  value: number;
}

/** 특성 설명 (점수 범위별) */
export interface TraitDescription {
  /** 특성명 */
  label: string;
  /** 낮은 점수 설명 (0-40) */
  low: string;
  /** 중간 점수 설명 (41-60) */
  medium: string;
  /** 높은 점수 설명 (61-100) */
  high: string;
}

interface TraitGraphProps {
  /** 그래프 제목 */
  title: string;
  /** 부제목 (선택) */
  subtitle?: string;
  /** 특성 목록 */
  traits: TraitItem[];
  /** 특성 설명 목록 (선택) */
  descriptions?: TraitDescription[];
  /** 색상 분기 기준선 (기본 50) */
  threshold?: number;
  /** 범례 표시 여부 */
  showLegend?: boolean;
  /** 설명 섹션 표시 여부 (기본 false) */
  showDescriptions?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 점수에 따른 설명 반환
 */
function getDescriptionByScore(description: TraitDescription, value: number): string {
  if (value <= 40) return description.low;
  if (value <= 60) return description.medium;
  return description.high;
}

/**
 * 점수에 따른 레벨 라벨 반환
 */
function getLevelLabel(value: number): { label: string; color: string } {
  if (value <= 40) return { label: '낮음', color: 'text-amber-400' };
  if (value <= 60) return { label: '보통', color: 'text-gray-400' };
  return { label: '높음', color: 'text-green-400' };
}

/**
 * 특성 그래프 컴포넌트
 * Task 15.1: 10개 성격 특성 가로 막대 그래프
 *
 * 구조:
 * - 헤더 (제목 + 부제목)
 * - 범례 (■ 50%미만 ■ 50%이상)
 * - TraitBar 리스트 (staggered 애니메이션)
 * - 설명 섹션 (펼침/접힘)
 */
export function TraitGraph({
  title,
  subtitle,
  traits,
  descriptions = [],
  threshold = 50,
  showLegend = true,
  showDescriptions = false,
  className = '',
}: TraitGraphProps) {
  const [isExpanded, setIsExpanded] = useState(showDescriptions);

  // 특성과 설명 매칭
  const traitsWithDescriptions = traits.map((trait) => {
    const desc = descriptions.find((d) => d.label === trait.label);
    return { ...trait, description: desc };
  });

  const hasDescriptions = descriptions.length > 0;

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
              <span>{threshold}점 미만</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
              <span>{threshold}점 이상</span>
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

      {/* 설명 섹션 토글 버튼 */}
      {hasDescriptions && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#242424] py-2.5 text-sm text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-gray-300"
        >
          <span>{isExpanded ? '상세 설명 접기' : '상세 설명 보기'}</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
      )}

      {/* 설명 섹션 */}
      <AnimatePresence>
        {hasDescriptions && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-4 border-t border-[#333] pt-5">
              {traitsWithDescriptions.map((trait, index) => {
                if (!trait.description) return null;
                const level = getLevelLabel(trait.value);
                const descriptionText = getDescriptionByScore(trait.description, trait.value);
                const barColor = trait.value < threshold ? '#f59e0b' : '#22c55e';

                return (
                  <motion.div
                    key={trait.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="rounded-lg bg-[#242424] p-4"
                  >
                    {/* 특성 헤더 */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* 특성명 */}
                        <span className="font-medium text-white">{trait.label}</span>
                        {/* 점수 배지 */}
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            backgroundColor: `${barColor}20`,
                            color: barColor,
                          }}
                        >
                          {trait.value}점
                        </span>
                      </div>
                      {/* 레벨 라벨 */}
                      <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
                    </div>
                    {/* 설명 텍스트 */}
                    <p className="text-sm leading-relaxed text-gray-400">{descriptionText}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
