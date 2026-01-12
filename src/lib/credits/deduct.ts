/**
 * 크레딧 FIFO 차감 모듈
 * - Supabase RPC deduct_credits_fifo 호출
 * - 만료일 가까운 순서로 차감
 * - users.credits 자동 동기화
 */
import { SupabaseClient } from '@supabase/supabase-js';

/** 서비스 유형 */
export type ServiceType = 'report' | 'yearly' | 'compatibility' | 'reanalysis' | 'consultation';

/** 크레딧 차감 파라미터 */
interface DeductCreditsParams {
  userId: string;
  amount: number;
  serviceType: ServiceType;
  serviceId?: string;
  description?: string;
  supabase: SupabaseClient;
}

/** 크레딧 차감 결과 */
interface DeductCreditsResult {
  success: boolean;
  newCredits: number;
  error?: string;
}

/**
 * FIFO 방식 크레딧 차감
 * 만료일이 가까운 크레딧부터 차감
 *
 * @example
 * const result = await deductCredits({
 *   userId: 'user-123',
 *   amount: 70,
 *   serviceType: 'report',
 *   serviceId: reportId,
 *   description: '프로필 리포트 생성',
 *   supabase,
 * });
 *
 * if (!result.success) {
 *   if (result.error === 'INSUFFICIENT_CREDITS') {
 *     // 크레딧 부족 처리
 *   }
 * }
 */
export async function deductCredits({
  userId,
  amount,
  serviceType,
  serviceId,
  description,
  supabase,
}: DeductCreditsParams): Promise<DeductCreditsResult> {
  const { data, error } = await supabase.rpc('deduct_credits_fifo', {
    p_user_id: userId,
    p_amount: amount,
    p_service_type: serviceType,
    p_service_id: serviceId || null,
    p_description: description || null,
  });

  if (error) {
    console.error('[deductCredits] RPC 오류:', error);
    return { success: false, newCredits: 0, error: 'CREDIT_ERROR' };
  }

  const result = data?.[0];
  if (!result?.success) {
    return {
      success: false,
      newCredits: result?.new_credits || 0,
      error: result?.error_message || 'UNKNOWN_ERROR',
    };
  }

  return { success: true, newCredits: result.new_credits };
}

/** 크레딧 환불 파라미터 */
interface RefundCreditsParams {
  userId: string;
  amount: number;
  serviceType: ServiceType;
  description?: string;
  supabase: SupabaseClient;
}

/**
 * 크레딧 환불 (API 실패 시 복구)
 * 음수 amount로 차감하여 환불 효과
 *
 * @example
 * await refundCredits({
 *   userId: 'user-123',
 *   amount: 70,
 *   serviceType: 'report',
 *   description: '리포트 생성 실패 환불',
 *   supabase,
 * });
 */
export async function refundCredits({
  userId,
  amount,
  serviceType,
  description,
  supabase,
}: RefundCreditsParams): Promise<void> {
  // 음수 amount로 차감하면 환불 효과 (RPC 내부에서 처리)
  await supabase.rpc('deduct_credits_fifo', {
    p_user_id: userId,
    p_amount: -amount,
    p_service_type: serviceType,
    p_service_id: null,
    p_description: description || '크레딧 환불',
  });
}

/**
 * 사용 가능한 크레딧 조회
 * credit_transactions 기반으로 만료 전 크레딧만 합산
 */
export async function getAvailableCredits(
  userId: string,
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('remaining')
    .eq('user_id', userId)
    .gt('remaining', 0)
    .in('type', ['purchase', 'subscription', 'bonus', 'refund'])
    .or('expires_at.is.null,expires_at.gt.now()');

  if (error) {
    console.error('[getAvailableCredits] 조회 오류:', error);
    return 0;
  }

  return data?.reduce((sum, item) => sum + item.remaining, 0) || 0;
}
