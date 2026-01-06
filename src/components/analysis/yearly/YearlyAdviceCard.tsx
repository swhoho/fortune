'use client';

/**
 * 6개 섹션 연간 조언 컴포넌트 (v2.0)
 * 상반기/하반기 구분 + 다크 테마
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Coins,
  Briefcase,
  FileText,
  Heart,
  Activity,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { YearlyAdvice, SectionContent } from '@/lib/ai/types';

interface YearlyAdviceCardProps {
  /** 6개 섹션 연간 조언 */
  yearlyAdvice: YearlyAdvice;
  /** 분석 대상 연도 */
  year: number;
}

/** 6개 섹션 정보 */
const SECTIONS = [
  {
    key: 'nature_and_soul' as const,
    label: '본연의 성정',
    description: '일간 심리학적 접근',
    icon: Brain,
    color: '#8b5cf6', // violet
    bgGlow: 'rgba(139, 92, 246, 0.15)',
  },
  {
    key: 'wealth_and_success' as const,
    label: '재물과 비즈니스',
    description: '재성/식상 분석',
    icon: Coins,
    color: '#d4af37', // 금색
    bgGlow: 'rgba(212, 175, 55, 0.15)',
  },
  {
    key: 'career_and_honor' as const,
    label: '직업과 명예',
    description: '관성 분석',
    icon: Briefcase,
    color: '#3b82f6', // blue
    bgGlow: 'rgba(59, 130, 246, 0.15)',
  },
  {
    key: 'document_and_wisdom' as const,
    label: '문서와 학업',
    description: '인성 분석',
    icon: FileText,
    color: '#10b981', // emerald
    bgGlow: 'rgba(16, 185, 129, 0.15)',
  },
  {
    key: 'relationship_and_love' as const,
    label: '인연과 관계',
    description: '연애/귀인운',
    icon: Heart,
    color: '#ec4899', // pink
    bgGlow: 'rgba(236, 72, 153, 0.15)',
  },
  {
    key: 'health_and_movement' as const,
    label: '건강과 이동',
    description: '건강/역마운',
    icon: Activity,
    color: '#22c55e', // green
    bgGlow: 'rgba(34, 197, 94, 0.15)',
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];
type HalfPeriod = 'first_half' | 'second_half';

export function YearlyAdviceCard({ yearlyAdvice, year }: YearlyAdviceCardProps) {
  const [selectedSection, setSelectedSection] = useState<SectionKey>('nature_and_soul'); // 기본으로 열림
  const [selectedHalf, setSelectedHalf] = useState<HalfPeriod>('first_half');

  /** 섹션 데이터 가져오기 */
  const getSectionData = (key: SectionKey): SectionContent | undefined => {
    return yearlyAdvice[key];
  };

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
            <h3 className="font-serif text-lg font-semibold text-white">{year}년 운세 심층 분석</h3>
            <p className="text-sm text-gray-400">6가지 삶의 영역별 상반기/하반기 흐름</p>
          </div>
        </div>
      </div>

      {/* 6개 섹션 그리드 */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {SECTIONS.map((section, index) => {
          const Icon = section.icon;
          const isSelected = selectedSection === section.key;
          const data = getSectionData(section.key);
          const hasData = !!data;

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
              <p className="font-medium text-white">{section.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{section.description}</p>

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
          const section = SECTIONS.find((s) => s.key === selectedSection);
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
                  <h4 className="text-lg font-semibold text-white">{section.label}</h4>
                  <p className="text-sm text-gray-400">{section.description}</p>
                </div>
              </div>

              {/* 상반기/하반기 탭 */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setSelectedHalf('first_half')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedHalf === 'first_half'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'bg-[#242424] text-gray-400 hover:bg-[#333] hover:text-white'
                  }`}
                >
                  상반기 (1~6월)
                </button>
                <button
                  onClick={() => setSelectedHalf('second_half')}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedHalf === 'second_half'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'bg-[#242424] text-gray-400 hover:bg-[#333] hover:text-white'
                  }`}
                >
                  하반기 (7~12월)
                </button>
              </div>

              {/* 본문 콘텐츠 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedHalf}
                  initial={{ opacity: 0, x: selectedHalf === 'first_half' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: selectedHalf === 'first_half' ? 10 : -10 }}
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
