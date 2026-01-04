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
import { ArrowLeft, Share2, Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import {
  ProfileInfoHeader,
  SajuTable,
  DaewunHorizontalScroll,
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
  personality: PersonalitySectionData;
  characteristics: CharacteristicsSectionData;
  aptitude: AptitudeSectionData;
  wealth: WealthSectionData;
  romance: RomanceSectionData;
}

/**
 * 프로필 리포트 페이지 컴포넌트
 */
export default function ProfileReportPage({ params }: PageProps) {
  const t = useTranslations('report');
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // params 처리
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  /**
   * 리포트 데이터 조회
   */
  const fetchReportData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      // TODO: 실제 API 연동 시 변경
      // const response = await fetch(`/api/profiles/${id}/report`);
      // if (!response.ok) throw new Error('리포트를 불러올 수 없습니다');
      // const data = await response.json();
      // setReportData(data);

      // 데모 데이터 (실제 구현 시 API 응답으로 대체)
      const demoData: ReportData = {
        profile: {
          name: '홍길동',
          gender: 'male',
          birthDate: '1991-11-25',
          birthTime: '03:30',
          calendarType: 'solar',
          age: 34,
        },
        pillars: {
          year: { stem: '辛', branch: '未', element: '金' },
          month: { stem: '己', branch: '亥', element: '土' },
          day: { stem: '甲', branch: '辰', element: '木' },
          hour: { stem: '丙', branch: '寅', element: '火' },
        },
        daewun: [
          { age: 10, stem: '戊', branch: '戌', startYear: 2001 },
          { age: 20, stem: '丁', branch: '酉', startYear: 2011 },
          { age: 30, stem: '丙', branch: '申', startYear: 2021 },
          { age: 40, stem: '乙', branch: '未', startYear: 2031 },
          { age: 50, stem: '甲', branch: '午', startYear: 2041 },
        ],
        personality: {
          willpower: { score: 72, description: '강한 의지력을 가지고 있습니다.' },
          outerPersonality: {
            label: '겉으로 보이는 성격',
            summary: '활발하고 사교적',
            description: '처음 만나는 사람에게 친근하게 다가가며, 밝은 에너지를 발산합니다.',
          },
          innerPersonality: {
            label: '내면의 성격',
            summary: '신중하고 깊은 사고',
            description: '겉으로는 활발해 보이지만, 내면에서는 깊이 생각하고 신중하게 결정합니다.',
          },
          socialStyle: {
            label: '대인관계 스타일',
            summary: '리더형 조율자',
            description: '모임에서 자연스럽게 중심이 되며, 갈등을 조율하는 역할을 합니다.',
          },
        },
        characteristics: {
          title: '사주 특성',
          subtitle: '당신만의 고유한 특성',
          paragraphs: [
            '甲木 일간으로 성장과 발전에 대한 강한 욕구를 가지고 있습니다.',
            '월지 亥水가 일간을 생하여 지적 호기심이 왕성합니다.',
            '시주 丙火가 빛나 표현력과 창의성이 돋보입니다.',
          ],
        },
        aptitude: {
          keywords: ['창의적', '분석적', '리더십', '소통능력', '기획력', '추진력'],
          mainTalent: {
            label: '주 재능',
            title: '당신의 핵심 재능은?',
            content: '기획력과 창의적 사고가 뛰어나며, 새로운 아이디어를 구체화하는 능력이 있습니다.',
          },
          talentStatus: {
            label: '재능의 상태',
            title: '현재 재능 활용도는?',
            content: '약 60% 정도 활용 중입니다. 더 적극적인 도전이 필요합니다.',
          },
          careerChoice: {
            label: '진로선택',
            title: '어떤 방향이 좋을까요?',
            content: '창의성을 발휘할 수 있는 기획, 마케팅, 컨설팅 분야가 적합합니다.',
          },
          recommendedJobs: ['기획자', '마케터', '컨설턴트', '스타트업 창업', '콘텐츠 크리에이터'],
          workStyle: {
            label: '업무스타일',
            title: '일하는 방식의 특징은?',
            content: '목표 지향적이며, 효율을 중시합니다. 팀워크보다는 독립적인 업무를 선호합니다.',
          },
          studyStyle: {
            label: '학업스타일',
            title: '학습 방식의 특징은?',
            content: '이론보다 실습을 선호하며, 직접 경험하면서 배우는 것을 좋아합니다.',
          },
          jobAbilityTraits: [
            { label: '기획력', value: 85 },
            { label: '추진력', value: 72 },
            { label: '실행력', value: 68 },
            { label: '완성도', value: 55 },
            { label: '관리력', value: 60 },
          ],
        },
        wealth: {
          wealthFortune: {
            label: '재물복',
            title: '내안에 존재하는 재물복',
            content: '재물복이 강한 편이며 계산이 빠르고 알뜰살뜰한 절약형이라 쓸데 없는 낭비가 없다. 고수의 위험투자는 좋아하지 않고 안전한 간접투자를 좋아하며 견보기보다 더 실속있는 알부자 타입입니다.',
          },
          partnerInfluence: {
            label: '이성의 존재',
            title: '내안에 있는 이성의 존재형태',
            content: '팔자안에 이성을 만날 조건이 충분히 조성되어 있어 애쓰지 않아도 쉽게 연인을 구하게 된다. 어딜 가도 여자가 많은 환경에 처하게 되며 유혹에 노출되기 쉬우나 현실적이고 실속있게 연애하는 인연이 있다.',
          },
          wealthTraits: [
            { label: '여운정', value: 46 },
            { label: '활동력', value: 60 },
            { label: '모험심', value: 28 },
            { label: '사업감각', value: 17 },
            { label: '신뢰성', value: 64 },
          ],
          score: 68,
        },
        romance: {
          datingPsychology: {
            label: '연애심리',
            title: '결혼전 연애/데이트 심리',
            content: '연애에 있어 감성적이고 로맨틱한 면이 있습니다. 상대방에게 진심을 다하며, 깊은 감정적 교류를 원합니다.',
          },
          spouseView: {
            label: '배우자관',
            title: '결혼후 배우자를 보는 눈',
            content: '배우자에게 안정감과 신뢰를 중요시합니다. 가정적이고 책임감 있는 파트너를 원합니다.',
          },
          personalityPattern: {
            label: '성격패턴',
            title: '결혼후 성격인 패턴',
            content: '결혼 후에는 더 안정적이고 가정 중심적인 성격으로 변화합니다.',
          },
          romanceTraits: {
            consideration: 57,
            humor: 20,
            artistry: 30,
            vanity: 11,
            adventure: 28,
            sincerity: 54,
            sociability: 20,
            financial: 64,
            reliability: 64,
            expression: 40,
          },
          score: 62,
        },
      };

      setReportData(demoData);
    } catch (err) {
      console.error('[ProfileReportPage] 조회 실패:', err);
      setError(err instanceof Error ? err.message : '리포트를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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
    console.log('PDF 다운로드');
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

  // 데이터 없음
  if (!reportData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f8f8]">
        <p className="mb-4 text-gray-500">리포트 데이터를 찾을 수 없습니다</p>
        <Button asChild variant="outline">
          <Link href={`/profiles/${id}`}>프로필로 돌아가기</Link>
        </Button>
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

          {/* 섹션 2: 성격 분석 */}
          <section id="personality" className="scroll-mt-32">
            <PersonalitySection {...reportData.personality} />
          </section>

          {/* 섹션 3: 사주 특성 */}
          <section id="characteristics" className="scroll-mt-32">
            <CharacteristicsSection {...reportData.characteristics} />
          </section>

          {/* 섹션 4: 적성과 직업 */}
          <section id="aptitude" className="scroll-mt-32">
            <AptitudeSection data={reportData.aptitude} />
          </section>

          {/* 섹션 5: 재물운 */}
          <section id="wealth" className="scroll-mt-32">
            <WealthSection data={reportData.wealth} />
          </section>

          {/* 섹션 6: 연애/결혼 */}
          <section id="romance" className="scroll-mt-32">
            <RomanceSection data={reportData.romance} />
          </section>
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
