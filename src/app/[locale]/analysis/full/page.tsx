'use client';

/**
 * 전체 사주 분석 진입점
 * 프로필 선택 후 리포트 생성 플로우로 연결
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import { useProfiles } from '@/hooks/use-profiles';
import { useReportCreditsCheck } from '@/hooks/use-credits';
import { InsufficientCreditsDialog, CreditDeductionDialog } from '@/components/credits';
import type { ProfileResponse } from '@/types/profile';

export default function FullAnalysisPage() {
  const t = useTranslations('analysis');
  const tProfile = useTranslations('profile');
  const router = useRouter();

  const { data: profiles, isLoading } = useProfiles();
  const { data: creditsData } = useReportCreditsCheck();

  const [selectedProfile, setSelectedProfile] = useState<ProfileResponse | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);

  /**
   * 프로필 선택 후 분석 시작
   */
  const handleStartAnalysis = (profile: ProfileResponse) => {
    // 이미 완료된 리포트가 있는 경우 → 리포트 페이지로 이동
    if (profile.reportStatus === 'completed') {
      router.push(`/profiles/${profile.id}/report`);
      return;
    }

    // 실패한 리포트가 있는 경우 → 크레딧 차감 없이 재시작
    if (profile.reportStatus === 'failed' || profile.reportStatus === 'pending') {
      router.push(`/profiles/${profile.id}/generating`);
      return;
    }

    // 크레딧 부족 확인
    if (creditsData && !creditsData.sufficient) {
      setSelectedProfile(profile);
      setShowCreditsDialog(true);
      return;
    }

    // 크레딧 충분 → 차감 확인 다이얼로그 표시
    setSelectedProfile(profile);
    setShowDeductionDialog(true);
  };

  /**
   * 크레딧 차감 확인 후 분석 시작
   */
  const handleConfirmDeduction = () => {
    if (!selectedProfile) return;
    setShowDeductionDialog(false);
    router.push(`/profiles/${selectedProfile.id}/generating`);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-semibold text-[#1a1a1a]">
            {t('fullAnalysis.title', { defaultValue: '전체 사주 분석' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* 안내 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-[#d4af37]/20 bg-gradient-to-r from-[#d4af37]/5 to-transparent p-4"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-[#d4af37]" />
            <div>
              <p className="font-medium text-[#1a1a1a]">
                {t('fullAnalysis.selectProfile', { defaultValue: '분석할 프로필을 선택하세요' })}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t('fullAnalysis.creditInfo', {
                  defaultValue: '전체 사주 분석에는 50 크레딧이 필요합니다',
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
          </div>
        )}

        {/* 프로필 목록 */}
        {!isLoading && profiles && profiles.length > 0 && (
          <div className="space-y-3">
            {profiles.map((profile, index) => {
              const isFailed = profile.reportStatus === 'failed';
              const isCompleted = profile.reportStatus === 'completed';
              const isPending = profile.reportStatus === 'pending';

              return (
                <motion.button
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStartAnalysis(profile)}
                  className={`w-full rounded-xl border p-4 text-left shadow-sm transition-all hover:shadow-md ${
                    isFailed
                      ? 'border-red-200 bg-red-50/50 hover:border-red-300'
                      : isCompleted
                        ? 'border-green-200 bg-green-50/50 hover:border-green-300'
                        : 'border-gray-100 bg-white hover:border-[#d4af37]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1a1a1a]">{profile.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {profile.birthDate} · {profile.gender === 'male' ? '남' : '여'}
                      </p>
                      {/* 상태 배지 */}
                      {isFailed && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          분석 실패 - 무료 재시작 가능
                        </p>
                      )}
                      {isPending && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                          <RefreshCw className="h-3 w-3" />
                          대기 중 - 재시작 가능
                        </p>
                      )}
                      {isCompleted && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          분석 완료 - 결과 보기
                        </p>
                      )}
                    </div>
                    {isFailed ? (
                      <RefreshCw className="h-5 w-5 text-red-500" />
                    ) : isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-[#d4af37]" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && (!profiles || profiles.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <UserPlus className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-2 font-medium text-gray-600">
              {tProfile('empty.title', { defaultValue: '등록된 프로필이 없습니다' })}
            </p>
            <p className="mb-6 text-sm text-gray-400">
              {tProfile('empty.description', { defaultValue: '먼저 프로필을 등록해주세요' })}
            </p>
            <Button asChild className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white">
              <Link href="/profiles/new">
                <UserPlus className="mr-2 h-4 w-4" />
                {tProfile('actions.register', { defaultValue: '프로필 등록' })}
              </Link>
            </Button>
          </motion.div>
        )}
      </main>

      {/* 크레딧 부족 다이얼로그 */}
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
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
