'use client';

/**
 * 프로필 상세 페이지 (인라인 편집 지원)
 * Task 5.1: /[locale]/profiles/[id]/page.tsx
 * Task 22-23: 리포트 생성 플로우 + 크레딧 연동
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProfileInfoCard, DeleteProfileDialog } from '@/components/profile';
import { InsufficientCreditsDialog, CreditDeductionDialog } from '@/components/credits';
import { useProfile, useUpdateProfile, useDeleteProfile } from '@/hooks/use-profiles';
import { useReportCreditsCheck } from '@/hooks/use-credits';
import { Link, useRouter } from '@/i18n/routing';
import type { CreateProfileInput } from '@/lib/validations/profile';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileDetailPage({ params }: PageProps) {
  const t = useTranslations('profile');
  // const tCredits = useTranslations('credits'); // TODO: 다국어 적용 시 사용
  const router = useRouter();
  const searchParams = useSearchParams();
  const [id, setId] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);

  // params 처리 (Promise 또는 일반 객체 모두 지원)
  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setId(p.id));
    } else {
      // 클라이언트 사이드 네비게이션 시 일반 객체일 수 있음
      setId((params as { id: string }).id);
    }
  }, [params]);

  // URL 파라미터에서 에러 확인 (generating 페이지에서 리다이렉트 시)
  useEffect(() => {
    if (searchParams.get('error') === 'insufficient_credits') {
      setShowInsufficientCreditsDialog(true);
    }
  }, [searchParams]);

  // 데이터 조회
  const { data: profile, isLoading } = useProfile(id);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: deleteProfile, isPending: isDeleting } = useDeleteProfile();

  // 크레딧 확인
  const { data: creditsData } = useReportCreditsCheck();

  // 리포트 상태 확인 (status API 사용)
  const { data: reportStatusData } = useQuery({
    queryKey: ['profile-report-status', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/profiles/${id}/report/status`);
      if (res.status === 404) return { status: null };
      if (!res.ok) throw new Error('리포트 상태 조회 실패');
      return res.json();
    },
    enabled: !!id,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // 진행 중이거나 대기 중일 때만 3초마다 폴링
      if (status === 'in_progress' || status === 'pending') return 3000;
      return false;
    },
  });

  const reportStatus = reportStatusData?.status as
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | null;
  const hasReport = reportStatus === 'completed';

  /**
   * 저장 핸들러
   */
  const handleSave = (data: CreateProfileInput) => {
    if (!id) return;

    updateProfile(
      { id, data },
      {
        onSuccess: () => {
          toast.success(t('toast.updateSuccess'));
        },
        onError: (error) => {
          toast.error(error.message || t('toast.error'));
        },
      }
    );
  };

  /**
   * 삭제 핸들러
   */
  const handleDelete = () => {
    if (!id) return;

    deleteProfile(id, {
      onSuccess: () => {
        toast.success(t('toast.deleteSuccess'));
        router.push('/profiles');
      },
      onError: (error) => {
        toast.error(error.message || t('toast.error'));
        setShowDeleteDialog(false);
      },
    });
  };

  /**
   * 리포트 생성 핸들러
   * 크레딧 확인 후 차감 확인 다이얼로그 표시
   */
  const handleGenerateReport = () => {
    // 크레딧 부족 확인
    if (creditsData && !creditsData.sufficient) {
      setShowInsufficientCreditsDialog(true);
      return;
    }

    // 크레딧 충분 → 차감 확인 다이얼로그 표시
    setShowDeductionDialog(true);
  };

  /**
   * 크레딧 차감 확인 후 분석 시작
   */
  const handleConfirmDeduction = () => {
    setShowDeductionDialog(false);
    router.push(`/profiles/${id}/generating`);
  };

  /**
   * 리포트 보기 핸들러
   */
  const handleViewReport = () => {
    router.push(`/profiles/${id}/report`);
  };

  /**
   * 실패한 리포트 재시작 핸들러 (무료)
   */
  const handleRetryReport = () => {
    // generating 페이지로 이동하면 자동으로 재시작됨
    router.push(`/profiles/${id}/generating`);
  };

  // 로딩 상태
  if (isLoading || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  // 프로필 없음
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f8f8]">
        <p className="mb-4 text-gray-500">프로필을 찾을 수 없습니다.</p>
        <Button asChild variant="outline">
          <Link href="/profiles">목록으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profiles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-semibold text-[#1a1a1a]">
            {t('pageTitle.detail')}
          </h1>
          <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ProfileInfoCard
            profile={profile}
            hasReport={hasReport}
            reportStatus={reportStatus}
            onGenerateReport={handleGenerateReport}
            onViewReport={handleViewReport}
            onRetryReport={handleRetryReport}
            onSave={handleSave}
            onDelete={() => setShowDeleteDialog(true)}
            isSaving={isUpdating}
          />
        </motion.div>
      </main>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteProfileDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        profileName={profile.name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* 크레딧 부족 다이얼로그 */}
      <InsufficientCreditsDialog
        open={showInsufficientCreditsDialog}
        onOpenChange={setShowInsufficientCreditsDialog}
        required={creditsData?.required ?? 50}
        current={creditsData?.current ?? 0}
        onCharge={() => router.push('/payment')}
      />

      {/* 크레딧 차감 확인 다이얼로그 */}
      <CreditDeductionDialog
        open={showDeductionDialog}
        onOpenChange={setShowDeductionDialog}
        required={creditsData?.required ?? 50}
        current={creditsData?.current ?? 0}
        onConfirm={handleConfirmDeduction}
      />
    </div>
  );
}
