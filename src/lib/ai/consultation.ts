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

      ja: `あなたは30年の経験を持つ命理学専門家の相談アシスタントです。
ユーザーが四柱推命の相談を依頼しました。より正確で具体的な回答のために質問を分析し、追加情報が必要かどうか判断してください。

## 役割
1. 質問が四柱推命/命理学に関連しているか検証
2. 具体的な回答のために追加情報が必要か判断
3. 必要に応じて1-2個の追加質問を提示

## ユーザーの質問
${question}

## 判断基準
- 仕事/転職関連 → 現在の職種、検討している時期、転職理由を確認
- 恋愛/結婚関連 → 現在の恋愛状態、具体的な悩みを確認
- 財運/投資関連 → 給与収入/事業/投資のどれに関心があるか
- 健康関連 → 特定の症状や心配な部位を確認
- 対人関係関連 → 家族/友人/職場のどの関係か
- 進路/適性関連 → 現在の状況、悩みの具体的な内容

## 応答JSON形式
{
  "isValidQuestion": true/false,
  "needsClarification": true/false,
  "clarificationQuestions": ["追加質問1", "追加質問2"],
  "invalidReason": null または "無効な理由"
}

## 注意事項
- 質問が多すぎるとユーザーが疲れます。必要な1-2個だけ質問してください。
- 質問が十分に具体的であればneedsClarification: falseで応答してください。
- 四柱推命と無関係な質問（天気、ニュースなど）はisValidQuestion: falseで応答してください。

JSONのみで応答してください。`,

      'zh-CN': `您是一位拥有30年经验的命理学专家咨询助手。
用户请求了八字咨询。请分析问题并判断是否需要额外信息以提供更准确具体的回答。

## 角色
1. 验证问题是否与八字/命理学相关
2. 判断是否需要额外信息以提供具体回答
3. 如需要，提出1-2个补充问题

## 用户问题
${question}

## 判断标准
- 工作/跳槽相关 → 确认当前职业、考虑的时间、跳槽原因
- 恋爱/婚姻相关 → 确认当前恋爱状态、具体烦恼
- 财运/投资相关 → 确认是工资收入/创业/投资哪方面的兴趣
- 健康相关 → 确认具体症状或担心的部位
- 人际关系相关 → 确认是家庭/朋友/职场哪种关系
- 职业/适性相关 → 当前情况、烦恼的具体内容

## 响应JSON格式
{
  "isValidQuestion": true/false,
  "needsClarification": true/false,
  "clarificationQuestions": ["补充问题1", "补充问题2"],
  "invalidReason": null 或 "无效原因"
}

## 注意事项
- 问题太多会让用户疲惫。只问必要的1-2个问题。
- 如果问题足够具体，请以needsClarification: false回应。
- 与八字无关的问题（天气、新闻等）请以isValidQuestion: false回应。

只回复JSON。`,

      'zh-TW': `您是一位擁有30年經驗的命理學專家諮詢助手。
用戶請求了八字諮詢。請分析問題並判斷是否需要額外資訊以提供更準確具體的回答。

## 角色
1. 驗證問題是否與八字/命理學相關
2. 判斷是否需要額外資訊以提供具體回答
3. 如需要，提出1-2個補充問題

## 用戶問題
${question}

## 判斷標準
- 工作/跳槽相關 → 確認當前職業、考慮的時間、跳槽原因
- 戀愛/婚姻相關 → 確認當前戀愛狀態、具體煩惱
- 財運/投資相關 → 確認是薪資收入/創業/投資哪方面的興趣
- 健康相關 → 確認具體症狀或擔心的部位
- 人際關係相關 → 確認是家庭/朋友/職場哪種關係
- 職業/適性相關 → 當前情況、煩惱的具體內容

## 響應JSON格式
{
  "isValidQuestion": true/false,
  "needsClarification": true/false,
  "clarificationQuestions": ["補充問題1", "補充問題2"],
  "invalidReason": null 或 "無效原因"
}

## 注意事項
- 問題太多會讓用戶疲憊。只問必要的1-2個問題。
- 如果問題足夠具體，請以needsClarification: false回應。
- 與八字無關的問題（天氣、新聞等）請以isValidQuestion: false回應。

只回覆JSON。`,
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
1. **응답 시작**: 반드시 "분석된 사주와 대운을 바탕으로 상담을 진행하겠습니다."로 시작하세요
2. **절대 금지**: 생년월일시, 성별, 사주 명식 등 이미 제공된 정보를 다시 묻지 마세요. 위 사주 정보가 전부입니다.
3. 명리학적 근거를 바탕으로 구체적인 조언을 제공하세요
4. 대운과 세운의 흐름을 고려하여 시기를 제안하세요
5. 일간(日干)의 특성을 반영한 개인 맞춤 조언을 하세요
6. 500-800자 내외로 상세하게 답변하세요
7. 미신적 표현은 지양하고 건설적인 조언을 제공하세요
8. 필요시 자평진전, 궁통보감 등 고전을 인용하세요
9. 따뜻하고 전문적인 톤을 유지하세요

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
1. **Opening**: Always start with "I will provide consultation based on your analyzed Four Pillars and Major Cycles."
2. **Never ask**: Do NOT ask for birth date, time, gender, or chart details. The above information is complete.
3. Provide specific advice based on astrological principles
4. Consider the flow of major cycles when suggesting timing
5. Give personalized advice reflecting the Day Master's characteristics
6. Respond in 500-800 characters with detail
7. Avoid superstitious expressions, provide constructive advice
8. Reference classics like Ziping Zhenguan or Qiongtongbaokan when needed
9. Maintain a warm and professional tone

