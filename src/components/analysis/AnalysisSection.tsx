'use client';

/**
 * AI 분석 텍스트 섹션 컴포넌트
 * react-markdown으로 마크다운 렌더링
 */

import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { BRAND_COLORS } from '@/lib/constants/colors';

interface AnalysisSectionProps {
  /** 섹션 제목 */
  title: string;
  /** 분석 내용 (마크다운 지원) */
  content: string;
  /** 점수 (0-100, 선택) */
  score?: number;
  /** 조언 (선택) */
  advice?: string;
  /** 키워드 목록 (성격 분석용, 선택) */
  keywords?: string[];
}

/**
 * 점수에 따른 색상
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#eab308'; // yellow-500
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * 점수에 따른 라벨
 */
function getScoreLabel(score: number): string {
  if (score >= 80) return '매우 좋음';
  if (score >= 60) return '좋음';
  if (score >= 40) return '보통';
  return '주의 필요';
}

export function AnalysisSection({ title, content, score, advice, keywords }: AnalysisSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* 제목 */}
      <h3 className="font-serif text-xl font-semibold text-white">{title}</h3>

      {/* 키워드 태그 (성격 분석용) */}
      {keywords && keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: `${BRAND_COLORS.primary}20`,
                color: BRAND_COLORS.primary,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* 점수 프로그레스 바 */}
      {typeof score === 'number' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">운세 점수</span>
            <span className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>
              {score}점 · {getScoreLabel(score)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#333]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getScoreColor(score) }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      )}

      {/* 본문 (마크다운) */}
      <div className="prose prose-sm max-w-none text-gray-300">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="my-3 list-inside list-disc space-y-1">{children}</ul>
            ),
            li: ({ children }) => <li className="text-gray-300">{children}</li>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* 조언 박스 */}
      {advice && (
        <div
          className="rounded-lg border-l-4 p-4"
          style={{
            borderColor: BRAND_COLORS.primary,
            backgroundColor: `${BRAND_COLORS.primary}10`,
          }}
        >
          <p className="text-sm font-medium text-white">조언</p>
          <p className="mt-1 text-sm text-gray-300">{advice}</p>
        </div>
      )}
    </motion.div>
  );
}
