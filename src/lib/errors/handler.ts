/**
 * 에러 핸들링 유틸리티
 * Phase 2: 에러 처리 표준화
 */
import {
  AppError,
  ErrorCode,
  type ApiErrorResponse,
  type ErrorCodeType,
} from './index';

/**
 * HTTP 상태 코드를 에러 코드로 변환
 */
function getErrorCodeFromStatus(status: number): ErrorCodeType {
  switch (status) {
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.ALREADY_EXISTS;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.INVALID_INPUT;
  }
}

/**
 * API Response를 처리하고 실패 시 AppError를 throw
 * @param response fetch Response 객체
 * @param defaultMessage 에러 메시지 파싱 실패 시 기본 메시지
 */
export async function handleApiError(
  response: Response,
  defaultMessage: string
): Promise<never> {
  // HTTP 상태 코드 기반 폴백 코드 계산
  const fallbackCode = getErrorCodeFromStatus(response.status);

  let errorData: ApiErrorResponse;
  try {
    errorData = await response.json();
  } catch {
    // JSON 파싱 실패 시 HTTP 상태 코드 기반 에러
    throw new AppError(defaultMessage, fallbackCode);
  }

  // 응답에 code가 없으면 fallbackCode 사용
  throw AppError.fromApiResponse(errorData, defaultMessage, fallbackCode);
}

/**
 * 에러가 재시도 가능한지 확인
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }

  // 네트워크 에러 (fetch 실패)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * 에러에서 사용자에게 표시할 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다';
}

/**
 * 에러가 특정 코드인지 확인하는 타입 가드
 */
export function isErrorWithCode<T extends ErrorCodeType>(
  error: unknown,
  code: T
): error is AppError & { code: T } {
  return error instanceof AppError && error.code === code;
}

/**
 * 크레딧 부족 에러인지 확인하는 타입 가드
 */
export function isInsufficientCreditsError(
  error: unknown
): error is AppError & { code: 'INSUFFICIENT_CREDITS' } {
  return isErrorWithCode(error, ErrorCode.INSUFFICIENT_CREDITS);
}
