'use client';

/**
 * 신년 분석 결과 페이지
 * Task 20: /[locale]/analysis/yearly/result/[id]
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Share2, Sparkles, Calendar, BookOpen, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout';
import {
  MonthlyTimeline,
  LuckyDaysCalendar,
  YearlyAdviceCard,
  FailedSectionCard,
} from '@/components/analysis/yearly';
import { useYearlyStore } from '@/stores/yearly-store';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { YearlyAnalysisResult } from '@/lib/ai/types';

/** 재분석 가능한 단계 타입 */
type ReanalyzableStep = 'yearly_advice' | 'classical_refs';

export default function YearlyResultPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const { yearlyResult, setYearlyResult } = useYearlyStore();
  const [loading, setLoading] = useState(!yearlyResult);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyAnalysisResult | null>(yearlyResult);
  const [reanalyzingStep, setReanalyzingStep] = useState<ReanalyzableStep | null>(null);

  /**
   * 특정 섹션 재분석 핸들러
   */
  const handleReanalyze = async (stepType: ReanalyzableStep) => {
    setReanalyzingStep(stepType);
    try {
      const response = await fetch(`/api/analysis/yearly/${analysisId}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepType }),
      });

      if (!response.ok) {
        throw new Error('재분석에 실패했습니다');
      }

      const data = await response.json();

      // 결과 업데이트 (방어적 접근: 중첩된 result 처리)
      if (data.success && data.data?.result && result) {
        const updatedResult: YearlyAnalysisResult = { ...result };
        // Python 응답이 중첩된 경우 처리 (result.result 또는 result)
        const resultData = data.data.result?.result || data.data.result || {};

        // stepType에 따라 해당 필드 업데이트
        if (stepType === 'yearly_advice' && resultData.yearlyAdvice) {
          updatedResult.yearlyAdvice = resultData.yearlyAdvice;
        } else if (stepType === 'classical_refs' && resultData.classicalReferences) {
          updatedResult.classicalReferences = resultData.classicalReferences;
        }

        setResult(updatedResult);
        setYearlyResult(updatedResult);
      }
    } catch (err) {
      console.error('재분석 오류:', err);
      setError(err instanceof Error ? err.message : '재분석 중 오류가 발생했습니다');
    } finally {
      setReanalyzingStep(null);
    }
  };

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
          {result.yearlyAdvice ? (
            <YearlyAdviceCard yearlyAdvice={result.yearlyAdvice} year={result.year} />
          ) : (
            <FailedSectionCard
              title="운세 심층 분석"
              description="분야별 상세 조언과 가이드"
              onReanalyze={() => handleReanalyze('yearly_advice')}
              isReanalyzing={reanalyzingStep === 'yearly_advice'}
              icon={<Sparkles className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />}
            />
          )}

          {/* 고전 인용 */}
          {result.classicalReferences && result.classicalReferences.length > 0 ? (
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
          ) : (
            <FailedSectionCard
              title="고전 참조"
              description="자평진전, 궁통보감 등 고전 인용"
              onReanalyze={() => handleReanalyze('classical_refs')}
              isReanalyzing={reanalyzingStep === 'classical_refs'}
              icon={<BookOpen className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />}
            />
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
