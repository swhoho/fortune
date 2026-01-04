/**
 * Profile Zod 스키마
 * Task 2.7: 프로필 검증 스키마
 */
import { z } from 'zod';

/**
 * 프로필 생성 스키마
 */
export const createProfileSchema = z.object({
  /** 이름 (1-50자) */
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이내로 입력해주세요'),

  /** 성별 */
  gender: z.enum(['male', 'female'], {
    message: '성별을 선택해주세요',
  }),

  /** 생년월일 (YYYY-MM-DD) */
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)')
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
      { message: '유효하지 않은 날짜입니다 (1900년 이후, 오늘 이전)' }
    ),

  /** 출생시간 (HH:mm, 선택) */
  birthTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '올바른 시간 형식이 아닙니다 (HH:mm)')
    .optional()
    .nullable(),

  /** 달력 유형 */
  calendarType: z
    .enum(['solar', 'lunar', 'lunar_leap'], {
      message: '올바른 달력 유형을 선택해주세요',
    })
    .default('solar'),
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
