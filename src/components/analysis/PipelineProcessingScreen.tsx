'use client';

/**
 * v2.0 멀티스텝 파이프라인 진행 화면
 * Task 6: 멀티스텝 파이프라인 설계
 * Task 22: 로딩 UI + i18n 적용
 *
 * 10단계 진행률 표시 + 에러 복구 UI
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, RefreshCcw, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FORTUNE_TIPS, BRAND_COLORS } from '@/lib/constants/colors';
import type { PipelineStep, StepStatus } from '@/lib/ai/types';

/** 한자 천간 목록 (회전 애니메이션용) */
const HANJA_CHARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 파이프라인 단계 순서 */
const PIPELINE_STEPS: PipelineStep[] = [
  'manseryeok',
  'jijanggan',
  'basic_analysis',
  'personality',
  'aptitude',
  'fortune',
  'scoring',
  'visualization',
  'saving',
];

/**
 * 단계별 i18n 키 매핑
 * 실제 라벨은 useTranslations('pipeline')에서 가져옴
 */
export const PIPELINE_STEP_KEYS: readonly PipelineStep[] = [
  'manseryeok',
  'jijanggan',
  'basic_analysis',
  'personality',
  'aptitude',
  'fortune',
  'scoring',
  'visualization',
  'saving',
  'complete',
] as const;

/**
 * 단계 라벨 가져오기 훅 (i18n)
 */
export function usePipelineStepLabels() {
  const t = useTranslations('pipeline');

  const getStepLabel = (step: PipelineStep): string => {
    return t(`steps.${step}`);
  };

  const getActiveLabel = (step: PipelineStep): string => {
    return t(`activeMessages.${step}`);
  };

  return { getStepLabel, getActiveLabel, t };
}

interface PipelineProcessingScreenProps {
  /** 현재 진행 중인 단계 */
  currentStep: PipelineStep | null;
  /** 각 단계의 상태 */
  stepStatuses: Record<PipelineStep, StepStatus>;
  /** 진행률 (0-100) */
  progressPercent: number;
  /** 예상 남은 시간 (초) */
  estimatedTimeRemaining: number;
  /** 에러 정보 */
  error?: {
    step: PipelineStep;
    error: string;
    retryable: boolean;
  } | null;
  /** 재시도 핸들러 */
  onRetry?: (step: PipelineStep) => void;
  /** 취소 핸들러 */
  onCancel?: () => void;
}

/**
 * 아이콘 컴포넌트
 */
function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'in_progress':
      return <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND_COLORS.primary }} />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Circle className="h-5 w-5 text-gray-300" />;
  }
}

/** 초기 카운트다운 시간 (5분) */
const INITIAL_COUNTDOWN_SECONDS = 300;

export function PipelineProcessingScreen({
  currentStep,
  stepStatuses,
  progressPercent,
  estimatedTimeRemaining: _estimatedTimeRemaining, // 서버 값 무시, 내부 카운트다운 사용
  error,
  onRetry,
  onCancel,
}: PipelineProcessingScreenProps) {
  const t = useTranslations('pipeline');
  const { getStepLabel, getActiveLabel } = usePipelineStepLabels();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN_SECONDS);

  /**
   * 남은 시간 포맷 (i18n)
   */
  const formatRemainingTime = (seconds: number): string => {
    if (seconds <= 0) return '';
    if (seconds < 60) return t('remainingTime.seconds', { seconds });
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return t('remainingTime.minutes', { minutes, seconds: secs });
  };

  // 10분 카운트다운 (1초씩 감소)
  useEffect(() => {
    if (error || progressPercent >= 100) return; // 에러 또는 완료 시 중지

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [error, progressPercent]);

  // 팁 로테이션 (5초)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % FORTUNE_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 에러 화면
  if (error) {
    const errorStepLabel = getStepLabel(error.step);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {t('error.title', { step: errorStepLabel })}
          </h2>
          <p className="mb-6 text-gray-500">{error.error}</p>

          {/* 완료된 단계 표시 */}
          <div className="mb-6 space-y-2 text-left">
            <p className="mb-2 text-xs text-gray-400">{t('error.completedSteps')}</p>
            {PIPELINE_STEPS.map((step) => {
              const status = stepStatuses[step];
              if (status === 'completed') {
                return (
                  <div key={step} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">{getStepLabel(step)} ✓</span>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="flex flex-col gap-3">
            {error.retryable && onRetry && (
              <Button
                onClick={() => onRetry(error.step)}
                style={{ backgroundColor: BRAND_COLORS.primary }}
                className="w-full text-black hover:opacity-90"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t('error.retryFrom', { step: errorStepLabel })}
              </Button>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="w-full">
                {t('error.cancel')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* 한자 회전 애니메이션 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="relative mb-8 h-32 w-32"
      >
        {HANJA_CHARS.map((char, i) => (
          <motion.span
            key={char}
            className="absolute left-1/2 top-1/2 origin-center font-serif text-2xl"
            style={{
              color: BRAND_COLORS.primary,
              transform: `translate(-50%, -50%) rotate(${i * 36}deg) translateY(-48px)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {char}
          </motion.span>
        ))}
        {/* 중앙 로딩 아이콘 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_COLORS.primary }} />
        </div>
      </motion.div>

      {/* 메인 메시지 */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-xl font-semibold text-gray-900"
      >
        {currentStep ? getActiveLabel(currentStep) : t('preparing')}
      </motion.h2>

      {/* 남은 시간 (10분 카운트다운) */}
      {countdown > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500"
        >
          <Clock className="h-4 w-4" />
          <span>{formatRemainingTime(countdown)}</span>
        </motion.div>
      )}

      {/* 진행률 바 */}
      <div className="mb-6 w-full max-w-md">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-500">{t('progress')}</span>
          <span className="font-medium" style={{ color: BRAND_COLORS.primary }}>
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* 진행 단계 (2열 그리드) */}
      <div className="mb-8 w-full max-w-lg">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {PIPELINE_STEPS.map((step, index) => {
            const status = stepStatuses[step];
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <StepIcon status={status} />
                <span
                  className={`text-sm ${
                    status === 'completed'
                      ? 'text-green-600'
                      : status === 'in_progress'
                        ? 'font-medium'
                        : status === 'failed'
                          ? 'text-red-500'
                          : 'text-gray-400'
                  }`}
                  style={status === 'in_progress' ? { color: BRAND_COLORS.primary } : undefined}
                >
                  {getStepLabel(step)}
                  {status === 'completed' && ' ✓'}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 명리학 팁 */}
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-xs text-gray-400">{t('tip')}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentTipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-600"
          >
            &ldquo;{FORTUNE_TIPS[currentTipIndex]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * 파이프라인 단계 라벨 export
 */
export { PIPELINE_STEPS };
