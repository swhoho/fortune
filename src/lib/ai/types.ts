/**
 * AI 사주 분석 결과 타입 정의
 * docs/fortune_engine.md의 출력 JSON 스키마 기반
 */

import type { FocusArea } from '@/types/saju';

// FocusArea 타입 re-export
export type { FocusArea } from '@/types/saju';

/**
 * 영역별 분석 결과 (재물/사랑/커리어/건강)
 */
export interface AreaAnalysis {
  title: string;
  content: string;
  score: number; // 0-100
  advice: string;
}

/**
 * 성격 분석 결과
 */
export interface PersonalityAnalysis {
  title: string;
  content: string;
  keywords: string[];
}

/**
 * 연도별 운세 흐름
 */
export interface YearlyFlow {
  year: number;
  theme: string;
  score: number; // 0-100
  advice: string;
}

/**
 * 고전 인용
 */
export interface ClassicalReference {
  source: string; // 예: "자평진전", "궁통보감"
  quote: string;
  interpretation: string;
}

/**
 * AI 분석 전체 결과 (Gemini 응답 스키마)
 */
export interface SajuAnalysisResult {
  summary: string; // 한 줄 요약 (50자 이내)
  personality: PersonalityAnalysis;
  wealth: AreaAnalysis;
  love: AreaAnalysis;
  career: AreaAnalysis;
  health: AreaAnalysis;
  yearly_flow: YearlyFlow[];
  classical_references: ClassicalReference[];
}

/**
 * Gemini API용 기둥 데이터 (한자 포함)
 */
export interface PillarData {
  stem: string; // 천간 한자 (甲, 乙, 丙...)
  branch: string; // 지지 한자 (子, 丑, 寅...)
  element: string; // 오행 (木, 火, 土, 金, 水)
  stemElement: string; // 천간 오행
  branchElement: string; // 지지 오행
}

/**
 * Gemini API용 사주 데이터
 */
export interface SajuPillarsData {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData;
}

/**
 * Gemini API용 대운 데이터
 */
export interface DaewunData {
  startAge: number;
  endAge: number;
  stem: string;
  branch: string;
  description?: string;
}

/**
 * Gemini API 요청 입력
 */
export interface GeminiAnalysisInput {
  pillars: SajuPillarsData;
  daewun?: DaewunData[];
  focusArea?: FocusArea;
  question?: string;
  language?: 'ko' | 'en' | 'ja' | 'zh';
}

/**
 * API 에러 타입
 */
export interface GeminiApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 분석 응답 타입
 */
export interface AnalysisResponse {
  success: boolean;
  data?: SajuAnalysisResult;
  error?: GeminiApiError;
}

/**
 * 분석 옵션
 */
export interface AnalysisOptions {
  timeout?: number; // 밀리초, 기본 30000
  retryCount?: number; // 재시도 횟수, 기본 2
}

// ============================================
// Task 16: 후속 질문 관련 타입
// ============================================

/**
 * Q&A 히스토리 아이템
 */
export interface QuestionHistoryItem {
  question: string;
  answer: string;
  createdAt: string;
}

/**
 * 후속 질문 입력 타입
 */
export interface FollowUpInput {
  /** 분석 ID */
  analysisId: string;
  /** 사용자 질문 */
  question: string;
  /** 이전 분석 결과 (컨텍스트) */
  previousAnalysis: SajuAnalysisResult;
  /** 사주 정보 */
  pillars: SajuPillarsData;
  /** 이전 Q&A 히스토리 */
  questionHistory?: QuestionHistoryItem[];
}

/**
 * 후속 질문 응답 타입
 */
export interface FollowUpResponse {
  success: boolean;
  data?: {
    answer: string;
    questionId: string;
    /** 토큰 사용량 */
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
  };
  error?: GeminiApiError;
}

// ============================================
// Task 20: 신년 사주 분석 관련 타입
// ============================================

/**
 * 지원 언어 타입 (5개 언어)
 */
