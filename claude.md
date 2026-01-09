# Master's Insight AI

> 30년 명리학 거장이 인정한 AI 사주 분석 서비스

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Gemini 2.0 Flash |
| Payment (Web) | PortOne (한국 PG) |
| Payment (App) | Google Play Billing |
| Mobile App | Capacitor (Android) |
| Live Chat | Crisp |
| i18n | next-intl (ko, en, ja, zh-CN, zh-TW) |

## 프로젝트 구조

```
src/
├── app/
│   ├── [locale]/           # 다국어 라우팅
│   │   ├── home/           # 홈화면
│   │   ├── profiles/       # 프로필 CRUD
│   │   │   └── [id]/
│   │   │       ├── generating/  # 리포트 생성 중
│   │   │       └── report/      # 리포트 결과
│   │   ├── analysis/       # 분석 플로우
│   │   └── payment/        # 결제
│   └── api/
│       ├── profiles/[id]/report/  # 리포트 API
│       └── user/credits/          # 크레딧 API
├── components/
│   ├── profile/            # 프로필 컴포넌트
│   ├── report/             # 리포트 UI (FavorableBar, DaewunDetailSection)
│   ├── credits/            # 크레딧 다이얼로그
│   └── analysis/           # 분석 UI (PipelineProcessingScreen)
├── lib/
│   ├── ai/pipeline/        # AnalysisPipeline 모듈 (v2.1)
│   ├── score/              # 십신 기반 점수 계산
│   └── stripe.ts           # 크레딧 비용 정의
├── hooks/
│   ├── use-profiles.ts     # 프로필 CRUD 훅
│   ├── use-credits.ts      # 크레딧 확인 훅
│   └── use-questions.ts    # 후속 질문 훅 (v2.0)
└── stores/analysis.ts      # 파이프라인 상태

python/
├── manseryeok/             # 만세력 엔진 (대운 십신 계산 포함)
├── prompts/                # AI 프롬프트 (daewun_analysis.py 포함)
│   ├── classics/           # 고전 명리학 모듈
│   │   ├── qiongtong_matrix.py  # 조후 매트릭스 (10일간×12월)
│   │   ├── qiongtong.py         # 궁통보감 프롬프트
│   │   ├── ziping.py            # 자평진전 프롬프트
│   │   └── ziping_yongsin.py    # 용신 5원칙 (10격국×3강약)
│   ├── western/            # 서구권 현대화 프레임워크
│   │   └── destiny_code.py      # The Destiny Code (십신×강약 조언, 대운 분석)
│   └── mulsangron.py       # 물상론 DB (십신별 길흉 사건 매핑)
├── scoring/                # 점수 계산 모듈 (Task 5)
│   ├── event_score.py      # 사건 강도 점수 (-100 ~ +100)
│   └── validation.py       # 점수-서술 일관성 검증
└── visualization/          # 이미지 생성
```

## 문서

| 문서 | 설명 |
|------|------|
| `docs/api.md` | API 엔드포인트 명세 |
| `docs/fortune_engine.md` | 만세력 엔진, 점수 시스템 |
| `docs/report_analysis.md` | 프로필 리포트 분석 파이프라인 |
| `docs/yearly_analysis.md` | 신년 분석 파이프라인 |
| `docs/compatibility.md` | 궁합 분석 시스템 (Python 점수 엔진 + Gemini 해석) |
| `docs/consultation.md` | AI 상담 시스템 |
| `docs/app.md` | Android 앱 출시 가이드 (Capacitor, Google Play Billing) |

## 핵심 기능

### 분석 파이프라인

```
[만세력] → [지장간] → [기본분석] → [성격/적성/재물] → [점수] → [시각화]
  Python    Python     Gemini        Gemini (병렬)     TypeScript   Python
```

### 크레딧 시스템

