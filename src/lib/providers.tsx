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
import { isKakaoTalkBrowser, openInExternalBrowser } from '@/lib/browser-detect';

/**
 * 카카오톡 인앱 브라우저 감지 시 외부 브라우저로 리다이렉트
 */
function KakaoRedirect() {
  useEffect(() => {
    if (isKakaoTalkBrowser()) {
      openInExternalBrowser(window.location.href);
    }
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
      <KakaoRedirect />
      {children}
      <Toaster />
      <CrispChat />
      <Analytics />
    </QueryClientProvider>
  );
}
