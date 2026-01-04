/**
 * Stripe 클라이언트 설정
 * - 서버: stripe (Node.js SDK)
 * - 클라이언트: @stripe/stripe-js (브라우저 SDK)
 */
import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

/**
 * 서버 사이드 Stripe 클라이언트
 * API 라우트에서 사용
 * 빌드 시 환경 변수가 없을 수 있으므로 lazy initialization 사용
 */
let _stripe: Stripe | null = null;

export const getStripeServer = (): Stripe => {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY 환경 변수가 설정되지 않았습니다');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
};

/**
 * 클라이언트 사이드 Stripe Promise
 * 결제 페이지에서 사용
 */
let stripePromise: Promise<StripeClient | null> | null = null;

export const getStripe = (): Promise<StripeClient | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

/**
 * 크레딧 패키지 정의
 */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // USD cents
  bonus?: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: '스타터',
    credits: 50,
    price: 500, // $5.00
  },
  {
    id: 'popular',
    name: '인기',
    credits: 100,
    price: 1000, // $10.00
    bonus: 10,
    popular: true,
  },
  {
    id: 'premium',
    name: '프리미엄',
    credits: 300,
    price: 3000, // $30.00
    bonus: 50,
  },
];

/**
 * 서비스별 크레딧 비용
 */
export const SERVICE_CREDITS = {
  fullAnalysis: 50, // 전체 사주 분석
  yearlyAnalysis: 30, // 신년 사주 분석
  compatibility: 50, // 궁합 분석
  question: 10, // AI 추가 질문
  sectionReanalysis: 5, // 섹션 재분석 (personality, aptitude, fortune)
  profileReport: 50, // 프로필 리포트 생성
} as const;

/**
 * 재분석 가능한 섹션 목록
 */
export const REANALYZABLE_SECTIONS = ['personality', 'aptitude', 'fortune'] as const;
export type ReanalyzableSection = (typeof REANALYZABLE_SECTIONS)[number];
