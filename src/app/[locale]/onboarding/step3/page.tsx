'use client';

/**
 * 온보딩 Step 3: 가치 제안 (리텐션 유도)
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const benefits = [
  {
    icon: '📊',
    title: '평생 기록 저장',
    description: '오늘의 분석은 마이페이지에 평생 저장됩니다',
  },
  {
    icon: '🔄',
    title: '연속성 있는 상담',
    description: '신년, 이사, 이직 등 인생의 이벤트마다 맞춤 분석',
  },
  {
    icon: '📈',
    title: '연도별 맞춤 추천',
    description: '대운의 흐름에 따른 최적의 타이밍 제안',
  },
];

const timeline = [
  { year: '2026', event: '종합 분석', icon: '🎯' },
  { year: '2027', event: '신년 운세', icon: '🌟' },
  { year: '2028', event: '이직 상담', icon: '💼' },
  { year: '2029', event: '결혼 궁합', icon: '💕' },
];

export default function OnboardingStep3() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 3/3</span>
            <span>가치 제안</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: '66%' }}
              animate={{ width: '100%' }}
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
          한 번의 분석, 평생의 기록
        </h2>
        <p className="mb-8 text-center text-gray-500">당신의 사주는 평생 함께합니다</p>

        {/* 타임라인 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10 overflow-x-auto"
        >
          <div className="flex min-w-max items-center justify-center gap-4 py-4">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white shadow-md">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="h-0.5 w-8 bg-gradient-to-r from-[#d4af37] to-[#c19a2e]" />
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-[#1a1a1a]">{item.year}</p>
                <p className="text-xs text-gray-500">{item.event}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 혜택 리스트 */}
        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="rounded-xl bg-white p-6 shadow-md"
            >
              <span className="mb-3 block text-3xl">{benefit.icon}</span>
              <h3 className="mb-2 font-medium text-[#1a1a1a]">{benefit.title}</h3>
              <p className="text-sm text-gray-500">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* 주요 포인트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-10 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-6"
        >
          <h3 className="mb-4 text-center font-medium text-[#1a1a1a]">지금 분석을 시작하면</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-[#d4af37]">✓</span>
              <span>무제한 기록 저장</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#d4af37]">✓</span>
              <span>과거 분석 내역 언제든 조회</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#d4af37]">✓</span>
              <span>연도별 맞춤 추천 알림</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#d4af37]">✓</span>
              <span>AI와 무제한 후속 대화</span>
            </li>
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center"
        >
          <Button
            asChild
            size="lg"
            className="w-full max-w-md bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            <Link href="/home">시작하기</Link>
          </Button>
          <p className="mt-4 text-center text-sm text-gray-400">
            홈에서 프로필을 등록하고 분석을 시작하세요
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
