'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionStatus {
  isSubscribed: boolean;
  isTrialActive: boolean;
  canStartTrial: boolean;
  trialRemainingDays: number;
}

interface DailyPricingSectionProps {
  locale: string;
  subscriptionStatus: SubscriptionStatus | null;
  onStartTrial: () => void;
  onSubscribe: () => void;
  isLoading?: boolean;
}

const INCLUDES_KEYS = ['dailyFortune', 'credits', 'sixAreas', 'personalized'] as const;

/**
 * Pricing Section - 가격 정보 및 CTA 버튼
 */
export function DailyPricingSection({
  locale,
  subscriptionStatus,
  onStartTrial,
  onSubscribe,
  isLoading = false,
}: DailyPricingSectionProps) {
  const t = useTranslations('dailyFortune.subscribe.pricing');

  const canStartTrial = subscriptionStatus?.canStartTrial ?? true;
  const isTrialActive = subscriptionStatus?.isTrialActive ?? false;
  const trialRemainingDays = subscriptionStatus?.trialRemainingDays ?? 0;

  return (
    <section className="px-6 py-12" suppressHydrationWarning>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-md"
      >
        {/* 가격 카드 */}
        <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#1a1a1a] to-[#111] p-6 shadow-xl">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#d4af37]" />
              <h3 className="text-lg font-bold text-white">{t('title')}</h3>
            </div>
            {isTrialActive && (
              <span className="rounded-full bg-[#d4af37]/20 px-3 py-1 text-xs font-medium text-[#d4af37]">
                {t('cta.trialActive', { days: trialRemainingDays })}
              </span>
            )}
          </div>

          {/* 가격 */}
          <div className="mb-6 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{t('price')}</span>
            <span className="text-gray-400">{t('period')}</span>
          </div>

          {/* 포함 내용 */}
          <ul className="mb-6 space-y-3">
            {INCLUDES_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37]/20">
                  <Check className="h-3 w-3 text-[#d4af37]" />
                </div>
                <span className="text-sm text-gray-300">{t(`includes.${key}`)}</span>
              </li>
            ))}
          </ul>

          {/* CTA 버튼 */}
          {canStartTrial ? (
            <div className="space-y-3">
              <Button
                onClick={onStartTrial}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-500 py-6 text-base font-semibold text-black hover:from-amber-500 hover:to-[#d4af37]"
              >
                {isLoading ? '...' : t('cta.startTrial')}
              </Button>
              <p className="text-center text-xs text-gray-500">{t('cta.trialNotice')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={onSubscribe}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-500 py-6 text-base font-semibold text-black hover:from-amber-500 hover:to-[#d4af37]"
              >
                {isLoading ? '...' : t('cta.subscribe')}
              </Button>
              <p className="text-center text-xs text-gray-500">{t('cta.mockNotice')}</p>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
