/**
 * Google Play RTDN (Real-time Developer Notifications) 웹훅
 * POST /api/payment/google/webhook
 *
 * Cloud Pub/Sub에서 Push 방식으로 호출됨
 * 구독 갱신, 취소, 만료, 환불 등 모든 구독 이벤트 처리
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleSubscriptionNotification } from '@/lib/google-subscription-handler';

/** RTDN 알림 타입 (Google Play Billing) */
const SUBSCRIPTION_NOTIFICATION_TYPE = {
  RECOVERED: 1,        // 구독 복구 (ON_HOLD에서 결제 성공)
  RENEWED: 2,          // 구독 갱신 (월간 결제 완료)
  CANCELED: 3,         // 구독 취소 (사용자가 취소)
  PURCHASED: 4,        // 최초 구매 (이미 별도 구현됨)
  ON_HOLD: 5,          // 계정 보류 (결제 실패 후 유예 기간 종료)
  IN_GRACE_PERIOD: 6,  // 유예 기간 (결제 실패, 재시도 중)
  RESTARTED: 7,        // 구독 재시작 (취소 후 다시 활성화)
  PRICE_CHANGE_CONFIRMED: 8,  // 가격 변경 확인
  DEFERRED: 9,         // 구독 연기
  PAUSED: 10,          // 구독 일시정지
  PAUSE_SCHEDULE_CHANGED: 11, // 일시정지 일정 변경
  REVOKED: 12,         // 구독 취소/환불 (즉시 서비스 중단)
  EXPIRED: 13,         // 구독 만료
} as const;

/** Pub/Sub 메시지 구조 */
interface PubSubMessage {
  message: {
    data: string; // Base64 인코딩된 JSON
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

/** Google Play 개발자 알림 구조 */
interface DeveloperNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
  testNotification?: {
    version: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Pub/Sub 메시지 파싱
    const body: PubSubMessage = await request.json();

    if (!body.message?.data) {
      console.error('[Google Webhook] 유효하지 않은 Pub/Sub 메시지:', body);
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Base64 디코딩
    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const notification: DeveloperNotification = JSON.parse(decodedData);

    console.log('[Google Webhook] 알림 수신:', {
      messageId: body.message.messageId,
      packageName: notification.packageName,
      eventTime: notification.eventTimeMillis,
    });

    // 테스트 알림 처리 (Play Console에서 "테스트 알림 보내기" 클릭 시)
    if (notification.testNotification) {
      console.log('[Google Webhook] 테스트 알림 수신 - 연결 확인됨');
      return NextResponse.json({ success: true, type: 'test' });
    }

    // 일회성 상품 알림 (크레딧 구매) - 현재는 클라이언트에서 즉시 검증하므로 스킵
    if (notification.oneTimeProductNotification) {
      console.log('[Google Webhook] 일회성 상품 알림 - 스킵 (클라이언트에서 처리)');
      return NextResponse.json({ success: true, type: 'one_time_skipped' });
    }

    // 구독 알림 처리
    if (notification.subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } = notification.subscriptionNotification;

      console.log('[Google Webhook] 구독 알림:', {
        notificationType,
        subscriptionId,
        purchaseToken: purchaseToken.substring(0, 20) + '...',
      });

      // 최초 구매(4)는 클라이언트에서 이미 처리됨
      if (notificationType === SUBSCRIPTION_NOTIFICATION_TYPE.PURCHASED) {
        console.log('[Google Webhook] 최초 구매 알림 - 스킵 (클라이언트에서 처리)');
        return NextResponse.json({ success: true, type: 'purchased_skipped' });
      }

      // 알림 타입별 처리
      const result = await handleSubscriptionNotification({
        notificationType,
        purchaseToken,
        subscriptionId,
        packageName: notification.packageName,
        eventTimeMillis: notification.eventTimeMillis,
      });

      if (!result.success) {
        console.error('[Google Webhook] 처리 실패:', result.error);
        // Pub/Sub은 200을 반환해야 재시도하지 않음
        // 실패해도 200 반환하여 무한 재시도 방지
        return NextResponse.json({ success: false, error: result.error });
      }

      console.log('[Google Webhook] 처리 완료:', result);
      return NextResponse.json({ success: true, result });
    }

    // 알 수 없는 알림 타입
    console.warn('[Google Webhook] 알 수 없는 알림:', notification);
    return NextResponse.json({ success: true, type: 'unknown' });
  } catch (error) {
    console.error('[Google Webhook] 오류:', error);
    // Pub/Sub 재시도 방지를 위해 200 반환
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET 요청 - 엔드포인트 상태 확인용
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/payment/google/webhook',
    description: 'Google Play RTDN Webhook',
  });
}
