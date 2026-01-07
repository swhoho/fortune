/**
 * 십신별 특성 영향 매핑 테이블
 * @description 각 특성에 대해 십신이 미치는 영향을 정의
 *
 * 양수: 해당 십신이 강하면 점수 상승
 * 음수: 해당 십신이 강하면 점수 하락
 * 기본 점수 50에서 시작, 0-100 범위로 클램프
 */

import type { TraitModifier } from './types';

/**
 * 성격 특성 키
 */
type PersonalityKey =
  | 'willpower'
  | 'sociability'
  | 'patience'
  | 'independence'
  | 'reliability'
  | 'consideration'
  | 'humor'
  | 'cooperation'
  | 'expressiveness'
  | 'diligence';
type WorkKey = 'planning' | 'drive' | 'execution' | 'completion' | 'management';
type AptitudeKey =
  | 'analytical'
  | 'teamwork'
  | 'learning'
  | 'creativity'
  | 'artistry'
  | 'expression'
  | 'activity'
  | 'challenge'
  | 'business'
  | 'trustworthiness';
type LoveKey =
  | 'consideration'
  | 'humor'
  | 'emotion'
  | 'selfEsteem'
  | 'adventure'
  | 'sincerity'
  | 'sociability'
  | 'finance'
  | 'trustworthiness'
  | 'expressiveness';

/**
 * 성격 특성 매핑 (10개)
 * PRD: 의지력, 사교성, 인내력, 독립심, 신뢰성, 배려심, 유머감각, 협동심, 표현력, 성실도
 * v3.0: 모든 값 ×1.8 확대 (점수 분포 극단화)
 */
export const PERSONALITY_MODIFIERS: Record<PersonalityKey, TraitModifier> = {
  // 의지력 (willpower)
  willpower: {
    비견: 20,
    겁재: 16,
    편관: 11,
    정관: 7,
    식신: -7,
    상관: -4,
    편인: 0,
    정인: -4,
    정재: -4,
    편재: -4,
  },

  // 사교성 (sociability)
  sociability: {
    식신: 20,
    상관: 16,
    편재: 14,
    정재: 7,
    편인: -16,
    정인: -11,
    비견: -4,
    겁재: 0,
    정관: 4,
    편관: -7,
  },

  // 인내력 (patience)
  patience: {
    정인: 20,
    정관: 16,
    정재: 14,
    비견: 7,
    상관: -16,
    겁재: -11,
    편관: -7,
    식신: 0,
    편재: -4,
    편인: 4,
  },

  // 독립심 (independence)
  independence: {
    비견: 20,
    겁재: 16,
    편관: 11,
    편재: 7,
    정인: -14,
    정관: -7,
    식신: 0,
    상관: 4,
    정재: -4,
    편인: 7,
  },

  // 신뢰성 (reliability)
  reliability: {
    정관: 20,
    정인: 16,
    정재: 14,
    비견: 7,
    상관: -16,
    겁재: -11,
    편관: -7,
    편재: -4,
    식신: 0,
    편인: -4,
  },

  // 배려심 (consideration)
  consideration: {
    식신: 20,
    정인: 16,
    정재: 11,
    정관: 7,
    겁재: -14,
    편관: -11,
    비견: -4,
    상관: 0,
    편재: 4,
    편인: -4,
  },

  // 유머감각 (humor)
  humor: {
    식신: 20,
    상관: 16,
    편재: 11,
    겁재: 7,
    정관: -14,
    정인: -7,
    비견: 0,
    편관: -4,
    정재: 0,
    편인: 4,
  },

  // 협동심 (cooperation)
  cooperation: {
    정관: 16,
    식신: 14,
    정인: 11,
    정재: 11,
    비견: -11,
    겁재: -16,
    상관: -7,
    편관: 0,
    편재: 4,
    편인: -7,
  },

  // 표현력 (expressiveness)
  expressiveness: {
    상관: 20,
    식신: 16,
    편재: 7,
    겁재: 4,
    정인: -14,
    편인: -11,
    정관: -7,
    비견: 0,
    정재: 0,
    편관: 0,
  },

  // 성실도 (diligence)
  diligence: {
    정재: 20,
    정관: 16,
    정인: 14,
    비견: 7,
    상관: -14,
    겁재: -7,
    편재: -4,
    식신: 0,
    편관: 4,
    편인: -4,
  },
};

/**
 * 업무 능력 매핑 (5개)
 * PRD: 기획력, 추진력, 실행력, 완성도, 관리력
 * v3.0: 모든 값 ×1.67 확대 (±18 → ±30, 점수 분포 극단화)
 */
