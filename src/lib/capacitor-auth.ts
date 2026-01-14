/**
 * Capacitor 앱 OAuth 딥링크 처리
 * - 앱에서 OAuth 로그인 후 딥링크로 돌아올 때 세션 교환
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/lib/supabase/client';

/** 앱 URL Scheme */
export const APP_URL_SCHEME = 'app.fortune30.saju';

/** OAuth 콜백 URL (Capacitor 앱용) */
export const NATIVE_OAUTH_CALLBACK = `${APP_URL_SCHEME}://auth/callback`;

/**
 * Capacitor 네이티브 앱 여부 확인
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 딥링크 핸들러 설정
 * - 앱 시작 시 한 번만 호출
 * - OAuth 콜백 URL을 감지하여 세션 교환
 */
export function setupDeepLinkHandler() {
  // 네이티브 앱이 아니면 무시
  if (!isNativeApp()) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    // eslint-disable-next-line no-console
    console.log('[Capacitor] Deep link received:', url);

    // OAuth 콜백 URL 감지: app.fortune30.saju://auth/callback?code=xxx
    if (url.includes('auth') && url.includes('code=')) {
      try {
        // URL 파싱 (커스텀 스킴을 https로 변환하여 URL 객체 생성)
        const urlObj = new URL(url.replace(`${APP_URL_SCHEME}://`, 'https://placeholder/'));
        const code = urlObj.searchParams.get('code');
        const next = urlObj.searchParams.get('next') || '/home';

        if (code) {
          // eslint-disable-next-line no-console
          console.log('[Capacitor] Exchanging OAuth code for session...');

          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            // eslint-disable-next-line no-console
            console.error('[Capacitor] Session exchange failed:', error.message);
            window.location.href = '/auth/error';
          } else {
            // eslint-disable-next-line no-console
            console.log('[Capacitor] Session exchange successful, redirecting to:', next);
            window.location.href = next;
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Capacitor] Deep link handling error:', err);
        window.location.href = '/auth/error';
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('[Capacitor] Deep link handler registered');
}
