/**
 * PortOne V2 결제 설정
 * - 클라이언트: @portone/browser-sdk
 * - 서버: REST API (결제 검증)
 */

/**
 * 크레딧 패키지 정의 (KRW)
 */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // KRW
  bonus?: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'basic',
    name: '베이직',
    credits: 30,
    price: 3000, // ₩3,000
  },
  {
    id: 'starter',
    name: '스타터',
    credits: 50,
    price: 5000, // ₩5,000
  },
  {
    id: 'popular',
    name: '인기',
    credits: 100,
    price: 10000, // ₩10,000
    bonus: 10,
    popular: true,
  },
  {
    id: 'premium',
    name: '프리미엄',
    credits: 200,
    price: 20000, // ₩20,000
    bonus: 30,
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

/**
 * PortOne 설정
 */
export const PORTONE_CONFIG = {
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '',
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '',
};

/**
 * 결제 ID 생성 (유니크)
 */
export function generatePaymentId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `payment-${timestamp}-${random}`;
}

/**
 * 패키지 ID로 패키지 찾기
 */
export function getPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
}

/**
 * 포트원 결제 검증 API 호출 (서버 사이드)
 */
export async function verifyPaymentWithPortOne(paymentId: string): Promise<{
  status: string;
  amount: { total: number };
  orderName: string;
  customData?: string;
} | null> {
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiSecret) {
    console.error('PORTONE_API_SECRET is not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PortOne API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to verify payment with PortOne:', error);
    return null;
  }
}
