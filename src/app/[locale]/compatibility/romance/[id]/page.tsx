'use client';

/**
 * 연인 궁합 - 결과 페이지
 * Premium Celestial Theme Design
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Heart,
  Sparkles,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  Flame,
  Shield,
  Compass,
  Lock,
  Zap,
  MessageCircle,
  ArrowRight,
  Share2,
} from 'lucide-react';

import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CosmicBackground,
  ScoreGauge,
  TabNavigation,
  GlassCard,
  SectionHeader,
  ScoreBar,
  DualScoreBar,
} from '@/components/compatibility/ui';

/** 탭 타입 */
type TabType = 'score' | 'analysis' | 'compare';

/** 이름 3글자 제한 (초과 시 말줄임) */
function truncateName(name: string | undefined | null, maxLength = 3): string {
  if (!name) return 'A';
  return name.length > maxLength ? name.slice(0, maxLength) + '…' : name;
}

/** 텍스트 내 A/B를 실제 이름으로 치환 */
function replaceAB(text: string | undefined | null, nameA: string, nameB: string): string {
  if (!text) return '';
  // 한국어 조사 패턴과 함께 A/B 치환
  // A는, A가, A의, A를, A와, A에게, A도 등
  return text
    .replace(/\bA(?=[는가의를와에도]|$|\s|,|\.)/g, nameA || 'A')
    .replace(/\bB(?=[는가의를와에도]|$|\s|,|\.)/g, nameB || 'B');
}

interface CompatibilityData {
  id: string;
  profileIdA: string;
  profileIdB: string;
  nameA: string;
  nameB: string;
  analysisType: string;
  totalScore: number;
  scores: {
    stemHarmony: { score: number };
    branchHarmony: { score: number };
    elementBalance: { score: number };
    tenGodCompatibility: { score: number };
    wunsengSynergy: { score: number };
    combinationSynergy?: { score: number }; // 삼합/방합 시너지
  };
  traitScoresA: {
    expression: number;
    possessiveness: number;
    devotion: number;
    adventure: number;
    stability: number;
  };
  traitScoresB: {
    expression: number;
    possessiveness: number;
    devotion: number;
    adventure: number;
    stability: number;
  };
  interactions: Record<string, unknown>;
  relationshipType?: {
    keywords: string[];
    firstImpression: string;
    developmentPattern: string;
  };
  traitInterpretation?: {
    items: Array<{
      trait: string;
      aInterpretation: string;
      bInterpretation: string;
      comparison: string;
    }>;
    overall: string;
  };
  conflictAnalysis?: {
    conflictPoints: Array<{
      source: string;
      description: string;
      resolution: string;
    }>;
    avoidBehaviors: string[];
    communicationTips: string;
  };
  marriageFit?: {
    score: number;
    postMarriageChange: string;
    roleDistribution: string;
    childFortune: string;
    wealthSynergy: string;
  };
  mutualInfluence?: {
    aToB: {
      tenGod: string;
      meaning: string;
      positiveInfluence: string;
      caution: string;
    };
    bToA: {
      tenGod: string;
      meaning: string;
      positiveInfluence: string;
      caution: string;
    };
    synergy: string;
  };
  pillarsA?: Record<string, unknown>;
  pillarsB?: Record<string, unknown>;
  daewunA?: unknown[];
  daewunB?: unknown[];
  peachBlossom?: {
    aHasDohwa: boolean;
    bHasDohwa: boolean;
    aDohwaBranch?: string;
    bDohwaBranch?: string;
    mutualAttraction: number;
    attractionBonus: number;
    description: string;
  };
  interactionInterpretation?: {
    peachBlossom?: {
      title: string;
      description: string;
      advice: string;
    };
    samhapBanghap?: {
      formations: { name: string; description: string }[];
      overallMeaning?: string;
      emptyMessage: string;
    };
    stemCombinations?: {
      items: { name: string; description: string }[];
      emptyMessage: string;
    };
    branchCombinations?: {
      items: { name: string; description: string }[];
      emptyMessage: string;
    };
    branchClashes?: {
      items: { name: string; description: string }[];
      emptyMessage: string;
    };
    branchPunishments?: {
      items: { name: string; description: string }[];
      emptyMessage: string;
    };
    branchWonjin?: {
      items: { name: string; description: string }[];
      emptyMessage: string;
    };
  };
  failedSteps?: string[];
  createdAt: string;
}

