/**
 * SajuAnalyzer 클래스
 * Gemini AI를 활용한 사주 분석 메인 로직
 */
import { getGeminiModel } from './gemini';
import { generateAnalysisPrompt } from './prompts';
import type {
  GeminiAnalysisInput,
  SajuAnalysisResult,
  GeminiApiError,
  AnalysisResponse,
  AnalysisOptions,
} from './types';

/**
 * SajuAnalyzer 클래스
 * 사주 분석의 핵심 비즈니스 로직 담당
 */
export class SajuAnalyzer {
  private defaultTimeout: number;
  private defaultRetryCount: number;

  constructor(options?: AnalysisOptions) {
    this.defaultTimeout = options?.timeout ?? 30000;
    this.defaultRetryCount = options?.retryCount ?? 2;
  }

  /**
   * 사주 분석 실행
   * @param input - 분석 입력 데이터 (사주, 대운, 질문 등)
   * @param options - 분석 옵션 (타임아웃, 재시도)
   * @returns 분석 결과 또는 에러
   */
  async analyze(input: GeminiAnalysisInput, options?: AnalysisOptions): Promise<AnalysisResponse> {
    const timeout = options?.timeout ?? this.defaultTimeout;
    const retryCount = options?.retryCount ?? this.defaultRetryCount;

    // 입력 유효성 검사
    const validationError = this.validateInput(input);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // 프롬프트 생성
    const prompt = generateAnalysisPrompt(input);

    // Gemini API 호출 (재시도 로직 포함)
    let lastError: GeminiApiError | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await this.callGeminiWithTimeout(prompt, timeout);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        lastError = this.handleError(error);

        // 재시도 불가능한 에러인 경우 즉시 반환
        if (this.isNonRetryableError(lastError)) {
          return { success: false, error: lastError };
        }

        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < retryCount) {
          console.log(`[SajuAnalyzer] 재시도 ${attempt + 1}/${retryCount}...`);
          await this.delay(1000 * (attempt + 1)); // 점진적 대기
        }
      }
    }

    return {
      success: false,
      error: lastError ?? {
        code: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다',
      },
    };
  }

  /**
   * 타임아웃이 적용된 Gemini API 호출
   */
  private async callGeminiWithTimeout(
    prompt: string,
    timeout: number
  ): Promise<SajuAnalysisResult> {
    const model = getGeminiModel();

    // Promise.race를 사용한 타임아웃 구현
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, timeout);
    });

    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    try {
      const result = await Promise.race([generatePromise, timeoutPromise]);

      // 응답 텍스트 추출 및 JSON 파싱
      const responseText = result.response.text();
      const parsed = this.parseJsonResponse(responseText);

      return parsed;
    } catch (error) {
      throw error;
    }
  }

  /**
   * JSON 응답 파싱 및 검증
   */
  private parseJsonResponse(responseText: string): SajuAnalysisResult {
    try {
      // JSON 블록 추출 (마크다운 코드 블록 처리)
      let jsonString = responseText.trim();

      // ```json ... ``` 형태 처리
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonString);

      // 필수 필드 존재 여부 검증
      const requiredFields = [
        'summary',
        'personality',
        'wealth',
        'love',
        'career',
        'health',
        'yearly_flow',
        'classical_references',
      ];

      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`필수 필드 누락: ${field}`);
        }
      }

      return parsed as SajuAnalysisResult;
    } catch (error) {
      throw new Error(
        `JSON 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 입력 데이터 유효성 검사
   */
  private validateInput(input: GeminiAnalysisInput): GeminiApiError | null {
    if (!input.pillars) {
      return {
        code: 'INVALID_INPUT',
        message: '사주 정보(pillars)가 필요합니다',
      };
    }

    const pillars = input.pillars;
    const requiredPillars = ['year', 'month', 'day', 'hour'] as const;

    for (const pillar of requiredPillars) {
      if (!(pillar in pillars)) {
        return {
          code: 'INVALID_INPUT',
          message: `${pillar} 기둥 정보가 누락되었습니다`,
        };
      }

      const p = pillars[pillar];
      if (!p.stem || !p.branch) {
        return {
          code: 'INVALID_INPUT',
          message: `${pillar} 기둥의 천간/지지 정보가 누락되었습니다`,
        };
      }
    }

    return null;
  }

  /**
   * 에러 핸들링 및 표준화
   */
  private handleError(error: unknown): GeminiApiError {
    if (error instanceof Error) {
      // 타임아웃
      if (error.message === 'TIMEOUT') {
        return {
          code: 'TIMEOUT',
          message: 'AI 분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        };
      }

      // Gemini API 에러
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

      if (error.message.includes('not found') || error.message.includes('404')) {
        return {
          code: 'MODEL_NOT_FOUND',
          message: 'AI 모델을 찾을 수 없습니다. 관리자에게 문의해주세요.',
        };
      }

      return {
        code: 'API_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다',
    };
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
 * 기본 SajuAnalyzer 인스턴스
 * API 라우트에서 직접 사용 가능
 */
export const sajuAnalyzer = new SajuAnalyzer();
