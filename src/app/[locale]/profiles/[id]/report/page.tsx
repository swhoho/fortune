'use client';

/**
 * 프로필 리포트 페이지
 * Task 21: 사주/대운 탭 분리
 * Task: 상담 탭 추가
 *
 * 탭 구조:
 * 1. 사주 탭: 프로필 + 명식 + 대운 미리보기 + 성격/특성/적성/재물/연애 분석
 * 2. 대운 탭: 프로필 + 대운 상세 분석
 * 3. 상담 탭: AI 상담 (채팅 형태)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Loader2, Sparkles, Home } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import {
  ProfileInfoHeader,
  SajuTable,
  DaewunHorizontalScroll,
  DaewunDetailSection,
  PersonalitySection,
  AptitudeSection,
  WealthSection,
  RomanceSection,
  ReportNavigation,
  BasicAnalysisSection,
  DetailedScoresSection,
} from '@/components/report';
import { ConsultationTab } from '@/components/consultation';
import type { ReportTabType } from '@/components/report/ReportNavigation';
import type {
  ReportProfileInfo,
  PersonalitySectionData,
  AptitudeSectionData,
  ReportDaewunItem,
  BasicAnalysisData,
  JijangganData,
  DetailedScoresData,
} from '@/types/report';
import type { WealthSectionData } from '@/components/report/WealthSection';
import type { RomanceSectionData } from '@/components/report/RomanceSection';
import type { PillarsHanja } from '@/types/saju';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

/** 리포트 전체 데이터 */
interface ReportData {
  reportId?: string;
  failedSteps?: string[];
  profile: ReportProfileInfo;
  pillars: PillarsHanja;
  daewun: ReportDaewunItem[];
  jijanggan?: JijangganData | null;
  basicAnalysis?: BasicAnalysisData | null;
  personality: PersonalitySectionData | null;
  aptitude: AptitudeSectionData | null;
  wealth: WealthSectionData | null;
  romance: RomanceSectionData | null;
  detailedScores?: DetailedScoresData | null;
}

/** 성격 재분석 섹션 타입 */
type PersonalityReanalyzeSection = 'outer' | 'inner' | 'social';

/**
 * 프로필 리포트 페이지 컴포넌트
 */
