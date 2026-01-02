'use client';

/**
 * 신년 분석 연도 선택 페이지
 * Task 20: /[locale]/analysis/yearly
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles, Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { YearSelector } from '@/components/analysis/yearly';
import { useAnalysisStore } from '@/stores/analysis';
import { useUserProfile, useAnalysisList } from '@/hooks/use-user';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** 크레딧 비용 */
const YEARLY_ANALYSIS_COST = 30;

export default function YearlyAnalysisPage() {
  const router = useRouter();
  const t = useTranslations('yearly');
  const { data: user } = useUserProfile();
  const { data: analyses } = useAnalysisList();

  const {
    targetYear,
    existingAnalysisId,
    setTargetYear,
    setExistingAnalysisId,
    resetYearly,
  } = useAnalysisStore();

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [selectedYear, setSelectedYear] = useState(targetYear || nextYear);
  const [useExisting, setUseExisting] = useState(!!existingAnalysisId);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    if (!targetYear) {
      setTargetYear(nextYear);
    }
  }, []);

  // 기존 분석 목록 필터링
  const existingAnalyses = analyses?.filter((a) => a.type === 'full') || [];

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setTargetYear(year);
  };

  const handleExistingSelect = (analysisId: string | null) => {
    setExistingAnalysisId(analysisId);
    setUseExisting(!!analysisId);
  };

  const handleStart = () => {
    setTargetYear(selectedYear);
    router.push('/analysis/yearly/processing');
  };

  const hasEnoughCredits = (user?.credits ?? 0) >= YEARLY_ANALYSIS_COST;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8">
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
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            {t('title', { defaultValue: '신년 운세 분석' })}
          </h1>
          <p className="mt-2 text-gray-600">
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

        {/* 기존 분석 사용 옵션 */}
        {existingAnalyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
              >
                <Clock className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-gray-900">
                  {t('existingAnalysis.title', { defaultValue: '기존 사주 분석 사용' })}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('existingAnalysis.subtitle', {
                    defaultValue: '이전에 분석한 사주 정보를 기반으로 신년 운세를 분석합니다',
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* 새로운 분석 */}
              <button
                onClick={() => handleExistingSelect(null)}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  !useExisting
                    ? 'border-[#d4af37] bg-[#d4af37]/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      !useExisting ? 'border-[#d4af37] bg-[#d4af37]' : 'border-gray-300'
                    }`}
                  >
                    {!useExisting && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">새로운 생년월일 입력</p>
                    <p className="text-sm text-gray-500">온보딩에서 입력한 정보 사용</p>
                  </div>
                </div>
              </button>

              {/* 기존 분석 목록 */}
              {existingAnalyses.slice(0, 3).map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => handleExistingSelect(analysis.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    existingAnalysisId === analysis.id
                      ? 'border-[#d4af37] bg-[#d4af37]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        existingAnalysisId === analysis.id
                          ? 'border-[#d4af37] bg-[#d4af37]'
                          : 'border-gray-300'
                      }`}
                    >
                      {existingAnalysisId === analysis.id && (
                        <div className="flex h-full items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(analysis.createdAt).toLocaleDateString('ko-KR')} 분석
                      </p>
                      <p className="text-sm text-gray-500">
                        {analysis.focusArea
                          ? `${analysis.focusArea} 집중 분석`
                          : '전체 분석'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 크레딧 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-xl bg-gray-100 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">분석 비용</p>
              <p className="text-lg font-bold" style={{ color: BRAND_COLORS.primary }}>
                {YEARLY_ANALYSIS_COST} 크레딧
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">보유 크레딧</p>
              <p
                className={`text-lg font-bold ${hasEnoughCredits ? 'text-green-600' : 'text-red-600'}`}
              >
                {user?.credits ?? 0} 크레딧
              </p>
            </div>
          </div>
          {!hasEnoughCredits && (
            <p className="mt-2 text-sm text-red-600">
              크레딧이 부족합니다. 크레딧을 충전해주세요.
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
            disabled={!hasEnoughCredits}
            className="h-14 w-full text-lg font-semibold"
            style={{
              backgroundColor: hasEnoughCredits ? BRAND_COLORS.primary : undefined,
              color: hasEnoughCredits ? '#000' : undefined,
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
