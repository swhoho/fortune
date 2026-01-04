/**
 * 점수 계산 모듈 타입 정의
 * @description 십신(十神) 기반 점수 계산을 위한 타입
 */

/**
 * 십신(十神) 타입
 * 일간(日干)을 기준으로 다른 천간과의 관계를 정의
 */
export type TenGod =
  | '비견' // 比肩 - 같은 오행, 같은 음양
  | '겁재' // 劫財 - 같은 오행, 다른 음양
  | '식신' // 食神 - 내가 생하는 오행, 같은 음양
  | '상관' // 傷官 - 내가 생하는 오행, 다른 음양
  | '정재' // 正財 - 내가 극하는 오행, 다른 음양
  | '편재' // 偏財 - 내가 극하는 오행, 같은 음양
  | '정관' // 正官 - 나를 극하는 오행, 다른 음양
  | '편관' // 偏官 - 나를 극하는 오행, 같은 음양
  | '정인' // 正印 - 나를 생하는 오행, 다른 음양
  | '편인'; // 偏印 - 나를 생하는 오행, 같은 음양

/**
 * 십신 개수 (가중치 포함)
 */
export type TenGodCounts = Record<TenGod, number>;

/**
 * 오행(五行) 타입
 */
export type Element = '木' | '火' | '土' | '金' | '水';

/**
 * 음양(陰陽) 타입
 */
export type Polarity = 'yang' | 'yin';

/**
 * 천간(天干) 타입
 */
export type HeavenlyStem =
  | '甲'
  | '乙'
  | '丙'
  | '丁'
  | '戊'
  | '己'
  | '庚'
  | '辛'
  | '壬'
  | '癸';

/**
 * 지지(地支) 타입
 */
export type EarthlyBranch =
  | '子'
  | '丑'
  | '寅'
  | '卯'
  | '辰'
  | '巳'
  | '午'
  | '未'
  | '申'
  | '酉'
  | '戌'
  | '亥';

/**
 * 십신별 특성 영향 매핑 타입
 */
export type TraitModifier = Record<TenGod, number>;

/**
 * 특성 카테고리별 매핑 타입
 */
export type TraitModifierMap = Record<string, TraitModifier>;

/**
 * 십신 목록 (순서 보장)
 */
export const TEN_GODS: TenGod[] = [
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

/**
 * 빈 십신 카운트 생성
 */
export function createEmptyTenGodCounts(): TenGodCounts {
  return {
    비견: 0,
    겁재: 0,
    식신: 0,
    상관: 0,
    정재: 0,
    편재: 0,
    정관: 0,
    편관: 0,
    정인: 0,
    편인: 0,
  };
}
