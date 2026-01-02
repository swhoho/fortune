/**
 * Google Gemini AI 클라이언트 설정
 * Stripe 클라이언트(src/lib/stripe.ts) 패턴 참조
 */
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/** Gemini 클라이언트 싱글톤 */
let _genAI: GoogleGenerativeAI | null = null;
let _model: GenerativeModel | null = null;

/**
 * 모델 설정 상수
 * 모델: gemini-3-pro-preview (Gemini 3.0 Pro)
 */
export const GEMINI_CONFIG = {
  modelName: 'gemini-3-pro-preview',
  temperature: 0.7,
  maxOutputTokens: 8192,
  topP: 0.8,
  topK: 40,
} as const;

/**
 * Gemini AI 클라이언트 인스턴스 반환
 * lazy initialization 패턴 사용 (stripe.ts 참조)
 */
export const getGeminiClient = (): GoogleGenerativeAI => {
  if (!_genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY 환경 변수가 설정되지 않았습니다');
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
};

/**
 * Gemini 생성 모델 인스턴스 반환
 * JSON 출력을 위한 설정 포함
 */
export const getGeminiModel = (): GenerativeModel => {
  if (!_model) {
    const genAI = getGeminiClient();
    _model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.modelName,
      generationConfig: {
        temperature: GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
        topP: GEMINI_CONFIG.topP,
        topK: GEMINI_CONFIG.topK,
        responseMimeType: 'application/json',
      },
    });
  }
  return _model;
};

/**
 * Gemini 모델 재설정 (테스트용)
 */
export const resetGeminiModel = (): void => {
  _genAI = null;
  _model = null;
};
