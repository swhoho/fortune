'use client';

/**
 * 프로필 리포트 페이지
 * Task 20: 전체 리포트 레이아웃
 *
 * 섹션 구조:
 * 1. 사주명식 (ProfileInfoHeader + SajuTable + DaewunHorizontalScroll)
 * 2. 성격 분석 (PersonalitySection)
 * 3. 사주 특성 (CharacteristicsSection)
 * 4. 적성과 직업 (AptitudeSection)
 * 5. 재물운 (WealthSection)
 * 6. 연애/결혼 (RomanceSection)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Download, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import {
  ProfileInfoHeader,
  SajuTable,
  DaewunHorizontalScroll,
  DaewunDetailSection,
  PersonalitySection,
  CharacteristicsSection,
  AptitudeSection,
  WealthSection,
  RomanceSection,
  ReportNavigation,
} from '@/components/report';
import type {
  ReportProfileInfo,
  PersonalitySectionData,
  CharacteristicsSectionData,
  AptitudeSectionData,
  ReportDaewunItem,
} from '@/types/report';
import type { WealthSectionData } from '@/components/report/WealthSection';
import type { RomanceSectionData } from '@/components/report/RomanceSection';
import type { PillarsHanja } from '@/types/saju';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

/** 리포트 전체 데이터 */
interface ReportData {
  profile: ReportProfileInfo;
  pillars: PillarsHanja;
  daewun: ReportDaewunItem[];
  personality: PersonalitySectionData | null;
  characteristics: CharacteristicsSectionData | null;
  aptitude: AptitudeSectionData | null;
  wealth: WealthSectionData | null;
  romance: RomanceSectionData | null;
}

/**
 * 프로필 리포트 페이지 컴포넌트
 */
export default function ProfileReportPage({ params }: PageProps) {
  // const t = useTranslations('report'); // TODO: 다국어 적용 시 사용
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noReport, setNoReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // params 처리 (Promise 또는 일반 객체 모두 지원)
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setId(p.id));
    } else {
      setId((params as { id: string; locale: string }).id);
    }
  }, [params]);

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
        // generating 페이지로 리다이렉트
        router.push(`/profiles/${id}/generating`);
        return;
      }

      // 리포트 데이터 설정 (TODO: 실제 API 응답 구조에 맞게 변환 필요)
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
      // toast.success('링크가 복사되었습니다');
    }
  };

  // PDF 다운로드 핸들러
  const handleDownloadPdf = () => {
    // TODO: PDF 생성 및 다운로드 구현
  };

  // 로딩 상태
  if (isLoading || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
          <p className="text-gray-500">리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f8f8]">
        <p className="mb-4 text-gray-500">{error}</p>
        <Button asChild variant="outline">
          <Link href={`/profiles/${id}`}>프로필로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  // 리포트 없음 - 분석 시작 유도
  if (noReport || !reportData) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/profiles/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-serif text-lg font-semibold text-[#1a1a1a]">사주 리포트</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* 빈 상태 */}
        <main className="mx-auto max-w-2xl px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 p-6">
              <Sparkles className="h-12 w-12 text-[#d4af37]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[#1a1a1a]">아직 사주 분석이 없습니다</h2>
            <p className="mb-8 text-gray-500">
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
              <Button variant="outline" asChild>
                <Link href={`/profiles/${id}`}>프로필로 돌아가기</Link>
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href={`/profiles/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">프로필</span>
            </Link>
          </Button>

          <h1 className="font-serif text-lg font-semibold text-[#1a1a1a]">
            {reportData.profile.name}님의 사주 리포트
          </h1>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare} title="공유하기">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownloadPdf} title="PDF 다운로드">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 스크롤 네비게이션 */}
      <ReportNavigation />

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-12">
          {/* 섹션 1: 사주명식 */}
          <section id="saju" className="scroll-mt-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <ProfileInfoHeader {...reportData.profile} />
              <SajuTable pillars={reportData.pillars} />
              <DaewunHorizontalScroll daewun={reportData.daewun} />
            </motion.div>
          </section>

          {/* 섹션 1.5: 대운 상세 분석 */}
          {reportData.daewun && reportData.daewun.length > 0 && (
            <section id="daewun" className="scroll-mt-32">
              <DaewunDetailSection
                daewun={reportData.daewun}
                currentAge={
                  reportData.profile.birthDate
                    ? Math.floor(
                        (Date.now() - new Date(reportData.profile.birthDate).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )
                    : undefined
                }
              />
            </section>
          )}

          {/* 섹션 2: 성격 분석 */}
          {reportData.personality && (
            <section id="personality" className="scroll-mt-32">
              <PersonalitySection {...reportData.personality} />
            </section>
          )}

          {/* 섹션 3: 사주 특성 */}
          {reportData.characteristics && (
            <section id="characteristics" className="scroll-mt-32">
              <CharacteristicsSection {...reportData.characteristics} />
            </section>
          )}

          {/* 섹션 4: 적성과 직업 */}
          {reportData.aptitude && (
            <section id="aptitude" className="scroll-mt-32">
              <AptitudeSection data={reportData.aptitude} />
            </section>
          )}

          {/* 섹션 5: 재물운 */}
          {reportData.wealth && (
            <section id="wealth" className="scroll-mt-32">
              <WealthSection data={reportData.wealth} />
            </section>
          )}

          {/* 섹션 6: 연애/결혼 */}
          {reportData.romance && (
            <section id="romance" className="scroll-mt-32">
              <RomanceSection data={reportData.romance} />
            </section>
          )}
        </div>

        {/* 푸터 */}
        <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
          <p>본 분석은 AI가 생성한 참고 자료이며, 중요한 결정에 앞서 전문가 상담을 권장합니다.</p>
          <p className="mt-1">© {new Date().getFullYear()} Master&apos;s Insight AI</p>
        </footer>
      </main>
    </div>
  );
}
