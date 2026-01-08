/**
 * 리포트 관련 타입 정의
 * Task 12-14: Phase 3 리포트 UI
 * Task 25: 누락 데이터 표시 개선
 */

// ============================================
// 기본 분석 (BasicAnalysis) - 신규
// ============================================

/** 일간 특성 */
export interface DayMasterData {
  /** 천간 (甲, 乙, 丙, ...) */
  stem: string;
  /** 오행 (木, 火, 土, 金, 水) */
  element: string;
  /** 음양 (陰, 陽) */
  yinYang: string;
  /** 특성 키워드 */
  characteristics: string[];
  /** 일간 성격/행동 패턴 설명 (2-3문장) */
  description?: string;
}

/** 격국 실생활 조언 */
export interface StructurePracticalAdvice {
  /** 인생 전략 (2-3문장) */
  lifeStrategy?: string;
  /** 추천 직업 (3-4개) */
  careerTips?: string[];
  /** 주의사항 (2-3개) */
  pitfallsToAvoid?: string[];
}

/** 격국 정보 */
export interface StructureData {
  /** 격국명 (정재격, 편재격, ...) */
  type: string;
  /** 격국 한자 (正財格, 偏財格, ...) */
  typeChinese?: string;
  /** 품질 (上, 中, 下) */
  quality: string;
  /** 격국 설명 */
  description: string;
  /** 실생활 조언 */
  practicalAdvice?: StructurePracticalAdvice;
}

/** 용신/기신 정보 */
export interface UsefulGodData {
  /** 용신 (丙, 丁 등) */
  primary: string;
  /** 희신/보조 오행 (火, 土 등) */
  secondary?: string;
  /** 기신 (水, 金 등) */
  harmful: string;
  /** 용신 선정 근거 */
  reasoning: string;
  /** 실생활 활용법 (방위, 색상, 업종 등) */
  practicalApplication?: string;
}

/** 기본 분석 섹션 데이터 */
export interface BasicAnalysisData {
  /** 사주 요약 */
  summary: string;
  /** 일간 특성 */
  dayMaster: DayMasterData;
  /** 격국 */
  structure: StructureData;
  /** 용신/기신 */
  usefulGod: UsefulGodData;
}

// ============================================
// 지장간 (Jijanggan) - 신규
// ============================================

/** 지장간 데이터 */
export interface JijangganData {
  /** 시주 지장간 (여기, 중기, 정기) */
  hour: string[];
  /** 일주 지장간 */
  day: string[];
  /** 월주 지장간 */
  month: string[];
  /** 연주 지장간 */
  year: string[];
}

// ============================================
// 세부 점수 (DetailedScores) - 신규
// ============================================

/** 연애 점수 (10개) */
export interface LoveScores {
  humor: number;
  emotion: number;
  finance: number;
  adventure: number;
  sincerity: number;
  selfEsteem: number;
  sociability: number;
  consideration: number;
  expressiveness: number;
  trustworthiness: number;
}

/** 업무 점수 (5개) */
export interface WorkScores {
  drive: number;
  planning: number;
  execution: number;
  completion: number;
  management: number;
}

/** 재물 점수 (2개) */
export interface WealthScores {
  growth: number;
  stability: number;
}

/** 적성 점수 (2개) */
export interface AptitudeScores {
  artistry: number;
  business: number;
}

/** 세부 점수 전체 */
export interface DetailedScoresData {
  love: LoveScores;
  work: WorkScores;
  wealth: WealthScores;
  aptitude: AptitudeScores;
  willpower?: number;
}

// ============================================
// 적성 확장 데이터 - 신규
// ============================================

/** 재능 상세 (basis, level 포함) */
export interface TalentDetailItem {
  /** 재능명 */
  name: string;
  /** 근거 십신 (예: 식신(丁火)) */
  basis?: string;
  /** 재능 수준 (0-100) */
  level?: number;
  /** 설명 */
  description?: string;
}

/** 피해야 할 분야 */
export interface AvoidFieldItem {
  /** 분야명 */
  name: string;
  /** 회피 이유 */
  reason: string;
}

/** 재능 활용 상태 상세 */
export interface TalentUsageDetail {
  /** 현재 수준 (0-100) */
  currentLevel: number;
  /** 잠재력 (0-100) */
  potential: number;
  /** 조언 */
  advice: string;
}

/** 추천 분야 상세 */
export interface RecommendedFieldItem {
  /** 분야명 */
  name: string;
  /** 적합도 (0-100) */
  suitability?: number;
  /** 설명 */
  description?: string;
}

/** 적성 섹션 확장 데이터 */
export interface AptitudeExtendedData {
  /** 재능 상세 리스트 */
  talents?: TalentDetailItem[];
  /** 피해야 할 분야 */
  avoidFields?: AvoidFieldItem[];
  /** 재능 활용 상태 상세 */
  talentUsage?: TalentUsageDetail;
  /** 추천 분야 상세 */
  recommendedFields?: RecommendedFieldItem[];
}

// ============================================
// 연애 확장 데이터 - 신규
// ============================================

/** 연애 섹션 확장 데이터 */
export interface RomanceExtendedData {
  /** 연애 스타일 (적극형, 소극형 등) */
  style?: string;
  /** 이상형 특성 */
  idealPartner?: string[];
  /** 연애 주의사항 */
  warnings?: string[];
  /** 궁합 포인트 */
  compatibilityPoints?: string[];
  /** 연애 조언 */
  loveAdvice?: string;
}

// ============================================
// 재물 확장 데이터 - 신규
// ============================================

/** 재물 섹션 확장 데이터 */
export interface WealthExtendedData {
  /** 재물 패턴 (투자형, 축재형 등) */
  pattern?: string;
  /** 재물 강점 */
  strengths?: string[];
  /** 재물 리스크 */
  risks?: string[];
  /** 재물 조언 */
  advice?: string;
}

// ============================================
// 성격 확장 데이터 - 신규
// ============================================

/** 대인관계 스타일 상세 */
export interface SocialStyleDetail {
  /** 유형 (협조형, 주도형 등) */
  type?: string;
  /** 강점 */
  strengths?: string[];
  /** 약점 */
  weaknesses?: string[];
}

/** 성격 섹션 확장 데이터 */
export interface PersonalityExtendedData {
  /** 대인관계 스타일 상세 */
  socialStyleDetail?: SocialStyleDetail;
}

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
  /** Task 25: 확장 데이터 (선택) */
  extended?: PersonalityExtendedData;
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
  /** 점수 근거 - 왜 이런 순풍/역풍 비율인지 명리학적 설명 (80-150자) */
  scoreReasoning: string;
  /** 상세 요약 - 해당 나이대에 맞는 대운 분석 (300-500자) */
  summary: string;
  /** @deprecated 기존 호환용 - 새 데이터는 summary 사용 */
  description?: string;
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
