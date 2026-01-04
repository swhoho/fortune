/**
 * Profile Zod 스키마
 * Task 2.7: 프로필 검증 스키마
 */
import { z } from 'zod';

/**
 * 프로필 생성 스키마
 * 에러 메시지는 번역 키로 지정 (i18n 지원)
 */
export const createProfileSchema = z.object({
  /** 이름 (1-50자) */
  name: z
    .string()
    .min(1, { message: 'validation.nameRequired' })
    .max(50, { message: 'validation.nameMaxLength' }),

  /** 성별 - 에러 메시지는 ProfileForm에서 처리 */
  gender: z.enum(['male', 'female']),

  /** 생년월일 (YYYY-MM-DD) */
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.invalidDate' })
    .refine(
      (date) => {
        const parsed = Date.parse(date);
        if (isNaN(parsed)) return false;
        // 미래 날짜 검증
        if (new Date(date) > new Date()) return false;
        // 1900년 이전 날짜 검증
        if (new Date(date) < new Date('1900-01-01')) return false;
        return true;
      },
      { message: 'validation.invalidDate' }
    ),

  /** 출생시간 (HH:mm, 필수) */
  birthTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'validation.invalidTime' }),

  /** 달력 유형 */
  calendarType: z.enum(['solar', 'lunar', 'lunar_leap']).default('solar'),
});

/**
 * 프로필 수정 스키마 (모든 필드 선택)
 */
export const updateProfileSchema = createProfileSchema.partial();

/**
 * 타입 추출
 */
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
