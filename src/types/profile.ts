/**
 * Profile 타입 정의
 * Task 2: 분석 대상자 프로필
 */

/** 달력 유형 */
export type CalendarType = 'solar' | 'lunar' | 'lunar_leap';

/** 성별 */
export type Gender = 'male' | 'female';

/**
 * 프로필 인터페이스 (DB 스키마)
 */
export interface Profile {
  id: string;
  userId: string;
  name: string;
  gender: Gender;
  birthDate: string; // ISO date string (YYYY-MM-DD)
  birthTime: string | null; // HH:mm or null
  calendarType: CalendarType;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * API 응답용 프로필 (camelCase)
 */
export interface ProfileResponse {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string;
  birthTime: string | null;
  calendarType: CalendarType;
  createdAt: string;
  updatedAt: string;
}

/**
 * 프로필 목록 API 응답
 */
export interface ProfileListResponse {
  success: boolean;
  data: ProfileResponse[];
}

/**
 * 프로필 단일 API 응답
 */
export interface ProfileSingleResponse {
  success: boolean;
  data: ProfileResponse;
}

/**
 * 프로필 삭제 API 응답
 */
export interface ProfileDeleteResponse {
  success: boolean;
  message: string;
}
