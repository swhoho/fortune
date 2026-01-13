/**
 * AI 상담(컨설팅) 관련 타입 정의
 */

/** 메시지 타입 */
export type ConsultationMessageType =
  | 'user_question' // 사용자 질문
  | 'ai_clarification' // AI 추가 정보 요청
  | 'user_clarification' // 사용자 추가 정보 응답
  | 'ai_answer'; // AI 최종 답변

/** 세션 상태 */
export type ConsultationSessionStatus = 'active' | 'completed';

/** 상담 세션 (DB 형식) */
export interface ConsultationSessionRow {
  id: string;
  profile_id: string;
  user_id: string;
  profile_report_id: string | null;
  title: string | null;
  status: ConsultationSessionStatus;
  question_count: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
  /** 현재 명확화 횟수 (v2.0) */
  clarification_count?: number;
  /** 최대 명확화 횟수 (v2.0) */
  max_clarifications?: number;
}

/** 상담 세션 (클라이언트 형식) */
export interface ConsultationSession {
  id: string;
  profileId: string;
  title: string | null;
  status: ConsultationSessionStatus;
  questionCount: number;
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
  /** 마지막 메시지 미리보기 (목록 표시용) */
  lastMessage?: string;
  /** 현재 명확화 횟수 (v2.0) */
  clarificationCount?: number;
  /** 최대 명확화 횟수 (v2.0) */
  maxClarifications?: number;
}

/** 메시지 상태 (비동기 처리용) */
export type ConsultationMessageStatus = 'generating' | 'completed' | 'failed';

/** 상담 메시지 (DB 형식) */
export interface ConsultationMessageRow {
  id: string;
  session_id: string;
  message_type: ConsultationMessageType;
  content: string;
  question_round: number | null;
  created_at: string;
  status?: ConsultationMessageStatus;
  error_message?: string;
  /** 명확화 라운드 번호 (v2.0, 1-3) */
  clarification_round?: number;
}

/** 상담 메시지 (클라이언트 형식) */
export interface ConsultationMessage {
  id: string;
  sessionId: string;
  type: ConsultationMessageType;
  content: string;
  questionRound: number | null;
  createdAt: string;
  /** 메시지 상태 (AI 응답의 비동기 처리용) */
  status?: ConsultationMessageStatus;
  /** 실패 시 에러 메시지 */
  errorMessage?: string;
  /** 명확화 라운드 번호 (v2.0, 1-3) */
  clarificationRound?: number;
}

/** 세션 목록 조회 응답 */
export interface GetSessionsResponse {
  success: boolean;
  data: {
    sessions: ConsultationSession[];
  };
  error?: string;
}

/** 세션 생성 요청 */
export interface CreateSessionRequest {
  title?: string;
}

/** 세션 생성 응답 */
export interface CreateSessionResponse {
  success: boolean;
  data?: {
    sessionId: string;
    title: string | null;
    creditsUsed: number;
    remainingCredits: number;
  };
  error?: string;
  code?: string;
}

/** 메시지 목록 조회 응답 */
export interface GetMessagesResponse {
  success: boolean;
  data: {
    session: {
      id: string;
      title: string | null;
      status: ConsultationSessionStatus;
      questionCount: number;
      maxQuestions: number;
      /** 현재 명확화 횟수 (v2.0) */
      clarificationCount?: number;
      /** 최대 명확화 횟수 (v2.0) */
      maxClarifications?: number;
    };
    messages: ConsultationMessage[];
  };
  error?: string;
}

/** 메시지 전송 요청 */
export interface SendMessageRequest {
  content: string;
  messageType: 'user_question' | 'user_clarification';
  /** 추가 정보 요청 건너뛰기 */
  skipClarification?: boolean;
}

/** AI 추가 정보 요청 응답 */
export interface ClarificationResponse {
  isValidQuestion: boolean;
  needsClarification: boolean;
  clarificationQuestions: string[];
  invalidReason: string | null;
}

/** 메시지 전송 응답 */
export interface SendMessageResponse {
  success: boolean;
  data?: {
    userMessage: {
      id: string;
      content: string;
      createdAt: string;
    };
    aiResponse: {
      id: string;
      type: 'ai_clarification' | 'ai_answer';
      content: string;
      questionRound: number;
      /** AI 추가 정보 요청 (clarification일 때만) */
      clarificationQuestions?: string[];
      /** 메시지 상태 (비동기 처리) */
      status?: ConsultationMessageStatus;
      /** 명확화 라운드 번호 (v2.0) */
      clarificationRound?: number;
    };
    sessionStatus: ConsultationSessionStatus;
    questionCount: number;
    canAskMore: boolean;
    /** 현재 명확화 라운드 (v2.0) */
    clarificationRound?: number;
    /** 최대 명확화 횟수 (v2.0) */
    maxClarifications?: number;
    /** 마지막 명확화 여부 (v2.0) */
    isLastClarification?: boolean;
  };
  error?: string;
  code?: string;
}

/** DB → 클라이언트 변환 헬퍼 */
export function transformSession(row: ConsultationSessionRow): ConsultationSession {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    status: row.status,
    questionCount: row.question_count,
    creditsUsed: row.credits_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clarificationCount: row.clarification_count,
    maxClarifications: row.max_clarifications,
  };
}

export function transformMessage(row: ConsultationMessageRow): ConsultationMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    type: row.message_type,
    content: row.content,
    questionRound: row.question_round,
    createdAt: row.created_at,
    status: row.status,
    errorMessage: row.error_message,
    clarificationRound: row.clarification_round,
  };
}

/** 상수 */
export const CONSULTATION_CONSTANTS = {
  /** 세션당 최대 질문 수 */
  MAX_QUESTIONS_PER_SESSION: 2,
  /** 세션 생성 크레딧 비용 */
  SESSION_CREDITS: 10,
  /** 질문 최대 길이 */
  MAX_QUESTION_LENGTH: 500,
  /** 최대 명확화 횟수 (v2.0) */
  MAX_CLARIFICATIONS: 3,
} as const;
