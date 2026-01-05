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
| Auth | NextAuth.js |
| AI | Gemini 3.0 Flash + Pinecone (RAG) |
| Payment | Stripe |
| Infra | Vercel + Railway (Python API) |

## 프로젝트 구조

```
masters-insight/
├── claude.md              # 프로젝트 가이드 (이 파일)
├── docs/                  # 문서
│   ├── prd.md             # 제품 요구사항서
│   ├── todo.md            # 작업 체크리스트
│   └── api.md             # API 명세
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (marketing)/   # 마케팅 페이지
│   │   ├── (app)/         # 메인 앱 (인증 필요)
│   │   ├── auth/          # 인증 (signin, signup, error)
│   │   ├── onboarding/    # 온보딩 (step1, step2, step3)
│   │   ├── analysis/      # 분석 플로우
│   │   ├── payment/       # 결제
│   │   └── api/           # API Routes (auth, analysis, payment)
│   ├── components/
│   │   ├── ui/            # shadcn/ui
│   │   ├── analysis/      # 분석 관련
│   │   ├── visualization/ # 시각화 (D3, Recharts)
│   │   └── layout/        # 레이아웃
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
│   └── prompts/           # AI 프롬프트
└── locales/               # i18n (ko, en, ja, zh)
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
| 전체 사주 분석 | 70 C | $7.00 |
| 신년 사주 분석 | 50 C | $5.00 |
| 궁합 분석 | 70 C | $7.00 |
| AI 추가 질문 | 10 C | $1.00 |
| 섹션 재분석 | 5 C | $0.50 |

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
```

## Deployment (배포)

### 1. Backend (Railway)
1. Railway에서 `New Project` > `GitHub Repo` > `fortune` 선택
2. **Settings > General > Root Directory**를 `/python`으로 변경 (필수!)
3. 자동 빌드 후 생성된 URL 복사 (예: `https://fortune-api.up.railway.app`)

### 2. Frontend (Vercel)
1. Vercel에서 `Add New Project` > `fortune` 선택
2. Environment Variables 설정
   - `.env.example`의 모든 변수 추가
   - `PYTHON_API_URL`: 위에서 복사한 Railway URL 입력
3. Deploy 클릭

## 주요 참고 자료

- 자평진전(子平真詮): 청대 명리학 핵심 고전
- 궁통보감(窮通寶鑑): 조후론 중심 고전
- The Destiny Code: 서구권 사주 해석 프레임워크

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-02
