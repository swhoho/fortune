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
 */
export const PERSONALITY_MODIFIERS: Record<PersonalityKey, TraitModifier> = {
  // 의지력 (willpower)
  willpower: {
    비견: 11,
    겁재: 9,
    편관: 6,
    정관: 4,
    식신: -4,
    상관: -2,
    편인: 0,
    정인: -2,
    정재: -2,
    편재: -2,
  },

  // 사교성 (sociability)
  sociability: {
    식신: 11,
    상관: 9,
    편재: 8,
    정재: 4,
    편인: -9,
    정인: -6,
    비견: -2,
    겁재: 0,
    정관: 2,
    편관: -4,
  },

  // 인내력 (patience)
  patience: {
    정인: 11,
    정관: 9,
    정재: 8,
    비견: 4,
    상관: -9,
    겁재: -6,
    편관: -4,
    식신: 0,
    편재: -2,
    편인: 2,
  },

  // 독립심 (independence)
  independence: {
    비견: 11,
    겁재: 9,
    편관: 6,
    편재: 4,
    정인: -8,
    정관: -4,
    식신: 0,
    상관: 2,
    정재: -2,
    편인: 4,
  },

  // 신뢰성 (reliability)
  reliability: {
    정관: 11,
    정인: 9,
    정재: 8,
    비견: 4,
    상관: -9,
    겁재: -6,
    편관: -4,
    편재: -2,
    식신: 0,
    편인: -2,
  },

  // 배려심 (consideration)
  consideration: {
    식신: 11,
    정인: 9,
    정재: 6,
    정관: 4,
    겁재: -8,
    편관: -6,
    비견: -2,
    상관: 0,
    편재: 2,
    편인: -2,
  },

  // 유머감각 (humor)
  humor: {
    식신: 11,
    상관: 9,
    편재: 6,
    겁재: 4,
    정관: -8,
    정인: -4,
    비견: 0,
    편관: -2,
    정재: 0,
    편인: 2,
  },

  // 협동심 (cooperation)
  cooperation: {
    정관: 9,
    식신: 8,
    정인: 6,
    정재: 6,
    비견: -6,
    겁재: -9,
    상관: -4,
    편관: 0,
    편재: 2,
    편인: -4,
  },

  // 표현력 (expressiveness)
  expressiveness: {
    상관: 11,
    식신: 9,
    편재: 4,
    겁재: 2,
    정인: -8,
    편인: -6,
    정관: -4,
    비견: 0,
    정재: 0,
    편관: 0,
  },

  // 성실도 (diligence)
  diligence: {
    정재: 11,
    정관: 9,
    정인: 8,
    비견: 4,
    상관: -8,
    겁재: -4,
    편재: -2,
    식신: 0,
    편관: 2,
    편인: -2,
  },
};

/**
 * 업무 능력 매핑 (5개)
 * PRD: 기획력, 추진력, 실행력, 완성도, 관리력
 * v2.2: 양수/음수 비율 1.5:1로 재균형, 스케일 확대 (±18)
 */
export const WORK_MODIFIERS: Record<WorkKey, TraitModifier> = {
  // 기획력 (planning) - 편인/정인 강화, 겁재/편재 약화
  // 양수합: 48, 음수합: -32 (1.5:1)
  planning: {
    편인: 18,
    정인: 14,
    상관: 8,
    정관: 5,
    식신: 3,
    편관: 0,
    비견: -4,
    정재: -6,
    겁재: -12,
    편재: -10,
  },

  // 추진력 (drive) - 겁재/편관/비견 강화, 정인/정재 약화
  // 양수합: 48, 음수합: -32 (1.5:1)
  drive: {
    겁재: 18,
    편관: 14,
    비견: 10,
    상관: 4,
    편재: 2,
    정관: 0,
    식신: -4,
    편인: -6,
    정인: -12,
    정재: -10,
  },

  // 실행력 (execution) - 편관/겁재/정재/비견 강화, 편인/상관 약화
  // 양수합: 46, 음수합: -30 (1.5:1)
  execution: {
    편관: 14,
    겁재: 12,
    정재: 10,
    비견: 8,
    편재: 2,
    정관: 0,
    식신: -4,
    상관: -6,
    정인: -8,
    편인: -12,
  },

  // 완성도 (completion) - 정재/정관/정인 강화, 겁재/상관/편관 약화
  // 양수합: 50, 음수합: -34 (1.5:1)
  completion: {
    정재: 18,
    정관: 14,
    정인: 12,
    식신: 4,
    편인: 2,
    비견: 0,
    편재: -6,
    편관: -8,
    상관: -10,
    겁재: -10,
  },

  // 관리력 (management) - 정관/정인/정재 강화, 상관/겁재 약화
  // 양수합: 48, 음수합: -32 (1.5:1)
  management: {
    정관: 18,
    정인: 12,
    정재: 12,
    편관: 4,
    편재: 2,
    비견: 0,
    식신: -4,
    편인: -6,
    겁재: -10,
    상관: -12,
  },
};

