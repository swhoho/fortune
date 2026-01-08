'use client';

/**
 * 10년 대운 타임라인 컴포넌트
 * Recharts AreaChart + 아코디언 확장 기능
 */

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { YearlyFlow } from '@/lib/ai/types';
import type { DaewunItem } from '@/types/saju';

/** 천간 목록 */
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

/** 지지 목록 */
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

interface DaewunTimelineProps {
  /** 연도별 운세 흐름 */
  yearlyFlow: YearlyFlow[];
  /** 대운 데이터 */
  daewun: DaewunItem[];
}

/**
 * 점수에 따른 색상
 */
function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'; // green
  if (score >= 50) return '#eab308'; // yellow
  return '#ef4444'; // red
}

/**
 * 커스텀 툴팁
 */
function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string> & { payload?: { payload: YearlyFlow }[] }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as YearlyFlow;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="font-semibold text-gray-900">{data.year}년</p>
      <p className="text-sm text-gray-500">{data.theme}</p>
      <div className="mt-2 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: getScoreColor(data.score) }}
        />
        <span className="text-sm font-medium">{data.score}점</span>
      </div>
      {data.advice && <p className="mt-2 max-w-[200px] text-xs text-gray-600">{data.advice}</p>}
    </div>
  );
}

export function DaewunTimeline({ yearlyFlow, daewun }: DaewunTimelineProps) {
  const t = useTranslations('saju');
  const currentYear = new Date().getFullYear();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  /** 천간 정보 조회 */
  const getStemInfo = (stem: string) => {
    if (STEMS.includes(stem as (typeof STEMS)[number])) {
      return {
        name: t.raw(`stems.${stem}.name`) as string,
        meaning: t.raw(`stems.${stem}.meaning`) as string,
      };
    }
    return null;
  };

  /** 지지 정보 조회 */
  const getBranchInfo = (branch: string) => {
    if (BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
      return {
        name: t.raw(`branches.${branch}.name`) as string,
        meaning: t.raw(`branches.${branch}.meaning`) as string,
      };
    }
    return null;
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* 헤더 */}
      <h3 className="mb-6 font-serif text-lg font-semibold text-gray-900">{t('daewun.fortuneFlow')}</h3>

      {/* 차트 */}
      {yearlyFlow && yearlyFlow.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={yearlyFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={BRAND_COLORS.primary}
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 대운 카드 */}
      {daewun && daewun.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-500">
            {t('daewun.tenYearTitle')} <span className="text-xs font-normal">({t('daewun.clickToExpand')})</span>
          </h4>
          <div className="space-y-3">
            {daewun.slice(0, 4).map((d, index) => {
              const isActive = currentYear >= d.startYear && currentYear < d.startYear + 10;
              const isExpanded = expandedIndex === index;
              const stemInfo = getStemInfo(d.stem);
              const branchInfo = getBranchInfo(d.branch);

              return (
                <motion.div
                  key={d.age}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`overflow-hidden rounded-lg border transition-all ${
                    isActive ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* 카드 헤더 (클릭 가능) */}
                  <button
                    onClick={() => toggleExpand(index)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-100/50"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="font-serif text-xl font-bold"
                        style={isActive ? { color: BRAND_COLORS.primary } : undefined}
                      >
                        {d.stem}
                        {d.branch}
                      </span>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">
                          {d.startYear}~{d.startYear + 9}년
                        </p>
                        <p className="text-xs text-gray-400">
                          {d.age}~{d.age + 9}세
                        </p>
                      </div>
                      {isActive && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: BRAND_COLORS.primary,
                            color: '#000',
                          }}
                        >
                          {t('daewun.current')}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* 확장 콘텐츠 (아코디언) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 border-t border-gray-200 p-4">
                          {/* 천간 의미 */}
                          <div>
                            <h5 className="text-xs font-medium text-gray-500">{t('daewun.heavenlyStem')}</h5>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {stemInfo?.name || d.stem}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-600">
                              {stemInfo?.meaning || t('daewun.defaultStemMeaning')}
                            </p>
                          </div>

                          {/* 지지 의미 */}
                          <div>
                            <h5 className="text-xs font-medium text-gray-500">{t('daewun.earthlyBranch')}</h5>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {branchInfo?.name || d.branch}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-600">
                              {branchInfo?.meaning || t('daewun.defaultBranchMeaning')}
                            </p>
                          </div>

                          {/* 종합 조언 */}
                          <div className="rounded-lg bg-gray-100 p-3">
                            <h5 className="text-xs font-medium text-gray-500">{t('daewun.overallAdvice')}</h5>
                            <p className="mt-1 text-sm text-gray-700">
                              {stemInfo && branchInfo
                                ? `${stemInfo.name}와 ${branchInfo.name}이 결합한 이 대운에서는 ${
                                    isActive
                                      ? t('daewun.activeAdvice')
                                      : t('daewun.defaultAdvice')
                                  }`
                                : t('daewun.fallbackAdvice')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
