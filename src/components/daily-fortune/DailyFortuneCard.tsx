'use client';

/**
 * 홈 화면용 오늘의 운세 카드
 * 구독자/무료체험 전용 - 대표 프로필 기준
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FortuneScoreGauge } from './FortuneScoreGauge';
import { SubscriptionPrompt } from './SubscriptionPrompt';

/** 오행 색상 매핑 */
const ELEMENT_COLORS: Record<string, string> = {
  木: '#4ade80',
  火: '#ef4444',
  土: '#f59e0b',
  金: '#e5e7eb',
  水: '#1e3a8a',
};

/** API 응답 타입 */
interface DailyFortuneResponse {
  success: boolean;
  cached?: boolean;
  needsGeneration?: boolean;
  requireSubscription?: boolean;
  canStartTrial?: boolean;
  message?: string;
  data?: DailyFortuneData | null;
  profile?: {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
  };
  pillars?: Record<string, unknown>;
  daewun?: unknown[];
  subscription?: {
    isSubscribed: boolean;
    isTrialActive: boolean;
    trialRemainingDays: number;
  };
}

interface DailyFortuneData {
  id: string;
  fortune_date: string;
  day_stem: string;
  day_branch: string;
  day_element: string;
  overall_score: number;
  summary: string;
  lucky_color?: string;
  lucky_number?: number;
  lucky_direction?: string;
}

type CardState = 'loading' | 'subscription' | 'generating' | 'ready' | 'error';

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

