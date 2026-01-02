'use client';

/**
 * 결제 페이지
 * PRD 섹션 5.6 참고
 * Stripe Checkout (pre-built UI) 사용
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAnalysisStore } from '@/stores/analysis';
import { FocusAreaLabel } from '@/types/saju';
import { CREDIT_PACKAGES, SERVICE_CREDITS } from '@/lib/stripe';
import type { CreditPackage } from '@/lib/stripe';

/** 분석 포함 내용 */
const analysisIncludes = [
  '평생 총운 분석',
  '성격 및 기질 분석',
  '오행 균형 분석',
  '10년 대운 흐름',
  '직업 적성 및 재물운',
  '연애/결혼운',
  '건강 및 수명',
];

export default function PaymentPage() {
  const router = useRouter();
  const { focusArea, question } = useAnalysisStore();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    CREDIT_PACKAGES.find((p) => p.popular) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필수 데이터가 없으면 리다이렉트
  useEffect(() => {
    if (!focusArea) {
      router.push('/analysis/focus');
    }
  }, [focusArea, router]);

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

  if (!focusArea) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 3/3</span>
            <span>결제</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: '66%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e]"
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* 타이틀 */}
        <h2 className="mb-2 text-center font-serif text-2xl font-bold text-[#1a1a1a] md:text-3xl">
          결제하기
        </h2>
        <p className="mb-8 text-center text-gray-500">크레딧을 충전하고 분석을 시작하세요</p>

        {/* 서비스 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 rounded-xl border border-[#d4af37]/30 bg-white p-6 shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">전체 사주 분석</h3>
            <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-sm font-medium text-[#d4af37]">
              {requiredCredits} Credits
            </span>
          </div>

          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              집중 분석 영역:{' '}
              <span className="font-medium text-[#1a1a1a]">{FocusAreaLabel[focusArea]}</span>
            </p>
            {question && (
              <p className="mt-1 text-sm text-gray-500">
                고민: {question.slice(0, 50)}
                {question.length > 50 && '...'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">포함 내용:</p>
            <div className="grid grid-cols-2 gap-1 text-sm text-gray-500">
              {analysisIncludes.map((item) => (
                <div key={item} className="flex items-center gap-1">
                  <span className="text-[#d4af37]">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 크레딧 패키지 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">크레딧 충전</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg, index) => (
              <motion.button
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative rounded-xl border-2 p-4 text-center transition-all hover:shadow-lg ${
                  selectedPackage?.id === pkg.id
                    ? 'border-[#d4af37] bg-[#d4af37]/5 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-[#d4af37]/50'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#d4af37] px-2 py-0.5 text-xs font-medium text-white">
                    인기
                  </span>
                )}
                <p className="mb-1 text-2xl font-bold text-[#1a1a1a]">
                  {pkg.credits}C
                  {pkg.bonus && (
                    <span className="ml-1 text-sm font-normal text-[#d4af37]">+{pkg.bonus}</span>
                  )}
                </p>
                <p className="text-lg font-medium text-gray-600">${(pkg.price / 100).toFixed(2)}</p>
                {pkg.bonus && (
                  <p className="mt-1 text-xs text-[#d4af37]">
                    {Math.round((pkg.bonus / (pkg.credits + pkg.bonus)) * 100)}% 보너스
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 결제 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8 rounded-xl bg-gray-50 p-4"
        >
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">현재 보유 크레딧</span>
            <span className="font-medium text-gray-700">0C</span>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">필요 크레딧</span>
            <span className="font-medium text-gray-700">{requiredCredits}C</span>
          </div>
          {selectedPackage && (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">충전 크레딧</span>
                <span className="font-medium text-[#d4af37]">
                  +{selectedPackage.credits + (selectedPackage.bonus || 0)}C
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">결제 금액</span>
                  <span className="text-xl font-bold text-[#1a1a1a]">
                    ${(selectedPackage.price / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-lg bg-red-50 p-4 text-center text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center"
        >
          <Button
            onClick={handleCheckout}
            disabled={!selectedPackage || isLoading}
            size="lg"
            className="w-full max-w-md bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? '처리 중...' : '결제하기'}
          </Button>
          <p className="mt-4 flex items-center gap-2 text-center text-sm text-gray-400">
            <span>🔒</span>
            <span>안전한 결제 (Stripe 보안)</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