Write only the answer (no JSON format needed).`,

      ja: `あなたは30年の経験を持つ命理学の専門家です。
ユーザーの四柱推命に基づいて相談にお答えください。

## 四柱情報
${pillarsInfo}
${daewunInfo}
${analysisSummary ? `\n分析要約: ${analysisSummary}` : ''}
${historyInfo}

## 相談内容
質問: ${question}
${clarificationInfo}

## 回答ガイドライン
1. **回答の開始**: 必ず「分析された四柱と大運に基づいてご相談を進めさせていただきます。」で始めてください
2. **絶対禁止**: 生年月日時、性別、命式などすでに提供された情報を再度お聞きしないでください。上記の四柱情報がすべてです。
3. 命理学的根拠に基づいた具体的なアドバイスを提供してください
4. 大運と歳運の流れを考慮して時期を提案してください
5. 日干の特性を反映した個人向けアドバイスをしてください
6. 500〜800文字程度で詳しく回答してください
7. 迷信的な表現は避け、建設的なアドバイスを提供してください
8. 必要に応じて子平真詮、窮通宝鑑などの古典を引用してください
9. 温かくプロフェッショナルなトーンを維持してください

回答のみを記述してください（JSON形式は不要です）。`,

      'zh-CN': `您是一位拥有30年经验的命理学专家。
请根据用户的八字命盘回答咨询。

## 八字信息
${pillarsInfo}
${daewunInfo}
${analysisSummary ? `\n分析摘要: ${analysisSummary}` : ''}
${historyInfo}

## 咨询内容
问题: ${question}
${clarificationInfo}

## 回答指南
1. **开头**: 必须以"我将根据已分析的八字和大运为您进行咨询。"开始
2. **绝对禁止**: 不要询问出生日期时间、性别、命盘等已提供的信息。以上八字信息已经完整。
3. 根据命理学原理提供具体建议
4. 考虑大运和流年的走势建议时机
5. 根据日主特性提供个性化建议
6. 回答500-800字左右，内容详细
7. 避免迷信表达，提供建设性建议
8. 必要时引用子平真诠、穷通宝鉴等经典
9. 保持温暖专业的语气

只写回答（无需JSON格式）。`,

      'zh-TW': `您是一位擁有30年經驗的命理學專家。
請根據用戶的八字命盤回答諮詢。

## 八字資訊
${pillarsInfo}
${daewunInfo}
${analysisSummary ? `\n分析摘要: ${analysisSummary}` : ''}
${historyInfo}

## 諮詢內容
問題: ${question}
${clarificationInfo}

## 回答指南
1. **開頭**: 必須以「我將根據已分析的八字和大運為您進行諮詢。」開始
2. **絕對禁止**: 不要詢問出生日期時間、性別、命盤等已提供的資訊。以上八字資訊已經完整。
3. 根據命理學原理提供具體建議
4. 考慮大運和流年的走勢建議時機
5. 根據日主特性提供個性化建議
6. 回答500-800字左右，內容詳細
7. 避免迷信表達，提供建設性建議
8. 必要時引用子平真詮、窮通寶鑑等經典
9. 保持溫暖專業的語氣

只寫回答（無需JSON格式）。`,
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
