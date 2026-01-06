'use client';

/**
 * 결제 성공 페이지
 */
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

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
        결제가 완료되었습니다!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8 text-gray-300"
      >
        크레딧이 충전되었습니다.
        <br />
        이제 사주 분석을 시작할 수 있습니다.
      </motion.p>

      {/* 세션 ID 표시 (디버그용) */}
      {sessionId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 rounded-lg border border-[#333] bg-[#1a1a1a] p-4"
        >
          <p className="text-xs text-gray-400">결제 ID</p>
          <p className="truncate font-mono text-sm text-gray-300">{sessionId}</p>
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
          <Link href="/home">홈으로 이동</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full border-[#333] bg-[#1a1a1a] py-6 text-lg text-white hover:bg-[#242424]"
        >
          <Link href="/profiles">프로필 관리</Link>
        </Button>
      </motion.div>

      {/* 안내 문구 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-sm text-gray-400"
      >
        결제 관련 문의: support@mastersinsight.ai
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
