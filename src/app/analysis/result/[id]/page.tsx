'use client';

/**
 * 분석 결과 페이지
 * PRD 섹션 5.8 기반
 * Task 16: DB 조회 + 후속 질문 기능 추가
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PillarCard,
  ElementChart,
  ElementRelationGraph,
  AnalysisTabs,
  DaewunTimeline,
  FollowUpQuestion,
} from '@/components/analysis';
import { useSession } from 'next-auth/react';
import { useAnalysisStore } from '@/stores/analysis';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { SajuAnalysisResult } from '@/lib/ai/types';
import type { PillarsHanja, DaewunItem, Jijanggan } from '@/types/saju';

/** 질문 아이템 타입 */
interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  creditsUsed: number;
  createdAt: string;
}

/** DB에서 가져온 분석 데이터 */
interface AnalysisData {
  id: string;
  birthDatetime: string;
  timezone: string;
  pillars: PillarsHanja;
  daewun: DaewunItem[];
  analysis: SajuAnalysisResult;
  pillarImage: string | null;
  questions: QuestionItem[];
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;
  const { data: session } = useSession();

  // Zustand 스토어 (방금 분석한 경우)
  const {
    analysisResult: storeResult,
    pillarImage: storeImage,
    pillarsData: storePillars,
    jijangganData: storeJijanggan,
    daewunData: storeDaewun,
    sajuInput,
    questions: storeQuestions,
    setQuestions,
  } = useAnalysisStore();

  // 로컬 상태 (DB에서 가져온 경우)
  const [isLoading, setIsLoading] = useState(true);
  const [dbData, setDbData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(0);

  // 사용자 크레딧 조회
  const fetchUserCredits = useCallback(async () => {
    if (!session?.user) return;
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || 0);
      }
    } catch (err) {
      console.error('[ResultPage] 크레딧 조회 실패:', err);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchUserCredits();
  }, [fetchUserCredits]);

  // 실제 사용할 데이터 결정
  const analysisResult = storeResult || dbData?.analysis;
  const pillarImage = storeImage || dbData?.pillarImage;
  const pillarsData = storePillars || dbData?.pillars;
  const daewunData = storeDaewun || dbData?.daewun;
  const jijangganData = storeJijanggan || null;
  const questions = storeQuestions.length > 0 ? storeQuestions : dbData?.questions || [];

  /**
   * DB에서 분석 결과 조회
   */
  const fetchAnalysisFromDB = useCallback(async () => {
    // temp ID이거나 스토어에 데이터가 있으면 DB 조회 스킵
    if (analysisId === 'temp' || (storeResult && storeImage && storePillars)) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/analysis/${analysisId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('분석 결과를 찾을 수 없습니다');
        } else if (response.status === 401) {
          router.push('/auth/signin');
          return;
        } else {
          setError('데이터를 불러오는 중 오류가 발생했습니다');
        }
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setDbData({
          id: result.data.id,
          birthDatetime: result.data.birthDatetime,
          timezone: result.data.timezone,
          pillars: result.data.pillars,
          daewun: result.data.daewun,
          analysis: result.data.analysis,
          pillarImage: result.data.pillarImage,
          questions: result.data.questions.map(
            (q: {
              id: string;
              question: string;
              answer: string;
              credits_used: number;
              created_at: string;
            }) => ({
              id: q.id,
              question: q.question,
              answer: q.answer,
              creditsUsed: q.credits_used,
              createdAt: q.created_at,
            })
          ),
        });

        // 스토어에 질문 히스토리 저장
        if (result.data.questions?.length > 0) {
          setQuestions(
            result.data.questions.map(
              (q: {
                id: string;
                question: string;
                answer: string;
                credits_used: number;
                created_at: string;
              }) => ({
                id: q.id,
                question: q.question,
                answer: q.answer,
                createdAt: q.created_at,
              })
            )
          );
        }
      }
    } catch (err) {
      console.error('[ResultPage] DB 조회 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, storeResult, storeImage, storePillars, router, setQuestions]);

  // 페이지 로드 시 DB 조회
  useEffect(() => {
    fetchAnalysisFromDB();
  }, [fetchAnalysisFromDB]);

  // 데이터가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!isLoading && !analysisResult && !pillarImage && !pillarsData && !error) {
      router.push('/');
    }
  }, [isLoading, analysisResult, pillarImage, pillarsData, error, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
          <p className="text-gray-500">분석 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!analysisResult || !pillarImage || !pillarsData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">결과를 불러오는 중...</p>
      </div>
    );
  }

  // 사용자 정보 표시용
  const birthInfo = sajuInput
    ? `${sajuInput.birthDate.getFullYear()}년 ${sajuInput.birthDate.getMonth() + 1}월 ${sajuInput.birthDate.getDate()}일 ${sajuInput.birthTime}`
    : dbData?.birthDatetime
      ? new Date(dbData.birthDatetime).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="공유하기">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="PDF 다운로드">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="font-serif text-3xl font-bold" style={{ color: BRAND_COLORS.secondary }}>
            사주 분석 결과
          </h1>
          {birthInfo && <p className="mt-2 text-sm text-gray-500">{birthInfo} 출생</p>}
        </motion.div>

        {/* 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
        >
          <p
            className="text-center font-serif text-lg leading-relaxed"
            style={{ color: BRAND_COLORS.secondary }}
          >
            {analysisResult.summary}
          </p>
        </motion.div>

        {/* 섹션들 */}
        <div className="space-y-8">
          {/* 1. 명반 이미지 */}
          <section>
            <PillarCard
              imageBase64={pillarImage}
              pillarsData={pillarsData}
              jijangganData={jijangganData}
            />
          </section>

          {/* 2. 오행 비율 차트 */}
          <section>
            <ElementChart pillars={pillarsData} />
          </section>

          {/* 3. 오행 상생상극 관계도 */}
          <section>
            <ElementRelationGraph pillars={pillarsData} />
          </section>

          {/* 4. AI 분석 탭 */}
          <section>
            <AnalysisTabs result={analysisResult} />
          </section>

          {/* 5. 대운 타임라인 */}
          {daewunData && (
            <section>
              <DaewunTimeline yearlyFlow={analysisResult.yearly_flow || []} daewun={daewunData} />
            </section>
          )}
        </div>

        {/* 후속 질문 섹션 */}
        {analysisId !== 'temp' && session?.user ? (
          <section className="mt-12">
            <FollowUpQuestion
              analysisId={analysisId}
              userCredits={userCredits}
              onCreditUpdate={setUserCredits}
            />
          </section>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg"
          >
            <h3 className="font-serif text-lg font-semibold text-gray-900">
              더 궁금한 점이 있으신가요?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {analysisId === 'temp'
                ? '분석 결과가 저장되면 AI에게 추가 질문을 할 수 있습니다.'
                : '로그인하면 AI에게 추가 질문을 할 수 있습니다.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/analysis/focus')}>
                새로운 분석
              </Button>
              {!session?.user && (
                <Button
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                  className="text-black hover:opacity-90"
                  onClick={() => router.push('/auth/signin')}
                >
                  로그인하기
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* 푸터 */}
        <footer className="mt-12 text-center text-xs text-gray-400">
          <p>본 분석은 AI가 생성한 참고 자료이며, 중요한 결정에 앞서 전문가 상담을 권장합니다.</p>
          <p className="mt-1">© {new Date().getFullYear()} Master&apos;s Insight AI</p>
        </footer>
      </main>
    </div>
  );
}