export default function CompatibilityResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  const locale = useLocale();
  const t = useTranslations('compatibility');

  const [activeTab, setActiveTab] = useState<TabType>('score');
  const [data, setData] = useState<CompatibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  /** 공유 확인 후 실행 */
  const handleConfirmShare = async () => {
    setShowShareDialog(false);
    const shareUrl = `${window.location.origin}/${locale}/compatibility/romance/${analysisId}`;
    const shareTitle = t('share.title', {
      defaultValue: `${data?.nameA}님과 ${data?.nameB}님의 궁합 분석`,
      nameA: data?.nameA || 'A',
      nameB: data?.nameB || 'B',
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('share.copied', { defaultValue: '링크가 복사되었습니다' }));
      }
    } catch (err) {
      // 사용자가 공유 취소한 경우 무시
      if ((err as Error).name !== 'AbortError') {
        console.error('공유 실패:', err);
      }
    }
  };

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analysis/compatibility/${analysisId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message ||
              t('errors.loadFailed', { defaultValue: '데이터를 불러올 수 없습니다' })
          );
        }

        if (result.status !== 'completed') {
          router.push(`/compatibility/romance/${analysisId}/generating`);
          return;
        }

        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('errors.unknown', { defaultValue: '오류가 발생했습니다' })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [analysisId, router]);

  // 총점 등급
  const getScoreGrade = (score: number) => {
    if (score >= 85)
      return { label: t('scoreGrade.perfect', { defaultValue: '천생연분' }), color: '#ef4444' };
    if (score >= 70)
      return { label: t('scoreGrade.good', { defaultValue: '좋은 인연' }), color: '#d4af37' };
    if (score >= 55)
      return { label: t('scoreGrade.average', { defaultValue: '보통' }), color: '#eab308' };
    if (score >= 40)
      return { label: t('scoreGrade.needEffort', { defaultValue: '노력 필요' }), color: '#f97316' };
    return { label: t('scoreGrade.caution', { defaultValue: '주의' }), color: '#8b5cf6' };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-[#d4af37]" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <Loader2 className="h-12 w-12 text-[#d4af37]" />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {t('ui.loadingResult', { defaultValue: '궁합 결과를 불러오는 중...' })}
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050508]">
        <CosmicBackground />
        <AppHeader title={t('result.title', { defaultValue: '궁합 결과' })} />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <GlassCard variant="warning" className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-amber-400" />
            <p className="mb-6 text-lg text-gray-300">
              {error || t('ui.errorLoadData', { defaultValue: '데이터를 불러올 수 없습니다' })}
            </p>
            <Button
              onClick={() => {
                setIsNavigating(true);
                router.push('/compatibility');
              }}
              disabled={isNavigating}
              className="bg-[#d4af37] px-8 py-3 font-semibold text-black hover:bg-[#c9a227] disabled:cursor-wait disabled:opacity-70"
            >
              {isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('buttons.back', { defaultValue: '돌아가기' })}
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const grade = getScoreGrade(data.totalScore);

  return (
    <div className="min-h-screen bg-[#050508]">
      <CosmicBackground />

      {/* 헤더 */}
      <AppHeader
        title={t('result.title', { defaultValue: '궁합 결과' })}
        rightSlot={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShareDialog(true)}
            className="text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        }
      />

      {/* 공유 확인 다이얼로그 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="border-[#333] bg-[#1a1a1a]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {t('share.dialogTitle', { defaultValue: '궁합 분석 공유' })}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('share.dialogDescription', {
                defaultValue:
                  '이 링크를 통해 누구나 두 사람의 사주 정보와 궁합 분석 결과를 볼 수 있습니다. 민감한 정보가 포함되어 있으니 신뢰할 수 있는 분에게만 공유해 주세요.',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(false)}
              className="border-[#333] bg-transparent text-gray-300 hover:bg-[#242424] hover:text-white"
            >
              {t('share.cancel', { defaultValue: '취소' })}
            </Button>
            <Button
              onClick={handleConfirmShare}
              className="bg-[#d4af37] text-black hover:bg-[#c9a227]"
            >
              {t('share.confirm', { defaultValue: '공유하기' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 히어로 섹션 - 총점 */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden py-8"
      >
        {/* 배경 그라데이션 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)',
          }}
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4">
          {/* 점수 게이지 */}
          <ScoreGauge score={data.totalScore} grade={grade} size={200} />

          {/* 부가 정보 */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-4 text-sm text-gray-400"
          >
            {t('ui.scoreDescription', { defaultValue: '100점 만점 기준 · 5개 항목 종합' })}
          </motion.p>

          {/* 하트 장식 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
            className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block"
          >
            <Heart className="h-6 w-6 text-[#d4af37]/30" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: 'spring' }}
            className="absolute -left-4 top-1/3 hidden md:block"
          >
            <Sparkles className="h-5 w-5 text-[#d4af37]/20" />
          </motion.div>
        </div>
      </motion.section>

      {/* 탭 네비게이션 - Safe Area 적용 + AppHeader 아래 위치 */}
      <div
        className="sticky z-20 bg-[#050508]/80 backdrop-blur-lg"
        style={{ top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'score' && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ScoreTab data={data} />
            </motion.div>
          )}
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalysisTab data={data} />
            </motion.div>
          )}
          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CompareTab data={data} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 실패한 단계 경고 */}
      {data.failedSteps && data.failedSteps.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pb-8">
          <GlassCard variant="warning" className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  {t('ui.partialAnalysis', { defaultValue: '분석 일부 누락' })}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t('ui.partialAnalysisDesc', {
                    defaultValue: '일부 분석 단계가 실패하여 결과가 불완전할 수 있습니다.',
                  })}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-8" />
    </div>
  );
}

