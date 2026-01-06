'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface CharacteristicsSectionProps {
  title?: string;
  subtitle?: string;
  paragraphs: string[];
  maxHeight?: number;
  className?: string;
}

/**
 * 사주 특성 섹션 컴포넌트
 * Task 14.1: 장문 텍스트 렌더링 + 스크롤
 */
export function CharacteristicsSection({
  title = '사주특징',
  subtitle = '사주상에 나타난 특징들',
  paragraphs,
  maxHeight = 400,
  className = '',
}: CharacteristicsSectionProps) {
  // 문단 애니메이션
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const paragraphVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl bg-[#1a1a1a] ${className}`}
    >
      {/* 배경 장식 */}
      <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-[#d4af37]/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-[#d4af37]/5 blur-3xl" />

      {/* 헤더 */}
      <div className="relative z-10 border-b border-gray-800 p-5">
        <div className="flex items-center gap-3">
          {/* 라벨 태그 */}
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="inline-flex items-center rounded-md bg-[#d4af37] px-2.5 py-1 text-xs font-bold text-[#1a1a1a]"
          >
            {title}
          </motion.span>

          {/* 부제목 */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="text-sm text-gray-400"
          >
            {subtitle}
          </motion.span>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="relative z-10">
        {/* 스크롤 가능한 콘텐츠 */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-y-auto p-5 pb-20"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => (
              <motion.div
                key={index}
                variants={paragraphVariants}
                className="prose prose-invert prose-sm max-w-none"
              >
                <ReactMarkdown
                  // XSS 방지: 허용된 요소만 렌더링
                  allowedElements={['p', 'strong', 'em', 'br']}
                  unwrapDisallowed={true}
                  components={{
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed text-gray-300">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[#d4af37]">{children}</strong>
                    ),
                    em: ({ children }) => <em className="text-gray-200">{children}</em>,
                  }}
                >
                  {paragraph}
                </ReactMarkdown>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 하단 페이드 그라데이션 */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-[#1a1a1a] to-transparent" />
      </div>

      {/* 하단 악센트 라인 */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
    </motion.section>
  );
}
