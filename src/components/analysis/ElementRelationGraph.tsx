'use client';

/**
 * D3.js 오행 상생상극 관계도 컴포넌트
 * 5개 노드를 원형으로 배치하고 상생/상극 화살표로 연결
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import {
  ELEMENT_COLORS,
  ELEMENT_TEXT_COLORS,
  ELEMENT_NAMES,
  type ElementKey,
} from '@/lib/constants/colors';
import { downloadSvg } from '@/lib/utils/svg-download';
import type { PillarsHanja } from '@/types/saju';

/** 오행 배치 순서 (시계 방향, 상단 시작) */
const ELEMENTS: ElementKey[] = ['木', '火', '土', '金', '水'];

/** 상생 관계: 木→火→土→金→水→木 */
const GENERATING_RELATIONS: [ElementKey, ElementKey][] = [
  ['木', '火'],
  ['火', '土'],
  ['土', '金'],
  ['金', '水'],
  ['水', '木'],
];

/** 상극 관계: 木→土→水→火→金→木 */
const OVERCOMING_RELATIONS: [ElementKey, ElementKey][] = [
  ['木', '土'],
  ['土', '水'],
  ['水', '火'],
  ['火', '金'],
  ['金', '木'],
];

/** 오행 설명 */
const ELEMENT_DESCRIPTIONS: Record<ElementKey, string> = {
  木: '성장, 창조, 시작의 기운. 봄의 에너지를 상징합니다.',
  火: '열정, 확산, 활력의 기운. 여름의 에너지를 상징합니다.',
  土: '안정, 중용, 전환의 기운. 계절의 전환기를 상징합니다.',
  金: '수렴, 결실, 정리의 기운. 가을의 에너지를 상징합니다.',
  水: '저장, 지혜, 휴식의 기운. 겨울의 에너지를 상징합니다.',
};

interface ElementRelationGraphProps {
  /** 4개 기둥 데이터 (강한 오행 하이라이트용) */
  pillars?: PillarsHanja | null;
  /** 차트 높이 */
  height?: number;
}

/**
 * 기둥 데이터에서 오행별 개수 계산
 */
function calculateElementCounts(pillars: PillarsHanja): Record<ElementKey, number> {
  const counts: Record<ElementKey, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillarKeys = ['year', 'month', 'day', 'hour'] as const;

  pillarKeys.forEach((key) => {
    const pillar = pillars[key];
    // 천간과 지지의 오행을 카운트
    if (pillar.element && counts[pillar.element as ElementKey] !== undefined) {
      counts[pillar.element as ElementKey] += 2; // stem + branch 각각 1씩
    }
  });

  return counts;
}