| 서비스 | 크레딧 |
|--------|--------|
| 리포트 생성 | 70C |
| 신년 분석 | 50C |
| 궁합 분석 | 70C |
| 섹션 재분석 | 5C |
| AI 질문 | 10C |
| 상담 세션 | 10C (2라운드) |

### 점수 계산 (v4.0)

- **Phase 1**: 지장간 월률분야 비율 (寅申巳亥=[7/30, 7/30, 16/30]...)
- **Phase 2**: 12운성 가중치 (건록/제왕=+0.6, 묘/절/사=-0.4)
- **Phase 3**: 지지 상호작용 배수 (충=1.4, 형=1.5, 원진=0.8)
- 공식: `50 + Σ(modifier×count) + wunseong×5 → ×interaction → clamp(0,100)`
- Modifier 범위: 성격/적성 ±20, 업무/연애 ±30

### 오행 색상

| 오행 | Hex |
|------|-----|
| 木 | `#4ade80` |
| 火 | `#ef4444` |
| 土 | `#f59e0b` |
| 金 | `#e5e7eb` |
| 水 | `#1e3a8a` |

### 다크 테마 디자인 시스템

**레이어 배경 색상**:
| 레이어 | 용도 | Hex |
|--------|------|-----|
| L0 | 페이지 배경 | `#0a0a0a` |
| L1 | 섹션 배경 | `#111111` |
| L2 | 카드 배경 | `#1a1a1a` |
| L3 | 호버/강조 | `#242424` |
| L4 | 입력 필드 | `#2a2a2a` |

**색상 변환 패턴**:
| 기존 (라이트) | 변환 (다크) |
|---------------|-------------|
| `bg-white` | `bg-[#1a1a1a]` |
| `bg-gray-50/100` | `bg-[#242424]` |
| `border-gray-100/200` | `border-[#333]` |
| `text-[#1a1a1a]` | `text-white` |
| `text-gray-500/600` | `text-gray-400` |
| `hover:bg-gray-50` | `hover:bg-[#242424]` |
| `bg-gray-200` (skeleton) | `bg-[#333]` |

**텍스트 색상**:
| 용도 | 색상 |
|------|------|
| 주요 텍스트 | `text-white` |
| 보조 텍스트 | `text-gray-400` |
| 힌트/라벨 | `text-gray-500` |
| 금색 액센트 | `text-[#d4af37]` |

**경고/에러 색상 (다크 모드)**:
| 용도 | 색상 |
|------|------|
| 에러 배경 | `bg-red-950/30` |
| 에러 테두리 | `border-red-900/50` |
| 에러 텍스트 | `text-red-400` |

## 배포

- **Frontend (Next.js)**: Vercel
  - Root Directory: `.`
  - Env: `PYTHON_API_URL` → Railway URL
- **Backend (Python)**: Railway
  - Root Directory: `/python`
  - Dockerfile 자동 감지
- **Android App**: Google Play Store
  - Package: `ai.mastersinsight.app`
  - 빌드: `npm run cap:build` (AAB 생성)
  - 상세: `docs/app.md` 참조

## 개발 가이드라인

### 작업 완료 시 문서 업데이트 (필수)

```
1. docs/todo_v2.md         - 완료 항목 체크 [x]
2. docs/api.md             - 새 API 추가/변경 시
3. docs/fortune_engine.md  - 엔진 로직 수정 시
4. claude.md               - 구조 변경 시 (핵심만)
```

### 사용할 스킬/플러그인

| 작업 유형 | 사용 스킬 |
|----------|----------|
| 프론트엔드 UI/UX | `frontend-design` @ claude-plugins-official |
| 코드 리뷰/검증 | `todowrite` & `gemini-claude-loop` |
| 코드베이스 탐색 | `Task` (subagent_type=Explore) |

### Context Engineering 원칙

- **문서 우선**: 코드 작성 전 관련 문서 확인
- **핵심만 기록**: 추후 개발에 꼭 필요한 내용만 문서화
- **Python Code-First**: 타입은 Pydantic → OpenAPI → TS 자동 생성

