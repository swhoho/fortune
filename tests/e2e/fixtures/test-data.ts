/**
 * E2E 테스트용 데이터
 */

/** 테스트용 사주 입력 데이터 */
export const TEST_SAJU_INPUT = {
  // 양력 1990년 5월 15일 14시 30분 (GMT+9)
  valid: {
    year: '1990',
    month: '5',
    day: '15',
    hour: '14',
    minute: '30',
    isLunar: false,
    timezone: 'GMT+9',
    gender: 'male' as const,
  },
  // 음력 입력
  lunar: {
    year: '1990',
    month: '4',
    day: '21',
    hour: '14',
    minute: '30',
    isLunar: true,
    timezone: 'GMT+9',
    gender: 'female' as const,
  },
  // 잘못된 날짜 (2월 30일)
  invalid: {
    year: '1990',
    month: '2',
    day: '30',
    hour: '14',
    minute: '30',
    isLunar: false,
    timezone: 'GMT+9',
    gender: 'male' as const,
  },
}

/** 테스트용 사주 팔자 데이터 (만세력 계산 결과) */
export const TEST_PILLARS = {
  year: { stem: '庚', branch: '午', element: '金', stemElement: '금', branchElement: '화' },
  month: { stem: '辛', branch: '巳', element: '金', stemElement: '금', branchElement: '화' },
  day: { stem: '壬', branch: '申', element: '水', stemElement: '수', branchElement: '금' },
  hour: { stem: '丁', branch: '未', element: '火', stemElement: '화', branchElement: '토' },
}

/** Stripe 테스트 카드 */
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
}

/** 크레딧 패키지 */
export const CREDIT_PACKAGES = {
  starter: { id: 'starter', credits: 50, price: 5.0 },
  popular: { id: 'popular', credits: 110, price: 10.0 },
  premium: { id: 'premium', credits: 350, price: 30.0 },
}

/** 테스트 사용자 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456',
  name: '테스트 사용자',
}
