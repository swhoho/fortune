/**
 * API 에러 코드를 번역된 메시지로 변환하는 훅
 *
 * 사용 예시:
 * ```tsx
 * const { getErrorMessage } = useErrorMessage();
 *
 * // API 응답 처리
 * if (!response.ok) {
 *   const { code } = await response.json();
 *   toast.error(getErrorMessage(code));
 * }
 * ```
 */

import { useTranslations } from 'next-intl';
import type { ErrorCode, ErrorResponse } from './codes';

/**
 * 에러 메시지 훅 반환 타입
 */
interface UseErrorMessageReturn {
  /**
   * 에러 코드를 번역된 메시지로 변환
   * @param code 에러 코드
   * @param context 추가 컨텍스트 (선택)
   * @returns 번역된 에러 메시지
   */
  getErrorMessage: (code: ErrorCode | string, context?: Record<string, string | number>) => string;

  /**
   * ErrorResponse 객체를 번역된 메시지로 변환
   * @param error ErrorResponse 객체
   * @returns 번역된 에러 메시지
   */
  translateError: (error: ErrorResponse) => string;
}

/**
 * API 에러 코드를 사용자 언어에 맞는 메시지로 변환하는 훅
 */
export function useErrorMessage(): UseErrorMessageReturn {
  const t = useTranslations('errors');

  const getErrorMessage = (
    code: ErrorCode | string,
    context?: Record<string, string | number>
  ): string => {
    try {
      // 번역 키가 존재하는지 확인
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = t(code as any, context);
      return message;
    } catch {
      // 번역 키가 없는 경우 기본 에러 메시지 반환
      console.warn(`Translation missing for error code: ${code}`);
      return t('API_SERVER_ERROR');
    }
  };

  const translateError = (error: ErrorResponse): string => {
    return getErrorMessage(error.code, error.context);
  };

  return {
    getErrorMessage,
    translateError,
  };
}

/**
 * 서버 사이드에서 에러 코드에 해당하는 번역 키를 반환
 * (실제 번역은 클라이언트에서 수행)
 */
export function getErrorTranslationKey(code: ErrorCode): string {
  return `errors.${code}`;
}