export const WORK_MODIFIERS: Record<WorkKey, TraitModifier> = {
  // 기획력 (planning) - 편인/정인 강화, 겁재/편재 약화
  planning: {
    편인: 30,
    정인: 23,
    상관: 13,
    정관: 8,
    식신: 5,
    편관: 0,
    비견: -7,
    정재: -10,
    겁재: -20,
    편재: -17,
  },

  // 추진력 (drive) - 겁재/편관/비견 강화, 정인/정재 약화
  drive: {
    겁재: 30,
    편관: 23,
    비견: 17,
    상관: 7,
    편재: 3,
    정관: 0,
    식신: -7,
    편인: -10,
    정인: -20,
    정재: -17,
  },

  // 실행력 (execution) - 편관/겁재/정재/비견 강화, 편인/상관 약화
  execution: {
    편관: 23,
    겁재: 20,
    정재: 17,
    비견: 13,
    편재: 3,
    정관: 0,
    식신: -7,
    상관: -10,
    정인: -13,
    편인: -20,
  },

  // 완성도 (completion) - 정재/정관/정인 강화, 겁재/상관/편관 약화
  completion: {
    정재: 30,
    정관: 23,
    정인: 20,
    식신: 7,
    편인: 3,
    비견: 0,
    편재: -10,
    편관: -13,
    상관: -17,
    겁재: -17,
  },

  // 관리력 (management) - 정관/정인/정재 강화, 상관/겁재 약화
  management: {
    정관: 30,
    정인: 20,
    정재: 20,
    편관: 7,
    편재: 3,
    비견: 0,
    식신: -7,
    편인: -10,
    겁재: -17,
    상관: -20,
  },
};

/**
 * 적성 특성 매핑 (10개)
 * PRD: 분석력, 협동심, 학습력, 창의력, 예술성, 표현력, 활동성, 도전정신, 사업감각, 신뢰성
 * v3.0: 모든 값 ×1.8 확대 (점수 분포 극단화)
 */
export const APTITUDE_MODIFIERS: Record<AptitudeKey, TraitModifier> = {
  // 분석력 (analytical)
  analytical: {
    편인: 20,
    정인: 16,
    정관: 11,
    정재: 7,
    겁재: -11,
    편재: -7,
    상관: 4,
    식신: 0,
    비견: 0,
    편관: 4,
  },

  // 협동심 (teamwork)
  teamwork: {
    정관: 16,
    식신: 14,
    정인: 11,
    정재: 11,
    비견: -11,
    겁재: -16,
    상관: -7,
    편관: 0,
    편재: 4,
    편인: -7,
  },

  // 학습력 (learning)
  learning: {
    정인: 20,
    편인: 16,
    식신: 7,
    정관: 7,
    겁재: -11,
    편재: -7,
    상관: 0,
    비견: 0,
    정재: 0,
    편관: -4,
  },

  // 창의력 (creativity)
  creativity: {
    상관: 20,
    편인: 16,
    식신: 14,
    겁재: 4,
    정관: -14,
    정재: -7,
    정인: -4,
    비견: 0,
    편재: 7,
    편관: 0,
  },

  // 예술성 (artistry)
  artistry: {
    상관: 20,
    식신: 16,
    편인: 14,
    편재: 4,
    정관: -11,
    비견: -4,
    정인: 0,
    겁재: 0,
    정재: -4,
    편관: -4,
  },

  // 표현력 (expression)
  expression: {
    상관: 20,
    식신: 16,
    편재: 7,
    겁재: 4,
    정인: -14,
    편인: -7,
    정관: -7,
    비견: 0,
    정재: 0,
    편관: 0,
  },

  // 활동성 (activity)
  activity: {
    겁재: 20,
    편관: 16,
    비견: 14,
    편재: 11,
    정인: -14,
    정재: -7,
    정관: -4,
    식신: 4,
    상관: 7,
    편인: -7,
  },

  // 도전정신 (challenge)
  challenge: {
    겁재: 20,
    편관: 16,
    비견: 14,
    상관: 7,
    정재: -11,
    정인: -7,
    정관: -4,
    식신: 0,
    편재: 7,
    편인: 4,
  },

  // 사업감각 (business)
  business: {
    편재: 20,
    겁재: 14,
    상관: 11,
    편관: 7,
    정인: -11,
    정재: -4,
    정관: 0,
    비견: 4,
    식신: 0,
    편인: 0,
  },

  // 신뢰성 (trustworthiness)
  trustworthiness: {
    정관: 20,
    정인: 16,
    정재: 14,
    비견: 7,
    상관: -16,
    겁재: -11,
    편관: -4,
    편재: -4,
    식신: 0,
    편인: -4,
  },
};

