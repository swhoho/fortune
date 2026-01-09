'use client';

/**
 * 궁합 분석 - 글래스모피즘 카드
 * 섬세한 빛 효과와 입체감
 */

import { motion, type HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
  delay?: number;
  className?: string;
}

const variants = {
  default: {
    border: 'rgba(255, 255, 255, 0.08)',
    bg: 'rgba(20, 20, 25, 0.6)',
    glow: 'transparent',
  },
  highlight: {
    border: 'rgba(212, 175, 55, 0.25)',
    bg: 'rgba(212, 175, 55, 0.05)',
    glow: 'rgba(212, 175, 55, 0.1)',
  },
  warning: {
    border: 'rgba(251, 191, 36, 0.25)',
    bg: 'rgba(251, 191, 36, 0.05)',
    glow: 'rgba(251, 191, 36, 0.1)',
  },
};

export function GlassCard({
  children,
  variant = 'default',
  delay = 0,
  className = '',
  ...props
}: GlassCardProps) {
  const colors = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: colors.bg,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 40px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
      {...props}
    >
      {/* 상단 하이라이트 */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            variant === 'highlight'
              ? 'linear-gradient(90deg, transparent 20%, rgba(212,175,55,0.4) 50%, transparent 80%)'
              : 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)',
        }}
      />

      {/* 내부 그라데이션 오버레이 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
        }}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/**
 * 섹션 헤더
 */
interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
}

export function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background:
              'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
          }}
        >
          <span className="text-[#d4af37]">{icon}</span>
        </div>
      )}
      <h3
        className="text-lg font-semibold tracking-tight"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </h3>
    </div>
  );
}
