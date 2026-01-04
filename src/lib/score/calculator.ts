/**
 * 점수 계산 모듈
 * @description 십신 분포 기반 특성 점수 계산
 */

import type { JijangganData, SajuPillarsData } from '../ai/types';
import type { TenGod, TenGodCounts, TraitModifier } from './types';
import { extractTenGods } from './ten-gods';
import {
  PERSONALITY_MODIFIERS,
  WORK_MODIFIERS,
  APTITUDE_MODIFIERS,
  LOVE_MODIFIERS,
} from './trait-modifiers';

/**
 * 확장된 점수 결과 (PRD v2 기준 35개 항목)
 */
export interface ExtendedScoreResult {
  /** 성격 특성 (10개) */
  personality: {
    willpower: number; // 의지력
    sociability: number; // 사교성
    patience: number; // 인내력
    independence: number; // 독립심
    reliability: number; // 신뢰성
    consideration: number; // 배려심
    humor: number; // 유머감각
    cooperation: number; // 협동심
    expressiveness: number; // 표현력
    diligence: number; // 성실도
  };

  /** 업무 능력 (5개) */
  work: {
    planning: number; // 기획력
    drive: number; // 추진력
    execution: number; // 실행력
    completion: number; // 완성도
    management: number; // 관리력
  };

  /** 적성 특성 (10개) */
  aptitude: {
    analytical: number; // 분석력
    teamwork: number; // 협동심
    learning: number; // 학습력
    creativity: number; // 창의력
    artistry: number; // 예술성
    expression: number; // 표현력
    activity: number; // 활동성
    challenge: number; // 도전정신
    business: number; // 사업감각
    trustworthiness: number; // 신뢰성
  };

  /** 연애 특성 (10개) */
  love: {
    consideration: number; // 배려심
    humor: number; // 유머감각
    emotion: number; // 감성
    selfEsteem: number; // 자존감
    adventure: number; // 모험심
    sincerity: number; // 성실도
    sociability: number; // 사교성
    finance: number; // 경제관념
    trustworthiness: number; // 신뢰성
    expressiveness: number; // 표현력
  };
}

/** 기본 점수 */
const BASE_SCORE = 50;

/** 최소 점수 */
const MIN_SCORE = 0;

/** 최대 점수 */
const MAX_SCORE = 100;

/**
 * 특성 점수 계산
 *
 * @param tenGodCounts - 십신별 개수 (가중치 포함)
 * @param modifiers - 특성별 십신 영향 매핑
 * @returns 0-100 범위의 점수
 *
 * @example
 * const counts = { 비견: 2, 겁재: 1, ... };
 * const modifiers = { 비견: 15, 겁재: 12, ... };
 * calculateTraitScore(counts, modifiers); // 79
 */
export function calculateTraitScore(
  tenGodCounts: TenGodCounts,
  modifiers: TraitModifier
): number {
  let score = BASE_SCORE;

  for (const tenGod of Object.keys(tenGodCounts) as TenGod[]) {
    const count = tenGodCounts[tenGod];
    const modifier = modifiers[tenGod] ?? 0;
    score += modifier * count;
  }

  // 0-100 범위로 클램프 후 반올림
  return Math.round(Math.max(MIN_SCORE, Math.min(MAX_SCORE, score)));
}

/**
 * 전체 점수 계산
 *
 * @param pillars - 사주 팔자 (SajuPillarsData)
 * @param jijanggan - 지장간 데이터
 * @returns 확장된 점수 결과 (35개 항목)
 */
export function calculateAllScores(
  pillars: SajuPillarsData,
  jijanggan: JijangganData
): ExtendedScoreResult {
  // 1. 십신 분포 추출
  const tenGodCounts = extractTenGods(pillars, jijanggan);

  // 2. 카테고리별 점수 계산
  return {
    personality: {
      willpower: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.willpower
      ),
      sociability: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.sociability
      ),
      patience: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.patience
      ),
      independence: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.independence
      ),
      reliability: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.reliability
      ),
      consideration: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.consideration
      ),
      humor: calculateTraitScore(tenGodCounts, PERSONALITY_MODIFIERS.humor),
      cooperation: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.cooperation
      ),
      expressiveness: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.expressiveness
      ),
      diligence: calculateTraitScore(
        tenGodCounts,
        PERSONALITY_MODIFIERS.diligence
      ),
    },
    work: {
      planning: calculateTraitScore(tenGodCounts, WORK_MODIFIERS.planning),
      drive: calculateTraitScore(tenGodCounts, WORK_MODIFIERS.drive),
      execution: calculateTraitScore(tenGodCounts, WORK_MODIFIERS.execution),
      completion: calculateTraitScore(tenGodCounts, WORK_MODIFIERS.completion),
      management: calculateTraitScore(tenGodCounts, WORK_MODIFIERS.management),
    },
    aptitude: {
      analytical: calculateTraitScore(
        tenGodCounts,
        APTITUDE_MODIFIERS.analytical
      ),
      teamwork: calculateTraitScore(tenGodCounts, APTITUDE_MODIFIERS.teamwork),
      learning: calculateTraitScore(tenGodCounts, APTITUDE_MODIFIERS.learning),
      creativity: calculateTraitScore(
        tenGodCounts,
        APTITUDE_MODIFIERS.creativity
      ),
      artistry: calculateTraitScore(tenGodCounts, APTITUDE_MODIFIERS.artistry),
      expression: calculateTraitScore(
        tenGodCounts,
        APTITUDE_MODIFIERS.expression
      ),
      activity: calculateTraitScore(tenGodCounts, APTITUDE_MODIFIERS.activity),
      challenge: calculateTraitScore(
        tenGodCounts,
        APTITUDE_MODIFIERS.challenge
      ),
      business: calculateTraitScore(tenGodCounts, APTITUDE_MODIFIERS.business),
      trustworthiness: calculateTraitScore(
        tenGodCounts,
        APTITUDE_MODIFIERS.trustworthiness
      ),
    },
    love: {
      consideration: calculateTraitScore(
        tenGodCounts,
        LOVE_MODIFIERS.consideration
      ),
      humor: calculateTraitScore(tenGodCounts, LOVE_MODIFIERS.humor),
      emotion: calculateTraitScore(tenGodCounts, LOVE_MODIFIERS.emotion),
      selfEsteem: calculateTraitScore(tenGodCounts, LOVE_MODIFIERS.selfEsteem),
      adventure: calculateTraitScore(tenGodCounts, LOVE_MODIFIERS.adventure),
      sincerity: calculateTraitScore(tenGodCounts, LOVE_MODIFIERS.sincerity),
      sociability: calculateTraitScore(
        tenGodCounts,
        LOVE_MODIFIERS.sociability
      ),
      finance: calculateTraitScore(tenGodCounts, LOVE_MODIFIERS.finance),
      trustworthiness: calculateTraitScore(
        tenGodCounts,
        LOVE_MODIFIERS.trustworthiness
      ),
      expressiveness: calculateTraitScore(
        tenGodCounts,
        LOVE_MODIFIERS.expressiveness
      ),
    },
  };
}

/**
 * 점수를 TraitItem 배열로 변환 (UI용)
 */
export function scoreToTraitItems(
  scores: Record<string, number>,
  labels: Record<string, string>
): Array<{ label: string; value: number }> {
  return Object.entries(scores).map(([key, value]) => ({
    label: labels[key] ?? key,
    value,
  }));
}
