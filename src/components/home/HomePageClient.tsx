'use client';

/**
 * 홈 페이지 클라이언트 컴포넌트
 */
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { HomeMenuGrid } from '@/components/home/HomeMenuGrid';
import { AppHeader, Footer } from '@/components/layout';
import { BRAND_COLORS } from '@/lib/constants/colors';
import { useAuth } from '@/hooks/use-user';

export function HomePageClient() {
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin?callbackUrl=/home');
    }
  }, [isLoading, isAuthenticated, router]);

  // 로딩 중이거나 비로그인 상태면 로딩 화면 표시
  if (isLoading || !isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: BRAND_COLORS.secondary }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${BRAND_COLORS.primary}40`, borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: BRAND_COLORS.secondary }}>
      {/* 메인 컨텐츠 */}
      <main className="relative flex-1">
        {/* 배경 그래디언트 장식 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* 우상단 금색 글로우 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.5 }}
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.primary}30 0%, transparent 70%)`,
            }}
          />
          {/* 좌하단 금색 글로우 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.primary}20 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* 컨텐츠 */}
        <div className="relative z-10 mx-auto max-w-3xl">
          {/* 헤더 */}
          <AppHeader sticky={false} className="border-b-0 bg-transparent" />

          {/* 로고 영역 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="px-6 py-8"
          >
            <div className="flex items-center gap-4">
              {/* 로고 아이콘 (한자 '命') */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${BRAND_COLORS.primary}15`,
                  boxShadow: `0 0 40px ${BRAND_COLORS.primary}20`,
                }}
              >
                <span className="font-serif text-3xl" style={{ color: BRAND_COLORS.primary }}>
                  命
                </span>
              </motion.div>
              <div>
                <h1 className="font-serif text-xl font-bold text-white">{tCommon('appName')}</h1>
                <p className="text-sm text-gray-500">Version 2.0</p>
              </div>
            </div>
          </motion.div>

          {/* 메뉴 그리드 */}
          <HomeMenuGrid />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
