# 결제 및 크레딧 시스템 가이드

> Master's Insight AI 결제, 크레딧, 구독 시스템 문서

**Version**: 3.0.0
**Last Updated**: 2026-01-12
**현재 사용**: PayApp (신용카드1)
**구독**: Mock 모드 (실 결제 미연동)

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| **신용카드1** | PayApp (실결제 연동) |
| **신용카드2** | 준비중 (PortOne) |
| **카카오페이** | 준비중 (PortOne) |

> PayApp으로 신용카드 결제 실연동 완료. 신용카드2, 카카오페이는 추후 연동 예정.

---

## 1. PayApp (신용카드1 - 현재 사용)

### 1.1 환경변수

```bash
# .env.local
PAYAPP_USER_ID=7612301990
PAYAPP_LINK_KEY=otV5gLZDqIwlkYBHtXQwUO1DPJnCCRVaOgT+oqg6zaM=
PAYAPP_LINK_VAL=otV5gLZDqIwlkYBHtXQwUOxTvU1h/RewOHRNDTc+aeU=
NEXT_PUBLIC_PAYAPP_USER_ID=7612301990
```

### 1.2 결제 플로우 (PayApp)

```
[패키지 선택] → [휴대폰 입력] → [API: payapp/create] → [PayApp 결제창]
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
  "packageId": "popular",
  "phoneNumber": "01012345678"
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
[💳 신용카드1] [💳 신용카드2] [🟡 카카오페이]
   (선택됨)       (준비중)        (준비중)
```

- **신용카드1**: PayApp 실결제
- **신용카드2**: PortOne (disabled)
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

## 3. PortOne V2 (신용카드2, 카카오페이 - 준비중)

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

## 6. 구독 시스템 (Mock)

### 6.1 개요

현재 구독은 Mock 모드로 운영되며, 실제 결제가 연동되지 않습니다.

| 구독 플랜 | 가격 | 혜택 |
|-----------|------|------|
| 프리미엄 | ₩3,900/월 | 오늘의 운세 + 월 50C |

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
| `/api/subscription/start` | POST | Mock 구독 시작 (50C 지급) |
| `/api/subscription/status` | GET | 구독 상태 조회 |
| `/api/subscription/cancel` | POST | 구독 취소 |
| `/api/cron/expire-subscriptions` | GET | 만료 구독 처리 (Vercel Cron) |

### 6.4 구독 시작 플로우

```
[구독 시작 버튼] → [POST /api/subscription/start]
  → subscriptions 레코드 생성
  → 50C 크레딧 지급 (1개월 만료)
  → users.subscription_status = 'active' 업데이트
```

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

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 3.0.0 | 2026-01-12 | PayApp 신용카드 결제 연동 (신용카드1), 결제 수단 3개 UI |
| 2.0.0 | 2026-01-12 | 크레딧 유효기간 시스템, FIFO 차감, 구독 시스템 (Mock) |
| 1.1.0 | 2026-01-05 | Stripe으로 임시 복원, 포트원 코드 준비 완료 |
| 1.0.0 | 2026-01-05 | 포트원 V2 연동 코드 작성 |
