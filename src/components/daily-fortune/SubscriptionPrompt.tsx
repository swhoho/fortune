'use client';

/**
 * 비구독자용 오늘의 운세 구독 유도 카드
 * 버튼 클릭 시 /daily-fortune/subscribe 랜딩 페이지로 이동
 */
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Sparkles, Crown, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionPromptProps {
  canStartTrial?: boolean;
  onStartTrial?: () => void;
  isLoading?: boolean;
}

export function SubscriptionPrompt({
  canStartTrial = false,
  onStartTrial: _onStartTrial,
  isLoading: _isLoading = false,
}: SubscriptionPromptProps) {
  const t = useTranslations('dailyFortune');
  const router = useRouter();
  const locale = useLocale();

  /** 랜딩 페이지로 이동 */
  const handleNavigateToSubscribe = () => {
    router.push(`/${locale}/daily-fortune/subscribe`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-[#333] bg-[#1a1a1a] p-6"
    >
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-15 blur-2xl"
          style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10">
        {/* 아이콘 */}
        <div className="mb-4 flex justify-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: '#d4af3720' }}
          >
            <Calendar className="h-8 w-8 text-[#d4af37]" />
          </motion.div>
        </div>

        {/* 제목 */}
        <h3 className="mb-2 text-center text-lg font-bold text-white">{t('title')}</h3>

        {/* 설명 */}
        <p className="mb-6 text-center text-sm text-gray-400">
          {t('subscriptionPrompt.description')}
        </p>

        {/* 혜택 목록 */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Sparkles className="h-4 w-4 text-[#d4af37]" />
            <span>{t('subscriptionPrompt.benefit1')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Crown className="h-4 w-4 text-[#d4af37]" />
            <span>{t('subscriptionPrompt.benefit2')}</span>
          </div>
        </div>

        {/* 버튼 - 랜딩 페이지로 이동 */}
        <Button
          onClick={handleNavigateToSubscribe}
          className="group w-full bg-[#d4af37] text-[#0a0a0a] hover:bg-[#c9a432]"
        >
          <span className="flex items-center justify-center gap-2">
            {canStartTrial ? t('subscriptionPrompt.startTrial') : t('subscriptionPrompt.subscribe')}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>
      </div>
    </motion.div>
  );
}
