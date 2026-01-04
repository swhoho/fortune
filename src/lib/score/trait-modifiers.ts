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
type PersonalityKey = 'willpower' | 'sociability' | 'patience' | 'independence' | 'reliability' | 'consideration' | 'humor' | 'cooperation' | 'expressiveness' | 'diligence';
type WorkKey = 'planning' | 'drive' | 'execution' | 'completion' | 'management';
type AptitudeKey = 'analytical' | 'teamwork' | 'learning' | 'creativity' | 'artistry' | 'expression' | 'activity' | 'challenge' | 'business' | 'trustworthiness';
type LoveKey = 'consideration' | 'humor' | 'emotion' | 'selfEsteem' | 'adventure' | 'sincerity' | 'sociability' | 'finance' | 'trustworthiness' | 'expressiveness';

/**
 * 성격 특성 매핑 (10개)
 * PRD: 의지력, 사교성, 인내력, 독립심, 신뢰성, 배려심, 유머감각, 협동심, 표현력, 성실도
 */
export const PERSONALITY_MODIFIERS: Record<PersonalityKey, TraitModifier> = {
  // 의지력 (willpower)
  willpower: {
    비견: 15,
    겁재: 12,
    편관: 8,
    정관: 5,
    식신: -5,
    상관: -3,
    편인: 0,
    정인: -2,
    정재: -3,
    편재: -3,
  },

  // 사교성 (sociability)
  sociability: {
    식신: 15,
    상관: 12,
    편재: 10,
    정재: 5,
    편인: -12,
    정인: -8,
    비견: -3,
    겁재: 0,
    정관: 3,
    편관: -5,
  },

  // 인내력 (patience)
  patience: {
    정인: 15,
    정관: 12,
    정재: 10,
    비견: 5,
    상관: -12,
    겁재: -8,
    편관: -5,
    식신: 0,
    편재: -3,
    편인: 3,
  },

  // 독립심 (independence)
  independence: {
    비견: 15,
    겁재: 12,
    편관: 8,
    편재: 5,
    정인: -10,
    정관: -5,
    식신: 0,
    상관: 3,
    정재: -3,
    편인: 5,
  },

  // 신뢰성 (reliability)
  reliability: {
    정관: 15,
    정인: 12,
    정재: 10,
    비견: 5,
    상관: -12,
    겁재: -8,
    편관: -5,
    편재: -3,
    식신: 0,
    편인: -3,
  },

  // 배려심 (consideration)
  consideration: {
    식신: 15,
    정인: 12,
    정재: 8,
    정관: 5,
    겁재: -10,
    편관: -8,
    비견: -3,
    상관: 0,
    편재: 3,
    편인: -3,
  },

  // 유머감각 (humor)
  humor: {
    식신: 15,
    상관: 12,
    편재: 8,
    겁재: 5,
    정관: -10,
    정인: -5,
    비견: 0,
    편관: -3,
    정재: 0,
    편인: 3,
  },

  // 협동심 (cooperation)
  cooperation: {
    정관: 12,
    식신: 10,
    정인: 8,
    정재: 8,
    비견: -8,
    겁재: -12,
    상관: -5,
    편관: 0,
    편재: 3,
    편인: -5,
  },

  // 표현력 (expressiveness)
  expressiveness: {
    상관: 15,
    식신: 12,
    편재: 5,
    겁재: 3,
    정인: -10,
    편인: -8,
    정관: -5,
    비견: 0,
    정재: 0,
    편관: 0,
  },

  // 성실도 (diligence)
  diligence: {
    정재: 15,
    정관: 12,
    정인: 10,
    비견: 5,
    상관: -10,
    겁재: -5,
    편재: -3,
    식신: 0,
    편관: 3,
    편인: -3,
  },
};

/**
 * 업무 능력 매핑 (5개)
 * PRD: 기획력, 추진력, 실행력, 완성도, 관리력
 */
