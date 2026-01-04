'use client';

/**
 * 홈 헤더 컴포넌트
 * 앱 이름, 정보, 로그인 사용자 정보 표시
 */
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { BRAND_COLORS } from '@/lib/constants/colors';
import { useAuth } from '@/hooks/use-user';

export function HomeHeader() {
  const tCommon = useTranslations('common');
  const { user, isLoading } = useAuth();

  /** 사용자 표시 이름 (이름 > 이메일 앞부분) */
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  /** 아바타 이니셜 */
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex items-center justify-between px-4 py-4"
    >
      {/* 좌측: 정보 버튼 (비활성화 - 페이지 미구현) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 cursor-not-allowed rounded-xl text-gray-400/50"
        disabled
      >
        <Info className="h-5 w-5" strokeWidth={1.5} />
      </Button>

      {/* 중앙: 앱 이름 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg font-semibold tracking-wide text-white"
          style={{
            textShadow: `0 0 30px ${BRAND_COLORS.primary}30`,
          }}
        >
          {tCommon('appName')}
        </motion.h1>
      </div>

      {/* 우측: 언어 / 사용자 정보 */}
      <div className="flex items-center gap-2">
        <div className="[&_button]:rounded-xl [&_button]:text-gray-400 [&_button]:transition-colors [&_button]:hover:bg-white/[0.06] [&_button]:hover:text-white">
          <LanguageSwitcher />
        </div>
        {/* 사용자 아바타 + 이름 */}
        {isLoading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        ) : user ? (
          <Link href="/mypage" className="group flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white transition-all group-hover:ring-2 group-hover:ring-white/30"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              {initial}
            </div>
            <span className="hidden text-sm text-gray-300 transition-colors group-hover:text-white md:block">
              {displayName}
            </span>
          </Link>
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