## 리팩토링 v2.1 - 완료

### 완료된 작업

| Phase | 대상 | 내용 | 상태 |
|-------|------|------|------|
| 1 | `python/prompts/locale_strings.py` | 로케일 딕셔너리화 (builder.py 11% 감소) | ✅ 완료 |
| 2 | `src/lib/ai/pipeline/` | 클래스 분해 (4개 모듈) | ✅ 완료 |
| 3 | `npm run generate:types` | Pydantic→OpenAPI→TS 자동 생성 | ✅ 완료 |

### 핵심 구조

**파이프라인 모듈**:
```
src/lib/ai/pipeline/
├── index.ts          # AnalysisPipeline (오케스트레이션)
├── step-executor.ts  # StepExecutor (타임아웃 + 재시도)
├── context.ts        # PipelineContext (공유 상태)
└── types.ts          # 상수 + 인터페이스
```

**타입 생성**:
```bash
npm run generate:types  # Python Pydantic → TypeScript
```

**자동 생성 타입 사용**:
```typescript
import { Pillars, DaewunItem, CalculateResponse } from '@/types';
```

상세 내용: `docs/fortune_engine.md` 참조

## 테스트

### 테스트 스택

| Category | Technology |
|----------|------------|
| Unit Test (TypeScript) | Vitest + Testing Library |
| E2E Test | Playwright |
| Unit Test (Python) | pytest |
| Performance | Lighthouse CI |

### 테스트 명령어

```bash
# 단위 테스트 (TypeScript)
npm run test           # watch 모드
npm run test:unit      # 1회 실행

# E2E 테스트 (Playwright)
npm run test:e2e              # 전체 브라우저
npm run test:e2e:chromium     # Chromium만
npm run test:e2e:headed       # UI 모드

# 성능 테스트
npm run test:lighthouse       # Lighthouse CI (90+ 목표)

# 전체 테스트
npm run test:all              # 단위 + E2E

# Python 테스트
cd python && pytest           # 만세력/시각화 테스트
```

### 테스트 파일 구조

```
tests/
├── e2e/                        # E2E 테스트
│   ├── onboarding.spec.ts
│   ├── analysis.spec.ts
│   └── payment.spec.ts
└── unit/                       # 단위 테스트
    ├── lib/validation.test.ts
    └── stores/analysis.test.ts

python/tests/
├── test_engine.py              # 만세력 엔진
└── test_visualization.py       # 시각화
```

### 크로스 브라우저/모바일 테스트

Playwright (`playwright.config.ts`):
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5, iPhone 12

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev

