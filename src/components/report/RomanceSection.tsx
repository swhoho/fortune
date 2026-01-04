'use client';

import { motion } from 'framer-motion';
import { ContentCard } from './ContentCard';
import { TraitGraph, type TraitItem } from './TraitGraph';
import type { ContentCardData } from '@/types/report';

/**
 * 연애 특성 데이터 (10개 항목)
 * Task 19: 연애/결혼 섹션
 * 참조: docs/reference/fortune10-11.PNG
 */
export interface RomanceTraitsData {
  /** 배려심 */
  consideration: number;
  /** 유머감각 */
  humor: number;
  /** 예술성 */
  artistry: number;
  /** 허영심 */
  vanity: number;
  /** 모험심 */
  adventure: number;
  /** 성실도 */
  sincerity: number;
  /** 사교력 */
  sociability: number;
  /** 재테크 */
  financial: number;
  /** 신뢰성 */
  reliability: number;
  /** 표현력 */
  expression: number;
}

/**
 * 연애/결혼 섹션 데이터
 * Task 19: 연애/결혼 섹션
 * 참조: docs/reference/fortune10-11.PNG
 */
export interface RomanceSectionData {
  /** 연애심리 */
  datingPsychology: ContentCardData;
  /** 배우자관 */
  spouseView: ContentCardData;
  /** 성격패턴 (선택) */
  personalityPattern?: ContentCardData;
  /** 연애 특성 그래프 */
  romanceTraits: RomanceTraitsData;
  /** 연애 점수 (0-100, 선택) */
  score?: number;
}

interface RomanceSectionProps {
  /** 섹션 데이터 */
  data: RomanceSectionData;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 연애/결혼 섹션 컴포넌트
 * Task 19: 연애 카드 3개 + 특성 그래프
 *
 * 참조: docs/reference/fortune10-11.PNG
 *
 * 섹션 구조:
 * 1. 연애심리 카드 (ContentCard, highlight)
 * 2. 배우자관 카드 (ContentCard)
 * 3. 성격패턴 카드 (ContentCard, 선택)
 * 4. 연애 특성 그래프 (10개 항목)
 */
export function RomanceSection({
  data,
  className = '',
}: RomanceSectionProps) {
  const { datingPsychology, spouseView, personalityPattern, romanceTraits, score } = data;

  // 연애 특성 데이터를 TraitItem 배열로 변환
  const romanceItems: TraitItem[] = [
    { label: '배려심', value: romanceTraits.consideration },
    { label: '유머감각', value: romanceTraits.humor },
    { label: '예술성', value: romanceTraits.artistry },
    { label: '허영심', value: romanceTraits.vanity },
    { label: '모험심', value: romanceTraits.adventure },
    { label: '성실도', value: romanceTraits.sincerity },
    { label: '사교력', value: romanceTraits.sociability },
    { label: '재테크', value: romanceTraits.financial },
    { label: '신뢰성', value: romanceTraits.reliability },
    { label: '표현력', value: romanceTraits.expression },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative space-y-6 ${className}`}
    >
      {/* 배경 장식 - 미묘한 핑크 글로우 */}
      <div className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full bg-pink-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-32 w-32 rounded-full bg-[#d4af37]/5 blur-3xl" />

      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          {/* 하트 아이콘 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600"
          >
            <svg
              className="h-4 w-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-white">연애와 결혼</h2>
        </div>

        {/* 점수 배지 (선택) */}
        {score !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1"
          >
            <span className="text-xs text-pink-400/70">연애운</span>
            <span className="text-sm font-bold text-pink-400">{score}점</span>
          </motion.div>
        )}

        {/* 구분선 */}
        <div className="h-px flex-1 bg-gradient-to-r from-pink-500/50 via-[#d4af37]/30 to-transparent" />
      </motion.div>

      {/* 1. 연애심리 카드 */}
      <ContentCard
        label={datingPsychology.label || '연애심리'}
        title={datingPsychology.title || '결혼전 연애/데이트 심리'}
        content={datingPsychology.content}
        variant="highlight"
        delay={0.1}
      />

      {/* 2. 배우자관 카드 */}
      <ContentCard
        label={spouseView.label || '배우자관'}
        title={spouseView.title || '결혼후 배우자를 보는 눈'}
        content={spouseView.content}
        variant="default"
        delay={0.2}
      />

      {/* 3. 성격패턴 카드 (선택) */}
      {personalityPattern && (
        <ContentCard
          label={personalityPattern.label || '성격패턴'}
          title={personalityPattern.title || '결혼후 성격인 패턴'}
          content={personalityPattern.content}
          variant="default"
          delay={0.3}
        />
      )}

      {/* 4. 연애 특성 그래프 */}
      <TraitGraph
        title="특징그래프"
        subtitle="연애적성을 파악하는 특징 10개"
        traits={romanceItems}
        threshold={50}
        showLegend={true}
      />

      {/* 하단 장식 라인 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mx-auto h-px w-1/2 origin-center bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"
      />
    </motion.section>
  );
}
