/**
 * AI 상담(컨설팅) 로직
 * Gemini AI를 활용한 사주 상담 기능
 */
import { getGeminiModel } from './gemini';
import type { GeminiApiError } from './types';
import type { ClarificationResponse } from '@/types/consultation';
import type { PillarsHanja } from '@/types/saju';
import type { ReportDaewunItem } from '@/types/report';

/** 상담 입력 타입 */
export interface ConsultationInput {
  /** 원질문 */
  question: string;
  /** 사주 팔자 */
  pillars: PillarsHanja;
  /** 대운 정보 */
  daewun: ReportDaewunItem[];
  /** 기본 분석 요약 (선택) */
  analysisSummary?: string;
  /** 세션 내 이전 대화 기록 */
  sessionHistory?: Array<{
    question: string;
    answer: string;
  }>;
  /** 추가 정보 (사용자가 제공한 clarification 응답) */
  clarificationResponse?: string;
  /** 언어 */
  language?: string;
}

/** 상담 응답 타입 */
export interface ConsultationResponse {
  success: boolean;
  data?: {
    answer: string;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
    };
  };
  error?: GeminiApiError;
}

/**
 * AI 상담 클래스
 */
export class ConsultationAI {
  private defaultTimeout: number;
  private defaultRetryCount: number;

  constructor(options?: { timeout?: number; retryCount?: number }) {
    this.defaultTimeout = options?.timeout ?? 30000;
    this.defaultRetryCount = options?.retryCount ?? 2;
  }

