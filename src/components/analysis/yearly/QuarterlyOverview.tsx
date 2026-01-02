'use client';

/**
 * 분기별 하이라이트 컴포넌트
 * Task 20: 4분기 개요 카드
 */

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { QuarterlyHighlight } from '@/lib/ai/types';

interface QuarterlyOverviewProps {
  /** 분기별 하이라이트 데이터 */
  quarterlyHighlights: QuarterlyHighlight[];
  /** 분석 대상 연도 */
  year: number;
}

/** 분기 이름 */
const QUARTER_NAMES = ['1분기', '2분기', '3분기', '4분기'];
const QUARTER_MONTHS = ['1-3월', '4-6월', '7-9월', '10-12월'];

/** 분기 아이콘 */
const QUARTER_ICONS = [
  '🌱', // 봄 - 새싹
  '☀️', // 여름 - 태양
  '🍂', // 가을 - 낙엽
  '❄️', // 겨울 - 눈
];

/** 점수에 따른 배경색 */
function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-50 border-green-200';
  if (score >= 50) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

/** 점수에 따른 텍스트색 */
function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function QuarterlyOverview({ quarterlyHighlights, year }: QuarterlyOverviewProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

  // 평균 점수 계산
  const avgScore = Math.round(
    quarterlyHighlights.reduce((sum, q) => sum + q.score, 0) / quarterlyHighlights.length
  );

  // 최고/최저 분기 찾기
  const bestQuarter = quarterlyHighlights.reduce((a, b) => (a.score > b.score ? a : b));
  const worstQuarter = quarterlyHighlights.reduce((a, b) => (a.score < b.score ? a : b));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
          >
            <Target className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-gray-900">분기별 운세</h3>
            <p className="text-sm text-gray-500">{year}년 분기별 흐름을 확인하세요</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">연간 평균</p>
          <p className={`text-2xl font-bold ${getScoreTextColor(avgScore)}`}>{avgScore}점</p>
        </div>
      </div>

      {/* 분기별 요약 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">최고 분기</span>
          </div>
          <p className="mt-1 text-lg font-bold text-green-600">
            {QUARTER_NAMES[bestQuarter.quarter - 1]} ({bestQuarter.score}점)
          </p>
        </div>
        <div className="rounded-lg bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">주의 분기</span>
          </div>
          <p className="mt-1 text-lg font-bold text-red-600">
            {QUARTER_NAMES[worstQuarter.quarter - 1]} ({worstQuarter.score}점)
          </p>
        </div>
      </div>

      {/* 분기별 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quarterlyHighlights.map((quarter, index) => {
          const isCurrentQuarter = year === currentYear && quarter.quarter === currentQuarter;

          return (
            <motion.div
              key={quarter.quarter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${getScoreBgColor(quarter.score)} ${
                isCurrentQuarter ? 'ring-2 ring-[#d4af37] ring-offset-2' : ''
              }`}
            >
              {/* 분기 아이콘 */}
              <div className="absolute right-2 top-2 text-3xl opacity-30">
                {QUARTER_ICONS[quarter.quarter - 1]}
              </div>

              {/* 헤더 */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {QUARTER_NAMES[quarter.quarter - 1]}
                </span>
                <span className="text-sm text-gray-500">{QUARTER_MONTHS[quarter.quarter - 1]}</span>
                {isCurrentQuarter && (
                  <span
                    className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: BRAND_COLORS.primary, color: '#000' }}
                  >
                    <Sparkles className="h-3 w-3" />
                    현재
                  </span>
                )}
              </div>

              {/* 점수 */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getScoreTextColor(quarter.score)}`}>
                  {quarter.score}
                </span>
                <span className="text-sm text-gray-500">점</span>
              </div>

              {/* 테마 */}
              <p
                className="mt-2 text-sm font-medium"
                style={{ color: BRAND_COLORS.primary }}
              >
                {quarter.theme}
              </p>

              {/* 개요 */}
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{quarter.overview}</p>

              {/* 키워드 */}
              {quarter.keywords && quarter.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {quarter.keywords.slice(0, 3).map((keyword, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-white/60 px-2 py-0.5 text-xs text-gray-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              {/* 조언 */}
              {quarter.advice && (
                <div className="mt-3 rounded-lg bg-white/50 p-2">
                  <p className="text-xs text-gray-600">{quarter.advice}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
