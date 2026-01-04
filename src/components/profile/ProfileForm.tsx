'use client';

/**
 * 프로필 등록/수정 폼 컴포넌트
 * Task 3.2: ProfileForm
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import type { ProfileResponse, CalendarType, Gender } from '@/types/profile';
import type { CreateProfileInput } from '@/lib/validations/profile';

interface ProfileFormProps {
  /** 수정 모드일 때 기존 데이터 */
  initialData?: ProfileResponse;
  /** 제출 중 여부 */
  isSubmitting?: boolean;
  /** 제출 핸들러 */
  onSubmit: (data: CreateProfileInput) => void;
  /** 취소 핸들러 */
  onCancel?: () => void;
}

interface FormState {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  calendarType: CalendarType;
  gender: Gender | '';
}

/**
 * 프로필 등록/수정 폼
 */
export function ProfileForm({
  initialData,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ProfileFormProps) {
  const t = useTranslations('profile');

  // 초기 상태 설정
  const getInitialState = (): FormState => {
    if (initialData) {
      const dateParts = initialData.birthDate.split('-');
      const timeParts = initialData.birthTime?.split(':') || ['', ''];
      return {
        name: initialData.name,
        year: dateParts[0] ?? '',
        month: dateParts[1] ?? '',
        day: dateParts[2] ?? '',
        hour: timeParts[0] ?? '',
        minute: timeParts[1] ?? '',
        calendarType: initialData.calendarType,
        gender: initialData.gender,
      };
    }
    return {
      name: '',
      year: '',
      month: '',
      day: '',
      hour: '',
      minute: '',
      calendarType: 'solar',
      gender: '',
    };
  };

  const [formData, setFormData] = useState<FormState>(getInitialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // initialData 변경 시 폼 리셋
  useEffect(() => {
    setFormData(getInitialState());
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    } else if (formData.name.length > 50) {
      newErrors.name = t('validation.nameMaxLength');
    }

    // 연도 검증
    const year = parseInt(formData.year);
    if (!formData.year || year < 1900 || year > new Date().getFullYear()) {
      newErrors.year = t('validation.invalidDate');
    }

    // 월 검증
    const month = parseInt(formData.month);
    if (!formData.month || month < 1 || month > 12) {
      newErrors.month = t('validation.invalidDate');
    }

    // 일 검증
    const day = parseInt(formData.day);
    if (!formData.day || day < 1 || day > 31) {
      newErrors.day = t('validation.invalidDate');
    }

    // 날짜 조합 검증
    if (!newErrors.year && !newErrors.month && !newErrors.day) {
      const date = new Date(year, month - 1, day);
      if (date > new Date()) {
        newErrors.day = t('validation.futureDateNotAllowed');
      }
    }

    // 성별 검증
    if (!formData.gender) {
      newErrors.gender = t('validation.genderRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // 생년월일 포맷팅
    const birthDate = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;

    // 출생시간 포맷팅 (선택사항)
    const birthTime =
      formData.hour && formData.minute
        ? `${formData.hour.padStart(2, '0')}:${formData.minute.padStart(2, '0')}`
        : null;

    const profileData: CreateProfileInput = {
      name: formData.name.trim(),
      gender: formData.gender as Gender,
      birthDate,
      birthTime,
      calendarType: formData.calendarType,
    };

    onSubmit(profileData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* 이름 */}
      <div className="space-y-2">
        <Label>{t('form.name')} *</Label>
        <Input
          type="text"
          placeholder={t('form.namePlaceholder')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? 'border-red-500' : ''}
          maxLength={50}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <Label>{t('form.birthDate')} *</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder={t('form.yearPlaceholder')}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className={errors.year ? 'border-red-500' : ''}
            min={1900}
            max={new Date().getFullYear()}
          />
          <Input
            type="number"
            placeholder={t('form.monthPlaceholder')}
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            className={errors.month ? 'border-red-500' : ''}
            min={1}
            max={12}
          />
          <Input
            type="number"
            placeholder={t('form.dayPlaceholder')}
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            className={errors.day ? 'border-red-500' : ''}
            min={1}
            max={31}
          />
        </div>
        {(errors.year || errors.month || errors.day) && (
          <p className="text-sm text-red-500">{errors.year || errors.month || errors.day}</p>
        )}
      </div>

      {/* 출생 시간 (선택) */}
      <div className="space-y-2">
        <Label>{t('form.birthTimeOptional')}</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder={t('form.hourPlaceholder')}
            value={formData.hour}
            onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
            min={0}
            max={23}
          />
          <Input
            type="number"
            placeholder={t('form.minutePlaceholder')}
            value={formData.minute}
            onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
            min={0}
            max={59}
          />
        </div>
        <p className="text-xs text-gray-400">{t('form.birthTimeHint')}</p>
      </div>

      {/* 달력 유형 */}
      <div className="space-y-2">
        <Label>{t('form.calendarType')} *</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              checked={formData.calendarType === 'solar'}
              onChange={() => setFormData({ ...formData, calendarType: 'solar' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span>{t('form.solar')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              checked={formData.calendarType === 'lunar'}
              onChange={() => setFormData({ ...formData, calendarType: 'lunar' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span>{t('form.lunar')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              checked={formData.calendarType === 'lunar_leap'}
              onChange={() => setFormData({ ...formData, calendarType: 'lunar_leap' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span>{t('form.lunarLeap')}</span>
          </label>
        </div>
      </div>

      {/* 성별 */}
      <div className="space-y-2">
        <Label>{t('form.gender')} *</Label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              checked={formData.gender === 'male'}
              onChange={() => setFormData({ ...formData, gender: 'male' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span>{t('form.male')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              checked={formData.gender === 'female'}
              onChange={() => setFormData({ ...formData, gender: 'female' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span>{t('form.female')}</span>
          </label>
        </div>
        {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('actions.save')}...
            </>
          ) : (
            t('actions.save')
          )}
        </Button>
      </div>
    </motion.form>
  );
}
