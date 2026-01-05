'use client';

import { motion } from 'framer-motion';
import { Compass, Sparkles, Calendar } from 'lucide-react';
import { FavorableBar } from './FavorableBar';
import type { ReportDaewunItem } from '@/types/report';

interface DaewunDetailSectionProps {
  /** 대운 목록 */
  daewun: ReportDaewunItem[];
  /** 현재 나이 */
  currentAge?: number;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 대운 상세 분석 섹션
 * 십신, 순풍/역풍 비율, 나이에 맞는 설명을 포함한 카드 리스트
 */
export function DaewunDetailSection({
  daewun,
  currentAge,
  className = '',
}: DaewunDetailSectionProps) {
  /**
   * 현재 대운인지 확인
   */
  const isCurrentDaewun = (item: ReportDaewunItem, index: number) => {
    if (!currentAge || currentAge < 0) return false;
    const nextItem = daewun[index + 1];
    const endAge = nextItem ? nextItem.age : Infinity;
    return currentAge >= item.age && currentAge < endAge;
  };

  /**
   * 시작 날짜 포맷팅
   */
  const formatStartDate = (item: ReportDaewunItem) => {
    if (item.startDate) {
      const parts = item.startDate.split('-');
      const year = parts[0] || item.startYear;
      const month = parts[1] ? parseInt(parts[1], 10) : 1;
      const day = parts[2] ? parseInt(parts[2], 10) : 1;
      return `양력 ${year}년 ${month}월 ${day}일 경부터`;
    }
    return `${item.startYear}년 경부터`;
  };

  // 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`space-y-6 ${className}`}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5">
          <Compass className="h-5 w-5 text-[#d4af37]" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-white">대운</h2>
          <p className="text-sm text-gray-400">10년 주기의 운세 흐름</p>
        </div>
      </div>

      {/* 대운 설명 박스 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-[#333] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5"
      >
        {/* 배경 장식 */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d4af37]/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#d4af37]/5 blur-2xl" />

        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37]/10 px-3 py-1.5">
            <Sparkles className="h-4 w-4 text-[#d4af37]" />
            <span className="text-sm font-semibold text-[#d4af37]">대운이란?</span>
          </div>

          <h3 className="font-serif text-lg font-bold text-white">
            인생 흥망성쇠의 나침반
          </h3>

          <div className="space-y-2 text-sm leading-relaxed text-gray-400">
            <p>
              대운은 길게는 10년 짧게는 5년 주기로 변하는 운으로
              주기가 길기 때문에 사람들은 잘 느끼지 못하지만 인생의
              성공여부에 크게 영향을 미칩니다.
            </p>
            <p>
              순풍 운의 비율이 높고 역풍 운의 비율이 낮으면 앞으로
              나아가서 왕성한 활동을 하라는 뜻이며, 순풍 운의 비율이
              낮고 역풍 운의 비율이 높으면 후퇴하여 준비하라고 노력하는 뜻입니다.
            </p>
            <p className="text-gray-500">
              순풍 운이라고 하더라도 준비되지 않은 경우 없는 것이
              크지 않고, 역풍 운이라도 준비하고 노력해 왔다면 최소
              한의 결실을 얻게 됨을 염두에 두세요.
            </p>
          </div>
        </div>
      </motion.div>

      {/* 대운 카드 리스트 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {daewun.map((item, index) => {
          const isCurrent = isCurrentDaewun(item, index);

          return (
            <motion.div
              key={`daewun-${item.age}-${index}`}
              variants={cardVariants}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isCurrent
                  ? 'border-[#d4af37]/50 bg-gradient-to-br from-[#d4af37]/10 via-[#1a1a1a] to-[#1a1a1a] shadow-lg shadow-[#d4af37]/10'
                  : 'border-[#333] bg-[#1a1a1a] hover:border-[#444]'
              }`}
            >
              {/* 현재 대운 표시 */}
              {isCurrent && (
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#d4af37] via-[#d4af37]/50 to-transparent" />
              )}

              <div className="p-5">
                {/* 헤더: 나이 범위 + 십신운 */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {/* 나이 범위 배지 */}
                  <div
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                      isCurrent
                        ? 'bg-[#d4af37] text-[#0a0a0a]'
                        : 'bg-[#2a2a2a] text-white'
                    }`}
                  >
                    {item.age}세~{item.endAge}세
                  </div>

                  {/* 십신운 */}
                  <div
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                      isCurrent
                        ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]'
                        : 'border-[#444] bg-[#242424] text-gray-300'
                    }`}
                  >
                    {item.tenGodType}
                  </div>

                  {/* 현재 대운 라벨 */}
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1 rounded-full bg-[#d4af37]/20 px-2.5 py-1 text-xs font-medium text-[#d4af37]"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4af37]" />
                      현재
                    </motion.div>
                  )}
                </div>

                {/* 시작시기 */}
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>시작시기: {formatStartDate(item)}</span>
                </div>

                {/* 순풍/역풍 바 */}
                <div className="mb-4">
                  <FavorableBar
                    favorablePercent={item.favorablePercent}
                    unfavorablePercent={item.unfavorablePercent}
                  />
                </div>

                {/* 설명 텍스트 */}
                <p className="text-sm leading-relaxed text-gray-300">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