/** 점수 탭 */
function ScoreTab({ data }: { data: CompatibilityData }) {
  const t = useTranslations('compatibility');

  /** 점수 항목 기본값 */
  const DEFAULT_DESCRIPTIONS = {
    stemHarmony:
      "천간은 사주에서 겉으로 드러나는 성격과 표현 방식을 나타냅니다. 두 사람의 천간이 '합(合)'을 이루면 처음 만났을 때 \"아, 이 사람이다\"라는 느낌을 받으며 자연스럽게 끌립니다. 예를 들어 '갑기합(甲己合)'은 서로의 생각을 존중하고 안정감을 주는 관계이며, '을경합(乙庚合)'은 의리와 신뢰로 맺어지는 인연입니다. 반대로 '극(剋)' 관계가 있으면 대화할 때 의견 충돌이 잦거나 서로의 방식이 달라 답답함을 느낄 수 있습니다. 천간 점수가 높으면 첫인상부터 호감이 가고 대화가 잘 통하며, 점수가 낮더라도 서로의 차이를 이해하려는 노력으로 극복할 수 있습니다.",
    branchHarmony:
      "지지는 사주에서 내면의 감정과 무의식적 반응, 그리고 일상생활의 습관을 나타냅니다. 두 사람의 지지에 '합(合)'이 많으면 함께 있을 때 편안하고 정서적으로 깊이 연결됩니다. '육합(六合)'은 서로를 이해하고 배려하는 따뜻한 관계를, '삼합(三合)'은 같은 방향을 향해 함께 나아가는 동반자 관계를 의미합니다. 반면 '충(冲)'이 있으면 사소한 일에도 감정 충돌이 생기기 쉽고, 서로의 생활 방식이 맞지 않아 스트레스를 받을 수 있습니다. '원진(元嗔)'은 설명하기 어려운 심리적 거리감을 느끼게 하여 가까워지려 해도 어딘가 벽이 느껴지는 관계입니다. 지지 점수가 높으면 오래 함께해도 지치지 않는 편안한 인연입니다.",
    elementBalance:
      "오행은 목(木, 나무)·화(火, 불)·토(土, 흙)·금(金, 쇠)·수(水, 물) 다섯 가지 기운으로, 사람의 성격과 에너지 특성을 나타냅니다. 내가 부족한 기운을 상대가 가지고 있으면 서로 보완하는 이상적인 궁합이 됩니다. 예를 들어 급하고 열정적인 화(火) 기운이 강한 사람에게는 차분하고 유연한 수(水) 기운의 상대가 균형을 잡아주고, 우유부단한 수(水) 기운의 사람에게는 결단력 있는 금(金) 기운의 상대가 방향을 제시해줍니다. 반대로 같은 오행이 과다하면 그 기운의 단점이 증폭될 수 있어 주의가 필요합니다. 오행 균형 점수가 높으면 서로의 부족한 부분을 자연스럽게 채워주는 '음양조화'의 관계입니다.",
    tenGodCompatibility:
      "십신(十神)은 상대방이 나에게 어떤 존재로 느껴지는지를 나타내는 관계의 언어입니다. 상대가 나의 '정재(正財)'나 '정관(正官)'이면 안정적이고 책임감 있는 관계로 결혼 궁합에 좋습니다. '편재(偏財)'는 함께 있으면 즐겁고 활력이 생기는 관계이며, '편관(偏官)'은 강렬하고 열정적인 끌림을 의미합니다. '식신(食神)'은 함께 있으면 편안하고 나를 있는 그대로 표현할 수 있게 해주며, '상관(傷官)'은 자극적이고 새로운 경험을 선사합니다. 상대가 나에게 긍정적인 십신일수록 함께하면 마음이 편안해지고 서로 성장하게 됩니다. 십신 호환성이 높으면 상대와 함께할 때 내가 더 나은 사람이 되는 느낌을 받습니다.",
    wunsengSynergy:
      "12운성은 상대방 곁에서 내 기운이 어떻게 변화하는지를 나타냅니다. 사람의 기운은 태어나서 성장하고 쇠퇴하는 12단계의 순환을 거치는데, 상대방의 사주가 나의 어떤 단계에 해당하는지에 따라 관계의 역학이 달라집니다. '건록(建祿)'이나 '제왕(帝旺)'에 해당하면 상대와 있을 때 자신감이 생기고 에너지가 충전되어 무엇이든 할 수 있을 것 같은 느낌을 받습니다. 반대로 '사(死)'·'묘(墓)'·'절(絶)'에 해당하면 상대에게 맞추느라 지치거나, 나다움을 잃고 위축될 수 있습니다. 12운성 시너지가 높으면 상대와 함께할 때 내 잠재력이 최대로 발휘되는 '상승 궁합'입니다.",
    combinationSynergy:
      '삼합(三合)은 세 개의 지지가 모여 하나의 강력한 오행 기운을 형성하는 특별한 조합입니다. 두 사람의 사주가 합쳐져 삼합이 완성되면, 따로 있을 때보다 함께 있을 때 훨씬 더 큰 에너지와 시너지가 생깁니다. 마치 "둘이 만나니까 일이 술술 풀린다"는 느낌이 드는 운명적 인연입니다. 방합(方合)은 같은 계절의 세 지지가 모여 그 계절의 기운을 극대화하는 조합으로, 함께하면 특정 분야에서 놀라운 성과를 낼 수 있습니다. 반합(半合)은 삼합의 두 요소만 갖춘 상태로, 완전한 삼합보다는 약하지만 여전히 긍정적인 시너지를 제공합니다. 이 점수가 높으면 두 사람이 만나 새로운 가능성을 여는 \'창조적 궁합\'입니다.',
  };

  const scoreItems = [
    {
      key: 'stemHarmony',
      label: t('scores.stemHarmony.label', { defaultValue: '천간 조화' }),
      score: data.scores.stemHarmony?.score ?? 0,
      weight: t('scores.stemHarmony.weight', { defaultValue: '24%' }),
      icon: <TrendingUp className="h-4 w-4" />,
      description: t('scores.stemHarmony.description', {
        defaultValue: DEFAULT_DESCRIPTIONS.stemHarmony,
      }),
    },
    {
      key: 'branchHarmony',
      label: t('scores.branchHarmony.label', { defaultValue: '지지 조화' }),
      score: data.scores.branchHarmony?.score ?? 0,
      weight: t('scores.branchHarmony.weight', { defaultValue: '24%' }),
      icon: <Users className="h-4 w-4" />,
      description: t('scores.branchHarmony.description', {
        defaultValue: DEFAULT_DESCRIPTIONS.branchHarmony,
      }),
    },
    {
      key: 'elementBalance',
      label: t('scores.elementBalance.label', { defaultValue: '오행 균형' }),
      score: data.scores.elementBalance?.score ?? 0,
      weight: t('scores.elementBalance.weight', { defaultValue: '19%' }),
      icon: <Compass className="h-4 w-4" />,
      description: t('scores.elementBalance.description', {
        defaultValue: DEFAULT_DESCRIPTIONS.elementBalance,
      }),
    },
    {
      key: 'tenGodCompatibility',
      label: t('scores.tenGodCompatibility.label', { defaultValue: '십신 호환성' }),
      score: data.scores.tenGodCompatibility?.score ?? 0,
      weight: t('scores.tenGodCompatibility.weight', { defaultValue: '19%' }),
      icon: <Heart className="h-4 w-4" />,
      description: t('scores.tenGodCompatibility.description', {
        defaultValue: DEFAULT_DESCRIPTIONS.tenGodCompatibility,
      }),
    },
    {
      key: 'wunsengSynergy',
      label: t('scores.wunsengSynergy.label', { defaultValue: '12운성 시너지' }),
      score: data.scores.wunsengSynergy?.score ?? 0,
      weight: t('scores.wunsengSynergy.weight', { defaultValue: '9%' }),
      icon: <Sparkles className="h-4 w-4" />,
      description: t('scores.wunsengSynergy.description', {
        defaultValue: DEFAULT_DESCRIPTIONS.wunsengSynergy,
      }),
    },
    {
      key: 'combinationSynergy',
      label: t('scores.combinationSynergy.label', { defaultValue: '삼합/방합 시너지' }),
      score: data.scores.combinationSynergy?.score ?? 0,
      weight: t('scores.combinationSynergy.weight', { defaultValue: '5%' }),
      icon: <Zap className="h-4 w-4" />,
      description: t('scores.combinationSynergy.description', {
        defaultValue: DEFAULT_DESCRIPTIONS.combinationSynergy,
      }),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6개 항목 점수 */}
      <GlassCard className="p-6">
        <SectionHeader
          title={t('sections.detailScores', { defaultValue: '상세 점수' })}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <div className="space-y-5">
          {scoreItems.map((item, index) => (
            <div key={item.key}>
              <ScoreBar
                score={item.score}
                label={item.label}
                sublabel={item.weight}
                delay={index * 0.1}
              />
              <p className="mt-1 text-xs text-gray-300">{item.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 연애 스타일 비교 */}
      <GlassCard className="p-6">
        <SectionHeader
          title={t('sections.traitComparison', { defaultValue: '연애 스타일 비교' })}
          icon={<Heart className="h-4 w-4" />}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <DualScoreBar
            label={t('traitLabels.expression', { defaultValue: '표현력' })}
            scoreA={data.traitScoresA.expression}
            scoreB={data.traitScoresB.expression}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0}
          />
          <DualScoreBar
            label={t('traitLabels.possessiveness', { defaultValue: '독점욕' })}
            scoreA={data.traitScoresA.possessiveness}
            scoreB={data.traitScoresB.possessiveness}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.1}
          />
          <DualScoreBar
            label={t('traitLabels.devotion', { defaultValue: '헌신도' })}
            scoreA={data.traitScoresA.devotion}
            scoreB={data.traitScoresB.devotion}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.2}
          />
          <DualScoreBar
            label={t('traitLabels.adventure', { defaultValue: '모험심' })}
            scoreA={data.traitScoresA.adventure}
            scoreB={data.traitScoresB.adventure}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.3}
          />
          <DualScoreBar
            label={t('traitLabels.stability', { defaultValue: '안정추구' })}
            scoreA={data.traitScoresA.stability}
            scoreB={data.traitScoresB.stability}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.4}
          />
        </div>
      </GlassCard>
    </div>
  );
}

