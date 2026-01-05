/**
 * 리포트 관련 타입 정의
 * Task 12-14: Phase 3 리포트 UI
 */

/** 프로필 정보 표시용 */
export interface ReportProfileInfo {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime?: string | null;
  calendarType: 'solar' | 'lunar' | 'lunar_leap';
  age: number;
}

/** 의지력 게이지 데이터 */
export interface WillpowerData {
  score: number;
  description: string;
}

/** 성격 카드 데이터 */
export interface PersonalityCardData {
  label: string;
  summary: string;
  description: string;
}

/** 성격 섹션 전체 데이터 */
export interface PersonalitySectionData {
  willpower: WillpowerData;
  outerPersonality: PersonalityCardData;
  innerPersonality: PersonalityCardData;
  socialStyle: PersonalityCardData;
}

/** 사주 특성 섹션 데이터 */
export interface CharacteristicsSectionData {
  title?: string;
  subtitle?: string;
  paragraphs: string[];
}

/** 대운 아이템 (saju.ts의 DaewunItem과 호환) */
export interface ReportDaewunItem {
  /** 시작 나이 */
  age: number;
  /** 종료 나이 (age + 9) */
  endAge: number;
  /** 천간 */
  stem: string;
  /** 지지 */
  branch: string;
  /** 시작 연도 */
  startYear: number;
  /** 시작 날짜 (양력 YYYY-MM-DD) */
  startDate?: string;
  /** 십신 (비견, 겁재, 식신, 상관, 정재, 편재, 정관, 편관, 정인, 편인) */
  tenGod: string;
  /** 십신 유형 (비겁운, 식상운, 재성운, 관성운, 인성운) */
  tenGodType: string;
  /** 순풍운 비율 (0-100) */
  favorablePercent: number;
  /** 역풍운 비율 (0-100) */
  unfavorablePercent: number;
  /** 나이에 맞는 대운 설명 (AI 생성) */
  description: string;
}

/** 대운 기본 아이템 (Python 계산 결과, AI 분석 전) */
export interface BaseDaewunItem {
  age: number;
  stem: string;
  branch: string;
  startYear: number;
  startDate?: string;
  tenGod?: string;
  tenGodType?: string;
}

/**
 * Task 15-16: 특성 그래프 & 적성 섹션
 */

/** 특성 그래프 아이템 */
export interface TraitItem {
  /** 특성명 */
  label: string;
  /** 점수 (0-100) */
  value: number;
}

/** 콘텐츠 카드 데이터 */
export interface ContentCardData {
  /** 라벨 (주 재능, 재능의 상태 등) */
  label: string;
  /** 제목 */
  title: string;
  /** 본문 내용 */
  content: string;
}

/** 적성 섹션 전체 데이터 */
export interface AptitudeSectionData {
  /** 적성 키워드 (8-10개) */
  keywords: string[];
  /** 주 재능 */
  mainTalent: ContentCardData;
  /** 재능의 상태 */
  talentStatus: ContentCardData;
  /** 진로선택 */
  careerChoice: ContentCardData;
  /** 추천직종 */
  recommendedJobs: string[];
  /** 업무스타일 */
  workStyle: ContentCardData;
  /** 학업스타일 */
  studyStyle: ContentCardData;
  /** 일자리 능력 그래프 */
  jobAbilityTraits: TraitItem[];
}

/**
 * Task 17-19: 업무/적성, 재물, 연애 섹션
 */

/** 업무 능력 데이터 (5개 항목) */
export interface WorkAbilityData {
  /** 기획/연구 */
  planning: number;
  /** 끈기/정력 */
  perseverance: number;
  /** 실천/수단 */
  execution: number;
  /** 완성/판매 */
  completion: number;
  /** 관리/평가 */
  management: number;
}

/** 적성 특성 데이터 (10개 항목) */
export interface AptitudeTraitsData {
  /** 비판력 */
  criticism: number;
  /** 협동심 */
  cooperation: number;
  /** 습득력 */
  learning: number;
  /** 창의력 */
  creativity: number;
  /** 예술성 */
  artistry: number;
  /** 표현력 */
  expression: number;
  /** 활동력 */
  activity: number;
  /** 모험심 */
  adventure: number;
  /** 사업감각 */
  business: number;
  /** 신뢰성 */
  reliability: number;
}

/** 재물운 섹션 데이터 */
export interface WealthSectionData {
  /** 재물복 카드 */
  wealthFortune: ContentCardData;
  /** 재물 특성 그래프 (선택) */
  wealthTraits?: TraitItem[];
  /** 재물 점수 (선택) */
  score?: number;
}

/** 연애 특성 데이터 (10개 항목) */
export interface RomanceTraitsData {
  /** 배려심 */
  consideration: number;
  /** 유머감각 */
  humor: number;
  /** 예술성 */
  artistry: number;
  /** 허영심 */
  vanity: number;
  /** 모험심 */
  adventure: number;
  /** 성실도 */
  sincerity: number;
  /** 사교력 */
  sociability: number;
  /** 재테크 */
  financial: number;
  /** 신뢰성 */
  reliability: number;
  /** 표현력 */
  expression: number;
}

/** 연애/결혼 섹션 데이터 */
export interface RomanceSectionData {
  /** 연애심리 */
  datingPsychology: ContentCardData;
  /** 배우자관 */
  spouseView: ContentCardData;
  /** 성적패턴 (선택) */
  intimacyPattern?: ContentCardData;
  /** 연애 특성 그래프 */
  romanceTraits: RomanceTraitsData;
}
