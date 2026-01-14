/**
 * Capacitor 앱 인증 및 딥링크 처리
 * - 네이티브 Google Sign-In (외부 브라우저 없이)
 * - 딥링크 핸들러 (결제 등)
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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
 * GoogleAuth 플러그인 초기화
 * - 앱 시작 시 한 번만 호출
 */
export function initGoogleAuth() {
  if (!isNativeApp()) return;

  GoogleAuth.initialize({
    clientId: '321465412948-a37e3qo8hq5t0c745gbmieoggam689t2.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });

  // eslint-disable-next-line no-console
  console.log('[GoogleAuth] Initialized');
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
    console.log('[GoogleAuth] Starting native sign-in...');

    // 1. 네이티브 Google Sign-In
    const result = await GoogleAuth.signIn();

    // eslint-disable-next-line no-console
    console.log('[GoogleAuth] Sign-in result:', result);

    const idToken = result.authentication?.idToken;

    if (!idToken) {
      return { success: false, error: 'ID 토큰을 받지 못했습니다' };
    }

    // eslint-disable-next-line no-console
    console.log('[GoogleAuth] Got ID token, exchanging with Supabase...');

    // 2. Supabase에 ID 토큰으로 로그인
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[GoogleAuth] Supabase signInWithIdToken failed:', error.message);
      return { success: false, error: error.message };
    }

    // eslint-disable-next-line no-console
    console.log('[GoogleAuth] Login successful!');
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GoogleAuth] Sign-in failed:', error);

    // 사용자가 취소한 경우
    if (String(error).includes('canceled') || String(error).includes('cancelled')) {
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
