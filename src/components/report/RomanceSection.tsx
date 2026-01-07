'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ContentCard } from './ContentCard';
import { TraitGraph, type TraitItem, type TraitDescription } from './TraitGraph';
import type { ContentCardData, RomanceExtendedData } from '@/types/report';

/**
 * 연애 특성 설명 데이터
 * 각 특성별 점수 범위에 따른 설명
 */
const ROMANCE_TRAIT_DESCRIPTIONS: TraitDescription[] = [
  {
    label: '배려심',
    low: '자신의 필요와 감정에 더 집중하는 편입니다. 연애에서 상대방의 입장을 이해하려는 노력이 필요할 수 있으며, 의식적으로 상대방을 먼저 생각하는 습관을 기르면 관계가 더욱 깊어질 수 있습니다.',
    medium:
      '상대방을 배려하는 마음과 자신의 필요 사이에서 균형을 잡으려 합니다. 상황에 따라 배려심을 발휘하지만, 때로는 자기 중심적인 면도 있어 일관성 있는 배려가 필요합니다.',
    high: '상대방의 감정과 필요를 세심하게 살피며, 먼저 양보하고 헌신하는 것을 자연스럽게 합니다. 연애에서 상대방이 편안함을 느끼도록 노력하며, 이로 인해 깊고 안정적인 관계를 형성할 수 있습니다.',
  },
  {
    label: '유머감각',
    low: '진지하고 깊이 있는 대화를 선호하며, 가벼운 농담보다는 의미 있는 소통을 중시합니다. 연애에서 유머보다는 진솔한 감정 표현으로 상대방과 교감하려 합니다.',
    medium:
      '상황에 맞게 유머를 구사하며, 적절한 타이밍에 분위기를 밝게 만들 수 있습니다. 너무 가볍지도, 너무 무겁지도 않은 대화 스타일로 균형 잡힌 소통이 가능합니다.',
    high: '재치 있는 유머로 상대방을 웃게 만들며, 어색한 분위기도 자연스럽게 풀어나갑니다. 유머를 통해 관계에 활력을 불어넣고, 함께 있으면 즐거운 사람이라는 인상을 줍니다.',
  },
  {
    label: '예술성',
    low: '실용적이고 현실적인 것을 선호하며, 로맨틱한 분위기나 감성적 표현보다는 실질적인 행동으로 사랑을 표현합니다. 예술적 감성보다는 안정감을 추구하는 연애 스타일입니다.',
    medium:
      '적당한 감성과 현실 감각을 겸비하고 있습니다. 특별한 날에는 로맨틱한 분위기를 연출하기도 하며, 일상에서는 실용적인 면을 보여줍니다.',
    high: '감성이 풍부하고 로맨틱한 분위기를 잘 만들어냅니다. 데이트에서 특별한 장소를 찾거나 감동적인 이벤트를 기획하는 데 탁월하며, 예술적 감각으로 연애를 아름답게 꾸밀 수 있습니다.',
  },
  {
    label: '허영심',
    low: '겸손하고 소박한 성향으로, 외적인 것보다 내면의 가치를 중시합니다. 연애에서도 과시보다는 진실된 관계를 추구하며, 상대방의 본질을 보려 합니다.',
    medium:
      '적절한 자기 표현과 겸손함 사이에서 균형을 유지합니다. 때로는 좋은 인상을 주기 위해 노력하지만, 과도한 과시는 피하려 합니다.',
    high: '자신을 잘 꾸미고 표현하는 것을 좋아합니다. 연애에서 상대방에게 좋은 인상을 주기 위해 많은 노력을 기울이며, 이로 인해 초반 매력도가 높을 수 있습니다. 다만 진정성 있는 모습도 함께 보여주는 것이 장기적 관계에 도움이 됩니다.',
  },
  {
    label: '모험심',
    low: '안정적이고 예측 가능한 관계를 선호합니다. 새로운 경험보다는 익숙하고 편안한 데이트를 좋아하며, 차분하고 안정적인 연애 스타일을 유지합니다.',
    medium:
      '새로운 경험과 안정 사이에서 균형을 찾습니다. 가끔은 새로운 도전을 즐기지만, 기본적으로는 안정적인 관계를 원합니다.',
    high: '새로운 경험과 도전을 즐기며, 연애에서도 색다른 데이트와 모험을 추구합니다. 상대방과 함께 새로운 것을 경험하는 것에서 큰 즐거움을 느끼며, 관계에 활력을 불어넣습니다.',
  },
  {
    label: '성실도',
    low: '유연하고 자유로운 관계를 선호하며, 엄격한 약속이나 규칙에 얽매이는 것을 부담스러워할 수 있습니다. 연애에서 좀 더 일관된 모습을 보여주면 신뢰를 쌓는 데 도움이 됩니다.',
    medium:
      '기본적인 약속은 잘 지키지만, 때로는 상황에 따라 유연하게 대처합니다. 중요한 일에는 성실하게 임하지만, 모든 면에서 완벽하지는 않습니다.',
    high: '약속을 철저히 지키고 책임감 있게 행동합니다. 연애에서도 꾸준하고 한결같은 모습을 보여주며, 상대방에게 깊은 신뢰감을 줍니다. 장기적인 관계에서 큰 강점이 됩니다.',
  },
  {
    label: '사교력',
    low: '소수의 깊은 관계를 선호하며, 새로운 사람을 만나는 것보다 기존 관계를 소중히 합니다. 연애에서도 둘만의 조용한 시간을 더 좋아할 수 있습니다.',
    medium:
      '상황에 맞게 사회적 활동에 참여하며, 적당한 수준의 사교 활동을 유지합니다. 필요할 때는 외향적으로, 때로는 조용히 둘만의 시간을 즐깁니다.',
    high: '다양한 사람들과 쉽게 어울리고 좋은 인상을 남깁니다. 상대방의 지인들과도 잘 지내며, 함께하는 사회적 활동에서도 편안한 분위기를 만들어냅니다.',
  },
  {
    label: '재테크',
    low: '현재의 즐거움과 경험을 중시하며, 미래 재정 계획보다는 지금의 행복에 집중합니다. 연애에서 경제적 부분은 크게 신경 쓰지 않을 수 있습니다.',
    medium:
      '적당한 저축과 소비 사이에서 균형을 유지합니다. 미래를 위한 준비도 하면서 현재의 데이트 비용도 합리적으로 관리하려 합니다.',
    high: '경제적으로 계획적이며 미래를 위한 준비를 철저히 합니다. 연애와 결혼에서도 재정적 안정을 중요하게 생각하며, 합리적인 소비와 저축을 병행합니다.',
  },
  {
    label: '신뢰성',
    low: '즉흥적이고 변화를 좋아하는 성향으로, 일관된 행동보다는 상황에 따른 유연성을 보입니다. 상대방에게 예측 가능한 모습을 보여주는 연습이 관계 안정에 도움이 됩니다.',
    medium:
      '대체로 믿을 수 있는 모습을 보이지만, 가끔 예상치 못한 행동을 하기도 합니다. 중요한 약속은 잘 지키려 노력하며, 신뢰를 쌓아가고 있습니다.',
    high: '말과 행동이 일치하며, 상대방이 믿고 의지할 수 있는 사람입니다. 연애에서 안정감과 신뢰감을 주며, 이는 깊고 지속적인 관계의 핵심 기반이 됩니다.',
  },
  {
    label: '표현력',
    low: '감정 표현이 서툴고 내성적인 편입니다. 사랑하는 마음이 있어도 말이나 행동으로 표현하는 것이 어색할 수 있습니다. 작은 표현부터 시작해 상대방에게 마음을 전달하는 연습이 도움이 됩니다.',
    medium:
      '상황에 따라 감정을 표현하지만, 항상 적극적이지는 않습니다. 중요한 순간에는 마음을 전달하려 노력하며, 점차 표현력을 키워가고 있습니다.',
    high: '감정을 솔직하게 표현하며, 사랑하는 마음을 말과 행동으로 잘 전달합니다. 상대방이 사랑받고 있다고 느끼게 해주며, 이는 관계의 친밀감을 높이는 데 큰 역할을 합니다.',
  },
];

