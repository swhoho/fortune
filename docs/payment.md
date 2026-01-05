# 결제 시스템 가이드

> Master's Insight AI 결제 연동 문서

**Version**: 1.1.0
**Last Updated**: 2026-01-05
**현재 사용**: Stripe (테스트 모드)
**예정**: PortOne V2

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

## 4. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.1.0 | 2026-01-05 | Stripe으로 임시 복원, 포트원 코드 준비 완료 |
| 1.0.0 | 2026-01-05 | 포트원 V2 연동 코드 작성 |
