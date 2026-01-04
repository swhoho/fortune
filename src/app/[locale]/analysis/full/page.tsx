'use client';

/**
 * 전체 사주 분석 진입점
 * 프로필 선택 후 리포트 생성 플로우로 연결
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import { useProfiles } from '@/hooks/use-profiles';
import { useReportCreditsCheck } from '@/hooks/use-credits';
import { InsufficientCreditsDialog } from '@/components/credits';
import type { ProfileResponse } from '@/types/profile';

export default function FullAnalysisPage() {
  const t = useTranslations('analysis');
  const tProfile = useTranslations('profile');
  const router = useRouter();

  const { data: profiles, isLoading } = useProfiles();
  const { data: creditsData } = useReportCreditsCheck();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  /**
   * 프로필 선택 후 분석 시작
   */
  const handleStartAnalysis = (profile: ProfileResponse) => {
    // 크레딧 확인
    if (creditsData && !creditsData.sufficient) {
      setSelectedProfileId(profile.id);
      setShowCreditsDialog(true);
      return;
    }

    // 프로필 상세 페이지로 이동 (거기서 리포트 생성 버튼 클릭)
    router.push(`/profiles/${profile.id}`);
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
                {t('fullAnalysis.creditInfo', { defaultValue: '전체 사주 분석에는 30 크레딧이 필요합니다' })}
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
            {profiles.map((profile, index) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleStartAnalysis(profile)}
                className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:border-[#d4af37]/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{profile.name}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {profile.birthDate} · {profile.gender === 'male' ? '남' : '여'}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-[#d4af37]" />
                </div>
              </motion.button>
            ))}
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
        required={creditsData?.required ?? 30}
        current={creditsData?.current ?? 0}
        onCharge={() => router.push('/payment')}
      />
    </div>
  );
}
