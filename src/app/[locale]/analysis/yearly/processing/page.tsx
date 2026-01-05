'use client';

/**
 * 신년 분석 처리 중 페이지
 * 폴링 방식으로 Python 백엔드 작업 상태 확인
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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

/** 폴링 간격 (ms) */
const POLLING_INTERVAL = 3000;

/** 최대 폴링 횟수 (5분 = 100회) */
const MAX_POLL_COUNT = 100;

export default function YearlyProcessingPage() {
  const router = useRouter();

  const {
    targetYear,
    existingAnalysisId,
    selectedProfileId,
    setYearlyResult,
    setYearlyLoading,
    setYearlyError,
    resetYearly,
  } = useYearlyStore();

  const { birthDate, birthTime, timezone, isLunar, gender, pillars, daewun } = useOnboardingStore();

  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<YearlyLoadingStep>('init');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const pollCountRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  const isRequestingRef = useRef(false);

  // 팁 로테이션
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FORTUNE_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * 상태 폴링 함수
   */
  const pollStatus = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/analysis/yearly/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            // 아직 레코드 없음, 계속 폴링
            return;
          }
          throw new Error('상태 조회 실패');
        }

        const data = await response.json();

        // 진행률 업데이트
        if (data.progressPercent) {
          setProgressPercent(data.progressPercent);
        }

        // 현재 단계 매핑
        if (data.currentStep) {
          const stepMap: Record<string, YearlyLoadingStep> = {
            building_prompt: 'build_prompt',
            ai_analysis: 'ai_analysis',
            saving_result: 'save_result',
          };
          setCurrentStep(stepMap[data.currentStep] || 'ai_analysis');
        }

        // 완료
        if (data.status === 'completed' && data.data) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setCurrentStep('complete');
          setProgressPercent(100);
          setYearlyResult(data.data.analysis);
          setYearlyLoading(false);

          // 결과 페이지로 이동
          setTimeout(() => {
            router.push(`/analysis/yearly/result/${id}`);
          }, 500);
          return;
        }

        // 실패
        if (data.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          throw new Error(data.error || '분석에 실패했습니다');
        }

        // 폴링 횟수 체크
        pollCountRef.current += 1;
        if (pollCountRef.current >= MAX_POLL_COUNT) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          throw new Error('분석 시간이 초과되었습니다. 다시 시도해주세요.');
        }
      } catch (err) {
        console.error('[YearlyProcessing] 폴링 실패:', err);
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        setYearlyError(message);
        setYearlyLoading(false);
      }
    },
    [router, setYearlyResult, setYearlyLoading, setYearlyError]
  );

  /**
   * 분석 시작 함수
   */
  const startAnalysis = useCallback(async () => {
    // 중복 요청 방지
    if (!targetYear || isStarted || isRequestingRef.current) {
      if (!targetYear) {
        router.push('/analysis/yearly');
      }
      return;
    }

    isRequestingRef.current = true;
    setIsStarted(true);
    setError(null);
    setCurrentStep('init');
    setProgressPercent(0);
    pollCountRef.current = 0;

    try {
      setYearlyLoading(true, 'init');
      setCurrentStep('fetch_saju');

      // 분석 데이터 준비
      let analysisData: {
        targetYear: number;
        profileId?: string;
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

      if (selectedProfileId) {
        analysisData = {
          targetYear,
          profileId: selectedProfileId,
          language: 'ko',
        };
      } else if (existingAnalysisId) {
        analysisData = {
          targetYear,
          existingAnalysisId,
          language: 'ko',
        };
      } else {
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

      setCurrentStep('build_prompt');

      // POST 요청 (즉시 반환됨)
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

      // completed 상태면 결과 페이지로 이동
      if (result.status === 'completed' && result.redirectUrl) {
        setCurrentStep('complete');
        setProgressPercent(100);
        setYearlyLoading(false);
        router.push(result.redirectUrl);
        return;
      }

      if (!result.analysisId) {
        throw new Error('분석 ID를 받지 못했습니다.');
      }

      setCurrentStep('ai_analysis');
      setProgressPercent(30);

      // 폴링 시작
      pollingIntervalRef.current = setInterval(() => {
        pollStatus(result.analysisId);
      }, POLLING_INTERVAL);

      // 첫 번째 폴링 즉시 실행
      pollStatus(result.analysisId);
    } catch (err) {
      console.error('[YearlyProcessing] 분석 시작 실패:', err);
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      setYearlyError(message);
      setYearlyLoading(false);
      setIsStarted(false);
    } finally {
      isRequestingRef.current = false;
    }
  }, [
    targetYear,
    isStarted,
    selectedProfileId,
    existingAnalysisId,
    birthDate,
    birthTime,
    timezone,
    isLunar,
    gender,
    pillars,
    daewun,
    router,
    setYearlyLoading,
    setYearlyError,
    pollStatus,
  ]);

  // 페이지 진입 시 분석 시작 (한 번만 실행)
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setIsStarted(false);
    pollCountRef.current = 0;
    hasStartedRef.current = false;
    isRequestingRef.current = false; // ref 리셋
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    // 직접 호출 (useEffect 의존 X)
    setTimeout(() => {
      hasStartedRef.current = true;
      startAnalysis();
    }, 0);
  };

  const handleBack = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    resetYearly();
    router.push('/analysis/yearly');
  };

  // 에러 화면
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">분석 중 오류가 발생했습니다</h2>
          <p className="mb-6 text-gray-400">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#242424]"
            >
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 py-12">
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
        className="mb-2 text-center text-xl font-semibold text-white"
      >
        {targetYear}년 신년 운세를 분석하고 있습니다
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 text-center text-gray-400"
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
              {status === 'pending' && <Circle className="h-5 w-5 text-gray-600" />}
              <span
                className={`text-sm ${
                  status === 'completed'
                    ? 'text-green-500'
                    : status === 'in_progress'
                      ? 'font-medium'
                      : 'text-gray-500'
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
        <div className="h-2 overflow-hidden rounded-full bg-[#333]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: BRAND_COLORS.primary }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-gray-500">{progressPercent}%</p>
      </div>

      {/* 팁 */}
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-xs text-gray-500">알고 계셨나요?</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-400"
          >
            &ldquo;{FORTUNE_TIPS[tipIndex]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
