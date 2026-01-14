/**
 * Capacitor 앱 인증 및 딥링크 처리
 * - 네이티브 Google Sign-In (외부 브라우저 없이)
 * - 딥링크 핸들러 (결제 등)
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '@/lib/supabase/client';

/** 앱 URL Scheme */
export const APP_URL_SCHEME = 'app.fortune30.saju';

/**
 * Capacitor 네이티브 앱 여부 확인
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * SocialLogin 플러그인 초기화
 * - 앱 시작 시 한 번만 호출
 */
export async function initGoogleAuth() {
  if (!isNativeApp()) return;

  try {
    await SocialLogin.initialize({
      google: {
        webClientId: '951109288825-vlkuvn4fqdkqig6nt812e1tj84ok6jid.apps.googleusercontent.com',
        mode: 'online',
      },
    });

    // eslint-disable-next-line no-console
    console.log('[SocialLogin] Initialized');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SocialLogin] Initialization failed:', error);
  }
}

/**
 * 네이티브 Google Sign-In (Capacitor 앱 전용)
 * - 외부 브라우저 없이 네이티브 UI 사용
 * - ID 토큰으로 Supabase 로그인
 */
export async function signInWithGoogleNative(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // eslint-disable-next-line no-console
    console.log('[SocialLogin] Starting native sign-in...');

    // 1. 네이티브 Google Sign-In
    const result = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['email', 'profile'],
      },
    });

    // eslint-disable-next-line no-console
    console.log('[SocialLogin] Sign-in result:', result);

    // Google은 online 모드로 초기화했으므로 responseType이 'online'이어야 함
    if (result.result.responseType !== 'online') {
      return { success: false, error: 'offline 모드 응답은 지원하지 않습니다' };
    }

    const idToken = result.result.idToken;

    if (!idToken) {
      return { success: false, error: 'ID 토큰을 받지 못했습니다' };
    }

    // eslint-disable-next-line no-console
    console.log('[SocialLogin] Got ID token, exchanging with Supabase...');

    // 2. Supabase에 ID 토큰으로 로그인
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[SocialLogin] Supabase signInWithIdToken failed:', error.message);
      return { success: false, error: error.message };
    }

    // eslint-disable-next-line no-console
    console.log('[SocialLogin] Login successful!');
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SocialLogin] Sign-in failed:', error);

    // 사용자가 취소한 경우
    if (
      String(error).includes('canceled') ||
      String(error).includes('cancelled') ||
      String(error).includes('The user canceled')
    ) {
      return { success: false, error: 'cancelled' };
    }

    return { success: false, error: String(error) };
  }
}

/**
 * 딥링크 핸들러 설정
 * - 앱 시작 시 한 번만 호출
 * - 결제 완료 등 앱으로 돌아올 때 처리
 */
export function setupDeepLinkHandler() {
  // 네이티브 앱이 아니면 무시
  if (!isNativeApp()) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    // eslint-disable-next-line no-console
    console.log('[Capacitor] Deep link received:', url);

    // URL 파싱 (커스텀 스킴을 https로 변환하여 URL 객체 생성)
    const urlObj = new URL(url.replace(`${APP_URL_SCHEME}://`, 'https://placeholder/'));
    const path = urlObj.pathname;

    // 결제 완료 딥링크 처리 (예: app.fortune30.saju://payment/success)
    if (path.includes('payment')) {
      const status = urlObj.searchParams.get('status');
      const next = urlObj.searchParams.get('next') || '/home';

      if (status === 'success') {
        window.location.href = next;
      } else {
        window.location.href = '/payment/failed';
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('[Capacitor] Deep link handler registered');
}
