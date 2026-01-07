'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DetailedScoresData } from '@/types/report';

interface DetailedScoresSectionProps {
  data: DetailedScoresData;
  className?: string;
}

/**
 * 세부 점수 분석 섹션 컴포넌트
 * Task 25: 레이더 차트로 연애/업무 점수 시각화
 *
 * 구성:
 * 1. 연애 레이더 차트 (10개 항목)
 * 2. 업무 레이더 차트 (5개 항목)
 * 3. 재물/적성 바 차트 (4개 항목)
 */
export function DetailedScoresSection({ data, className = '' }: DetailedScoresSectionProps) {
  const t = useTranslations('report.detailedScores');
  const { love, work, wealth, aptitude } = data;

  // 연애 레이더 데이터
  const loveRadarData = [
    { subject: t('loveLabels.humor'), value: love.humor, fullMark: 100 },
    { subject: t('loveLabels.emotion'), value: love.emotion, fullMark: 100 },
    { subject: t('loveLabels.finance'), value: love.finance, fullMark: 100 },
    { subject: t('loveLabels.adventure'), value: love.adventure, fullMark: 100 },
    { subject: t('loveLabels.sincerity'), value: love.sincerity, fullMark: 100 },
    { subject: t('loveLabels.selfEsteem'), value: love.selfEsteem, fullMark: 100 },
    { subject: t('loveLabels.sociability'), value: love.sociability, fullMark: 100 },
    { subject: t('loveLabels.consideration'), value: love.consideration, fullMark: 100 },
    { subject: t('loveLabels.expressiveness'), value: love.expressiveness, fullMark: 100 },
    { subject: t('loveLabels.trustworthiness'), value: love.trustworthiness, fullMark: 100 },
  ];

  // 업무 레이더 데이터
  const workRadarData = [
    { subject: t('workLabels.drive'), value: work.drive, fullMark: 100 },
    { subject: t('workLabels.planning'), value: work.planning, fullMark: 100 },
    { subject: t('workLabels.execution'), value: work.execution, fullMark: 100 },
    { subject: t('workLabels.completion'), value: work.completion, fullMark: 100 },
    { subject: t('workLabels.management'), value: work.management, fullMark: 100 },
  ];

  // 재물/적성 데이터
  const otherScoresData = [
    { label: t('wealthLabels.growth'), value: wealth.growth, color: '#22c55e' },
    { label: t('wealthLabels.stability'), value: wealth.stability, color: '#3b82f6' },
    { label: t('aptitudeLabels.artistry'), value: aptitude.artistry, color: '#a855f7' },
    { label: t('aptitudeLabels.business'), value: aptitude.business, color: '#f59e0b' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative space-y-8 ${className}`}
    >
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full bg-[#d4af37]/5 blur-3xl" />

      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962e]"
          >
            <svg className="h-4 w-4 text-[#1a1a1a]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/50 to-transparent" />
      </motion.div>

      {/* 레이더 차트 그리드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 연애 레이더 차트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5"
        >
          <div className="mb-4">
            <h3 className="font-semibold text-white">{t('loveRadar')}</h3>
            <p className="text-xs text-gray-500">{t('loveRadarDesc')}</p>
          </div>
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={loveRadarData}
                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
              >
                <PolarGrid stroke="#333" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#666', fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="연애 역량"
                  dataKey="value"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value}점`, '점수']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 업무 레이더 차트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5"
        >
          <div className="mb-4">
            <h3 className="font-semibold text-white">{t('workRadar')}</h3>
            <p className="text-xs text-gray-500">{t('workRadarDesc')}</p>
          </div>
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={workRadarData}
                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
              >
                <PolarGrid stroke="#333" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#666', fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="업무 역량"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value}점`, '점수']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 재물/적성 바 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5"
      >
        <div className="mb-4">
          <h3 className="font-semibold text-white">{t('otherScores')}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {otherScoresData.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + idx * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="text-sm font-bold" style={{ color: item.color }}>
                  {item.value}점
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 하단 장식 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mx-auto h-px w-1/2 origin-center bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"
      />
    </motion.section>
  );
}
