'use client';

/**
 * 분석 영역 선택 클라이언트 컴포넌트
 * PRD 섹션 5.4 참고
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { FocusArea } from '@/types/saju';

/** 분석 영역별 아이콘 */
const focusAreaIcons: Record<FocusArea, string> = {
  wealth: '💰',
  love: '❤️',
  career: '💼',
  health: '🏥',
  overall: '🌟',
};

export function AnalysisFocusClient() {
  const router = useRouter();
  const { setFocusArea, setStep } = useOnboardingStore();
  const [selected, setSelected] = useState<FocusArea | null>(null);
  const t = useTranslations('analysis');
  const tFocusArea = useTranslations('focusArea');
  const tFocusAreaDesc = useTranslations('focusAreaDescription');

  const handleSelect = (area: FocusArea) => {
    setSelected(area);
  };

  const handleNext = () => {
    if (!selected) return;
    setFocusArea(selected);
    setStep('question');
    router.push('/analysis/question');
  };

  const focusAreas: FocusArea[] = ['wealth', 'love', 'career', 'health', 'overall'];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 1/3</span>
            <span>{t('focus.title')}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '33%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e]"
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* 타이틀 */}
        <h2 className="mb-2 whitespace-pre-line text-center font-serif text-2xl font-bold text-[#1a1a1a] md:text-3xl">
          {t('focus.headline')}
        </h2>
        <p className="mb-8 text-center text-gray-500">
          {t('focus.subheadline')}
        </p>

        {/* 분석 영역 카드 */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {focusAreas.slice(0, 4).map((area, index) => (
            <motion.button
              key={area}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => handleSelect(area)}
              className={`rounded-xl border-2 p-6 text-left transition-all hover:shadow-lg ${
                selected === area
                  ? 'border-[#d4af37] bg-[#d4af37]/5 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-[#d4af37]/50'
              }`}
            >
              <span className="mb-3 block text-4xl">{focusAreaIcons[area]}</span>
              <h3 className="mb-1 text-lg font-semibold text-[#1a1a1a]">{tFocusArea(area)}</h3>
              <p className="text-sm text-gray-500">{tFocusAreaDesc(area)}</p>
              {selected === area && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-[#d4af37]"
                >
                  <span>✓</span>
                  <span>{t('focus.selected')}</span>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* 종합 분석 카드 (전체 너비) */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => handleSelect('overall')}
          className={`mb-10 w-full rounded-xl border-2 p-6 text-left transition-all hover:shadow-lg ${
            selected === 'overall'
              ? 'border-[#d4af37] bg-[#d4af37]/5 shadow-lg'
              : 'border-gray-200 bg-white hover:border-[#d4af37]/50'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">{focusAreaIcons.overall}</span>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold text-[#1a1a1a]">
                {tFocusArea('overall')}
              </h3>
              <p className="text-sm text-gray-500">{tFocusAreaDesc('overall')}</p>
            </div>
            {selected === 'overall' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-sm font-medium text-[#d4af37]"
              >
                <span>✓</span>
                <span>{t('focus.selected')}</span>
              </motion.div>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {t('focus.overallNote')}
          </p>
        </motion.button>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center"
        >
          <Button
            onClick={handleNext}
            disabled={!selected}
            size="lg"
            className="w-full max-w-md bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {t('focus.nextButton')}
          </Button>
          {selected && (
            <p className="mt-4 text-center text-sm text-gray-400">
              {t('focus.selectedArea')}:{' '}
              <span className="font-medium text-[#d4af37]">{tFocusArea(selected)}</span>
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
