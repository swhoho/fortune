'use client';

/**
 * 신년 분석 연도 선택 페이지
 * Task 20: /[locale]/analysis/yearly
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sparkles, Eye, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { YearSelector } from '@/components/analysis/yearly';
import { ProfileSelector } from '@/components/profile';
import { AppHeader } from '@/components/layout';
import { useYearlyStore } from '@/stores/yearly-store';
import { useUserProfile } from '@/hooks/use-user';
import { useProfiles } from '@/hooks/use-profiles';
import { useExistingYearlyAnalysis } from '@/hooks/use-yearly-analysis';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { ProfileResponse } from '@/types/profile';

/** 크레딧 비용 */
const YEARLY_ANALYSIS_COST = 50;

export default function YearlyAnalysisPage() {
  const router = useRouter();
  const t = useTranslations('yearly');
  const { data: user } = useUserProfile();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();

  const {
    targetYear,
    selectedProfileId,
    setTargetYear,
    setSelectedProfile,
    setExistingAnalysisId,
  } = useYearlyStore();

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(targetYear || currentYear);
  const [isNavigating, setIsNavigating] = useState(false);

  // 기존 분석 존재 여부 확인
  const { data: existingAnalysis, isLoading: checkingExisting } = useExistingYearlyAnalysis(
    selectedProfileId,
    selectedYear
  );

  // 기존 분석 상태 파악
  const hasExistingCompleted = existingAnalysis?.exists && existingAnalysis?.status === 'completed';
  const hasExistingInProgress =
    existingAnalysis?.exists &&
    (existingAnalysis?.status === 'pending' || existingAnalysis?.status === 'in_progress');

  // 비용 계산 (기존 분석 있으면 0)
  const displayCost = hasExistingCompleted || hasExistingInProgress ? 0 : YEARLY_ANALYSIS_COST;

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
    setIsNavigating(true);
    setTargetYear(selectedYear);

    // 기존 완료된 분석이 있으면 결과 페이지로 직접 이동
    if (hasExistingCompleted && existingAnalysis?.analysisId) {
      router.push(`/analysis/yearly/result/${existingAnalysis.analysisId}`);
      return;
    }

    // URL 파라미터로 데이터 전달 (store hydration 문제 방지)
    const params = new URLSearchParams({
      year: String(selectedYear),
      profileId: selectedProfileId || '',
    });

    // 진행 중인 분석이 있으면 ID도 전달
    if (hasExistingInProgress && existingAnalysis?.analysisId) {
      setExistingAnalysisId(existingAnalysis.analysisId);
      params.set('existingId', existingAnalysis.analysisId);
    }

    router.push(`/analysis/yearly/processing?${params.toString()}`);
  };

  const hasEnoughCredits = displayCost === 0 || (user?.credits ?? 0) >= YEARLY_ANALYSIS_COST;
  const canStart = hasEnoughCredits && !!selectedProfileId && !checkingExisting && !isNavigating;

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (hasExistingCompleted) {
      return t('button.viewExisting');
    }
    if (hasExistingInProgress) {
      return t('button.checkProgress');
    }
    return t('button.startAnalysis', { year: selectedYear });
  };

  // 버튼 아이콘 결정
  const getButtonIcon = () => {
    if (isNavigating || checkingExisting) {
      return <Loader2 className="mr-2 h-5 w-5 animate-spin" />;
    }
    if (hasExistingCompleted) {
      return <Eye className="mr-2 h-5 w-5" />;
    }
    return <Sparkles className="mr-2 h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <AppHeader title={t('title', { defaultValue: '신년 운세 분석' })} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 서브 헤더 */}
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
          <p className="text-gray-400">
            {t('subtitle', { defaultValue: '월별 상세 운세와 길흉일을 확인하세요' })}
          </p>
        </motion.div>

        {/* 프로필 선택 (상단으로 이동) */}
        <div className="mb-6">
          <ProfileSelector
            profiles={profiles || []}
            selectedId={selectedProfileId}
            onSelect={handleProfileSelect}
            loading={profilesLoading}
          />
        </div>

        {/* 연도 선택 */}
        <div className="mb-6">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            minYear={currentYear}
            maxYear={currentYear + 3}
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
                {displayCost} 크레딧
                {displayCost === 0 && (
                  <span className="ml-2 text-sm font-normal text-green-500">
                    {hasExistingCompleted ? '(이미 분석됨)' : '(진행 중)'}
                  </span>
                )}
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
          {!hasEnoughCredits && displayCost > 0 && (
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

        {/* 분석 시작/보기 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="h-14 w-full text-lg font-semibold disabled:cursor-wait disabled:opacity-70"
            style={{
              backgroundColor: canStart ? BRAND_COLORS.primary : undefined,
              color: canStart ? '#000' : undefined,
            }}
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
        </motion.div>

        {/* 안내 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          {hasExistingCompleted
            ? '이전에 분석한 리포트를 다시 확인할 수 있습니다'
            : hasExistingInProgress
              ? '이전에 시작한 분석의 진행 상황을 확인합니다'
              : '분석에는 약 30~60초가 소요됩니다'}
        </motion.p>
      </div>
    </div>
  );
}
