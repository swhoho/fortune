/**
 * Gemini API 디버그 테스트
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiDirect() {
  console.log('🔧 Gemini API 직접 테스트...\n');

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  console.log(`API 키: ${apiKey?.slice(0, 10)}...${apiKey?.slice(-4)}`);
  console.log(`모델: gemini-3-pro-preview\n`);

  const genAI = new GoogleGenerativeAI(apiKey!);

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
    });

    console.log('📤 간단한 테스트 요청 전송...');
    const result = await model.generateContent('안녕하세요. 테스트입니다. "성공"이라고만 답해주세요.');

    console.log('✅ 응답 수신!');
    console.log('응답:', result.response.text());
  } catch (error: unknown) {
    console.log('❌ 에러 발생!');
    if (error instanceof Error) {
      console.log('에러 타입:', error.constructor.name);
      console.log('에러 메시지:', error.message);
      console.log('전체 에러:', JSON.stringify(error, null, 2));
    }
  }
}

testGeminiDirect();
