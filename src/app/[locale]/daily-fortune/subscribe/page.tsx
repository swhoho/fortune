'use client';

/**
 * Daily Fortune Subscribe Page
 * 오늘의 운세 구독/무료체험 랜딩 페이지
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppHeader, Footer } from '@/components/layout';
import { useAuth } from '@/hooks/use-user';
import {
  DailyHeroSection,
  DailyBenefitsSection,
  DailySocialProofSection,
  DailyPricingSection,
} from '@/components/daily-fortune/subscribe';
import { Loader2 } from 'lucide-react';

interface SubscriptionStatus {
  isSubscribed: boolean;
  isTrialActive: boolean;
  canStartTrial: boolean;
  trialRemainingDays: number;
}

export default function DailyFortuneSubscribePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('dailyFortune');
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hydration 방지: 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  /** 구독/무료체험 상태 조회 */
  useEffect(() => {
    async function fetchStatus() {
      if (isAuthLoading) return;

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/daily-fortune');
        const data = await res.json();

        if (data.subscription) {
          setSubscriptionStatus({
            isSubscribed: data.subscription.isSubscribed,
            isTrialActive: data.subscription.isTrialActive,
            canStartTrial: data.canStartTrial ?? (!data.subscription.isSubscribed && !data.subscription.isTrialActive),
            trialRemainingDays: data.subscription.trialRemainingDays ?? 0,
          });
        } else {
          // 기본값: 무료체험 가능
          setSubscriptionStatus({
            isSubscribed: false,
            isTrialActive: false,
            canStartTrial: true,
            trialRemainingDays: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        // 에러 시 기본값
        setSubscriptionStatus({
          isSubscribed: false,
          isTrialActive: false,
          canStartTrial: true,
          trialRemainingDays: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [user, isAuthLoading]);

  /** 무료체험 시작 */
  const handleStartTrial = async () => {
    if (!user) {
      router.push(`/${locale}/auth/signin?redirect=/daily-fortune/subscribe`);
      return;
    }

    setIsProcessing(true);
    try {
      // POST /api/daily-fortune 호출 시 자동으로 무료체험 시작
      const res = await fetch('/api/daily-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        router.push(`/${locale}/home`);
      } else {
        const data = await res.json();
        console.error('Failed to start trial:', data);
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /** 구독 시작 (Mock) */
  const handleSubscribe = async () => {
    if (!user) {
      router.push(`/${locale}/auth/signin?redirect=/daily-fortune/subscribe`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/subscription/start', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        router.push(`/${locale}/home`);
      } else {
        console.error('Failed to subscribe:', data);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 마운트 전 또는 로딩 중일 때 로딩 UI
  if (!mounted || isLoading || isAuthLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
        <AppHeader title={t('title')} showBack />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <AppHeader title={t('title')} showBack />

      <main className="flex-1">
        <DailyHeroSection locale={locale} />
        <DailyBenefitsSection locale={locale} />
        <DailySocialProofSection locale={locale} />
        <DailyPricingSection
          locale={locale}
          subscriptionStatus={subscriptionStatus}
          onStartTrial={handleStartTrial}
          onSubscribe={handleSubscribe}
          isLoading={isProcessing}
        />
      </main>

      <Footer />
    </div>
  );
}
