'use client';

import { motion } from 'framer-motion';
import { TraitGraph, type TraitItem } from './TraitGraph';

/**
 * 업무 능력 데이터 (5개 항목)
 * Task 17: 업무/적성 그래프 섹션
 */
export interface WorkAbilityData {
  /** 기획/연구 */
  planning: number;
  /** 끈기/정력 */
  perseverance: number;
  /** 실천/수단 */
  execution: number;
  /** 완성/판매 */
  completion: number;
  /** 관리/평가 */
  management: number;
}

/**
 * 적성 특성 데이터 (10개 항목)
 * Task 17: 업무/적성 그래프 섹션
 */
export interface AptitudeTraitsData {
  /** 비판력 */
  criticism: number;
  /** 협동심 */
  cooperation: number;
  /** 습득력 */
  learning: number;
  /** 창의력 */
  creativity: number;
  /** 예술성 */
  artistry: number;
  /** 표현력 */
  expression: number;
  /** 활동력 */
  activity: number;
  /** 모험심 */
  adventure: number;
  /** 사업감각 */
  business: number;
  /** 신뢰성 */
  reliability: number;
}

interface WorkAptitudeSectionProps {
  /** 업무 능력 데이터 */
  workAbility: WorkAbilityData;
  /** 적성 특성 데이터 */
  aptitudeTraits: AptitudeTraitsData;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 업무/적성 그래프 섹션 컴포넌트
 * Task 17: 업무 능력 (5개) + 적성 특성 (10개) 그래프
 *
 * 참조: docs/reference/fortune8.PNG
 *
 * 섹션 구조:
 * 1. 일처리 능력 그래프 (5개 항목)
 * 2. 특징그래프 - 적성 특성 (10개 항목)
 */
export function WorkAptitudeSection({
  workAbility,
  aptitudeTraits,
  className = '',
}: WorkAptitudeSectionProps) {
  // 업무 능력 데이터를 TraitItem 배열로 변환
  const workItems: TraitItem[] = [
    { label: '기획/연구', value: workAbility.planning },
    { label: '끈기/정력', value: workAbility.perseverance },
    { label: '실천/수단', value: workAbility.execution },
    { label: '완성/판매', value: workAbility.completion },
    { label: '관리/평가', value: workAbility.management },
  ];

  // 적성 특성 데이터를 TraitItem 배열로 변환
  const aptitudeItems: TraitItem[] = [
    { label: '비판력', value: aptitudeTraits.criticism },
    { label: '협동심', value: aptitudeTraits.cooperation },
    { label: '습득력', value: aptitudeTraits.learning },
    { label: '창의력', value: aptitudeTraits.creativity },
    { label: '예술성', value: aptitudeTraits.artistry },
    { label: '표현력', value: aptitudeTraits.expression },
    { label: '활동력', value: aptitudeTraits.activity },
    { label: '모험심', value: aptitudeTraits.adventure },
    { label: '사업감각', value: aptitudeTraits.business },
    { label: '신뢰성', value: aptitudeTraits.reliability },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <h2 className="font-serif text-xl font-bold text-white">
          업무 능력과 적성
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/50 to-transparent" />
      </motion.div>

      {/* 1. 일처리 능력 그래프 (5개 항목) */}
      <TraitGraph
        title="일처리 능력"
        subtitle="각 단계별 능력 비율"
        traits={workItems}
        threshold={50}
        showLegend={true}
      />

      {/* 2. 적성 특성 그래프 (10개 항목) */}
      <TraitGraph
        title="특징그래프"
        subtitle="적성을 파악하는 특징 10개"
        traits={aptitudeItems}
        threshold={50}
        showLegend={true}
      />
    </motion.section>
  );
}