/**
 * 적성 특성 매핑 (10개)
 * PRD: 분석력, 협동심, 학습력, 창의력, 예술성, 표현력, 활동성, 도전정신, 사업감각, 신뢰성
 */
export const APTITUDE_MODIFIERS: Record<AptitudeKey, TraitModifier> = {
  // 분석력 (analytical)
  analytical: {
    편인: 11,
    정인: 9,
    정관: 6,
    정재: 4,
    겁재: -6,
    편재: -4,
    상관: 2,
    식신: 0,
    비견: 0,
    편관: 2,
  },

  // 협동심 (teamwork)
  teamwork: {
    정관: 9,
    식신: 8,
    정인: 6,
    정재: 6,
    비견: -6,
    겁재: -9,
    상관: -4,
    편관: 0,
    편재: 2,
    편인: -4,
  },

  // 학습력 (learning)
  learning: {
    정인: 11,
    편인: 9,
    식신: 4,
    정관: 4,
    겁재: -6,
    편재: -4,
    상관: 0,
    비견: 0,
    정재: 0,
    편관: -2,
  },

  // 창의력 (creativity)
  creativity: {
    상관: 11,
    편인: 9,
    식신: 8,
    겁재: 2,
    정관: -8,
    정재: -4,
    정인: -2,
    비견: 0,
    편재: 4,
    편관: 0,
  },

  // 예술성 (artistry)
  artistry: {
    상관: 11,
    식신: 9,
    편인: 8,
    편재: 2,
    정관: -6,
    비견: -2,
    정인: 0,
    겁재: 0,
    정재: -2,
    편관: -2,
  },

  // 표현력 (expression)
  expression: {
    상관: 11,
    식신: 9,
    편재: 4,
    겁재: 2,
    정인: -8,
    편인: -4,
    정관: -4,
    비견: 0,
    정재: 0,
    편관: 0,
  },

  // 활동성 (activity)
  activity: {
    겁재: 11,
    편관: 9,
    비견: 8,
    편재: 6,
    정인: -8,
    정재: -4,
    정관: -2,
    식신: 2,
    상관: 4,
    편인: -4,
  },

  // 도전정신 (challenge)
  challenge: {
    겁재: 11,
    편관: 9,
    비견: 8,
    상관: 4,
    정재: -6,
    정인: -4,
    정관: -2,
    식신: 0,
    편재: 4,
    편인: 2,
  },

  // 사업감각 (business)
  business: {
    편재: 11,
    겁재: 8,
    상관: 6,
    편관: 4,
    정인: -6,
    정재: -2,
    정관: 0,
    비견: 2,
    식신: 0,
    편인: 0,
  },

  // 신뢰성 (trustworthiness)
  trustworthiness: {
    정관: 11,
    정인: 9,
    정재: 8,
    비견: 4,
    상관: -9,
    겁재: -6,
    편관: -2,
    편재: -2,
    식신: 0,
    편인: -2,
  },
};

/**
 * 연애 특성 매핑 (10개)
 * PRD: 배려심, 유머감각, 감성, 자존감, 모험심, 성실도, 사교성, 경제관념, 신뢰성, 표현력
 * v2.2: 양수/음수 비율 1.3:1로 재균형, 스케일 확대 (±18)
 */
