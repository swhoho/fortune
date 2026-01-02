/**
 * 오행(五行) 색상 시스템
 * claude.md 및 PRD 기반
 */

/** 오행 배경 색상 */
export const ELEMENT_COLORS = {
  木: '#4ade80', // green-400
  火: '#ef4444', // red-500
  土: '#f59e0b', // amber-500
  金: '#e5e7eb', // gray-200
  水: '#1e3a8a', // blue-900
} as const;

/** 오행 텍스트 색상 (배경 대비) */
export const ELEMENT_TEXT_COLORS = {
  木: '#1a1a1a',
  火: '#ffffff',
  土: '#1a1a1a',
  金: '#1a1a1a',
  水: '#ffffff',
} as const;

/** 오행 Tailwind 클래스 */
export const ELEMENT_BG_CLASSES = {
  木: 'bg-green-400',
  火: 'bg-red-500',
  土: 'bg-amber-500',
  金: 'bg-gray-200',
  水: 'bg-blue-900',
} as const;

/** 오행 한글 이름 */
export const ELEMENT_NAMES = {
  木: '목(木)',
  火: '화(火)',
  土: '토(土)',
  金: '금(金)',
  水: '수(水)',
} as const;

/** 브랜드 색상 */
export const BRAND_COLORS = {
  primary: '#d4af37', // 금색
  secondary: '#1a1a1a', // 먹색
  background: '#f8f8f8',
} as const;

/** 명리학 팁 (로딩 화면용) */
export const FORTUNE_TIPS = [
  '자평진전은 청나라 심효첨이 쓴 명리학의 바이블입니다.',
  '사주에서 일간(日干)은 나 자신을 나타냅니다.',
  '오행의 균형이 좋을수록 안정적인 삶을 살 수 있습니다.',
  '대운은 10년 단위로 인생의 큰 흐름을 나타냅니다.',
  '용신(用神)은 사주에서 가장 필요한 오행입니다.',
  '십성(十星)은 사회적 관계와 역할을 나타냅니다.',
  '지장간은 지지 속에 숨겨진 천간의 기운입니다.',
  '천간은 하늘의 기운, 지지는 땅의 기운을 의미합니다.',
  '년주는 조상과 유년기, 월주는 부모와 청년기를 나타냅니다.',
  '일주는 본인과 배우자, 시주는 자녀와 노년기를 나타냅니다.',
];

export type ElementKey = keyof typeof ELEMENT_COLORS;
