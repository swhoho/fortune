'use client';

/**
 * 신년 분석 처리 중 페이지
 * Task 20: /[locale]/analysis/yearly/processing
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useYearlyStore, type YearlyLoadingStep } from '@/stores/yearly-store';
import { useOnboardingStore } from '@/stores/onboarding';
import { BRAND_COLORS, FORTUNE_TIPS } from '@/lib/constants/colors';

/** 한자 천간 (회전 애니메이션용) */
const HANJA_CHARS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 로딩 단계 라벨 */
const STEP_LABELS: Record<YearlyLoadingStep, string> = {
  init: '초기화',
  fetch_saju: '사주 정보 불러오기',
  build_prompt: '신년 분석 준비',
  ai_analysis: 'AI 운세 분석 중',
  save_result: '결과 저장',
  complete: '완료',
};

const STEPS_ORDER: YearlyLoadingStep[] = [
  'init',
  'fetch_saju',
  'build_prompt',
  'ai_analysis',
  'save_result',
];

export default function YearlyProcessingPage() {
  const router = useRouter();

  const {
    targetYear,
    existingAnalysisId,
    yearlyLoadingStep,
    setYearlyResult,
    setYearlyLoading,
    setYearlyError,
    resetYearly,
  } = useYearlyStore();

  const { birthDate, birthTime, timezone, isLunar, gender, pillars, daewun } = useOnboardingStore();

  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  // 현재 단계 (스토어에서 가져오거나 기본값 'init')
  const currentStep = yearlyLoadingStep || 'init';

  // 팁 로테이션
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FORTUNE_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 분석 실행
  const runAnalysis = useCallback(async () => {
    if (!targetYear) {
      router.push('/analysis/yearly');
      return;
    }

    try {
      setYearlyLoading(true, 'init');

      // 1. 사주 정보 준비
      setYearlyLoading(true, 'fetch_saju');
      await new Promise((r) => setTimeout(r, 500));

      let analysisData: {
        targetYear: number;
        sajuInput?: {
          birthDate: string;
          birthTime: string;
          timezone: string;
          isLunar: boolean;
          gender: 'male' | 'female';
        };
        existingAnalysisId?: string;
        pillars?: unknown;
        daewun?: unknown;
        language: string;
      };

      if (existingAnalysisId) {
        // 기존 분석 사용
        analysisData = {
          targetYear,
          existingAnalysisId,
          language: 'ko',
        };
      } else {
        // 온보딩 데이터 사용
        if (!birthDate || !gender) {
          throw new Error('생년월일 정보가 없습니다. 온보딩을 완료해주세요.');
        }

        analysisData = {
          targetYear,
          sajuInput: {
            birthDate,
            birthTime: birthTime || '12:00',
            timezone: timezone || 'Asia/Seoul',
            isLunar: isLunar ?? false,
            gender: gender as 'male' | 'female',
          },
          pillars: pillars || undefined,
          daewun: daewun || undefined,
          language: 'ko',
        };
      }

      // 2. 프롬프트 빌드
      setYearlyLoading(true, 'build_prompt');
      await new Promise((r) => setTimeout(r, 500));

      // 3. AI 분석
      setYearlyLoading(true, 'ai_analysis');

      const response = await fetch('/api/analysis/yearly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '분석 요청에 실패했습니다.');
      }

      const result = await response.json();

      // 4. 결과 저장
      setYearlyLoading(true, 'save_result');
      await new Promise((r) => setTimeout(r, 300));

      setYearlyResult(result.data);
      setYearlyLoading(true, 'complete');

      // 5. 결과 페이지로 이동
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/analysis/yearly/result/${result.analysisId}`);
    } catch (err) {
      console.error('[YearlyProcessing] 분석 실패:', err);
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      setYearlyError(message);
    } finally {
      setYearlyLoading(false);
    }
  }, [
    targetYear,
    existingAnalysisId,
    birthDate,
    birthTime,
    timezone,
    isLunar,
    gender,
    pillars,
    daewun,
    router,
    setYearlyResult,
    setYearlyLoading,
    setYearlyError,
  ]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const getStepStatus = (step: YearlyLoadingStep) => {
    if (currentStep === 'complete') return 'completed';
    const currentIndex = STEPS_ORDER.indexOf(currentStep);
    const stepIndex = STEPS_ORDER.indexOf(step);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'in_progress';
    return 'pending';
  };

  const handleRetry = () => {
    setError(null);
    runAnalysis();
  };

  const handleBack = () => {
    resetYearly();
    router.push('/analysis/yearly');
  };

  // 에러 화면
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">분석 중 오류가 발생했습니다</h2>
          <p className="mb-6 text-gray-500">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack}>
              돌아가기
            </Button>
            <Button
              onClick={handleRetry}
              style={{ backgroundColor: BRAND_COLORS.primary }}
              className="text-black hover:opacity-90"
            >
              다시 시도
            </Button>
          </div>
        </motion.div>
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
        {targetYear}년 신년 운세를 분석하고 있습니다
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 text-center text-gray-500"
      >
        12개월 월별 운세와 길흉일을 계산 중...
      </motion.p>

      {/* 진행 단계 */}
      <div className="mb-8 w-full max-w-md space-y-3">
        {STEPS_ORDER.map((step, index) => {
          const status = getStepStatus(step);
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {status === 'in_progress' && (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND_COLORS.primary }} />
              )}
              {status === 'pending' && <Circle className="h-5 w-5 text-gray-300" />}
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
                {STEP_LABELS[step]}
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
                  : ((STEPS_ORDER.indexOf(currentStep) + 1) / STEPS_ORDER.length) * 100
              }%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 팁 */}
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-xs text-gray-400">알고 계셨나요?</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-600"
          >
            &ldquo;{FORTUNE_TIPS[tipIndex]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