export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'zh-CN' | 'zh-TW';

/**
 * 길일 정보
 */
export interface LuckyDay {
  /** 날짜 (YYYY-MM-DD 형식) */
  date: string;
  /** 요일 */
  dayOfWeek: string;
  /** 길일인 이유 */
  reason: string;
  /** 적합한 활동 목록 */
  suitableFor: string[];
}

/**
 * 흉일 정보
 */
export interface UnluckyDay {
  /** 날짜 (YYYY-MM-DD 형식) */
  date: string;
  /** 요일 */
  dayOfWeek: string;
  /** 흉일인 이유 */
  reason: string;
  /** 피해야 할 활동 목록 */
  avoid: string[];
}

/**
 * 월별 운세 분석
 */
export interface MonthlyFortune {
  /** 월 (1-12) */
  month: number;
  /** 월의 테마 */
  theme: string;
  /** 월별 점수 (0-100) */
  score: number;
  /** 월별 개요 (100-200자) */
  overview: string;
  /** 길일 목록 (3-5개) */
  luckyDays: LuckyDay[];
  /** 흉일 목록 (1-3개) */
  unluckyDays: UnluckyDay[];
  /** 월별 조언 */
  advice: string;
  /** 핵심 키워드 3개 */
  keywords: string[];
}

/**
 * 분기별 하이라이트
 */
export interface QuarterlyHighlight {
  /** 분기 (1-4) */
  quarter: 1 | 2 | 3 | 4;
  /** 분기 테마 */
  theme: string;
  /** 분기 점수 (0-100) */
  score: number;
  /** 분기 요약 */
  summary: string;
  /** 분기 개요 (선택) */
  overview?: string;
  /** 분기 키워드 (선택) */
  keywords?: string[];
  /** 분기 조언 (선택) */
  advice?: string;
}

/**
 * 연중 핵심 날짜
 */
export interface KeyDate {
  /** 날짜 (YYYY-MM-DD 형식) */
  date: string;
  /** 날짜 유형 */
  type: 'lucky' | 'unlucky' | 'neutral';
  /** 중요도 설명 */
  significance: string;
  /** 추천 사항 */
  recommendation: string;
}

/**
 * 분야별 연간 조언
 */
/** 분야별 조언 상세 (객체 형태) */
export interface AdviceDetail {
  overview?: string;
  strengths?: string[];
  weaknesses?: string[];
  cautions?: string[];
  tips?: string[];
  actions?: string[];
  timing?: string;
}

/** 분야별 조언 (문자열 또는 객체) */
export type AdviceValue = string | AdviceDetail;

export interface YearlyAdvice {
  wealth: AdviceValue;
  love: AdviceValue;
  career: AdviceValue;
  health: AdviceValue;
}

/**
 * 신년 분석 전체 결과
 */
export interface YearlyAnalysisResult {
  /** 분석 대상 연도 */
  year: number;
  /** 연도 총평 (100자 이내) */
  summary: string;
  /** 해의 주제 (예: "도약의 해") */
  yearlyTheme: string;
  /** 종합 점수 (0-100) */
  overallScore: number;
  /** 12개월 분석 */
  monthlyFortunes: MonthlyFortune[];
  /** 분기별 하이라이트 */
  quarterlyHighlights: QuarterlyHighlight[];
  /** 연중 핵심 날짜 (10-15개) */
  keyDates: KeyDate[];
  /** 분야별 연간 조언 */
  yearlyAdvice: YearlyAdvice;
  /** 고전 인용 */
  classicalReferences: ClassicalReference[];
}

/**
 * 신년 분석 API 요청 입력
 */
export interface YearlyAnalysisInput {
  /** 분석 대상 연도 */
  year: number;
  /** 사주 데이터 */
  pillars: SajuPillarsData;
  /** 대운 데이터 */
  daewun?: DaewunData[];
  /** 언어 */
  language?: SupportedLanguage;
}