/**
 * 연애 특성 데이터 (10개 항목)
 * Task 19: 연애/결혼 섹션
 * 참조: docs/reference/fortune10-11.PNG
 */
export interface RomanceTraitsData {
  /** 배려심 */
  consideration: number;
  /** 유머감각 */
  humor: number;
  /** 예술성 */
  artistry: number;
  /** 허영심 */
  vanity: number;
  /** 모험심 */
  adventure: number;
  /** 성실도 */
  sincerity: number;
  /** 사교력 */
  sociability: number;
  /** 재테크 */
  financial: number;
  /** 신뢰성 */
  reliability: number;
  /** 표현력 */
  expression: number;
}

/**
 * 연애/결혼 섹션 데이터
 * Task 19: 연애/결혼 섹션
 * 참조: docs/reference/fortune10-11.PNG
 */
export interface RomanceSectionData {
  /** 연애심리 */
  datingPsychology: ContentCardData;
  /** 배우자관 */
  spouseView: ContentCardData;
  /** 성격패턴 (선택) */
  personalityPattern?: ContentCardData;
  /** 연애 특성 그래프 */
  romanceTraits: RomanceTraitsData;
  /** 연애 점수 (0-100, 선택) */
  score?: number;
  /** Task 25: 확장 데이터 (선택) */
  extended?: RomanceExtendedData;
}

