/**
 * 사주(四柱) 관련 타입 정의
 */

/** 오행(五行) */
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

/** 오행 한자 매핑 */
export const ElementHanja: Record<Element, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 천간(天干) */
export type HeavenlyStem =
  | 'gap' // 甲
  | 'eul' // 乙
  | 'byeong' // 丙
  | 'jeong' // 丁
  | 'mu' // 戊
  | 'gi' // 己
  | 'gyeong' // 庚
  | 'sin' // 辛
  | 'im' // 壬
  | 'gye'; // 癸

/** 천간 한자 매핑 */
export const HeavenlyStemHanja: Record<HeavenlyStem, string> = {
  gap: '甲',
  eul: '乙',
  byeong: '丙',
  jeong: '丁',
  mu: '戊',
  gi: '己',
  gyeong: '庚',
  sin: '辛',
  im: '壬',
  gye: '癸',
};

/** 지지(地支) */
export type EarthlyBranch =
  | 'ja' // 子
  | 'chuk' // 丑
  | 'in' // 寅
  | 'myo' // 卯
  | 'jin' // 辰
  | 'sa' // 巳
  | 'o' // 午
  | 'mi' // 未
  | 'sin' // 申
  | 'yu' // 酉
  | 'sul' // 戌
  | 'hae'; // 亥

/** 지지 한자 매핑 */
export const EarthlyBranchHanja: Record<EarthlyBranch, string> = {
  ja: '子',
  chuk: '丑',
  in: '寅',
  myo: '卯',
  jin: '辰',
  sa: '巳',
  o: '午',
  mi: '未',
  sin: '申',
  yu: '酉',
  sul: '戌',
  hae: '亥',
};

/** 사주 기둥 */
export interface Pillar {
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
  element: Element;
}

/** 사주 명반 (4개 기둥) */
export interface SajuPillars {
  year: Pillar; // 연주
  month: Pillar; // 월주
  day: Pillar; // 일주
  hour: Pillar; // 시주
}

/** 대운 정보 */
export interface Daewun {
  startAge: number;
  endAge: number;
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
  description?: string;
}

/** 사주 입력 데이터 */
export interface SajuInput {
  birthDate: Date;
  birthTime: string; // HH:mm 형식
  timezone: string; // GMT offset (예: 'GMT+9')
  isLunar: boolean;
  gender: 'male' | 'female';
}

/** 분석 집중 영역 */
export type FocusArea = 'wealth' | 'love' | 'career' | 'health' | 'overall';

/** 분석 집중 영역 한글 매핑 */
export const FocusAreaLabel: Record<FocusArea, string> = {
  wealth: '재물운',
  love: '연애운',
  career: '직장운',
  health: '건강운',
  overall: '종합운',
};

// ============================================
// Python API 응답 타입 (Task 8 추가)
// ============================================

/** 로딩 단계 */
export type LoadingStep =
  | 'manseryeok'
  | 'jijanggan'
  | 'ai_analysis'
  | 'visualization'
  | 'report'
  | 'complete';

/** 로딩 단계 한글 라벨 */
export const LoadingStepLabel: Record<LoadingStep, string> = {
  manseryeok: '만세력 계산',
  jijanggan: '지장간 추출',
  ai_analysis: 'AI 분석 진행',
  visualization: '시각화 생성',
  report: '최종 보고서 작성',
  complete: '완료',
};

/** Python API 응답용 Pillar (한자) */
export interface PillarHanja {
  stem: string; // 천간 한자 (甲, 乙, 丙...)
  branch: string; // 지지 한자 (子, 丑, 寅...)
  element: string; // 오행 한자 (木, 火, 土, 金, 水)
}

/** Python API 응답용 Pillars (4개 기둥) */
export interface PillarsHanja {
  year: PillarHanja;
  month: PillarHanja;
  day: PillarHanja;
  hour: PillarHanja;
}

/** Python API 대운 응답 */
export interface DaewunItem {
  age: number;
  stem: string;
  branch: string;
  startYear: number;
}

/** Python API 지장간 응답 */
export interface Jijanggan {
  year: string[];
  month: string[];
  day: string[];
  hour: string[];
}