export function ElementRelationGraph({ pillars, height = 320 }: ElementRelationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    element: ElementKey | null;
  }>({ show: false, x: 0, y: 0, element: null });

  // 강한 오행 계산 (useMemo로 안정적인 참조 유지)
  const elementCounts = useMemo(
    () => (pillars ? calculateElementCounts(pillars) : null),
    [pillars]
  );
  const strongElements = useMemo(() => {
    if (!elementCounts) return [];
    const maxCount = Math.max(...Object.values(elementCounts));
    return Object.entries(elementCounts)
      .filter(([, count]) => count === maxCount && maxCount > 0)
      .map(([element]) => element) as ElementKey[];
  }, [elementCounts]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth;
    const width = Math.min(containerWidth, 400);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50;
    const nodeRadius = 28;

    svg.attr('width', width).attr('height', height);

    // 마커 정의 (화살표 머리)
    const defs = svg.append('defs');

    // 상생 화살표 마커 (초록)
    defs
      .append('marker')
      .attr('id', 'arrowhead-generating')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#22c55e');

    // 상극 화살표 마커 (빨강)
    defs
      .append('marker')
      .attr('id', 'arrowhead-overcoming')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#ef4444');

    // 노드 위치 계산 (72도 간격, 상단 시작)
    const nodePositions: Record<ElementKey, { x: number; y: number }> = {} as Record<
      ElementKey,
      { x: number; y: number }
    >;
    ELEMENTS.forEach((element, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // 상단 시작
      nodePositions[element] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // 상생 화살표 그리기 (외곽 곡선)
    GENERATING_RELATIONS.forEach(([from, to]) => {
      const fromPos = nodePositions[from];
      const toPos = nodePositions[to];

      // 곡선 경로 계산
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 시작/끝점을 노드 가장자리로 조정
      const startX = fromPos.x + (dx / dist) * nodeRadius;
      const startY = fromPos.y + (dy / dist) * nodeRadius;
      const endX = toPos.x - (dx / dist) * (nodeRadius + 10);
      const endY = toPos.y - (dy / dist) * (nodeRadius + 10);

      // 외곽으로 휘어지는 곡선
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const offsetX = (midX - centerX) * 0.3;
      const offsetY = (midY - centerY) * 0.3;

      svg
        .append('path')
        .attr('d', `M ${startX} ${startY} Q ${midX + offsetX} ${midY + offsetY} ${endX} ${endY}`)
        .attr('fill', 'none')
        .attr('stroke', '#22c55e')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.7)
        .attr('marker-end', 'url(#arrowhead-generating)');
    });

    // 상극 화살표 그리기 (내부 직선)
    OVERCOMING_RELATIONS.forEach(([from, to]) => {
      const fromPos = nodePositions[from];
      const toPos = nodePositions[to];

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const startX = fromPos.x + (dx / dist) * nodeRadius;
      const startY = fromPos.y + (dy / dist) * nodeRadius;
      const endX = toPos.x - (dx / dist) * (nodeRadius + 10);
      const endY = toPos.y - (dy / dist) * (nodeRadius + 10);

      svg
        .append('line')
        .attr('x1', startX)
        .attr('y1', startY)
        .attr('x2', endX)
        .attr('y2', endY)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '4,3')
        .attr('marker-end', 'url(#arrowhead-overcoming)');
    });

    // 노드 그리기
    ELEMENTS.forEach((element) => {
      const pos = nodePositions[element];
      const isStrong = strongElements.includes(element);

      // 강한 오행 하이라이트 (글로우 효과)
      if (isStrong) {
        svg
          .append('circle')
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', nodeRadius + 6)
          .attr('fill', 'none')
          .attr('stroke', ELEMENT_COLORS[element])
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 0.5);
      }

      // 메인 노드
      const nodeGroup = svg.append('g').attr('cursor', 'pointer');

      nodeGroup
        .append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', nodeRadius)
        .attr('fill', ELEMENT_COLORS[element])
        .attr('stroke', element === '金' ? '#9ca3af' : ELEMENT_COLORS[element])
        .attr('stroke-width', 2);

      // 노드 텍스트
      nodeGroup
        .append('text')
        .attr('x', pos.x)
        .attr('y', pos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', ELEMENT_TEXT_COLORS[element])
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text(element);

      // 호버 이벤트
      nodeGroup
        .on('mouseenter', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              show: true,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top - 10,
              element,
            });
          }
        })
        .on('mouseleave', () => {
          setTooltip({ show: false, x: 0, y: 0, element: null });
        });
    });

    // 범례
    const legendY = height - 25;
    svg
      .append('text')
      .attr('x', 10)
      .attr('y', legendY)
      .attr('font-size', '11px')
      .attr('fill', '#22c55e')
      .text('─ 상생');

    svg
      .append('text')
      .attr('x', 60)
      .attr('y', legendY)
      .attr('font-size', '11px')
      .attr('fill', '#ef4444')
      .text('╌ 상극');
  }, [pillars, height, strongElements]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
    >
      {/* 헤더 */}
      <div className="mb-2 flex items-start justify-between border-b border-gray-100 pb-3">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-gray-900">오행 상생상극 관계도</h3>
          <p className="mt-1 text-xs text-gray-500">
            상생(초록): 서로 돕는 관계 · 상극(빨강): 서로 제어하는 관계
          </p>
        </div>
        <button
          onClick={() => {
            if (svgRef.current) {
              downloadSvg(svgRef.current, 'ohang-relation-graph');
            }
          }}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="SVG로 저장"
          aria-label="오행 관계도 SVG 다운로드"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* SVG 그래프 */}
      <svg ref={svgRef} className="mx-auto block" />

      {/* 툴팁 */}
      {tooltip.show && tooltip.element && (
        <div
          className="pointer-events-none absolute z-10 max-w-[200px] rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-bold">{ELEMENT_NAMES[tooltip.element]}</p>
          <p className="mt-1 opacity-90">{ELEMENT_DESCRIPTIONS[tooltip.element]}</p>
        </div>
      )}

      {/* 강한 오행 표시 */}
      {strongElements.length > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-center text-xs text-gray-500">
            강한 오행:{' '}
            {strongElements.map((el) => (
              <span
                key={el}
                className="mx-1 inline-block rounded px-2 py-0.5 font-medium"
                style={{
                  backgroundColor: ELEMENT_COLORS[el],
                  color: ELEMENT_TEXT_COLORS[el],
                }}
              >
                {ELEMENT_NAMES[el]}
              </span>
            ))}
          </p>
        </div>
      )}
    </motion.div>
  );
}
