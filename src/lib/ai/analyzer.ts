/**
 * SajuAnalyzer 클래스
 * Gemini AI를 활용한 사주 분석 메인 로직
 * Python API에서 프롬프트를 fetch하고, 실패 시 기존 prompts.ts 폴백
 */
import { getGeminiModel } from './gemini';
import { generateAnalysisPrompt, generateFollowUpPrompt } from './prompts';
import type {
  GeminiAnalysisInput,
  SajuAnalysisResult,
  GeminiApiError,
  AnalysisResponse,
  AnalysisOptions,
  FollowUpInput,
  FollowUpResponse,
  YearlyAnalysisInput,
  YearlyAnalysisResult,
  YearlyAnalysisResponse,
} from './types';

/**
 * Python API 프롬프트 빌드 응답 타입
 */
interface PromptBuildResponse {
  systemPrompt: string;
  userPrompt: string;
  outputSchema: Record<string, unknown>;
  metadata: {
    version: string;
    language: string;
    includedModules: string[];
    generatedAt: string;
  };
}

/**
 * SajuAnalyzer 클래스
 * 사주 분석의 핵심 비즈니스 로직 담당
 */
export class SajuAnalyzer {
  private defaultTimeout: number;
  private defaultRetryCount: number;
  private pythonApiUrl: string;

  constructor(options?: AnalysisOptions) {
    this.defaultTimeout = options?.timeout ?? 30000;
    this.defaultRetryCount = options?.retryCount ?? 2;
    this.pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  }

