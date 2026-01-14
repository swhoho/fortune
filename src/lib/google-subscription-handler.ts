/**
 * Google Play 구독 알림 처리 핸들러
 *
 * RTDN (Real-time Developer Notifications) 알림 타입별 처리 로직
 * - RENEWED: 월간 크레딧 지급
 * - CANCELED: 취소 처리 (period_end까지 서비스 유지)
 * - EXPIRED: 만료 처리
 * - REVOKED: 환불 처리 (즉시 서비스 중단)
 * - ON_HOLD: 계정 보류 (결제 실패)
 * - IN_GRACE_PERIOD: 유예 기간
 * - RECOVERED: 복구
 * - RESTARTED: 재시작
 */
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { addCredits } from '@/lib/credits/add';

/** RTDN 알림 타입 */
const NOTIFICATION_TYPE = {
  RECOVERED: 1,
  RENEWED: 2,
  CANCELED: 3,
  PURCHASED: 4,
  ON_HOLD: 5,
  IN_GRACE_PERIOD: 6,
  RESTARTED: 7,
  PRICE_CHANGE_CONFIRMED: 8,
  DEFERRED: 9,
  PAUSED: 10,
  PAUSE_SCHEDULE_CHANGED: 11,
  REVOKED: 12,
  EXPIRED: 13,
} as const;

/** 알림 타입 이름 매핑 */
const NOTIFICATION_TYPE_NAME: Record<number, string> = {
  1: 'RECOVERED',
  2: 'RENEWED',
  3: 'CANCELED',
  4: 'PURCHASED',
  5: 'ON_HOLD',
  6: 'IN_GRACE_PERIOD',
  7: 'RESTARTED',
  8: 'PRICE_CHANGE_CONFIRMED',
  9: 'DEFERRED',
  10: 'PAUSED',
  11: 'PAUSE_SCHEDULE_CHANGED',
  12: 'REVOKED',
  13: 'EXPIRED',
};

/** 구독 플랜 정보 */
const SUBSCRIPTION_PLAN = {
  productId: 'subscription_premium_monthly',
  credits: 50, // 월 50C 지급
};

/** 알림 처리 파라미터 */
interface NotificationParams {
  notificationType: number;
  purchaseToken: string;
  subscriptionId: string;
  packageName: string;
  eventTimeMillis: string;
}

/** 처리 결과 */
interface HandlerResult {
  success: boolean;
  type: string;
  action?: string;
  error?: string;
}

/** Supabase 서비스 롤 클라이언트 */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Google Play Developer API 클라이언트 */
async function getAndroidPublisher() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  return google.androidpublisher({
    version: 'v3',
    auth,
  });
}

/**
 * purchaseToken으로 구독 정보 조회
 */
