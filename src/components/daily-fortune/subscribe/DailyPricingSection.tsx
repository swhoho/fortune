'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Crown, X, AlertCircle, Phone, Loader2 } from 'lucide-react';
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
  onSubscribe: (phoneNumber: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

const INCLUDES_KEYS = [
  'dailyFortune',
  'credits',
  'sixAreas',
  'personalized',
  'consultation',
] as const;

/**
 * Pricing Section - 가격 정보 및 CTA 버튼
 */
export function DailyPricingSection({
  locale: _locale,
  subscriptionStatus,
  onStartTrial,
  onSubscribe,
  isLoading = false,
  error = null,
  onErrorDismiss,
}: DailyPricingSectionProps) {
  const t = useTranslations('dailyFortune.subscribe.pricing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const canStartTrial = subscriptionStatus?.canStartTrial ?? true;
  const isTrialActive = subscriptionStatus?.isTrialActive ?? false;
  const trialRemainingDays = subscriptionStatus?.trialRemainingDays ?? 0;

  /** 휴대폰 번호 포맷팅 (000-0000-0000) */
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  /** 휴대폰 번호 입력 핸들러 */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setPhoneError(null);
  };

  /** 구독 버튼 클릭 핸들러 */
  const handleSubscribeClick = () => {
    const numbers = phoneNumber.replace(/[^0-9]/g, '');
    if (numbers.length < 10 || numbers.length > 11) {
      setPhoneError(t('phoneError'));
      return;
    }
    onSubscribe(numbers);
  };

  return (
    <section className="px-6 py-8" suppressHydrationWarning>
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

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <p className="flex-1 text-sm text-red-400">{error}</p>
              {onErrorDismiss && (
                <button
                  onClick={onErrorDismiss}
                  className="flex-shrink-0 text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* CTA 버튼 */}
          {canStartTrial ? (
            <div className="space-y-3">
              <Button
                onClick={onStartTrial}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-500 py-6 text-base font-semibold text-black hover:from-amber-500 hover:to-[#d4af37]"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('cta.startTrial')}
              </Button>
              <p className="text-center text-xs text-gray-500">{t('cta.trialNotice')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 휴대폰 번호 입력 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">{t('phoneLabel')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>
                {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
                <p className="text-xs text-gray-500">{t('phoneHint')}</p>
              </div>

              <Button
                onClick={handleSubscribeClick}
                disabled={isLoading || !phoneNumber}
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-500 py-6 text-base font-semibold text-black hover:from-amber-500 hover:to-[#d4af37] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('cta.subscribe')}
              </Button>
              <p className="text-center text-xs text-gray-500">{t('cta.paymentNotice')}</p>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
