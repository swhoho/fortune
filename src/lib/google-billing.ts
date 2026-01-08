/**
 * Google Play Billing 클라이언트
 * - Capacitor 네이티브 앱에서만 작동
 * - 웹에서는 PortOne 결제 사용
 */
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import type { CreditPackage } from './stripe';

/**
 * Google Play 상품 ID 매핑
 * Google Play Console에 등록할 상품 ID
 */
export const GOOGLE_PRODUCT_IDS = {
  basic: 'credits_30',
  starter: 'credits_50',
  popular: 'credits_100',
  premium: 'credits_200',
} as const;

/**
 * 상품별 크레딧 수량 (보너스 포함)
 */
export const GOOGLE_CREDIT_AMOUNTS: Record<string, number> = {
  credits_30: 30,
  credits_50: 50,
  credits_100: 110, // 100 + 10 보너스
  credits_200: 230, // 200 + 30 보너스
};

/**
 * 네이티브 앱 여부 확인
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Android 플랫폼 여부 확인
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Google Play Billing 지원 여부 확인
 */
export async function isBillingSupported(): Promise<boolean> {
  if (!isAndroid()) return false;

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    return isBillingSupported;
  } catch {
    return false;
  }
}

/**
 * Google Play 상품 정보 조회
 */
export async function getGoogleProducts(packageIds: string[]): Promise<
  Array<{
    productId: string;
    title: string;
    description: string;
    price: string;
    priceAmountMicros: number;
    priceCurrencyCode: string;
  }>
> {
  if (!isAndroid()) {
    throw new Error('Android 전용 기능입니다');
  }

  const products = [];

  for (const id of packageIds) {
    const productId = GOOGLE_PRODUCT_IDS[id as keyof typeof GOOGLE_PRODUCT_IDS];
    if (!productId) continue;

    try {
      const result = await NativePurchases.getProduct({
        productIdentifier: productId,
        productType: PURCHASE_TYPE.INAPP,
      });

      if (result.product) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const product = result.product as any;
        products.push({
          productId: product.productId || product.id || productId,
          title: product.title,
          description: product.description,
          price: product.priceString,
          priceAmountMicros: product.priceAmountMicros,
          priceCurrencyCode: product.priceCurrencyCode,
        });
      }
    } catch (err) {
      console.error(`상품 조회 실패: ${productId}`, err);
    }
  }

  return products;
}

/**
 * Google Play 결제 실행
 */
export async function purchaseGoogleCredits(
  packageInfo: CreditPackage,
  userId: string
): Promise<{
  success: boolean;
  purchaseToken?: string;
  orderId?: string;
  error?: string;
}> {
  if (!isAndroid()) {
    return { success: false, error: 'Android 전용 기능입니다' };
  }

  const productId = GOOGLE_PRODUCT_IDS[packageInfo.id as keyof typeof GOOGLE_PRODUCT_IDS];
  if (!productId) {
    return { success: false, error: '유효하지 않은 상품입니다' };
  }

  try {
    // 결제 실행
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
    });

    if (!result.purchaseToken) {
      return { success: false, error: '결제가 완료되지 않았습니다' };
    }

    // 서버에서 구매 검증
    const verifyResult = await verifyGooglePurchase({
      purchaseToken: result.purchaseToken,
      productId,
      userId,
      orderId: result.orderId || '',
    });

    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || '구매 검증 실패' };
    }

    return {
      success: true,
      purchaseToken: result.purchaseToken,
      orderId: result.orderId,
    };
  } catch (err) {
    console.error('Google Play 결제 오류:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다',
    };
  }
}

/**
 * 서버에서 Google Play 구매 검증
 */
async function verifyGooglePurchase(params: {
  purchaseToken: string;
  productId: string;
  userId: string;
  orderId: string;
}): Promise<{ success: boolean; credits?: number; error?: string }> {
  try {
    const response = await fetch('/api/payment/google/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || '검증 실패' };
    }

    return { success: true, credits: data.credits };
  } catch (err) {
    console.error('구매 검증 API 오류:', err);
    return { success: false, error: '서버 통신 오류' };
  }
}

/**
 * 미완료 구매 복원
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  restoredCount: number;
  error?: string;
}> {
  if (!isAndroid()) {
    return { success: false, restoredCount: 0, error: 'Android 전용 기능입니다' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await NativePurchases.restorePurchases()) as any;
    return {
      success: true,
      restoredCount: result?.purchases?.length || 0,
    };
  } catch (err) {
    console.error('구매 복원 오류:', err);
    return {
      success: false,
      restoredCount: 0,
      error: err instanceof Error ? err.message : '구매 복원 중 오류가 발생했습니다',
    };
  }
}
