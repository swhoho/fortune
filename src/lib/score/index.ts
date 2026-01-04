/**
 * 점수 계산 모듈
 * @module score
 * @description 십신(十神) 기반 점수 계산
 */

// 타입
export type {
  TenGod,
  TenGodCounts,
  Element,
  Polarity,
  HeavenlyStem,
  EarthlyBranch,
  TraitModifier,
  TraitModifierMap,
} from './types';

export { TEN_GODS, createEmptyTenGodCounts } from './types';

// 상수
export {
  STEM_TO_ELEMENT,
  STEM_TO_POLARITY,
  BRANCH_TO_ELEMENT,
  ELEMENT_GENERATES,
  ELEMENT_OVERCOMES,
  JIJANGGAN_TABLE,
  JIJANGGAN_WEIGHTS,
  STEM_WEIGHT,
} from './constants';

// 십신 추출
export { determineTenGod, extractTenGods, summarizeTenGods } from './ten-gods';

// 특성 매핑
export {
  PERSONALITY_MODIFIERS,
  WORK_MODIFIERS,
  APTITUDE_MODIFIERS,
  LOVE_MODIFIERS,
  ALL_MODIFIERS,
  getTraitModifier,
} from './trait-modifiers';

// 점수 계산
export type { ExtendedScoreResult } from './calculator';
export { calculateTraitScore, calculateAllScores, scoreToTraitItems } from './calculator';