/** 분석 탭 */
function AnalysisTab({ data }: { data: CompatibilityData }) {
  const t = useTranslations('compatibility');

  return (
    <div className="space-y-6">
      {/* 인연의 성격 */}
      {data.relationshipType && (
        <GlassCard variant="highlight" className="p-6">
          <SectionHeader
            title={t('sections.relationshipType', { defaultValue: '인연의 성격' })}
            icon={<Sparkles className="h-4 w-4" />}
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {data.relationshipType.keywords.map((keyword, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#d4af37',
                }}
              >
                {keyword}
              </motion.span>
            ))}
          </div>
          <p className="leading-relaxed text-gray-300">
            {replaceAB(data.relationshipType.firstImpression, data.nameA, data.nameB)}
          </p>
          <div className="mt-4 rounded-lg bg-white/5 p-4">
            <p className="text-sm text-gray-400">
              {replaceAB(data.relationshipType.developmentPattern, data.nameA, data.nameB)}
            </p>
          </div>
        </GlassCard>
      )}

      {/* 갈등 포인트 */}
      {data.conflictAnalysis && data.conflictAnalysis.conflictPoints.length > 0 && (
        <GlassCard className="p-6">
          <SectionHeader
            title={t('sections.conflictPoints', { defaultValue: '갈등 포인트' })}
            icon={<Flame className="h-4 w-4" />}
          />
          <div className="space-y-3">
            {data.conflictAnalysis.conflictPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <p className="font-medium text-amber-400">{point.source}</p>
                </div>
                <p className="text-sm text-gray-300">
                  {replaceAB(point.description, data.nameA, data.nameB)}
                </p>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-950/30 p-3">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <p className="text-sm text-green-400">
                    {replaceAB(point.resolution, data.nameA, data.nameB)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          {data.conflictAnalysis.communicationTips && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />
              <div>
                <p className="text-sm font-medium text-[#d4af37]">
                  {t('communicationTips', { defaultValue: '소통 팁' })}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  {replaceAB(data.conflictAnalysis.communicationTips, data.nameA, data.nameB)}
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* 결혼 적합도 */}
      {data.marriageFit && (
        <GlassCard className="p-6">
          <SectionHeader
            title={t('sections.marriageFit', { defaultValue: '결혼 적합도' })}
            icon={<Shield className="h-4 w-4" />}
          />
          <div className="mb-4 flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
              }}
            >
              <span className="text-2xl font-bold text-[#d4af37]">{data.marriageFit.score}</span>
            </div>
            <p className="flex-1 text-gray-300">
              {replaceAB(data.marriageFit.postMarriageChange, data.nameA, data.nameB)}
            </p>
          </div>
          <div className="grid gap-3">
            {[
              {
                label: t('marriageFitLabels.roleDistribution', { defaultValue: '역할 분담' }),
                value: data.marriageFit.roleDistribution,
              },
              {
                label: t('marriageFitLabels.childFortune', { defaultValue: '자녀운' }),
                value: data.marriageFit.childFortune,
              },
              {
                label: t('marriageFitLabels.wealthSynergy', { defaultValue: '재물 시너지' }),
                value: data.marriageFit.wealthSynergy,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <p className="mb-1 text-xs font-medium text-gray-500">{item.label}</p>
                <p className="text-sm text-gray-300">
                  {replaceAB(item.value, data.nameA, data.nameB)}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 상호 영향 */}
      {data.mutualInfluence && (
        <GlassCard className="p-6">
          <SectionHeader
            title={t('sections.mutualInfluence', { defaultValue: '상호 영향' })}
            icon={<Zap className="h-4 w-4" />}
          />
          <div className="space-y-4">
            {/* A → B */}
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #c9a227)', color: '#000' }}
                  title={data.nameA || 'A'}
                >
                  {truncateName(data.nameA)}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <div
                  className="flex shrink-0 items-center justify-center rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white"
                  title={data.nameB || 'B'}
                >
                  {truncateName(data.nameB)}
                </div>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                  {data.mutualInfluence.aToB.tenGod}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {replaceAB(data.mutualInfluence.aToB.positiveInfluence, data.nameA, data.nameB)}
              </p>
              <p className="mt-2 text-xs text-amber-400/80">
                <Lock className="mr-1 inline-block h-3 w-3" />
                {t('ui.caution', { defaultValue: '주의:' })}{' '}
                {replaceAB(data.mutualInfluence.aToB.caution, data.nameA, data.nameB)}
              </p>
            </div>

            {/* B → A */}
            <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white"
                  title={data.nameB || 'B'}
                >
                  {truncateName(data.nameB)}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <div
                  className="flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #c9a227)', color: '#000' }}
                  title={data.nameA || 'A'}
                >
                  {truncateName(data.nameA)}
                </div>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                  {data.mutualInfluence.bToA.tenGod}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {replaceAB(data.mutualInfluence.bToA.positiveInfluence, data.nameA, data.nameB)}
              </p>
              <p className="mt-2 text-xs text-amber-400/80">
                <Lock className="mr-1 inline-block h-3 w-3" />
                {t('ui.caution', { defaultValue: '주의:' })}{' '}
                {replaceAB(data.mutualInfluence.bToA.caution, data.nameA, data.nameB)}
              </p>
            </div>

            {/* 시너지 */}
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-sm text-gray-400">
                {replaceAB(data.mutualInfluence.synergy, data.nameA, data.nameB)}
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

/** 비교 탭 */
function CompareTab({ data }: { data: CompatibilityData }) {
  const t = useTranslations('compatibility');

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <SectionHeader
          title={t('sections.sajuComparison', { defaultValue: '사주 명식 비교' })}
          icon={<Users className="h-4 w-4" />}
        />

        {data.pillarsA && data.pillarsB ? (
          <div className="grid gap-4 md:grid-cols-2">
            {/* A의 사주 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #c9a227)', color: '#000' }}
                  title={data.nameA || 'A'}
                >
                  {truncateName(data.nameA)}
                </div>
                <span className="font-medium text-white">
                  {t('ui.personSaju', {
                    name: data.nameA || 'A',
                    defaultValue: `${data.nameA || 'A'}님의 사주`,
                  })}
                </span>
              </div>
              <PillarDisplay pillars={data.pillarsA} t={t} />
            </motion.div>

            {/* B의 사주 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full bg-pink-500 px-2 py-0.5 text-sm font-bold text-white"
                  title={data.nameB || 'B'}
                >
                  {truncateName(data.nameB)}
                </div>
                <span className="font-medium text-white">
                  {t('ui.personSaju', {
                    name: data.nameB || 'B',
                    defaultValue: `${data.nameB || 'B'}님의 사주`,
                  })}
                </span>
              </div>
              <PillarDisplay pillars={data.pillarsB} t={t} />
            </motion.div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-400">
              {t('ui.noSajuInfo', { defaultValue: '사주 정보가 없습니다.' })}
            </p>
          </div>
        )}
      </GlassCard>

      {/* 간지 상호작용 */}
      <GlassCard className="p-6">
        <SectionHeader
          title={t('sections.interactions', { defaultValue: '간지 상호작용' })}
          icon={<Zap className="h-4 w-4" />}
        />
        <InteractionDisplay
          interactions={data.interactions || {}}
          peachBlossom={
            ((data.interactions as Record<string, unknown>)
              ?.peachBlossom as typeof data.peachBlossom) || data.peachBlossom
          }
          interpretation={data.interactionInterpretation}
          nameA={data.nameA}
          nameB={data.nameB}
          t={t}
        />
      </GlassCard>
    </div>
  );
}

/** 용어 해설 매핑 (한자 + 음절 + 뜻) */
const TERM_EXPLANATIONS: Record<string, string> = {
  // 천간 합 (5합)
  갑기합토: '甲(갑)+己(기) → 土(토, 흙) 기운 생성 - 안정과 신뢰의 결합',
  을경합금: '乙(을)+庚(경) → 金(금, 쇠) 기운 생성 - 결단과 의리의 결합',
  병신합수: '丙(병)+辛(신) → 水(수, 물) 기운 생성 - 지혜와 유연함의 결합',
  정임합목: '丁(정)+壬(임) → 木(목, 나무) 기운 생성 - 성장과 발전의 결합',
  무계합화: '戊(무)+癸(계) → 火(화, 불) 기운 생성 - 열정과 활력의 결합',
  // 삼합
  '인오술 화국': '寅(인)+午(오)+戌(술) → 火局(화국) - 열정적이고 활동적인 에너지',
  '신자진 수국': '申(신)+子(자)+辰(진) → 水局(수국) - 지혜롭고 유연한 교류',
  '사유축 금국': '巳(사)+酉(유)+丑(축) → 金局(금국) - 실리적이고 결속력 있는 관계',
  '해묘미 목국': '亥(해)+卯(묘)+未(미) → 木局(목국) - 성장하고 발전하는 인연',
  // 방합
  '인묘진 목방': '寅(인)+卯(묘)+辰(진) → 木方(목방) - 봄의 나무 기운',
  '사오미 화방': '巳(사)+午(오)+未(미) → 火方(화방) - 여름의 불 기운',
  '신유술 금방': '申(신)+酉(유)+戌(술) → 金方(금방) - 가을의 쇠 기운',
  '해자축 수방': '亥(해)+子(자)+丑(축) → 水方(수방) - 겨울의 물 기운',
  // 지지 합 (6합)
  자축합토: '子(자)+丑(축) → 土(토, 흙) - 안정적인 결합',
  인해합목: '寅(인)+亥(해) → 木(목, 나무) - 발전하는 관계',
  묘술합화: '卯(묘)+戌(술) → 火(화, 불) - 열정적인 만남',
  진유합금: '辰(진)+酉(유) → 金(금, 쇠) - 단단한 결속',
  사신합수: '巳(사)+申(신) → 水(수, 물) - 원활한 소통',
  오미합화: '午(오)+未(미) → 火(화, 불) - 열정적인 교류',
  // 충 (6충)
  자오충: '子(자)↔午(오) 충돌 - 감정적 갈등, 마음이 어긋남',
  축미충: '丑(축)↔未(미) 충돌 - 가치관 차이, 고집 충돌',
  인신충: '寅(인)↔申(신) 충돌 - 활동 방향 충돌',
  묘유충: '卯(묘)↔酉(유) 충돌 - 의견 대립, 날카로운 마찰',
  진술충: '辰(진)↔戌(술) 충돌 - 환경 변화로 인한 갈등',
  사해충: '巳(사)↔亥(해) 충돌 - 이동/변화 관련 마찰',
  // 형 (3형)
  인사형: '寅(인)+巳(사) 형벌 - 권력 다툼, 경쟁 갈등',
  인신형: '寅(인)+申(신) 형벌 - 무은지형, 배신 주의',
  사신형: '巳(사)+申(신) 형벌 - 의리 갈등',
  축술형: '丑(축)+戌(술) 형벌 - 고집으로 인한 마찰',
  축미형: '丑(축)+未(미) 형벌 - 가치관 대립',
  술미형: '戌(술)+未(미) 형벌 - 완고함 충돌',
  자묘형: '子(자)+卯(묘) 형벌 - 무례지형, 예의 갈등',
  오오자형: '午(오)+午(오)+子(자) 무례지형 - 감정 충돌, 예의 문제',
  // 원진
  자유원진: '子(자)↔酉(유) 원진 - 심리적 거리감',
  축오원진: '丑(축)↔午(오) 원진 - 서로 밀어내는 기운',
  인미원진: '寅(인)↔未(미) 원진 - 뜻이 맞지 않음',
  묘신원진: '卯(묘)↔申(신) 원진 - 방향성 차이',
  진해원진: '辰(진)↔亥(해) 원진 - 환경적 부조화',
  사술원진: '巳(사)↔戌(술) 원진 - 시기적 어긋남',
};

/** 간지 상호작용 표시 컴포넌트 */
function InteractionDisplay({
  interactions,
  peachBlossom,
  interpretation,
  nameA,
  nameB,
  t,
}: {
  interactions: Record<string, unknown>;
  peachBlossom?: {
    aHasDohwa: boolean;
    bHasDohwa: boolean;
    aDohwaBranch?: string;
    bDohwaBranch?: string;
    mutualAttraction: number;
    attractionBonus: number;
    description: string;
  };
  interpretation?: CompatibilityData['interactionInterpretation'];
  nameA: string;
  nameB: string;
  t: ReturnType<typeof useTranslations<'compatibility'>>;
}) {
  // 타입 정의
  type InteractionItem = { name: string; formed?: boolean };

  const stemCombinations = (interactions?.stemCombinations || []) as InteractionItem[];
  const branchCombinations = (interactions?.branchCombinations || []) as InteractionItem[];
  const branchClashes = (interactions?.branchClashes || []) as InteractionItem[];
  const branchPunishments = (interactions?.branchPunishments || []) as InteractionItem[];
  const branchWonjin = (interactions?.branchWonjin || []) as InteractionItem[];
  const samhapFormed = (interactions?.samhapFormed || []) as InteractionItem[];
  const banhapFormed = (interactions?.banhapFormed || []) as InteractionItem[];
  const banghapFormed = (interactions?.banghapFormed || []) as InteractionItem[];

  /** 용어에 대한 설명을 반환 */
  const getExplanation = (name: string): string => {
    const key = name.toLowerCase().replace(/\s/g, ' ');
    return TERM_EXPLANATIONS[key] || '';
  };

  /** 설명을 한자/의미로 분리하여 표시하는 컴포넌트 */
  const ExplanationText = ({ name }: { name: string }) => {
    const explanation = getExplanation(name);
    if (!explanation) return null;

    const dashIndex = explanation.lastIndexOf(' - ');
    if (dashIndex === -1) {
      return <span className="text-xs text-gray-400">{explanation}</span>;
    }

    const hanja = explanation.slice(0, dashIndex);
    const meaning = explanation.slice(dashIndex + 3);

    return (
      <div className="text-xs">
        <span className="text-gray-500">{hanja}</span>
        <span className="block text-gray-300">{meaning}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 도화살 (항상 표시) */}
      <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-400" />
          <span className="font-medium text-pink-400">
            {interpretation?.peachBlossom?.title ||
              t('interactionSections.peachBlossom.title', { defaultValue: '도화살 (桃花煞)' })}
          </span>
          {peachBlossom && (
            <span className="ml-auto rounded-full bg-pink-500/20 px-2 py-0.5 text-xs text-pink-300">
              +{peachBlossom.attractionBonus}
              {t('history.scoreUnit', { defaultValue: '점' })}
            </span>
          )}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {t('interactionSections.peachBlossom.description', {
            defaultValue: '연지/일지 기준으로 특별한 이성 끌림을 나타내는 살(煞)',
          })}
        </p>
        {interpretation?.peachBlossom ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">{interpretation.peachBlossom.description}</p>
            {interpretation.peachBlossom.advice && (
              <p className="text-xs text-gray-500">💡 {interpretation.peachBlossom.advice}</p>
            )}
          </div>
        ) : peachBlossom ? (
          <p className="text-sm text-gray-300">
            {replaceAB(peachBlossom.description, nameA, nameB)}
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            {t('interactionSections.peachBlossom.empty', {
              defaultValue:
                '도화살이 없습니다. 강렬한 끌림보다는 차분하고 안정적인 관계를 형성합니다.',
            })}
          </p>
        )}
      </div>

      {/* 삼합/방합 (항상 표시) */}
      <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#d4af37]" />
          <span className="font-medium text-[#d4af37]">
            {t('interactionSections.samhapBanghap.title', {
              defaultValue: '삼합·방합 (三合·方合)',
            })}
          </span>
        </div>
        <p className="mb-3 text-xs text-gray-500">
          {t('interactionSections.samhapBanghap.description', {
            defaultValue: '세 지지가 모여 강력한 오행 기운을 형성하는 특별한 결합',
          })}
        </p>
        {samhapFormed.length > 0 || banhapFormed.length > 0 || banghapFormed.length > 0 ? (
          <div className="space-y-3">
            {/* Gemini interpretation 우선 사용 (빈 배열 체크) */}
            {(interpretation?.samhapBanghap?.formations?.length ?? 0) > 0 ? (
              interpretation!.samhapBanghap!.formations!.map((item, i) => (
                <div key={`formation-${i}`} className="flex flex-col gap-1">
                  <span className="inline-block w-fit rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm text-[#d4af37]">
                    {item.name}
                  </span>
                  <p className="text-sm text-gray-300">{item.description}</p>
                </div>
              ))
            ) : (
              <>
                {samhapFormed.map((item, i) => (
                  <div key={`samhap-${i}`} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm text-[#d4af37]">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
                {banhapFormed.map((item, i) => (
                  <div key={`banhap-${i}`} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-400">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
                {banghapFormed.map((item, i) => (
                  <div key={`banghap-${i}`} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
              </>
            )}
            {interpretation?.samhapBanghap?.overallMeaning && (
              <p className="mt-2 text-xs text-gray-500">
                ✨ {interpretation.samhapBanghap.overallMeaning}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {interpretation?.samhapBanghap?.emptyMessage ||
              t('interactionSections.samhapBanghap.empty', {
                defaultValue:
                  '삼합·방합 형성이 없습니다. 특별한 시너지보다는 개별적인 조화를 이룹니다.',
              })}
          </p>
        )}
      </div>

      {/* 천간 합 (항상 표시) */}
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
        <div className="mb-2 text-xs font-medium text-green-400">
          {t('interactionSections.stemCombinations.title', { defaultValue: '천간 합 (天干合)' })}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {t('interactionSections.stemCombinations.description', {
            defaultValue: '두 천간이 만나 새로운 오행 기운을 생성하는 조화로운 관계',
          })}
        </p>
        {stemCombinations.length > 0 ? (
          <div className="space-y-2">
            {(interpretation?.stemCombinations?.items?.length ?? 0) > 0
              ? interpretation!.stemCombinations!.items!.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">
                      {item.name}
                    </span>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))
              : stemCombinations.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {interpretation?.stemCombinations?.emptyMessage ||
              t('interactionSections.stemCombinations.empty', {
                defaultValue: '천간 합이 없습니다. 표면적 조화보다 내면의 균형이 중요합니다.',
              })}
          </p>
        )}
      </div>

      {/* 지지 합 (항상 표시) */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="mb-2 text-xs font-medium text-blue-400">
          {t('interactionSections.branchCombinations.title', {
            defaultValue: '지지 합 (地支合, 6합)',
          })}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {t('interactionSections.branchCombinations.description', {
            defaultValue: '두 지지가 합쳐져 새로운 오행을 만드는 친밀한 관계',
          })}
        </p>
        {branchCombinations.length > 0 ? (
          <div className="space-y-2">
            {(interpretation?.branchCombinations?.items?.length ?? 0) > 0
              ? interpretation!.branchCombinations!.items!.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
                      {item.name}
                    </span>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))
              : branchCombinations.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {interpretation?.branchCombinations?.emptyMessage ||
              t('interactionSections.branchCombinations.empty', {
                defaultValue: '지지 합이 없습니다. 감정적 결합보다 이성적 조화가 두드러집니다.',
              })}
          </p>
        )}
      </div>

      {/* 지지 충 (항상 표시) */}
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
        <div className="mb-2 text-xs font-medium text-red-400">
          {t('interactionSections.branchClashes.title', { defaultValue: '지지 충 (地支冲, 6충)' })}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {t('interactionSections.branchClashes.description', {
            defaultValue: '서로 반대 방향의 기운이 부딪혀 갈등을 일으키는 관계',
          })}
        </p>
        {branchClashes.length > 0 ? (
          <div className="space-y-2">
            {(interpretation?.branchClashes?.items?.length ?? 0) > 0
              ? interpretation!.branchClashes!.items!.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">
                      {item.name}
                    </span>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))
              : branchClashes.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {interpretation?.branchClashes?.emptyMessage ||
              t('interactionSections.branchClashes.empty', {
                defaultValue: '지지 충이 없습니다. 큰 갈등 없이 안정적인 관계가 가능합니다.',
              })}
          </p>
        )}
      </div>

      {/* 지지 형 (항상 표시) */}
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
        <div className="mb-2 text-xs font-medium text-orange-400">
          {t('interactionSections.branchPunishments.title', {
            defaultValue: '지지 형 (地支刑, 3형)',
          })}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {t('interactionSections.branchPunishments.description', {
            defaultValue: '특정 지지들이 만나 형벌처럼 마찰을 일으키는 관계',
          })}
        </p>
        {branchPunishments.length > 0 ? (
          <div className="space-y-2">
            {(interpretation?.branchPunishments?.items?.length ?? 0) > 0
              ? interpretation!.branchPunishments!.items!.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">
                      {item.name}
                    </span>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))
              : branchPunishments.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300">
                      {item.name}
                    </span>
                    <ExplanationText name={item.name} />
                  </div>
                ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {interpretation?.branchPunishments?.emptyMessage ||
              t('interactionSections.branchPunishments.empty', {
                defaultValue: '지지 형이 없습니다. 상호 자극보다 부드러운 관계가 유지됩니다.',
              })}
          </p>
        )}
      </div>

      {/* 원진 (항상 표시) */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
        <div className="mb-2 text-xs font-medium text-purple-400">
          {t('interactionSections.wonjin.title', { defaultValue: '원진 (元嗔)' })}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {t('interactionSections.wonjin.description', {
            defaultValue: '서로 밀어내는 기운으로 은근한 심리적 갈등을 유발하는 관계',
          })}
        </p>
        {branchWonjin.length > 0 ? (
          <div className="space-y-2">
            {(interpretation?.branchWonjin?.items?.length ?? 0) > 0
              ? interpretation!.branchWonjin!.items!.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300">
                      {item.name}
                    </span>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))
              : branchWonjin.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="inline-block w-fit rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300">
                      {item.name || `${(item as { branches?: string[] }).branches?.join('')}원진`}
                    </span>
                    <ExplanationText
                      name={
                        item.name || `${(item as { branches?: string[] }).branches?.join('')}원진`
                      }
                    />
                  </div>
                ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {interpretation?.branchWonjin?.emptyMessage ||
              t('interactionSections.wonjin.empty', {
                defaultValue:
                  '원진 관계가 없습니다. 심리적 거리감 없이 자연스럽게 가까워질 수 있습니다.',
              })}
          </p>
        )}
      </div>
    </div>
  );
}

/** 사주 표시 컴포넌트 */
function PillarDisplay({
  pillars,
  t,
}: {
  pillars: Record<string, unknown>;
  t: ReturnType<typeof useTranslations<'compatibility'>>;
}) {
  const positions = ['hour', 'day', 'month', 'year'];
  const positionLabels: Record<string, string> = {
    hour: t('pillarLabels.hour', { defaultValue: '시주' }),
    day: t('pillarLabels.day', { defaultValue: '일주' }),
    month: t('pillarLabels.month', { defaultValue: '월주' }),
    year: t('pillarLabels.year', { defaultValue: '년주' }),
  };

  // 오행 색상
  const getElementColor = (element?: string) => {
    const colors: Record<string, string> = {
      木: '#4ade80',
      火: '#ef4444',
      土: '#f59e0b',
      金: '#e5e7eb',
      水: '#60a5fa',
    };
    return element ? colors[element] || '#888' : '#888';
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {positions.map((pos) => {
        const pillar = pillars[pos] as
          | {
              stem?: string;
              branch?: string;
              stemElement?: string;
              branchElement?: string;
              element?: string;
            }
          | undefined;
        // stemElement/branchElement가 없으면 element 필드 fallback
        const stemEl = pillar?.stemElement || pillar?.element;
        const branchEl = pillar?.branchElement || pillar?.element;
        return (
          <div key={pos} className="text-center">
            <p className="mb-1 text-[10px] text-gray-500">{positionLabels[pos]}</p>
            <div
              className="mb-1 flex h-8 items-center justify-center rounded-md text-sm font-medium"
              style={{
                backgroundColor: `${getElementColor(stemEl)}20`,
                color: getElementColor(stemEl),
              }}
            >
              {pillar?.stem || '-'}
            </div>
            <div
              className="flex h-8 items-center justify-center rounded-md text-sm font-medium"
              style={{
                backgroundColor: `${getElementColor(branchEl)}20`,
                color: getElementColor(branchEl),
              }}
            >
              {pillar?.branch || '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