/**
 * 신년 분석 API 응답
 */
export interface YearlyAnalysisResponse {
  success: boolean;
  data?: {
    analysisId: string;
    year: number;
    result: YearlyAnalysisResult;
    creditsUsed: number;
    remainingCredits: number;
  };
  error?: GeminiApiError;
}

// ============================================
// Task 6: 멀티스텝 파이프라인 관련 타입
// ============================================

/**
 * v2.0 멀티스텝 분석 단계
 */
export type PipelineStep =
  | 'manseryeok' // 만세력 계산 (Python API)
  | 'jijanggan' // 지장간 추출 (Python API)
  | 'basic_analysis' // 기본 분석 (Gemini#1)
  | 'personality' // 성격 분석 (Gemini#2)
  | 'aptitude' // 적성 분석 (Gemini#3)
  | 'fortune' // 재물/연애 분석 (Gemini#4)
  | 'scoring' // 점수 계산 (TypeScript)
  | 'visualization' // 시각화 생성
  | 'saving' // 저장
  | 'complete'; // 완료

/**
 * 단계별 상태
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * 파이프라인 진행 상태
 */
export interface PipelineProgress {
  currentStep: PipelineStep;
  stepStatuses: Record<PipelineStep, StepStatus>;
  progressPercent: number; // 0-100
  estimatedTimeRemaining: number; // 초
  startedAt: Date;
  lastUpdatedAt: Date;
}

/**
 * 기본 분석 결과 (Gemini#1)
 * - 일간 특성, 격국, 용신
 */
export interface BasicAnalysisResult {
  dayMaster: {
    stem: string;
    element: string;
    yinYang: string;
    characteristics: string[];
  };
  structure: {
    type: string; // 격국 유형
    quality: string; // 격국 품질 (상/중/하)
    description: string;
  };
  usefulGod: {
    primary: string; // 용신
    secondary: string; // 희신
    harmful: string; // 기신
    reasoning: string;
  };
  summary: string; // 한 줄 요약
}

/**
 * 성격 분석 결과 (Gemini#2)
 * - 의지력, 겉/속 성격, 대인관계
 */
export interface PersonalityResult {
  willpower: {
    score: number; // 0-100
    description: string;
  };
  outerPersonality: string; // 겉성격
  innerPersonality: string; // 속성격
  socialStyle: {
    type: string;
    strengths: string[];
    weaknesses: string[];
  };
}

/**
 * 적성 분석 결과 (Gemini#3)
 * - 키워드, 재능, 추천 분야
 */
export interface AptitudeResult {
  keywords: string[]; // 핵심 키워드 3-5개
  talents: string[]; // 타고난 재능
  recommendedFields: string[]; // 추천 분야
  avoidFields: string[]; // 피해야 할 분야
}

/**
 * 재물/연애 분석 결과 (Gemini#4)
 */
export interface FortuneResult {
  wealth: {
    pattern: string; // 재물 패턴
    strengths: string[];
    risks: string[];
    advice: string;
  };
  love: {
    style: string; // 연애 스타일
    idealPartner: string[]; // 이상형 특성
    compatibilityPoints: string[]; // 궁합 포인트
    warnings: string[];
  };
}

/**
 * 점수 계산 결과 (PRD v2 기준 확장 - 35개 항목)
 */
export interface ScoreResult {
  /** 성격 특성 (10개) */
  personality: {
    willpower: number; // 의지력
    sociability: number; // 사교성
    patience: number; // 인내력
    independence: number; // 독립심
    reliability: number; // 신뢰성
    consideration: number; // 배려심
    humor: number; // 유머감각
    cooperation: number; // 협동심
    expressiveness: number; // 표현력
    diligence: number; // 성실도
  };

  /** 업무 능력 (5개) */
  work: {
    planning: number; // 기획력
    drive: number; // 추진력
    execution: number; // 실행력
    completion: number; // 완성도
    management: number; // 관리력
  };

