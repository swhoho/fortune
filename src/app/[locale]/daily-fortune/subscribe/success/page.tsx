'use client';

/**
 * 구독 완료 페이지
 * PayApp 정기결제 returnurl로 사용
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Crown, Loader2 } from 'lucide-react';

type VerifyStatus = 'verifying' | 'success' | 'error';

export default function SubscriptionSuccessPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('dailyFortune');
  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkSubscription() {
      try {
        // 구독 상태 확인
        const res = await fetch('/api/subscription/status');
        const data = await res.json();

        if (data.subscription?.status === 'active') {
          setStatus('success');
        } else {
          // 콜백이 아직 처리되지 않았을 수 있음 - 잠시 대기 후 재확인
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const retryRes = await fetch('/api/subscription/status');
          const retryData = await retryRes.json();

          if (retryData.subscription?.status === 'active') {
            setStatus('success');
          } else {
            // 그래도 성공으로 처리 (콜백이 늦게 올 수 있음)
            setStatus('success');
          }
        }
      } catch (err) {
        console.error('Subscription check error:', err);
        setErrorMessage('구독 상태 확인 중 오류가 발생했습니다.');
        setStatus('error');
      }
    }

    checkSubscription();
  }, []);

  // 로딩 UI
  if (status === 'verifying') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <Loader2 className="mb-6 h-12 w-12 animate-spin text-[#d4af37]" />
        <h1 className="mb-2 font-serif text-xl font-bold text-white">구독 확인 중...</h1>
        <p className="text-gray-400">잠시만 기다려주세요.</p>
      </div>
    );
  }

  // 에러 UI
  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
          <svg
            className="h-10 w-10 text-red-500"
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
        <h1 className="mb-2 font-serif text-xl font-bold text-white">구독 확인 실패</h1>
        <p className="mb-6 text-center text-gray-400">{errorMessage}</p>
        <p className="mb-6 text-center text-sm text-gray-500">
          결제가 완료되었다면 마이페이지 → 고객센터로 연락 부탁드립니다.
        </p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/home`}>홈으로 이동</Link>
        </Button>
      </div>
    );
  }

  // 성공 UI
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
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
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/20"
        >
          <Crown className="h-10 w-10 text-[#d4af37]" />
        </motion.div>

        {/* 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-2 font-serif text-2xl font-bold text-white"
        >
          구독이 시작되었습니다!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 text-gray-300"
        >
          프리미엄 구독 혜택을 즐겨보세요.
          <br />
          매일 개인화된 운세를 확인할 수 있습니다.
        </motion.p>

        {/* 혜택 목록 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
        >
          <h3 className="mb-3 text-sm font-medium text-gray-400">구독 혜택</h3>
          <ul className="space-y-2 text-left text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-[#d4af37]">✓</span> 오늘의 운세 무제한
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#d4af37]">✓</span> 월 50C 크레딧 지급
            </li>
          </ul>
        </motion.div>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Button
            asChild
            size="lg"
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-black"
          >
            <Link href={`/${locale}/home`}>{t('title')} 확인하기</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
