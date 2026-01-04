'use client';

/**
 * 질문 기록 탭 컴포넌트
 * v2.0: 프로필 리포트 기반 후속 질문 기록
 */
import { motion } from 'framer-motion';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useAllQuestions } from '@/hooks/use-questions';
import { Button } from '@/components/ui/button';

/** 상대 시간 포맷팅 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

/** 질문 카드 컴포넌트 */
function QuestionCard({
  question,
  index,
}: {
  question: {
    id: string;
    question: string;
    answer: string;
    createdAt: string;
    profileId: string;
    profileName: string;
  };
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start justify-between p-5 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
            <MessageCircle className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {question.profileName}
              </span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(question.createdAt)}
              </span>
            </div>
            <p className="line-clamp-2 font-medium text-[#1a1a1a]">{question.question}</p>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0 text-gray-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* 답변 (확장 시) */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-100 bg-gradient-to-br from-[#f8f6f0] to-white px-5 py-4"
        >
          <p className="mb-3 text-xs font-medium text-[#d4af37]">AI 답변</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {question.answer}
          </p>
          <div className="mt-4 flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/profiles/${question.profileId}/report`}>리포트 보기</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}

/** 빈 상태 컴포넌트 */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-8 py-16 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5">
        <MessageCircle className="h-10 w-10 text-[#d4af37]" />
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-[#1a1a1a]">아직 질문이 없습니다</h3>
      <p className="mb-6 max-w-md text-gray-500">
        프로필 리포트에서 AI에게 추가 질문을 해보세요.
        <br />더 깊이 있는 사주 분석을 받아볼 수 있습니다.
      </p>
      <Button asChild className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white">
        <Link href="/profiles">프로필 보러 가기</Link>
      </Button>
    </motion.div>
  );
}

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-200" />
            <div className="flex-1">
              <div className="mb-2 flex gap-2">
                <div className="h-5 w-16 rounded-full bg-gray-200" />
                <div className="h-5 w-12 rounded bg-gray-200" />
              </div>
              <div className="h-5 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionHistory() {
  const { data: questions, isLoading } = useAllQuestions();

  return (
    <div>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">질문 기록</h2>
          <p className="mt-1 text-sm text-gray-500">AI에게 했던 추가 질문과 답변을 확인하세요</p>
        </div>
        {questions && questions.length > 0 && (
          <span className="rounded-full bg-[#1a1a1a]/5 px-3 py-1 text-sm font-medium text-gray-600">
            총 {questions.length}개
          </span>
        )}
      </motion.div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !questions || questions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <QuestionCard key={q.id} question={q} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
