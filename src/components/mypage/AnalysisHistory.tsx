'use client';

/**
 * 분석 기록 탭 컴포넌트
 * PRD 섹션 5.9 - 분석 기록 리스트
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAnalysisList } from '@/hooks/use-user';
import type { AnalysisItem } from '@/hooks/use-user';

/** 분석 유형 라벨 */
const ANALYSIS_TYPE_LABEL: Record<string, string> = {
  full: '전체 사주 분석',
  yearly: '신년 사주 분석',
  compatibility: '궁합 분석',
};

/** 집중 영역 라벨 */
const FOCUS_AREA_LABEL: Record<string, string> = {
  wealth: '재물운',
  love: '연애운',
  career: '직장운',
  health: '건강운',
  overall: '종합운',
};

/** 집중 영역 아이콘 */
const FOCUS_AREA_ICON: Record<string, string> = {
  wealth: '💰',
  love: '❤️',
  career: '💼',
  health: '🏥',
  overall: '🌟',
};

/** 날짜 포맷팅 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

/** 분석 카드 컴포넌트 */
function AnalysisCard({ analysis, index }: { analysis: AnalysisItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-[#d4af37]/30 hover:shadow-md"
    >
      {/* 장식적 배경 요소 */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 집중 영역 아이콘 */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f8f6f0] to-[#f0ebe0] text-lg">
            {FOCUS_AREA_ICON[analysis.focusArea || 'overall'] || '📊'}
          </div>
          <div>
            <p className="text-xs text-gray-400">{formatRelativeTime(analysis.createdAt)}</p>
            <h3 className="font-serif font-semibold text-[#1a1a1a]">
              {ANALYSIS_TYPE_LABEL[analysis.type] || '사주 분석'}
            </h3>
          </div>
        </div>
        <span className="rounded-full bg-[#d4af37]/10 px-2.5 py-1 text-xs font-medium text-[#d4af37]">
          {analysis.creditsUsed}C
        </span>
      </div>

      {/* 정보 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {analysis.focusArea && (
          <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
            {FOCUS_AREA_LABEL[analysis.focusArea] || analysis.focusArea}
          </span>
        )}
        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
          {formatDate(analysis.createdAt)}
        </span>
      </div>

      {/* 액션 버튼 */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full border-[#d4af37]/30 text-[#d4af37] transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/5"
      >
        <Link href={`/analysis/result/${analysis.id}`}>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          결과 보기
        </Link>
      </Button>
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
      {/* 장식적 아이콘 */}
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
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-[#1a1a1a]">
        아직 분석 기록이 없습니다
      </h3>
      <p className="mb-6 text-gray-500">첫 번째 사주 분석을 시작하고 운명의 흐름을 알아보세요</p>
      <Button
        asChild
        className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-6 py-3 text-white shadow-md hover:shadow-lg"
      >
        <Link href="/onboarding/step2">
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          첫 분석 시작하기
        </Link>
      </Button>
    </motion.div>
  );
}

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-200" />
              <div>
                <div className="mb-1 h-3 w-12 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-6 w-10 rounded-full bg-gray-200" />
          </div>
          <div className="mb-4 flex gap-2">
            <div className="h-6 w-16 rounded-lg bg-gray-200" />
            <div className="h-6 w-24 rounded-lg bg-gray-200" />
          </div>
          <div className="h-9 w-full rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export function AnalysisHistory() {
  const { data, isLoading } = useAnalysisList();

  return (
    <div>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">분석 기록</h2>
          <p className="mt-1 text-sm text-gray-500">지금까지 진행한 사주 분석 기록을 확인하세요</p>
        </div>
        {data?.analyses && data.analyses.length > 0 && (
          <span className="rounded-full bg-[#1a1a1a]/5 px-3 py-1 text-sm font-medium text-gray-600">
            총 {data.analyses.length}건
          </span>
        )}
      </motion.div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !data?.analyses || data.analyses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.analyses.map((analysis, index) => (
            <AnalysisCard key={analysis.id} analysis={analysis} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
