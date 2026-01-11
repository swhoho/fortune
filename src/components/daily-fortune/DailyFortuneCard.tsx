'use client';

/**
 * 홈 화면용 오늘의 운세 카드
 * 구독자/무료체험 전용 - 대표 프로필 기준
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
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

export function DailyFortuneCard() {
  const t = useTranslations('dailyFortune');
  const router = useRouter();

  const [state, setState] = useState<CardState>('loading');
  const [data, setData] = useState<DailyFortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  /** 운세 생성 */
  const generateFortune = async (fetchedData: DailyFortuneResponse) => {
    setState('generating');

    try {
      const res = await fetch('/api/daily-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: fetchedData.profile?.id,
          pillars: fetchedData.pillars,
          daewun: fetchedData.daewun,
        }),
      });

      const json: DailyFortuneResponse = await res.json();

      if (!res.ok) {
        throw new Error(json.message || '운세 생성에 실패했습니다');
      }

      setData(prev => prev ? { ...prev, data: json.data, cached: false } : json);
      setState('ready');
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

  useEffect(() => {
    fetchFortune();
  }, [fetchFortune]);

  /** 오늘 날짜 포맷 */
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

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
              <SubscriptionPrompt
                canStartTrial={data?.canStartTrial}
                onStartTrial={startTrial}
              />
            </motion.div>
          )}

          {/* 생성 중 */}
          {state === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-10 w-10 text-[#d4af37]" />
              </motion.div>
              <p className="mt-4 text-sm text-gray-400">오늘의 운세를 분석 중...</p>
              <p className="mt-1 text-xs text-gray-500">잠시만 기다려 주세요</p>
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
                <p className="text-sm leading-relaxed text-gray-300">
                  {data.data.summary}
                </p>
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
                      <p className="mt-1 text-sm font-medium text-[#d4af37]">{data.data.lucky_number}</p>
                    </div>
                  )}
                  {data.data.lucky_direction && (
                    <div>
                      <p className="text-xs text-gray-500">{t('luckyDirection')}</p>
                      <p className="mt-1 text-sm font-medium text-white">{data.data.lucky_direction}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 상세 보기 버튼 */}
              <Button
                onClick={() => router.push('/daily-fortune')}
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
