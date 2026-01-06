'use client';

/**
 * 분석 영역 선택 클라이언트 컴포넌트
 * PRD 섹션 5.4 참고
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { FocusArea, FocusAreaLabel } from '@/types/saju';

/** 분석 영역별 상세 정보 */
const focusAreaDetails: Record<FocusArea, { icon: string; description: string }> = {
  wealth: {
    icon: '💰',
    description: '재물운과 사업운을 집중 분석합니다',
  },
  love: {
    icon: '❤️',
    description: '연애운과 관계운을 분석합니다',
  },
  career: {
    icon: '💼',
    description: '직장운과 승진운을 분석합니다',
  },
  health: {
    icon: '🏥',
    description: '건강운과 수명을 분석합니다',
  },
  overall: {
    icon: '🌟',
    description: '모든 분야를 종합적으로 분석합니다',
  },
};

export function AnalysisFocusClient() {
  const router = useRouter();
  const { setFocusArea, setStep } = useOnboardingStore();
  const [selected, setSelected] = useState<FocusArea | null>(null);

  const handleSelect = (area: FocusArea) => {
    setSelected(area);
  };

  const handleNext = () => {
    if (!selected) return;
    setFocusArea(selected);
    setStep('question');
    router.push('/analysis/question');
  };

  const focusAreas = Object.entries(focusAreaDetails) as [
    FocusArea,
    { icon: string; description: string },
  ][];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 1/3</span>
            <span>분석 영역 선택</span>
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
        <h2 className="mb-2 text-center font-serif text-2xl font-bold text-[#1a1a1a] md:text-3xl">
          어떤 분야를 집중적으로
          <br />
          알고 싶으신가요?
        </h2>
        <p className="mb-8 text-center text-gray-500">
          선택한 분야에 맞춰 더 깊은 분석을 제공합니다
        </p>

        {/* 분석 영역 카드 */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {focusAreas.slice(0, 4).map(([area, detail], index) => (
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
              <span className="mb-3 block text-4xl">{detail.icon}</span>
              <h3 className="mb-1 text-lg font-semibold text-[#1a1a1a]">{FocusAreaLabel[area]}</h3>
              <p className="text-sm text-gray-500">{detail.description}</p>
              {selected === area && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-[#d4af37]"
                >
                  <span>✓</span>
                  <span>선택됨</span>
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
            <span className="text-4xl">{focusAreaDetails.overall.icon}</span>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold text-[#1a1a1a]">
                {FocusAreaLabel.overall}
              </h3>
              <p className="text-sm text-gray-500">{focusAreaDetails.overall.description}</p>
            </div>
            {selected === 'overall' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-sm font-medium text-[#d4af37]"
              >
                <span>✓</span>
                <span>선택됨</span>
              </motion.div>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            평생 총운, 성격, 재물, 연애, 건강, 10년 대운 흐름 포함
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
            다음: 고민 입력하기
          </Button>
          {selected && (
            <p className="mt-4 text-center text-sm text-gray-400">
              선택한 분야:{' '}
              <span className="font-medium text-[#d4af37]">{FocusAreaLabel[selected]}</span>
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
