'use client';

/**
 * 신년 분석 연도 선택 페이지
 * Task 20: /[locale]/analysis/yearly
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { YearSelector } from '@/components/analysis/yearly';
import { ProfileSelector } from '@/components/profile';
import { useYearlyStore } from '@/stores/yearly-store';
import { useUserProfile } from '@/hooks/use-user';
import { useProfiles } from '@/hooks/use-profiles';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { ProfileResponse } from '@/types/profile';

/** 크레딧 비용 */
const YEARLY_ANALYSIS_COST = 30;

export default function YearlyAnalysisPage() {
  const router = useRouter();
  const t = useTranslations('yearly');
  const { data: user } = useUserProfile();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();

  const { targetYear, selectedProfileId, setTargetYear, setSelectedProfile } = useYearlyStore();

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(targetYear || currentYear);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (!targetYear) {
      setTargetYear(currentYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setTargetYear(year);
  };

  // Task 24.1: 프로필 선택 핸들러
  const handleProfileSelect = (profile: ProfileResponse | null) => {
    setSelectedProfile(profile);
  };

  const handleStart = () => {
    setTargetYear(selectedYear);
    router.push('/analysis/yearly/processing');
  };

  const hasEnoughCredits = (user?.credits ?? 0) >= YEARLY_ANALYSIS_COST;
  const canStart = hasEnoughCredits && !!selectedProfileId;

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
          >
            <Sparkles className="h-8 w-8" style={{ color: BRAND_COLORS.primary }} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">
            {t('title', { defaultValue: '신년 운세 분석' })}
          </h1>
          <p className="mt-2 text-gray-400">
            {t('subtitle', { defaultValue: '월별 상세 운세와 길흉일을 확인하세요' })}
          </p>
        </motion.div>

        {/* 연도 선택 */}
        <div className="mb-6">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            minYear={currentYear}
            maxYear={currentYear + 3}
          />
        </div>

        {/* Task 24.1: 프로필 선택 */}
        <div className="mb-6">
          <ProfileSelector
            profiles={profiles || []}
            selectedId={selectedProfileId}
            onSelect={handleProfileSelect}
            loading={profilesLoading}
          />
        </div>

        {/* 크레딧 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-xl border border-[#333] bg-[#1a1a1a] p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">분석 비용</p>
              <p className="text-lg font-bold" style={{ color: BRAND_COLORS.primary }}>
                {YEARLY_ANALYSIS_COST} 크레딧
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">보유 크레딧</p>
              <p
                className={`text-lg font-bold ${hasEnoughCredits ? 'text-green-500' : 'text-red-400'}`}
              >
                {user?.credits ?? 0} 크레딧
              </p>
            </div>
          </div>
          {!hasEnoughCredits && (
            <p className="mt-2 text-sm text-red-400">
              {t('credits.insufficient', {
                defaultValue: '크레딧이 부족합니다. 크레딧을 충전해주세요.',
              })}
            </p>
          )}
          {hasEnoughCredits && !selectedProfileId && (
            <p className="mt-2 text-sm text-amber-400">
              {t('selectProfile.required', { defaultValue: '분석할 프로필을 선택해주세요.' })}
            </p>
          )}
        </motion.div>

        {/* 분석 시작 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="h-14 w-full text-lg font-semibold"
            style={{
              backgroundColor: canStart ? BRAND_COLORS.primary : undefined,
              color: canStart ? '#000' : undefined,
            }}
          >
            {selectedYear}년 운세 분석 시작
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* 안내 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          분석에는 약 30~60초가 소요됩니다
        </motion.p>
      </div>
    </div>
  );
}