# Python (별도 터미널)
cd python && uvicorn main:app --reload
```

## 테스트

```bash
npm run test:unit    # Vitest
npm run test:e2e     # Playwright
cd python && pytest  # Python
```

---

**Version**: 1.39.0
**Last Updated**: 2026-01-09 (궁합 분석 UI 개선)

## Changelog

### v1.39.0 (2026-01-09)
- **궁합 분석 UI 개선**
  - SAJU_REQUIRED 에러 전용 화면 (yearly 패턴)
  - 버튼 통합: 결과 보기 / 진행 상황 확인 / 무료 재시도 / 궁합 분석 시작
  - 크레딧 섹션 조건부 표시 (완료/진행 중일 때 숨김)
  - "분석이 진행 중입니다" 메시지 제거 (버튼에 통합)
- **궁합 분석 중간 저장 구현 (Report 패턴)**
  - Python 파이프라인 `_update_db_status()` 메서드 추가
  - 각 단계 완료 시 DB 저장 (크래시 복구 가능)
  - Python/Next.js API에 DB fallback 추가

### v1.38.0 (2026-01-09)
- **궁합 분석 시스템 구현**
  - Python 점수 엔진: 5개 항목 (천간/지지/오행/십신/12운성)
  - 10단계 파이프라인: 만세력 → 점수 → Gemini 분석 (5단계)
  - 12운성 교차평가: A의 일간 → B의 일지 (상대방 기준)
  - 3탭 UI: 궁합점수 / 궁합분석 / 사주비교
  - 상세 문서: `docs/compatibility.md`

### v1.37.0 (2026-01-08)
- **Android 앱 출시 준비 (Capacitor)**
  - Capacitor 8.0 + Android 프로젝트 설정
  - 원격 서버 모드 (Vercel 웹사이트 로드)
  - Google Play Billing 통합 (`@capgo/native-purchases`)
  - 구매 검증 API (`/api/payment/google/verify`)
  - 앱 빌드 스크립트 (`cap:sync`, `cap:build`)
  - 상세 가이드: `docs/app.md`

### v1.36.0 (2026-01-07)
- **점수 시스템 고도화 (v4.0)**
  - `python/scoring/calculator.py`: 3 Phase 점수 계산 적용
  - Phase 1: 지장간 월률분야 비율 (HIDDEN_STEMS_RATIO)
  - Phase 2: 12운성 가중치 (WUNSEONG_WEIGHTS, JIBYEON_12WUNSEONG)
  - Phase 3: 지지 상호작용 배수 (충=1.4, 형=1.5, 원진=0.8)
  - SENSITIVITY 제거 (Phase 1/2/3으로 대체)
  - 레퍼런스: 사주분석마스터 v7.0/v8.0, 궁통보감, 자평진전

### v1.35.0 (2026-01-07)
- **점수 분포 극단화 (v3.0)**
  - `calculator.ts`: SENSITIVITY=1.5 편차 증폭 로직 추가
  - `trait-modifiers.ts`: modifier ×1.8 확대 (성격/적성 ±20, 업무/연애 ±30)
  - `constants.ts`: 지장간 가중치 [0, 0, 1.0] (여기/중기 노이즈 제거)
  - 목표: 50점 근처 수렴 방지, 특성별 명확한 차이

### v1.34.0 (2026-01-07)
- **Gemini response_schema 호환성 수정**
  - 미지원 필드 제거: `minimum`, `maximum`, `minItems`, `enum`
  - `description`으로 대체하여 범위/조건 명시
  - 영향 스키마: personality, aptitude, fortune, yearly, monthly, daewun
- **AI 모델**: Gemini 3.0 Pro → Gemini 2.0 Flash

### v1.33.0 (2026-01-07)
- **신년 분석 버그 수정 (v2.7)**
  - 재분석 API 응답 중첩 제거 (`result.result` → `result`)
  - 프론트엔드 방어적 result 접근
  - 만세력 422 에러 친절한 메시지 ("먼저 기본 분석을 완료해주세요")

### v1.32.0 (2026-01-07)
- **상담 세션 크레딧 시스템**
  - 세션당 2라운드 제한 (기존 5라운드)
  - 크레딧 확인 팝업 추가 (`CreditDeductionDialog`)
  - `credit_transactions` insert 코드 제거
- **상담 AI 중복 응답 버그 수정** (3계층 방어)
  - `src/hooks/use-consultation.ts`: `isSubmittingRef` 패턴 추가
  - `python/services/consultation_service.py`: OCC 패턴 (status 조건)
  - `src/components/consultation/ChatArea.tsx`: 레이스 컨디션 해결

### v1.31.0 (2026-01-05)
- **크레딧 가격 변경**
  - 사주 기본 분석: 50C → 70C
  - 프로필 리포트: 50C → 70C
  - 궁합 분석: 50C → 70C
  - 신년 분석: 30C → 50C

### v1.30.0 (2026-01-05)
- **Crisp 실시간 채팅 도입**
  - `crisp-sdk-web` 패키지 설치
  - `src/components/crisp-chat.tsx` 컴포넌트 생성
  - `src/lib/providers.tsx`에 CrispChat 추가
  - 환경변수: `NEXT_PUBLIC_CRISP_WEBSITE_ID`
  - 다국어 자동 연동 (next-intl 로케일 사용)
