'use client';

import { motion } from 'framer-motion';
import { WillpowerGauge } from './WillpowerGauge';
import { PersonalityCard } from './PersonalityCard';
import type { WillpowerData, PersonalityCardData } from '@/types/report';

/** 재분석 핸들러 타입 */
type ReanalyzeSection = 'outer' | 'inner' | 'social';

interface PersonalitySectionProps {
  willpower: WillpowerData;
  outerPersonality: PersonalityCardData;
  innerPersonality: PersonalityCardData;
  socialStyle: PersonalityCardData;
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
  className = '',
  onReanalyze,
  reanalyzingSection,
}: PersonalitySectionProps) {
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
      </div>
    </motion.section>
  );
}
