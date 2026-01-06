/**
 * API 에러 코드 상수 정의
 *
 * API는 에러 코드만 반환하고, 프론트엔드에서 번역 키로 변환하여 표시합니다.
 * 이 방식의 장점:
 * - API는 언어에 독립적
 * - 에러 메시지 일관성 유지
 * - 프론트엔드에서 사용자 언어에 맞게 표시
 */

/**
 * 인증 관련 에러 코드
 */
export const AUTH_ERRORS = {
  /** 로그인 필요 */
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  /** 세션 만료 */
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  /** 권한 없음 */
  FORBIDDEN: 'AUTH_FORBIDDEN',
  /** 잘못된 자격 증명 */
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  /** 이메일 미인증 */
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  /** 이미 가입된 이메일 */
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  /** 약한 비밀번호 */
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
} as const;

/**
 * API 일반 에러 코드
 */
export const API_ERRORS = {
  /** 서버 내부 오류 */
  SERVER_ERROR: 'API_SERVER_ERROR',
  /** 잘못된 요청 */
  BAD_REQUEST: 'API_BAD_REQUEST',
  /** 리소스를 찾을 수 없음 */
  NOT_FOUND: 'API_NOT_FOUND',
  /** 요청 시간 초과 */
  TIMEOUT: 'API_TIMEOUT',
  /** 요청 횟수 제한 초과 */
  RATE_LIMITED: 'API_RATE_LIMITED',
  /** 외부 서비스 오류 */
  EXTERNAL_SERVICE_ERROR: 'API_EXTERNAL_SERVICE_ERROR',
} as const;

/**
 * 분석 관련 에러 코드
 */
export const ANALYSIS_ERRORS = {
  /** 분석 시간 초과 */
  TIMEOUT: 'ANALYSIS_TIMEOUT',
  /** 분석 중단됨 */
  ABORTED: 'ANALYSIS_ABORTED',
  /** 분석 저장 실패 */
  SAVE_FAILED: 'ANALYSIS_SAVE_FAILED',
  /** AI 서비스 오류 */
  AI_SERVICE_ERROR: 'ANALYSIS_AI_SERVICE_ERROR',
  /** AI 설정 오류 */
  AI_CONFIG_ERROR: 'ANALYSIS_AI_CONFIG_ERROR',
  /** AI 요청 한도 초과 */
  AI_RATE_LIMITED: 'ANALYSIS_AI_RATE_LIMITED',
  /** 잘못된 사주 데이터 */
  INVALID_SAJU_DATA: 'ANALYSIS_INVALID_SAJU_DATA',
  /** 만세력 계산 오류 */
  MANSERYEOK_ERROR: 'ANALYSIS_MANSERYEOK_ERROR',
} as const;

/**
 * 프로필 관련 에러 코드
 */
export const PROFILE_ERRORS = {
  /** 프로필을 찾을 수 없음 */
  NOT_FOUND: 'PROFILE_NOT_FOUND',
  /** 프로필 생성 실패 */
  CREATE_FAILED: 'PROFILE_CREATE_FAILED',
  /** 프로필 수정 실패 */
  UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  /** 프로필 삭제 실패 */
  DELETE_FAILED: 'PROFILE_DELETE_FAILED',
  /** 최대 프로필 개수 초과 */
  MAX_LIMIT_EXCEEDED: 'PROFILE_MAX_LIMIT_EXCEEDED',
} as const;

/**
 * 크레딧 관련 에러 코드
 */
export const CREDIT_ERRORS = {
  /** 크레딧 부족 */
  INSUFFICIENT: 'CREDIT_INSUFFICIENT',
  /** 크레딧 차감 실패 */
  DEDUCTION_FAILED: 'CREDIT_DEDUCTION_FAILED',
  /** 크레딧 조회 실패 */
  FETCH_FAILED: 'CREDIT_FETCH_FAILED',
} as const;

/**
 * 결제 관련 에러 코드
 */
export const PAYMENT_ERRORS = {
  /** 결제 세션 생성 실패 */
  SESSION_CREATE_FAILED: 'PAYMENT_SESSION_CREATE_FAILED',
  /** 결제 검증 실패 */
  VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  /** 결제 취소됨 */
  CANCELLED: 'PAYMENT_CANCELLED',
  /** 결제 금액 불일치 */
  AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
  /** 유효하지 않은 패키지 */
  INVALID_PACKAGE: 'PAYMENT_INVALID_PACKAGE',
  /** 결제 정보 조회 실패 */
  INFO_FETCH_FAILED: 'PAYMENT_INFO_FETCH_FAILED',
  /** 결제 미완료 */
  NOT_COMPLETED: 'PAYMENT_NOT_COMPLETED',
  /** 이미 처리된 결제 */
  ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  /** 결제 기록 생성 실패 */
  RECORD_CREATE_FAILED: 'PAYMENT_RECORD_CREATE_FAILED',
  /** 사용자 정보 조회 실패 */
  USER_FETCH_FAILED: 'PAYMENT_USER_FETCH_FAILED',
  /** 크레딧 업데이트 실패 */
  CREDIT_UPDATE_FAILED: 'PAYMENT_CREDIT_UPDATE_FAILED',
} as const;

