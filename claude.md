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
| AI | Gemini 3.0 Pro |
| Payment | Stripe |
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
| `docs/todo_v2.md` | 작업 체크리스트 |
| `docs/api.md` | API 명세 |
| `docs/fortune_engine.md` | 사주 분석 엔진 |

## 핵심 기능

### 분석 파이프라인

```
[만세력] → [지장간] → [기본분석] → [성격/적성/재물] → [점수] → [시각화]
  Python    Python     Gemini        Gemini (병렬)     TypeScript   Python
```

### 크레딧 시스템

| 서비스 | 크레딧 |
|--------|--------|
| 리포트 생성 | 50C |
| 섹션 재분석 | 5C |
| AI 질문 | 10C |

### 점수 계산 (v2.1)

- 공식: `50 + Σ(modifier × tenGodCount)` → clamp(0, 100)
- Modifier 범위: max ±11 (v2.0 ±15에서 축소)
- 목표 분포: 10~90점 골고루 분포, 0점/100점 극단값 회피

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

**Version**: 1.29.0
**Last Updated**: 2026-01-05 (대운 십신 계산 및 상세 분석 UI 구현)
