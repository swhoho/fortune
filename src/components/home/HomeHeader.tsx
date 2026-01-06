'use client';

/**
 * 홈 헤더 컴포넌트
 * 앱 이름, 정보, 로그인 사용자 정보 표시
 */
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Info, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { BRAND_COLORS } from '@/lib/constants/colors';
import { useAuth } from '@/hooks/use-user';
import { useCreditsBalance } from '@/hooks/use-credits';

export function HomeHeader() {
  const tCommon = useTranslations('common');
  const { user, isLoading } = useAuth();
  const { data: creditsData } = useCreditsBalance();

  /** 아바타 이니셜 (이름 > 이메일 첫글자) */
  const initial = (user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase();
  /** 현재 크레딧 */
  const credits = creditsData?.current ?? 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4"
    >
      {/* 좌측: 정보 버튼 (비활성화 - 페이지 미구현) */}
      <div className="flex justify-start">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 cursor-not-allowed rounded-xl text-gray-400/50"
          disabled
        >
          <Info className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </div>

      {/* 중앙: 앱 이름 */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="shrink-0 text-lg font-semibold tracking-wide text-white"
        style={{
          textShadow: `0 0 30px ${BRAND_COLORS.primary}30`,
        }}
      >
        {tCommon('appName')}
      </motion.h1>

      {/* 우측: 언어 / 사용자 정보 */}
      <div className="flex items-center justify-end gap-2">
        <div className="[&_button]:rounded-xl [&_button]:text-gray-400 [&_button]:transition-colors [&_button]:hover:bg-white/[0.06] [&_button]:hover:text-white">
          <LanguageSwitcher />
        </div>
        {/* 크레딧 + 사용자 아바타 */}
        {isLoading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        ) : user ? (
          <div className="flex items-center gap-2">
            {/* 크레딧 표시 */}
            <Link
              href="/payment"
              className="group flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm transition-all hover:bg-white/20"
            >
              <Coins className="h-4 w-4 text-[#d4af37]" />
              <span className="font-medium text-white">{credits}</span>
              <span className="text-gray-400">C</span>
            </Link>
            {/* 사용자 아바타 */}
            <Link
              href="/mypage"
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white transition-all hover:ring-2 hover:ring-white/30"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              {initial}
            </Link>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            asChild
          >
            <Link href="/auth/signin">로그인</Link>
          </Button>
        )}
      </div>
    </motion.header>
  );
}
