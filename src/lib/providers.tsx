'use client';

/**
 * 전역 프로바이더 컴포넌트
 * Supabase Auth 사용 (NextAuth 제거됨)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { CrispChat } from '@/components/crisp-chat';
import { Analytics } from '@vercel/analytics/react';
import { isInAppBrowser, openInExternalBrowser } from '@/lib/browser-detect';
import { useViewportHeight } from '@/hooks/use-viewport-height';
import { supabase } from '@/lib/supabase/client';
import { trackSignUp } from '@/lib/analytics';
import { setupDeepLinkHandler } from '@/lib/capacitor-auth';

/**
 * 인앱 브라우저 감지 시 외부 브라우저로 리다이렉트
 */
function InAppBrowserRedirect() {
  useEffect(() => {
    if (isInAppBrowser()) {
      openInExternalBrowser(window.location.href);
    }
  }, []);

  return null;
}

/**
 * 모바일 키보드 높이를 고려한 뷰포트 높이 관리
 */
function ViewportHeightManager() {
  useViewportHeight();
  return null;
}

/**
 * Capacitor 앱 딥링크 핸들러 설정
 * - OAuth 콜백 URL을 감지하여 세션 교환
 */
function CapacitorDeepLinkManager() {
  useEffect(() => {
    setupDeepLinkHandler();
  }, []);

  return null;
}

/**
 * GA4 회원가입 이벤트 추적
 * - SIGNED_IN 이벤트 감지 시 신규 유저인지 확인
 * - created_at이 1분 이내면 신규 가입으로 간주
 */
function AuthStateManager() {
  const trackedRef = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !trackedRef.current) {
        const createdAt = new Date(session.user.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();

        // 1분(60초) 이내에 생성된 유저면 신규 가입
        if (diffMs < 60000) {
          trackedRef.current = true;
          const provider = session.user.app_metadata?.provider || 'email';
          trackSignUp(provider);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <InAppBrowserRedirect />
      <ViewportHeightManager />
      <CapacitorDeepLinkManager />
      <AuthStateManager />
      {children}
      <Toaster />
      <CrispChat />
      <Analytics />
    </QueryClientProvider>
  );
}
