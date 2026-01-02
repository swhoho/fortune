'use client';

/**
 * 온보딩 Step 1: 스토리텔링 (신뢰 구축)
 */
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function OnboardingStep1() {
  const t = useTranslations('onboarding.step1');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 1/3</span>
            <span>{t('title')}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '33%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e]"
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex max-w-2xl flex-col items-center text-center">
        {/* 비디오/애니메이션 영역 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] shadow-xl md:h-64"
        >
          {/* 먹이 번지는 효과 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1] }}
            transition={{ duration: 3, times: [0, 0.3, 0.6, 1] }}
            className="relative"
          >
            <span className="font-serif text-6xl text-[#d4af37] md:text-8xl">命理</span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 2, delay: 0.5 }}
              className="absolute -inset-4 -z-10 rounded-full bg-[#d4af37] opacity-20 blur-2xl"
            />
          </motion.div>
        </motion.div>

        {/* 헤드라인 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-4 whitespace-pre-line font-serif text-2xl font-bold leading-relaxed text-[#1a1a1a] md:text-3xl"
        >
          {t('headline')}
        </motion.h2>

        {/* 서브 카피 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8 max-w-lg text-gray-600"
        >
          &ldquo;{t('quote')}&rdquo;
        </motion.p>

        {/* 전문가 인용 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-8 flex items-center gap-3 text-sm text-gray-500"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e]" />
          <div className="text-left">
            <p className="font-medium text-[#1a1a1a]">{t('expertName')}</p>
            <p>{t('expertTitle')}</p>
          </div>
        </motion.div>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-10 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <Link href="/onboarding/step2">{t('cta')}</Link>
          </Button>
        </motion.div>

        {/* 신뢰 지표 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-12 grid grid-cols-3 gap-8 text-center"
        >
          <div>
            <p className="font-serif text-2xl font-bold text-[#d4af37]">{t('stats.analyses')}</p>
            <p className="text-sm text-gray-500">{t('stats.analysesLabel')}</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-[#d4af37]">{t('stats.rating')}</p>
            <p className="text-sm text-gray-500">{t('stats.ratingLabel')}</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-[#d4af37]">{t('stats.classics')}</p>
            <p className="text-sm text-gray-500">{t('stats.classicsLabel')}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
