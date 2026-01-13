'use client';

/**
 * 6개 섹션 연간 조언 컴포넌트 (v2.0)
 * 상반기/하반기 구분 + 다크 테마 + 다국어 지원
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Brain,
  Coins,
  Briefcase,
  FileText,
  Heart,
  Activity,
  Sparkles,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';
import type { YearlyAdvice, SectionContent } from '@/lib/ai/types';

interface YearlyAdviceCardProps {
  /** 6개 섹션 연간 조언 */
  yearlyAdvice: YearlyAdvice;
  /** 분석 대상 연도 */
  year: number;
}

/** 섹션 키 타입 */
type SectionKey =
  | 'natureAndSoul'
  | 'wealthAndSuccess'
  | 'careerAndHonor'
  | 'documentAndWisdom'
  | 'relationshipAndLove'
  | 'healthAndMovement';

/** 6개 섹션 정보 (camelCase 키 - DB 저장 형식과 일치) */
const SECTION_CONFIG: {
  key: SectionKey;
  icon: LucideIcon;
  color: string;
  bgGlow: string;
}[] = [
  {
    key: 'natureAndSoul',
    icon: Brain,
    color: '#8b5cf6', // violet
    bgGlow: 'rgba(139, 92, 246, 0.15)',
  },
  {
    key: 'wealthAndSuccess',
    icon: Coins,
    color: '#d4af37', // 금색
    bgGlow: 'rgba(212, 175, 55, 0.15)',
  },
  {
    key: 'careerAndHonor',
    icon: Briefcase,
    color: '#3b82f6', // blue
    bgGlow: 'rgba(59, 130, 246, 0.15)',
  },
  {
    key: 'documentAndWisdom',
    icon: FileText,
    color: '#10b981', // emerald
    bgGlow: 'rgba(16, 185, 129, 0.15)',
  },
  {
    key: 'relationshipAndLove',
    icon: Heart,
    color: '#ec4899', // pink
    bgGlow: 'rgba(236, 72, 153, 0.15)',
  },
  {
    key: 'healthAndMovement',
    icon: Activity,
    color: '#22c55e', // green
    bgGlow: 'rgba(34, 197, 94, 0.15)',
  },
];

type HalfPeriod = 'firstHalf' | 'secondHalf';

export function YearlyAdviceCard({ yearlyAdvice, year }: YearlyAdviceCardProps) {
  const t = useTranslations('yearly.adviceCard');
  const [selectedSection, setSelectedSection] = useState<SectionKey>('natureAndSoul'); // 기본으로 열림
  const [selectedHalf, setSelectedHalf] = useState<HalfPeriod>('firstHalf');

  /** 섹션 데이터 가져오기 */
  const getSectionData = (key: SectionKey): SectionContent | undefined => {
    return yearlyAdvice[key];
  };

  /** 번역된 섹션 라벨/설명 가져오기 */
  const getSectionLabel = (key: SectionKey) => t(`sections.${key}.label`);
  const getSectionDesc = (key: SectionKey) => t(`sections.${key}.description`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full overflow-hidden rounded-2xl border border-[#333] bg-[#1a1a1a]"
    >
      {/* 헤더 */}
      <div className="border-b border-[#333] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d4af37]/20">
            <Sparkles className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-white">{t('title', { year })}</h3>
            <p className="text-sm text-gray-400">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* 6개 섹션 그리드 */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {SECTION_CONFIG.map((section, index) => {
          const Icon = section.icon;
          const isSelected = selectedSection === section.key;
          const data = getSectionData(section.key);
          const hasData = !!data;
          const label = getSectionLabel(section.key);
          const description = getSectionDesc(section.key);

          return (
            <motion.button
              key={section.key}
              onClick={() => {
                if (hasData) {
                  setSelectedSection(section.key); // 항상 선택 (닫힘 없음)
                }
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              disabled={!hasData}
              className={`relative rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-[#d4af37]/50 bg-[#242424]'
                  : hasData
                    ? 'border-[#333] bg-[#1a1a1a] hover:border-[#444] hover:bg-[#242424]'
                    : 'cursor-not-allowed border-[#333] bg-[#1a1a1a] opacity-50'
              }`}
              style={
                isSelected
                  ? {
                      boxShadow: `0 0 20px ${section.bgGlow}`,
                    }
                  : undefined
              }
            >
              {/* 아이콘 */}
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${section.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: section.color }} />
              </div>

              {/* 라벨 */}
              <p className="font-medium text-white">{label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{description}</p>

              {/* 선택 표시 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: section.color }}
                >
                  <ChevronDown className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 선택된 섹션 상세 (항상 표시) */}
      <motion.div
        key={selectedSection}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        {(() => {
          const section = SECTION_CONFIG.find((s) => s.key === selectedSection);
          const data = getSectionData(selectedSection);
          if (!section || !data) return null;

          const Icon = section.icon;

          return (
            <div className="border-t border-[#333] bg-[#111111] p-5">
              {/* 섹션 헤더 */}
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: section.color }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{getSectionLabel(section.key)}</h4>
                  <p className="text-sm text-gray-400">{getSectionDesc(section.key)}</p>
                </div>
              </div>

              {/* 상반기/하반기 탭 */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setSelectedHalf('firstHalf')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedHalf === 'firstHalf'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'bg-[#242424] text-gray-400 hover:bg-[#333] hover:text-white'
                  }`}
                >
                  {t('tabs.firstHalf')}
                </button>
                <button
                  onClick={() => setSelectedHalf('secondHalf')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedHalf === 'secondHalf'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'bg-[#242424] text-gray-400 hover:bg-[#333] hover:text-white'
                  }`}
                >
                  {t('tabs.secondHalf')}
                </button>
              </div>

              {/* 본문 콘텐츠 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedHalf}
                  initial={{ opacity: 0, x: selectedHalf === 'firstHalf' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: selectedHalf === 'firstHalf' ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl bg-[#1a1a1a] p-5"
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-300">
                    {data[selectedHalf]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })()}
      </motion.div>
    </motion.div>
  );
}
