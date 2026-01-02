'use client';

/**
 * 프로필 설정 탭 컴포넌트
 * PRD Task 17.4 - 프로필 수정 (PATCH /api/user/profile)
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="mb-2 h-5 w-32 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-12 rounded-xl bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSettings() {
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
      toast.success('프로필이 저장되었습니다');
      setHasChanges(false);
    } catch {
      toast.error('프로필 저장에 실패했습니다');
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
          <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">프로필 설정</h2>
          <p className="mt-1 text-sm text-gray-500">계정 정보를 관리하세요</p>
        </motion.div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">프로필 설정</h2>
        <p className="mt-1 text-sm text-gray-500">계정 정보를 관리하세요</p>
      </motion.div>

      {/* 프로필 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        {/* 장식적 배경 */}
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-transparent" />

        {/* 프로필 헤더 */}
        <div className="relative border-b border-gray-100 p-6">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-2xl font-bold text-white shadow-lg">
              {name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-[#1a1a1a]">
                {name || profile?.email?.split('@')[0] || '사용자'}
              </p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <p className="mt-1 text-xs text-gray-400">
                가입일: {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <div className="relative space-y-6 p-6">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              이름 (선택)
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="h-12 rounded-xl border-gray-200 transition-all focus:border-[#d4af37] focus:ring-[#d4af37]/20"
            />
            <p className="text-xs text-gray-400">이름은 마이페이지에서만 표시됩니다</p>
          </div>

          {/* 언어 선택 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">선호 언어</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setPreferredLanguage(lang.code)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 transition-all ${
                    preferredLanguage === lang.code
                      ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">분석 결과 및 AI 응답에 적용됩니다</p>
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">이메일</Label>
            <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-500">
              {profile?.email}
            </div>
            <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다</p>
          </div>
        </div>

        {/* 저장 버튼 */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-gray-100 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleReset} disabled={updateProfile.isPending}>
                취소
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
                    저장 중...
                  </span>
                ) : (
                  '변경사항 저장'
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
        className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 font-medium text-[#1a1a1a]">계정 정보</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">계정 ID</span>
            <span className="font-mono text-gray-600">{profile?.id?.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">보유 크레딧</span>
            <span className="font-medium text-[#d4af37]">{profile?.credits || 0}C</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">가입일</span>
            <span className="text-gray-600">
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
        className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-6"
      >
        <h3 className="mb-2 font-medium text-red-800">위험 영역</h3>
        <p className="mb-4 text-sm text-red-600">
          계정 삭제는 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
        </p>
        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled>
          계정 삭제 (준비 중)
        </Button>
      </motion.div>
    </div>
  );
}
