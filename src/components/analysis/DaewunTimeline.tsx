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
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { YearlyFlow } from '@/lib/ai/types';
import type { DaewunItem } from '@/types/saju';

/** 천간 의미 */
const STEM_MEANINGS: Record<string, { name: string; meaning: string }> = {
  甲: { name: '갑목', meaning: '큰 나무의 기운. 시작과 성장, 진취적 에너지를 상징합니다.' },
  乙: { name: '을목', meaning: '풀과 덩굴의 기운. 유연한 적응력과 섬세함을 상징합니다.' },
  丙: { name: '병화', meaning: '태양의 기운. 밝은 열정과 활력을 상징합니다.' },
  丁: { name: '정화', meaning: '촛불의 기운. 집중력과 내면의 따뜻함을 상징합니다.' },
  戊: { name: '무토', meaning: '산의 기운. 안정과 신뢰, 중후함을 상징합니다.' },
  己: { name: '기토', meaning: '전원의 기운. 포용력과 배려심을 상징합니다.' },
  庚: { name: '경금', meaning: '바위와 쇠의 기운. 강인한 의지와 결단력을 상징합니다.' },
  辛: { name: '신금', meaning: '보석의 기운. 정교함과 날카로운 통찰력을 상징합니다.' },
  壬: { name: '임수', meaning: '바다의 기운. 넓은 포용력과 지혜를 상징합니다.' },
  癸: { name: '계수', meaning: '이슬의 기운. 섬세한 감수성과 적응력을 상징합니다.' },
};

/** 지지 의미 */
const BRANCH_MEANINGS: Record<string, { name: string; meaning: string }> = {
  子: { name: '자수', meaning: '새로운 시작의 에너지. 기회와 가능성의 시기입니다.' },
  丑: { name: '축토', meaning: '저축과 축적의 시기. 내실을 다지기 좋습니다.' },
  寅: { name: '인목', meaning: '활발한 움직임의 시기. 도전과 확장에 유리합니다.' },
  卯: { name: '묘목', meaning: '성장과 발전의 시기. 인연과 협력이 좋습니다.' },
  辰: { name: '진토', meaning: '변화의 전환점. 새로운 국면을 맞이합니다.' },
  巳: { name: '사화', meaning: '지혜와 계획의 결실. 머리를 쓰는 일에 유리합니다.' },
  午: { name: '오화', meaning: '최고조의 시기. 열정과 활력이 넘칩니다.' },
  未: { name: '미토', meaning: '성숙과 안정의 시기. 결실을 맺기 좋습니다.' },
  申: { name: '신금', meaning: '변화와 새 시작의 시기. 결단이 필요합니다.' },
  酉: { name: '유금', meaning: '수확과 결실의 시기. 노력의 대가를 받습니다.' },
  戌: { name: '술토', meaning: '마무리와 정리의 시기. 한 단계를 마감합니다.' },
  亥: { name: '해수', meaning: '휴식과 재충전의 시기. 다음을 준비합니다.' },
};

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
  const currentYear = new Date().getFullYear();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
      <h3 className="mb-6 font-serif text-lg font-semibold text-gray-900">운세 흐름</h3>

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
            10년 대운 <span className="text-xs font-normal">(클릭하여 상세 보기)</span>
          </h4>
          <div className="space-y-3">
            {daewun.slice(0, 4).map((d, index) => {
              const isActive = currentYear >= d.startYear && currentYear < d.startYear + 10;
              const isExpanded = expandedIndex === index;
              const stemInfo = STEM_MEANINGS[d.stem];
              const branchInfo = BRANCH_MEANINGS[d.branch];

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
                          현재
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
                            <h5 className="text-xs font-medium text-gray-500">천간 (天干)</h5>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {stemInfo?.name || d.stem}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-600">
                              {stemInfo?.meaning || '천간의 에너지가 이 시기를 지배합니다.'}
                            </p>
                          </div>

                          {/* 지지 의미 */}
                          <div>
                            <h5 className="text-xs font-medium text-gray-500">지지 (地支)</h5>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {branchInfo?.name || d.branch}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-600">
                              {branchInfo?.meaning || '지지의 기운이 이 시기를 지배합니다.'}
                            </p>
                          </div>

                          {/* 종합 조언 */}
                          <div className="rounded-lg bg-gray-100 p-3">
                            <h5 className="text-xs font-medium text-gray-500">종합 조언</h5>
                            <p className="mt-1 text-sm text-gray-700">
                              {stemInfo && branchInfo
                                ? `${stemInfo.name}와 ${branchInfo.name}이 결합한 이 대운에서는 ${
                                    isActive
                                      ? '현재 흐름을 잘 활용하여 기회를 잡으세요.'
                                      : '자신의 강점을 살리고 내실을 다지는 것이 좋습니다.'
                                  }`
                                : '이 시기에는 균형을 유지하며 꾸준히 나아가세요.'}
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
