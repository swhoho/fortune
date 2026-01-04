'use client';

/**
 * 프로필 상세 정보 카드 컴포넌트 (인라인 편집 지원)
 * Task 5.2: ProfileInfoCard
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, Edit2, Trash2, FileText, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ProfileForm } from './ProfileForm';
import type { ProfileResponse } from '@/types/profile';
import type { CreateProfileInput } from '@/lib/validations/profile';
import { calculateAge } from '@/hooks/use-profiles';

interface ProfileInfoCardProps {
  /** 프로필 데이터 */
  profile: ProfileResponse;
  /** 리포트 존재 여부 */
  hasReport?: boolean;
  /** 리포트 생성 핸들러 */
  onGenerateReport?: () => void;
  /** 리포트 보기 핸들러 */
  onViewReport?: () => void;
  /** 저장 핸들러 */
  onSave?: (data: CreateProfileInput) => void;
  /** 삭제 핸들러 */
  onDelete?: () => void;
  /** 저장 중 여부 */
  isSaving?: boolean;
}

/** 달력 유형 라벨 */
const CALENDAR_LABELS: Record<string, string> = {
  solar: '양력',
  lunar: '음력',
  lunar_leap: '윤달',
};

/**
 * 프로필 상세 정보 카드
 */
export function ProfileInfoCard({
  profile,
  hasReport = false,
  onGenerateReport,
  onViewReport,
  onSave,
  onDelete,
  isSaving = false,
}: ProfileInfoCardProps) {
  const t = useTranslations('profile');
  const [isEditing, setIsEditing] = useState(false);

  const age = calculateAge(profile.birthDate);
  const formattedDate = profile.birthDate.replace(/-/g, '.');

  /**
   * 저장 핸들러
   */
  const handleSave = (data: CreateProfileInput) => {
    onSave?.(data);
    // 성공 시 편집 모드 종료는 부모에서 처리 (profile 변경으로 useEffect 트리거)
  };

  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          /* 편집 모드 */
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6"
          >
            <h3 className="mb-6 font-serif text-lg font-semibold text-[#1a1a1a]">
              {t('pageTitle.edit')}
            </h3>
            <ProfileForm
              initialData={profile}
              isSubmitting={isSaving}
              onSubmit={handleSave}
              onCancel={handleCancel}
            />
          </motion.div>
        ) : (
          /* 보기 모드 */
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* 헤더 */}
            <div className="relative border-b border-gray-100 p-6">
              {/* 장식적 배경 */}
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#d4af37]/5 to-transparent" />

              <div className="relative flex items-center gap-4">
                {/* 아바타 */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-white">
                  <span className="font-serif text-2xl font-bold">
                    {profile.name.charAt(0)}
                  </span>
                </div>

                {/* 이름 + 기본 정보 */}
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">
                    {profile.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {profile.gender === 'male' ? t('form.male') : t('form.female')} · {t('detail.age', { age })}
                  </p>
                </div>
              </div>

              {/* 액션 버튼 (수정/삭제) */}
              <div className="absolute right-6 top-6 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-9 w-9 text-gray-400 hover:text-[#d4af37]"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-9 w-9 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-4 p-6">
              <h3 className="font-serif text-sm font-semibold text-gray-400">
                {t('detail.birthInfo')}
              </h3>

              {/* 생년월일 */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f6f0]">
                  <Calendar className="h-5 w-5 text-[#d4af37]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">생년월일</p>
                  <p className="font-medium text-[#1a1a1a]">
                    {formattedDate}{' '}
                    <span className="ml-1 text-sm text-gray-400">
                      ({CALENDAR_LABELS[profile.calendarType]})
                    </span>
                  </p>
                </div>
              </div>

              {/* 출생 시간 */}
              {profile.birthTime && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f6f0]">
                    <Clock className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">출생 시간</p>
                    <p className="font-medium text-[#1a1a1a]">{profile.birthTime}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 리포트 액션 */}
            <div className="border-t border-gray-100 p-6">
              {hasReport ? (
                <Button
                  onClick={onViewReport}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('detail.viewReport')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-gray-500">
                    {t('detail.noReport')}
                  </p>
                  <Button
                    onClick={onGenerateReport}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('detail.generateReport')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
