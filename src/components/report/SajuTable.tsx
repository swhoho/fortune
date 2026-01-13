'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import type { PillarsHanja } from '@/types/saju';
import type { JijangganData } from '@/types/report';

/** 오행별 색상 매핑 */
const STEM_ELEMENT_MAP: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const ELEMENT_COLORS: Record<string, string> = {
  木: '#4ade80',
  火: '#ef4444',
  土: '#f59e0b',
  金: '#e5e7eb',
  水: '#3b82f6',
};

interface SajuTableProps {
  pillars: PillarsHanja;
  jijanggan?: JijangganData;
  name?: string;
  age?: number;
  className?: string;
}

/** 천간의 오행 색상 반환 */
function getStemColor(stem: string): string {
  const element = STEM_ELEMENT_MAP[stem];
  if (!element) return '#d4af37';
  return ELEMENT_COLORS[element] ?? '#d4af37';
}

/**
 * 사주명식 테이블 컴포넌트
 * Task 12.2: 시/일/월/년 + 천간/지지 테이블
 * Task 25: 지장간 표시 추가
 */
export function SajuTable({ pillars, jijanggan, name, age, className = '' }: SajuTableProps) {
  const tGlossary = useTranslations('glossary');

  const columns = [
    { key: 'hour', label: '時', pillar: pillars.hour, jijang: jijanggan?.hour },
    { key: 'day', label: '日', pillar: pillars.day, jijang: jijanggan?.day },
    { key: 'month', label: '月', pillar: pillars.month, jijang: jijanggan?.month },
    { key: 'year', label: '年', pillar: pillars.year, jijang: jijanggan?.year },
  ];

  const hasJijanggan =
    jijanggan &&
    (jijanggan.hour?.length ||
      jijanggan.day?.length ||
      jijanggan.month?.length ||
      jijanggan.year?.length);

  // 컬럼 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] ${className}`}
    >
      {/* 헤더 */}
      <div className="border-b border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-3">
        <h3 className="text-center font-serif text-lg font-semibold text-[#d4af37]">사주명식</h3>
      </div>

      {/* 테이블 */}
      <div className="p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex justify-center gap-1"
        >
          {/* 4기둥 */}
          {columns.map(({ key, label, pillar, jijang }) => (
            <motion.div
              key={key}
              variants={columnVariants}
              className="flex w-16 flex-col items-center"
            >
              {/* 헤더 라벨 */}
              <div className="mb-2 flex h-8 w-full items-center justify-center rounded-t-lg bg-[#2a2a2a]">
                <span className="text-sm font-medium text-gray-400">{label}</span>
              </div>

              {/* 천간 */}
              <div className="flex h-14 w-full items-center justify-center border-x border-t border-[#3a3a3a] bg-[#1f1f1f]">
                <span
                  className="font-serif text-2xl font-bold text-[#d4af37]"
                  aria-label={`천간: ${pillar.stem}`}
                  role="text"
                >
                  {pillar.stem}
                </span>
              </div>

              {/* 지지 */}
              <div
                className={`flex h-14 w-full items-center justify-center border-x border-t border-[#3a3a3a] bg-[#1f1f1f] ${!hasJijanggan ? 'rounded-b-lg border-b' : ''}`}
              >
                <span
                  className="font-serif text-2xl font-bold text-[#d4af37]"
                  aria-label={`지지: ${pillar.branch}`}
                  role="text"
                >
                  {pillar.branch}
                </span>
              </div>

              {/* 지장간 (선택) */}
              {hasJijanggan && (
                <div className="flex h-10 w-full items-center justify-center gap-0.5 rounded-b-lg border border-[#3a3a3a] bg-[#0f0f0f] px-1">
                  {jijang && jijang.length > 0 ? (
                    jijang.map((stem, idx) => (
                      <span
                        key={idx}
                        className="font-serif text-xs font-medium"
                        style={{ color: getStemColor(stem) }}
                        title={`지장간: ${stem}`}
                      >
                        {stem}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-600">-</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {/* 구분 열 (이름/나이) */}
          {(name || age) && (
            <motion.div variants={columnVariants} className="flex w-16 flex-col items-center">
              {/* 헤더 */}
              <div className="mb-2 flex h-8 w-full items-center justify-center rounded-t-lg bg-[#d4af37]/10">
                <span className="text-sm font-medium text-[#d4af37]">구분</span>
              </div>

              {/* 건명 */}
              <div className="flex h-14 w-full items-center justify-center border-x border-t border-[#d4af37]/30 bg-[#d4af37]/5">
                <span className="text-sm font-medium text-[#d4af37]">
                  {name ? `${name.slice(0, 3)}` : '건명'}
                </span>
              </div>

              {/* 나이 */}
              <div
                className={`flex h-14 w-full items-center justify-center border-x border-t border-[#d4af37]/30 bg-[#d4af37]/5 ${!hasJijanggan ? 'border-b' : ''}`}
              >
                <span className="text-lg font-bold text-[#d4af37]">{age ? `${age}세` : ''}</span>
              </div>

              {/* 지장간 공간 맞춤 */}
              {hasJijanggan && (
                <div className="flex h-10 w-full items-center justify-center gap-1 rounded-b-lg border border-[#d4af37]/30 bg-[#d4af37]/5">
                  <span className="text-[10px] text-[#d4af37]/50">지장간</span>
                  <InfoTooltip
                    title={tGlossary('jijanggan.title')}
                    content={tGlossary('jijanggan.description')}
                    iconSize={10}
                  />
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
