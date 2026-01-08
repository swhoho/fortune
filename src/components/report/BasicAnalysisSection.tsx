'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { BasicAnalysisData } from '@/types/report';

interface BasicAnalysisSectionProps {
  data: BasicAnalysisData;
  className?: string;
}

/** 오행별 색상 매핑 */
const ELEMENT_COLORS: Record<string, string> = {
  木: '#4ade80',
  火: '#ef4444',
  土: '#f59e0b',
  金: '#e5e7eb',
  水: '#3b82f6',
};

/** 오행별 배경 색상 매핑 */
const ELEMENT_BG_COLORS: Record<string, string> = {
  木: 'rgba(74, 222, 128, 0.15)',
  火: 'rgba(239, 68, 68, 0.15)',
  土: 'rgba(245, 158, 11, 0.15)',
  金: 'rgba(229, 231, 235, 0.15)',
  水: 'rgba(59, 130, 246, 0.15)',
};

/** 격국 품질별 색상 */
const QUALITY_COLORS: Record<string, string> = {
  上: '#22c55e',
  中: '#d4af37',
  下: '#f97316',
};

/**
 * 기본 분석 섹션 컴포넌트
 * Task 25: 용신/기신/격국/일간 특성 표시
 *
 * 구성:
 * 1. 사주 요약 (summary)
 * 2. 일간 특성 (dayMaster)
 * 3. 격국 (structure)
 * 4. 용신/기신 (usefulGod)
 */
export function BasicAnalysisSection({ data, className = '' }: BasicAnalysisSectionProps) {
  const t = useTranslations('report.basicAnalysis');
  const { summary, dayMaster, structure, usefulGod } = data;

  const elementColor = ELEMENT_COLORS[dayMaster.element] || '#d4af37';
  const elementBgColor = ELEMENT_BG_COLORS[dayMaster.element] || 'rgba(212, 175, 55, 0.15)';
  const qualityColor = QUALITY_COLORS[structure.quality] || '#d4af37';

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative space-y-6 ${className}`}
    >
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -right-20 top-10 h-40 w-40 rounded-full bg-[#d4af37]/5 blur-3xl" />

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
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/50 to-transparent" />
      </motion.div>

      {/* 1. 사주 요약 */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-medium text-[#d4af37]">
              {t('summary')}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">{summary}</p>
        </motion.div>
      )}

      {/* 2. 일간 특성 + 3. 격국 (2열 그리드) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 일간 특성 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">{t('dayMaster')}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ backgroundColor: elementBgColor, color: elementColor }}
            >
              {dayMaster.yinYang}
            </span>
          </div>

          {/* 천간 + 오행 */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg font-serif text-2xl font-bold"
              style={{ backgroundColor: elementBgColor, color: elementColor }}
            >
              {dayMaster.stem}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {dayMaster.stem}
                {dayMaster.element}
              </p>
              <p className="text-xs text-gray-500">일간 (Day Master)</p>
            </div>
          </div>

          {/* 특성 키워드 */}
          {dayMaster.characteristics && dayMaster.characteristics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dayMaster.characteristics.map((char, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-[#333] bg-[#242424] px-2.5 py-1 text-xs text-gray-300"
                >
                  {char}
                </span>
              ))}
            </div>
          )}

          {/* 일간 성격 설명 (신규) */}
          {dayMaster.description && (
            <p className="mt-3 text-xs leading-relaxed text-gray-400">{dayMaster.description}</p>
          )}
        </motion.div>

        {/* 격국 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">{t('structure')}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ backgroundColor: `${qualityColor}20`, color: qualityColor }}
            >
              {structure.quality}
            </span>
          </div>

          {/* 격국명 + 한자 */}
          <div className="mb-3">
            <p className="text-lg font-semibold text-white">
              {structure.type}
              {structure.typeChinese && (
                <span className="ml-1 text-sm text-gray-500">({structure.typeChinese})</span>
              )}
            </p>
          </div>

          {/* 격국 설명 */}
          {structure.description && (
            <p className="text-xs leading-relaxed text-gray-400">{structure.description}</p>
          )}

          {/* 실생활 조언 (신규) */}
          {structure.practicalAdvice && (
            <div className="mt-4 space-y-3">
              {/* 인생 전략 */}
              {structure.practicalAdvice.lifeStrategy && (
                <div className="rounded-lg bg-[#0f0f0f] p-3">
                  <p className="mb-1.5 text-xs font-medium text-[#d4af37]">{t('lifeStrategy')}</p>
                  <p className="text-xs leading-relaxed text-gray-300">
                    {structure.practicalAdvice.lifeStrategy}
                  </p>
                </div>
              )}

              {/* 추천 직업 */}
              {structure.practicalAdvice.careerTips &&
                structure.practicalAdvice.careerTips.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-gray-500">{t('careerTips')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {structure.practicalAdvice.careerTips.map((tip, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-[#d4af37]/10 px-2.5 py-1 text-xs text-[#d4af37]"
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* 주의사항 */}
              {structure.practicalAdvice.pitfallsToAvoid &&
                structure.practicalAdvice.pitfallsToAvoid.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-gray-500">
                      {t('pitfallsToAvoid')}
                    </p>
                    <div className="space-y-1">
                      {structure.practicalAdvice.pitfallsToAvoid.map((item, idx) => (
                        <p key={idx} className="text-xs text-red-400/80">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </motion.div>
      </div>

      {/* 4. 용신/기신 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-medium text-[#d4af37]">
            {t('usefulGod')}
          </span>
        </div>

        {/* 용신/희신/기신 카드들 */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {/* 용신 */}
          <div className="flex items-center gap-3 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4af37]/20 font-serif text-xl font-bold text-[#d4af37]">
              {usefulGod.primary}
            </div>
            <div>
              <p className="text-xs text-[#d4af37]/70">{t('primary')}</p>
              <p className="font-semibold text-[#d4af37]">{usefulGod.primary}</p>
            </div>
          </div>

          {/* 희신 */}
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 font-serif text-xl font-bold text-green-400">
              {usefulGod.secondary}
            </div>
            <div>
              <p className="text-xs text-green-400/70">{t('secondary')}</p>
              <p className="font-semibold text-green-400">{usefulGod.secondary}</p>
            </div>
          </div>

          {/* 기신 */}
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 font-serif text-xl font-bold text-red-400">
              {usefulGod.harmful}
            </div>
            <div>
              <p className="text-xs text-red-400/70">{t('harmful')}</p>
              <p className="font-semibold text-red-400">{usefulGod.harmful}</p>
            </div>
          </div>
        </div>

        {/* 용신 선정 근거 */}
        {usefulGod.reasoning && (
          <div className="rounded-lg bg-[#0f0f0f] p-4">
            <p className="mb-2 text-xs font-medium text-gray-500">{t('reasoning')}</p>
            <p className="text-sm leading-relaxed text-gray-300">{usefulGod.reasoning}</p>
          </div>
        )}

        {/* 실생활 활용법 (신규) */}
        {usefulGod.practicalApplication && (
          <div className="mt-4 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
            <p className="mb-2 text-xs font-medium text-[#d4af37]">{t('practicalApplication')}</p>
            <p className="text-sm leading-relaxed text-gray-300">
              {usefulGod.practicalApplication}
            </p>
          </div>
        )}
      </motion.div>

      {/* 하단 장식 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mx-auto h-px w-1/2 origin-center bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"
      />
    </motion.section>
  );
}
