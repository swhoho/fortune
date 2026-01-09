/**
 * 브라우저 감지 유틸리티
 */

/** 인앱 브라우저 타입 */
export type InAppBrowserType =
  | 'kakaotalk'
  | 'naver'
  | 'line'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | null;

/**
 * 인앱 브라우저 감지
 * @returns 인앱 브라우저 타입 또는 null
 */
export function detectInAppBrowser(): InAppBrowserType {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;

  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk';
  if (/NAVER\(inapp/i.test(ua)) return 'naver';
  if (/Line\//i.test(ua)) return 'line';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'facebook';
  if (/Twitter/i.test(ua)) return 'twitter';
  if (/TikTok/i.test(ua)) return 'tiktok';

  return null;
}

/**
 * 인앱 브라우저인지 확인
 */
export function isInAppBrowser(): boolean {
  return detectInAppBrowser() !== null;
}

/**
 * 카카오톡 인앱 브라우저 감지 (하위 호환)
 */
export function isKakaoTalkBrowser(): boolean {
  return detectInAppBrowser() === 'kakaotalk';
}

/**
 * Android 여부 확인
 */
function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * 인앱 브라우저에서 외부 브라우저로 이동
 * @param url 이동할 URL (전체 URL)
 */
export function openInExternalBrowser(url: string): void {
  const browser = detectInAppBrowser();
  const encodedUrl = encodeURIComponent(url);

  if (browser === 'kakaotalk') {
    // 카카오톡 전용 스킴
    window.location.href = `kakaotalk://web/openExternal?url=${encodedUrl}`;
  } else if (isAndroid()) {
    // Android: Intent 스킴으로 Chrome에서 열기
    const intentUrl = url.replace(/^https?:\/\//, '');
    window.location.href = `intent://${intentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  } else {
    // iOS 및 기타: Safari/기본 브라우저로 열기 시도
    // Safari에서 직접 열기 (대부분의 iOS 인앱 브라우저에서 동작)
    window.location.href = url;
  }
}
