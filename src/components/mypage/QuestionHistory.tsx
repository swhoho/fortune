'use client';

/**
 * 질문 기록 탭 컴포넌트
 * PRD Task 17.2 - 분석별 그룹화, 검색 기능
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useQuestionsList } from '@/hooks/use-user';
import type { GroupedQuestions } from '@/hooks/use-user';

/** 분석 유형 라벨 */
const ANALYSIS_TYPE_LABEL: Record<string, string> = {
  full: '전체 사주 분석',
  yearly: '신년 사주 분석',
  compatibility: '궁합 분석',
};

/** 날짜 포맷팅 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** 시간 포맷팅 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 텍스트 하이라이트 */
function highlightText(text: string, searchQuery: string): React.ReactNode {
  if (!searchQuery.trim()) return text;

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="rounded bg-[#d4af37]/20 px-0.5 text-[#1a1a1a]">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/** 질문 아이템 컴포넌트 */
function QuestionItem({
  question,
  searchQuery,
}: {
  question: {
    id: string;
    question: string;
    answer: string;
    creditsUsed: number;
    createdAt: string;
  };
  searchQuery: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-[#d4af37]/20"
    >
      {/* 질문 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
            <span>{formatDate(question.createdAt)}</span>
            <span>·</span>
            <span>{formatTime(question.createdAt)}</span>
            <span className="rounded-full bg-[#d4af37]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#d4af37]">
              {question.creditsUsed}C
            </span>
          </div>
          <p className="font-medium text-[#1a1a1a]">
            <span className="mr-2 text-[#d4af37]">Q.</span>
            {highlightText(question.question, searchQuery)}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="ml-3 shrink-0 text-gray-400"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </motion.div>
      </button>

      {/* 답변 (확장 시) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg bg-gradient-to-br from-[#f8f6f0] to-[#f0ebe0] p-4">
              <p className="text-sm leading-relaxed text-gray-700">
                <span className="mr-2 font-medium text-[#1a1a1a]">A.</span>
                {highlightText(question.answer, searchQuery)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** 분석 그룹 컴포넌트 */
function AnalysisGroup({
  group,
  searchQuery,
  defaultExpanded = false,
}: {
  group: GroupedQuestions;
  searchQuery: string;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {/* 그룹 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          {/* 아이콘 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
            <svg
              className="h-6 w-6 text-[#d4af37]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          </div>
          <div>
            <p className="font-serif font-semibold text-[#1a1a1a]">
              {ANALYSIS_TYPE_LABEL[group.analysis.type] || '사주 분석'}
            </p>
            <p className="text-sm text-gray-500">{formatDate(group.analysis.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#1a1a1a]/5 px-3 py-1 text-sm font-medium text-gray-600">
            {group.questions.length}개 질문
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* 질문 목록 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-gray-100 p-5 pt-4">
              {group.questions.map((question) => (
                <QuestionItem key={question.id} question={question} searchQuery={searchQuery} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** 빈 상태 컴포넌트 */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-8 py-16 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
        <svg
          className="h-10 w-10 text-[#d4af37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-[#1a1a1a]">
        {hasSearch ? '검색 결과가 없습니다' : '아직 질문 기록이 없습니다'}
      </h3>
      <p className="text-gray-500">
        {hasSearch
          ? '다른 검색어로 다시 시도해보세요'
          : '분석 결과 페이지에서 AI에게 추가 질문을 해보세요'}
      </p>
    </motion.div>
  );
}

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-200" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-6 w-16 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 디바운스된 검색
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuestionsList(debouncedQuery || undefined);

  return (
    <div>
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">질문 기록</h2>
            <p className="mt-1 text-sm text-gray-500">AI에게 한 추가 질문과 답변을 확인하세요</p>
          </div>
          {data?.totalCount !== undefined && data.totalCount > 0 && (
            <span className="rounded-full bg-[#1a1a1a]/5 px-3 py-1 text-sm font-medium text-gray-600">
              총 {data.totalCount}개
            </span>
          )}
        </div>

        {/* 검색 입력 */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="질문 또는 답변 내용 검색..."
            className="h-12 rounded-xl border-gray-200 pl-12 pr-4 transition-all focus:border-[#d4af37] focus:ring-[#d4af37]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !data?.groupedByAnalysis || data.groupedByAnalysis.length === 0 ? (
        <EmptyState hasSearch={!!debouncedQuery} />
      ) : (
        <motion.div layout className="space-y-4">
          {data.groupedByAnalysis.map((group, index) => (
            <AnalysisGroup
              key={group.analysis.id}
              group={group}
              searchQuery={debouncedQuery}
              defaultExpanded={index === 0}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