/**
 * 검증 관련 에러 코드
 */
export const VALIDATION_ERRORS = {
  /** 필수 필드 누락 */
  REQUIRED_FIELD_MISSING: 'VALIDATION_REQUIRED_FIELD_MISSING',
  /** 잘못된 날짜 형식 */
  INVALID_DATE: 'VALIDATION_INVALID_DATE',
  /** 잘못된 이메일 형식 */
  INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  /** 값이 범위를 벗어남 */
  OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  /** 잘못된 입력 데이터 */
  INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  /** 수정할 데이터 없음 */
  NO_UPDATES: 'VALIDATION_NO_UPDATES',
} as const;

/**
 * 모든 에러 코드 타입
 */
export type ErrorCode =
  | (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS]
  | (typeof API_ERRORS)[keyof typeof API_ERRORS]
  | (typeof ANALYSIS_ERRORS)[keyof typeof ANALYSIS_ERRORS]
  | (typeof PROFILE_ERRORS)[keyof typeof PROFILE_ERRORS]
  | (typeof CREDIT_ERRORS)[keyof typeof CREDIT_ERRORS]
  | (typeof PAYMENT_ERRORS)[keyof typeof PAYMENT_ERRORS]
  | (typeof VALIDATION_ERRORS)[keyof typeof VALIDATION_ERRORS];

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  /** 에러 코드 (번역 키로 사용) */
  code: ErrorCode;
  /** 추가 컨텍스트 (선택) */
  context?: Record<string, string | number>;
  /** 디버그용 상세 메시지 (개발 환경에서만) */
  debug?: string;
}

/**
 * API 에러 응답 생성 헬퍼
 */
export function createErrorResponse(
  code: ErrorCode,
  context?: Record<string, string | number>,
  debug?: string
): ErrorResponse {
  const response: ErrorResponse = { code };

  if (context) {
    response.context = context;
  }

  // 개발 환경에서만 debug 메시지 포함
  if (debug && process.env.NODE_ENV === 'development') {
    response.debug = debug;
  }

  return response;
}

/**
 * HTTP 상태 코드 매핑
 */
export const ERROR_STATUS_CODES: Partial<Record<ErrorCode, number>> = {
  // 인증 에러 (401, 403)
  [AUTH_ERRORS.UNAUTHORIZED]: 401,
  [AUTH_ERRORS.SESSION_EXPIRED]: 401,
  [AUTH_ERRORS.FORBIDDEN]: 403,
  [AUTH_ERRORS.INVALID_CREDENTIALS]: 401,

  // API 에러 (400, 404, 500)
  [API_ERRORS.BAD_REQUEST]: 400,
  [API_ERRORS.NOT_FOUND]: 404,
  [API_ERRORS.SERVER_ERROR]: 500,
  [API_ERRORS.TIMEOUT]: 504,
  [API_ERRORS.RATE_LIMITED]: 429,

  // 크레딧 에러 (402)
  [CREDIT_ERRORS.INSUFFICIENT]: 402,

  // 검증 에러 (400)
  [VALIDATION_ERRORS.REQUIRED_FIELD_MISSING]: 400,
  [VALIDATION_ERRORS.INVALID_DATE]: 400,
  [VALIDATION_ERRORS.INVALID_EMAIL]: 400,
  [VALIDATION_ERRORS.INVALID_INPUT]: 400,
  [VALIDATION_ERRORS.NO_UPDATES]: 400,

  // 프로필 에러 (404)
  [PROFILE_ERRORS.NOT_FOUND]: 404,
  [PROFILE_ERRORS.UPDATE_FAILED]: 404,
  [PROFILE_ERRORS.DELETE_FAILED]: 404,

  // 결제 에러 (400, 500)
  [PAYMENT_ERRORS.INVALID_PACKAGE]: 400,
  [PAYMENT_ERRORS.AMOUNT_MISMATCH]: 400,
  [PAYMENT_ERRORS.INFO_FETCH_FAILED]: 400,
  [PAYMENT_ERRORS.NOT_COMPLETED]: 400,
  [PAYMENT_ERRORS.ALREADY_PROCESSED]: 400,
  [PAYMENT_ERRORS.SESSION_CREATE_FAILED]: 500,
  [PAYMENT_ERRORS.VERIFICATION_FAILED]: 500,
  [PAYMENT_ERRORS.RECORD_CREATE_FAILED]: 500,
  [PAYMENT_ERRORS.USER_FETCH_FAILED]: 500,
  [PAYMENT_ERRORS.CREDIT_UPDATE_FAILED]: 500,
};

/**
 * 에러 코드에 해당하는 HTTP 상태 코드 반환
 */
export function getStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_CODES[code] ?? 500;
}