  /**
   * Python API에서 프롬프트 빌드
   * 실패 시 null 반환 (폴백 사용)
   */
  private async fetchPrompt(input: GeminiAnalysisInput): Promise<PromptBuildResponse | null> {
    try {
      const response = await fetch(`${this.pythonApiUrl}/api/prompts/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: input.language || 'ko',
          pillars: input.pillars,
          daewun: input.daewun || [],
          focusArea: input.focusArea,
          question: input.question,
          options: {
            includeZiping: true,
            includeQiongtong: true,
            includeWestern: true, // 모든 언어에 적용
          },
        }),
      });

      if (!response.ok) {
        console.warn('[SajuAnalyzer] Python 프롬프트 API 실패, 폴백 사용');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('[SajuAnalyzer] Python 프롬프트 API 오류, 폴백 사용:', error);
      return null;
    }
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

    // Python API에서 프롬프트 fetch (실패 시 기존 prompts.ts 폴백)
    const promptResponse = await this.fetchPrompt(input);

    let prompt: string;
    if (promptResponse) {
      // Python 프롬프트 사용 (자평진전 + 궁통보감 + The Destiny Code)
      prompt = `${promptResponse.systemPrompt}\n\n${promptResponse.userPrompt}`;
      console.log(
        `[SajuAnalyzer] Python 프롬프트 사용 (v${promptResponse.metadata.version}, ${promptResponse.metadata.language})`
      );
    } else {
      // 폴백: 기존 prompts.ts
      prompt = generateAnalysisPrompt(input);
      console.log('[SajuAnalyzer] 폴백 프롬프트 사용');
    }

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
   * 후속 질문 처리
   * @param input - 후속 질문 입력 (분석ID, 질문, 이전 분석, 사주, 히스토리)
   * @param options - 분석 옵션 (타임아웃, 재시도)
   * @returns 텍스트 답변 또는 에러
   */
  async followUp(input: FollowUpInput, options?: AnalysisOptions): Promise<FollowUpResponse> {
    const timeout = options?.timeout ?? this.defaultTimeout;
    const retryCount = options?.retryCount ?? this.defaultRetryCount;

    // 입력 유효성 검사
    const validationError = this.validateFollowUpInput(input);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // 프롬프트 생성
    const prompt = generateFollowUpPrompt(input);

    // Gemini API 호출 (재시도 로직 포함)
    let lastError: GeminiApiError | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const answer = await this.callGeminiForTextWithTimeout(prompt, timeout);
        return {
          success: true,
          data: {
            answer,
            questionId: '', // API에서 실제 ID 할당
          },
        };
      } catch (error) {
        lastError = this.handleError(error);

        // 재시도 불가능한 에러인 경우 즉시 반환
        if (this.isNonRetryableError(lastError)) {
          return { success: false, error: lastError };
        }

        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < retryCount) {
          console.log(`[SajuAnalyzer] 후속 질문 재시도 ${attempt + 1}/${retryCount}...`);
          await this.delay(1000 * (attempt + 1));
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

  // ============================================
  // Task 20: 신년 분석
  // ============================================

  /**
   * Python API에서 신년 분석 프롬프트 빌드
   */
  private async fetchYearlyPrompt(input: YearlyAnalysisInput): Promise<PromptBuildResponse | null> {
    try {
      const response = await fetch(`${this.pythonApiUrl}/api/prompts/build/yearly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: input.year,
          language: input.language || 'ko',
          pillars: input.pillars,
          daewun: input.daewun || [],
          options: {
            includeZiping: true,
            includeQiongtong: true,
            includeWestern: true,
          },
        }),
      });

      if (!response.ok) {
        console.warn('[SajuAnalyzer] Python 신년 프롬프트 API 실패, 폴백 사용');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('[SajuAnalyzer] Python 신년 프롬프트 API 오류:', error);
      return null;
    }
  }

  /**
   * 신년 분석 실행
   * @param input - 신년 분석 입력 데이터 (연도, 사주, 대운 등)
   * @param options - 분석 옵션 (타임아웃, 재시도)
   * @returns 신년 분석 결과 또는 에러
   */
  async analyzeYearly(
    input: YearlyAnalysisInput,
    options?: AnalysisOptions
  ): Promise<YearlyAnalysisResponse> {
    const timeout = options?.timeout ?? 60000; // 신년 분석은 60초
    const retryCount = options?.retryCount ?? this.defaultRetryCount;

    // 입력 유효성 검사
    const validationError = this.validateYearlyInput(input);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // Python API에서 프롬프트 fetch
    const promptResponse = await this.fetchYearlyPrompt(input);

    let prompt: string;
    if (promptResponse) {
      prompt = `${promptResponse.systemPrompt}\n\n${promptResponse.userPrompt}`;
      console.log(
        `[SajuAnalyzer] 신년 분석 Python 프롬프트 사용 (v${promptResponse.metadata.version}, ${input.year}년)`
      );
    } else {
      // 폴백: 기본 프롬프트 생성
      prompt = this.generateYearlyFallbackPrompt(input);
      console.log('[SajuAnalyzer] 신년 분석 폴백 프롬프트 사용');
    }

    // Gemini API 호출 (재시도 로직 포함)
    let lastError: GeminiApiError | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await this.callGeminiForYearlyWithTimeout(prompt, timeout);
        return {
          success: true,
          data: {
            analysisId: '', // API에서 실제 ID 할당
            year: input.year,
            result,
            creditsUsed: 30,
            remainingCredits: 0, // API에서 실제 값 할당
          },
        };
      } catch (error) {
        lastError = this.handleError(error);

        if (this.isNonRetryableError(lastError)) {
          return { success: false, error: lastError };
        }

        if (attempt < retryCount) {
          console.log(`[SajuAnalyzer] 신년 분석 재시도 ${attempt + 1}/${retryCount}...`);
          await this.delay(1000 * (attempt + 1));
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
   * 신년 분석 입력 유효성 검사
   */
  private validateYearlyInput(input: YearlyAnalysisInput): GeminiApiError | null {
    if (!input.year || input.year < 2020 || input.year > 2100) {
      return {
        code: 'INVALID_INPUT',
        message: '유효한 연도를 입력해주세요 (2020-2100)',
      };
    }

    if (!input.pillars) {
      return {
        code: 'INVALID_INPUT',
        message: '사주 정보가 필요합니다',
      };
    }

    return null;
  }

  /**
   * 신년 분석용 Gemini API 호출
   */
  private async callGeminiForYearlyWithTimeout(
    prompt: string,
    timeout: number
  ): Promise<YearlyAnalysisResult> {
    const model = getGeminiModel();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, timeout);
    });

    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = result.response.text();

    return this.parseYearlyJsonResponse(responseText);
  }

  /**
   * 신년 분석 JSON 응답 파싱
   */
  private parseYearlyJsonResponse(responseText: string): YearlyAnalysisResult {
    try {
      let jsonString = responseText.trim();

      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonString);

      // 필수 필드 검증
      const requiredFields = [
        'year',
        'summary',
        'yearlyTheme',
        'overallScore',
        'monthlyFortunes',
        'quarterlyHighlights',
        'keyDates',
        'yearlyAdvice',
        'classicalReferences',
      ];

      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`필수 필드 누락: ${field}`);
        }
      }

      // monthlyFortunes가 12개인지 확인
      if (!Array.isArray(parsed.monthlyFortunes) || parsed.monthlyFortunes.length !== 12) {
        throw new Error('monthlyFortunes는 12개월 모두 필요합니다');
      }

      return parsed as YearlyAnalysisResult;
    } catch (error) {
      throw new Error(
        `신년 분석 JSON 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 신년 분석 폴백 프롬프트 생성
   */
  private generateYearlyFallbackPrompt(input: YearlyAnalysisInput): string {
    const { year, pillars, language = 'ko' } = input;

    const langPrompts = {
      ko: `당신은 30년 경력의 명리학 전문가입니다.
아래 사주를 바탕으로 ${year}년 운세를 월별로 상세 분석해주세요.

사주 팔자:
- 연주: ${pillars.year.stem}${pillars.year.branch}
- 월주: ${pillars.month.stem}${pillars.month.branch}
- 일주: ${pillars.day.stem}${pillars.day.branch}
- 시주: ${pillars.hour.stem}${pillars.hour.branch}

12개월 각각에 대해 3-5개의 길일과 1-3개의 흉일을 선정하고,
분기별 하이라이트, 연중 핵심 날짜, 분야별 연간 조언을 포함해주세요.
JSON 형식으로 응답해주세요.`,
      en: `You are a fortune-telling expert with 30 years of experience.
Based on the chart below, provide a detailed month-by-month analysis for ${year}.

Four Pillars:
- Year: ${pillars.year.stem}${pillars.year.branch}
- Month: ${pillars.month.stem}${pillars.month.branch}
- Day: ${pillars.day.stem}${pillars.day.branch}
- Hour: ${pillars.hour.stem}${pillars.hour.branch}

For each of the 12 months, select 3-5 lucky days and 1-3 unlucky days.
Include quarterly highlights, key dates, and yearly advice by category.
Respond in JSON format.`,
    };

    return langPrompts[language as keyof typeof langPrompts] || langPrompts.ko;
  }

  /**
   * 후속 질문 입력 유효성 검사
   */
  private validateFollowUpInput(input: FollowUpInput): GeminiApiError | null {
    if (!input.question || input.question.trim() === '') {
      return {
        code: 'INVALID_INPUT',
        message: '질문을 입력해주세요',
      };
    }

    if (input.question.length > 500) {
      return {
        code: 'INVALID_INPUT',
        message: '질문은 500자 이내로 입력해주세요',
      };
    }

    if (!input.previousAnalysis) {
      return {
        code: 'INVALID_INPUT',
        message: '이전 분석 결과가 필요합니다',
      };
    }

    if (!input.pillars) {
      return {
        code: 'INVALID_INPUT',
        message: '사주 정보가 필요합니다',
      };
    }

    return null;
  }

  /**
   * 텍스트 응답용 Gemini API 호출 (JSON 파싱 없음)
   */
  private async callGeminiForTextWithTimeout(prompt: string, timeout: number): Promise<string> {
    const model = getGeminiModel();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, timeout);
    });

    const generatePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = result.response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('AI 응답이 비어있습니다');
    }

    return responseText.trim();
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
