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
import { createProfileSchema, type CreateProfileInput } from '@/lib/validations/profile';

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
  period: 'AM' | 'PM';
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

      // 24시간 → 12시간 변환
      let hour12 = '';
      let period: 'AM' | 'PM' = 'AM';
      if (timeParts[0]) {
        const hour24 = parseInt(timeParts[0]);
        period = hour24 >= 12 ? 'PM' : 'AM';
        hour12 = String(hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24 === 12 ? 12 : hour24);
      }

      return {
        name: initialData.name,
        year: dateParts[0] ?? '',
        month: dateParts[1] ?? '',
        day: dateParts[2] ?? '',
        hour: hour12,
        minute: timeParts[1] ?? '',
        period,
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
      period: 'AM',
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
   * 폼 유효성 검사 (Zod 스키마 기반)
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. 개별 필드 기본 검증 (빈 값 체크)
    if (!formData.year || !formData.month || !formData.day) {
      if (!formData.year) newErrors.year = t('validation.invalidDate');
      if (!formData.month) newErrors.month = t('validation.invalidDate');
      if (!formData.day) newErrors.day = t('validation.invalidDate');
      setErrors(newErrors);
      return false;
    }

    // 2. 폼 데이터를 스키마 형식으로 변환
    const birthDate = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;

    // 출생 시간 필수 검증
    if (!formData.hour) {
      newErrors.hour = t('validation.invalidTime');
      setErrors(newErrors);
      return false;
    }

    // 12시간 → 24시간 변환
    const hour12 = parseInt(formData.hour);
    let hour24: number;
    if (formData.period === 'AM') {
      hour24 = hour12 === 12 ? 0 : hour12;
    } else {
      hour24 = hour12 === 12 ? 12 : hour12 + 12;
    }
    const birthTime = `${String(hour24).padStart(2, '0')}:${(formData.minute || '00').padStart(2, '0')}`;

    const dataToValidate = {
      name: formData.name.trim(),
      gender: formData.gender || undefined,
      birthDate,
      birthTime,
      calendarType: formData.calendarType,
    };

    // 3. Zod 스키마로 검증
    const result = createProfileSchema.safeParse(dataToValidate);

    if (result.success) {
      setErrors({});
      return true;
    }

    // 4. Zod 에러를 다국어 메시지로 변환
    // enum 필드는 기본 번역 키 사용 (Zod enum은 커스텀 메시지 미지원)
    const fieldDefaultMessages: Record<string, string> = {
      gender: 'validation.genderRequired',
      calendarType: 'validation.invalidCalendarType',
    };

    result.error.issues.forEach((issue) => {
      const path = String(issue.path[0]);
      // birthDate 에러는 year 필드에 표시
      const fieldKey = path === 'birthDate' ? 'year' : path;
      // enum 필드는 기본 번역 키 사용, 그 외는 Zod 메시지 사용
      const messageKey = fieldDefaultMessages[path] || issue.message;
      newErrors[fieldKey] = t(messageKey);
    });

    setErrors(newErrors);
    return false;
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // 생년월일 포맷팅
    const birthDate = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;

    // 출생시간 포맷팅 (12시간 → 24시간 변환)
    const hour12 = parseInt(formData.hour);
    let hour24: number;
    if (formData.period === 'AM') {
      hour24 = hour12 === 12 ? 0 : hour12;
    } else {
      hour24 = hour12 === 12 ? 12 : hour12 + 12;
    }
    const birthTime = `${String(hour24).padStart(2, '0')}:${(formData.minute || '00').padStart(2, '0')}`;

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
        <Label className="text-gray-300">{t('form.name')} *</Label>
        <Input
          type="text"
          placeholder={t('form.namePlaceholder')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#d4af37] ${errors.name ? 'border-red-500' : ''}`}
          maxLength={50}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <Label className="text-gray-300">{t('form.birthDate')} *</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder={t('form.yearPlaceholder')}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className={`border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#d4af37] ${errors.year ? 'border-red-500' : ''}`}
            min={1900}
            max={new Date().getFullYear()}
          />
          <Input
            type="number"
            placeholder={t('form.monthPlaceholder')}
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            className={`border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#d4af37] ${errors.month ? 'border-red-500' : ''}`}
            min={1}
            max={12}
          />
          <Input
            type="number"
            placeholder={t('form.dayPlaceholder')}
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            className={`border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#d4af37] ${errors.day ? 'border-red-500' : ''}`}
            min={1}
            max={31}
          />
        </div>
        {(errors.year || errors.month || errors.day) && (
          <p className="text-sm text-red-500">{errors.year || errors.month || errors.day}</p>
        )}
      </div>

      {/* 출생 시간 */}
      <div className="space-y-2">
        <Label className="text-gray-300">{t('form.birthTime')} *</Label>

        {/* 오전/오후 선택 */}
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="period"
              checked={formData.period === 'AM'}
              onChange={() => setFormData({ ...formData, period: 'AM' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.am')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="period"
              checked={formData.period === 'PM'}
              onChange={() => setFormData({ ...formData, period: 'PM' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.pm')}</span>
          </label>
        </div>

        {/* 시간/분 입력 */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder={t('form.hourPlaceholder12')}
            value={formData.hour}
            onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
            className={`border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#d4af37] ${errors.hour ? 'border-red-500' : ''}`}
            min={1}
            max={12}
          />
          <Input
            type="number"
            placeholder={t('form.minutePlaceholder')}
            value={formData.minute}
            onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
            className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#d4af37]"
            min={0}
            max={59}
          />
        </div>
        {errors.hour && <p className="text-sm text-red-500">{errors.hour}</p>}
      </div>

      {/* 달력 유형 */}
      <div className="space-y-2">
        <Label className="text-gray-300">{t('form.calendarType')} *</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              checked={formData.calendarType === 'solar'}
              onChange={() => setFormData({ ...formData, calendarType: 'solar' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.solar')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              checked={formData.calendarType === 'lunar'}
              onChange={() => setFormData({ ...formData, calendarType: 'lunar' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.lunar')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              checked={formData.calendarType === 'lunar_leap'}
              onChange={() => setFormData({ ...formData, calendarType: 'lunar_leap' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.lunarLeap')}</span>
          </label>
        </div>
      </div>

      {/* 성별 */}
      <div className="space-y-2">
        <Label className="text-gray-300">{t('form.gender')} *</Label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              checked={formData.gender === 'male'}
              onChange={() => setFormData({ ...formData, gender: 'male' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.male')}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              checked={formData.gender === 'female'}
              onChange={() => setFormData({ ...formData, gender: 'female' })}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-gray-300">{t('form.female')}</span>
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
