# 결제 및 크레딧 시스템 가이드

> Master's Insight AI 결제, 크레딧, 구독 시스템 문서

**Version**: 3.2.0
**Last Updated**: 2026-01-12
**현재 사용**: PayApp (신용카드1)
**구독**: PayApp 정기결제 (실결제 연동)
**Android 앱**: Google Play Billing (준비중)

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| **신용카드** | PayApp (실결제 연동) |
| **카카오페이** | 준비중 (PortOne) |
| **Google Play (Android)** | 코드 준비 완료 (Play Console 설정 필요) |

> PayApp으로 신용카드 결제 실연동 완료. 카카오페이는 추후 연동 예정.
> Android 앱용 Google Play Billing 코드 준비 완료.

---

## 1. PayApp (신용카드 - 현재 사용)

### 1.1 환경변수

```bash
# .env.local
PAYAPP_USER_ID=fortune30
PAYAPP_LINK_KEY=otV5gLZDqIwlkYBHtXQwUO1DPJnCCRVaOgT+oqg6zaM=
PAYAPP_LINK_VAL=otV5gLZDqIwlkYBHtXQwUOxTvU1h/RewOHRNDTc+aeU=
NEXT_PUBLIC_PAYAPP_USER_ID=fortune30
```

### 1.2 결제 플로우 (PayApp)

```
[패키지 선택] → [API: payapp/create] → [PayApp 결제창]
     → [결제 완료] → [Callback: payapp/callback] → [크레딧 지급] → [성공 페이지]
```

### 1.3 관련 파일

```
src/lib/payapp.ts                              # PayApp 설정
src/app/[locale]/payment/page.tsx              # 결제 페이지
src/app/api/payment/payapp/create/route.ts     # 결제 요청 생성
src/app/api/payment/payapp/callback/route.ts   # Feedback URL 콜백
```

### 1.4 PayApp API 명세

| API | 메서드 | 설명 |
|-----|--------|------|
| `/api/payment/payapp/create` | POST | 결제 요청 생성, payUrl 반환 |
| `/api/payment/payapp/callback` | POST | 결제 완료 콜백 (Feedback URL) |

**create 요청**:
```json
{
  "packageId": "popular"
}
```

**create 응답**:
```json
{
  "success": true,
  "payUrl": "https://payapp.kr/...",
  "orderId": "payapp-1234567890-abc123",
  "mulNo": "2000"
}
```

### 1.5 결제 수단 UI

```
[💳 신용카드] [🟡 카카오페이]
   (선택됨)       (준비중)
```

- **신용카드**: PayApp 실결제
- **카카오페이**: PortOne (disabled)

---

## 2. Stripe (미사용)

### 2.1 환경변수

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 2.2 크레딧 패키지 (USD)

| 패키지 | 크레딧 | 보너스 | 가격 |
|--------|--------|--------|------|
| 베이직 | 30C | - | $3.00 |
| 스타터 | 50C | - | $5.00 |
| 인기 | 100C | +10C | $10.00 |
| 프리미엄 | 200C | +30C | $20.00 |

### 2.3 결제 플로우 (Stripe)

```
[패키지 선택] → [API: create-checkout-session] → [Stripe 결제창]
     → [결제 완료] → [Webhook: 크레딧 지급] → [성공 페이지]
```

### 2.4 관련 파일

```
src/lib/stripe.ts                          # Stripe 설정
src/app/[locale]/payment/page.tsx          # 결제 페이지
src/app/api/payment/create-checkout-session/route.ts  # 세션 생성
src/app/api/payment/webhook/route.ts       # 웹훅 처리
```

---

## 3. PortOne V2 (카카오페이 - 준비중)

### 3.1 환경변수

```bash
# .env.local (키 발급 후 설정)
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD=channel-xxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAO=channel-xxx
PORTONE_API_SECRET=portone_xxx
```

### 3.2 크레딧 패키지 (KRW)

| 패키지 | 크레딧 | 보너스 | 가격 |
|--------|--------|--------|------|
| 베이직 | 30C | - | ₩3,000 |
| 스타터 | 50C | - | ₩5,000 |
| 인기 | 100C | +10C | ₩10,000 |
| 프리미엄 | 200C | +30C | ₩20,000 |

