'use client';

/**
 * 연인 궁합 - 분석 생성 중 페이지
 * /[locale]/compatibility/romance/[id]/generating
 *
 * 타이머 기반 진행률 시뮬레이션 + 폴링으로 완료 확인
 * 완료 시 결과 페이지로 자동 리다이렉트
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Heart, Check, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';

import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** 폴링 간격 (ms) */
const POLLING_INTERVAL = 3000;

/** 최대 폴링 횟수 (6분 = 120회) */
const MAX_POLL_COUNT = 120;

/** 예상 총 시간 (초) */
const ESTIMATED_TOTAL_TIME = 60;

/** 파이프라인 단계 정의 */
type CompatibilityStep =
  | 'manseryeok_a'
  | 'manseryeok_b'
  | 'compatibility_score'
  | 'trait_scores'
  | 'relationship_type'
  | 'trait_interpretation'
  | 'conflict_analysis'
  | 'marriage_fit'
  | 'mutual_influence'
  | 'saving'
  | 'complete';

const COMPATIBILITY_STEPS: { key: CompatibilityStep; label: string; progress: number }[] = [
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

/** 단계별 예상 시간 (초) */
const STEP_TIMINGS: Record<CompatibilityStep, { start: number; end: number }> = {
  manseryeok_a: { start: 0, end: 3 },
  manseryeok_b: { start: 3, end: 6 },
  compatibility_score: { start: 6, end: 15 },
  trait_scores: { start: 15, end: 21 },
  relationship_type: { start: 21, end: 30 },
  trait_interpretation: { start: 30, end: 36 },
  conflict_analysis: { start: 36, end: 42 },
  marriage_fit: { start: 42, end: 48 },
  mutual_influence: { start: 48, end: 54 },
  saving: { start: 54, end: 58 },
  complete: { start: 58, end: 60 },
};

/** 한자 로테이션 */
const HANJA_CHARS = ['命', '運', '緣', '合'];

/** 분석 팁 */
const ANALYSIS_TIPS = [
  '두 사람의 천간이 합을 이루면 자연스러운 끌림이 있습니다',
  '지지의 조화는 함께하는 일상의 편안함을 나타냅니다',
  '오행의 균형은 서로를 보완하는 관계를 의미합니다',
  '십신 호환성은 관계에서의 역할 분담을 보여줍니다',
  '12운성 시너지는 상대방에게 받는 에너지를 나타냅니다',
];

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface StatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  currentStep?: string;
  stepStatuses?: Record<string, string>;
  error?: string;
  failedSteps?: string[];
}

/**
 * 경과 시간 기반으로 현재 단계와 상태 계산
 */
function calculateSimulatedState(elapsedSeconds: number): {
  currentStep: CompatibilityStep;
  stepStatuses: Record<CompatibilityStep, StepStatus>;
  progressPercent: number;
} {
  const stepStatuses: Record<CompatibilityStep, StepStatus> = {} as Record<
    CompatibilityStep,
    StepStatus
  >;
  let currentStep: CompatibilityStep = 'manseryeok_a';

  for (const step of COMPATIBILITY_STEPS) {
    const timing = STEP_TIMINGS[step.key];
    if (elapsedSeconds >= timing.end) {
      stepStatuses[step.key] = 'completed';
    } else if (elapsedSeconds >= timing.start) {
      stepStatuses[step.key] = 'in_progress';
      currentStep = step.key;
    } else {
      stepStatuses[step.key] = 'pending';
    }
  }

  // 진행률 계산 (최대 95%까지만 - 완료는 서버 응답으로)
  const progressPercent = Math.min(95, Math.round((elapsedSeconds / ESTIMATED_TOTAL_TIME) * 100));

  return { currentStep, stepStatuses, progressPercent };
}