export const WORK_MODIFIERS: Record<WorkKey, TraitModifier> = {
  // 기획력 (planning)
  planning: {
    편인: 15,
    정인: 12,
    상관: 8,
    정관: 5,
    겁재: -8,
    편재: -3,
    식신: 3,
    비견: 0,
    정재: 0,
    편관: 3,
  },

  // 추진력 (drive)
  drive: {
    겁재: 15,
    편관: 12,
    비견: 10,
    상관: 5,
    정인: -8,
    정재: -5,
    식신: -3,
    편인: 0,
    편재: 5,
    정관: 3,
  },

  // 실행력 (execution)
  execution: {
    편관: 12,
    겁재: 10,
    정재: 10,
    비견: 8,
    편인: -8,
    상관: -3,
    식신: 0,
    정인: -3,
    편재: 5,
    정관: 5,
  },

  // 완성도 (completion)
  completion: {
    정재: 15,
    정관: 12,
    정인: 10,
    식신: 5,
    겁재: -10,
    상관: -5,
    편관: -3,
    비견: 0,
    편재: -3,
    편인: 3,
  },

  // 관리력 (management)
  management: {
    정관: 15,
    정인: 10,
    정재: 10,
    편관: 5,
    상관: -10,
    겁재: -8,
    식신: 0,
    비견: 0,
    편재: 3,
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
    편인: 15,
    정인: 12,
    정관: 8,
    정재: 5,
    겁재: -8,
    편재: -5,
    상관: 3,
    식신: 0,
    비견: 0,
    편관: 3,
  },

  // 협동심 (teamwork)
  teamwork: {
    정관: 12,
    식신: 10,
    정인: 8,
    정재: 8,
    비견: -8,
    겁재: -12,
    상관: -5,
    편관: 0,
    편재: 3,
    편인: -5,
  },

  // 학습력 (learning)
  learning: {
    정인: 15,
    편인: 12,
    식신: 5,
    정관: 5,
    겁재: -8,
    편재: -5,
    상관: 0,
    비견: 0,
    정재: 0,
    편관: -3,
  },

  // 창의력 (creativity)
  creativity: {
    상관: 15,
    편인: 12,
    식신: 10,
    겁재: 3,
    정관: -10,
    정재: -5,
    정인: -3,
    비견: 0,
    편재: 5,
    편관: 0,
  },

  // 예술성 (artistry)
  artistry: {
    상관: 15,
    식신: 12,
    편인: 10,
    편재: 3,
    정관: -8,
    비견: -3,
    정인: 0,
    겁재: 0,
    정재: -3,
    편관: -3,
  },

  // 표현력 (expression)
  expression: {
    상관: 15,
    식신: 12,
    편재: 5,
    겁재: 3,
    정인: -10,
    편인: -5,
    정관: -5,
    비견: 0,
    정재: 0,
    편관: 0,
  },

  // 활동성 (activity)
  activity: {
    겁재: 15,
    편관: 12,
    비견: 10,
    편재: 8,
    정인: -10,
    정재: -5,
    정관: -3,
    식신: 3,
    상관: 5,
    편인: -5,
  },

  // 도전정신 (challenge)
  challenge: {
    겁재: 15,
    편관: 12,
    비견: 10,
    상관: 5,
    정재: -8,
    정인: -5,
    정관: -3,
    식신: 0,
    편재: 5,
    편인: 3,
  },

  // 사업감각 (business)
  business: {
    편재: 15,
    겁재: 10,
    상관: 8,
    편관: 5,
    정인: -8,
    정재: -3,
    정관: 0,
    비견: 3,
    식신: 0,
    편인: 0,
  },

  // 신뢰성 (trustworthiness)
  trustworthiness: {
    정관: 15,
    정인: 12,
    정재: 10,
    비견: 5,
    상관: -12,
    겁재: -8,
    편관: -3,
    편재: -3,
    식신: 0,
    편인: -3,
  },
};

/**
 * 연애 특성 매핑 (10개)
 * PRD: 배려심, 유머감각, 감성, 자존감, 모험심, 성실도, 사교성, 경제관념, 신뢰성, 표현력
 */
export const LOVE_MODIFIERS: Record<LoveKey, TraitModifier> = {
  // 배려심 (consideration)
  consideration: {
    식신: 15,
    정인: 12,
    정재: 8,
    정관: 5,
    겁재: -10,
    편관: -8,
    비견: -3,
    상관: 0,
    편재: 3,
    편인: -3,
  },

  // 유머감각 (humor)
  humor: {
    식신: 15,
    상관: 12,
    편재: 8,
    겁재: 5,
    정관: -10,
    정인: -5,
    비견: 0,
    편관: -3,
    정재: 0,
    편인: 3,
  },

  // 감성 (emotion)
  emotion: {
    식신: 12,
    상관: 10,
    편인: 10,
    정인: 5,
    정관: -5,
    편관: -8,
    비견: -3,
    겁재: 0,
    정재: 0,
    편재: 3,
  },

  // 자존감 (selfEsteem)
  selfEsteem: {
    비견: 15,
    겁재: 10,
    편관: 8,
    정관: 5,
    정재: -5,
    식신: -3,
    정인: 3,
    상관: 0,
    편재: 0,
    편인: 3,
  },

  // 모험심 (adventure)
  adventure: {
    겁재: 15,
    편재: 12,
    상관: 10,
    편관: 5,
    정재: -10,
    정인: -8,
    정관: -5,
    비견: 3,
    식신: 0,
    편인: 3,
  },

  // 성실도 (sincerity)
  sincerity: {
    정재: 15,
    정관: 12,
    정인: 10,
    비견: 5,
    상관: -10,
    겁재: -5,
    편재: -5,
    식신: 0,
    편관: 3,
    편인: -3,
  },

  // 사교성 (sociability)
  sociability: {
    식신: 15,
    상관: 12,
    편재: 10,
    정재: 5,
    편인: -12,
    정인: -8,
    비견: -3,
    겁재: 0,
    정관: 3,
    편관: -5,
  },

  // 경제관념 (finance)
  finance: {
    정재: 15,
    편재: 10,
    정관: 8,
    비견: 5,
    상관: -8,
    겁재: -10,
    식신: -3,
    편관: 0,
    정인: 0,
    편인: -3,
  },

  // 신뢰성 (trustworthiness)
  trustworthiness: {
    정관: 15,
    정인: 12,
    정재: 10,
    비견: 5,
    상관: -12,
    겁재: -8,
    편관: -5,
    편재: -3,
    식신: 0,
    편인: -3,
  },

  // 표현력 (expressiveness)
  expressiveness: {
    상관: 15,
    식신: 12,
    편재: 5,
    겁재: 3,
    정인: -10,
    편인: -8,
    정관: -5,
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
