/**
 * 타입 통합 Re-export
 *
 * 사용법:
 * import { components } from '@/types';
 *
 * type Pillars = components['schemas']['Pillars'];
 * type CalculateRequest = components['schemas']['CalculateRequest'];
 */

// Python API 자동 생성 타입 (수정 금지)
export * from './generated';

// 프로필 타입
export * from './profile';

// 리포트 타입
export * from './report';

// 상담 타입
export * from './consultation';

// 사주 타입 (기존 수동 타입)
export * from './saju';

// Supabase 데이터베이스 타입
export * from './database';

/**
 * 편의 타입 별칭 (자주 사용하는 스키마)
 */
import type { components } from './generated';

export type Pillars = components['schemas']['Pillars'];
export type Pillar = components['schemas']['Pillar'];
export type DaewunItem = components['schemas']['DaewunItem'];
export type Jijanggan = components['schemas']['Jijanggan'];
export type Gender = components['schemas']['Gender'];

export type CalculateRequest = components['schemas']['CalculateRequest'];
export type CalculateResponse = components['schemas']['CalculateResponse'];

export type PromptBuildRequest = components['schemas']['PromptBuildRequest'];
export type PromptBuildResponse = components['schemas']['PromptBuildResponse'];
export type StepPromptRequest = components['schemas']['StepPromptRequest'];
export type YearlyPromptBuildRequest = components['schemas']['YearlyPromptBuildRequest'];

export type VisualizationRequest = components['schemas']['VisualizationRequest'];
export type VisualizationResponse = components['schemas']['VisualizationResponse'];