export default function CompatibilityGeneratingPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;
  const t = useTranslations('compatibility');

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<{
    step: CompatibilityStep;
    message: string;
    retryable: boolean;
  } | null>(null);

  // 타이머 기반 시뮬레이션 상태
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true); // 즉시 시작
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 한자 로테이션
  const [hanjaIndex, setHanjaIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // 타이머 시작 (1초마다 업데이트)
  useEffect(() => {
    if (!isGenerating) return;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGenerating]);

  // 한자 로테이션 (3초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setHanjaIndex((prev) => (prev + 1) % HANJA_CHARS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 팁 로테이션 (5초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ANALYSIS_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * 상태 폴링 함수
   */
  const pollStatus = useCallback(async () => {
    if (!analysisId) return true;

    try {
      const response = await fetch(`/api/analysis/compatibility/${analysisId}`);
      const data: StatusResponse = await response.json();

      if (!response.ok) {
        console.error('상태 조회 실패:', data);
        return true; // 일시적 에러는 계속 시도
      }

      setStatus(data);

      // 완료 시 결과 페이지로 이동
      if (data.status === 'completed') {
        if (timerRef.current) clearInterval(timerRef.current);
        setError(null);
        setTimeout(() => {
          router.push(`/compatibility/romance/${analysisId}`);
        }, 1000);
        return false;
      }

      // 진행 중이면 에러 초기화
      if (data.status === 'processing' || data.status === 'pending') {
        setError(null);
        if (!isGenerating) {
          setIsGenerating(true);
        }
      }

      // 실패 시 에러 표시 (폴링은 계속하여 백그라운드 완료 감지)
      if (data.status === 'failed') {
        setError({
          step: (data.failedSteps?.[0] as CompatibilityStep) || 'manseryeok_a',
          message: data.error || '분석에 실패했습니다',
          retryable: true,
        });
      }

      return true; // 계속 폴링
    } catch (err) {
      console.error('상태 폴링 에러:', err);
      return true; // 일시적 에러는 계속 시도
    }
  }, [analysisId, router, isGenerating]);

  /**
   * 폴링 루프
   */
  useEffect(() => {
    if (!analysisId) return;

    // 초기 폴링
    pollStatus();

    // 폴링 인터벌 설정
    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= MAX_POLL_COUNT) {
          // 타임아웃
          setError({
            step: 'saving',
            message: '분석 시간이 초과되었습니다. 다시 시도해주세요.',
            retryable: true,
          });
          return prev;
        }
        pollStatus();
        return prev + 1;
      });
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [analysisId, pollStatus]);

  /**
   * 재시도 핸들러
   */
  const handleRetry = () => {
    setPollCount(0);
    setError(null);
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setIsGenerating(true);
    // 새 분석 시작 페이지로 이동
    router.push('/compatibility/romance/new');
  };

  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push('/compatibility');
  };

  // 시뮬레이션된 상태 계산 (타이머 기반)
  const simulatedState = calculateSimulatedState(elapsedTime);

  // 서버 stepStatuses 우선 사용
  const displayStepStatuses =
    status?.stepStatuses && Object.keys(status.stepStatuses).length > 0
      ? (status.stepStatuses as Record<CompatibilityStep, StepStatus>)
      : simulatedState.stepStatuses;

  const displayCurrentStep =
    status?.status === 'processing' && status?.currentStep
      ? (status.currentStep as CompatibilityStep)
      : simulatedState.currentStep;

  const displayProgress =
    status?.status === 'processing' && status?.progressPercent
      ? Math.max(status.progressPercent, simulatedState.progressPercent)
      : status?.status === 'completed'
        ? 100
        : simulatedState.progressPercent;

  // 남은 시간 계산
  const remainingTime = Math.max(0, ESTIMATED_TOTAL_TIME - elapsedTime);

  const isCompleted = status?.status === 'completed';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <AppHeader title={t('generating.title', { defaultValue: '궁합 분석 중' })} showBack={false} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 에러 화면 */}
        {error && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-950/30">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">분석에 실패했습니다</h2>
            <p className="mb-6 text-gray-400">{error.message}</p>

            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-[#333] bg-[#1a1a1a] text-white"
              >
                <X className="mr-2 h-4 w-4" />
                취소
              </Button>
              {error.retryable && (
                <Button
                  onClick={handleRetry}
                  className="flex-1"
                  style={{ backgroundColor: BRAND_COLORS.primary, color: '#000' }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* 진행 화면 */}
        {!error && (
          <>
            {/* 메인 아이콘 + 한자 로테이션 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 text-center"
            >
              <div
                className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Check className="h-12 w-12" style={{ color: BRAND_COLORS.primary }} />
                  </motion.div>
                ) : (
                  <>
                    {/* 회전 링 */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-transparent"
                      style={{
                        borderTopColor: BRAND_COLORS.primary,
                        borderRightColor: `${BRAND_COLORS.primary}40`,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                    {/* 한자 로테이션 */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={hanjaIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl font-bold"
                        style={{ color: BRAND_COLORS.primary }}
                      >
                        {HANJA_CHARS[hanjaIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </>
                )}
              </div>

              <h2 className="text-xl font-semibold text-white">
                {isCompleted ? '분석이 완료되었습니다!' : '두 사람의 운명을 분석하고 있습니다...'}
              </h2>
              {!isCompleted && (
                <p className="mt-2 text-gray-400">
                  예상 남은 시간: <span className="text-[#d4af37]">{remainingTime}초</span>
                </p>
              )}
            </motion.div>

            {/* 진행률 바 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">진행률</span>
                <span style={{ color: BRAND_COLORS.primary }}>{displayProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#333]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                />
              </div>
            </motion.div>

            {/* 분석 팁 */}
            {!isCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 rounded-lg border border-[#333] bg-[#1a1a1a] p-4"
              >
                <p className="mb-1 text-xs text-gray-500">분석 팁</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-gray-300"
                  >
                    {ANALYSIS_TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}

            {/* 단계 목록 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
            >
              <div className="space-y-3">
                {COMPATIBILITY_STEPS.map((step) => {
                  const stepStatus = displayStepStatuses[step.key];
                  const isActive = step.key === displayCurrentStep && !isCompleted;
                  const isStepCompleted = stepStatus === 'completed' || isCompleted;
                  const isFailed = stepStatus === 'failed';
                  const isPending = !isActive && !isStepCompleted && !isFailed;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 ${isPending ? 'opacity-40' : ''}`}
                    >
                      {/* 상태 아이콘 */}
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          isStepCompleted
                            ? 'bg-green-500/20'
                            : isFailed
                              ? 'bg-red-500/20'
                              : isActive
                                ? 'bg-[#d4af37]/20'
                                : 'bg-gray-700'
                        }`}
                      >
                        {isStepCompleted ? (
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
                            : isStepCompleted
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

            {/* 실패한 단계 표시 (일부 실패) */}
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
          </>
        )}
      </div>
    </div>
  );
}
