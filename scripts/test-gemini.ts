/**
 * Gemini API 테스트 스크립트
 * 실행: npx tsx scripts/test-gemini.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { SajuAnalyzer } from '../src/lib/ai/analyzer';
import type { GeminiAnalysisInput } from '../src/lib/ai/types';

async function testGemini() {
  console.log('🔮 Gemini API 테스트 시작...\n');

  // 테스트 사주 데이터 (1990년 5월 15일 14시, 남성)
  const testInput: GeminiAnalysisInput = {
    pillars: {
      year: {
        stem: '庚',
        branch: '午',
        element: '火',
        stemElement: '金',
        branchElement: '火',
      },
      month: {
        stem: '辛',
        branch: '巳',
        element: '火',
        stemElement: '金',
        branchElement: '火',
      },
      day: {
        stem: '甲',
        branch: '子',
        element: '水',
        stemElement: '木',
        branchElement: '水',
      },
      hour: {
        stem: '辛',
        branch: '未',
        element: '土',
        stemElement: '金',
        branchElement: '土',
      },
    },
    daewun: [
      { startAge: 1, endAge: 10, stem: '庚', branch: '辰' },
      { startAge: 11, endAge: 20, stem: '己', branch: '卯' },
      { startAge: 21, endAge: 30, stem: '戊', branch: '寅' },
      { startAge: 31, endAge: 40, stem: '丁', branch: '丑' },
    ],
    focusArea: 'overall',
    question: '2026년 운세와 커리어 방향이 궁금합니다.',
  };

  const analyzer = new SajuAnalyzer({ timeout: 60000 }); // 60초 타임아웃

  console.log('📤 요청 데이터:');
  console.log(`   일간: ${testInput.pillars.day.stem} (${testInput.pillars.day.stemElement})`);
  console.log(`   사주: ${testInput.pillars.year.stem}${testInput.pillars.year.branch} ${testInput.pillars.month.stem}${testInput.pillars.month.branch} ${testInput.pillars.day.stem}${testInput.pillars.day.branch} ${testInput.pillars.hour.stem}${testInput.pillars.hour.branch}`);
  console.log(`   질문: ${testInput.question}\n`);

  const startTime = Date.now();
  const result = await analyzer.analyze(testInput);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (result.success && result.data) {
    console.log(`✅ 분석 성공! (${elapsed}초)\n`);

    // 전체 응답 구조 확인
    console.log('📦 전체 응답 구조:');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`❌ 분석 실패 (${elapsed}초)`);
    console.log(`   에러 코드: ${result.error?.code}`);
    console.log(`   에러 메시지: ${result.error?.message}`);
    if (result.error?.details) {
      console.log(`   상세: ${JSON.stringify(result.error.details)}`);
    }
  }
}

testGemini().catch(console.error);
