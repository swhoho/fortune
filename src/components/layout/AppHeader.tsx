'use client';

/**
 * 공통 앱 헤더 컴포넌트
 * - 모든 페이지에서 사용 가능한 통합 헤더
 * - 크레딧 표시, 언어 선택, 사용자 아바타 포함
 * - 슬롯 패턴으로 페이지별 커스터마이징 가능
 */
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Home, ChevronLeft, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { BRAND_COLORS } from '@/lib/constants/colors';
import { useAuth } from '@/hooks/use-user';
import { useCreditsBalance } from '@/hooks/use-credits';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  /** 뒤로가기 버튼 표시 여부 */
  showBack?: boolean;
  /** 뒤로가기 URL (없으면 history.back) */
  backHref?: string;
  /** 중앙 제목 (없으면 앱 이름 표시) */
  title?: string;
  /** 우측 추가 버튼 (공유, 추가 등) */
  rightSlot?: React.ReactNode;
  /** sticky 여부 (기본: true) */
  sticky?: boolean;
  /** 추가 className */
  className?: string;
}

export function AppHeader({
  showBack = false,
  backHref,
  title,
  rightSlot,
  sticky = true,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const { user, isLoading } = useAuth();
  const { data: creditsData, isLoading: isCreditsLoading } = useCreditsBalance();

  /** 아바타 이니셜 (이름 > 이메일 첫글자) */
  const initial = (
    user?.user_metadata?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    '?'
  ).toUpperCase();

  /** 현재 크레딧 */
  const credits = creditsData?.current ?? 0;

  /** 뒤로가기 핸들러 */
  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'z-30 border-b border-[#333] bg-[#0a0a0a]/95 backdrop-blur-sm',
        sticky && 'sticky top-0',
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        {/* 좌측: Home + Back (고정 너비로 중앙 정렬 보장) */}
        <div className="flex min-w-[80px] items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 shrink-0 rounded-xl text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Link href="/home">
              <Home className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </Button>
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 shrink-0 rounded-xl text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}
        </div>

        {/* 중앙: 제목 또는 앱 이름 */}
        <div className="flex-1 text-center">
          {title ? (
            <h1 className="truncate font-serif text-base font-semibold text-white sm:text-lg">
              {title}
            </h1>
          ) : (
            <h1
              className="font-semibold tracking-wide text-white"
              style={{
                textShadow: `0 0 30px ${BRAND_COLORS.primary}30`,
              }}
            >
              {/* 모바일: 命 한자, 태블릿+: 앱 이름 */}
              <span className="hidden text-lg sm:inline">{tCommon('appName')}</span>
              <span
                className="font-serif text-xl sm:hidden"
                style={{ color: BRAND_COLORS.primary }}
              >
                命
              </span>
            </h1>
          )}
        </div>

        {/* 우측: 추가 슬롯 + 언어 + 크레딧 + 아바타 (min-width로 좌측과 균형) */}
        <div className="flex min-w-[80px] items-center justify-end gap-1.5 sm:gap-2">
          {/* 페이지별 추가 버튼 (공유, 추가 등) */}
          {rightSlot}

          {/* 언어 선택 */}
          <div className="[&_button]:rounded-xl [&_button]:text-gray-400 [&_button]:transition-colors [&_button]:hover:bg-white/[0.06] [&_button]:hover:text-white">
            <LanguageSwitcher />
          </div>

          {/* 크레딧 + 사용자 아바타 */}
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 크레딧 표시 */}
              <Link
                href="/payment"
                className="group flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-sm transition-all hover:bg-white/20 sm:gap-1.5 sm:px-3"
              >
                <Coins className="h-4 w-4 text-[#d4af37]" />
                {isCreditsLoading ? (
                  <span className="h-4 w-5 animate-pulse rounded bg-white/20 sm:w-6" />
                ) : (
                  <span className="font-medium text-white">{credits}</span>
                )}
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
      </div>
    </motion.header>
  );
}
