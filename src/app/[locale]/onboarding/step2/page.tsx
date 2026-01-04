'use client';

/**
 * 온보딩 Step 2: 생년월일 입력
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOnboardingStore } from '@/stores/onboarding-store';
import type { SajuInput } from '@/types/saju';

const timezones = [
  { value: 'GMT+9', label: '한국 / 일본 (Seoul, Tokyo)' },
  { value: 'GMT+8', label: '중국 / 대만 (Beijing, Taipei)' },
  { value: 'GMT-5', label: '미국 동부 (New York)' },
  { value: 'GMT-8', label: '미국 서부 (Los Angeles)' },
  { value: 'GMT+0', label: '영국 (London)' },
  { value: 'GMT+1', label: '중부 유럽 (Paris, Berlin)' },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const { setSajuInput } = useOnboardingStore();

  const [formData, setFormData] = useState({
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    isLunar: false,
    timezone: 'GMT+9',
    gender: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const year = parseInt(formData.year);
    if (!formData.year || year < 1900 || year > new Date().getFullYear()) {
      newErrors.year = '올바른 연도를 입력해주세요 (1900년 이후)';
    }

    const month = parseInt(formData.month);
    if (!formData.month || month < 1 || month > 12) {
      newErrors.month = '올바른 월을 입력해주세요 (1-12)';
    }

    const day = parseInt(formData.day);
    if (!formData.day || day < 1 || day > 31) {
      newErrors.day = '올바른 일을 입력해주세요 (1-31)';
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    // 출생 시간 필수 검증
    const hour = parseInt(formData.hour);
    if (!formData.hour || isNaN(hour) || hour < 0 || hour > 23) {
      newErrors.hour = '올바른 시간을 입력해주세요 (0-23)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // 스토어에 저장
    const birthDate = new Date(
      parseInt(formData.year),
      parseInt(formData.month) - 1,
      parseInt(formData.day)
    );

    const birthTime = `${formData.hour.padStart(2, '0')}:${(formData.minute || '00').padStart(2, '0')}`;

    const sajuInput: SajuInput = {
      birthDate,
      birthTime,
      timezone: formData.timezone,
      isLunar: formData.isLunar,
      gender: formData.gender === 'M' ? 'male' : 'female',
    };

    setSajuInput(sajuInput);

    router.push('/onboarding/step3');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 2/3</span>
            <span>사주 정보 입력</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: '33%' }}
              animate={{ width: '66%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e]"
            />
          </div>
        </div>
      </div>

      {/* 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <h2 className="mb-2 text-center font-serif text-2xl font-bold text-[#1a1a1a]">
          당신의 사주 정보를 입력해주세요
        </h2>
        <p className="mb-8 text-center text-gray-500">
          정확한 분석을 위해 출생 정보를 입력해주세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 생년월일 */}
          <div className="space-y-2">
            <Label>생년월일 *</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="년 (YYYY)"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className={errors.year ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="월 (MM)"
                  min={1}
                  max={12}
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className={errors.month ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="일 (DD)"
                  min={1}
                  max={31}
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className={errors.day ? 'border-red-500' : ''}
                />
              </div>
            </div>
            {(errors.year || errors.month || errors.day) && (
              <p className="text-sm text-red-500">{errors.year || errors.month || errors.day}</p>
            )}
          </div>

          {/* 출생 시간 */}
          <div className="space-y-2">
            <Label>출생 시간 *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="시 (HH)"
                min={0}
                max={23}
                value={formData.hour}
                onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                className={errors.hour ? 'border-red-500' : ''}
              />
              <Input
                type="number"
                placeholder="분 (MM)"
                min={0}
                max={59}
                value={formData.minute}
                onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
              />
            </div>
            {errors.hour && <p className="text-sm text-red-500">{errors.hour}</p>}
          </div>

          {/* 양력/음력 */}
          <div className="space-y-2">
            <Label>양력/음력 *</Label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="calendar"
                  checked={!formData.isLunar}
                  onChange={() => setFormData({ ...formData, isLunar: false })}
                  className="h-4 w-4 text-[#d4af37]"
                />
                <span>양력</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="calendar"
                  checked={formData.isLunar}
                  onChange={() => setFormData({ ...formData, isLunar: true })}
                  className="h-4 w-4 text-[#d4af37]"
                />
                <span>음력</span>
              </label>
            </div>
          </div>

          {/* 시간대 */}
          <div className="space-y-2">
            <Label>출생 시간대 *</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="시간대 선택" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">출생 국가의 시간대를 선택해주세요</p>
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <Label>성별 *</Label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={formData.gender === 'M'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="h-4 w-4 text-[#d4af37]"
                />
                <span>남성</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={formData.gender === 'F'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="h-4 w-4 text-[#d4af37]"
                />
                <span>여성</span>
              </label>
            </div>
            {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            다음
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
