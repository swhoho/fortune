'use client';

/**
 * 월별 운세 타임라인 컴포넌트
 * Task 20: 12개월 운세 흐름 AreaChart + 월별 상세 + 다국어 지원
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
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { MonthlyFortune } from '@/lib/ai/types';

interface MonthlyTimelineProps {
  /** 월별 운세 데이터 */
  monthlyFortunes: MonthlyFortune[];
  /** 분석 대상 연도 */
  year: number;
}

/** 점수에 따른 색상 */
function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

/** 점수 트렌드 아이콘 */
function TrendIcon({ score }: { score: number }) {
  if (score >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (score >= 50) return <Minus className="h-4 w-4 text-yellow-500" />;
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

/** 커스텀 툴팁 */
function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string> & {
  payload?: { payload: MonthlyFortune & { monthName: string } }[];
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 shadow-lg">
      <p className="font-semibold text-white">{data.monthName}</p>
      <p className="text-sm" style={{ color: BRAND_COLORS.primary }}>
        {data.theme}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: getScoreColor(data.score) }}
        />
        <span className="text-sm font-medium text-white">{data.score}점</span>
      </div>
      {data.keywords && data.keywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.keywords.slice(0, 3).map((keyword, i) => (
            <span key={i} className="rounded bg-[#333] px-2 py-0.5 text-xs text-gray-300">
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MonthlyTimeline({ monthlyFortunes, year }: MonthlyTimelineProps) {
  const t = useTranslations('yearly.monthlyTimeline');
  const [expandedMonth, setExpandedMonth] = useState<number>(1); // 1월 기본 선택
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  /** 월 이름 가져오기 */
  const getMonthName = (month: number) => t(`months.${month}`);

  const chartData = monthlyFortunes.map((m) => ({
    ...m,
    monthName: getMonthName(m.month),
  }));

  const selectMonth = (month: number) => {
    setExpandedMonth(month); // 항상 선택 (닫힘 없음)
  };

  // 평균 점수 계산
  const avgScore = Math.round(
    monthlyFortunes.reduce((sum, m) => sum + m.score, 0) / monthlyFortunes.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full rounded-2xl border border-[#333] bg-[#1a1a1a] p-6 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">{t('title', { year })}</h3>
          <p className="text-sm text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{t('avgScore')}</p>
          <p className="text-2xl font-bold" style={{ color: getScoreColor(avgScore) }}>
            {avgScore}
          </p>
        </div>
      </div>

      {/* 차트 */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyScoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="monthName"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#333' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="#333" strokeDasharray="3 3" />
            {year === currentYear && (
              <ReferenceLine
                x={getMonthName(currentMonth)}
                stroke={BRAND_COLORS.primary}
                strokeWidth={2}
              />
            )}
            <Area
              type="monotone"
              dataKey="score"
              stroke={BRAND_COLORS.primary}
              strokeWidth={2}
              fill="url(#monthlyScoreGradient)"
              dot={{ fill: BRAND_COLORS.primary, strokeWidth: 0, r: 4 }}
              activeDot={{ fill: BRAND_COLORS.primary, strokeWidth: 2, stroke: '#1a1a1a', r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 월별 카드 그리드 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {monthlyFortunes.map((fortune) => {
          const isExpanded = expandedMonth === fortune.month;

          return (
            <motion.div
              key={fortune.month}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * fortune.month }}
            >
              <button
                onClick={() => selectMonth(fortune.month)}
                className={`w-full cursor-pointer touch-manipulation rounded-xl border-2 p-3 text-left transition-all hover:shadow-md active:scale-95 ${
                  isExpanded
                    ? 'border-[#d4af37] bg-[#d4af37]/10'
                    : 'border-[#333] bg-[#1a1a1a] hover:bg-[#242424]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    {getMonthName(fortune.month)}
                  </span>
                  <TrendIcon score={fortune.score} />
                </div>
                <p
                  className="mt-1 text-lg font-bold"
                  style={{ color: getScoreColor(fortune.score) }}
                >
                  {fortune.score}
                </p>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* 선택된 월 상세 정보 (항상 표시) */}
      <motion.div
        key={expandedMonth}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        {(() => {
          const fortune = monthlyFortunes.find((m) => m.month === expandedMonth);
          if (!fortune) return null;

          return (
            <div className="rounded-xl border border-[#333] bg-[#111111] p-5">
              <div className="mb-4">
                <h4 className="font-serif text-lg font-semibold text-white">
                  {getMonthName(expandedMonth)} -{' '}
                  <span style={{ color: BRAND_COLORS.primary }}>{fortune.theme}</span>
                </h4>
                <p className="mt-1 text-sm text-gray-400">{fortune.overview}</p>
              </div>

              {/* 키워드 */}
              {fortune.keywords && fortune.keywords.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {fortune.keywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="rounded-full px-3 py-1 text-sm"
                      style={{
                        backgroundColor: `${BRAND_COLORS.primary}20`,
                        color: BRAND_COLORS.primary,
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              {/* 조언 */}
              {fortune.advice && (
                <div className="rounded-lg bg-[#1a1a1a] p-4">
                  <p className="text-sm font-medium text-gray-300">{t('monthlyAdvice')}</p>
                  <p className="mt-1 text-sm text-gray-400">{fortune.advice}</p>
                </div>
              )}

              {/* 길일/흉일 요약 */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-900/20 p-3">
                  <p className="text-xs font-medium text-green-400">{t('lucky')}</p>
                  <p className="text-lg font-bold text-green-500">
                    {fortune.luckyDays?.length || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-red-900/20 p-3">
                  <p className="text-xs font-medium text-red-400">{t('unlucky')}</p>
                  <p className="text-lg font-bold text-red-500">
                    {fortune.unluckyDays?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </motion.div>
    </motion.div>
  );
}
