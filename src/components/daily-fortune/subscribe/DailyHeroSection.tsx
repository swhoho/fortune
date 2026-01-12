'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sun, Calendar } from 'lucide-react';

interface DailyHeroSectionProps {
  locale: string;
}

/**
 * Hero Section - 오늘의 운세 구독 랜딩 페이지 스토리텔링
 */
export function DailyHeroSection({ locale: _locale }: DailyHeroSectionProps) {
  const t = useTranslations('dailyFortune.subscribe.hero');

  return (
    <section className="relative px-6 py-8 text-center" suppressHydrationWarning>
      {/* 배경 장식 */}
      <div className="absolute left-1/2 top-0 block h-64 w-[200%] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        {/* 아이콘 */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="rounded-full bg-gradient-to-br from-[#d4af37]/20 to-amber-500/10 p-4"
          >
            <Sun className="h-8 w-8 text-[#d4af37]" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="rounded-full bg-gradient-to-br from-amber-500/10 to-[#d4af37]/20 p-4"
          >
            <Calendar className="h-8 w-8 text-amber-400" />
          </motion.div>
        </div>

        {/* 헤드라인 */}
        <h1 className="mb-6 whitespace-pre-wrap break-keep font-serif text-2xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {t('headline')}
        </h1>

        {/* 서브헤드라인 */}
        <p className="mx-auto max-w-2xl whitespace-pre-wrap break-keep text-lg text-gray-400 md:text-xl">
          {t('subHeadline')}
        </p>
      </motion.div>
    </section>
  );
}
