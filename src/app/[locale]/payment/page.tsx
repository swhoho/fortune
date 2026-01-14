'use client';

/**
 * Payment Page
 * 결제 연동
 * - PayApp 신용카드 (실연동)
 * - 카카오페이 (준비중)
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as PortOne from '@portone/browser-sdk/v2';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuth } from '@/hooks/use-user';
import { FocusAreaLabel } from '@/types/saju';
import {
  CREDIT_PACKAGES,
  SERVICE_CREDITS,
  PORTONE_CONFIG,
  PORTONE_CHANNELS,
  PAYMENT_METHOD_META,
  generatePaymentId,
  type CreditPackage,
  type PaymentMethod,
} from '@/lib/portone';

import { Coffee, ChevronRight } from 'lucide-react';
import {
  HeroSection,
  PillarsSection,
  SocialProofSection,
} from '@/components/payment/PaymentSections';
import { ExampleCarousel } from '@/components/payment/ExampleCarousel';
import { AppHeader, Footer } from '@/components/layout';
import { isNativeApp, purchaseGoogleCredits } from '@/lib/google-billing';

/** 결제 수단 목록 (순서대로 표시) */
const PAYMENT_METHODS: PaymentMethod[] = ['payapp_card', 'kakaopay'];

/** Analysis Includes 키 목록 */
const ANALYSIS_INCLUDE_KEYS = [
  'lifetimeFortune',
  'personality',
  'fiveElements',
  'tenYearLuck',
  'careerWealth',
  'loveMarriage',
  'healthLongevity',
] as const;