export function DailyFortuneCard() {
  const t = useTranslations('dailyFortune');
  const locale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<CardState>('loading');
  const [data, setData] = useState<DailyFortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // v3.0: 진행률 상태
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

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
        throw new Error(json.message || '운세 조회에 실패했습니다');
      }

      setData(json);

      if (json.needsGeneration && !json.data) {
        // 운세 생성 필요
        await generateFortune(json);
      } else {
        setState('ready');
      }
    } catch (err) {
      console.error('[DailyFortune] 조회 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setState('error');
    }
  }, []);

  /** 운세 생성 (v3.0: 진행률 폴링) */
  const generateFortune = async (fetchedData: DailyFortuneResponse) => {
    setState('generating');
    setProgress(0);
    setCurrentStep('');

    const profileId = fetchedData.profile?.id;
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. POST 요청으로 운세 생성 시작 (백그라운드에서 진행)
      const postRes = await fetch('/api/daily-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profileId,
          pillars: fetchedData.pillars,
          daewun: fetchedData.daewun,
        }),
      });

      // 즉시 완료된 경우 (이미 캐시된 경우 등)
      if (postRes.ok) {
        const json: DailyFortuneResponse = await postRes.json();
        if (json.data) {
          setData((prev) => (prev ? { ...prev, data: json.data, cached: false } : json));
          setProgress(100);
          setState('ready');
          return;
        }
      }

      // 2. 진행률 폴링 시작
      const pollStatus = async (): Promise<boolean> => {
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

          if (statusJson.status === 'completed' && statusJson.result) {
            setData((prev) =>
              prev
                ? { ...prev, data: statusJson.result, cached: false }
                : { success: true, data: statusJson.result }
            );
            setProgress(100);
            setState('ready');
            return true;
          }

          if (statusJson.status === 'failed') {
            throw new Error(statusJson.error?.message || '운세 생성에 실패했습니다');
          }

          return false;
        } catch (e) {
          console.error('[DailyFortune] 폴링 오류:', e);
          return false;
        }
      };

      // 3. 1초 간격으로 폴링 (최대 60초)
      let completed = false;
      for (let i = 0; i < 60 && !completed; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        completed = await pollStatus();
      }

      if (!completed) {
        throw new Error('운세 생성 시간이 초과되었습니다');
      }
    } catch (err) {
      console.error('[DailyFortune] 생성 오류:', err);
      setError(err instanceof Error ? err.message : '운세 생성 오류');
      setState('error');
    }
  };

  /** 무료체험 시작 */
  const startTrial = async () => {
    setState('generating');

    try {
      // POST 요청으로 무료체험 시작 + 운세 생성
      const res = await fetch('/api/daily-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: data?.profile?.id,
          pillars: data?.pillars,
          daewun: data?.daewun,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.error || '무료체험 시작 실패');
      }

      // 성공 시 다시 조회
      await fetchFortune();
    } catch (err) {
      console.error('[DailyFortune] 무료체험 시작 오류:', err);
      setError(err instanceof Error ? err.message : '무료체험 시작 오류');
      setState('error');
    }
  };

  // v4.0: 날짜는 클라이언트에서만 계산 (hydration 오류 방지)
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    fetchFortune();
    // 클라이언트에서만 날짜 설정
    const today = new Date();
    setDateStr(`${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`);
  }, [fetchFortune]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-[#333] bg-gradient-to-br from-[#1a1a1a] to-[#111111]"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[#333] px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#d4af3720' }}
          >
            <Calendar className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="font-bold text-white">{t('title')}</h2>
            <p className="text-xs text-gray-500">{dateStr}</p>
          </div>
        </div>

        {/* 무료체험 배지 */}
        {data?.subscription?.isTrialActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-[#d4af37]/20 px-3 py-1 text-xs font-medium text-[#d4af37]"
          >
            {t('trialBadge', { days: data.subscription.trialRemainingDays })}
          </motion.div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* 로딩 */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#333] border-t-[#d4af37]" />
              <p className="mt-4 text-sm text-gray-400">운세를 불러오는 중...</p>
            </motion.div>
          )}

          {/* 구독 필요 */}
          {state === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SubscriptionPrompt canStartTrial={data?.canStartTrial} onStartTrial={startTrial} />
            </motion.div>
          )}

          {/* 생성 중 (v3.0: 진행률 표시) */}
          {state === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-10 w-10 text-[#d4af37]" />
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
              className="flex flex-col items-center justify-center py-8"
            >
              <p className="text-sm text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFortune}
                className="mt-4 border-[#333] bg-transparent text-gray-300 hover:bg-[#242424]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
            </motion.div>
          )}

          {/* 운세 표시 */}
          {state === 'ready' && data?.data && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* 점수 + 일진 */}
              <div className="flex items-center justify-between">
                <FortuneScoreGauge
                  score={data.data.overall_score}
                  size="md"
                  label={t('overallScore')}
                />

                {/* 오늘의 일진 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold"
                      style={{
                        backgroundColor: `${ELEMENT_COLORS[data.data.day_element]}20`,
                        color: ELEMENT_COLORS[data.data.day_element],
                      }}
                    >
                      {data.data.day_stem}
                    </div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold"
                      style={{
                        backgroundColor: `${ELEMENT_COLORS[data.data.day_element]}20`,
                        color: ELEMENT_COLORS[data.data.day_element],
                      }}
                    >
                      {data.data.day_branch}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{t('todayPillar')}</span>
                </div>
              </div>

              {/* 요약 */}
              <div className="rounded-xl bg-[#242424] p-4">
                <p className="text-sm leading-relaxed text-gray-300">{data.data.summary}</p>
              </div>

              {/* 행운 정보 */}
              {(data.data.lucky_color || data.data.lucky_number || data.data.lucky_direction) && (
                <div className="flex justify-center gap-6 text-center">
                  {data.data.lucky_color && (
                    <div>
                      <p className="text-xs text-gray-500">{t('luckyColor')}</p>
                      <p className="mt-1 text-sm font-medium text-white">{data.data.lucky_color}</p>
                    </div>
                  )}
                  {data.data.lucky_number && (
                    <div>
                      <p className="text-xs text-gray-500">{t('luckyNumber')}</p>
                      <p className="mt-1 text-sm font-medium text-[#d4af37]">
                        {data.data.lucky_number}
                      </p>
                    </div>
                  )}
                  {data.data.lucky_direction && (
                    <div>
                      <p className="text-xs text-gray-500">{t('luckyDirection')}</p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {data.data.lucky_direction}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 상세 보기 버튼 */}
              <Button
                onClick={() => router.push(`/${locale}/daily-fortune/${data.data?.id}`)}
                className="w-full bg-[#d4af37] text-[#0a0a0a] hover:bg-[#c9a432]"
              >
                {t('viewDetail')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
