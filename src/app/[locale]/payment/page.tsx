'use client';

/**
 * Payment Page
 * PortOne V2 결제 연동
 * - KG이니시스 (신용카드)
 * - 카카오페이 (간편결제)
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  PAYMENT_METHOD_LABELS,
  generatePaymentId,
  type CreditPackage,
  type PaymentMethod,
} from '@/lib/portone';
import {
  HeroSection,
  PillarsSection,
  SocialProofSection,
} from '@/components/payment/PaymentSections';
import { Footer } from '@/components/layout/Footer';

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
  const router = useRouter();
  const { user } = useAuth();
  const { focusArea, question } = useOnboardingStore();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    CREDIT_PACKAGES.find((p) => p.popular) || null
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('kakaopay');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredCredits = SERVICE_CREDITS.fullAnalysis;

  /**
   * PortOne 결제 요청
   */
  const handleCheckout = async () => {
    if (!selectedPackage) return;

    setIsLoading(true);
    setError(null);

    const paymentId = generatePaymentId();
    const storeId = PORTONE_CONFIG.storeId;
    const channelKey = PORTONE_CHANNELS[selectedMethod];

    // 환경변수 검증
    if (!storeId) {
      setError('결제 설정 오류: Store ID가 설정되지 않았습니다.');
      setIsLoading(false);
      console.error('PORTONE_CONFIG.storeId is empty. Check NEXT_PUBLIC_PORTONE_STORE_ID env var.');
      return;
    }

    if (!channelKey) {
      setError('결제 설정 오류: Channel Key가 설정되지 않았습니다.');
      setIsLoading(false);
      console.error('Channel key is empty for method:', selectedMethod);
      return;
    }

    try {
      // 구매자 정보 (KG이니시스 V2 필수)
      const customerEmail = user?.email || '';
      const customerName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '구매자';

      if (!customerEmail) {
        setError('로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }

      // 신용카드 결제 시 휴대폰 번호 필수
      if (selectedMethod === 'card' && !phoneNumber.trim()) {
        setError('신용카드 결제 시 휴대폰 번호를 입력해주세요.');
        setIsLoading(false);
        return;
      }

      // 전화번호 형식 정리 (숫자만)
      const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

      // PortOne SDK 결제 요청
      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: `${selectedPackage.credits}C 크레딧`,
        totalAmount: selectedPackage.price,
        currency: 'CURRENCY_KRW',
        payMethod: selectedMethod === 'kakaopay' ? 'EASY_PAY' : 'CARD',
        customer: {
          email: customerEmail,
          fullName: customerName,
          phoneNumber: formattedPhone || undefined,
        },
        redirectUrl: `${window.location.origin}/${locale}/payment/success?paymentId=${paymentId}&packageId=${selectedPackage.id}`,
      });

      // 결제 오류 확인
      if (response?.code) {
        throw new Error(response.message || '결제가 취소되었습니다');
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
        throw new Error(verifyResult.error?.message || '결제 검증에 실패했습니다');
      }

      // 성공 페이지로 이동
      router.push(
        `/${locale}/payment/success?paymentId=${paymentId}&credits=${verifyResult.credits}`
      );
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
                          ₩{pkg.price.toLocaleString()}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* 결제 수단 선택 */}
                <div className="mb-6">
                  <p className="mb-3 text-sm font-medium text-gray-400">결제 수단</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(PORTONE_CHANNELS) as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                          selectedMethod === method
                            ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                            : 'border-[#333] bg-[#1a1a1a] text-gray-400 hover:border-[#444]'
                        }`}
                      >
                        <span>{PAYMENT_METHOD_LABELS[method].icon}</span>
                        <span>{PAYMENT_METHOD_LABELS[method].ko}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 신용카드 결제 시 휴대폰 번호 입력 */}
                {selectedMethod === 'card' && (
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                      휴대폰 번호 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01012345678"
                      className="w-full rounded-lg border-2 border-[#333] bg-[#1a1a1a] px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">KG이니시스 결제 시 필수 입력</p>
                  </div>
                )}

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
                          ? '결제 진행 중...'
                          : `${PAYMENT_METHOD_LABELS[selectedMethod].ko}로 결제`}
                      </Button>
                      <p className="mt-3 text-center text-xs text-gray-500">
                        PortOne 안전결제 • {selectedMethod === 'card' ? 'KG이니시스' : '카카오페이'}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
