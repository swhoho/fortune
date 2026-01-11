# 결제 및 크레딧 시스템 가이드

> Master's Insight AI 결제, 크레딧, 구독 시스템 문서

**Version**: 2.0.0
**Last Updated**: 2026-01-12
**현재 사용**: Stripe (테스트 모드) + PortOne V2
**구독**: Mock 모드 (실 결제 미연동)

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| **현재 결제** | Stripe (테스트 모드) |
| **포트원 연동** | 코드 준비 완료, 키 발급 대기 |

> 포트원 키 발급 후 전환 예정. 현재는 Stripe 테스트 모드로 운영.

---

## 1. Stripe (현재 사용)

### 1.1 환경변수

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 1.2 크레딧 패키지 (USD)

| 패키지 | 크레딧 | 보너스 | 가격 |
|--------|--------|--------|------|
| 베이직 | 30C | - | $3.00 |
| 스타터 | 50C | - | $5.00 |
| 인기 | 100C | +10C | $10.00 |
| 프리미엄 | 200C | +30C | $20.00 |

### 1.3 결제 플로우 (Stripe)

```
[패키지 선택] → [API: create-checkout-session] → [Stripe 결제창]
     → [결제 완료] → [Webhook: 크레딧 지급] → [성공 페이지]
```

### 1.4 관련 파일

```
src/lib/stripe.ts                          # Stripe 설정
src/app/[locale]/payment/page.tsx          # 결제 페이지
src/app/api/payment/create-checkout-session/route.ts  # 세션 생성
src/app/api/payment/webhook/route.ts       # 웹훅 처리
```

---

## 2. PortOne V2 (예정)

### 2.1 환경변수

```bash
# .env.local (키 발급 후 설정)
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-xxx
PORTONE_API_SECRET=portone_xxx
```

### 2.2 크레딧 패키지 (KRW)

| 패키지 | 크레딧 | 보너스 | 가격 |
|--------|--------|--------|------|
| 베이직 | 30C | - | ₩3,000 |
| 스타터 | 50C | - | ₩5,000 |
| 인기 | 100C | +10C | ₩10,000 |
| 프리미엄 | 200C | +30C | ₩20,000 |

### 2.3 결제 플로우 (PortOne)

```
[패키지 선택] → [PortOne SDK 결제창] → [결제 완료]
     → [API: verify] → [크레딧 지급] → [성공 페이지]
```

### 2.4 관련 파일 (준비됨)

```
src/lib/portone.ts                         # 포트원 설정
src/app/api/payment/portone/verify/route.ts  # 결제 검증
```

### 2.5 전환 방법

1. 포트원 관리자 콘솔에서 키 발급
2. `.env.local`에 키 설정
3. `payment/page.tsx`를 포트원 버전으로 교체

---

## 3. 서비스별 크레딧 비용

| 서비스 | 크레딧 |
|--------|--------|
| 전체 사주 분석 | 70C |
| 신년 운세 | 50C |
| 궁합 분석 | 70C |
| AI 추가 질문 | 10C |
| 섹션 재분석 | 5C |

---

## 4. 크레딧 유효기간 시스템 (v2.0)

### 4.1 개요

크레딧은 유효기간이 있으며, FIFO 방식으로 차감됩니다.

| 크레딧 유형 | 유효기간 |
|-------------|----------|
| 구매 (purchase) | 2년 |
| 구독 (subscription) | 1개월 |
| 보너스 (bonus) | 2년 |
| 환불 (refund) | 2년 |

### 4.2 DB 스키마

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

### 4.3 FIFO 차감 방식

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

### 4.4 API 엔드포인트

| API | 설명 |
|-----|------|
| `GET /api/user/credits/check` | 잔액 + 만료 예정 정보 조회 |
| `GET /api/cron/expire-credits` | 만료 크레딧 처리 (Vercel Cron) |

---

## 5. 구독 시스템 (Mock)

### 5.1 개요

현재 구독은 Mock 모드로 운영되며, 실제 결제가 연동되지 않습니다.

| 구독 플랜 | 가격 | 혜택 |
|-----------|------|------|
| 프리미엄 | ₩3,900/월 | 오늘의 운세 + 월 50C |

### 5.2 DB 스키마

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

### 5.3 API 엔드포인트

| API | 메서드 | 설명 |
|-----|--------|------|
| `/api/subscription/start` | POST | Mock 구독 시작 (50C 지급) |
| `/api/subscription/status` | GET | 구독 상태 조회 |
| `/api/subscription/cancel` | POST | 구독 취소 |
| `/api/cron/expire-subscriptions` | GET | 만료 구독 처리 (Vercel Cron) |

### 5.4 구독 시작 플로우

```
[구독 시작 버튼] → [POST /api/subscription/start]
  → subscriptions 레코드 생성
  → 50C 크레딧 지급 (1개월 만료)
  → users.subscription_status = 'active' 업데이트
```

---

## 6. Cron Jobs

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

## 7. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0.0 | 2026-01-12 | 크레딧 유효기간 시스템, FIFO 차감, 구독 시스템 (Mock) |
| 1.1.0 | 2026-01-05 | Stripe으로 임시 복원, 포트원 코드 준비 완료 |
| 1.0.0 | 2026-01-05 | 포트원 V2 연동 코드 작성 |
