'use client';

/**
 * 오늘의 운세 리다이렉트 페이지
 * 대표 프로필의 오늘 운세를 조회/생성 후 상세 페이지로 리다이렉트
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionPrompt } from '@/components/daily-fortune/SubscriptionPrompt';
import { AppHeader } from '@/components/layout/AppHeader';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** API 응답 타입 */
interface DailyFortuneResponse {
  success: boolean;
  cached?: boolean;
  fortuneId?: string;
  needsGeneration?: boolean;
  requireSubscription?: boolean;
  canStartTrial?: boolean;
  message?: string;
  data?: {
    id: string;
    [key: string]: unknown;
  } | null;
  profile?: {
    id: string;
    name: string;
  };
  pillars?: Record<string, unknown>;
  daewun?: unknown[];
  subscription?: {
    isSubscribed: boolean;
    isTrialActive: boolean;
    trialRemainingDays: number;
  };
}

type PageState = 'loading' | 'subscription' | 'generating' | 'error';

/** 단계별 라벨 (다국어) */
const STEP_LABELS: Record<string, Record<string, string>> = {
  day_calculation: {
    ko: '일진 계산 중...',
    en: 'Calculating day pillar...',
    ja: '日柱計算中...',
    'zh-CN': '计算日柱中...',
    'zh-TW': '計算日柱中...',
  },
  wunseong: {
    ko: '12운성 분석 중...',
    en: 'Analyzing 12 stages...',
    ja: '十二運星分析中...',
    'zh-CN': '分析十二运星中...',
    'zh-TW': '分析十二運星中...',
  },
  timing: {
    ko: '복음/반음 감지 중...',
    en: 'Detecting patterns...',
    ja: 'パターン検出中...',
    'zh-CN': '检测模式中...',
    'zh-TW': '檢測模式中...',
  },
  johu: {
    ko: '조후용신 분석 중...',
    en: 'Analyzing seasonal needs...',
    ja: '調候分析中...',
    'zh-CN': '分析调候中...',
    'zh-TW': '分析調候中...',
  },
  combination: {
    ko: '삼합/방합 감지 중...',
    en: 'Detecting combinations...',
    ja: '三合検出中...',
    'zh-CN': '检测三合中...',
    'zh-TW': '檢測三合中...',
  },
  useful_god: {
    ko: '용신 정보 조회 중...',
    en: 'Looking up useful god...',
    ja: '用神照会中...',
    'zh-CN': '查询用神中...',
    'zh-TW': '查詢用神中...',
  },
  gemini_analysis: {
    ko: 'AI 분석 중...',
    en: 'AI analyzing...',
    ja: 'AI分析中...',
    'zh-CN': 'AI分析中...',
    'zh-TW': 'AI分析中...',
  },
  score_adjustment: {
    ko: '점수 계산 중...',
    en: 'Calculating scores...',
    ja: 'スコア計算中...',
    'zh-CN': '计算分数中...',
    'zh-TW': '計算分數中...',
  },
  complete: { ko: '완료!', en: 'Complete!', ja: '完了！', 'zh-CN': '完成！', 'zh-TW': '完成！' },
};

