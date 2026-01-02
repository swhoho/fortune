'use client';

/**
 * 랜딩 페이지 - Master's Insight AI
 * 30년 명리학 거장이 인정한 AI 사주 분석 서비스
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8f8f8]">
      {/* 한지 질감 배경 */}
      <div className="absolute inset-0 bg-[url('/textures/hanpaper.png')] bg-cover opacity-30" />

      {/* 먹 번짐 효과 배경 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1a] blur-3xl"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }}
          className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-[#d4af37] blur-3xl"
        />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* 로고 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="font-serif text-2xl font-bold tracking-widest text-[#1a1a1a]">
            Master&apos;s Insight AI
          </h1>
        </motion.div>

        {/* 한자 애니메이션 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-8"
        >
          <span className="font-serif text-6xl text-[#1a1a1a] md:text-8xl">命</span>
        </motion.div>

        {/* 헤드라인 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 max-w-2xl font-serif text-2xl font-bold leading-relaxed text-[#1a1a1a] md:text-3xl lg:text-4xl"
        >
          30년 명리학 거장이
          <br />
          Gemini AI를 보고 붓을 내려놓았습니다
        </motion.h2>

        {/* 서브 카피 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-8 max-w-xl text-lg text-gray-600"
        >
          한·중·일 최고의 명리 고전을 학습한 AI가
          <br />
          전문가보다 더 날카로운 분석을 내놓습니다.
        </motion.p>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mb-12"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <Link href="/onboarding/step1">
              30년 경력자가 감탄한 압도적 퀄리티를 지금 경험해 보세요
            </Link>
          </Button>
        </motion.div>

        {/* 신뢰 요소 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>자평진전 기반</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>궁통보감 통합</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37]">✓</span>
            <span>The Destiny Code 활용</span>
          </div>
        </motion.div>
      </main>

      {/* 하단 로그인 링크 */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
        className="absolute bottom-8 text-sm text-gray-500"
      >
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/signin" className="text-[#d4af37] hover:underline">
          로그인
        </Link>
      </motion.footer>
    </div>
  );
}