interface RomanceSectionProps {
  /** 섹션 데이터 */
  data: RomanceSectionData;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 연애/결혼 섹션 컴포넌트
 * Task 19: 연애 카드 3개 + 특성 그래프
 *
 * 참조: docs/reference/fortune10-11.PNG
 *
 * 섹션 구조:
 * 1. 연애심리 카드 (ContentCard, highlight)
 * 2. 배우자관 카드 (ContentCard)
 * 3. 성격패턴 카드 (ContentCard, 선택)
 * 4. 연애 특성 그래프 (10개 항목)
 */
export function RomanceSection({ data, className = '' }: RomanceSectionProps) {
  const t = useTranslations('report.romance');
  const { datingPsychology, spouseView, personalityPattern, romanceTraits, score, extended } = data;

  // 확장 데이터 존재 여부
  const hasStyle = extended?.style;
  const hasIdealPartner = extended?.idealPartner && extended.idealPartner.length > 0;
  const hasWarnings = extended?.warnings && extended.warnings.length > 0;
  const hasCompatibilityPoints =
    extended?.compatibilityPoints && extended.compatibilityPoints.length > 0;
  const hasLoveAdvice = extended?.loveAdvice;

  // 연애 특성 데이터를 TraitItem 배열로 변환
  const romanceItems: TraitItem[] = [
    { label: t('traitLabels.consideration'), value: romanceTraits.consideration },
    { label: t('traitLabels.humor'), value: romanceTraits.humor },
    { label: t('traitLabels.artistry'), value: romanceTraits.artistry },
    { label: t('traitLabels.vanity'), value: romanceTraits.vanity },
    { label: t('traitLabels.adventure'), value: romanceTraits.adventure },
    { label: t('traitLabels.sincerity'), value: romanceTraits.sincerity },
    { label: t('traitLabels.sociability'), value: romanceTraits.sociability },
    { label: t('traitLabels.financial'), value: romanceTraits.financial },
    { label: t('traitLabels.reliability'), value: romanceTraits.reliability },
    { label: t('traitLabels.expression'), value: romanceTraits.expression },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative space-y-6 ${className}`}
    >
      {/* 배경 장식 - 미묘한 핑크 글로우 */}
      <div className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full bg-pink-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-32 w-32 rounded-full bg-[#d4af37]/5 blur-3xl" />

      {/* 섹션 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          {/* 하트 아이콘 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600"
          >
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        </div>

        {/* 점수 배지 (선택) */}
        {score !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1"
          >
            <span className="text-xs text-pink-400/70">{t('score')}</span>
            <span className="text-sm font-bold text-pink-400">{score}</span>
          </motion.div>
        )}

        {/* 구분선 */}
        <div className="h-px flex-1 bg-gradient-to-r from-pink-500/50 via-[#d4af37]/30 to-transparent" />
      </motion.div>

      {/* Task 25: 연애 스타일 배지 */}
      {hasStyle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/20">
            <svg className="h-5 w-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs text-gray-400">연애 스타일</span>
            <p className="font-bold text-pink-300">{extended!.style}</p>
          </div>
        </motion.div>
      )}

      {/* Task 25: 이상형 특성 */}
      {hasIdealPartner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-pink-500/20 px-2.5 py-1 text-xs font-bold text-pink-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              이상형
            </span>
          </div>
          <div className="space-y-2">
            {extended!.idealPartner!.map((trait, idx) => (
              <motion.div
                key={trait}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                className="flex items-center gap-2"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                <span className="text-gray-300">{trait}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 1. 연애심리 카드 */}
      <ContentCard
        label={datingPsychology.label || '연애심리'}
        title={datingPsychology.title || '결혼전 연애/데이트 심리'}
        content={datingPsychology.content}
        variant="highlight"
        delay={0.1}
      />

      {/* 2. 배우자관 카드 */}
      <ContentCard
        label={spouseView.label || '배우자관'}
        title={spouseView.title || '결혼후 배우자를 보는 눈'}
        content={spouseView.content}
        variant="default"
        delay={0.2}
      />

      {/* 3. 성격패턴 카드 (선택) */}
      {personalityPattern && (
        <ContentCard
          label={personalityPattern.label || '성격패턴'}
          title={personalityPattern.title || '결혼후 성격인 패턴'}
          content={personalityPattern.content}
          variant="default"
          delay={0.3}
        />
      )}

      {/* Task 25: 궁합 포인트 */}
      {hasCompatibilityPoints && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="rounded-xl bg-[#1a1a1a] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              궁합 포인트
            </span>
          </div>
          <div className="space-y-2">
            {extended!.compatibilityPoints!.map((point, idx) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                className="flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-300">{point}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Task 25: 연애 주의사항 */}
      {hasWarnings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              연애 주의사항
            </span>
          </div>
          <div className="space-y-3">
            {extended!.warnings!.map((warning, idx) => (
              <motion.div
                key={warning}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + idx * 0.05 }}
                className="flex items-start gap-3 rounded-lg bg-[#1a1a1a]/50 p-3"
              >
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <svg
                    className="h-3 w-3 text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01"
                    />
                  </svg>
                </div>
                <span className="text-gray-300">{warning}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Task 25: 연애 조언 */}
      {hasLoveAdvice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[#d4af37]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-sm font-bold text-[#d4af37]">연애 조언</span>
          </div>
          <p className="leading-relaxed text-gray-300">{extended!.loveAdvice}</p>
        </motion.div>
      )}

      {/* 4. 연애 특성 그래프 */}
      <TraitGraph
        title={t('traits')}
        subtitle={t('traitsDesc')}
        traits={romanceItems}
        descriptions={ROMANCE_TRAIT_DESCRIPTIONS}
        threshold={50}
        showLegend={true}
        showDescriptions={false}
      />

      {/* 하단 장식 라인 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mx-auto h-px w-1/2 origin-center bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"
      />
    </motion.section>
  );
}