### 3.3 결제 플로우 (PortOne)

```
[패키지 선택] → [PortOne SDK 결제창] → [결제 완료]
     → [API: verify] → [크레딧 지급] → [성공 페이지]
```

### 3.4 관련 파일 (준비됨)

```
src/lib/portone.ts                         # 포트원 설정
src/app/api/payment/portone/verify/route.ts  # 결제 검증
```

### 3.5 활성화 방법

1. 포트원 관리자 콘솔에서 키 발급
2. `.env.local`에 키 설정
3. `src/lib/portone.ts`에서 `disabled: true` 제거

---

## 4. 서비스별 크레딧 비용

| 서비스 | 크레딧 |
|--------|--------|
| 전체 사주 분석 | 70C |
| 신년 운세 | 50C |
| 궁합 분석 | 70C |
| AI 추가 질문 | 10C |
| 섹션 재분석 | 5C |

---

## 5. 크레딧 유효기간 시스템 (v2.0)

### 5.1 개요

크레딧은 유효기간이 있으며, FIFO 방식으로 차감됩니다.

| 크레딧 유형 | 유효기간 |
|-------------|----------|
| 구매 (purchase) | 2년 |
| 구독 (subscription) | 1개월 |
| 보너스 (bonus) | 2년 |
| 환불 (refund) | 2년 |

### 5.2 DB 스키마

```sql
-- credit_transactions 테이블
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,  -- purchase, subscription, usage, expiry, bonus, refund
  amount INTEGER NOT NULL,     -- 양수=충전, 음수=사용
  balance_after INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,      -- 만료일 (충전 타입만)
  remaining INTEGER DEFAULT 0, -- 잔여 크레딧 (FIFO 차감용)
  purchase_id TEXT,
  subscription_id UUID,
  service_type VARCHAR(30),    -- report, yearly, compatibility, consultation, reanalysis
  service_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 FIFO 차감 방식

크레딧 사용 시 만료일이 가까운 순서로 차감됩니다.

```typescript
// src/lib/credits/deduct.ts
await deductCredits({
  userId: 'user-123',
  amount: 70,
  serviceType: 'report',
  serviceId: reportId,
  description: '홍길동 전체 사주 분석',
  supabase,
});
```

### 5.4 API 엔드포인트

| API | 설명 |
|-----|------|
| `GET /api/user/credits/check` | 잔액 + 만료 예정 정보 조회 |
| `GET /api/cron/expire-credits` | 만료 크레딧 처리 (Vercel Cron) |

---

## 6. 구독 시스템 (PayApp 정기결제)

### 6.1 개요

PayApp 정기결제를 통한 월간 구독 시스템입니다.

| 구독 플랜 | 가격 | 혜택 |
|-----------|------|------|
| 프리미엄 | ₩3,900/월 | 오늘의 운세 무제한 + 월 50C |

### 6.2 DB 스키마

```sql
-- subscriptions 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, canceled, expired
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  price INTEGER NOT NULL DEFAULT 3900,
  payapp_rebill_no TEXT,           -- PayApp 정기결제 번호
  payapp_recvphone TEXT,           -- PayApp 등록 전화번호
  payment_method VARCHAR(20) DEFAULT 'mock',  -- mock, payapp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- users 테이블 추가 컬럼
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);
```

### 6.3 API 엔드포인트

| API | 메서드 | 설명 |
|-----|--------|------|
| `/api/subscription/payapp/create` | POST | PayApp 정기결제 요청 생성 |
| `/api/subscription/payapp/callback` | POST | PayApp Feedback URL (매월 자동결제 노티) |
| `/api/subscription/start` | POST | Mock 구독 시작 (테스트용) |
| `/api/subscription/status` | GET | 구독 상태 조회 |
| `/api/subscription/cancel` | POST | 구독 취소 |
| `/api/cron/expire-subscriptions` | GET | 만료 구독 처리 (Vercel Cron) |

### 6.4 PayApp 정기결제 플로우

```
[구독 시작] → [휴대폰 입력] → [POST /api/subscription/payapp/create]
  → PayApp 정기결제 등록 페이지로 리다이렉트
  → [카드 등록 완료] → [Callback: pay_state=1]
  → subscriptions 레코드 생성 (payment_method='payapp')
  → 최초 50C 크레딧 지급
  → users.subscription_status = 'active' 업데이트

