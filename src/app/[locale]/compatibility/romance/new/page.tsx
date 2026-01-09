'use client';

/**
 * 연인 궁합 - 프로필 선택 페이지
 * Premium Celestial Theme Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Heart,
  Sparkles,
  Loader2,
  User,
  Check,
  Coins,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout';
import { useUserProfile } from '@/hooks/use-user';
import { useProfiles } from '@/hooks/use-profiles';
import { CosmicBackground, GlassCard } from '@/components/compatibility/ui';
import type { ProfileResponse } from '@/types/profile';

/** 크레딧 비용 */
const COMPATIBILITY_COST = 70;

/** 기존 분석 상태 */
interface ExistingAnalysis {
  exists: boolean;
  isFreeRetry: boolean;
  isCompleted?: boolean;
  isProcessing?: boolean;
  status: string | null;
  analysisId: string | null;
  message?: string;
}

export default function CompatibilityRomanceNewPage() {
  const router = useRouter();
  const t = useTranslations('compatibility');
  const { data: user } = useUserProfile();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();

  // 선택된 프로필
  const [selectedProfileA, setSelectedProfileA] = useState<ProfileResponse | null>(null);
  const [selectedProfileB, setSelectedProfileB] = useState<ProfileResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 기존 분석 상태
  const [existingAnalysis, setExistingAnalysis] = useState<ExistingAnalysis | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // SAJU_REQUIRED 에러 상태
  const [sajuRequiredError, setSajuRequiredError] = useState<{
    missingProfiles: string[];
  } | null>(null);

  // 기존 분석 확인 (프로필 선택 시)
  useEffect(() => {
    if (!selectedProfileA?.id || !selectedProfileB?.id) {
      setExistingAnalysis(null);
      return;
    }

    if (selectedProfileA.id === selectedProfileB.id) {
      setExistingAnalysis(null);
      return;
    }

    const checkExisting = async () => {
      setIsChecking(true);
      try {
        const res = await fetch(
          `/api/analysis/compatibility/check?profileIdA=${selectedProfileA.id}&profileIdB=${selectedProfileB.id}&analysisType=romance`
        );
        const data = await res.json();
        setExistingAnalysis(data);
      } catch (error) {
        console.error('기존 분석 확인 실패:', error);
        setExistingAnalysis(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkExisting();
  }, [selectedProfileA?.id, selectedProfileB?.id]);

  // 크레딧 확인 (무료 재시도면 크레딧 불필요)
  const isFreeRetry = existingAnalysis?.isFreeRetry ?? false;
  const hasEnoughCredits = isFreeRetry || (user?.credits ?? 0) >= COMPATIBILITY_COST;
  const canStart =
    hasEnoughCredits &&
    selectedProfileA !== null &&
    selectedProfileB !== null &&
    selectedProfileA.id !== selectedProfileB?.id;

  const handleStart = async () => {
    if (!canStart || !selectedProfileA || !selectedProfileB) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/analysis/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIdA: selectedProfileA.id,
          profileIdB: selectedProfileB.id,
          analysisType: 'romance',
          language: 'ko',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // SAJU_REQUIRED 에러 처리
        if (data.errorCode === 'SAJU_REQUIRED') {
          setSajuRequiredError({
            missingProfiles: data.missingProfiles || [],
          });
          return;
        }
        throw new Error(data.error || '분석 시작에 실패했습니다');
      }

      if (data.status === 'completed' && data.analysisId) {
        router.push(`/compatibility/romance/${data.analysisId}`);
        return;
      }

      router.push(`/compatibility/romance/${data.analysisId}/generating`);
    } catch (error) {
      console.error('궁합 분석 시작 실패:', error);
      alert(error instanceof Error ? error.message : '분석 시작에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 사주 분석 페이지로 이동
  const handleGoToSajuAnalysis = () => {
    const profileToAnalyze = profiles?.find((p) =>
      sajuRequiredError?.missingProfiles.includes(p.name)
    );
    if (profileToAnalyze) {
      router.push(`/profiles/${profileToAnalyze.id}/generating`);
    } else {
      router.push('/profiles');
    }
  };

  // 프로필 선택 핸들러
  const handleSelectA = (profile: ProfileResponse) => {
    if (selectedProfileB?.id === profile.id) {
      setSelectedProfileB(null);
    }
    setSelectedProfileA(profile);
  };

  const handleSelectB = (profile: ProfileResponse) => {
    if (selectedProfileA?.id === profile.id) {
      return;
    }
    setSelectedProfileB(profile);
  };

  // SAJU_REQUIRED 에러 화면
  if (sajuRequiredError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">기본 사주 분석이 필요합니다</h2>
          <p className="mb-6 max-w-sm text-gray-400">
            {sajuRequiredError.missingProfiles.join(', ')}의 기본 사주 분석을 먼저 완료해주세요.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSajuRequiredError(null)}
              className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#242424]"
            >
              돌아가기
            </Button>
            <Button
              onClick={handleGoToSajuAnalysis}
              style={{ backgroundColor: '#d4af37', color: '#000' }}
              className="hover:opacity-90"
            >
              사주 분석 하기
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 버튼 설정 (상태별)
  const getButtonConfig = () => {
    if (existingAnalysis?.isCompleted) {
      return {
        text: '결과 보기',
        icon: <ExternalLink className="mr-2 h-5 w-5" />,
        action: () => router.push(`/compatibility/romance/${existingAnalysis.analysisId}`),
        disabled: false,
        style: {
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: '#fff',
        },
      };
    }
    if (existingAnalysis?.isProcessing) {
      return {
        text: '진행 상황 확인',
        icon: <Loader2 className="mr-2 h-5 w-5" />,
        action: () =>
          router.push(`/compatibility/romance/${existingAnalysis.analysisId}/generating`),
        disabled: false,
        style: {
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#000',
        },
      };
    }
    if (isFreeRetry) {
      return {
        text: '무료 재시도',
        icon: <RefreshCw className="mr-2 h-5 w-5" />,
        action: handleStart,
        disabled: !canStart || isSubmitting,
        style: {
          background: canStart
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'rgba(255,255,255,0.1)',
          color: canStart ? '#000' : '#666',
        },
      };
    }
    return {
      text: isSubmitting ? '분석 시작 중...' : '궁합 분석 시작',
      icon: isSubmitting ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-5 w-5" />
      ),
      action: handleStart,
      disabled: !canStart || isSubmitting,
      style: {
        background: canStart
          ? 'linear-gradient(135deg, #d4af37, #c9a227)'
          : 'rgba(255,255,255,0.1)',
        color: canStart ? '#000' : '#666',
        border: canStart ? 'none' : '1px solid rgba(255,255,255,0.1)',
      },
    };
  };

  const buttonConfig = getButtonConfig();

  // 크레딧 섹션 표시 여부 (완료/진행 중이면 숨김)
  const showCreditSection = !existingAnalysis?.isCompleted && !existingAnalysis?.isProcessing;

  return (
    <div className="min-h-screen bg-[#050508]">
      <CosmicBackground />

      {/* 헤더 */}
      <AppHeader title={t('romance.title', { defaultValue: '연인 궁합 분석' })} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 히어로 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          {/* 아이콘 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="relative mx-auto mb-6 h-20 w-20"
          >
            {/* 배경 글로우 */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: 'rgba(212, 175, 55, 0.2)' }}
            />
            {/* 원형 배경 */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Heart className="h-10 w-10 text-[#d4af37]" />
            </div>
            {/* 별 장식 */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -right-2 -top-1"
            >
              <Sparkles className="h-5 w-5 text-[#d4af37]/60" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            두 사람의 인연을 분석해보세요
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-gray-400"
          >
            {t('romance.subtitle', { defaultValue: '궁합을 볼 두 사람을 선택해주세요' })}
          </motion.p>
        </motion.div>

        {/* 프로필 선택 영역 */}
        <div className="space-y-6">
          {/* A 선택 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37, #c9a227)',
                    color: '#000',
                  }}
                >
                  A
                </div>
                <span className="font-medium text-white">
                  {t('romance.personA', { defaultValue: '첫 번째 사람' })}
                </span>
                {selectedProfileA && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto text-sm text-[#d4af37]"
                  >
                    {selectedProfileA.name}
                  </motion.span>
                )}
              </div>
              <ProfileGrid
                profiles={profiles || []}
                selectedId={selectedProfileA?.id}
                disabledId={undefined}
                onSelect={handleSelectA}
                loading={profilesLoading}
                color="gold"
              />
            </GlassCard>
          </motion.div>

          {/* 연결 표시 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Heart className="h-4 w-4 text-[#d4af37]/50" />
            </div>
          </motion.div>

          {/* B 선택 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white">
                  B
                </div>
                <span className="font-medium text-white">
                  {t('romance.personB', { defaultValue: '두 번째 사람' })}
                </span>
                {selectedProfileB && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto text-sm text-pink-400"
                  >
                    {selectedProfileB.name}
                  </motion.span>
                )}
              </div>
              <ProfileGrid
                profiles={profiles || []}
                selectedId={selectedProfileB?.id}
                disabledId={selectedProfileA?.id}
                onSelect={handleSelectB}
                loading={profilesLoading}
                color="pink"
              />
            </GlassCard>
          </motion.div>
        </div>

        {/* 크레딧 정보 - 신규 분석 또는 재시도 시에만 표시 */}
        {showCreditSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="my-6"
          >
            <GlassCard variant={hasEnoughCredits ? 'default' : 'warning'} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: isFreeRetry
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
                    }}
                  >
                    {isFreeRetry ? (
                      <RefreshCw className="h-5 w-5 text-green-400" />
                    ) : (
                      <Coins className="h-5 w-5 text-[#d4af37]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      {isFreeRetry ? '무료 재시도' : '분석 비용'}
                    </p>
                    <p
                      className={`text-xl font-bold ${isFreeRetry ? 'text-green-400' : 'text-[#d4af37]'}`}
                    >
                      {isFreeRetry ? '0C' : `${COMPATIBILITY_COST}C`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">보유 크레딧</p>
                  <p
                    className={`text-xl font-bold ${hasEnoughCredits ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {user?.credits ?? 0}C
                  </p>
                </div>
              </div>

              {/* 무료 재시도 안내 */}
              {isFreeRetry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-green-950/30 p-3"
                >
                  <RefreshCw className="h-4 w-4 shrink-0 text-green-400" />
                  <p className="text-sm text-green-400">
                    이전 분석이 실패했습니다. 무료로 재시도할 수 있습니다.
                  </p>
                </motion.div>
              )}

              {/* 경고 메시지 */}
              {!hasEnoughCredits && !isFreeRetry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-red-950/30 p-3"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">
                    크레딧이 부족합니다. 크레딧을 충전해주세요.
                  </p>
                </motion.div>
              )}

              {hasEnoughCredits &&
                selectedProfileA &&
                selectedProfileA?.id === selectedProfileB?.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-amber-950/30 p-3"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-sm text-amber-400">서로 다른 두 프로필을 선택해주세요.</p>
                  </motion.div>
                )}

              {/* 로딩 중 */}
              {isChecking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center justify-center gap-2 py-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-400">기존 분석 확인 중...</p>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* 통합 버튼 (상태별 텍스트/동작 변경) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Button
            onClick={buttonConfig.action}
            disabled={buttonConfig.disabled}
            className="relative h-14 w-full overflow-hidden text-lg font-semibold transition-all"
            style={buttonConfig.style}
          >
            {/* 배경 글로우 (활성화 시) */}
            {!buttonConfig.disabled && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                style={{ width: '50%', transform: 'skewX(-20deg)' }}
              />
            )}

            {buttonConfig.icon}
            {buttonConfig.text}
          </Button>
        </motion.div>

        {/* 안내 텍스트 - 신규 분석 시에만 표시 */}
        {showCreditSection && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-center text-sm text-gray-500"
          >
            분석에는 약 30~60초가 소요됩니다
          </motion.p>
        )}
      </div>
    </div>
  );
}

/**
 * 프로필 그리드 컴포넌트
 */
interface ProfileGridProps {
  profiles: ProfileResponse[];
  selectedId?: string;
  disabledId?: string;
  onSelect: (profile: ProfileResponse) => void;
  loading?: boolean;
  color: 'gold' | 'pink';
}

function ProfileGrid({
  profiles,
  selectedId,
  disabledId,
  onSelect,
  loading,
  color,
}: ProfileGridProps) {
  const colorStyles = {
    gold: {
      border: 'rgba(212, 175, 55, 0.5)',
      bg: 'rgba(212, 175, 55, 0.1)',
      check: 'linear-gradient(135deg, #d4af37, #c9a227)',
    },
    pink: {
      border: 'rgba(236, 72, 153, 0.5)',
      bg: 'rgba(236, 72, 153, 0.1)',
      check: 'linear-gradient(135deg, #ec4899, #db2777)',
    },
  };

  const styles = colorStyles[color];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed p-8 text-center"
        style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
      >
        <User className="mx-auto mb-3 h-10 w-10 text-gray-500" />
        <p className="text-sm text-gray-400">등록된 프로필이 없습니다</p>
        <Button
          variant="link"
          className="mt-3 text-[#d4af37] hover:text-[#e0c040]"
          onClick={() => (window.location.href = '/profiles/new')}
        >
          프로필 추가하기
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {profiles.map((profile) => {
        const isSelected = selectedId === profile.id;
        const isDisabled = disabledId === profile.id;

        return (
          <motion.button
            key={profile.id}
            onClick={() => !isDisabled && onSelect(profile)}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            className="relative overflow-hidden rounded-xl p-4 text-left transition-all"
            style={{
              background: isSelected ? styles.bg : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isSelected ? styles.border : 'rgba(255, 255, 255, 0.08)'}`,
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {/* 선택 체크 */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: styles.check }}
              >
                <Check className="h-3 w-3 text-black" />
              </motion.div>
            )}

            <p className="truncate font-medium text-white">{profile.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {profile.birthDate} ({profile.gender === 'male' ? '남' : '여'})
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
