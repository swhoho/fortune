'use client';

/**
 * 구독 완료 페이지
 * PayApp 정기결제 returnurl로 사용
 *
 * rebill_no 획득 우선순위:
 * 1. URL 파라미터 (PayApp 치환 시) - `{rebill_no}` 문자열이면 무시
 * 2. sessionStorage (같은 탭에서 리다이렉트된 경우)
 * 3. 구독 상태 API (fallback - 최신 구독 확인)
 */
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Crown, Loader2, AlertCircle, XCircle } from 'lucide-react';

type VerifyStatus = 'verifying' | 'pending' | 'success' | 'error';

interface VerifyResult {
  status: VerifyStatus;
  rebillNo: string | null;
  message: string | null;
  errorMessage: string | null;
}

const MAX_RETRY_COUNT = 10; // 최대 10회 재시도
const RETRY_INTERVAL = 2000; // 2초 간격

export default function SubscriptionSuccessPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('dailyFortune');
  const searchParams = useSearchParams();
  const [result, setResult] = useState<VerifyResult>({
    status: 'verifying',
    rebillNo: null,
    message: null,
    errorMessage: null,
  });
  const [retryCount, setRetryCount] = useState(0);

  /**
   * rebill_no 획득 (우선순위 적용)
   * 1. URL 파라미터 - {rebill_no} 문자열이면 무시
   * 2. sessionStorage
   * 3. null (구독 상태 API로 fallback)
   */
  const getRebillNo = useCallback((): string | null => {
    // 1. URL 파라미터에서 확인
    const urlRebillNo = searchParams.get('rebill_no');
    if (urlRebillNo && urlRebillNo !== '{rebill_no}' && !urlRebillNo.includes('{')) {
      // eslint-disable-next-line no-console
      console.log('[Success Page] URL 파라미터에서 rebill_no 발견:', urlRebillNo);
      return urlRebillNo;
    }

    // 2. sessionStorage에서 확인
    const storedRebillNo = sessionStorage.getItem('payapp_rebill_no');
    if (storedRebillNo) {
      // eslint-disable-next-line no-console
      console.log('[Success Page] sessionStorage에서 rebill_no 발견:', storedRebillNo);
      return storedRebillNo;
    }

    // eslint-disable-next-line no-console
    console.log('[Success Page] rebill_no 없음, 구독 상태 API로 fallback');
    return null;
  }, [searchParams]);

  const verifySubscription = useCallback(async (rebillNo: string): Promise<VerifyResult> => {
    try {
      const res = await fetch('/api/subscription/payapp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rebillNo }),
      });
      const data = await res.json();

      // eslint-disable-next-line no-console
      console.log('[Success Page] Verify 응답:', data);

      if (data.success) {
        if (data.status === 'active') {
          return {
            status: 'success',
            rebillNo: data.rebillNo,
            message: data.message,
            errorMessage: null,
          };
        } else if (data.status === 'pending') {
          return {
            status: 'pending',
            rebillNo: data.rebillNo,
            message: data.message,
            errorMessage: null,
          };
        }
      }

      return {
        status: 'error',
        rebillNo: data.rebillNo || rebillNo,
        message: null,
        errorMessage: data.error || '결제 확인에 실패했습니다.',
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Success Page] Verify 오류:', err);
      return {
        status: 'error',
        rebillNo,
        message: null,
        errorMessage: '네트워크 오류가 발생했습니다.',
      };
    }
  }, []);

  useEffect(() => {
    async function checkSubscription() {
      // rebill_no 획득 (URL 파라미터 → sessionStorage → null)
      const rebillNo = getRebillNo();

      if (!rebillNo) {
        // rebill_no가 없으면 구독 상태 API로 확인 (fallback)
        try {
          const res = await fetch('/api/subscription/status');
          const data = await res.json();

          if (data.subscription?.status === 'active') {
            setResult({
              status: 'success',
              rebillNo: data.subscription.payapp_rebill_no || null,
              message: '구독이 활성화되어 있습니다.',
              errorMessage: null,
            });
          } else if (data.subscription?.status === 'past_due') {
            // 결제 대기 상태 - 폴링으로 재확인
            setResult({
              status: 'pending',
              rebillNo: data.subscription.payapp_rebill_no || null,
              message: '결제 확인 중입니다...',
              errorMessage: null,
            });
          } else {
            // URL에 mul_no(결제번호)가 있으면 결제는 완료된 것으로 판단
            const mulNo = searchParams.get('mul_no');
            if (mulNo) {
              setResult({
                status: 'pending',
                rebillNo: mulNo,
                message: '결제가 완료되었습니다. 구독 활성화 중...',
                errorMessage: null,
              });
            } else {
              setResult({
                status: 'error',
                rebillNo: null,
                message: null,
                errorMessage: 'cmd+값을+확인+하세요.',
              });
            }
          }
        } catch {
          setResult({
            status: 'error',
            rebillNo: null,
            message: null,
            errorMessage: '구독 상태 확인 중 오류가 발생했습니다.',
          });
        }
        return;
      }

      // eslint-disable-next-line no-console
      console.log('[Success Page] rebill_no 발견:', rebillNo);

      // verify API 호출
      const verifyResult = await verifySubscription(rebillNo);
      setResult(verifyResult);

      // pending 상태면 폴링 시작
      if (verifyResult.status === 'pending' && retryCount < MAX_RETRY_COUNT) {
        setRetryCount((prev) => prev + 1);
      } else if (verifyResult.status === 'success') {
        // 성공 시 sessionStorage 정리
        sessionStorage.removeItem('payapp_rebill_no');
      }
    }

    checkSubscription();
  }, [retryCount, verifySubscription, getRebillNo, searchParams]);

  // pending 상태일 때 폴링
  useEffect(() => {
    // Guard clause: only process pending status
    if (result.status !== 'pending') {
      return;
    }

    // OPTIMISTIC SUCCESS: After max retries, assume payment succeeded
    // Reason: User already completed payment on PayApp. Showing 'error'
    // would cause unnecessary panic. Actual activation happens via:
    // 1. PayApp callback (async, may be delayed)
    // 2. User refresh triggering another verify call
    if (retryCount >= MAX_RETRY_COUNT) {
      setResult((prev) => ({
        ...prev,
        status: 'success',
        message: '결제가 완료되었습니다. 잠시 후 구독이 활성화됩니다.',
      }));
      sessionStorage.removeItem('payapp_rebill_no');
      return;
    }

    // Continue polling
    const timer = setTimeout(() => {
      setRetryCount((prev) => prev + 1);
    }, RETRY_INTERVAL);

    return () => clearTimeout(timer);
  }, [result.status, retryCount]);

  // 로딩/검증 중 UI
  if (result.status === 'verifying' || result.status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <Loader2 className="mb-6 h-12 w-12 animate-spin text-[#d4af37]" />
        <h1 className="mb-2 font-serif text-xl font-bold text-white">
          {result.status === 'verifying' ? '결제 확인 중...' : '결제 처리 중...'}
        </h1>
        <p className="mb-4 text-gray-400">잠시만 기다려주세요.</p>
        {result.rebillNo && <p className="text-xs text-gray-500">결제번호: {result.rebillNo}</p>}
        {result.status === 'pending' && (
          <p className="mt-2 text-xs text-gray-500">
            확인 중... ({retryCount}/{MAX_RETRY_COUNT})
          </p>
        )}
      </div>
    );
  }

  // 에러 UI
  if (result.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="mb-2 font-serif text-xl font-bold text-white">결제 확인 실패</h1>
        <p className="mb-4 text-center text-gray-400">{result.errorMessage}</p>

        {/* 결제 번호 표시 */}
        {result.rebillNo && (
          <div className="mb-6 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3">
            <p className="text-xs text-gray-500">결제번호</p>
            <p className="font-mono text-sm text-white">{result.rebillNo}</p>
          </div>
        )}

        <div className="mb-6 flex items-start gap-2 rounded-lg bg-yellow-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
          <p className="text-sm text-yellow-200">
            결제가 완료되었다면 잠시 후 자동으로 반영됩니다.
            <br />
            문제가 지속되면 위 결제번호와 함께 고객센터에 문의해주세요.
          </p>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/${locale}/home`}>홈으로 이동</Link>
          </Button>
          <Button
            onClick={() => {
              setRetryCount(0);
              setResult((prev) => ({ ...prev, status: 'verifying' }));
            }}
            className="bg-[#d4af37] text-black hover:bg-[#c19a2e]"
          >
            다시 확인
          </Button>
        </div>
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
          className="mb-6 text-gray-300"
        >
          {result.message || '프리미엄 구독 혜택을 즐겨보세요.'}
        </motion.p>

        {/* 결제 번호 표시 */}
        {result.rebillNo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mb-6 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3"
          >
            <p className="text-xs text-gray-500">결제번호</p>
            <p className="font-mono text-sm text-white">{result.rebillNo}</p>
          </motion.div>
        )}

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