[매월 자동결제] → [Callback: pay_state=4]
  → 구독 기간 갱신
  → 50C 크레딧 지급

[구독 해지] → [Callback: pay_state=8]
  → subscriptions.status = 'canceled'
```

### 6.5 PayApp 정기결제 파라미터

| 파라미터 | 값 |
|---------|-----|
| `rebillCycleType` | `Month` |
| `rebillCycleMonth` | 등록일 (1~28) |
| `rebillExpire` | 1년 후 |
| `openpaytype` | `card` |

---

## 7. Cron Jobs

Vercel Cron으로 매일 자정(UTC 00:00 = KST 09:00) 실행됩니다.

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/expire-credits", "schedule": "0 0 * * *" },
    { "path": "/api/cron/expire-subscriptions", "schedule": "0 0 * * *" }
  ]
}
```

| Cron | 역할 |
|------|------|
| expire-credits | 만료된 크레딧 remaining=0 처리, expiry 기록 생성 |
| expire-subscriptions | 만료된 구독 status='expired' 처리 |

---

## 8. Google Play Billing (Android 앱 - 준비중)

> Android 앱에서 Google Play 결제를 통한 크레딧 구매 및 구독 시스템

### 8.1 개요

| 항목 | 상태 |
|------|------|
| **크레딧 구매 (일회성)** | 코드 준비 완료 |
| **구독 (정기결제)** | 코드 준비 완료 |
| **Play Console 설정** | 미완료 |

### 8.2 환경변수

```bash
# .env.local (Google Cloud 서비스 계정 JSON)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

### 8.3 상품 ID 매핑

**크레딧 패키지 (일회성 구매)**:

| 패키지 | Google 상품 ID | 크레딧 | 가격 (KRW) |
|--------|----------------|--------|------------|
| 베이직 | `credits_30` | 30 | ₩3,000 |
| 스타터 | `credits_50` | 50 | ₩5,000 |
| 인기 | `credits_100` | 110 (+10 보너스) | ₩10,000 |
| 프리미엄 | `credits_200` | 230 (+30 보너스) | ₩20,000 |

**구독 상품**:

| 플랜 | Google 상품 ID | 가격 | 혜택 |
|------|----------------|------|------|
| 프리미엄 | `subscription_premium_monthly` | ₩3,900/월 | 오늘의 운세 무제한 + 월 50C |

### 8.4 결제 플로우

**크레딧 구매**:
```
[앱에서 패키지 선택] → isNativeApp() 확인
  → [purchaseGoogleCredits() 호출] → [Google Play 결제 UI]
  → [결제 완료] → [POST /api/payment/google/verify]
  → [Google Play Developer API 검증] → [크레딧 지급] → [성공]
```

**구독**:
```
[앱에서 구독 시작] → isNativeApp() 확인
  → [purchaseGoogleSubscription() 호출] → [Google Play 구독 UI]
  → [결제 완료] → [POST /api/payment/google/subscription]
  → [Google Play Developer API 검증] → [구독 생성 + 50C 지급] → [성공]
