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
 */
export const WORK_MODIFIERS: Record<WorkKey, TraitModifier> = {
  // 기획력 (planning)
  planning: {
    편인: 11,
    정인: 9,
    상관: 6,
    정관: 4,
    겁재: -6,
    편재: -2,
    식신: 2,
    비견: 0,
    정재: 0,
    편관: 2,
  },

  // 추진력 (drive)
  drive: {
    겁재: 11,
    편관: 9,
    비견: 8,
    상관: 4,
    정인: -6,
    정재: -4,
    식신: -2,
    편인: 0,
    편재: 4,
    정관: 2,
  },

  // 실행력 (execution)
  execution: {
    편관: 9,
    겁재: 8,
    정재: 8,
    비견: 6,
    편인: -6,
    상관: -2,
    식신: 0,
    정인: -2,
    편재: 4,
    정관: 4,
  },

  // 완성도 (completion)
  completion: {
    정재: 11,
    정관: 9,
    정인: 8,
    식신: 4,
    겁재: -8,
    상관: -4,
    편관: -2,
    비견: 0,
    편재: -2,
    편인: 2,
  },

  // 관리력 (management)
  management: {
    정관: 11,
    정인: 8,
    정재: 8,
    편관: 4,
    상관: -8,
    겁재: -6,
    식신: 0,
    비견: 0,
    편재: 2,
    편인: 0,
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
 */
export const LOVE_MODIFIERS: Record<LoveKey, TraitModifier> = {
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

  // 감성 (emotion)
  emotion: {
    식신: 9,
    상관: 8,
    편인: 8,
    정인: 4,
    정관: -4,
    편관: -6,
    비견: -2,
    겁재: 0,
    정재: 0,
    편재: 2,
  },

  // 자존감 (selfEsteem)
  selfEsteem: {
    비견: 11,
    겁재: 8,
    편관: 6,
    정관: 4,
    정재: -4,
    식신: -2,
    정인: 2,
    상관: 0,
    편재: 0,
    편인: 2,
  },

  // 모험심 (adventure)
  adventure: {
    겁재: 11,
    편재: 9,
    상관: 8,
    편관: 4,
    정재: -8,
    정인: -6,
    정관: -4,
    비견: 2,
    식신: 0,
    편인: 2,
  },

  // 성실도 (sincerity)
  sincerity: {
    정재: 11,
    정관: 9,
    정인: 8,
    비견: 4,
    상관: -8,
    겁재: -4,
    편재: -4,
    식신: 0,
    편관: 2,
    편인: -2,
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

  // 경제관념 (finance)
  finance: {
    정재: 11,
    편재: 8,
    정관: 6,
    비견: 4,
    상관: -6,
    겁재: -8,
    식신: -2,
    편관: 0,
    정인: 0,
    편인: -2,
  },

  // 신뢰성 (trustworthiness)
  trustworthiness: {
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
