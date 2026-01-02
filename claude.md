# Master's Insight AI

> 30년 명리학 거장이 인정한 AI 사주 분석 서비스

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (client) + TanStack Query (server) |
| Database | PostgreSQL + Prisma (Supabase) |
| Auth | Supabase Auth (@supabase/ssr) |
| AI | Gemini 3.0 Pro (`gemini-3-pro-preview`) |
| Visualization | D3.js + Recharts |
| Payment | Stripe |
| i18n | next-intl (ko, en, ja, zh-CN, zh-TW) |
| Testing | Vitest + Playwright + pytest |
| Infra | Vercel (Frontend) + Railway (Backend) |

## 배포 가이드 (Deployment)

### 아키텍처
- **Frontend (Next.js)**: Vercel 배포
  - Root Directory: `.` (Project Root)
  - Env Vars: `PYTHON_API_URL`을 Railway 배포 URL로 설정
- **Backend (Python)**: Railway 배포
  - Root Directory: `/python` (설정에서 변경 필수)
  - Dockerfile 자동 감지
  - Env Vars: `PORT` (Railway 자동 주입)

## 프로젝트 구조

```
masters-insight/
├── claude.md              # 프로젝트 가이드 (이 파일)
├── docs/                  # 문서
│   ├── prd.md             # 제품 요구사항서
│   ├── todo.md            # 작업 체크리스트
│   └── api.md             # API 명세
├── src/
│   ├── app/
│   │   ├── layout.tsx     # 루트 레이아웃 (최소화)
│   │   ├── robots.ts      # SEO: robots.txt 생성
│   │   ├── sitemap.ts     # SEO: sitemap.xml 생성 (hreflang)
│   │   ├── [locale]/      # 다국어 라우팅 (ko, en, ja, zh-CN, zh-TW)
│   │   │   ├── layout.tsx # 로케일 레이아웃 + 메타데이터
│   │   │   ├── page.tsx   # 랜딩 페이지
│   │   │   ├── auth/      # 인증 (signin, signup, error)
│   │   │   ├── onboarding/# 온보딩 (step1, step2, step3)
│   │   │   ├── analysis/  # 분석 플로우
│   │   │   ├── payment/   # 결제
│   │   │   └── mypage/    # 마이페이지
│   │   └── api/           # API Routes (locale 밖에 위치)
│   ├── i18n/              # i18n 설정
│   │   ├── routing.ts     # 라우팅 설정, Link/useRouter 헬퍼
│   │   └── request.ts     # 서버 요청 설정
│   ├── components/
│   │   ├── ui/            # shadcn/ui
│   │   ├── analysis/      # 분석 관련
│   │   ├── seo/           # SEO (JSON-LD 구조화 데이터)
│   │   ├── visualization/ # 시각화 (D3, Recharts)
│   │   └── language-switcher.tsx # 언어 전환 UI
│   ├── lib/
│   │   ├── saju/          # 만세력 계산
│   │   ├── ai/            # Gemini, RAG
│   │   ├── supabase/      # Supabase 클라이언트
│   │   └── utils/         # 유틸리티
│   ├── hooks/
│   ├── stores/            # Zustand
│   └── types/
├── python/                # Python 백엔드 (FastAPI)
│   ├── manseryeok/        # 만세력 엔진
│   ├── visualization/     # 이미지 생성
│   ├── prompts/           # AI 프롬프트
│   └── tests/             # Python 테스트 (pytest)
├── tests/                 # TypeScript 테스트
│   ├── e2e/               # Playwright E2E 테스트
│   └── unit/              # Vitest 단위 테스트
└── locales/               # i18n 번역 파일
    ├── ko.json            # 한국어 (기본)
    ├── en.json            # 영어
    ├── ja.json            # 일본어
    ├── zh-CN.json         # 중국어 간체
    └── zh-TW.json         # 중국어 번체
```

## 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| PRD | `docs/prd.md` | 제품 요구사항서 (전체 기획) |
| TODO | `docs/todo.md` | 작업 체크리스트 (Phase 1-3) |
| API | `docs/api.md` | REST API 명세 |
| Fortune Engine | `docs/fortune_engine.md` | 사주 분석 엔진 핵심 문서 (파이프라인, 만세력, RAG, AI 프롬프트, 시각화) |

## 개발 가이드라인

### 1. 작업 완료 시 문서 업데이트 (필수)

개발 완료 후 반드시 아래 문서들을 업데이트:

```
1. docs/todo.md            - 완료 항목 체크 [x]
2. docs/api.md             - 새 API 추가/변경 시
3. docs/fortune_engine.md  - 엔진 로직 수정/변경 시 (필수!)
4. claude.md               - 구조 변경, 핵심 기능 추가 시
```

