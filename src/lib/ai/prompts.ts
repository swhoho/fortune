/**
 * Gemini AI 프롬프트 생성
 * docs/fortune_engine.md 섹션 4 참조
 */
import type { GeminiAnalysisInput } from './types';

/**
 * 시스템 프롬프트 (역할 정의 + 분석 원칙)
 */
export const SYSTEM_PROMPT = `당신은 30년 경력의 명리학 전문가입니다.
자평진전(子平真詮), 궁통보감(窮通寶鑑) 등 고전을 깊이 연구했으며,
현대적이고 논리적인 해석을 제공합니다.

## 분석 원칙
1. 일간(日干)을 중심으로 분석합니다
2. 격국(格局)을 먼저 판단합니다
3. 용신(用神)과 희신(喜神)을 도출합니다
4. 대운과 세운의 흐름을 분석합니다
5. 구체적이고 실용적인 조언을 제공합니다

## 응답 규칙
- 반드시 지정된 JSON 스키마를 따릅니다
- 모든 내용은 한국어로 작성합니다
- 점수(score)는 0-100 사이 정수입니다
- 고전 인용 시 출처를 명확히 합니다
- 미신적이거나 부정적인 표현을 피합니다
- 건설적이고 희망적인 메시지를 전달합니다`;

/**
 * 출력 JSON 스키마 정의 (Gemini responseSchema용)
 */
export const OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '사주 분석 한 줄 요약 (50자 이내)',
    },
    personality: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '성격 분석 제목' },
        content: { type: 'string', description: '성격 분석 상세 내용 (500자)' },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: '성격 키워드 3-5개',
        },
      },
      required: ['title', 'content', 'keywords'],
    },
    wealth: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        score: { type: 'integer', minimum: 0, maximum: 100 },
        advice: { type: 'string' },
      },
      required: ['title', 'content', 'score', 'advice'],
    },
    love: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        score: { type: 'integer', minimum: 0, maximum: 100 },
        advice: { type: 'string' },
      },
      required: ['title', 'content', 'score', 'advice'],
    },
    career: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        score: { type: 'integer', minimum: 0, maximum: 100 },
        advice: { type: 'string' },
      },
      required: ['title', 'content', 'score', 'advice'],
    },
    health: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        score: { type: 'integer', minimum: 0, maximum: 100 },
        advice: { type: 'string' },
      },
      required: ['title', 'content', 'score', 'advice'],
    },
    yearly_flow: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          year: { type: 'integer' },
          theme: { type: 'string' },
          score: { type: 'integer', minimum: 0, maximum: 100 },
          advice: { type: 'string' },
        },
        required: ['year', 'theme', 'score', 'advice'],
      },
      description: '향후 5년간 연도별 운세',
    },
    classical_references: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string', description: '고전 출처 (자평진전, 궁통보감 등)' },
          quote: { type: 'string', description: '원문 인용' },
          interpretation: { type: 'string', description: '현대적 해석' },
        },
        required: ['source', 'quote', 'interpretation'],
      },
      description: '관련 고전 인용 1-3개',
    },
  },
  required: [
    'summary',
    'personality',
    'wealth',
    'love',
    'career',
    'health',
    'yearly_flow',
    'classical_references',
  ],
} as const;

/**
 * 집중 영역 한글 매핑
 */
const FOCUS_AREA_LABELS: Record<string, string> = {
  wealth: '재물운',
  love: '연애운',
  career: '직장운',
  health: '건강운',
  overall: '종합운',
};

/**
 * 사주 정보를 문자열로 변환
 */
const formatPillars = (pillars: GeminiAnalysisInput['pillars']): string => {
  return `
## 사주 팔자
- 연주(年柱): ${pillars.year.stem}${pillars.year.branch} (${pillars.year.element})
- 월주(月柱): ${pillars.month.stem}${pillars.month.branch} (${pillars.month.element})
- 일주(日柱): ${pillars.day.stem}${pillars.day.branch} (${pillars.day.element}) ← 일간(나)
- 시주(時柱): ${pillars.hour.stem}${pillars.hour.branch} (${pillars.hour.element})

### 일간 분석
일간(나): ${pillars.day.stem} (${pillars.day.stemElement})
`;
};

/**
 * 대운 정보를 문자열로 변환
 */
const formatDaewun = (daewun?: GeminiAnalysisInput['daewun']): string => {
  if (!daewun || daewun.length === 0) return '';

  const daewunList = daewun
    .map((d) => `  - ${d.startAge}~${d.endAge}세: ${d.stem}${d.branch}`)
    .join('\n');

  return `
## 대운 흐름
${daewunList}
`;
};

/**
 * 집중 영역 및 질문 포맷
 */
const formatFocusAndQuestion = (focusArea?: string, question?: string): string => {
  let result = '';

  if (focusArea) {
    result += `\n## 집중 분석 영역: ${FOCUS_AREA_LABELS[focusArea] || focusArea}`;
    result += `\n이 영역을 특히 상세하게 분석해주세요.`;
  }

  if (question) {
    result += `\n\n## 사용자 질문\n${question}`;
    result += `\n이 질문에 대한 답변을 분석에 포함해주세요.`;
  }

  return result;
};

/**
 * 전체 프롬프트 생성 함수
 * @param input - 사주 분석 입력 데이터
 * @returns 완성된 프롬프트 문자열
 */
export const generateAnalysisPrompt = (input: GeminiAnalysisInput): string => {
  const pillarsSection = formatPillars(input.pillars);
  const daewunSection = formatDaewun(input.daewun);
  const focusSection = formatFocusAndQuestion(input.focusArea, input.question);

  const currentYear = new Date().getFullYear();

  return `${SYSTEM_PROMPT}

${pillarsSection}
${daewunSection}
${focusSection}

## 분석 요청
위 사주를 분석하여 다음 JSON 스키마에 맞게 응답해주세요.

### 필수 포함 사항
1. summary: 사주의 핵심 특징을 50자 이내로 요약
2. personality: 성격과 기질 분석 (키워드 3-5개 포함)
3. wealth, love, career, health: 각 영역별 분석과 점수(0-100), 조언
4. yearly_flow: ${currentYear}년부터 5년간 연도별 운세 (매년 테마, 점수, 조언)
5. classical_references: 관련 고전 인용 1-3개 (자평진전, 궁통보감 등)

응답은 반드시 유효한 JSON 형식이어야 합니다.
`;
};