async function findSubscriptionByToken(purchaseToken: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, status, current_period_end, canceled_at')
    .eq('google_purchase_token', purchaseToken)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Google Play API에서 구독 최신 상태 조회
 */
async function getSubscriptionFromGoogle(purchaseToken: string, subscriptionId: string, packageName: string) {
  try {
    const androidPublisher = await getAndroidPublisher();

    const result = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    return result.data;
  } catch (error) {
    console.error('[Google API] 구독 조회 실패:', error);
    return null;
  }
}

/**
 * 메인 알림 처리 함수
 */
export async function handleSubscriptionNotification(
  params: NotificationParams
): Promise<HandlerResult> {
  const { notificationType, purchaseToken, subscriptionId, packageName, eventTimeMillis } = params;
  const typeName = NOTIFICATION_TYPE_NAME[notificationType] || `UNKNOWN_${notificationType}`;

  console.log(`[SubscriptionHandler] 처리 시작: ${typeName}`, {
    subscriptionId,
    eventTime: new Date(parseInt(eventTimeMillis)).toISOString(),
  });

  // DB에서 구독 정보 조회
  const subscription = await findSubscriptionByToken(purchaseToken);

  if (!subscription && notificationType !== NOTIFICATION_TYPE.PURCHASED) {
    console.error('[SubscriptionHandler] 구독을 찾을 수 없음:', purchaseToken.substring(0, 20));
    return {
      success: false,
      type: typeName,
      error: 'Subscription not found',
    };
  }

  // 알림 타입별 처리
  switch (notificationType) {
    case NOTIFICATION_TYPE.RENEWED:
      return handleRenewed(subscription!, purchaseToken, subscriptionId, packageName);

    case NOTIFICATION_TYPE.CANCELED:
      return handleCanceled(subscription!);

    case NOTIFICATION_TYPE.EXPIRED:
      return handleExpired(subscription!);

    case NOTIFICATION_TYPE.REVOKED:
      return handleRevoked(subscription!);

    case NOTIFICATION_TYPE.ON_HOLD:
      return handleOnHold(subscription!);

    case NOTIFICATION_TYPE.IN_GRACE_PERIOD:
      return handleGracePeriod(subscription!);

    case NOTIFICATION_TYPE.RECOVERED:
      return handleRecovered(subscription!);

    case NOTIFICATION_TYPE.RESTARTED:
      return handleRestarted(subscription!);

    case NOTIFICATION_TYPE.PAUSED:
      return handlePaused(subscription!);

    case NOTIFICATION_TYPE.PRICE_CHANGE_CONFIRMED:
    case NOTIFICATION_TYPE.DEFERRED:
    case NOTIFICATION_TYPE.PAUSE_SCHEDULE_CHANGED:
      // 현재 처리 불필요한 알림
      console.log(`[SubscriptionHandler] ${typeName} - 처리 스킵`);
      return { success: true, type: typeName, action: 'skipped' };

    default:
      console.warn(`[SubscriptionHandler] 알 수 없는 알림 타입: ${notificationType}`);
      return { success: true, type: typeName, action: 'unknown_skipped' };
  }
}

/**
 * RENEWED (2): 구독 갱신 - 월간 크레딧 지급
 */
async function handleRenewed(
  subscription: { id: string; user_id: string },
  purchaseToken: string,
  subscriptionId: string,
  packageName: string
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // Google Play API에서 최신 구독 정보 조회
    const googleSub = await getSubscriptionFromGoogle(purchaseToken, subscriptionId, packageName);

    let periodStart = new Date();
    let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 기본 30일

    if (googleSub) {
      if (googleSub.startTimeMillis) {
        periodStart = new Date(parseInt(googleSub.startTimeMillis));
      }
      if (googleSub.expiryTimeMillis) {
        periodEnd = new Date(parseInt(googleSub.expiryTimeMillis));
      }
    }

    // 구독 기간 갱신
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // 월간 크레딧 지급 (50C, 1개월 만료)
    const { success: creditsAdded, newBalance } = await addCredits({
      userId: subscription.user_id,
      amount: SUBSCRIPTION_PLAN.credits,
      type: 'subscription',
      subscriptionId: subscription.id,
      expiresInMonths: 1,
      description: '프리미엄 구독 월간 크레딧 (Google Play)',
      supabase,
    });

    if (!creditsAdded) {
      console.error('[SubscriptionHandler] RENEWED 크레딧 지급 실패');
    }

    console.log('[SubscriptionHandler] RENEWED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      credits: SUBSCRIPTION_PLAN.credits,
      newBalance,
      periodEnd: periodEnd.toISOString(),
    });

    return {
      success: true,
      type: 'RENEWED',
      action: 'credits_added',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] RENEWED 오류:', error);
    return {
      success: false,
      type: 'RENEWED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * CANCELED (3): 구독 취소 - period_end까지 서비스 유지
 */
async function handleCanceled(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // canceled_at 설정 (status는 active 유지)
    await supabase
      .from('subscriptions')
      .update({
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    console.log('[SubscriptionHandler] CANCELED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'CANCELED',
      action: 'canceled_at_set',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] CANCELED 오류:', error);
    return {
      success: false,
      type: 'CANCELED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * EXPIRED (13): 구독 만료 - 서비스 종료
 */
async function handleExpired(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 구독 상태 만료로 변경
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    console.log('[SubscriptionHandler] EXPIRED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'EXPIRED',
      action: 'status_expired',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] EXPIRED 오류:', error);
    return {
      success: false,
      type: 'EXPIRED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * REVOKED (12): 환불 - 즉시 서비스 중단
 */
async function handleRevoked(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 구독 즉시 취소
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // users 테이블 구독 상태 제거
    await supabase
      .from('users')
      .update({
        subscription_status: null,
        subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    // TODO: 크레딧 회수 정책에 따라 구현
    // 현재는 이미 지급된 크레딧은 회수하지 않음

    console.log('[SubscriptionHandler] REVOKED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'REVOKED',
      action: 'subscription_revoked',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] REVOKED 오류:', error);
    return {
      success: false,
      type: 'REVOKED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ON_HOLD (5): 계정 보류 - 결제 실패 후 유예 기간 종료
 */
async function handleOnHold(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 구독 상태를 past_due로 변경 (서비스 일시 중단)
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    console.log('[SubscriptionHandler] ON_HOLD 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'ON_HOLD',
      action: 'status_past_due',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] ON_HOLD 오류:', error);
    return {
      success: false,
      type: 'ON_HOLD',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * IN_GRACE_PERIOD (6): 유예 기간 - 결제 실패, 재시도 중
 */
async function handleGracePeriod(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  // 유예 기간 동안은 서비스 유지
  // DB 상태 변경 없음, 로그만 기록
  console.log('[SubscriptionHandler] IN_GRACE_PERIOD:', {
    subscriptionId: subscription.id,
    userId: subscription.user_id,
    message: '결제 재시도 중 - 서비스 유지',
  });

  return {
    success: true,
    type: 'IN_GRACE_PERIOD',
    action: 'service_maintained',
  };
}

/**
 * RECOVERED (1): 구독 복구 - ON_HOLD에서 결제 성공
 */
async function handleRecovered(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 구독 상태 활성화
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    console.log('[SubscriptionHandler] RECOVERED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'RECOVERED',
      action: 'status_active',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] RECOVERED 오류:', error);
    return {
      success: false,
      type: 'RECOVERED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * RESTARTED (7): 구독 재시작 - 취소 후 다시 활성화
 */
async function handleRestarted(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 취소 상태 해제, 자동 갱신 재활성화
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    console.log('[SubscriptionHandler] RESTARTED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'RESTARTED',
      action: 'canceled_at_cleared',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] RESTARTED 오류:', error);
    return {
      success: false,
      type: 'RESTARTED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * PAUSED (10): 구독 일시정지
 */
async function handlePaused(
  subscription: { id: string; user_id: string }
): Promise<HandlerResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 구독 상태를 paused로 변경
    await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    console.log('[SubscriptionHandler] PAUSED 완료:', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });

    return {
      success: true,
      type: 'PAUSED',
      action: 'status_paused',
    };
  } catch (error) {
    console.error('[SubscriptionHandler] PAUSED 오류:', error);
    return {
      success: false,
      type: 'PAUSED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
