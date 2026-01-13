'use client';

/**
 * 결제 성공 페이지
 * - PortOne 결제: redirectUrl로 이동 시 자동으로 결제 검증 수행
 * - PayApp 결제: 콜백 완료 대기 후 성공 표시
 * - 이미 처리된 결제는 중복 처리하지 않음
 */
import { Suspense, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { CREDIT_PACKAGES } from '@/lib/portone';
import { trackPurchase } from '@/lib/analytics';

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'already_processed' | 'error';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('paymentSuccess');
  const paymentId = searchParams.get('paymentId');
  const packageId = searchParams.get('packageId');
  const creditsParam = searchParams.get('credits');

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [credits, setCredits] = useState<string | null>(creditsParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);
  const trackedRef = useRef(false);

  // GA4 purchase 이벤트 (결제 성공 시 1회만)
  useEffect(() => {
    if (verifyStatus === 'success' && !trackedRef.current && paymentId) {
      trackedRef.current = true;
      const selectedPackage = packageId ? CREDIT_PACKAGES.find((p) => p.id === packageId) : null;
      trackPurchase(
        paymentId,
        selectedPackage?.price || 0,
        'KRW',
        selectedPackage
          ? [{ item_id: selectedPackage.id, item_name: `${selectedPackage.credits}C Credits` }]
          : undefined
      );
    }
  }, [verifyStatus, paymentId, packageId]);

  // PayApp 결제 상태 확인 (폴링)
  const checkPayAppStatus = async (pid: string, pkgId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/payment/payapp/status?paymentId=${pid}&packageId=${pkgId}`
      );
      const result = await response.json();

      if (result.success && result.status === 'completed') {
        setCredits(String(result.credits));
        setVerifyStatus('success');
        return true;
      }
      return false;
    } catch (err) {
      console.error('PayApp status check error:', err);
      return false;
    }
  };

  // 결제 검증 (redirectUrl로 이동한 경우)
  useEffect(() => {
    async function verifyPayment() {
      // 이미 credits이 URL에 있으면 이미 검증된 것 (클라이언트에서 처리된 경우)
      if (creditsParam) {
        setVerifyStatus('success');
        return;
      }

      // paymentId와 packageId가 없으면 검증 불가
      if (!paymentId || !packageId) {
        setVerifyStatus('error');
        setErrorMessage(t('error.noInfo'));
        return;
      }

      // 패키지 정보 확인
      const selectedPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!selectedPackage) {
        setVerifyStatus('error');
        setErrorMessage(t('error.invalidPackage'));
        return;
      }

      setVerifyStatus('verifying');

      // PayApp 결제인 경우 (paymentId가 'payapp-'로 시작)
      if (paymentId.startsWith('payapp-')) {
        // 즉시 한 번 확인
        const isCompleted = await checkPayAppStatus(paymentId, packageId);
        if (isCompleted) return;

        // 2초 간격으로 최대 15회 폴링 (30초)
        pollingRef.current = setInterval(async () => {
          pollingCountRef.current += 1;

          const completed = await checkPayAppStatus(paymentId, packageId);

          if (completed || pollingCountRef.current >= 15) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            if (!completed && pollingCountRef.current >= 15) {
              // 타임아웃 - 그래도 성공으로 처리 (콜백이 늦게 올 수 있음)
              setCredits(String(selectedPackage.credits + (selectedPackage.bonus || 0)));
              setVerifyStatus('success');
            }
          }
        }, 2000);

        return;
      }

      // PortOne 결제 검증
      try {
        const response = await fetch('/api/payment/portone/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            packageId,
            expectedAmount: selectedPackage.price,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setVerifyStatus('success');
          setCredits(String(result.credits));
        } else if (result.error?.code === 'PAYMENT_ALREADY_PROCESSED') {
          // 이미 처리된 결제 (새로고침 등)
          setVerifyStatus('already_processed');
          setCredits(String(selectedPackage.credits + (selectedPackage.bonus || 0)));
        } else {
          setVerifyStatus('error');
          setErrorMessage(result.error?.message || t('error.verifyFailed'));
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setVerifyStatus('error');
        setErrorMessage(t('error.verifyError'));
      }
    }

    verifyPayment();

    // 클린업: 폴링 정리
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [paymentId, packageId, creditsParam, t]);

  // 검증 중 로딩 UI
  if (verifyStatus === 'verifying') {
    return (
      <div className="w-full max-w-md text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#d4af37] border-t-transparent"
        />
        <h1 className="mb-2 font-serif text-2xl font-bold text-white">{t('verifying.title')}</h1>
        <p className="text-gray-400">{t('verifying.subtitle')}</p>
      </div>
    );
  }

  // 에러 UI
  if (verifyStatus === 'error') {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20">
          <svg
            className="h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="mb-2 font-serif text-2xl font-bold text-white">{t('error.title')}</h1>
        <p className="mb-4 text-gray-300">{errorMessage}</p>
        {paymentId && (
          <div className="mb-6 rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
            <p className="text-xs text-gray-400">{t('error.paymentIdLabel')}</p>
            <p className="truncate font-mono text-sm text-gray-300">{paymentId}</p>
          </div>
        )}
        <p className="text-sm text-gray-400">{t('error.contactSupport')}</p>
        <Button asChild size="lg" className="mt-6 w-full" variant="outline">
          <Link href={`/${locale}/home`}>{t('cta.home')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md text-center"
    >
      {/* 성공 아이콘 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20"
      >
        <svg
          className="h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>

      {/* 타이틀 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-2 font-serif text-2xl font-bold text-white md:text-3xl"
      >
        {t('success.title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8 text-gray-300"
      >
        {credits ? t('success.charged', { credits }) : t('success.chargedGeneric')}
        <br />
        {t('success.canStart')}
      </motion.p>

      {/* 결제 ID 표시 */}
      {paymentId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 rounded-lg border border-[#333] bg-[#1a1a1a] p-4"
        >
          <p className="text-xs text-gray-400">{t('paymentId')}</p>
          <p className="truncate font-mono text-sm text-gray-300">{paymentId}</p>
        </motion.div>
      )}

      {/* CTA 버튼들 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <Button
          asChild
          size="lg"
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          <Link href={`/${locale}/home`}>{t('cta.home')}</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full border-[#333] bg-[#1a1a1a] py-6 text-lg text-white hover:bg-[#242424]"
        >
          <Link href={`/${locale}/profiles`}>{t('cta.profiles')}</Link>
        </Button>
      </motion.div>

      {/* 안내 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-sm text-gray-400"
      >
        {t('notice')}
      </motion.p>
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-[#333]" />
      <div className="mx-auto mb-2 h-8 w-48 animate-pulse rounded bg-[#333]" />
      <div className="mx-auto h-4 w-64 animate-pulse rounded bg-[#333]" />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <Suspense fallback={<LoadingFallback />}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
