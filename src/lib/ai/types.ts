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
