/**
 * 십신(十神) 추출 모듈
 * @description 일간(日干)을 기준으로 사주 팔자에서 십신 분포를 추출
 */

import type { JijangganData, SajuPillarsData } from '../ai/types';
import {
  STEM_TO_ELEMENT,
  STEM_TO_POLARITY,
  ELEMENT_GENERATES,
  ELEMENT_OVERCOMES,
  JIJANGGAN_WEIGHTS,
  STEM_WEIGHT,
} from './constants';
import type { TenGod, TenGodCounts, HeavenlyStem, Element } from './types';
import { createEmptyTenGodCounts } from './types';

/**
 * 일간과 다른 천간의 십신 관계 판별
 *
 * @param dayMaster - 일간 (예: '甲')
 * @param targetStem - 비교 대상 천간 (예: '庚')
 * @returns 십신 이름
 *
 * @example
 * determineTenGod('甲', '甲') // '비견'
 * determineTenGod('甲', '乙') // '겁재'
 * determineTenGod('甲', '丙') // '식신' (甲木生丙火, 같은 양)
 * determineTenGod('甲', '庚') // '편관' (庚金克甲木, 같은 양)
 */
export function determineTenGod(dayMaster: string, targetStem: string): TenGod {
  const dayElement = STEM_TO_ELEMENT[dayMaster as HeavenlyStem];
  const targetElement = STEM_TO_ELEMENT[targetStem as HeavenlyStem];
  const dayPolarity = STEM_TO_POLARITY[dayMaster as HeavenlyStem];
  const targetPolarity = STEM_TO_POLARITY[targetStem as HeavenlyStem];

  if (!dayElement || !targetElement) {
    throw new Error(`Invalid stem: ${dayMaster} or ${targetStem}`);
  }

  const samePolarity = dayPolarity === targetPolarity;

  // 1. 같은 오행 (비겁)
  if (dayElement === targetElement) {
    return samePolarity ? '비견' : '겁재';
  }

  // 2. 내가 생하는 오행 (식상)
  if (ELEMENT_GENERATES[dayElement] === targetElement) {
    return samePolarity ? '식신' : '상관';
  }

  // 3. 내가 극하는 오행 (재성)
  if (ELEMENT_OVERCOMES[dayElement] === targetElement) {
    return samePolarity ? '편재' : '정재';
  }

  // 4. 나를 극하는 오행 (관성)
  if (isOvercomeBy(dayElement, targetElement)) {
    return samePolarity ? '편관' : '정관';
  }

  // 5. 나를 생하는 오행 (인성)
  if (isGeneratedBy(dayElement, targetElement)) {
    return samePolarity ? '편인' : '정인';
  }

  throw new Error(`Cannot determine ten god for: ${dayMaster} - ${targetStem}`);
}

/**
 * targetElement가 dayElement를 극하는지 확인
 */
function isOvercomeBy(dayElement: Element, targetElement: Element): boolean {
  return ELEMENT_OVERCOMES[targetElement] === dayElement;
}

/**
 * targetElement가 dayElement를 생하는지 확인
 */
function isGeneratedBy(dayElement: Element, targetElement: Element): boolean {
  return ELEMENT_GENERATES[targetElement] === dayElement;
}

/**
 * 사주 팔자에서 십신 분포 추출
 *
 * @param pillars - 사주 팔자 (SajuPillarsData)
 * @param jijanggan - 지장간 데이터
 * @returns 십신별 개수 (가중치 포함)
 *
 * @description
 * - 천간 (연/월/시주): 가중치 1.0
 * - 지장간: 정기 1.0, 중기 0.3, 여기 0.3
 * - 일간은 제외 (자기 자신)
 */
export function extractTenGods(pillars: SajuPillarsData, jijanggan: JijangganData): TenGodCounts {
  const counts = createEmptyTenGodCounts();

  // 일간 추출
  const dayMaster = pillars.day.stem;

  if (!dayMaster) {
    console.warn('일간이 없습니다');
    return counts;
  }

  // 1. 천간 분석 (연/월/시주 천간) - 일간 제외
  const stems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem];

  for (const stem of stems) {
    if (stem) {
      try {
        const tenGod = determineTenGod(dayMaster, stem);
        counts[tenGod] += STEM_WEIGHT;
      } catch (e) {
        console.warn(`십신 판별 실패: ${dayMaster} - ${stem}`, e);
      }
    }
  }

  // 2. 지장간 분석 (4주 모두)
  const jijangganArrays = [jijanggan.year, jijanggan.month, jijanggan.day, jijanggan.hour];

  for (const stems of jijangganArrays) {
    if (!stems || !Array.isArray(stems)) continue;

    stems.forEach((stem, index) => {
      if (!stem) return;

      // 가중치: 여기(0) 0.3, 중기(1) 0.3, 정기(마지막) 1.0
      const weight =
        index === stems.length - 1
          ? (JIJANGGAN_WEIGHTS[2] ?? 1.0) // 정기
          : (JIJANGGAN_WEIGHTS[Math.min(index, 1)] ?? 0.3); // 여기/중기

      try {
        const tenGod = determineTenGod(dayMaster, stem);
        counts[tenGod] += weight;
      } catch (e) {
        console.warn(`지장간 십신 판별 실패: ${dayMaster} - ${stem}`, e);
      }
    });
  }

  return counts;
}

/**
 * 십신 분포 요약 (디버깅용)
 */
export function summarizeTenGods(counts: TenGodCounts): string {
  const entries = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([god, count]) => `${god}: ${count.toFixed(1)}`);

  return entries.join(', ') || '없음';
}
