'use client';

/**
 * 홈 헤더 컴포넌트
 * 앱 이름, 정보, 설정 버튼 포함
 */
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { BRAND_COLORS } from '@/lib/constants/colors';

export function HomeHeader() {
  const tCommon = useTranslations('common');

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
      {/* 좌측: 정보 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        asChild
      >
        <Link href="/about">
          <Info className="h-5 w-5" strokeWidth={1.5} />
        </Link>
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

      {/* 우측: 언어 / 설정 */}
      <div className="flex items-center gap-1">
        <div className="[&_button]:rounded-xl [&_button]:text-gray-400 [&_button]:transition-colors [&_button]:hover:bg-white/[0.06] [&_button]:hover:text-white">
          <LanguageSwitcher />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          asChild
        >
          <Link href="/mypage">
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        </Button>
      </div>
    </motion.header>
  );
}