export default function ProfileReportPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noReport, setNoReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<ReportTabType>('saju');
  // 대운 탭 미확인 표시 (처음 방문 시에만 보여줌)
  const [showDaewunIndicator, setShowDaewunIndicator] = useState(true);
  // 성격 재분석 상태
  const [reanalyzingSection, setReanalyzingSection] = useState<PersonalityReanalyzeSection | null>(
    null
  );

  // URL의 tab 파라미터 감지
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'daewun') {
      setActiveTab('daewun');
      setShowDaewunIndicator(false); // URL로 대운 탭 접근 시 indicator 숨김
    } else if (tab === 'consultation') {
      setActiveTab('consultation');
    } else {
      setActiveTab('saju');
    }
  }, [searchParams]);

  // params 처리 (Promise 또는 일반 객체 모두 지원)
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setId(p.id));
    } else {
      setId((params as { id: string; locale: string }).id);
    }
  }, [params]);

  /**
   * 탭 변경 핸들러
   */
  const handleTabChange = (tab: ReportTabType) => {
    setActiveTab(tab);
    // 대운 탭 방문 시 indicator 숨김
    if (tab === 'daewun') {
      setShowDaewunIndicator(false);
    }
    // URL 업데이트 (히스토리 오염 방지를 위해 replace 사용)
    const newUrl = tab === 'saju' ? `/profiles/${id}/report` : `/profiles/${id}/report?tab=${tab}`;
    router.replace(newUrl);
  };

  /**
   * 현재 나이 계산
   */
  const calculateCurrentAge = useCallback((birthDate: string | undefined): number | undefined => {
    if (!birthDate) return undefined;
    return Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
  }, []);

  /**
   * 리포트 데이터 조회
   */
  const fetchReportData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      setNoReport(false);

      const response = await fetch(`/api/profiles/${id}/report`);

      // 리포트 없음 (404)
      if (response.status === 404) {
        setNoReport(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('리포트를 불러올 수 없습니다');
      }

      const data = await response.json();

      // 리포트가 아직 완료되지 않은 경우
      if (data.status === 'pending' || data.status === 'in_progress') {
        router.push(`/profiles/${id}/generating`);
        return;
      }

      if (data.success && data.data) {
        setReportData(data.data);
      } else {
        setNoReport(true);
      }
    } catch (err) {
      console.error('[ProfileReportPage] 조회 실패:', err);
      setError(err instanceof Error ? err.message : '리포트를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchReportData();
    }
  }, [id, fetchReportData]);

  // 공유 핸들러
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${reportData?.profile.name}님의 사주 리포트`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  /** 폴링 인터벌 참조 (타임아웃 시 정리용) */
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 성격 섹션 재분석 핸들러
   * 기존 재분석 API 사용 (5C 크레딧 필요)
   */
  const handleReanalyze = useCallback(
    async (_section: PersonalityReanalyzeSection) => {
      if (!id) {
        console.warn('[handleReanalyze] 프로필 ID가 없습니다');
        return;
      }

      // 기존 폴링/타임아웃 정리
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

      setReanalyzingSection(_section);
      try {
        // 기존 재분석 API 호출 (personality 섹션 전체 재분석)
        const response = await fetch(`/api/profiles/${id}/report/reanalyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionType: 'personality' }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[handleReanalyze] 재분석 실패:', errorData);
          toast.error('재분석 요청에 실패했습니다. 잠시 후 다시 시도해주세요.');
          setReanalyzingSection(null);
          return;
        }

        const result = await response.json();
        if (result.success && result.data?.pollUrl) {
          // 폴링 시작 - 완료될 때까지 대기 후 새로고침
          pollIntervalRef.current = setInterval(async () => {
            try {
              const pollResponse = await fetch(result.data.pollUrl);
              const pollData = await pollResponse.json();
              if (pollData.data?.status === 'completed') {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
                await fetchReportData();
                setReanalyzingSection(null);
                toast.success('재분석이 완료되었습니다.');
              } else if (pollData.data?.status === 'failed') {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
                const errorMsg = pollData.data?.errorMessage || '알 수 없는 오류';
                console.error('[handleReanalyze] 재분석 실패:', errorMsg);
                toast.error(`재분석에 실패했습니다: ${errorMsg}`);
                setReanalyzingSection(null);
              }
            } catch (pollErr) {
              console.error('[handleReanalyze] 폴링 오류:', pollErr);
            }
          }, 2000);

          // 최대 90초 후 타임아웃
          pollTimeoutRef.current = setTimeout(() => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setReanalyzingSection(null);
            toast.error('재분석 시간이 초과되었습니다. 다시 시도해주세요.');
          }, 90000);
        }
      } catch (err) {
        console.error('[handleReanalyze] 재분석 요청 오류:', err);
        toast.error('재분석 요청 중 오류가 발생했습니다.');
        setReanalyzingSection(null);
      }
    },
    [id, fetchReportData]
  );

  // 로딩 상태
  if (isLoading || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
          <p className="text-gray-400">리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a]">
        <p className="mb-4 text-gray-400">{error}</p>
        <Button
          asChild
          variant="outline"
          className="border-[#333] bg-transparent text-white hover:bg-[#1a1a1a]"
        >
          <Link href={`/profiles/${id}`}>프로필로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  // 리포트 없음 - 분석 시작 유도
  if (noReport || !reportData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <header className="sticky top-0 z-10 border-b border-[#333] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-10 w-10 text-gray-400 hover:text-white"
              >
                <Link href="/home">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-10 w-10 text-gray-400 hover:text-white"
              >
                <Link href={`/profiles/${id}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <h1 className="font-serif text-lg font-semibold text-white">사주 리포트</h1>
            <div className="w-20" />
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 p-6">
              <Sparkles className="h-12 w-12 text-[#d4af37]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">아직 사주 분석이 없습니다</h2>
            <p className="mb-8 text-gray-400">
              전체 사주 분석을 시작하여 상세한 리포트를 확인하세요
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push(`/profiles/${id}/generating`)}
                className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                사주 분석 시작
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-[#333] bg-transparent text-white hover:bg-[#1a1a1a]"
              >
                <Link href={`/profiles/${id}`}>프로필로 돌아가기</Link>
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const currentAge = calculateCurrentAge(reportData.profile.birthDate);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 border-b border-[#333] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10 text-gray-400 hover:text-white"
            >
              <Link href="/home">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10 text-gray-400 hover:text-white"
            >
              <Link href={`/profiles/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <h1 className="font-serif text-lg font-semibold text-white">
            {reportData.profile.name}님의 사주 리포트
          </h1>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              title="공유하기"
              className="h-10 w-10 text-gray-400 hover:text-white"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <ReportNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showDaewunIndicator={showDaewunIndicator}
      />

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'saju' && (
            <motion.div
              key="saju-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* 사주 탭: 프로필 + 명식 + 지장간 + 대운 미리보기 */}
              <section className="space-y-6">
                <ProfileInfoHeader {...reportData.profile} />
                <SajuTable
                  pillars={reportData.pillars}
                  jijanggan={reportData.jijanggan || undefined}
                />
                <DaewunHorizontalScroll daewun={reportData.daewun} />
              </section>

              {/* Task 25: 기본 분석 (용신/기신/격국/일간) */}
              {reportData.basicAnalysis && <BasicAnalysisSection data={reportData.basicAnalysis} />}

              {/* 성격 분석 */}
              {reportData.personality && (
                <PersonalitySection
                  {...reportData.personality}
                  onReanalyze={handleReanalyze}
                  reanalyzingSection={reanalyzingSection}
                />
              )}

              {/* 적성과 직업 */}
              {reportData.aptitude && <AptitudeSection data={reportData.aptitude} />}

              {/* 재물운 */}
              {reportData.wealth && <WealthSection data={reportData.wealth} />}

              {/* 연애/결혼 */}
              {reportData.romance && <RomanceSection data={reportData.romance} />}

              {/* Task 25: 세부 점수 레이더 차트 */}
              {reportData.detailedScores && (
                <DetailedScoresSection data={reportData.detailedScores} />
              )}
            </motion.div>
          )}

          {activeTab === 'daewun' && (
            <motion.div
              key="daewun-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* 대운 탭: 프로필 간략 + 대운 상세 */}
              <section className="space-y-6">
                <ProfileInfoHeader {...reportData.profile} />
              </section>

              {/* 대운 상세 분석 */}
              {reportData.daewun && reportData.daewun.length > 0 ? (
                <DaewunDetailSection daewun={reportData.daewun} currentAge={currentAge} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-gray-400">대운 정보가 없습니다</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'consultation' && (
            <motion.div
              key="consultation-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 상담 탭: AI 상담 채팅 */}
              <div className="mb-6">
                <h2 className="mb-2 text-xl font-semibold text-white">AI 상담</h2>
                <p className="text-sm text-gray-400">
                  분석된 사주와 대운을 기반으로 전문가 AI에게 상담을 받아보세요.
                </p>
              </div>
              <ConsultationTab profileId={id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 푸터 */}
        <footer className="mt-16 border-t border-[#333] pt-8 text-center text-xs text-gray-500">
          <p>본 분석은 AI가 생성한 참고 자료이며, 중요한 결정에 앞서 전문가 상담을 권장합니다.</p>
          <p className="mt-1">© {new Date().getFullYear()} Master&apos;s Insight AI</p>
        </footer>
      </main>
    </div>
  );
}