  /**
   * 추가 정보 요청 생성
   * 질문 검증 및 구체화를 위한 추가 질문 생성
   * @param question - 사용자 질문
   * @param language - 언어 코드
   */
  async generateClarification(
    question: string,
    language: string = 'ko'
  ): Promise<{ success: boolean; data?: ClarificationResponse; error?: GeminiApiError }> {
    const prompt = this.buildClarificationPrompt(question, language);

    try {
      const result = await this.callGeminiForJsonWithTimeout<ClarificationResponse>(
        prompt,
        this.defaultTimeout
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  /**
   * 최종 상담 답변 생성
   * @param input - 상담 입력 데이터
   */
  async generateAnswer(input: ConsultationInput): Promise<ConsultationResponse> {
    const timeout = this.defaultTimeout;
    const retryCount = this.defaultRetryCount;

    // 입력 유효성 검사
    const validationError = this.validateInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // 프롬프트 생성
    const prompt = this.buildAnswerPrompt(input);

    // Gemini API 호출 (재시도 로직)
    let lastError: GeminiApiError | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await this.callGeminiForTextWithTimeout(prompt, timeout);
        return {
          success: true,
          data: {
            answer: result.text,
            tokenUsage: {
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
            },
          },
        };
      } catch (error) {
        lastError = this.handleError(error);

        // 재시도 불가능한 에러
        if (this.isNonRetryableError(lastError)) {
          return { success: false, error: lastError };
        }

        // 재시도
        if (attempt < retryCount) {
          console.log(`[ConsultationAI] 재시도 ${attempt + 1}/${retryCount}...`);
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    return {
      success: false,
      error: lastError ?? { code: 'UNKNOWN_ERROR', message: '알 수 없는 오류가 발생했습니다' },
    };
  }

  /**
   * 추가 정보 요청 프롬프트 생성
   */
  private buildClarificationPrompt(question: string, language: string): string {
    const prompts: Record<string, string> = {
      ko: `당신은 30년 경력의 명리학 전문가 상담 보조입니다.
사용자가 사주 상담을 요청했습니다. 더 정확하고 구체적인 답변을 위해 질문을 분석하고 추가 정보가 필요한지 판단해주세요.

## 역할
1. 질문이 사주/명리학 관련인지 검증
2. 구체적인 답변을 위해 추가 정보가 필요한지 판단
3. 필요시 1-2개의 추가 질문 제시

## 사용자 질문
${question}

## 판단 기준
- 직장/이직 관련 → 현재 직종, 고민하는 시기, 이직 이유 확인
- 연애/결혼 관련 → 현재 연애 상태, 구체적인 고민 확인
- 재물/투자 관련 → 직장 수입/사업/투자 중 어느 관심인지
- 건강 관련 → 특정 증상이나 걱정되는 부위 확인
- 대인관계 관련 → 가족/친구/직장 중 어느 관계인지
- 진로/적성 관련 → 현재 상황, 고민의 구체적 내용

## 응답 JSON 형식
{
  "isValidQuestion": true/false,
  "needsClarification": true/false,
  "clarificationQuestions": ["추가 질문 1", "추가 질문 2"],
  "invalidReason": null 또는 "유효하지 않은 이유"
}

## 주의사항
- 너무 많은 질문은 사용자를 지치게 합니다. 꼭 필요한 1-2개만 질문하세요.
- 질문이 충분히 구체적이면 needsClarification: false로 응답하세요.
- 사주와 무관한 질문(날씨, 뉴스 등)은 isValidQuestion: false로 응답하세요.

JSON만 응답해주세요.`,

      en: `You are a consultation assistant for a fortune-telling expert with 30 years of experience.
A user has requested a Four Pillars (Saju) consultation. Analyze the question and determine if additional information is needed for a more accurate response.

## Role
1. Verify if the question is related to Four Pillars/Chinese astrology
2. Determine if additional information is needed for a specific answer
3. Provide 1-2 clarifying questions if needed

## User Question
${question}

## Evaluation Criteria
- Career/job change → Current job, timing, reasons
- Romance/marriage → Current relationship status, specific concerns
- Wealth/investment → Job income, business, or investment interest
- Health → Specific symptoms or concerns
- Relationships → Family, friends, or work relationships
- Career path → Current situation, specific concerns

## Response JSON Format
{
  "isValidQuestion": true/false,
  "needsClarification": true/false,
  "clarificationQuestions": ["Question 1", "Question 2"],
  "invalidReason": null or "Reason if invalid"
}

## Notes
- Too many questions will tire the user. Ask only 1-2 essential questions.
- If the question is specific enough, respond with needsClarification: false.
- For unrelated questions (weather, news, etc.), respond with isValidQuestion: false.

Respond with JSON only.`,
    };

    return (prompts[language] ?? prompts['ko']) as string;
  }

  /**
   * 최종 답변 프롬프트 생성
   */
  private buildAnswerPrompt(input: ConsultationInput): string {
    const {
      question,
      pillars,
      daewun,
      analysisSummary,
      sessionHistory,
      clarificationResponse,
      language = 'ko',
    } = input;

    // 사주 정보 포맷
    const pillarsInfo = `
사주 팔자:
- 연주(年柱): ${pillars.year.stem}${pillars.year.branch}
- 월주(月柱): ${pillars.month.stem}${pillars.month.branch}
- 일주(日柱): ${pillars.day.stem}${pillars.day.branch} ← 일간(나)
- 시주(時柱): ${pillars.hour.stem}${pillars.hour.branch}`;

    // 대운 정보 포맷
    const daewunInfo =
      daewun.length > 0
        ? `\n대운 흐름:\n${daewun.map((d) => `- ${d.age}~${d.endAge}세: ${d.stem}${d.branch} (${d.tenGod}) - ${d.description?.slice(0, 50) || ''}...`).join('\n')}`
        : '';

    // 세션 히스토리 포맷
    const historyInfo =
      sessionHistory && sessionHistory.length > 0
        ? `\n이전 상담 기록:\n${sessionHistory.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n\n')}`
        : '';

    // 추가 정보 포맷
    const clarificationInfo = clarificationResponse
      ? `\n추가로 제공된 정보:\n${clarificationResponse}`
      : '';

    const prompts: Record<string, string> = {
      ko: `당신은 30년 경력의 명리학 전문가입니다.
사용자의 사주를 바탕으로 상담 요청에 답변해주세요.

## 사주 정보
${pillarsInfo}
${daewunInfo}
${analysisSummary ? `\n분석 요약: ${analysisSummary}` : ''}
${historyInfo}

## 상담 요청
원래 질문: ${question}
${clarificationInfo}

## 답변 가이드라인
1. 명리학적 근거를 바탕으로 구체적인 조언을 제공하세요
2. 대운과 세운의 흐름을 고려하여 시기를 제안하세요
3. 일간(日干)의 특성을 반영한 개인 맞춤 조언을 하세요
4. 500-800자 내외로 상세하게 답변하세요
5. 미신적 표현은 지양하고 건설적인 조언을 제공하세요
6. 필요시 자평진전, 궁통보감 등 고전을 인용하세요
7. 따뜻하고 전문적인 톤을 유지하세요

답변만 작성해주세요 (JSON 형식 불필요).`,

      en: `You are a fortune-telling expert with 30 years of experience.
Please respond to the consultation request based on the user's Four Pillars chart.

## Four Pillars Information
${pillarsInfo}
${daewunInfo}
${analysisSummary ? `\nAnalysis Summary: ${analysisSummary}` : ''}
${historyInfo}

## Consultation Request
Original Question: ${question}
${clarificationInfo}

## Response Guidelines
1. Provide specific advice based on astrological principles
2. Consider the flow of major cycles when suggesting timing
3. Give personalized advice reflecting the Day Master's characteristics
4. Respond in 500-800 characters with detail
5. Avoid superstitious expressions, provide constructive advice
6. Reference classics like Ziping Zhenguan or Qiongtongbaokan when needed
7. Maintain a warm and professional tone

Write only the answer (no JSON format needed).`,
    };

    return (prompts[language] ?? prompts['ko']) as string;
  }

  /**
   * 입력 유효성 검사
   */
  private validateInput(input: ConsultationInput): GeminiApiError | null {
    if (!input.question || input.question.trim() === '') {
      return { code: 'INVALID_INPUT', message: '질문을 입력해주세요' };
    }

    if (input.question.length > 500) {
      return { code: 'INVALID_INPUT', message: '질문은 500자 이내로 입력해주세요' };
    }

    if (!input.pillars) {
      return { code: 'INVALID_INPUT', message: '사주 정보가 필요합니다' };
    }

    return null;
  }

  /**
   * JSON 응답용 Gemini API 호출
   */
  private async callGeminiForJsonWithTimeout<T>(prompt: string, timeout: number): Promise<T> {
    const model = getGeminiModel();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    });

    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = result.response.text();

    // JSON 파싱
    let jsonString = responseText.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim();
    }

    return JSON.parse(jsonString) as T;
  }

  /**
   * 텍스트 응답용 Gemini API 호출
   */
  private async callGeminiForTextWithTimeout(
    prompt: string,
    timeout: number
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const model = getGeminiModel();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    });

    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = result.response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('AI 응답이 비어있습니다');
    }

    const usageMetadata = result.response.usageMetadata;

    return {
      text: responseText.trim(),
      inputTokens: usageMetadata?.promptTokenCount ?? 0,
      outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  /**
   * 에러 핸들링
   */
  private handleError(error: unknown): GeminiApiError {
    if (error instanceof Error) {
      if (error.message === 'TIMEOUT') {
        return {
          code: 'TIMEOUT',
          message: 'AI 상담 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        };
      }

      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return {
          code: 'INVALID_API_KEY',
          message: 'AI 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.',
        };
      }

      if (error.message.includes('quota') || error.message.includes('rate')) {
        return {
          code: 'RATE_LIMIT',
          message: 'AI 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        };
      }

      if (error.message.includes('JSON')) {
        return {
          code: 'PARSE_ERROR',
          message: 'AI 응답 처리 중 오류가 발생했습니다.',
          details: error.message,
        };
      }

      return { code: 'API_ERROR', message: error.message };
    }

    return { code: 'UNKNOWN_ERROR', message: '알 수 없는 오류가 발생했습니다' };
  }

  /**
   * 재시도 불가능한 에러 판별
   */
  private isNonRetryableError(error: GeminiApiError): boolean {
    const nonRetryableCodes = [
      'INVALID_INPUT',
      'INVALID_API_KEY',
      'PARSE_ERROR',
      'MODEL_NOT_FOUND',
    ];
    return nonRetryableCodes.includes(error.code);
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 기본 ConsultationAI 인스턴스
 */
export const consultationAI = new ConsultationAI();
