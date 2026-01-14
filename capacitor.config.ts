import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 설정
 * - Android 앱: 원격 Vercel 서버 로드 방식
 * - 장점: SSR, API Routes 모두 정상 작동
 */
const config: CapacitorConfig = {
  appId: 'app.fortune30.saju',
  appName: '사주 30년',
  webDir: 'www', // 최소 플레이스홀더 (원격 서버 사용)
  server: {
    // 프로덕션: Vercel 웹사이트 URL
    url: process.env.CAPACITOR_SERVER_URL || 'https://fortune-rosy.vercel.app',
    cleartext: false, // HTTPS만 허용
  },
  android: {
    buildOptions: {
      releaseType: 'AAB', // Google Play용 Android App Bundle
    },
    // 딥링크 설정
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
  plugins: {
    // Google Play Billing (Phase 3에서 추가)
  },
};

export default config;
