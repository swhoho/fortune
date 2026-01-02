/**
 * AI 사주 분석 결과 타입 정의
 * docs/fortune_engine.md의 출력 JSON 스키마 기반
 */

import type { SajuPillars, Daewun } from '@/types/saju';
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
  };
  error?: GeminiApiError;
}

// ============================================
// Task 20: 신년 사주 분석 관련 타입
// ============================================

/**
 * 지원 언어 타입 (5개 언어)
 */
export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW';

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
export interface YearlyAdvice {
  wealth: string;
  love: string;
  career: string;
  health: string;
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
