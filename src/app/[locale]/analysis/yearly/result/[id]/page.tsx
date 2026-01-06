'use client';

/**
 * 신년 분석 결과 페이지
 * Task 20: /[locale]/analysis/yearly/result/[id]
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Sparkles, Calendar, BookOpen, Loader2, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MonthlyTimeline, LuckyDaysCalendar, YearlyAdviceCard } from '@/components/analysis/yearly';
import { useYearlyStore } from '@/stores/yearly-store';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { YearlyAnalysisResult } from '@/lib/ai/types';

export default function YearlyResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const { yearlyResult, setYearlyResult } = useYearlyStore();
  const [loading, setLoading] = useState(!yearlyResult);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyAnalysisResult | null>(yearlyResult);

  // API에서 결과 가져오기
  useEffect(() => {
    if (yearlyResult) {
      setResult(yearlyResult);
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/analysis/yearly/${analysisId}`);
        if (!response.ok) {
          throw new Error('분석 결과를 불러올 수 없습니다.');
        }
        const data = await response.json();
        setResult(data.data.analysis);
        setYearlyResult(data.data.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [analysisId, yearlyResult, setYearlyResult]);

  const handleBack = () => {
    router.push('/mypage');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${result?.year}년 신년 운세`,
        text: result?.summary,
        url: window.location.href,
      });
    } catch {
      // 공유 취소 또는 미지원
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_COLORS.primary }} />
      </div>
    );
  }

  // 에러 화면
  if (error || !result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-white">결과를 불러올 수 없습니다</h2>
          <p className="mb-6 text-gray-400">{error}</p>
          <Button
            onClick={handleBack}
            variant="outline"
            className="border-[#333] text-white hover:bg-[#242424]"
          >
            마이페이지로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 border-b border-[#333] bg-[#0a0a0a]/80 px-4 py-4 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => router.push('/home')}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-[#242424] hover:text-white"
              title="홈으로"
            >
              <Home className="h-5 w-5" />
            </button>
            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-[#242424] hover:text-white"
              title="돌아가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <h1 className="font-serif text-lg font-semibold text-white">{result.year}년 신년 운세</h1>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="rounded-full p-2 hover:bg-[#242424]"
              title="공유하기"
            >
              <Share2 className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* 메인 콘텐츠 */}
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* 연간 요약 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#333] bg-[#1a1a1a] p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
              >
                <Sparkles className="h-6 w-6" style={{ color: BRAND_COLORS.primary }} />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">
                  {result.year}년{' '}
                  <span style={{ color: BRAND_COLORS.primary }}>{result.yearlyTheme}</span>
                </h2>
                <p className="text-gray-400">종합 점수: {result.overallScore}점</p>
              </div>
            </div>

            {/* 점수 게이지 */}
            <div className="mb-4">
              <div className="h-4 overflow-hidden rounded-full bg-[#333]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.overallScore}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      result.overallScore >= 70
                        ? '#22c55e'
                        : result.overallScore >= 50
                          ? '#eab308'
                          : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* 요약 */}
            <p className="leading-relaxed text-gray-300">{result.summary}</p>
          </motion.div>

          {/* 월별 타임라인 */}
          {result.monthlyFortunes && result.monthlyFortunes.length > 0 && (
            <MonthlyTimeline monthlyFortunes={result.monthlyFortunes} year={result.year} />
          )}

          {/* 길흉일 캘린더 */}
          {result.monthlyFortunes && result.monthlyFortunes.length > 0 && (
            <LuckyDaysCalendar monthlyFortunes={result.monthlyFortunes} year={result.year} />
          )}

          {/* 분야별 조언 */}
          {result.yearlyAdvice && (
            <YearlyAdviceCard yearlyAdvice={result.yearlyAdvice} year={result.year} />
          )}

          {/* 핵심 날짜 */}
          {result.keyDates && result.keyDates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-[#333] bg-[#1a1a1a] p-6 shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
                >
                  <Calendar className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white">연중 핵심 날짜</h3>
                  <p className="text-sm text-gray-400">{result.year}년 주목해야 할 중요한 날들</p>
                </div>
              </div>

              <div className="space-y-3">
                {result.keyDates.map((keyDate, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${
                      keyDate.type === 'lucky'
                        ? 'border border-green-900/50 bg-green-900/20'
                        : keyDate.type === 'unlucky'
                          ? 'border border-red-900/50 bg-red-900/20'
                          : 'border border-[#444] bg-[#242424]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{keyDate.date}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          keyDate.type === 'lucky'
                            ? 'bg-green-900/50 text-green-400'
                            : keyDate.type === 'unlucky'
                              ? 'bg-red-900/50 text-red-400'
                              : 'bg-[#333] text-gray-300'
                        }`}
                      >
                        {keyDate.type === 'lucky'
                          ? '길일'
                          : keyDate.type === 'unlucky'
                            ? '주의'
                            : '특별일'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{keyDate.significance}</p>
                    {keyDate.recommendation && (
                      <p className="mt-2 text-sm text-gray-500">💡 {keyDate.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 고전 인용 */}
          {result.classicalReferences && result.classicalReferences.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl border border-[#333] bg-[#1a1a1a] p-6 shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
                >
                  <BookOpen className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white">고전 참조</h3>
                  <p className="text-sm text-gray-400">자평진전, 궁통보감 등 고전 인용</p>
                </div>
              </div>

              <div className="space-y-4">
                {result.classicalReferences.map((ref, index) => (
                  <div key={index} className="rounded-lg bg-[#242424] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${BRAND_COLORS.primary}20`,
                          color: BRAND_COLORS.primary,
                        }}
                      >
                        {ref.source}
                      </span>
                    </div>
                    <p className="font-serif italic text-gray-300">&ldquo;{ref.quote}&rdquo;</p>
                    <p className="mt-2 text-sm text-gray-400">{ref.interpretation}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button
              onClick={() => router.push('/analysis/yearly')}
              className="flex-1 text-[#0a0a0a]"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              <Calendar className="mr-2 h-5 w-5" />
              다른 연도 분석하기
            </Button>
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 border-[#333] text-white hover:bg-[#242424]"
            >
              마이페이지로 이동
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
