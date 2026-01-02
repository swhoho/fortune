'use client';

/**
 * 분야별 연간 조언 컴포넌트
 * Task 20: 재물/연애/직장/건강 분야별 조언
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Heart,
  Briefcase,
  Activity,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { YearlyAdvice } from '@/lib/ai/types';

interface YearlyAdviceCardProps {
  /** 분야별 연간 조언 */
  yearlyAdvice: YearlyAdvice;
  /** 분석 대상 연도 */
  year: number;
}

/** 분야 정보 */
const AREAS = [
  {
    key: 'wealth' as const,
    label: '재물운',
    icon: Coins,
    color: '#eab308',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: '재정, 투자, 사업 관련',
  },
  {
    key: 'love' as const,
    label: '애정운',
    icon: Heart,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: '연애, 결혼, 인간관계',
  },
  {
    key: 'career' as const,
    label: '직장운',
    icon: Briefcase,
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '직장, 승진, 학업',
  },
  {
    key: 'health' as const,
    label: '건강운',
    icon: Activity,
    color: '#22c55e',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: '건강, 체력, 정신건강',
  },
];

export function YearlyAdviceCard({ yearlyAdvice, year }: YearlyAdviceCardProps) {
  const [selectedArea, setSelectedArea] = useState<keyof YearlyAdvice | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
        >
          <Lightbulb className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">
            {year}년 분야별 조언
          </h3>
          <p className="text-sm text-gray-500">각 분야를 탭하여 상세 조언을 확인하세요</p>
        </div>
      </div>

      {/* 분야별 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AREAS.map((area) => {
          const Icon = area.icon;
          const isSelected = selectedArea === area.key;
          const advice = yearlyAdvice[area.key];

          return (
            <motion.button
              key={area.key}
              onClick={() => setSelectedArea(isSelected ? null : area.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? `${area.bgColor} ${area.borderColor}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${area.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: area.color }} />
              </div>
              <p className="font-medium text-gray-900">{area.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{area.description}</p>

              {/* 확장 표시 */}
              <ChevronRight
                className={`absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform ${
                  isSelected ? 'rotate-90' : ''
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      {/* 선택된 분야 상세 */}
      <AnimatePresence>
        {selectedArea && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 overflow-hidden"
          >
            {(() => {
              const area = AREAS.find((a) => a.key === selectedArea);
              const advice = yearlyAdvice[selectedArea];
              if (!area || !advice) return null;

              const Icon = area.icon;

              return (
                <div
                  className={`rounded-xl border-2 p-5 ${area.bgColor} ${area.borderColor}`}
                >
                  {/* 헤더 */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: area.color }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {year}년 {area.label}
                      </h4>
                      <p className="text-sm text-gray-600">{area.description}</p>
                    </div>
                  </div>

                  {/* 조언 내용 */}
                  {typeof advice === 'string' ? (
                    <div className="rounded-lg bg-white/60 p-4">
                      <p className="text-gray-700">{advice}</p>
                    </div>
                  ) : typeof advice === 'object' ? (
                    <div className="space-y-4">
                      {/* 개요 */}
                      {advice.overview && (
                        <div className="rounded-lg bg-white/60 p-4">
                          <p className="text-sm font-medium text-gray-500">개요</p>
                          <p className="mt-1 text-gray-700">{advice.overview}</p>
                        </div>
                      )}

                      {/* 강점 */}
                      {advice.strengths && advice.strengths.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-gray-700">강점</p>
                          <div className="flex flex-wrap gap-2">
                            {advice.strengths.map((strength, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-white px-3 py-1 text-sm text-gray-700"
                              >
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 주의사항 */}
                      {advice.cautions && advice.cautions.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-gray-700">주의사항</p>
                          <div className="flex flex-wrap gap-2">
                            {advice.cautions.map((caution, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-white px-3 py-1 text-sm text-red-600"
                              >
                                {caution}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 행동 조언 */}
                      {advice.actions && advice.actions.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-gray-700">추천 행동</p>
                          <ul className="space-y-2">
                            {advice.actions.map((action, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 rounded-lg bg-white/60 p-3"
                              >
                                <span
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: area.color }}
                                >
                                  {i + 1}
                                </span>
                                <span className="text-sm text-gray-700">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 시기 */}
                      {advice.timing && (
                        <div className="rounded-lg bg-white/60 p-4">
                          <p className="text-sm font-medium text-gray-500">좋은 시기</p>
                          <p className="mt-1 text-gray-700">{advice.timing}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
