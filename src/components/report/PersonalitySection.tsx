'use client';

import { motion } from 'framer-motion';
import { WillpowerGauge } from './WillpowerGauge';
import { PersonalityCard } from './PersonalityCard';
import type { WillpowerData, PersonalityCardData, PersonalityExtendedData } from '@/types/report';

/** 재분석 핸들러 타입 */
type ReanalyzeSection = 'outer' | 'inner' | 'social';

interface PersonalitySectionProps {
  willpower: WillpowerData;
  outerPersonality: PersonalityCardData;
  innerPersonality: PersonalityCardData;
  socialStyle: PersonalityCardData;
  /** Task 25: 확장 데이터 (선택) */
  extended?: PersonalityExtendedData;
  className?: string;
  /** 섹션별 재분석 핸들러 (빈 데이터일 때 호출) */
  onReanalyze?: (section: ReanalyzeSection) => void;
  /** 재분석 진행 중인 섹션 */
  reanalyzingSection?: ReanalyzeSection | null;
}

/**
 * 성격 분석 섹션 컴포넌트
 * Task 13.3: 의지력 + 겉성격/속성격/대인관계
 * Phase 4: 빈 데이터 시 재분석 버튼 지원
 */
export function PersonalitySection({
  willpower,
  outerPersonality,
  innerPersonality,
  socialStyle,
  extended,
  className = '',
  onReanalyze,
  reanalyzingSection,
}: PersonalitySectionProps) {
  // 확장 데이터 존재 여부
  const hasExtendedSocialStyle = extended?.socialStyleDetail;
  const hasSocialType = hasExtendedSocialStyle && extended.socialStyleDetail?.type;
  const hasStrengths = hasExtendedSocialStyle && extended.socialStyleDetail?.strengths && extended.socialStyleDetail.strengths.length > 0;
  const hasWeaknesses = hasExtendedSocialStyle && extended.socialStyleDetail?.weaknesses && extended.socialStyleDetail.weaknesses.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`space-y-4 ${className}`}
    >
      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="h-6 w-1 rounded-full bg-[#d4af37]" />
        <h2 className="font-serif text-xl font-bold text-white">성격과 특징</h2>
      </motion.div>

      {/* 의지력 게이지 */}
      <WillpowerGauge score={willpower.score} description={willpower.description} />

      {/* 성격 카드 - 전체 너비 세로 배치 */}
      <div className="flex flex-col gap-4">
        {/* 겉성격 */}
        <PersonalityCard
          label={outerPersonality.label}
          summary={outerPersonality.summary}
          description={outerPersonality.description}
          variant="highlight"
          delay={0}
          onReanalyze={onReanalyze ? () => onReanalyze('outer') : undefined}
          isReanalyzing={reanalyzingSection === 'outer'}
        />

        {/* 속성격 */}
        <PersonalityCard
          label={innerPersonality.label}
          summary={innerPersonality.summary}
          description={innerPersonality.description}
          delay={0.1}
          onReanalyze={onReanalyze ? () => onReanalyze('inner') : undefined}
          isReanalyzing={reanalyzingSection === 'inner'}
        />

        {/* 대인관계 */}
        <PersonalityCard
          label={socialStyle.label}
          summary={socialStyle.summary}
          description={socialStyle.description}
          delay={0.2}
          onReanalyze={onReanalyze ? () => onReanalyze('social') : undefined}
          isReanalyzing={reanalyzingSection === 'social'}
        />

        {/* Task 25: 대인관계 상세 (유형/강점/약점) */}
        {hasExtendedSocialStyle && (hasSocialType || hasStrengths || hasWeaknesses) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl bg-[#1a1a1a] p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-[#d4af37]/20 px-2.5 py-1 text-xs font-bold text-[#d4af37]">
                대인관계 상세
              </span>
              {hasSocialType && (
                <span className="rounded-full bg-[#2a2a2a] px-3 py-1 text-sm text-gray-300">
                  {extended!.socialStyleDetail!.type}
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 강점 */}
              {hasStrengths && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold text-emerald-400">강점</span>
                  </div>
                  <ul className="space-y-1.5">
                    {extended!.socialStyleDetail!.strengths!.map((strength, idx) => (
                      <motion.li
                        key={strength}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {strength}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 약점 */}
              {hasWeaknesses && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-bold text-amber-400">약점</span>
                  </div>
                  <ul className="space-y-1.5">
                    {extended!.socialStyleDetail!.weaknesses!.map((weakness, idx) => (
                      <motion.li
                        key={weakness}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {weakness}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
