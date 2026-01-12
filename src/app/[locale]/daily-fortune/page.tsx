'use client';

/**
 * 오늘의 운세 상세 페이지
 * 홈화면 DailyFortuneCard에서 "상세 보기" 클릭 시 이동
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  Wallet,
  Heart,
  Activity,
  Users,
  Lightbulb,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FortuneScoreGauge } from '@/components/daily-fortune';
import { SubscriptionPrompt } from '@/components/daily-fortune/SubscriptionPrompt';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** 오행 색상 매핑 */
const ELEMENT_COLORS: Record<string, string> = {
  '木': '#4ade80',
  '火': '#ef4444',
  '土': '#f59e0b',
  '金': '#e5e7eb',
  '水': '#1e3a8a',
};

/** 영역 아이콘 매핑 */
const AREA_ICONS: Record<string, React.ElementType> = {
  career: Briefcase,
  wealth: Wallet,
  love: Heart,
  health: Activity,
  relationship: Users,
};

/** 영역별 운세 타입 */
interface AreaFortune {
  score: number;
  title: string;
  description: string;
  tip: string;
}

/** API 응답 타입 */
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
  career_fortune?: AreaFortune;
  wealth_fortune?: AreaFortune;
  love_fortune?: AreaFortune;
  health_fortune?: AreaFortune;
  relationship_fortune?: AreaFortune;
  advice?: string;
}

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
  };
  subscription?: {
    isSubscribed: boolean;
    isTrialActive: boolean;
    trialRemainingDays: number;
  };
}

type PageState = 'loading' | 'subscription' | 'generating' | 'ready' | 'error';

