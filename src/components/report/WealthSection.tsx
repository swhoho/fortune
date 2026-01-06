'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ContentCard } from './ContentCard';
import { TraitGraph, type TraitItem } from './TraitGraph';
import type { ContentCardData, WealthExtendedData } from '@/types/report';

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
  /** Task 25: 확장 데이터 (선택) */
  extended?: WealthExtendedData;
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
export function WealthSection({ data, className = '' }: WealthSectionProps) {
  const t = useTranslations('report.wealth');
  const { wealthFortune, partnerInfluence, wealthTraits, score, extended } = data;

  // 확장 데이터 존재 여부
  const hasPattern = extended?.pattern;
  const hasStrengths = extended?.strengths && extended.strengths.length > 0;
  const hasRisks = extended?.risks && extended.risks.length > 0;
  const hasAdvice = extended?.advice;

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
            <svg className="h-4 w-4 text-[#1a1a1a]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v1H8a1 1 0 100 2h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h.5a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H11V8h.5a1 1 0 100-2H11V5z" />
            </svg>
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        </div>

        {/* 점수 배지 (선택) */}
        {score !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-1.5 rounded-full bg-[#d4af37]/10 px-3 py-1"
          >
            <span className="text-xs text-[#d4af37]/70">{t('score')}</span>
            <span className="text-sm font-bold text-[#d4af37]">{score}</span>
          </motion.div>
        )}

        {/* 구분선 */}
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/50 to-transparent" />
      </motion.div>

      {/* Task 25: 재물 패턴 배지 */}
      {hasPattern && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#d4af37]/10 to-amber-500/10 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]/20">
            <svg className="h-5 w-5 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v1H8a1 1 0 100 2h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h.5a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H11V8h.5a1 1 0 100-2H11V5z" />
            </svg>
          </div>
          <div>
            <span className="text-xs text-gray-400">재물 패턴</span>
            <p className="font-bold text-[#d4af37]">{extended!.pattern}</p>
          </div>
        </motion.div>
      )}

      {/* Task 25: 재물 강점 */}
      {hasStrengths && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              재물 강점
            </span>
          </div>
          <div className="space-y-2">
            {extended!.strengths!.map((strength, idx) => (
              <motion.div
                key={strength}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">{strength}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Task 25: 재물 리스크 */}
      {hasRisks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              재물 주의사항
            </span>
          </div>
          <div className="space-y-3">
            {extended!.risks!.map((risk, idx) => (
              <motion.div
                key={risk}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                className="flex items-start gap-3 rounded-lg bg-[#1a1a1a]/50 p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
                <span className="text-gray-300">{risk}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 1. 재물 특성 그래프 (선택) - 레퍼런스에서 상단 위치 */}
      {wealthTraits && wealthTraits.length > 0 && (
        <TraitGraph
          title={t('traits')}
          subtitle={t('traitsDesc')}
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

      {/* Task 25: 재물 조언 */}
      {hasAdvice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-bold text-[#d4af37]">재물 조언</span>
          </div>
          <p className="text-gray-300 leading-relaxed">{extended!.advice}</p>
        </motion.div>
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