  /** 적성 특성 (10개) */
  aptitude: {
    analytical: number; // 분석력
    teamwork: number; // 협동심
    learning: number; // 학습력
    creativity: number; // 창의력
    artistry: number; // 예술성
    expression: number; // 표현력
    activity: number; // 활동성
    challenge: number; // 도전정신
    business: number; // 사업감각
    trustworthiness: number; // 신뢰성
  };

  /** 연애 특성 (10개) */
  love: {
    consideration: number; // 배려심
    humor: number; // 유머감각
    emotion: number; // 감성
    selfEsteem: number; // 자존감
    adventure: number; // 모험심
    sincerity: number; // 성실도
    sociability: number; // 사교성
    finance: number; // 경제관념
    trustworthiness: number; // 신뢰성
    expressiveness: number; // 표현력
  };
}

/**
 * 지장간 데이터
 */
export interface JijangganData {
  year: string[];
  month: string[];
  day: string[];
  hour: string[];
}

/**
 * 파이프라인 중간 결과 (단계별 누적)
 */
export interface PipelineIntermediateResults {
  manseryeok?: {
    pillars: SajuPillarsData;
    daewun: DaewunData[];
    jijanggan: JijangganData;
  };
  basicAnalysis?: BasicAnalysisResult;
  personality?: PersonalityResult;
  aptitude?: AptitudeResult;
  fortune?: FortuneResult;
  scores?: ScoreResult;
  visualization?: {
    pillarImage: string; // Base64
  };
}

/**
 * 파이프라인 옵션
 */
export interface PipelineOptions {
  /** 병렬 처리 활성화 (성격/적성/재물을 동시에 호출) */
  enableParallel?: boolean;
  /** 단계별 타임아웃 (밀리초) */
  stepTimeouts?: Partial<Record<PipelineStep, number>>;
  /** 재시도 횟수 */
  retryCount?: number;
  /** 진행 상황 콜백 */
  onProgress?: (progress: PipelineProgress) => void;
  /** 단계 완료 콜백 */
  onStepComplete?: (step: PipelineStep, result: unknown) => void;
  /** 에러 발생 콜백 */
  onError?: (step: PipelineStep, error: GeminiApiError) => void;
}

/**
 * 토큰 사용량 정보
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * 파이프라인 메타데이터
 */
export interface PipelineMetadata {
  totalDuration: number; // 밀리초
  stepDurations: Partial<Record<PipelineStep, number>>;
  parallelExecuted: boolean;
  version: string;
  /** Gemini API 토큰 사용량 */
  tokenUsage?: TokenUsage;
}

/**
 * 파이프라인 응답
 */
export interface PipelineResponse {
  success: boolean;
  data?: {
    finalResult: SajuAnalysisResult;
    intermediateResults: PipelineIntermediateResults;
    pipelineMetadata: PipelineMetadata;
  };
  error?: GeminiApiError;
  /** 부분 성공 시 완료된 단계까지의 결과 */
  partialResults?: PipelineIntermediateResults;
  /** 실패한 단계 */
  failedStep?: PipelineStep;
  /** 실패 시에도 사용한 토큰 기록 */
  tokenUsage?: TokenUsage;
}

/**
 * 단계별 프롬프트 빌드 요청 (Python API)
 */
export interface StepPromptRequest {
  step: 'basic' | 'personality' | 'aptitude' | 'fortune';
  language: SupportedLanguage;
  pillars: SajuPillarsData;
  daewun?: DaewunData[];
  jijanggan?: JijangganData;
  /** 이전 단계 결과 (context) */
  previousResults?: {
    basicAnalysis?: BasicAnalysisResult;
  };
}

/**
 * 단계별 프롬프트 빌드 응답 (Python API)
 */
export interface StepPromptResponse {
  systemPrompt: string;
  userPrompt: string;
  outputSchema: Record<string, unknown>;
  metadata: {
    step: string;
    version: string;
    language: string;
    generatedAt: string;
  };
}
