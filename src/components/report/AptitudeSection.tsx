'use client';

import { motion } from 'framer-motion';
import { KeywordBadge } from './KeywordBadge';
import { ContentCard } from './ContentCard';
import { TraitGraph, type TraitItem } from './TraitGraph';
import type { ContentCardData } from '@/types/report';

// ContentCardData를 re-export (하위 호환성)
export type { ContentCardData };

/** 적성 섹션 전체 데이터 */
export interface AptitudeSectionData {
  /** 적성 키워드 (8-10개) */
  keywords: string[];
  /** 주 재능 */
  mainTalent: ContentCardData;
  /** 재능의 상태 */
  talentStatus: ContentCardData;
  /** 진로선택 */
  careerChoice: ContentCardData;
  /** 추천직종 */
  recommendedJobs: string[];
  /** 업무스타일 */
  workStyle: ContentCardData;
  /** 학업스타일 */
  studyStyle: ContentCardData;
  /** 일자리 능력 그래프 */
  jobAbilityTraits: TraitItem[];
}

interface AptitudeSectionProps {
  /** 섹션 데이터 */
  data: AptitudeSectionData;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 적성/재능 섹션 컴포넌트
 * Task 16.1: 적성 섹션 전체 조합
 *
 * 섹션 구조 (fortune5~7.PNG 참조):
 * 1. 적성키워드 - KeywordBadge 그리드
 * 2. 주 재능 - ContentCard
 * 3. 재능의 상태 - ContentCard
 * 4. 진로선택 - ContentCard
 * 5. 추천직종 - KeywordBadge 리스트
 * 6. 업무스타일 - ContentCard
 * 7. 학업스타일 - ContentCard
 * 8. 일자리 능력 - TraitGraph
 */
export function AptitudeSection({
  data,
  className = '',
}: AptitudeSectionProps) {
  const {
    keywords,
    mainTalent,
    talentStatus,
    careerChoice,
    recommendedJobs,
    workStyle,
    studyStyle,
    jobAbilityTraits,
  } = data;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <h2 className="font-serif text-xl font-bold text-white">적성과 직업</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/50 to-transparent" />
      </motion.div>

      {/* 1. 적성 키워드 */}
      {keywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-[#d4af37] px-2.5 py-1 text-xs font-bold text-[#1a1a1a]">
              적성키워드
            </span>
            <span className="text-sm text-gray-400">
              당신의 적성을 표시하는 키워드
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <KeywordBadge
                key={keyword}
                text={keyword}
                variant="secondary"
                delay={0.05 * index}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* 2. 주 재능 */}
      <ContentCard
        label={mainTalent.label}
        title={mainTalent.title}
        content={mainTalent.content}
        variant="highlight"
        delay={0.2}
      />

      {/* 3. 재능의 상태 */}
      <ContentCard
        label={talentStatus.label}
        title={talentStatus.title}
        content={talentStatus.content}
        delay={0.3}
      />

      {/* 4. 진로선택 */}
      <ContentCard
        label={careerChoice.label}
        title={careerChoice.title}
        content={careerChoice.content}
        delay={0.4}
      />

      {/* 5. 추천직종 */}
      {recommendedJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-[#d4af37]/20 px-2.5 py-1 text-xs font-bold text-[#d4af37]">
              추천직종
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedJobs.map((job, index) => (
              <KeywordBadge
                key={job}
                text={job}
                variant="primary"
                delay={0.05 * index}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* 6. 업무스타일 */}
      <ContentCard
        label={workStyle.label}
        title={workStyle.title}
        content={workStyle.content}
        delay={0.6}
      />

      {/* 7. 학업스타일 */}
      <ContentCard
        label={studyStyle.label}
        title={studyStyle.title}
        content={studyStyle.content}
        delay={0.7}
      />

      {/* 8. 일자리 능력 그래프 */}
      {jobAbilityTraits.length > 0 && (
        <TraitGraph
          title="일자리 능력"
          subtitle="각 단계별 능력 비율"
          traits={jobAbilityTraits}
          threshold={50}
          showLegend={true}
        />
      )}
    </motion.section>
  );
}
