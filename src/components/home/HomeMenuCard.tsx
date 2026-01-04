'use client';

/**
 * 홈 메뉴 카드 컴포넌트
 * 각 기능으로 이동하는 카드 버튼 - 동양적 럭셔리 미니멀리즘 스타일
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { LucideIcon } from 'lucide-react';

interface HomeMenuCardProps {
  /** 카드 제목 */
  title: string;
  /** 이동할 경로 */
  href: string;
  /** Lucide 아이콘 컴포넌트 */
  icon: LucideIcon;
  /** 비활성화 여부 (v2.1 예정 기능 등) */
  disabled?: boolean;
  /** 비활성화 시 표시할 라벨 */
  disabledLabel?: string;
  /** 애니메이션 지연 시간 (stagger용) */
  delay?: number;
}

function HomeMenuCardComponent({
  title,
  href,
  icon: Icon,
  disabled = false,
  disabledLabel,
  delay = 0,
}: HomeMenuCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        disabled
          ? undefined
          : {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
      }
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-3',
        'min-h-[120px] rounded-2xl p-6',
        'border border-white/[0.08] backdrop-blur-md',
        'transition-all duration-300',
        disabled
          ? 'cursor-not-allowed bg-white/[0.03]'
          : 'cursor-pointer bg-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.1]'
      )}
      style={{
        boxShadow: disabled ? 'none' : `0 4px 24px -8px ${BRAND_COLORS.primary}10`,
      }}
    >
      {/* 호버 시 금색 글로우 효과 */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${BRAND_COLORS.primary}15 0%, transparent 70%)`,
          }}
        />
      )}

      {/* 비활성화 라벨 */}
      {disabled && disabledLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide"
          style={{
            backgroundColor: `${BRAND_COLORS.primary}20`,
            color: BRAND_COLORS.primary,
            border: `1px solid ${BRAND_COLORS.primary}30`,
          }}
        >
          {disabledLabel}
        </motion.div>
      )}

      {/* 아이콘 컨테이너 */}
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-xl',
          'transition-all duration-300',
          disabled ? 'bg-white/[0.04]' : 'group-hover:scale-110'
        )}
        style={
          !disabled
            ? {
                backgroundColor: `${BRAND_COLORS.primary}15`,
                boxShadow: `0 0 20px ${BRAND_COLORS.primary}20`,
              }
            : undefined
        }
      >
        {/* 아이콘 글로우 */}
        {!disabled && (
          <div
            className="absolute inset-0 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          />
        )}
        <Icon
          className={cn(
            'relative h-5 w-5 transition-colors duration-300',
            disabled ? 'text-gray-600' : 'text-white/90 group-hover:text-white'
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* 제목 */}
      <span
        className={cn(
          'relative text-center text-sm font-medium tracking-wide',
          'transition-colors duration-300',
          disabled ? 'text-gray-600' : 'text-white/80 group-hover:text-white'
        )}
      >
        {title}
      </span>
    </motion.div>
  );

  if (disabled) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

export const HomeMenuCard = memo(HomeMenuCardComponent);
