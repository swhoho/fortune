'use client';

import { motion } from 'framer-motion';
import { KeywordBadge } from './KeywordBadge';
import { ContentCard } from './ContentCard';
import { TraitGraph, type TraitItem } from './TraitGraph';
import type { ContentCardData, AptitudeExtendedData } from '@/types/report';

// ContentCardData를 re-export (하위 호환성)
export type { ContentCardData };

/** 적성 섹션 전체 데이터 */
export interface AptitudeSectionData {
  /** 적성 키워드 (8-10개) */
  keywords: string[];
  /** 주 재능 */
  mainTalent: ContentCardData;
  /** 재능의 상태 (deprecated: 재능 활용도와 중복, 삭제됨) */
  talentStatus?: ContentCardData;
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
  /** Task 25: 확장 데이터 (선택) */
  extended?: AptitudeExtendedData;
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
 * 3. 재능 활용 상태 - 현재 수준 vs 잠재력 (extended.talentUsage)
 * 4. 진로선택 - ContentCard
 * 5. 추천직종 - KeywordBadge 리스트
 * 6. 업무스타일 - ContentCard
 * 7. 학업스타일 - ContentCard
 * 8. 일자리 능력 - TraitGraph
 */
export function AptitudeSection({ data, className = '' }: AptitudeSectionProps) {
  const {
    keywords,
    mainTalent,
    careerChoice,
    recommendedJobs,
    workStyle,
    studyStyle,
    jobAbilityTraits,
    extended,
  } = data;

  // 확장 데이터 존재 여부
  const hasExtendedTalents = extended?.talents && extended.talents.length > 0;
  const hasAvoidFields = extended?.avoidFields && extended.avoidFields.length > 0;
  const hasTalentUsage =
    extended?.talentUsage &&
    (extended.talentUsage.currentLevel > 0 || extended.talentUsage.potential > 0);
  const hasRecommendedFields =
    extended?.recommendedFields && extended.recommendedFields.some((f) => f.suitability);

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
            <span className="text-sm text-gray-400">당신의 적성을 표시하는 키워드</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <KeywordBadge key={keyword} text={keyword} variant="secondary" delay={0.05 * index} />
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

      {/* 2-1. Task 25: 재능 상세 (basis, level) */}
      {hasExtendedTalents && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-3 rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-[#d4af37]/20 px-2.5 py-1 text-xs font-bold text-[#d4af37]">
              재능 상세
            </span>
            <span className="text-sm text-gray-400">각 재능의 근거와 수준</span>
          </div>
          <div className="space-y-4">
            {extended!.talents!.map((talent, idx) => (
              <motion.div
                key={talent.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.08 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{talent.name}</span>
                    {talent.basis && (
                      <span className="rounded bg-[#2a2a2a] px-2 py-0.5 text-xs text-[#d4af37]">
                        {talent.basis}
                      </span>
                    )}
                  </div>
                  {talent.level !== undefined && (
                    <span className="text-sm font-bold text-[#d4af37]">{talent.level}점</span>
                  )}
                </div>
                {talent.level !== undefined && (
                  <div className="h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${talent.level}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + idx * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d78c]"
                    />
                  </div>
                )}
                {talent.description && (
                  <p className="text-sm text-gray-400">{talent.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3. 재능 활용 상태 (현재 vs 잠재력) - 재능의 상태 ContentCard와 중복되어 통합 */}
      {hasTalentUsage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">
              재능 활용도
            </span>
          </div>
          <div className="space-y-4">
            {/* 현재 수준 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">현재 수준</span>
                <span className="text-sm font-bold text-blue-400">
                  {extended!.talentUsage!.currentLevel}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#2a2a2a]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${extended!.talentUsage!.currentLevel}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
            </div>
            {/* 잠재력 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">잠재력</span>
                <span className="text-sm font-bold text-emerald-400">
                  {extended!.talentUsage!.potential}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#2a2a2a]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${extended!.talentUsage!.potential}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </div>
            {/* 성장 여력 */}
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#0f0f0f] p-3">
              <svg
                className="h-5 w-5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span className="text-sm text-gray-300">
                성장 여력:{' '}
                <span className="font-bold text-amber-400">
                  {extended!.talentUsage!.potential - extended!.talentUsage!.currentLevel}%
                </span>
              </span>
            </div>
            {extended!.talentUsage!.advice && (
              <p className="mt-2 text-sm text-gray-400">{extended!.talentUsage!.advice}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* 4. 진로선택 */}
      <ContentCard
        label={careerChoice.label}
        title={careerChoice.title}
        content={careerChoice.content}
        delay={0.4}
      />

      {/* 5. 추천직종 (적합도 포함 가능) */}
      {(recommendedJobs.length > 0 || hasRecommendedFields) && (
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
          {/* 적합도가 있는 경우 상세 표시 */}
          {hasRecommendedFields ? (
            <div className="space-y-3">
              {extended!.recommendedFields!.map((field, idx) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{field.name}</span>
                      {field.suitability !== undefined && (
                        <span className="text-sm font-bold text-[#d4af37]">
                          {field.suitability}%
                        </span>
                      )}
                    </div>
                    {field.suitability !== undefined && (
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#2a2a2a]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${field.suitability}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + idx * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d78c]"
                        />
                      </div>
                    )}
                    {field.description && (
                      <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recommendedJobs.map((job, index) => (
                <KeywordBadge key={job} text={job} variant="primary" delay={0.05 * index} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 5-1. Task 25: 피해야 할 분야 */}
      {hasAvoidFields && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="rounded-xl border border-red-900/30 bg-red-950/20 p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2.5 py-1 text-xs font-bold text-red-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              피해야 할 분야
            </span>
          </div>
          <div className="space-y-3">
            {extended!.avoidFields!.map((field, idx) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + idx * 0.05 }}
                className="flex items-start gap-3 rounded-lg bg-[#1a1a1a]/50 p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                  <svg
                    className="h-3 w-3 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-medium text-red-300">{field.name}</span>
                  {field.reason && <p className="mt-1 text-sm text-gray-400">{field.reason}</p>}
                </div>
              </motion.div>
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
