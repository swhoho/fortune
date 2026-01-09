'use client';

/**
 * 연인 궁합 - 분석 생성 중 페이지
 * /[locale]/compatibility/romance/[id]/generating
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Heart, Check, Loader2, AlertCircle } from 'lucide-react';

import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** 파이프라인 단계 정의 */
const PIPELINE_STEPS = [
  { key: 'manseryeok_a', label: 'A 만세력 계산', progress: 5 },
  { key: 'manseryeok_b', label: 'B 만세력 계산', progress: 10 },
  { key: 'compatibility_score', label: '궁합 점수 계산', progress: 25 },
  { key: 'trait_scores', label: '연애 스타일 분석', progress: 35 },
  { key: 'relationship_type', label: '인연의 성격 분석', progress: 50 },
  { key: 'trait_interpretation', label: '연애 스타일 해석', progress: 60 },
  { key: 'conflict_analysis', label: '갈등 포인트 분석', progress: 70 },
  { key: 'marriage_fit', label: '결혼 적합도 분석', progress: 80 },
  { key: 'mutual_influence', label: '상호 영향 분석', progress: 90 },
  { key: 'saving', label: '결과 저장', progress: 97 },
  { key: 'complete', label: '분석 완료', progress: 100 },
];

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  currentStep?: string;
  stepStatuses?: Record<string, string>;
  error?: string;
  failedSteps?: string[];
}

export default function CompatibilityGeneratingPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;
  const t = useTranslations('compatibility');

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 상태 폴링
  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis/compatibility/${analysisId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || '상태 조회에 실패했습니다');
        return false;
      }

      setStatus(data);

      // 완료 시 결과 페이지로 이동
      if (data.status === 'completed') {
        setTimeout(() => {
          router.push(`/compatibility/romance/${analysisId}`);
        }, 1000);
        return false;
      }

      // 실패 시 폴링 중지
      if (data.status === 'failed') {
        setError(data.error || '분석에 실패했습니다');
        return false;
      }

      return true; // 계속 폴링
    } catch (err) {
      console.error('상태 폴링 에러:', err);
      return true; // 일시적 에러는 계속 시도
    }
  }, [analysisId, router]);

  // 폴링 시작
  useEffect(() => {
    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const startPolling = async () => {
      const shouldContinue = await pollStatus();
      if (isActive && shouldContinue) {
        intervalId = setInterval(async () => {
          const cont = await pollStatus();
          if (!cont) {
            clearInterval(intervalId);
          }
        }, 2000);
      }
    };

    startPolling();

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollStatus]);

  // 현재 단계 인덱스
  const currentStepIndex = PIPELINE_STEPS.findIndex(
    (step) => step.key === status?.currentStep
  );
  const progressPercent = status?.progressPercent ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <AppHeader title={t('generating.title', { defaultValue: '궁합 분석 중' })} showBack={false} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 메인 아이콘 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 text-center"
        >
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
          >
            {status?.status === 'completed' ? (
              <Check className="h-10 w-10" style={{ color: BRAND_COLORS.primary }} />
            ) : error ? (
              <AlertCircle className="h-10 w-10 text-red-400" />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                <Heart className="h-10 w-10" style={{ color: BRAND_COLORS.primary }} />
              </motion.div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-white">
            {status?.status === 'completed'
              ? '분석이 완료되었습니다!'
              : error
                ? '분석에 실패했습니다'
                : '두 사람의 운명을 분석하고 있습니다...'}
          </h2>
          {!error && (
            <p className="mt-2 text-gray-400">잠시만 기다려주세요 (약 30~60초)</p>
          )}
        </motion.div>

        {/* 진행률 바 */}
        {!error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">진행률</span>
              <span style={{ color: BRAND_COLORS.primary }}>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#333]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              />
            </div>
          </motion.div>
        )}

        {/* 단계 목록 */}
        {!error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
          >
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, index) => {
                const stepStatus = status?.stepStatuses?.[step.key];
                const isActive = step.key === status?.currentStep;
                const isCompleted = stepStatus === 'completed';
                const isFailed = stepStatus === 'failed';
                const isPending = !isActive && !isCompleted && !isFailed;

                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 ${
                      isPending ? 'opacity-40' : ''
                    }`}
                  >
                    {/* 상태 아이콘 */}
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isCompleted
                          ? 'bg-green-500/20'
                          : isFailed
                            ? 'bg-red-500/20'
                            : isActive
                              ? 'bg-[#d4af37]/20'
                              : 'bg-gray-700'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : isFailed ? (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                      ) : isActive ? (
                        <Loader2 className="h-3 w-3 animate-spin text-[#d4af37]" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-gray-600" />
                      )}
                    </div>

                    {/* 라벨 */}
                    <span
                      className={`text-sm ${
                        isActive
                          ? 'font-medium text-white'
                          : isCompleted
                            ? 'text-green-400'
                            : isFailed
                              ? 'text-red-400'
                              : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-900/50 bg-red-950/30 p-4"
          >
            <p className="mb-4 text-red-400">{error}</p>
            <Button
              onClick={() => router.push('/compatibility/romance/new')}
              className="w-full"
              style={{ backgroundColor: BRAND_COLORS.primary, color: '#000' }}
            >
              다시 시도하기
            </Button>
          </motion.div>
        )}

        {/* 실패한 단계 표시 */}
        {status?.failedSteps && status.failedSteps.length > 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3"
          >
            <p className="text-sm text-amber-400">
              일부 분석이 실패했습니다: {status.failedSteps.join(', ')}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