### 2. Fortune Engine 문서 관리 (중요)

**`docs/fortune_engine.md`는 사주 분석 엔진의 핵심 문서입니다.**

다음 작업 시 반드시 해당 문서를 업데이트하세요:

- 만세력 계산 로직 수정 (연/월/일/시주, 대운, 지장간)
- RAG 시스템 변경 (임베딩, 청크 전략, 검색 로직)
- AI 프롬프트 수정 (시스템 프롬프트, 출력 스키마)
- 시각화 스펙 변경 (명반, 오행도, 대운 차트)
- 분석 파이프라인 흐름 변경
- 품질 이슈 발생 및 해결 시 → 이슈 트래킹 섹션에 기록

### 3. 사용할 스킬/플러그인

| 작업 유형 | 사용 스킬 |
|----------|----------|
| 프론트엔드 UI/UX | `frontend-design` @ claude-plugins-official |
| 코드 리뷰/확인 | `todowrite` & `gemini-claude-loop` |
| 문서 작성 | `docx`, `pdf` 스킬 |

### 4. Context Engineering 원칙

- **문서 우선**: 코드 작성 전 관련 문서 확인
- **핵심만 기록**: 추후 개발에 꼭 필요한 내용만 문서화
- **지속적 업데이트**: 매 작업 완료 시 문서 동기화

## 핵심 기능

### 사주 분석 파이프라인

```
[사용자 입력] → [만세력 계산] → [RAG 검색] → [Gemini 분석] → [시각화] → [결과]
     ↓              ↓              ↓             ↓            ↓
  생년월일      Python API    Pinecone     프롬프트     PIL/D3.js
  시간대        절입 계산      고전 검색    JSON 출력    이미지 생성
```

### 크레딧 시스템

| 서비스 | 크레딧 | USD |
|--------|--------|-----|
| 전체 사주 분석 | 30 C | $3.00 |
| 신년 사주 분석 | 30 C | $3.00 |
| 궁합 분석 | 50 C | $5.00 |
| AI 추가 질문 | 10 C | $1.00 |

## 컬러 시스템

| Color | Hex | 용도 |
|-------|-----|------|
| Primary (금색) | `#d4af37` | 메인 액센트, CTA |
| Secondary (먹색) | `#1a1a1a` | 배경, 텍스트 |
| Background | `#f8f8f8` | 메인 배경 |

### 오행 색상

| 오행 | 색상 | Hex |
|------|------|-----|
| 木 | Green | `#4ade80` |
| 火 | Red | `#ef4444` |
| 土 | Amber | `#f59e0b` |
| 金 | Gray | `#e5e7eb` |
| 水 | Blue | `#1e3a8a` |

## 테스트 (Testing)

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
npm run test:e2e              # 전체 브라우저 (Chrome, Firefox, Safari, Mobile)
npm run test:e2e:chromium     # Chromium만
npm run test:e2e:headed       # UI 모드
npm run test:e2e:ui           # Playwright UI

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
├── setup.ts                    # Vitest 설정
├── e2e/                        # E2E 테스트
│   ├── onboarding.spec.ts      # 온보딩 플로우 (10개)
│   ├── analysis.spec.ts        # 분석 플로우 (11개)
│   ├── payment.spec.ts         # 결제 플로우 (9개)
│   └── fixtures/test-data.ts   # 테스트 데이터
└── unit/                       # 단위 테스트
    ├── lib/validation.test.ts  # Zod 스키마 검증 (15개)
    └── stores/analysis.test.ts # Zustand 스토어 (14개)

python/tests/
├── test_engine.py              # 만세력 엔진 (14개)
└── test_visualization.py       # 시각화 (11개)
```

### 크로스 브라우저/모바일 테스트

Playwright 설정 (`playwright.config.ts`):
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5 (Android), iPhone 12 (iOS)

## Quick Start

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev

# Python API 실행 (별도 터미널)
cd python && uvicorn main:app --reload

# 테스트 실행
npm run test:unit      # 단위 테스트
npm run test:e2e       # E2E 테스트
```

## 주요 참고 자료

- 자평진전(子平真詮): 청대 명리학 핵심 고전
- 궁통보감(窮通寶鑑): 조후론 중심 고전
- The Destiny Code: 서구권 사주 해석 프레임워크

---

**Version**: 1.9.0
**Last Updated**: 2026-01-03 (Task 19: SEO 최적화 - robots, sitemap, metadata, JSON-LD)
