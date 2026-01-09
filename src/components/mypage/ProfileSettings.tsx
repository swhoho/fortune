'use client';

/**
 * 프로필 설정 탭 컴포넌트
 * PRD Task 17.4 - 프로필 수정 (PATCH /api/user/profile)
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserProfile, useUpdateProfile } from '@/hooks/use-user';
import { toast } from 'sonner';

/** 지원 언어 목록 */
const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

/** 날짜 포맷팅 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-2xl border border-[#333] bg-[#1a1a1a] p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#333]" />
          <div className="flex-1">
            <div className="mb-2 h-5 w-32 rounded bg-[#333]" />
            <div className="h-4 w-48 rounded bg-[#333]" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-12 rounded-xl bg-[#333]" />
          <div className="h-12 rounded-xl bg-[#333]" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const t = useTranslations('mypage.profileSettings');
  const tProfile = useTranslations('mypage.profile');
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('ko');
  const [hasChanges, setHasChanges] = useState(false);

  // 프로필 데이터로 폼 초기화
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPreferredLanguage(profile.preferredLanguage || 'ko');
    }
  }, [profile]);

  // 변경사항 감지
  useEffect(() => {
    if (profile) {
      const changed =
        name !== (profile.name || '') || preferredLanguage !== (profile.preferredLanguage || 'ko');
      setHasChanges(changed);
    }
  }, [name, preferredLanguage, profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: name || undefined,
        preferredLanguage,
      });
      toast.success(t('success'));
      setHasChanges(false);
    } catch {
      toast.error(t('error'));
    }
  };

  const handleReset = () => {
    if (profile) {
      setName(profile.name || '');
      setPreferredLanguage(profile.preferredLanguage || 'ko');
    }
  };

  if (isLoading) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
          <p className="mt-1 text-sm text-gray-400">{t('subtitle')}</p>
        </motion.div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-400">{t('subtitle')}</p>
      </motion.div>

      {/* 프로필 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#333] bg-[#1a1a1a] shadow-sm"
      >
        {/* 장식적 배경 */}
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-transparent" />

        {/* 프로필 헤더 */}
        <div className="relative border-b border-[#333] p-6">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-2xl font-bold text-white shadow-lg">
              {name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-white">
                {name || profile?.email?.split('@')[0] || tProfile('user')}
              </p>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              <p className="mt-1 text-xs text-gray-500">
                {t('joinedAt')}: {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <div className="relative space-y-6 p-6">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-300">
              {t('nameOptional')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="h-12 rounded-xl border-[#333] bg-[#2a2a2a] text-white transition-all placeholder:text-gray-500 focus:border-[#d4af37] focus:ring-[#d4af37]/20"
            />
            <p className="text-xs text-gray-500">{t('nameHint')}</p>
          </div>

          {/* 언어 선택 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">{t('preferredLanguage')}</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setPreferredLanguage(lang.code)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 transition-all ${
                    preferredLanguage === lang.code
                      ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                      : 'border-[#333] text-gray-400 hover:border-[#444] hover:bg-[#242424]'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">{t('languageHint')}</p>
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">{t('email')}</Label>
            <div className="flex h-12 items-center rounded-xl border border-[#333] bg-[#242424] px-4 text-gray-400">
              {profile?.email}
            </div>
            <p className="text-xs text-gray-500">{t('emailHint')}</p>
          </div>
        </div>

        {/* 저장 버튼 */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-[#333] bg-[#242424] p-4"
          >
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleReset} disabled={updateProfile.isPending}>
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white hover:opacity-90"
              >
                {updateProfile.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t('saving')}
                  </span>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 계정 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 rounded-2xl border border-[#333] bg-[#1a1a1a] p-6 shadow-sm"
      >
        <h3 className="mb-4 font-medium text-white">{t('accountInfo')}</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('accountId')}</span>
            <span className="font-mono text-gray-300">{profile?.id?.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('credits')}</span>
            <span className="font-medium text-[#d4af37]">{profile?.credits || 0}C</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('joinedAt')}</span>
            <span className="text-gray-300">
              {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 위험 영역 (미래 구현용 placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-6"
      >
        <h3 className="mb-2 font-medium text-red-400">{t('dangerZone')}</h3>
        <p className="mb-4 text-sm text-red-400/80">{t('dangerZoneDescription')}</p>
        <Button
          variant="outline"
          className="border-red-900/50 text-red-400 hover:bg-red-950/50"
          disabled
        >
          {t('deleteAccount')} ({t('deleteAccountPending')})
        </Button>
      </motion.div>
    </div>
  );
}
