'use client';

/**
 * 오늘의 운세 상세 페이지 (공유 가능)
 * URL: /daily-fortune/[id]
 * 탭: 운세 / 상담 (본인만 상담 접근 가능)
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Calendar,
  Briefcase,
  Wallet,
  Heart,
  Activity,
  Users,
  Lightbulb,
  Sparkles,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FortuneScoreGauge, DailyFortuneNavigation } from '@/components/daily-fortune';
import type { DailyFortuneTabType } from '@/components/daily-fortune/DailyFortuneNavigation';
import { ConsultationTab } from '@/components/consultation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BRAND_COLORS } from '@/lib/constants/colors';
import { useAuth } from '@/hooks/use-user';
import { toast } from 'sonner';

/** 오행 색상 매핑 */
const ELEMENT_COLORS: Record<string, string> = {
  木: '#4ade80',
  火: '#ef4444',
  土: '#f59e0b',
  金: '#e5e7eb',
  水: '#1e3a8a',
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
  profile_id: string;
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
  data?: DailyFortuneData;
  profile?: {
    id: string;
    name: string;
    gender: string;
    birth_date: string;
    user_id?: string;
  };
  error?: string;
}

type PageState = 'loading' | 'ready' | 'error';

/** 영역별 운세 카드 컴포넌트 */
function AreaFortuneCard({
  areaKey,
  fortune,
  t,
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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
          </div>
          <div>
            <h3 className="font-medium text-white">{t(`areas.${areaKey}`)}</h3>
            {/* 타이틀이 영역명과 다를 때만 표시 (중복 방지) */}
            {fortune.title && fortune.title !== t(`areas.${areaKey}`) && (
              <p className="text-xs text-gray-500">{fortune.title}</p>
            )}
          </div>
        </div>
        <div className="text-lg font-bold" style={{ color: getScoreColor(fortune.score) }}>
          {fortune.score}점
        </div>
      </div>

      {/* 설명 */}
      <p className="mb-3 text-sm leading-relaxed text-gray-300">{fortune.description}</p>

      {/* 팁 */}
      {fortune.tip && (
        <div className="flex items-start gap-2 rounded-lg bg-[#242424] p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#d4af37]" />
          <p className="text-xs text-gray-400">
            <span className="font-medium text-[#d4af37]">{t('tip')}: </span>
            {fortune.tip}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function DailyFortuneDetailPage() {
  const t = useTranslations('dailyFortune');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fortuneId = params.id as string;

  const { user } = useAuth();

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<DailyFortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState('');

  // 탭 상태 (URL 파라미터 연동)
  const tabParam = searchParams.get('tab') as DailyFortuneTabType | null;
  const [activeTab, setActiveTab] = useState<DailyFortuneTabType>(
    tabParam === 'consultation' ? 'consultation' : 'fortune'
  );

  /** 데이터 조회 */
  const fetchFortune = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const res = await fetch(`/api/daily-fortune/${fortuneId}`);
      const json: DailyFortuneResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || '운세를 찾을 수 없습니다');
      }

      setData(json);
      setState('ready');
    } catch (err) {
      console.error('[DailyFortune] 조회 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setState('error');
    }
  }, [fortuneId]);

  /** 공유 핸들러 */
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${locale}/daily-fortune/${fortuneId}`;
    const shareTitle = data?.profile?.name ? `${data.profile.name}님의 ${t('title')}` : t('title');

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(tCommon('linkCopied'));
      }
    } catch (err) {
      // 사용자가 공유 취소한 경우 무시
      if ((err as Error).name !== 'AbortError') {
        console.error('[DailyFortune] 공유 오류:', err);
      }
    }
  };

  /** 탭 변경 핸들러 */
  const handleTabChange = (tab: DailyFortuneTabType) => {
    if (tab === 'consultation') {
      // 비로그인 → 로그인 페이지
      if (!user) {
        const callbackUrl = encodeURIComponent(`${pathname}?tab=consultation`);
        router.push(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`);
        return;
      }
      // 본인 소유가 아닌 경우 → 접근 차단
      if (data?.profile?.user_id && data.profile.user_id !== user.id) {
        toast.error(tErrors('AUTH_FORBIDDEN'));
        return;
      }
    }

    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  // URL 파라미터 변경 시 탭 동기화
  useEffect(() => {
    if (tabParam === 'consultation' || tabParam === 'fortune') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (fortuneId) {
      fetchFortune();
    }
    // 클라이언트에서만 날짜 설정
    const today = new Date();
    setDateStr(`${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`);
  }, [fortuneId, fetchFortune]);

  const fortune = data?.data;
  const profileId = data?.profile?.id || fortune?.profile_id;

  // 운세 날짜 포맷팅
  const fortuneDateStr = fortune?.fortune_date
    ? (() => {
        const d = new Date(fortune.fortune_date);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
      })()
    : dateStr;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: BRAND_COLORS.secondary }}>
      {/* AppHeader */}
      <AppHeader
        showBack
        backHref="/home"
        title={t('title')}
        rightSlot={
          state === 'ready' &&
          activeTab === 'fortune' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9 rounded-xl text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Share2 className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )
        }
      />

      {/* 탭 네비게이션 (로딩 완료 후 표시) */}
      {state === 'ready' && (
        <DailyFortuneNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* 탭 컨텐츠 */}
      <AnimatePresence mode="wait">
        {/* 운세 탭 */}
        {activeTab === 'fortune' && (
          <motion.div
            key="fortune-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-3xl px-4 py-6"
          >
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

            {/* 운세 상세 */}
            {state === 'ready' && fortune && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* 프로필 이름 표시 */}
                {data?.profile?.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className="text-sm text-gray-400">
                      <span className="font-medium text-white">{data.profile.name}</span>
                      님의 운세
                    </p>
                  </motion.div>
                )}

                {/* 날짜 + 일진 + 점수 */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#333] bg-gradient-to-br from-[#1a1a1a] to-[#111111] p-6"
                >
                  {/* 날짜 */}
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#d4af37]" />
                    <span className="text-sm text-gray-400">{fortuneDateStr}</span>
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
                  <p className="text-sm leading-relaxed text-gray-300">{fortune.summary}</p>
                </motion.section>

                {/* 행운 정보 */}
                {(fortune.lucky_color || fortune.lucky_number || fortune.lucky_direction) && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl border border-[#333] bg-[#1a1a1a] p-5"
                  >
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
                      <Sparkles className="h-4 w-4 text-[#d4af37]" />
                      {t('luckyInfo')}
                    </h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {fortune.lucky_color && (
                        <div className="rounded-lg bg-[#242424] p-3">
                          <p className="mb-1 text-xs text-gray-500">{t('luckyColor')}</p>
                          <p className="font-medium text-white">{fortune.lucky_color}</p>
                        </div>
                      )}
                      {fortune.lucky_number && (
                        <div className="rounded-lg bg-[#242424] p-3">
                          <p className="mb-1 text-xs text-gray-500">{t('luckyNumber')}</p>
                          <p className="font-medium text-[#d4af37]">{fortune.lucky_number}</p>
                        </div>
                      )}
                      {fortune.lucky_direction && (
                        <div className="rounded-lg bg-[#242424] p-3">
                          <p className="mb-1 text-xs text-gray-500">{t('luckyDirection')}</p>
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
                  <h2 className="mb-4 text-sm font-medium text-white">{t('areaFortunes')}</h2>
                  <div className="space-y-3">
                    <AreaFortuneCard areaKey="career" fortune={fortune.career_fortune} t={t} />
                    <AreaFortuneCard areaKey="wealth" fortune={fortune.wealth_fortune} t={t} />
                    <AreaFortuneCard areaKey="love" fortune={fortune.love_fortune} t={t} />
                    <AreaFortuneCard areaKey="health" fortune={fortune.health_fortune} t={t} />
                    <AreaFortuneCard
                      areaKey="relationship"
                      fortune={fortune.relationship_fortune}
                      t={t}
                    />
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
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#d4af37]">
                      <Lightbulb className="h-4 w-4" />
                      {t('todayAdvice')}
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-300">{fortune.advice}</p>
                  </motion.section>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 상담 탭 */}
        {activeTab === 'consultation' && profileId && (
          <motion.div
            key="consultation-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-4xl"
          >
            <ConsultationTab profileId={profileId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
