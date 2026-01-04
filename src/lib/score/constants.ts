/**
 * 점수 계산 상수 정의
 * @description Python manseryeok/constants.py와 동기화
 */

import type { Element, EarthlyBranch, HeavenlyStem, Polarity } from './types';

/**
 * 천간 → 오행 매핑
 */
export const STEM_TO_ELEMENT: Record<HeavenlyStem, Element> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

/**
 * 천간 → 음양 매핑
 */
export const STEM_TO_POLARITY: Record<HeavenlyStem, Polarity> = {
  甲: 'yang',
  乙: 'yin',
  丙: 'yang',
  丁: 'yin',
  戊: 'yang',
  己: 'yin',
  庚: 'yang',
  辛: 'yin',
  壬: 'yang',
  癸: 'yin',
};

/**
 * 지지 → 오행 매핑
 */
export const BRANCH_TO_ELEMENT: Record<EarthlyBranch, Element> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

/**
 * 오행 상생 관계 (나 → 생하는 오행)
 * 木→火→土→金→水→木
 */
export const ELEMENT_GENERATES: Record<Element, Element> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

/**
 * 오행 상극 관계 (나 → 극하는 오행)
 * 木→土→水→火→金→木
 */
export const ELEMENT_OVERCOMES: Record<Element, Element> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

/**
 * 지장간 테이블 (여기/중기/정기 순서)
 * 정기가 가장 강하고, 여기가 가장 약함
 */
export const JIJANGGAN_TABLE: Record<EarthlyBranch, HeavenlyStem[]> = {
  子: ['癸'], // 자 - 정기만
  丑: ['癸', '辛', '己'], // 축 - 여기/중기/정기
  寅: ['戊', '丙', '甲'], // 인
  卯: ['乙'], // 묘 - 정기만
  辰: ['乙', '癸', '戊'], // 진
  巳: ['戊', '庚', '丙'], // 사
  午: ['己', '丁'], // 오
  未: ['丁', '乙', '己'], // 미
  申: ['己', '壬', '庚'], // 신
  酉: ['辛'], // 유 - 정기만
  戌: ['辛', '丁', '戊'], // 술
  亥: ['戊', '甲', '壬'], // 해
};

/**
 * 지장간 가중치 (인덱스별)
 * 여기: 0.3, 중기: 0.3, 정기: 1.0
 */
export const JIJANGGAN_WEIGHTS = [0.3, 0.3, 1.0];

/**
 * 천간 가중치 (연/월/시주 천간)
 */
export const STEM_WEIGHT = 1.0;
