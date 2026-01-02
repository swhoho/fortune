'use client';

/**
 * 분석 진행 중 화면 컴포넌트
 * PRD 섹션 5.7 기반
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FORTUNE_TIPS, BRAND_COLORS } from '@/lib/constants/colors';
import { LoadingStep, LoadingStepLabel } from '@/types/saju';

/** 한자 천간 목록 (회전 애니메이션용) */
const HANJA_CHARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 로딩 단계 순서 */
const LOADING_STEPS: LoadingStep[] = [
  'manseryeok',
  'jijanggan',
  'ai_analysis',
  'visualization',
  'report',
];

interface ProcessingScreenProps {
  /** 현재 로딩 단계 */
  currentStep: LoadingStep | null;
  /** 에러 메시지 */
  error?: string | null;
  /** 재시도 핸들러 */
  onRetry?: () => void;
}

/**
 * 단계 상태 계산
 */
function getStepStatus(
  step: LoadingStep,
  currentStep: LoadingStep | null
): 'completed' | 'in_progress' | 'pending' {
  if (currentStep === 'complete') return 'completed';
  if (!currentStep) return 'pending';

  const currentIndex = LOADING_STEPS.indexOf(currentStep);
  const stepIndex = LOADING_STEPS.indexOf(step);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'in_progress';
  return 'pending';
}

export function ProcessingScreen({ currentStep, error, onRetry }: ProcessingScreenProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // 팁 로테이션 (5초)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % FORTUNE_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 에러 화면
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl">
            <span role="img" aria-label="error">
              ⚠️
            </span>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">분석 중 오류가 발생했습니다</h2>
          <p className="mb-6 text-gray-500">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              style={{ backgroundColor: BRAND_COLORS.primary }}
              className="text-black hover:opacity-90"
            >
              다시 시도
            </Button>
          )}
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
        className="mb-8 text-center text-xl font-semibold text-gray-900"
      >
        당신의 사주를 분석하고 있습니다...
      </motion.h2>

      {/* 진행 단계 */}
      <div className="mb-8 w-full max-w-md space-y-3">
        {LOADING_STEPS.map((step, index) => {
          const status = getStepStatus(step, currentStep);
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              {/* 상태 아이콘 */}
              {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {status === 'in_progress' && (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND_COLORS.primary }} />
              )}
              {status === 'pending' && <Circle className="h-5 w-5 text-gray-300" />}

              {/* 단계 라벨 */}
              <span
                className={`text-sm ${
                  status === 'completed'
                    ? 'text-green-600'
                    : status === 'in_progress'
                      ? 'font-medium'
                      : 'text-gray-400'
                }`}
                style={status === 'in_progress' ? { color: BRAND_COLORS.primary } : undefined}
              >
                {LoadingStepLabel[step]}
                {status === 'completed' && ' 완료'}
                {status === 'in_progress' && '...'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* 진행 바 */}
      <div className="mb-8 w-full max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: BRAND_COLORS.primary }}
            initial={{ width: '0%' }}
            animate={{
              width: `${
                currentStep === 'complete'
                  ? 100
                  : ((LOADING_STEPS.indexOf(currentStep || 'manseryeok') + 1) /
                      LOADING_STEPS.length) *
                    100
              }%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 명리학 팁 */}
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-xs text-gray-400">알고 계셨나요?</p>
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
