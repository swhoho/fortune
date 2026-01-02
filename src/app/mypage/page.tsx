'use client';

/**
 * 마이페이지
 * PRD 섹션 5.9 참고
 * Task 10: 프로필 정보, 크레딧, 분석 기록
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile, useAnalysisList } from '@/hooks/use-user';
import type { AnalysisItem } from '@/hooks/use-user';

/** 분석 유형 라벨 */
const AnalysisTypeLabel: Record<string, string> = {
  full: '전체 사주 분석',
  yearly: '신년 사주 분석',
  compatibility: '궁합 분석',
};

/** 집중 영역 라벨 */
const FocusAreaLabel: Record<string, string> = {
  wealth: '재물운',
  love: '연애운',
  career: '직장운',
  health: '건강운',
  overall: '종합운',
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

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-4xl animate-pulse">
        <div className="mb-8 h-40 rounded-xl bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-32 rounded-xl bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/** 분석 기록 카드 */
function AnalysisCard({ analysis }: { analysis: AnalysisItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#d4af37]/50 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{formatDate(analysis.createdAt)}</p>
          <p className="font-semibold text-[#1a1a1a]">
            {AnalysisTypeLabel[analysis.type] || '사주 분석'}
          </p>
        </div>
        <span className="rounded-full bg-[#d4af37]/10 px-2 py-0.5 text-xs font-medium text-[#d4af37]">
          {analysis.creditsUsed}C
        </span>
      </div>

      {analysis.focusArea && (
        <p className="mb-3 text-sm text-gray-600">
          집중 영역: {FocusAreaLabel[analysis.focusArea] || analysis.focusArea}
        </p>
      )}

      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/5"
      >
        <Link href={`/analysis/result/${analysis.id}`}>결과 보기</Link>
      </Button>
    </motion.div>
  );
}

/** 빈 상태 */
function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <p className="mb-4 text-gray-500">아직 분석 기록이 없습니다</p>
      <Button
        asChild
        className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white hover:opacity-90"
      >
        <Link href="/onboarding/step2">첫 분석 시작하기</Link>
      </Button>
    </div>
  );
}

export default function MyPage() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useUserProfile();
  const { data: analysisList, isLoading: listLoading } = useAnalysisList();

  // 로딩 상태
  if (profileLoading) {
    return <LoadingSkeleton />;
  }

  // 에러 상태
  if (profileError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <div className="text-center">
          <p className="mb-4 text-red-600">프로필을 불러오는데 실패했습니다</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] px-6 py-24">
      <div className="mx-auto max-w-4xl">
        {/* 페이지 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-2xl font-bold text-[#1a1a1a] md:text-3xl">마이페이지</h1>
        </motion.div>

        {/* 프로필 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-[#d4af37]/30 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-[#1a1a1a]">내 프로필</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* 사용자 정보 */}
                <div>
                  <p className="text-lg font-medium text-[#1a1a1a]">
                    {profile?.name || '사용자'}
                  </p>
                  <p className="text-gray-500">{profile?.email}</p>
                </div>

                {/* 크레딧 정보 */}
                <div className="flex items-center gap-6">
                  <div className="text-center md:text-right">
                    <p className="text-sm text-gray-500">보유 크레딧</p>
                    <p className="text-3xl font-bold text-[#d4af37]">{profile?.credits || 0}C</p>
                  </div>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white shadow-md hover:opacity-90"
                  >
                    <Link href="/payment">크레딧 충전</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* 분석 기록 섹션 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-4 text-xl font-semibold text-[#1a1a1a]">분석 기록</h2>

          {listLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : !analysisList?.analyses || analysisList.analyses.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {analysisList.analyses.map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <AnalysisCard analysis={analysis} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
