'use client';

/**
 * 신년 분석 연도 선택 컴포넌트
 * Task 20: 연도 선택 드롭다운 (다음 해 자동 선택)
 */

import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BRAND_COLORS } from '@/lib/constants/colors';

interface YearSelectorProps {
  /** 선택된 연도 */
  selectedYear: number;
  /** 연도 변경 콜백 */
  onYearChange: (year: number) => void;
  /** 사용 가능한 연도 범위 (기본: 현재연도 ~ +3년) */
  minYear?: number;
  maxYear?: number;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/** 간지(干支) 계산 */
function getGanZhi(year: number): { stem: string; branch: string; animal: string } {
  const stems = ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'];
  const branches = ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'];
  const animals = [
    '원숭이',
    '닭',
    '개',
    '돼지',
    '쥐',
    '소',
    '호랑이',
    '토끼',
    '용',
    '뱀',
    '말',
    '양',
  ];

  const stemIndex = year % 10;
  const branchIndex = year % 12;

  return {
    stem: stems[stemIndex] ?? '',
    branch: branches[branchIndex] ?? '',
    animal: animals[branchIndex] ?? '',
  };
}

export function YearSelector({
  selectedYear,
  onYearChange,
  minYear,
  maxYear,
  disabled = false,
}: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const effectiveMinYear = minYear ?? currentYear;
  const effectiveMaxYear = maxYear ?? currentYear + 3;

  const years = Array.from(
    { length: effectiveMaxYear - effectiveMinYear + 1 },
    (_, i) => effectiveMinYear + i
  );

  const ganZhi = getGanZhi(selectedYear);
  const isCurrentYear = selectedYear === currentYear;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full rounded-2xl border border-[#333] bg-[#1a1a1a] p-6 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
        >
          <Calendar className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">분석할 연도 선택</h3>
          <p className="text-sm text-gray-400">월별 상세 운세를 확인할 연도를 선택하세요</p>
        </div>
      </div>

      {/* 연도 선택 */}
      <div className="space-y-4">
        <Select
          value={String(selectedYear)}
          onValueChange={(value) => onYearChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger className="h-14 w-full border-2 border-[#333] bg-[#242424] text-lg text-white transition-colors hover:border-[#d4af37] focus:border-[#d4af37]">
            <SelectValue placeholder="연도 선택" />
          </SelectTrigger>
          <SelectContent className="border-[#333] bg-[#1a1a1a]">
            {years.map((year) => {
              const yearGanZhi = getGanZhi(year);
              const isRecommended = year === currentYear;

              return (
                <SelectItem
                  key={year}
                  value={String(year)}
                  className="py-3 text-white focus:bg-[#242424] focus:text-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium">{year}년</span>
                    <span className="font-serif text-gray-400">
                      {yearGanZhi.stem}
                      {yearGanZhi.branch}
                    </span>
                    <span className="text-sm text-gray-500">({yearGanZhi.animal}띠)</span>
                    {isRecommended && (
                      <span
                        className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${BRAND_COLORS.primary}20`,
                          color: BRAND_COLORS.primary,
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        추천
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* 선택된 연도 정보 */}
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-[#242424] p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">선택된 연도</p>
              <p className="font-serif text-2xl font-bold text-white">
                {selectedYear}년{' '}
                <span style={{ color: BRAND_COLORS.primary }}>
                  {ganZhi.stem}
                  {ganZhi.branch}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{ganZhi.animal}의 해</p>
              {isCurrentYear && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: BRAND_COLORS.primary,
                    color: '#000',
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  올해 운세
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
