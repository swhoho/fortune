'use client';

/**
 * 오행 비율 차트 컴포넌트
 * Recharts BarChart 사용
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { motion } from 'framer-motion';
import { ELEMENT_COLORS, ELEMENT_NAMES, type ElementKey } from '@/lib/constants/colors';
import type { PillarsHanja } from '@/types/saju';

interface ElementData {
  name: ElementKey;
  value: number;
  label: string;
}

interface ElementChartProps {
  /** 사주 기둥 데이터 */
  pillars: PillarsHanja;
  /** 차트 높이 */
  height?: number;
}

/**
 * 사주에서 오행 개수 계산
 */
function calculateElementCounts(pillars: PillarsHanja): ElementData[] {
  const counts: Record<ElementKey, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
  };

  // 8개 글자(천간 4개 + 지지 4개)에서 오행 카운트
  const pillarKeys = ['year', 'month', 'day', 'hour'] as const;

  pillarKeys.forEach((key) => {
    const pillar = pillars[key];
    // 천간/지지의 element를 카운트 (Python API에서 이미 오행으로 제공)
    const element = pillar.element as ElementKey;
    if (element in counts) {
      counts[element] += 2; // 천간 + 지지 각각 1개씩
    }
  });

  // 배열로 변환 (목화토금수 순서)
  const order: ElementKey[] = ['木', '火', '土', '金', '水'];
  return order.map((name) => ({
    name,
    value: counts[name],
    label: ELEMENT_NAMES[name],
  }));
}

/**
 * 커스텀 툴팁
 */
function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string> & { payload?: { payload: ElementData }[] }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload as ElementData;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="font-medium text-gray-900">{data.label}</p>
      <p className="text-sm text-gray-500">{data.value}개</p>
    </div>
  );
}

export function ElementChart({ pillars, height = 200 }: ElementChartProps) {
  const data = calculateElementCounts(pillars);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* 헤더 */}
      <h3 className="mb-4 text-center font-serif text-lg font-semibold text-gray-900">오행 분포</h3>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[0, 8]}
            tickCount={5}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={30}
            tick={{ fontSize: 16, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={ELEMENT_COLORS[entry.name]}
                stroke={entry.name === '金' ? '#d1d5db' : undefined}
                strokeWidth={entry.name === '金' ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: ELEMENT_COLORS[item.name],
                border: item.name === '金' ? '1px solid #d1d5db' : undefined,
              }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
