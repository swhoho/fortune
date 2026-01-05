# 결제 시스템 가이드

> Master's Insight AI 결제 연동 문서

**Version**: 1.0.0
**Last Updated**: 2026-01-05
**Payment Provider**: PortOne V2

---

## 1. 개요

### 1.1 결제 프로바이더

| 항목 | 내용 |
|------|------|
| PG사 | PortOne V2 (구 아임포트) |
| 지원 결제수단 | 신용카드, 카카오페이, 네이버페이, 토스페이 등 |
| 통화 | KRW (원화) |
| 테스트 모드 | 지원 |

### 1.2 크레딧 시스템

| 패키지 | 크레딧 | 보너스 | 가격 (KRW) |
|--------|--------|--------|------------|
| 베이직 | 30C | - | ₩3,000 |
| 스타터 | 50C | - | ₩5,000 |
| 인기 | 100C | +10C | ₩10,000 |
| 프리미엄 | 200C | +30C | ₩20,000 |

### 1.3 서비스별 크레딧 비용

| 서비스 | 크레딧 |
|--------|--------|
| 전체 사주 분석 | 50C |
| 신년 운세 | 30C |
| 궁합 분석 | 50C |
| AI 추가 질문 | 10C |
| 섹션 재분석 | 5C |

---

## 2. 환경 설정

### 2.1 필수 환경변수

```bash
# .env.local
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxx       # 상점 ID
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-xxx  # 채널 키 (PG사별)
PORTONE_API_SECRET=portone_xxx               # API 시크릿 (서버용)
```

### 2.2 포트원 관리자 콘솔 설정

1. [포트원 관리자 콘솔](https://admin.portone.io) 접속
2. 결제 연동 → 테스트 연동 관리
3. 채널 추가 (테스트용 PG사 선택)
4. Store ID, Channel Key 복사
5. API Keys → API Secret 생성

---

## 3. 결제 플로우

```
[사용자: 패키지 선택]
        ↓
[클라이언트: PortOne SDK 결제창 호출]
        ↓
[사용자: 결제 완료]
        ↓
[클라이언트: paymentId 수신]
        ↓
[서버: 결제 검증 API 호출]
        ↓
[서버: 포트원 API로 결제 정보 조회]
        ↓
[서버: 금액 검증 + 크레딧 지급]
        ↓
[클라이언트: 성공 페이지 이동]
```

---

## 4. API 명세

### 4.1 결제 검증 API

**POST /api/payment/portone/verify**

```typescript
// Request
{
  paymentId: string;      // 포트원 결제 ID
  packageId: string;      // 선택한 패키지 ID
  expectedAmount: number; // 예상 금액 (KRW)
}

// Response (성공)
{
  success: true;
  credits: number;        // 지급된 크레딧
  newBalance: number;     // 새 크레딧 잔액
}

// Response (실패)
{
  success: false;
  error: string;
}
```

### 4.2 결제 상태 조회 (포트원 API)

```bash
GET https://api.portone.io/payments/{paymentId}
Authorization: PortOne {API_SECRET}
```

---

## 5. 코드 구조

```
src/
├── lib/
│   └── portone.ts              # 포트원 설정 + 크레딧 패키지
├── app/
│   ├── [locale]/payment/
│   │   ├── page.tsx            # 결제 페이지 (SDK 호출)
│   │   └── success/page.tsx    # 결제 성공 페이지
│   └── api/payment/
│       └── portone/
│           └── verify/route.ts # 결제 검증 API
└── components/
    └── payment/
        └── PaymentSections.tsx # 결제 UI 컴포넌트
```

---

## 6. 테스트 결제

### 6.1 테스트 카드 정보

포트원 테스트 모드에서는 실제 결제 없이 테스트 가능:

| 항목 | 값 |
|------|-----|
| 카드번호 | 아무 번호 (테스트 PG) |
| 유효기간 | 미래 날짜 |
| CVC | 아무 숫자 |

### 6.2 테스트 시나리오

1. 결제 페이지 접속 (`/payment`)
2. 패키지 선택
3. "결제하기" 클릭
4. 테스트 PG 결제창에서 결제 진행
5. 성공 페이지 확인 (`/payment/success`)
6. 크레딧 잔액 확인

---

## 7. 프로덕션 전환 체크리스트

- [ ] 포트원 실 연동 채널 설정
- [ ] 환경변수 라이브 키로 변경
- [ ] Vercel 환경변수 업데이트
- [ ] 웹훅 URL 등록 (선택)
- [ ] 결제 테스트 완료

---

## 8. 에러 처리

### 8.1 결제 실패 코드

| 코드 | 설명 | 처리 |
|------|------|------|
| `USER_CANCEL` | 사용자 취소 | 결제 페이지 유지 |
| `PAYMENT_FAILED` | 결제 실패 | 에러 메시지 표시 |
| `INVALID_AMOUNT` | 금액 불일치 | 관리자 알림 |

### 8.2 검증 실패 시

- 결제는 완료되었으나 검증 실패 시 → 로그 기록 + 수동 처리
- 중복 검증 방지를 위해 `purchases` 테이블에 `payment_id` 유니크 제약

---

## 9. 보안 고려사항

1. **API Secret 보호**: 서버 사이드에서만 사용
2. **금액 검증 필수**: 클라이언트 금액 신뢰 X
3. **중복 결제 방지**: paymentId 유니크 체크
4. **HTTPS 필수**: 모든 API 통신 암호화

---

## 10. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-05 | 포트원 V2 연동 (Stripe에서 전환) |

