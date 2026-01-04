'use client';

/**
 * 랜딩 페이지 - Master's Insight AI
 * 30년 명리학 거장이 인정한 AI 사주 분석 서비스
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 로그인 상태 확인 후 홈으로 리다이렉트
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          router.replace('/home');
        } else {
          setIsCheckingAuth(false);
        }
      } catch {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // 로딩 중 스피너 표시
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8] dark:bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8f8f8] dark:bg-[#0a0a0a]">
      {/* 언어 스위처 */}
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* 한지 질감 배경 */}
      <div className="absolute inset-0 bg-[url('/textures/hanpaper.png')] bg-cover opacity-30 dark:opacity-10" />

      {/* 먹 번짐 효과 배경 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1a] blur-3xl dark:bg-[#d4af37]"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }}
          className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-[#d4af37] blur-3xl"
        />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-4 text-center sm:px-6">
        {/* 로고 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="font-serif text-xl font-bold tracking-widest text-[#1a1a1a] dark:text-white sm:text-2xl">
            {tCommon('appName')}
          </h1>
        </motion.div>

        {/* 한자 애니메이션 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <span className="font-serif text-5xl text-[#1a1a1a] dark:text-[#d4af37] sm:text-6xl md:text-8xl">
            命
          </span>
        </motion.div>

        {/* 헤드라인 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-4 whitespace-pre-line font-serif text-xl font-bold leading-relaxed text-[#1a1a1a] dark:text-white sm:mb-6 sm:text-2xl md:text-3xl lg:text-4xl"
        >
          {t('headline')}
        </motion.h2>

        {/* 서브 카피 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-6 whitespace-pre-line text-base text-gray-600 dark:text-gray-300 sm:mb-8 sm:text-lg"
        >
          {t('subheadline')}
        </motion.p>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mb-8 w-full sm:mb-12 sm:w-auto"
        >
          <Button
            asChild
            size="lg"
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-6 py-5 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:w-auto sm:px-8 sm:py-6 sm:text-lg"
          >
            <Link href="/onboarding/step1">{t('cta')}</Link>
          </Button>
        </motion.div>

        {/* 신뢰 요소 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 sm:gap-6 sm:text-sm"
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>{t('trust.jaepyeongjinjeon')}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>{t('trust.gungtonggobogam')}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>{t('trust.destinyCode')}</span>
          </div>
        </motion.div>
      </main>

      {/* 하단 로그인 링크 */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
        className="absolute bottom-6 text-sm text-gray-500 dark:text-gray-400 sm:bottom-8"
      >
        {t('existingUser')}{' '}
        <Link href="/auth/signin" className="text-[#d4af37] hover:underline">
          {tNav('login')}
        </Link>
      </motion.footer>
    </div>
  );
}