```

### 8.5 관련 파일

```
src/lib/google-billing.ts                           # Google Play Billing 클라이언트
src/app/api/payment/google/verify/route.ts          # 크레딧 구매 검증 API
src/app/api/payment/google/subscription/route.ts    # 구독 검증 API
```

### 8.6 API 명세

| API | 메서드 | 설명 |
|-----|--------|------|
| `/api/payment/google/verify` | POST | 크레딧 구매 검증, 크레딧 지급 |
| `/api/payment/google/subscription` | POST | 구독 검증, 구독 생성, 50C 지급 |

**verify 요청**:
```json
{
  "purchaseToken": "...",
  "productId": "credits_100",
  "userId": "user-123",
  "orderId": "GPA.1234-5678-9012"
}
```

**subscription 요청**:
```json
{
  "purchaseToken": "...",
  "productId": "subscription_premium_monthly",
  "userId": "user-123",
  "orderId": "GPA.1234-5678-9012"
}
```

### 8.7 DB 스키마 변경 (적용 필요)

```sql
-- subscriptions 테이블에 Google Play 컬럼 추가
ALTER TABLE subscriptions ADD COLUMN google_purchase_token TEXT;
ALTER TABLE subscriptions ADD COLUMN google_order_id TEXT;
```

### 8.8 활성화 단계

#### Step 1: Google Play Console 설정

1. **앱 등록**: Google Play Console에 앱 생성 (패키지명: `ai.mastersinsight.app`)
2. **인앱 상품 등록**: 수익 창출 > 인앱 상품 > 관리형 제품
   - `credits_30`, `credits_50`, `credits_100`, `credits_200`
3. **구독 상품 등록**: 수익 창출 > 구독
   - `subscription_premium_monthly` (₩3,900, 월간)

#### Step 2: 서비스 계정 설정

1. **Google Cloud Console**:
   - 프로젝트 생성 또는 선택
   - IAM > 서비스 계정 > 새 서비스 계정 생성
   - JSON 키 다운로드

2. **Play Console API 접근 권한**:
   - 설정 > API 액세스 > 서비스 계정 연결
   - 권한: 앱 정보 보기, 주문 및 구독 관리

3. **환경변수 설정**:
   ```bash
   # Vercel에 추가
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

#### Step 3: DB 마이그레이션

```sql
-- Supabase SQL Editor에서 실행
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS google_purchase_token TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS google_order_id TEXT;
```

#### Step 4: 테스트

1. **라이선스 테스터 등록**: Play Console > 설정 > 라이선스 테스트
2. **내부 테스트 트랙**: 테스트 > 내부 테스트 > 테스터 추가
3. **테스트 결제**: 실제 결제 없이 테스트 가능

### 8.9 클라이언트 사용법

```typescript
import {
  isNativeApp,
  purchaseGoogleCredits,
  purchaseGoogleSubscription,
} from '@/lib/google-billing';

// 크레딧 구매
if (isNativeApp()) {
  const result = await purchaseGoogleCredits(packageInfo, userId);
  if (result.success) {
    // 성공 처리
  }
}

// 구독
if (isNativeApp()) {
  const result = await purchaseGoogleSubscription(userId);
  if (result.success) {
    // 성공 처리
  }
}
```

### 8.10 실시간 개발자 알림 (RTDN) - 추후 구현

Google Play에서 구독 상태 변경 시 실시간 알림을 받으려면 Cloud Pub/Sub 설정이 필요합니다.

```
[Google Play] → [Cloud Pub/Sub] → [Push Endpoint] → [서버 처리]
```

**알림 유형**:
| notificationType | 설명 |
|------------------|------|
| 2 | SUBSCRIPTION_RENEWED - 갱신 |
| 3 | SUBSCRIPTION_CANCELED - 취소 |
| 12 | SUBSCRIPTION_REVOKED - 환불 |
| 13 | SUBSCRIPTION_EXPIRED - 만료 |

> 현재는 앱에서 구독 상태를 확인하는 방식으로 구현. RTDN은 추후 필요 시 추가.

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 3.2.0 | 2026-01-12 | Google Play Billing 준비 (크레딧 구매 + 구독), 문서화 |
| 3.1.0 | 2026-01-12 | PayApp 정기결제(구독) 연동, subscriptions 테이블 컬럼 추가 |
| 3.0.0 | 2026-01-12 | PayApp 신용카드 결제 연동 (신용카드1), 결제 수단 3개 UI |
| 2.0.0 | 2026-01-12 | 크레딧 유효기간 시스템, FIFO 차감, 구독 시스템 (Mock) |
| 1.1.0 | 2026-01-05 | Stripe으로 임시 복원, 포트원 코드 준비 완료 |
| 1.0.0 | 2026-01-05 | 포트원 V2 연동 코드 작성 |
