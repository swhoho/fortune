'use client';

/**
 * 연인 궁합 - 결과 페이지
 * Premium Celestial Theme Design
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
} from 'lucide-react';

import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
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
function truncateName(name: string, maxLength = 3): string {
  return name.length > maxLength ? name.slice(0, maxLength) + '…' : name;
}

/** 텍스트 내 A/B를 실제 이름으로 치환 */
function replaceAB(text: string, nameA: string, nameB: string): string {
  // 한국어 조사 패턴과 함께 A/B 치환
  // A는, A가, A의, A를, A와, A에게, A도 등
  return text
    .replace(/\bA(?=[는가의를와에도]|$|\s|,|\.)/g, nameA)
    .replace(/\bB(?=[는가의를와에도]|$|\s|,|\.)/g, nameB);
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
    combinationSynergy?: { score: number };  // 삼합/방합 시너지
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
  failedSteps?: string[];
  createdAt: string;
}

export default function CompatibilityResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  const t = useTranslations('compatibility');

  const [activeTab, setActiveTab] = useState<TabType>('score');
  const [data, setData] = useState<CompatibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analysis/compatibility/${analysisId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || '데이터를 불러올 수 없습니다');
        }

        if (result.status !== 'completed') {
          router.push(`/compatibility/romance/${analysisId}/generating`);
          return;
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [analysisId, router]);

  // 총점 등급
  const getScoreGrade = (score: number) => {
    if (score >= 85) return { label: '천생연분', color: '#ef4444' };
    if (score >= 70) return { label: '좋은 인연', color: '#d4af37' };
    if (score >= 55) return { label: '보통', color: '#eab308' };
    if (score >= 40) return { label: '노력 필요', color: '#f97316' };
    return { label: '주의', color: '#8b5cf6' };
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
          <p className="text-sm text-gray-400">궁합 결과를 불러오는 중...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050508]">
        <CosmicBackground />
        <AppHeader title="궁합 결과" />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <GlassCard variant="warning" className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-amber-400" />
            <p className="mb-6 text-lg text-gray-300">{error || '데이터를 불러올 수 없습니다'}</p>
            <Button
              onClick={() => router.push('/compatibility')}
              className="bg-[#d4af37] px-8 py-3 font-semibold text-black hover:bg-[#c9a227]"
            >
              돌아가기
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
      <AppHeader title={t('result.title', { defaultValue: '궁합 결과' })} />

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
            100점 만점 기준 · 5개 항목 종합
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

      {/* 탭 네비게이션 */}
      <div className="sticky top-0 z-20 bg-[#050508]/80 backdrop-blur-lg">
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
                <p className="text-sm font-medium text-amber-400">분석 일부 누락</p>
                <p className="mt-1 text-xs text-gray-400">
                  일부 분석 단계가 실패하여 결과가 불완전할 수 있습니다.
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
  const scoreItems = [
    {
      label: '천간 조화',
      score: data.scores.stemHarmony?.score ?? 0,
      weight: '24%',
      icon: <TrendingUp className="h-4 w-4" />,
      description: '두 사람의 천간이 얼마나 조화롭게 어울리는지',
    },
    {
      label: '지지 조화',
      score: data.scores.branchHarmony?.score ?? 0,
      weight: '24%',
      icon: <Users className="h-4 w-4" />,
      description: '지지의 합, 충, 형, 원진 관계 분석',
    },
    {
      label: '오행 균형',
      score: data.scores.elementBalance?.score ?? 0,
      weight: '19%',
      icon: <Compass className="h-4 w-4" />,
      description: '서로의 오행이 보완되는 정도',
    },
    {
      label: '십신 호환성',
      score: data.scores.tenGodCompatibility?.score ?? 0,
      weight: '19%',
      icon: <Heart className="h-4 w-4" />,
      description: '십신 관계로 본 궁합',
    },
    {
      label: '12운성 시너지',
      score: data.scores.wunsengSynergy?.score ?? 0,
      weight: '9%',
      icon: <Sparkles className="h-4 w-4" />,
      description: '에너지 레벨의 조화',
    },
    {
      label: '삼합/방합 시너지',
      score: data.scores.combinationSynergy?.score ?? 0,
      weight: '5%',
      icon: <Zap className="h-4 w-4" />,
      description: '삼합·방합으로 형성되는 특별한 결합력',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6개 항목 점수 */}
      <GlassCard className="p-6">
        <SectionHeader
          title="상세 점수"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <div className="space-y-5">
          {scoreItems.map((item, index) => (
            <div key={item.label}>
              <ScoreBar
                score={item.score}
                label={item.label}
                sublabel={item.weight}
                delay={index * 0.1}
              />
              <p className="mt-1 text-xs text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 연애 스타일 비교 */}
      <GlassCard className="p-6">
        <SectionHeader
          title="연애 스타일 비교"
          icon={<Heart className="h-4 w-4" />}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <DualScoreBar
            label="표현력"
            scoreA={data.traitScoresA.expression}
            scoreB={data.traitScoresB.expression}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0}
          />
          <DualScoreBar
            label="독점욕"
            scoreA={data.traitScoresA.possessiveness}
            scoreB={data.traitScoresB.possessiveness}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.1}
          />
          <DualScoreBar
            label="헌신도"
            scoreA={data.traitScoresA.devotion}
            scoreB={data.traitScoresB.devotion}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.2}
          />
          <DualScoreBar
            label="모험심"
            scoreA={data.traitScoresA.adventure}
            scoreB={data.traitScoresB.adventure}
            nameA={data.nameA}
            nameB={data.nameB}
            delay={0.3}
          />
          <DualScoreBar
            label="안정추구"
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
  return (
    <div className="space-y-6">
      {/* 인연의 성격 */}
      {data.relationshipType && (
        <GlassCard variant="highlight" className="p-6">
          <SectionHeader
            title="인연의 성격"
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
            <p className="text-sm text-gray-400">{replaceAB(data.relationshipType.developmentPattern, data.nameA, data.nameB)}</p>
          </div>
        </GlassCard>
      )}

      {/* 갈등 포인트 */}
      {data.conflictAnalysis && data.conflictAnalysis.conflictPoints.length > 0 && (
        <GlassCard className="p-6">
          <SectionHeader
            title="갈등 포인트"
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
                <p className="text-sm text-gray-300">{replaceAB(point.description, data.nameA, data.nameB)}</p>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-950/30 p-3">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <p className="text-sm text-green-400">{replaceAB(point.resolution, data.nameA, data.nameB)}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {data.conflictAnalysis.communicationTips && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />
              <div>
                <p className="text-sm font-medium text-[#d4af37]">소통 팁</p>
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
            title="결혼 적합도"
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
            <p className="flex-1 text-gray-300">{replaceAB(data.marriageFit.postMarriageChange, data.nameA, data.nameB)}</p>
          </div>
          <div className="grid gap-3">
            {[
              { label: '역할 분담', value: data.marriageFit.roleDistribution },
              { label: '자녀운', value: data.marriageFit.childFortune },
              { label: '재물 시너지', value: data.marriageFit.wealthSynergy },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <p className="mb-1 text-xs font-medium text-gray-500">{item.label}</p>
                <p className="text-sm text-gray-300">{replaceAB(item.value, data.nameA, data.nameB)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 상호 영향 */}
      {data.mutualInfluence && (
        <GlassCard className="p-6">
          <SectionHeader
            title="상호 영향"
            icon={<Zap className="h-4 w-4" />}
          />
          <div className="space-y-4">
            {/* A → B */}
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #c9a227)', color: '#000' }}
                  title={data.nameA}
                >
                  {truncateName(data.nameA)}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <div
                  className="flex shrink-0 items-center justify-center rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white"
                  title={data.nameB}
                >
                  {truncateName(data.nameB)}
                </div>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                  {data.mutualInfluence.aToB.tenGod}
                </span>
              </div>
              <p className="text-sm text-gray-300">{replaceAB(data.mutualInfluence.aToB.positiveInfluence, data.nameA, data.nameB)}</p>
              <p className="mt-2 text-xs text-amber-400/80">
                <Lock className="mr-1 inline-block h-3 w-3" />
                주의: {replaceAB(data.mutualInfluence.aToB.caution, data.nameA, data.nameB)}
              </p>
            </div>

            {/* B → A */}
            <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white"
                  title={data.nameB}
                >
                  {truncateName(data.nameB)}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <div
                  className="flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #c9a227)', color: '#000' }}
                  title={data.nameA}
                >
                  {truncateName(data.nameA)}
                </div>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                  {data.mutualInfluence.bToA.tenGod}
                </span>
              </div>
              <p className="text-sm text-gray-300">{replaceAB(data.mutualInfluence.bToA.positiveInfluence, data.nameA, data.nameB)}</p>
              <p className="mt-2 text-xs text-amber-400/80">
                <Lock className="mr-1 inline-block h-3 w-3" />
                주의: {replaceAB(data.mutualInfluence.bToA.caution, data.nameA, data.nameB)}
              </p>
            </div>

            {/* 시너지 */}
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-sm text-gray-400">{replaceAB(data.mutualInfluence.synergy, data.nameA, data.nameB)}</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

/** 비교 탭 */
function CompareTab({ data }: { data: CompatibilityData }) {
  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <SectionHeader
          title="사주 명식 비교"
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
                  title={data.nameA}
                >
                  {truncateName(data.nameA)}
                </div>
                <span className="font-medium text-white">{data.nameA}의 사주</span>
              </div>
              <PillarDisplay pillars={data.pillarsA} />
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
                  title={data.nameB}
                >
                  {truncateName(data.nameB)}
                </div>
                <span className="font-medium text-white">{data.nameB}의 사주</span>
              </div>
              <PillarDisplay pillars={data.pillarsB} />
            </motion.div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-400">사주 정보가 없습니다.</p>
          </div>
        )}
      </GlassCard>

      {/* 간지 상호작용 */}
      <GlassCard className="p-6">
        <SectionHeader
          title="간지 상호작용"
          icon={<Zap className="h-4 w-4" />}
        />
        <InteractionDisplay interactions={data.interactions} />
      </GlassCard>
    </div>
  );
}

/** 간지 상호작용 표시 컴포넌트 */
function InteractionDisplay({ interactions }: { interactions: Record<string, unknown> }) {
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
  const peachBlossom = interactions?.peachBlossom as { type: string; description: string; score: number } | undefined;

  const hasAnyInteraction =
    stemCombinations.length > 0 ||
    branchCombinations.length > 0 ||
    branchClashes.length > 0 ||
    branchPunishments.length > 0 ||
    branchWonjin.length > 0 ||
    samhapFormed.length > 0 ||
    banhapFormed.length > 0 ||
    banghapFormed.length > 0 ||
    peachBlossom;

  if (!hasAnyInteraction) {
    return (
      <p className="text-center text-sm text-gray-400">
        특별한 간지 상호작용이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 도화살 (있는 경우 강조 표시) */}
      {peachBlossom && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-400" />
            <span className="font-medium text-pink-400">도화살 - {peachBlossom.type}</span>
            <span className="ml-auto rounded-full bg-pink-500/20 px-2 py-0.5 text-xs text-pink-300">
              +{peachBlossom.score}점
            </span>
          </div>
          <p className="text-sm text-gray-300">{peachBlossom.description}</p>
        </motion.div>
      )}

      {/* 삼합/방합 */}
      {(samhapFormed.length > 0 || banhapFormed.length > 0 || banghapFormed.length > 0) && (
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#d4af37]" />
            <span className="font-medium text-[#d4af37]">삼합·방합 형성</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samhapFormed.map((item, i) => (
              <span
                key={`samhap-${i}`}
                className="rounded-full bg-[#d4af37]/20 px-3 py-1 text-sm text-[#d4af37]"
              >
                {item.name}
              </span>
            ))}
            {banhapFormed.map((item, i) => (
              <span
                key={`banhap-${i}`}
                className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-400"
              >
                {item.name}
              </span>
            ))}
            {banghapFormed.map((item, i) => (
              <span
                key={`banghap-${i}`}
                className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 천간 합 */}
      {stemCombinations.length > 0 && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
          <div className="mb-2 text-xs font-medium text-green-400">천간 합</div>
          <div className="flex flex-wrap gap-2">
            {stemCombinations.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 지지 합 */}
      {branchCombinations.length > 0 && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <div className="mb-2 text-xs font-medium text-blue-400">지지 합</div>
          <div className="flex flex-wrap gap-2">
            {branchCombinations.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 지지 충 */}
      {branchClashes.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <div className="mb-2 text-xs font-medium text-red-400">지지 충</div>
          <div className="flex flex-wrap gap-2">
            {branchClashes.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 지지 형 */}
      {branchPunishments.length > 0 && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
          <div className="mb-2 text-xs font-medium text-orange-400">지지 형</div>
          <div className="flex flex-wrap gap-2">
            {branchPunishments.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 원진 */}
      {branchWonjin.length > 0 && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
          <div className="mb-2 text-xs font-medium text-purple-400">원진 (심리적 갈등)</div>
          <div className="flex flex-wrap gap-2">
            {branchWonjin.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 사주 표시 컴포넌트 */
function PillarDisplay({ pillars }: { pillars: Record<string, unknown> }) {
  const positions = ['hour', 'day', 'month', 'year'];
  const positionLabels: Record<string, string> = {
    hour: '시주',
    day: '일주',
    month: '월주',
    year: '년주',
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
        const pillar = pillars[pos] as { stem?: string; branch?: string; stemElement?: string; branchElement?: string } | undefined;
        return (
          <div key={pos} className="text-center">
            <p className="mb-1 text-[10px] text-gray-500">{positionLabels[pos]}</p>
            <div
              className="mb-1 flex h-8 items-center justify-center rounded-md text-sm font-medium"
              style={{
                backgroundColor: `${getElementColor(pillar?.stemElement)}20`,
                color: getElementColor(pillar?.stemElement),
              }}
            >
              {pillar?.stem || '-'}
            </div>
            <div
              className="flex h-8 items-center justify-center rounded-md text-sm font-medium"
              style={{
                backgroundColor: `${getElementColor(pillar?.branchElement)}20`,
                color: getElementColor(pillar?.branchElement),
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
