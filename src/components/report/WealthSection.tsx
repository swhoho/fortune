'use client';

import { motion } from 'framer-motion';
import { ContentCard } from './ContentCard';
import { TraitGraph, type TraitItem } from './TraitGraph';
import type { ContentCardData } from '@/types/report';

/**
 * 재물운 섹션 데이터
 * Task 18: 재물운 섹션
 * 참조: docs/reference/fortune9.PNG
 */
export interface WealthSectionData {
  /** 재물복 카드 */
  wealthFortune: ContentCardData;
  /** 이성의 존재 카드 (선택) */
  partnerInfluence?: ContentCardData;
  /** 재물 특성 그래프 (5개 항목, 선택) */
  wealthTraits?: TraitItem[];
  /** 재물 점수 (0-100, 선택) */
  score?: number;
}

interface WealthSectionProps {
  /** 섹션 데이터 */
  data: WealthSectionData;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 재물운 섹션 컴포넌트
 * Task 18: 재물운 카드 + 특성 그래프
 *
 * 참조: docs/reference/fortune9.PNG
 *
 * 섹션 구조:
 * 1. 재물 특성 그래프 (5개 항목)
 * 2. 재물복 카드 (ContentCard, highlight)
 * 3. 이성의 존재 카드 (ContentCard)
 */
export function WealthSection({
  data,
  className = '',
}: WealthSectionProps) {
  const { wealthFortune, partnerInfluence, wealthTraits, score } = data;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative space-y-6 ${className}`}
    >
      {/* 배경 장식 - 미묘한 금색 글로우 */}
      <div className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full bg-[#d4af37]/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-32 w-32 rounded-full bg-[#d4af37]/5 blur-3xl" />

      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          {/* 재물 아이콘 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962e]"
          >
            <svg
              className="h-4 w-4 text-[#1a1a1a]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v1H8a1 1 0 100 2h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h.5a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H11V8h.5a1 1 0 100-2H11V5z" />
            </svg>
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-white">재물과 이성</h2>
        </div>

        {/* 점수 배지 (선택) */}
        {score !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-1.5 rounded-full bg-[#d4af37]/10 px-3 py-1"
          >
            <span className="text-xs text-[#d4af37]/70">재물운</span>
            <span className="text-sm font-bold text-[#d4af37]">{score}점</span>
          </motion.div>
        )}

        {/* 구분선 */}
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/50 to-transparent" />
      </motion.div>

      {/* 1. 재물 특성 그래프 (선택) - 레퍼런스에서 상단 위치 */}
      {wealthTraits && wealthTraits.length > 0 && (
        <TraitGraph
          title="재물특성"
          subtitle="나의 재물 성향을 나타내는 특성"
          traits={wealthTraits}
          threshold={50}
          showLegend={true}
        />
      )}

      {/* 2. 재물복 카드 */}
      <ContentCard
        label={wealthFortune.label || '재물복'}
        title={wealthFortune.title || '내안에 존재하는 재물복'}
        content={wealthFortune.content}
        variant="highlight"
        delay={0.1}
      />

      {/* 3. 이성의 존재 카드 (선택) */}
      {partnerInfluence && (
        <ContentCard
          label={partnerInfluence.label || '이성의 존재'}
          title={partnerInfluence.title || '내안에 있는 이성의 존재형태'}
          content={partnerInfluence.content}
          variant="default"
          delay={0.2}
        />
      )}

      {/* 하단 장식 라인 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mx-auto h-px w-1/2 origin-center bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"
      />
    </motion.section>
  );
}
