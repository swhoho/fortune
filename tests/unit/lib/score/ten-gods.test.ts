/**
 * 십신 추출 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  determineTenGod,
  extractTenGods,
  summarizeTenGods,
} from '@/lib/score/ten-gods';
import { createEmptyTenGodCounts } from '@/lib/score/types';
import type { JijangganData, SajuPillarsData } from '@/lib/ai/types';

describe('determineTenGod', () => {
  describe('비겁(比劫) - 같은 오행', () => {
    it('甲 일간과 甲 천간은 비견 (같은 오행, 같은 양)', () => {
      expect(determineTenGod('甲', '甲')).toBe('비견');
    });

    it('甲 일간과 乙 천간은 겁재 (같은 오행, 다른 음양)', () => {
      expect(determineTenGod('甲', '乙')).toBe('겁재');
    });

    it('乙 일간과 乙 천간은 비견', () => {
      expect(determineTenGod('乙', '乙')).toBe('비견');
    });

    it('乙 일간과 甲 천간은 겁재', () => {
      expect(determineTenGod('乙', '甲')).toBe('겁재');
    });
  });

  describe('식상(食傷) - 내가 생하는 오행', () => {
    it('甲 일간과 丙 천간은 식신 (木生火, 같은 양)', () => {
      expect(determineTenGod('甲', '丙')).toBe('식신');
    });

    it('甲 일간과 丁 천간은 상관 (木生火, 다른 음양)', () => {
      expect(determineTenGod('甲', '丁')).toBe('상관');
    });

    it('丙 일간과 戊 천간은 식신 (火生土, 같은 양)', () => {
      expect(determineTenGod('丙', '戊')).toBe('식신');
    });
  });

  describe('재성(財星) - 내가 극하는 오행', () => {
    it('甲 일간과 戊 천간은 편재 (木克土, 같은 양)', () => {
      expect(determineTenGod('甲', '戊')).toBe('편재');
    });

    it('甲 일간과 己 천간은 정재 (木克土, 다른 음양)', () => {
      expect(determineTenGod('甲', '己')).toBe('정재');
    });
  });

  describe('관성(官星) - 나를 극하는 오행', () => {
    it('甲 일간과 庚 천간은 편관 (金克木, 같은 양)', () => {
      expect(determineTenGod('甲', '庚')).toBe('편관');
    });

    it('甲 일간과 辛 천간은 정관 (金克木, 다른 음양)', () => {
      expect(determineTenGod('甲', '辛')).toBe('정관');
    });
  });

  describe('인성(印星) - 나를 생하는 오행', () => {
    it('甲 일간과 壬 천간은 편인 (水生木, 같은 양)', () => {
      expect(determineTenGod('甲', '壬')).toBe('편인');
    });

    it('甲 일간과 癸 천간은 정인 (水生木, 다른 음양)', () => {
      expect(determineTenGod('甲', '癸')).toBe('정인');
    });
  });

  describe('다른 일간 테스트', () => {
    it('丙 일간과 庚 천간은 편재 (火克金)', () => {
      expect(determineTenGod('丙', '庚')).toBe('편재');
    });

    it('庚 일간과 甲 천간은 편재 (金克木)', () => {
      expect(determineTenGod('庚', '甲')).toBe('편재');
    });

    it('壬 일간과 丙 천간은 편재 (水克火)', () => {
      expect(determineTenGod('壬', '丙')).toBe('편재');
    });
  });

  describe('예외 처리', () => {
    it('잘못된 천간은 에러를 던진다', () => {
      expect(() => determineTenGod('甲', 'X')).toThrow();
    });
  });
});

describe('extractTenGods', () => {
  const mockPillars: SajuPillarsData = {
    year: { stem: '庚', branch: '午', element: '金', stemElement: '금', branchElement: '화' },
    month: { stem: '辛', branch: '巳', element: '金', stemElement: '금', branchElement: '화' },
    day: { stem: '甲', branch: '子', element: '木', stemElement: '목', branchElement: '수' },
    hour: { stem: '丙', branch: '寅', element: '火', stemElement: '화', branchElement: '목' },
  };

  const mockJijanggan: JijangganData = {
    year: ['己', '丁'], // 午: 여기/정기
    month: ['戊', '庚', '丙'], // 巳
    day: ['癸'], // 子: 정기만
    hour: ['戊', '丙', '甲'], // 寅
  };

  it('천간에서 십신을 올바르게 추출한다', () => {
    const result = extractTenGods(mockPillars, mockJijanggan);

    // 庚 (편관) + 辛 (정관) + 丙 (식신) = 천간에서
    expect(result['편관']).toBeGreaterThanOrEqual(1);
    expect(result['정관']).toBeGreaterThanOrEqual(1);
    expect(result['식신']).toBeGreaterThanOrEqual(1);
  });

  it('지장간 가중치가 적용된다', () => {
    const result = extractTenGods(mockPillars, mockJijanggan);

    // 정기(마지막)는 가중치 1.0, 여기/중기는 0.3
    // 癸(子의 정기) → 정인, 가중치 1.0
    expect(result['정인']).toBeGreaterThanOrEqual(1);
  });

  it('모든 십신 키가 존재한다', () => {
    const result = extractTenGods(mockPillars, mockJijanggan);
    const expectedKeys = [
      '비견',
      '겁재',
      '식신',
      '상관',
      '정재',
      '편재',
      '정관',
      '편관',
      '정인',
      '편인',
    ];

    expectedKeys.forEach((key) => {
      expect(result).toHaveProperty(key);
    });
  });
});

describe('summarizeTenGods', () => {
  it('십신 분포를 요약 문자열로 반환한다', () => {
    const counts = createEmptyTenGodCounts();
    counts['비견'] = 2.5;
    counts['정관'] = 1.0;

    const summary = summarizeTenGods(counts);
    expect(summary).toContain('비견');
    expect(summary).toContain('정관');
  });

  it('빈 분포는 "없음"을 반환한다', () => {
    const counts = createEmptyTenGodCounts();
    expect(summarizeTenGods(counts)).toBe('없음');
  });
});
