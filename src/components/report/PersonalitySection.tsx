'use client';

import { motion } from 'framer-motion';
import { WillpowerGauge } from './WillpowerGauge';
import { PersonalityCard } from './PersonalityCard';
import type { WillpowerData, PersonalityCardData } from '@/types/report';

interface PersonalitySectionProps {
  willpower: WillpowerData;
  outerPersonality: PersonalityCardData;
  innerPersonality: PersonalityCardData;
  socialStyle: PersonalityCardData;
  className?: string;
}

/**
 * 성격 분석 섹션 컴포넌트
 * Task 13.3: 의지력 + 겉성격/속성격/대인관계
 */
export function PersonalitySection({
  willpower,
  outerPersonality,
  innerPersonality,
  socialStyle,
  className = '',
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
        <h2 className="font-serif text-xl font-bold text-[#1a1a1a] dark:text-white">성격과 특징</h2>
      </motion.div>

      {/* 의지력 게이지 */}
      <WillpowerGauge score={willpower.score} description={willpower.description} />

      {/* 성격 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 겉성격 */}
        <PersonalityCard
          label={outerPersonality.label}
          summary={outerPersonality.summary}
          description={outerPersonality.description}
          variant="highlight"
          delay={0}
        />

        {/* 속성격 */}
        <PersonalityCard
          label={innerPersonality.label}
          summary={innerPersonality.summary}
          description={innerPersonality.description}
          delay={0.1}
        />

        {/* 대인관계 */}
        <PersonalityCard
          label={socialStyle.label}
          summary={socialStyle.summary}
          description={socialStyle.description}
          delay={0.2}
          className="md:col-span-2 lg:col-span-1"
        />
      </div>
    </motion.section>
  );
}