/** 영역별 운세 카드 컴포넌트 */
function AreaFortuneCard({
  areaKey,
  fortune,
  t
}: {
  areaKey: string;
  fortune: AreaFortune | undefined;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = AREA_ICONS[areaKey] || Briefcase;

  if (!fortune) return null;

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#d4af37';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
          </div>
          <div>
            <h3 className="font-medium text-white">
              {t(`areas.${areaKey}`)}
            </h3>
            <p className="text-xs text-gray-500">{fortune.title}</p>
          </div>
        </div>
        <div
          className="text-lg font-bold"
          style={{ color: getScoreColor(fortune.score) }}
        >
          {fortune.score}점
        </div>
      </div>

      {/* 설명 */}
      <p className="text-sm leading-relaxed text-gray-300 mb-3">
        {fortune.description}
      </p>

      {/* 팁 */}
      {fortune.tip && (
        <div className="flex items-start gap-2 rounded-lg bg-[#242424] p-3">
          <Lightbulb className="h-4 w-4 mt-0.5 text-[#d4af37] flex-shrink-0" />
          <p className="text-xs text-gray-400">
            <span className="font-medium text-[#d4af37]">{t('tip')}: </span>
            {fortune.tip}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function DailyFortunePage() {
  const t = useTranslations('dailyFortune');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<DailyFortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState('');

  /** 데이터 조회 */
  const fetchFortune = async () => {
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
        // 생성 필요 - 홈으로 리다이렉트 (홈에서 생성 처리)
        router.replace(`/${locale}/home`);
        return;
      }

      setState('ready');
    } catch (err) {
      console.error('[DailyFortune] 조회 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setState('error');
    }
  };

  useEffect(() => {
    fetchFortune();
    // 클라이언트에서만 날짜 설정
    const today = new Date();
    setDateStr(`${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`);
  }, []);

  const fortune = data?.data;

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: BRAND_COLORS.secondary }}
    >
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-[#333] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white hover:bg-[#242424]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium text-white">{t('title')}</h1>
          <div className="w-10" /> {/* 균형 맞춤용 */}
        </div>
      </div>

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
              className="py-10"
            >
              <SubscriptionPrompt
                canStartTrial={data?.canStartTrial}
                onStartTrial={() => router.replace(`/${locale}/home`)}
              />
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
                다시 시도
              </Button>
            </motion.div>
          )}

          {/* 운세 상세 */}
          {state === 'ready' && fortune && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* 날짜 + 일진 + 점수 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#333] bg-gradient-to-br from-[#1a1a1a] to-[#111111] p-6"
              >
                {/* 날짜 */}
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-[#d4af37]" />
                  <span className="text-sm text-gray-400">{dateStr}</span>
                </div>

                {/* 일진 + 점수 */}
                <div className="flex items-center justify-between">
                  {/* 일진 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold"
                        style={{
                          backgroundColor: `${ELEMENT_COLORS[fortune.day_element]}20`,
                          color: ELEMENT_COLORS[fortune.day_element],
                        }}
                      >
                        {fortune.day_stem}
                      </div>
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold"
                        style={{
                          backgroundColor: `${ELEMENT_COLORS[fortune.day_element]}20`,
                          color: ELEMENT_COLORS[fortune.day_element],
                        }}
                      >
                        {fortune.day_branch}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{t('todayPillar')}</span>
                  </div>

                  {/* 점수 게이지 */}
                  <FortuneScoreGauge
                    score={fortune.overall_score}
                    size="lg"
                    label={t('overallScore')}
                  />
                </div>
              </motion.section>

              {/* 요약 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5"
              >
                <p className="text-sm leading-relaxed text-gray-300">
                  {fortune.summary}
                </p>
              </motion.section>

              {/* 행운 정보 */}
              {(fortune.lucky_color || fortune.lucky_number || fortune.lucky_direction) && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5"
                >
                  <h2 className="flex items-center gap-2 text-sm font-medium text-white mb-4">
                    <Sparkles className="h-4 w-4 text-[#d4af37]" />
                    {t('luckyInfo')}
                  </h2>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {fortune.lucky_color && (
                      <div className="rounded-lg bg-[#242424] p-3">
                        <p className="text-xs text-gray-500 mb-1">{t('luckyColor')}</p>
                        <p className="font-medium text-white">{fortune.lucky_color}</p>
                      </div>
                    )}
                    {fortune.lucky_number && (
                      <div className="rounded-lg bg-[#242424] p-3">
                        <p className="text-xs text-gray-500 mb-1">{t('luckyNumber')}</p>
                        <p className="font-medium text-[#d4af37]">{fortune.lucky_number}</p>
                      </div>
                    )}
                    {fortune.lucky_direction && (
                      <div className="rounded-lg bg-[#242424] p-3">
                        <p className="text-xs text-gray-500 mb-1">{t('luckyDirection')}</p>
                        <p className="font-medium text-white">{fortune.lucky_direction}</p>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {/* 영역별 운세 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-sm font-medium text-white mb-4">{t('areaFortunes')}</h2>
                <div className="space-y-3">
                  <AreaFortuneCard areaKey="career" fortune={fortune.career_fortune} t={t} />
                  <AreaFortuneCard areaKey="wealth" fortune={fortune.wealth_fortune} t={t} />
                  <AreaFortuneCard areaKey="love" fortune={fortune.love_fortune} t={t} />
                  <AreaFortuneCard areaKey="health" fortune={fortune.health_fortune} t={t} />
                  <AreaFortuneCard areaKey="relationship" fortune={fortune.relationship_fortune} t={t} />
                </div>
              </motion.section>

              {/* 오늘의 조언 */}
              {fortune.advice && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-5"
                >
                  <h2 className="flex items-center gap-2 text-sm font-medium text-[#d4af37] mb-3">
                    <Lightbulb className="h-4 w-4" />
                    {t('todayAdvice')}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {fortune.advice}
                  </p>
                </motion.section>
              )}

              {/* 홈으로 돌아가기 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
              >
                <Button
                  onClick={() => router.push(`/${locale}/home`)}
                  variant="outline"
                  className="w-full border-[#333] bg-transparent text-gray-300 hover:bg-[#242424]"
                >
                  {tCommon('backToHome')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