export default function DailyFortuneRedirectPage() {
  const t = useTranslations('dailyFortune');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<DailyFortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 진행률 상태
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  /** 운세 생성 */
  const generateFortune = useCallback(
    async (fetchedData: DailyFortuneResponse) => {
      setState('generating');
      setProgress(0);
      setCurrentStep('');

      const profileId = fetchedData.profile?.id;
      const today = new Date().toISOString().slice(0, 10);

      try {
        // 1. POST 요청으로 운세 생성 시작
        const postRes = await fetch('/api/daily-fortune', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: profileId,
            pillars: fetchedData.pillars,
            daewun: fetchedData.daewun,
            language: locale,
          }),
        });

        // 즉시 완료된 경우
        if (postRes.ok) {
          const json: DailyFortuneResponse = await postRes.json();
          const fortuneId = json.fortuneId || json.data?.id;
          if (fortuneId) {
            setProgress(100);
            router.replace(`/${locale}/daily-fortune/${fortuneId}`);
            return;
          }
        }

        // 2. 진행률 폴링 시작
        const pollStatus = async (): Promise<string | null> => {
          try {
            const statusRes = await fetch(
              `/api/daily-fortune/status?profile_id=${profileId}&date=${today}`
            );
            const statusJson = await statusRes.json();

            setProgress(statusJson.progress_percent || 0);

            // 현재 진행 중인 단계 찾기
            const stepStatuses = statusJson.step_statuses || {};
            const inProgressStep = Object.entries(stepStatuses).find(
              ([, status]) => status === 'in_progress'
            );
            if (inProgressStep) {
              setCurrentStep(inProgressStep[0]);
            }

            if (statusJson.status === 'completed' && statusJson.result?.id) {
              setProgress(100);
              return statusJson.result.id;
            }

            if (statusJson.status === 'failed') {
              throw new Error(statusJson.error?.message || t('errors.generateFailed'));
            }

            return null;
          } catch (e) {
            console.error('[DailyFortune] 폴링 오류:', e);
            return null;
          }
        };

        // 3. 1초 간격으로 폴링 (최대 60초)
        let fortuneId: string | null = null;
        for (let i = 0; i < 60 && !fortuneId; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          fortuneId = await pollStatus();
        }

        if (fortuneId) {
          router.replace(`/${locale}/daily-fortune/${fortuneId}`);
        } else {
          throw new Error(t('errors.timeout'));
        }
      } catch (err) {
        console.error('[DailyFortune] 생성 오류:', err);
        setError(err instanceof Error ? err.message : t('errors.generateFailed'));
        setState('error');
      }
    },
    [locale, router, t]
  );

  /** 데이터 조회 */
  const fetchFortune = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const res = await fetch('/api/daily-fortune');
      const json: DailyFortuneResponse = await res.json();

      if (!res.ok) {
        if (res.status === 403 && json.requireSubscription) {
          setData(json);
          setState('subscription');
          return;
        }
        throw new Error(json.message || t('errors.fetchFailed'));
      }

      setData(json);

      // fortuneId가 있으면 바로 리다이렉트
      const fortuneId = json.fortuneId || json.data?.id;
      if (fortuneId && json.data) {
        router.replace(`/${locale}/daily-fortune/${fortuneId}`);
        return;
      }

      // 생성 필요
      if (json.needsGeneration && !json.data) {
        await generateFortune(json);
      }
    } catch (err) {
      console.error('[DailyFortune] 조회 오류:', err);
      setError(err instanceof Error ? err.message : t('errors.generic'));
      setState('error');
    }
  }, [locale, router, t, generateFortune]);

  /** 무료체험 시작 */
  const startTrial = async () => {
    setState('generating');

    try {
      const res = await fetch('/api/daily-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: data?.profile?.id,
          pillars: data?.pillars,
          daewun: data?.daewun,
          language: locale,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.error || t('errors.trialFailed'));
      }

      // 성공 시 다시 조회
      await fetchFortune();
    } catch (err) {
      console.error('[DailyFortune] 무료체험 시작 오류:', err);
      setError(err instanceof Error ? err.message : t('errors.trialFailed'));
      setState('error');
    }
  };

  useEffect(() => {
    fetchFortune();
  }, [fetchFortune]);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BRAND_COLORS.secondary }}>
      {/* AppHeader */}
      <AppHeader showBack backHref="/home" title={t('title')} />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <AnimatePresence mode="wait">
          {/* 로딩 */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#333] border-t-[#d4af37]" />
              <p className="mt-4 text-sm text-gray-400">{tCommon('loadingFortune')}</p>
            </motion.div>
          )}

          {/* 구독 필요 */}
          {state === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10"
            >
              <SubscriptionPrompt canStartTrial={data?.canStartTrial} onStartTrial={startTrial} />
            </motion.div>
          )}

          {/* 생성 중 */}
          {state === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-12 w-12 text-[#d4af37]" />
              </motion.div>

              {/* 현재 단계 라벨 */}
              <p className="mt-4 text-sm text-gray-300">
                {currentStep && STEP_LABELS[currentStep]
                  ? STEP_LABELS[currentStep][locale] || STEP_LABELS[currentStep]['en']
                  : t('generating')}
              </p>

              {/* Progress Bar */}
              <div className="mt-4 w-full max-w-xs">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#333]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#f5d77a]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-gray-500">{progress}%</p>
              </div>
            </motion.div>
          )}

          {/* 에러 */}
          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <p className="text-sm text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFortune}
                className="mt-4 border-[#333] bg-transparent text-gray-300 hover:bg-[#242424]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('retry')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
