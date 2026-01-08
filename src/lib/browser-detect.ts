/**
 * 브라우저 감지 유틸리티
 */

/**
 * 카카오톡 인앱 브라우저 감지
 */
export function isKakaoTalkBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('kakaotalk');
}

/**
 * 카카오톡 인앱 브라우저에서 외부 브라우저로 이동
 * @param url 이동할 URL (전체 URL)
 */
export function openInExternalBrowser(url: string): void {
  const encodedUrl = encodeURIComponent(url);
  window.location.href = `kakaotalk://web/openExternal?url=${encodedUrl}`;
}
