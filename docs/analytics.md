# Analytics 시스템 (AARRR 프레임워크)

> Firebase + GA4 기반 사용자 행동 분석

## Tech Stack

| Category | Technology |
|----------|------------|
| Analytics | Google Analytics 4 (GA4) |
| SDK | @next/third-parties |
| Backend | Firebase (웹/앱 통합) |

## AARRR 프레임워크

```
Acquisition → Activation → Retention → Revenue → Referral
   획득          활성화       리텐션      매출      추천
```

| 단계 | 정의 | 핵심 지표 |
|------|------|----------|
| Acquisition | 사용자 유입 | 세션 수, 트래픽 소스 |
| Activation | 핵심 기능 사용 | 회원가입, 첫 분석 완료 |
| Retention | 재방문 | DAU/MAU, 재방문율 |
| Revenue | 결제 | 구매 전환율, ARPU |
| Referral | 공유/추천 | 공유 클릭, 초대 전환 |

## 환경 변수

```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 파일 구조

```
src/
├── app/[locale]/layout.tsx                      # GoogleAnalytics 컴포넌트
├── lib/analytics.ts                             # 이벤트 추적 유틸리티
├── lib/providers.tsx                            # sign_up 이벤트 (AuthStateManager)
├── hooks/use-profiles.ts                        # create_profile 이벤트
├── app/[locale]/payment/success/page.tsx        # purchase 이벤트
└── app/[locale]/profiles/[id]/generating/page.tsx  # complete_analysis 이벤트
```

## 이벤트 설계

### 1. Acquisition (획득)

자동 수집 (GA4 기본):
- `session_start` - 세션 시작
- `page_view` - 페이지 조회
- `first_visit` - 첫 방문

UTM 파라미터로 채널 추적:
```
https://masters-insight.ai/?utm_source=instagram&utm_medium=social&utm_campaign=new_year_2026
```

### 2. Activation (활성화)

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `sign_up` | 회원가입 완료 | `method` |
| `create_profile` | 프로필 생성 | `is_first` |
| `complete_analysis` | 첫 사주 분석 완료 | `profile_id`, `is_free` |
| `view_report` | 리포트 조회 | `section` |

### 3. Retention (리텐션)

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `daily_fortune_view` | 오늘의 운세 조회 | `day_streak` |
| `consultation_start` | AI 상담 시작 | `session_id` |
| `return_visit` | 재방문 | `days_since_last` |

### 4. Revenue (매출)

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `begin_checkout` | 결제 시작 | `value`, `currency`, `items` |
| `purchase` | 결제 완료 | `transaction_id`, `value`, `currency` |
| `subscribe` | 구독 시작 | `plan_id`, `value` |

### 5. Referral (추천)

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `share` | 결과 공유 | `method`, `content_type` |
| `invite_friend` | 친구 초대 | `invite_code` |

## 사용법

### 기본 이벤트 전송

```typescript
import { trackEvent } from '@/lib/analytics';

// 회원가입 완료
trackEvent('sign_up', { method: 'google' });

// 분석 완료
trackEvent('complete_analysis', {
  profile_id: 'xxx',
  is_free: true
});

// 구매 완료
trackEvent('purchase', {
  transaction_id: 'order_123',
  value: 9900,
  currency: 'KRW',
  items: [{ item_id: 'credit_100', item_name: '크레딧 100' }]
});
```

### 페이지뷰 (자동)

`@next/third-parties`의 `GoogleAnalytics` 컴포넌트가 자동으로 페이지뷰를 추적합니다.

## GA4 설정 체크리스트

### Firebase Console

- [ ] Firebase 프로젝트 생성
- [ ] Google Analytics 연동 체크
- [ ] 웹 앱 등록 (Vercel 도메인)
- [ ] Android 앱 등록 (google-services.json)

### GA4 Console

- [ ] 측정 ID 발급 (G-XXXXXXXXXX)
- [ ] 전환 이벤트 설정 (`sign_up`, `purchase`)
- [ ] 잠재고객 세그먼트 생성
- [ ] 깔때기(Funnel) 보고서 생성

### Vercel

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경변수 추가
- [ ] 프로덕션 배포

## GA4 깔때기 보고서 설정

1. GA4 > 탐색(Explore) > 깔때기 탐색
2. 단계 설정:
   - Step 1: `session_start` (방문)
   - Step 2: `sign_up` (가입)
   - Step 3: `complete_analysis` (분석 완료)
   - Step 4: `purchase` (결제)

## 디버깅

### GA4 DebugView

1. Chrome Extension: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger)
2. GA4 > 관리 > DebugView에서 실시간 이벤트 확인

### 콘솔 로그

개발 환경에서는 `analytics.ts`에서 콘솔 로그 출력:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[GA4]', eventName, params);
}
```

---

**Version**: 1.0.0
**Last Updated**: 2026-01-14
