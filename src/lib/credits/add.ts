/**
 * 크레딧 충전 모듈
 * - Supabase RPC add_credits 호출
 * - 결제 완료 시 credit_transactions 기록
 * - 유효기간 자동 설정 (purchase: 2년, subscription: 1개월)
 */
import { SupabaseClient } from '@supabase/supabase-js';

/** 크레딧 유형 */
export type CreditType = 'purchase' | 'subscription' | 'bonus';

/** 크레딧 충전 파라미터 */
interface AddCreditsParams {
  userId: string;
  amount: number;
  type: CreditType;
  purchaseId?: string;
  subscriptionId?: string;
  /** 만료 기간 (개월). 기본값: purchase=24, subscription=1 */
  expiresInMonths?: number;
  description?: string;
  supabase: SupabaseClient;
}

/** 크레딧 충전 결과 */
interface AddCreditsResult {
  success: boolean;
  newBalance: number;
}

/** 기본 만료 기간 (개월) */
const DEFAULT_EXPIRES_MONTHS: Record<CreditType, number> = {
  purchase: 24, // 2년
  subscription: 1, // 1개월
  bonus: 24, // 2년
};

/**
 * 크레딧 충전
 * credit_transactions 기록 + users.credits 동기화
 *
 * @example
 * // 결제 완료 시
 * await addCredits({
 *   userId: 'user-123',
 *   amount: 100,
 *   type: 'purchase',
 *   purchaseId: 'purchase-456',
 *   description: 'popular 패키지 구매',
 *   supabase,
 * });
 *
 * // 구독 월간 크레딧 지급 시
 * await addCredits({
 *   userId: 'user-123',
 *   amount: 50,
 *   type: 'subscription',
 *   subscriptionId: 'sub-789',
 *   description: '구독 월간 크레딧',
 *   supabase,
 * });
 */
export async function addCredits({
  userId,
  amount,
  type,
  purchaseId,
  subscriptionId,
  expiresInMonths,
  description,
  supabase,
}: AddCreditsParams): Promise<AddCreditsResult> {
  const months = expiresInMonths ?? DEFAULT_EXPIRES_MONTHS[type];

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_purchase_id: purchaseId || null,
    p_subscription_id: subscriptionId || null,
    p_expires_in_months: months,
    p_description: description || null,
  });

  if (error) {
    console.error('[addCredits] RPC 오류:', error);
    return { success: false, newBalance: 0 };
  }

  const result = data?.[0];
  return {
    success: result?.success || false,
    newBalance: result?.new_balance || 0,
  };
}

/**
 * 만료 예정 크레딧 조회
 * 특정 기간 내 만료되는 크레딧 정보 반환
 */
export async function getExpiringCredits(
  userId: string,
  daysAhead: number,
  supabase: SupabaseClient
): Promise<{
  total: number;
  nearestExpiry: string | null;
  items: Array<{ remaining: number; expiresAt: string }>;
}> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('remaining, expires_at')
    .eq('user_id', userId)
    .gt('remaining', 0)
    .in('type', ['purchase', 'subscription', 'bonus', 'refund'])
    .not('expires_at', 'is', null)
    .gt('expires_at', new Date().toISOString())
    .lte('expires_at', futureDate.toISOString())
    .order('expires_at', { ascending: true });

  if (error) {
    console.error('[getExpiringCredits] 조회 오류:', error);
    return { total: 0, nearestExpiry: null, items: [] };
  }

  const items = (data || []).map((item) => ({
    remaining: item.remaining,
    expiresAt: item.expires_at,
  }));

  const total = items.reduce((sum, item) => sum + item.remaining, 0);
  const nearestExpiry = items[0]?.expiresAt || null;

  return { total, nearestExpiry, items };
}
