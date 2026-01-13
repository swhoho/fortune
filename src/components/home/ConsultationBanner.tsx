'use client';

/**
 * AI 상담 배너 컴포넌트
 * 홈화면에서 상담 페이지로 이동하는 한 줄 형태의 배너
 */
import { motion } from 'framer-motion';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { BRAND_COLORS } from '@/lib/constants/colors';

interface ConsultationBannerProps {
  /** 애니메이션 지연 시간 */
  delay?: number;
}

export function ConsultationBanner({ delay = 0.4 }: ConsultationBannerProps) {
  const t = useTranslations('home');

  return (
    <Link href="/consultation" className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] p-4 backdrop-blur-md transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.1]"
        style={{
          boxShadow: `0 4px 24px -8px ${BRAND_COLORS.primary}15`,
        }}
      >
        {/* 호버 시 금색 글로우 효과 */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(ellipse at 0% 50%, ${BRAND_COLORS.primary}20 0%, transparent 60%)`,
          }}
        />

        {/* 컨텐츠 */}
        <div className="relative flex items-center gap-4">
          {/* 아이콘 */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${BRAND_COLORS.primary}15`,
              boxShadow: `0 0 20px ${BRAND_COLORS.primary}20`,
            }}
          >
            {/* 아이콘 글로우 */}
            <div
              className="absolute h-12 w-12 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            />
            <MessageCircle
              className="relative h-6 w-6 text-white/90 transition-colors duration-300 group-hover:text-white"
              strokeWidth={1.5}
            />
          </div>

          {/* 텍스트 */}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white/90 transition-colors duration-300 group-hover:text-white">
              {t('consultationBanner.title')}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 transition-colors duration-300 group-hover:text-gray-400">
              {t('consultationBanner.subtitle')}
            </p>
          </div>

          {/* 화살표 */}
          <ChevronRight
            className="h-5 w-5 shrink-0 text-gray-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#d4af37]"
            strokeWidth={2}
          />
        </div>
      </motion.div>
    </Link>
  );
}
