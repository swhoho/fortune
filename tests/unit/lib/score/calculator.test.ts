/**
 * 점수 계산 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTraitScore,
  calculateAllScores,
  scoreToTraitItems,
} from '@/lib/score/calculator';
import { createEmptyTenGodCounts, type TenGodCounts } from '@/lib/score/types';
import { PERSONALITY_MODIFIERS, WORK_MODIFIERS } from '@/lib/score/trait-modifiers';
import type { JijangganData, SajuPillarsData } from '@/lib/ai/types';

describe('calculateTraitScore', () => {
  it('십신 분포가 없으면 기본 점수 50을 반환한다', () => {
    const emptyCounts = createEmptyTenGodCounts();
    const score = calculateTraitScore(emptyCounts, PERSONALITY_MODIFIERS.willpower);
    expect(score).toBe(50);
  });

  it('비견이 강하면 의지력 점수가 상승한다', () => {
    const counts = createEmptyTenGodCounts();
    counts['비견'] = 2.0;

    const score = calculateTraitScore(counts, PERSONALITY_MODIFIERS.willpower);
    // v4.0: modifier ×1.8 확대로 점수 범위가 넓어짐
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('식신이 강하면 사교성 점수가 상승한다', () => {
    const counts = createEmptyTenGodCounts();
    counts['식신'] = 2.0;

    const score = calculateTraitScore(counts, PERSONALITY_MODIFIERS.sociability);
    // v4.0: modifier ×1.8 확대로 점수 범위가 넓어짐
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('상반되는 십신은 점수를 낮춘다', () => {
    const counts = createEmptyTenGodCounts();
    counts['상관'] = 3.0;

    const score = calculateTraitScore(counts, PERSONALITY_MODIFIERS.patience);
    // v4.0: modifier ×1.8 확대로 점수가 더 낮아짐
    expect(score).toBeLessThan(50);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('점수는 0 미만으로 내려가지 않는다', () => {
    const counts = createEmptyTenGodCounts();
    counts['상관'] = 10.0; // 극단적인 값

    const score = calculateTraitScore(counts, PERSONALITY_MODIFIERS.patience);
    expect(score).toBe(0);
  });

  it('점수는 100을 초과하지 않는다', () => {
    const counts = createEmptyTenGodCounts();
    counts['비견'] = 10.0; // 극단적인 값

    const score = calculateTraitScore(counts, PERSONALITY_MODIFIERS.willpower);
    expect(score).toBe(100);
  });

  it('복합적인 십신 분포를 올바르게 계산한다', () => {
    const counts: TenGodCounts = {
      비견: 1.0,
      겁재: 0.5,
      식신: 1.0,
      상관: 0.3,
      정재: 0.5,
      편재: 0.0,
      정관: 1.0,
      편관: 0.0,
      정인: 1.5,
      편인: 0.3,
    };

    const score = calculateTraitScore(counts, PERSONALITY_MODIFIERS.willpower);
    // 복잡한 계산이므로 범위만 확인
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('calculateAllScores', () => {
  const mockPillars: SajuPillarsData = {
    year: { stem: '庚', branch: '午', element: '金', stemElement: '금', branchElement: '화' },
    month: { stem: '辛', branch: '巳', element: '金', stemElement: '금', branchElement: '화' },
    day: { stem: '甲', branch: '子', element: '木', stemElement: '목', branchElement: '수' },
    hour: { stem: '丙', branch: '寅', element: '火', stemElement: '화', branchElement: '목' },
  };

  const mockJijanggan: JijangganData = {
    year: ['己', '丁'],
    month: ['戊', '庚', '丙'],
    day: ['癸'],
    hour: ['戊', '丙', '甲'],
  };

  it('모든 카테고리가 존재한다', () => {
    const result = calculateAllScores(mockPillars, mockJijanggan);

    expect(result).toHaveProperty('personality');
    expect(result).toHaveProperty('work');
    expect(result).toHaveProperty('aptitude');
    expect(result).toHaveProperty('love');
  });

  it('성격 특성이 10개 항목을 갖는다', () => {
    const result = calculateAllScores(mockPillars, mockJijanggan);
    expect(Object.keys(result.personality)).toHaveLength(10);
  });

  it('업무 능력이 5개 항목을 갖는다', () => {
    const result = calculateAllScores(mockPillars, mockJijanggan);
    expect(Object.keys(result.work)).toHaveLength(5);
  });

  it('적성 특성이 10개 항목을 갖는다', () => {
    const result = calculateAllScores(mockPillars, mockJijanggan);
    expect(Object.keys(result.aptitude)).toHaveLength(10);
  });

  it('연애 특성이 10개 항목을 갖는다', () => {
    const result = calculateAllScores(mockPillars, mockJijanggan);
    expect(Object.keys(result.love)).toHaveLength(10);
  });

  it('모든 점수가 0-100 범위이다', () => {
    const result = calculateAllScores(mockPillars, mockJijanggan);

    const allScores = [
      ...Object.values(result.personality),
      ...Object.values(result.work),
      ...Object.values(result.aptitude),
      ...Object.values(result.love),
    ];

    allScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('같은 입력에 대해 일관된 결과를 반환한다', () => {
    const result1 = calculateAllScores(mockPillars, mockJijanggan);
    const result2 = calculateAllScores(mockPillars, mockJijanggan);

    expect(result1).toEqual(result2);
  });
});

describe('scoreToTraitItems', () => {
  it('점수를 TraitItem 배열로 변환한다', () => {
    const scores = {
      willpower: 75,
      sociability: 60,
    };
    const labels = {
      willpower: '의지력',
      sociability: '사교성',
    };

    const result = scoreToTraitItems(scores, labels);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: '의지력', value: 75 });
    expect(result[1]).toEqual({ label: '사교성', value: 60 });
  });

  it('라벨이 없으면 키를 사용한다', () => {
    const scores = { unknown: 50 };
    const labels = {};

    const result = scoreToTraitItems(scores, labels);
    expect(result[0]?.label).toBe('unknown');
  });
});
