/**
 * E2E 테스트용 테스트 데이터
 */

/** 사주 입력 테스트 데이터 */
export const TEST_SAJU_INPUT = {
  valid: {
    year: '1990',
    month: '05',
    day: '15',
    hour: '14',
    minute: '30',
  },
  lunar: {
    year: '1985',
    month: '03',
    day: '20',
  },
  invalid: {
    year: '2030',
    month: '13',
    day: '32',
  },
}

/** 크레딧 패키지 */
export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    credits: 50,
    price: 500, // cents
    label: '50C',
  },
  popular: {
    id: 'popular',
    credits: 100,
    price: 1000,
    label: '100C',
  },
  premium: {
    id: 'premium',
    credits: 300,
    price: 3000,
    label: '300C',
  },
}

/** Stripe 테스트 카드 번호 */
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient: '4000000000009995',
}