/**
 * 연애 특성 매핑 (10개)
 * PRD: 배려심, 유머감각, 감성, 자존감, 모험심, 성실도, 사교성, 경제관념, 신뢰성, 표현력
 * v3.0: 모든 값 ×1.67 확대 (±18 → ±30, 점수 분포 극단화)
 */
export const LOVE_MODIFIERS: Record<LoveKey, TraitModifier> = {
  // 배려심 (consideration) - 식신/정인 강화, 겁재/편관 약화
  consideration: {
    식신: 30,
    정인: 23,
    정재: 13,
    정관: 7,
    편재: 3,
    상관: 0,
    비견: -10,
    편인: -13,
    편관: -17,
    겁재: -20,
  },

  // 유머감각 (humor) - 식신/상관 강화, 정관/정인 약화
  humor: {
    식신: 30,
    상관: 23,
    편재: 13,
    겁재: 7,
    편인: 3,
    비견: 0,
    정재: -10,
    편관: -13,
    정인: -17,
    정관: -20,
  },

  // 감성/예술성 (emotion) - 식신/상관/편인 강화, 정관/편관 약화
  emotion: {
    식신: 23,
    상관: 20,
    편인: 20,
    정인: 10,
    편재: 3,
    겁재: 0,
    비견: -10,
    정재: -13,
    정관: -17,
    편관: -20,
  },

  // 자존감/허영심 (selfEsteem) - 비견/겁재 강화, 정재/정인 약화
  selfEsteem: {
    비견: 30,
    겁재: 20,
    편관: 13,
    정관: 7,
    편인: 3,
    상관: 0,
    식신: -10,
    편재: -13,
    정인: -17,
    정재: -17,
  },

  // 모험심 (adventure) - 겁재/편재/상관 강화, 정재/정인/정관 약화
  adventure: {
    겁재: 30,
    편재: 23,
    상관: 17,
    편관: 3,
    비견: 3,
    편인: 0,
    식신: -10,
    정관: -17,
    정인: -17,
    정재: -17,
  },

  // 성실도 (sincerity) - 정재/정관/정인 강화, 상관/겁재/편재 약화
  sincerity: {
    정재: 30,
    정관: 23,
    정인: 20,
    비견: 3,
    편관: 3,
    식신: 0,
    편인: -10,
    편재: -17,
    겁재: -17,
    상관: -20,
  },

  // 사교력 (sociability) - 식신/상관/편재 강화, 편인/정인 약화
  sociability: {
    식신: 30,
    상관: 23,
    편재: 17,
    정재: 7,
    정관: 3,
    겁재: 0,
    비견: -10,
    편관: -13,
    정인: -20,
    편인: -20,
  },

  // 경제관념/재테크 (finance) - 정재/편재/정관 강화, 상관/겁재 약화
  finance: {
    정재: 30,
    편재: 20,
    정관: 13,
    비견: 7,
    정인: 7,
    편관: 0,
    식신: -10,
    편인: -13,
    상관: -17,
    겁재: -20,
  },

  // 신뢰성 (trustworthiness) - 정관/정인/정재 강화, 상관/겁재 약화
  trustworthiness: {
    정관: 30,
    정인: 23,
    정재: 20,
    비견: 7,
    편관: 0,
    식신: 0,
    편재: -10,
    편인: -13,
    겁재: -20,
    상관: -20,
  },

  // 표현력 (expressiveness) - 상관/식신 강화, 정인/편인/정관 약화
  expressiveness: {
    상관: 30,
    식신: 23,
    편재: 10,
    겁재: 7,
    비견: 3,
    편관: 0,
    정재: -10,
    정관: -13,
    편인: -17,
    정인: -17,
  },
};

/**
 * 모든 특성 매핑 통합
 */
export const ALL_MODIFIERS = {
  personality: PERSONALITY_MODIFIERS,
  work: WORK_MODIFIERS,
  aptitude: APTITUDE_MODIFIERS,
  love: LOVE_MODIFIERS,
} as const;

/**
 * 특정 특성의 영향 매핑 가져오기
 */
export function getTraitModifier(
  category: keyof typeof ALL_MODIFIERS,
  trait: string
): TraitModifier | undefined {
  const modifiers = ALL_MODIFIERS[category] as Record<string, TraitModifier>;
  return modifiers?.[trait];
}
