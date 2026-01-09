'use client';

/**
 * 전역 프로바이더 컴포넌트
 * Supabase Auth 사용 (NextAuth 제거됨)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { CrispChat } from '@/components/crisp-chat';
import { Analytics } from '@vercel/analytics/react';
import { isInAppBrowser, openInExternalBrowser } from '@/lib/browser-detect';
import { useViewportHeight } from '@/hooks/use-viewport-height';

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
      {children}
      <Toaster />
      <CrispChat />
      <Analytics />
    </QueryClientProvider>
  );
}
