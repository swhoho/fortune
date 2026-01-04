/**
 * 애플리케이션 에러 코어 모듈
 * Phase 2: 에러 처리 표준화
 */

/**
 * 에러 코드 상수
 */
export const ErrorCode = {
  // 인증/권한
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // 크레딧
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',

  // 입력 검증
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 리소스
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // 서버
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // 네트워크
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * API 에러 응답 인터페이스
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * 유효한 에러 코드인지 확인
 */
function isValidErrorCode(code: unknown): code is ErrorCodeType {
  return typeof code === 'string' && Object.values(ErrorCode).includes(code as ErrorCodeType);
}

/** 재시도 가능한 에러 코드 목록 */
const RETRYABLE_CODES: ErrorCodeType[] = [
  ErrorCode.RATE_LIMITED,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.NETWORK_ERROR,
  ErrorCode.TIMEOUT,
];

/**
 * 애플리케이션 에러 클래스
 */
export class AppError extends Error {
  readonly code: ErrorCodeType;
  readonly details?: unknown;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: ErrorCodeType,
    options?: {
      details?: unknown;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
    this.details = options?.details;
    this.retryable = options?.retryable ?? RETRYABLE_CODES.includes(code);
  }

  /**
   * API 에러 응답에서 AppError 생성
   * @param response API 에러 응답
   * @param defaultMessage 기본 에러 메시지
   * @param fallbackCode 응답에 유효한 code가 없을 때 사용할 폴백 코드
   */
  static fromApiResponse(
    response: ApiErrorResponse,
    defaultMessage: string,
    fallbackCode: ErrorCodeType = ErrorCode.INTERNAL_ERROR
  ): AppError {
    // 유효한 에러 코드만 사용, 아니면 fallbackCode 사용
    const code = isValidErrorCode(response.code) ? response.code : fallbackCode;

    return new AppError(response.error || defaultMessage, code, {
      details: response.details,
    });
  }
}
