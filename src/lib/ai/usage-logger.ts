/**
 * AI 사용량 로깅 유틸리티
 *
 * Gemini API 호출 시 토큰 사용량과 크레딧을 DB에 기록
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { AiUsageLogInsert, FeatureType, Json } from '@/types';

/**
 * Gemini 모델별 가격 (USD per 1M tokens)
 * 2025년 1월 기준
 * https://ai.google.dev/gemini-api/docs/pricing
 */
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  // Gemini 2.5 Pro (gemini-3-pro-preview)
  // ≤200k tokens 기준
  'gemini-3-pro-preview': { input: 1.25, output: 10.0 },

  // Gemini 2.5 Flash (gemini-3-flash-preview)
  'gemini-3-flash-preview': { input: 0.3, output: 2.5 },
};

/**
 * 토큰 사용량을 USD 비용으로 변환
 */
export function calculateCostUsd(inputTokens: number, outputTokens: number, model: string): number {
  const defaultPricing = { input: 1.25, output: 10.0 }; // gemini-3-pro-preview 기본값
  const pricing = GEMINI_PRICING[model] ?? defaultPricing;

  // 1M 토큰 기준 가격 → 실제 토큰 수로 계산
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

export interface LogAiUsageParams {
  /** 사용자 ID */
  userId: string;
  /** 기능 유형 */
  featureType: FeatureType;
  /** 사용한 크레딧 */
  creditsUsed: number;
  /** 입력 토큰 수 */
  inputTokens: number;
  /** 출력 토큰 수 */
  outputTokens: number;
  /** Gemini 모델명 */
  model?: string;
  /** 프로필 ID (선택) */
  profileId?: string;
  /** 리포트 ID (선택) */
  reportId?: string;
  /** 추가 메타데이터 (step명, 에러 여부 등) */
  metadata?: Record<string, unknown>;
}

/**
 * AI 사용량을 DB에 기록
 *
 * @example
 * ```ts
 * await logAiUsage({
 *   userId: 'user-123',
 *   featureType: 'report_generation',
 *   creditsUsed: 50,
 *   inputTokens: 1500,
 *   outputTokens: 2000,
 *   profileId: 'profile-456',
 *   reportId: 'report-789',
 *   metadata: { step: 'personality_analysis' }
 * });
 * ```
 */
export async function logAiUsage(params: LogAiUsageParams): Promise<void> {
  const supabase = getSupabaseAdmin();
  const model = params.model ?? 'gemini-3-pro-preview';

  // USD 비용 계산
  const costUsd = calculateCostUsd(params.inputTokens, params.outputTokens, model);

  const insertData: AiUsageLogInsert = {
    user_id: params.userId,
    feature_type: params.featureType,
    credits_used: params.creditsUsed,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    model,
    profile_id: params.profileId ?? null,
    report_id: params.reportId ?? null,
    metadata: (params.metadata as Json) ?? null,
    cost_usd: costUsd,
  };

  const { error } = await supabase.from('ai_usage_logs').insert(insertData);

  if (error) {
    // 로깅 실패는 메인 플로우를 중단시키지 않음
    console.error('[AI Usage Logger] 로깅 실패:', error.message);
  }
}

/**
 * Gemini API 응답에서 토큰 사용량 추출
 *
 * @example
 * ```ts
 * const result = await model.generateContent(prompt);
 * const tokens = extractTokenUsage(result.response);
 * // { inputTokens: 1500, outputTokens: 2000 }
 * ```
 */
export function extractTokenUsage(response: {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}): { inputTokens: number; outputTokens: number } {
  const metadata = response.usageMetadata;

  return {
    inputTokens: metadata?.promptTokenCount ?? 0,
    outputTokens: metadata?.candidatesTokenCount ?? 0,
  };
}

/**
 * 여러 Gemini 호출의 토큰 사용량 합산
 */
export function sumTokenUsage(usages: Array<{ inputTokens: number; outputTokens: number }>): {
  inputTokens: number;
  outputTokens: number;
} {
  return usages.reduce(
    (acc, usage) => ({
      inputTokens: acc.inputTokens + usage.inputTokens,
      outputTokens: acc.outputTokens + usage.outputTokens,
    }),
    { inputTokens: 0, outputTokens: 0 }
  );
}

/**
 * 지원되는 모델 목록 조회
 */
export function getSupportedModels(): string[] {
  return Object.keys(GEMINI_PRICING);
}
