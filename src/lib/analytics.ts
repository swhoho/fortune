/**
 * Google Analytics 4 이벤트 추적 유틸리티
 * @see docs/analytics.md
 */

// GA4 window 타입 확장
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * AARRR 이벤트 타입 정의
 */
export type AnalyticsEvent =
  // Activation (활성화)
  | 'sign_up'
  | 'create_profile'
  | 'complete_analysis'
  | 'view_report'
  // Retention (리텐션)
  | 'daily_fortune_view'
  | 'consultation_start'
  | 'return_visit'
  // Revenue (매출)
  | 'begin_checkout'
  | 'purchase'
  | 'subscribe'
  // Referral (추천)
  | 'share'
  | 'invite_friend';

/**
 * 이벤트 파라미터 타입
 */
export interface AnalyticsParams {
  // 공통
  [key: string]: string | number | boolean | undefined;

  // Activation
  method?: string;
  is_first?: boolean;
  profile_id?: string;
  is_free?: boolean;
  section?: string;

  // Retention
  day_streak?: number;
  session_id?: string;
  days_since_last?: number;

  // Revenue
  transaction_id?: string;
  value?: number;
  currency?: string;
  plan_id?: string;

  // Referral
  content_type?: string;
  invite_code?: string;
}

/**
 * GA4 이벤트 전송
 * @param eventName - 이벤트 이름
 * @param params - 이벤트 파라미터
 */
export function trackEvent(eventName: AnalyticsEvent | string, params?: AnalyticsParams): void {
  // 개발 환경 로깅
  if (process.env.NODE_ENV === 'development') {
    console.log('[GA4]', eventName, params);
  }

  // gtag 존재 여부 확인
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
}

/**
 * 회원가입 이벤트
 */
export function trackSignUp(method: string): void {
  trackEvent('sign_up', { method });
}

/**
 * 프로필 생성 이벤트
 */
export function trackCreateProfile(isFirst: boolean): void {
  trackEvent('create_profile', { is_first: isFirst });
}

/**
 * 분석 완료 이벤트
 */
export function trackCompleteAnalysis(profileId: string, isFree: boolean): void {
  trackEvent('complete_analysis', {
    profile_id: profileId,
    is_free: isFree,
  });
}

/**
 * 결제 시작 이벤트
 */
export function trackBeginCheckout(value: number, currency: string = 'KRW'): void {
  trackEvent('begin_checkout', { value, currency });
}

/**
 * 구매 완료 이벤트 (GA4 전자상거래)
 */
export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string = 'KRW',
  items?: Array<{ item_id: string; item_name: string; price?: number }>
): void {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items: items ? JSON.stringify(items) : undefined,
  });
}

/**
 * 구독 시작 이벤트
 */
export function trackSubscribe(planId: string, value: number): void {
  trackEvent('subscribe', { plan_id: planId, value });
}

/**
 * 오늘의 운세 조회 이벤트
 */
export function trackDailyFortuneView(dayStreak?: number): void {
  trackEvent('daily_fortune_view', { day_streak: dayStreak });
}

/**
 * 공유 이벤트
 */
export function trackShare(method: string, contentType: string): void {
  trackEvent('share', { method, content_type: contentType });
}