export default function PaymentPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('payment');
  const { focusArea, question } = useOnboardingStore();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    CREDIT_PACKAGES.find((p) => p.popular) || null
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('payapp_card');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredCredits = SERVICE_CREDITS.fullAnalysis;

  /**
   * PayApp 결제 요청
   */
  const handlePayAppCheckout = async () => {
    if (!selectedPackage) return;

    try {
      // 서버에서 PayApp 결제 요청 생성
      const response = await fetch('/api/payment/payapp/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || t('errors.createFailed'));
      }

      // PayApp 결제 페이지로 리다이렉트
      window.location.href = result.payUrl;
    } catch (err) {
      console.error('PayApp checkout error:', err);
      throw err;
    }
  };

  /**
   * PortOne 결제 요청 (kakaopay용 - 현재 미사용)
   */
  const handlePortOneCheckout = async () => {
    if (!selectedPackage) return;

    const paymentId = generatePaymentId();
    const storeId = PORTONE_CONFIG.storeId;
    const channelKey = PORTONE_CHANNELS[selectedMethod];

    // 환경변수 검증
    if (!storeId) {
      setError(t('errors.storeIdMissing'));
      setIsLoading(false);
      console.error('PORTONE_CONFIG.storeId is empty. Check NEXT_PUBLIC_PORTONE_STORE_ID env var.');
      return;
    }

    if (!channelKey) {
      setError(t('errors.channelKeyMissing'));
      setIsLoading(false);
      console.error('Channel key is empty for method:', selectedMethod);
      return;
    }

    // 구매자 정보 (KG이니시스 V2 필수)
    const customerEmail = user?.email || '';
    const customerName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Customer';

    // PortOne SDK 결제 요청
    const response = await PortOne.requestPayment({
      storeId,
      channelKey,
      paymentId,
      orderName: `${selectedPackage.credits}C Credits`,
      totalAmount: selectedPackage.price,
      currency: 'CURRENCY_KRW',
      payMethod: selectedMethod === 'kakaopay' ? 'EASY_PAY' : 'CARD',
      customer: {
        email: customerEmail,
        fullName: customerName,
      },
      redirectUrl: `${window.location.origin}/${locale}/payment/success?paymentId=${paymentId}&packageId=${selectedPackage.id}`,
    });

    // 결제 오류 확인
    if (response?.code) {
      throw new Error(response.message || t('errors.cancelled'));
    }

    // 결제 성공 - 서버에서 검증
    const verifyResponse = await fetch('/api/payment/portone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId,
        packageId: selectedPackage.id,
        expectedAmount: selectedPackage.price,
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.success) {
      throw new Error(verifyResult.error?.message || t('errors.verifyFailed'));
    }

    // 성공 페이지로 이동
    router.push(
      `/${locale}/payment/success?paymentId=${paymentId}&credits=${verifyResult.credits}`
    );
  };

  /**
   * 결제 요청 (플랫폼/수단별 분기)
   * - 앱: Google Play IAP
   * - 웹: PayApp / PortOne
   */
  const handleCheckout = async () => {
    if (!selectedPackage) return;

    setIsLoading(true);
    setError(null);

    try {
      // 로그인 확인
      if (!user?.email || !user?.id) {
        setError(t('errors.loginRequired'));
        setIsLoading(false);
        return;
      }

      // 앱 환경: Google Play IAP
      if (isNativeApp()) {
        const result = await purchaseGoogleCredits(selectedPackage, user.id);
        if (result.success) {
          router.push(`/${locale}/payment/success?credits=${selectedPackage.credits + (selectedPackage.bonus || 0)}`);
        } else {
          setError(result.error || t('errors.generic'));
        }
        return;
      }

      // 웹 환경: PayApp / PortOne
      // PayApp 결제 (신용카드)
      if (selectedMethod === 'payapp_card') {
        await handlePayAppCheckout();
        return;
      }

      // PortOne 결제 (카카오페이 - 현재 disabled)
      await handlePortOneCheckout();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  // 결제수단 라벨 가져오기
  const getMethodLabel = (method: PaymentMethod) => t(`methods.${method}`);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* 헤더 */}
      <AppHeader title={t('header.title')} />

      {/* 1. Hero Content */}
      <HeroSection currentLocale={locale} />

      {/* 2. Evidence (5 Pillars) */}
      <PillarsSection currentLocale={locale} />

      {/* 3. Social Proof */}
      <SocialProofSection currentLocale={locale} />

      {/* 4. Payment Action */}
      <div className="relative px-6 py-12">
        {/* Background Gradient for Package Section */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0a] via-[#1a1a1a]/50 to-[#0a0a0a]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 타이틀 */}
            <h2 className="mb-8 text-center font-serif text-3xl font-bold text-white">
              {t('startAnalysis')}
            </h2>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left Column: Service Summary */}
              <div>
                {focusArea ? (
                  <div className="h-full rounded-2xl border border-[#d4af37]/30 bg-[#1a1a1a]/80 p-8 backdrop-blur-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">{t('fullAnalysis')}</h3>
                      <span className="rounded-full bg-[#d4af37]/10 px-4 py-1.5 text-sm font-bold text-[#d4af37]">
                        {requiredCredits} Credits
                      </span>
                    </div>

                    <div className="mb-8 rounded-xl bg-[#242424]/50 p-4">
                      <p className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-[#d4af37]">●</span>
                        {t('focusAreaLabel')}:{' '}
                        <span className="font-semibold text-white">
                          {FocusAreaLabel[focusArea]}
                        </span>
                      </p>
                      {question && (
                        <p className="mt-3 border-t border-white/5 pt-3 text-sm italic text-gray-400">
                          &quot;{question.slice(0, 80)}
                          {question.length > 80 && '...'}&quot;
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                        {t('includedInReport')}
                      </p>
                      <div className="space-y-3">
                        {ANALYSIS_INCLUDE_KEYS.map((key) => (
                          <div key={key} className="flex items-center gap-3 text-gray-300">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37]/20">
                              <span className="text-xs text-[#d4af37]">✓</span>
                            </div>
                            <span>{t(`analysisIncludes.${key}`)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 예시 리포트 캐러셀 (focusArea 없을 때)
                  <ExampleCarousel />
                )}
              </div>

              {/* Right Column: Packages & Checkout */}
              <div className="flex flex-col">
                {/* 크레딧 패키지 선택 */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <motion.button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex flex-col justify-between rounded-xl border-2 p-5 text-left transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                          : 'border-[#333] bg-[#1a1a1a] hover:border-[#d4af37]/50'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-3 right-4 rounded-full bg-[#d4af37] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                          {t('labels.popular')}
                        </span>
                      )}
                      <div>
                        <p className="mb-1 text-2xl font-bold text-white">{pkg.credits}C</p>
                        {pkg.bonus && (
                          <p className="text-xs font-medium text-[#d4af37]">
                            {t('labels.bonus', { amount: pkg.bonus })}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <p className="text-lg font-medium text-gray-300">
                          ₩{pkg.price.toLocaleString()}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* 구독 프로모션 배너 */}
                <motion.div
                  onClick={() => router.push(`/${locale}/daily-fortune/subscribe`)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-[#d4af37]/40 bg-gradient-to-r from-[#1a1a1a] to-[#242424] p-4 transition-all hover:border-[#d4af37] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  {/* 아이콘 */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10">
                    <Coffee className="h-5 w-5 text-[#d4af37]" />
                  </div>

                  {/* 텍스트 */}
                  <div className="mx-4 flex-1">
                    <p className="text-sm font-medium text-white">
                      {t.rich('subscription.promo', {
                        daily: () => (
                          <span className="text-[#d4af37]">{t('subscription.daily')}</span>
                        ),
                        credits: () => (
                          <span className="text-[#d4af37]">{t('subscription.credits')}</span>
                        ),
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{t('subscription.subtext')}</p>
                  </div>

                  {/* 가격 + 화살표 */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm font-bold text-[#d4af37]">
                      ₩2,900/월
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </motion.div>

                {/* 결제 수단 선택 (웹 환경에서만 표시) */}
                {!isNativeApp() && (
                  <div className="mb-6">
                    <p className="mb-3 text-sm font-medium text-gray-400">{t('checkout.method')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const meta = PAYMENT_METHOD_META[method];
                        const isDisabled = meta.disabled;
                        return (
                          <button
                            key={method}
                            onClick={() => !isDisabled && setSelectedMethod(method)}
                            disabled={isDisabled}
                            className={`relative flex flex-col items-center justify-center gap-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ${
                              isDisabled
                                ? 'cursor-not-allowed border-[#222] bg-[#111] text-gray-600'
                                : selectedMethod === method
                                  ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                                  : 'border-[#333] bg-[#1a1a1a] text-gray-400 hover:border-[#444]'
                            }`}
                          >
                            <span className="text-lg">{meta.icon}</span>
                            <span className="text-xs">{getMethodLabel(method)}</span>
                            {isDisabled && (
                              <span className="absolute -top-2 right-1 rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                                {t('checkout.preparing')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary & CTA */}
                <div className="mt-auto rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
                  {selectedPackage ? (
                    <>
                      <div className="mb-4 flex items-center justify-between text-sm">
                        <span className="text-gray-400">{t('summary.totalCredits')}</span>
                        <span className="text-lg font-bold text-[#d4af37]">
                          {selectedPackage.credits + (selectedPackage.bonus || 0)} C
                        </span>
                      </div>
                      <div className="mb-6 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-gray-300">{t('summary.totalPrice')}</span>
                        <span className="text-2xl font-bold text-white">
                          ₩{selectedPackage.price.toLocaleString()}
                        </span>
                      </div>

                      {error && (
                        <div className="mb-4 rounded-lg bg-red-900/20 p-3 text-center text-sm text-red-400">
                          {error}
                        </div>
                      )}

                      <Button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        size="lg"
                        className="w-full bg-gradient-to-r from-[#d4af37] to-[#b08d2b] py-6 text-lg font-bold text-black hover:from-[#e5bd43] hover:to-[#c19a2e] disabled:opacity-50"
                      >
                        {isLoading
                          ? t('checkout.processing')
                          : isNativeApp()
                            ? t('checkout.googlePlay')
                            : t('checkout.payWith', { method: getMethodLabel(selectedMethod) })}
                      </Button>
                      <p className="mt-3 text-center text-xs text-gray-500">
                        {isNativeApp()
                          ? t('security.googlePlay')
                          : selectedMethod === 'payapp_card'
                            ? t('security.payapp')
                            : t('security.portone')}
                      </p>
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      {t('summary.selectPackage')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
