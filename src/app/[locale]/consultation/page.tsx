'use client';

/**
 * AI 상담 페이지
 * 프로필 선택 → 상담 세션 전체 화면
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-user';
import { useProfiles } from '@/hooks/use-profiles';
import { ProfileSelector } from '@/components/profile/ProfileSelector';
import { ConsultationTab } from '@/components/consultation/ConsultationTab';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { ProfileResponse } from '@/types/profile';

export default function ConsultationPage() {
  const t = useTranslations('consultation');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // 프로필 목록 조회
  const { data: profiles = [], isLoading: isProfilesLoading } = useProfiles();

  // 선택된 프로필
  const [selectedProfile, setSelectedProfile] = useState<ProfileResponse | null>(null);

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/auth/signin?callbackUrl=/consultation');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // 로딩 상태
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: BRAND_COLORS.secondary }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${BRAND_COLORS.primary}40`, borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  // 프로필 선택 핸들러
  const handleSelectProfile = (profile: ProfileResponse | null) => {
    setSelectedProfile(profile);
  };

  // 뒤로가기 (상담 → 프로필 선택)
  const handleBack = () => {
    setSelectedProfile(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND_COLORS.secondary }}>
      <AnimatePresence mode="wait">
        {!selectedProfile ? (
          // 프로필 선택 화면
          <motion.div
            key="profile-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-lg px-4"
            style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))', paddingBottom: '2rem' }}
          >
            {/* 헤더 */}
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{tCommon('back')}</span>
              </button>

              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${BRAND_COLORS.primary}15`,
                    boxShadow: `0 0 30px ${BRAND_COLORS.primary}20`,
                  }}
                >
                  <MessageCircle className="h-7 w-7" style={{ color: BRAND_COLORS.primary }} />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-white">{t('title')}</h1>
                  <p className="mt-1 text-gray-400">{t('selectProfile.title')}</p>
                </div>
              </div>
            </div>

            {/* 프로필 선택기 */}
            <ProfileSelector
              profiles={profiles}
              selectedId={null}
              onSelect={handleSelectProfile}
              loading={isProfilesLoading}
            />
          </motion.div>
        ) : (
          // 상담 전체 화면
          <motion.div
            key="consultation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex h-screen flex-col"
          >
            {/* 상담 헤더 */}
            <div
              className="shrink-0 border-b border-[#333] bg-[#111111] px-4 pb-3"
              style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
            >
              <div className="mx-auto flex max-w-4xl items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${BRAND_COLORS.primary}15` }}
                  >
                    <span
                      className="font-serif text-lg font-bold"
                      style={{ color: BRAND_COLORS.primary }}
                    >
                      {selectedProfile.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-medium text-white">{selectedProfile.name}</h2>
                    <p className="text-sm text-gray-500">{t('title')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 상담 컨텐츠 */}
            <div className="min-h-0 flex-1">
              <ConsultationTab profileId={selectedProfile.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