export const LOVE_MODIFIERS: Record<LoveKey, TraitModifier> = {
  // 배려심 (consideration) - 식신/정인 강화, 겁재/편관 약화
  // 양수합: 46, 음수합: -36 (1.3:1)
  consideration: {
    식신: 18,
    정인: 14,
    정재: 8,
    정관: 4,
    편재: 2,
    상관: 0,
    비견: -6,
    편인: -8,
    편관: -10,
    겁재: -12,
  },

  // 유머감각 (humor) - 식신/상관 강화, 정관/정인 약화
  // 양수합: 46, 음수합: -36 (1.3:1)
  humor: {
    식신: 18,
    상관: 14,
    편재: 8,
    겁재: 4,
    편인: 2,
    비견: 0,
    정재: -6,
    편관: -8,
    정인: -10,
    정관: -12,
  },

  // 감성/예술성 (emotion) - 식신/상관/편인 강화, 정관/편관 약화
  // 양수합: 46, 음수합: -36 (1.3:1)
  emotion: {
    식신: 14,
    상관: 12,
    편인: 12,
    정인: 6,
    편재: 2,
    겁재: 0,
    비견: -6,
    정재: -8,
    정관: -10,
    편관: -12,
  },

  // 자존감/허영심 (selfEsteem) - 비견/겁재 강화, 정재/정인 약화
  // 양수합: 44, 음수합: -34 (1.3:1) ← 음수 크게 강화
  selfEsteem: {
    비견: 18,
    겁재: 12,
    편관: 8,
    정관: 4,
    편인: 2,
    상관: 0,
    식신: -6,
    편재: -8,
    정인: -10,
    정재: -10,
  },

  // 모험심 (adventure) - 겁재/편재/상관 강화, 정재/정인/정관 약화
  // 양수합: 46, 음수합: -36 (1.3:1)
  adventure: {
    겁재: 18,
    편재: 14,
    상관: 10,
    편관: 2,
    비견: 2,
    편인: 0,
    식신: -6,
    정관: -10,
    정인: -10,
    정재: -10,
  },

  // 성실도 (sincerity) - 정재/정관/정인 강화, 상관/겁재/편재 약화
  // 양수합: 48, 음수합: -38 (1.3:1)
  sincerity: {
    정재: 18,
    정관: 14,
    정인: 12,
    비견: 2,
    편관: 2,
    식신: 0,
    편인: -6,
    편재: -10,
    겁재: -10,
    상관: -12,
  },

  // 사교력 (sociability) - 식신/상관/편재 강화, 편인/정인 약화
  // 양수합: 48, 음수합: -38 (1.3:1)
  sociability: {
    식신: 18,
    상관: 14,
    편재: 10,
    정재: 4,
    정관: 2,
    겁재: 0,
    비견: -6,
    편관: -8,
    정인: -12,
    편인: -12,
  },

  // 경제관념/재테크 (finance) - 정재/편재/정관 강화, 상관/겁재 약화
  // 양수합: 46, 음수합: -36 (1.3:1)
  finance: {
    정재: 18,
    편재: 12,
    정관: 8,
    비견: 4,
    정인: 4,
    편관: 0,
    식신: -6,
    편인: -8,
    상관: -10,
    겁재: -12,
  },

  // 신뢰성 (trustworthiness) - 정관/정인/정재 강화, 상관/겁재 약화
  // 양수합: 48, 음수합: -38 (1.3:1)
  trustworthiness: {
    정관: 18,
    정인: 14,
    정재: 12,
    비견: 4,
    편관: 0,
    식신: 0,
    편재: -6,
    편인: -8,
    겁재: -12,
    상관: -12,
  },

  // 표현력 (expressiveness) - 상관/식신 강화, 정인/편인/정관 약화
  // 양수합: 44, 음수합: -34 (1.3:1)
  expressiveness: {
    상관: 18,
    식신: 14,
    편재: 6,
    겁재: 4,
    비견: 2,
    편관: 0,
    정재: -6,
    정관: -8,
    편인: -10,
    정인: -10,
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
