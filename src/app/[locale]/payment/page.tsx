'use client';

/**
 * Payment Page
 * PRD Section 5.6
 * Uses Stripe Checkout (pre-built UI)
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { FocusAreaLabel } from '@/types/saju';
import { CREDIT_PACKAGES, SERVICE_CREDITS } from '@/lib/stripe';
import type { CreditPackage } from '@/lib/stripe';
import {
  HeroSection,
  PillarsSection,
  SocialProofSection,
} from '@/components/payment/PaymentSections';

/** Analysis Includes */
const analysisIncludes = [
  '평생 총운 분석',
  '성격 및 기질 분석',
  '오행 균형 분석',
  '10년 대운 흐름',
  '직업 적성 및 재물운',
  '연애/결혼운',
  '건강 및 수명',
];

export default function PaymentPage({ params: { locale } }: { params: { locale: string } }) {
  const { focusArea, question } = useOnboardingStore();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    CREDIT_PACKAGES.find((p) => p.popular) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // focusArea가 없어도 크레딧 충전은 가능하도록 허용
  // 분석 플로우 외부에서 크레딧 부족 시 결제 페이지로 직접 접근 가능

  const requiredCredits = SERVICE_CREDITS.fullAnalysis;

  const handleCheckout = async () => {
    if (!selectedPackage) return;

    setIsLoading(true);
    setError(null);

    try {
      // Checkout Session 생성 API 호출
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          credits: selectedPackage.credits + (selectedPackage.bonus || 0),
          amount: selectedPackage.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '결제 세션 생성에 실패했습니다');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('결제 URL을 받지 못했습니다');
      }

      // Stripe Checkout 페이지로 리다이렉트
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : '결제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* 1. Hero Content */}
      <HeroSection currentLocale={locale} />

      {/* 2. Evidence (5 Pillars) */}
      <PillarsSection currentLocale={locale} />

      {/* 3. Social Proof */}
      <SocialProofSection currentLocale={locale} />

      {/* 4. Payment Action */}
      <div className="relative px-6 py-24">
        {/* Background Gradient for Package Section */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0a] via-[#1a1a1a]/50 to-[#0a0a0a]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 타이틀 */}
            <h2 className="mb-12 text-center font-serif text-3xl font-bold text-white">
              Start Your Analysis
            </h2>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left Column: Service Summary */}
              <div>
                {focusArea ? (
                  <div className="h-full rounded-2xl border border-[#d4af37]/30 bg-[#1a1a1a]/80 p-8 backdrop-blur-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">전체 사주 분석</h3>
                      <span className="rounded-full bg-[#d4af37]/10 px-4 py-1.5 text-sm font-bold text-[#d4af37]">
                        {requiredCredits} Credits
                      </span>
                    </div>

                    <div className="mb-8 rounded-xl bg-[#242424]/50 p-4">
                      <p className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-[#d4af37]">●</span>
                        집중 분석 영역:{' '}
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
                        Included in Report
                      </p>
                      <div className="space-y-3">
                        {analysisIncludes.map((item) => (
                          <div key={item} className="flex items-center gap-3 text-gray-300">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37]/20">
                              <span className="text-xs text-[#d4af37]">✓</span>
                            </div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Fallback if no focus area (direct access)
                  <div className="flex h-full flex-col justify-center rounded-2xl border border-white/5 bg-[#1a1a1a] p-8 text-center text-gray-400">
                    <p>Select a credit package to recharge.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Packages & Checkout */}
              <div className="flex flex-col">
                <div className="mb-8 grid grid-cols-2 gap-4">
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
                          Popular
                        </span>
                      )}
                      <div>
                        <p className="mb-1 text-2xl font-bold text-white">{pkg.credits}C</p>
                        {pkg.bonus && (
                          <p className="text-xs font-medium text-[#d4af37]">+{pkg.bonus} Bonus</p>
                        )}
                      </div>
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <p className="text-lg font-medium text-gray-300">
                          ${(pkg.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Summary & CTA */}
                <div className="mt-auto rounded-xl border border-white/5 bg-[#1a1a1a] p-6">
                  {selectedPackage ? (
                    <>
                      <div className="mb-4 flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total Credits</span>
                        <span className="text-lg font-bold text-[#d4af37]">
                          {selectedPackage.credits + (selectedPackage.bonus || 0)} C
                        </span>
                      </div>
                      <div className="mb-6 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-gray-300">Total Price</span>
                        <span className="text-2xl font-bold text-white">
                          ${(selectedPackage.price / 100).toFixed(2)}
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
                        {isLoading ? 'Processing...' : 'Secure Checkout'}
                      </Button>
                      <p className="mt-3 text-center text-xs text-gray-500">
                        Powered by Stripe • Secure Encryption
                      </p>
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      Select a package to continue
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
