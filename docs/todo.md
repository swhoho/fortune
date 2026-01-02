# Master's Insight AI - 개발 TODO

**프로젝트**: 글로벌 사주 분석 웹 서비스  
**작성일**: 2026.01.02  
**예상 기간**: 12주 (3 Phases)

---

## 📊 전체 진행 현황

- [ ] Phase 1: MVP (4주) - Task 1~11 완료 (Task 8, 12 진행 중)
- [ ] Phase 2: 글로벌 확장 (4주) - Task 13, 14, 15, 16, 17, 18 완료
- [ ] Phase 3: 최적화 및 확장 (4주) - 미시작

---

## 🚀 Phase 1: MVP (Week 1-4)

### Task 1: 프로젝트 초기 설정 ✅
- [x] 1.1 Next.js 14 프로젝트 생성 (App Router)
- [x] 1.2 Tailwind CSS + shadcn/ui 설정
- [x] 1.3 환경 변수 설정 (.env.local)
- [x] 1.4 Git 저장소 초기화 및 .gitignore 설정
- [x] 1.5 Vercel 프로젝트 연결
  - [x] GitHub 저장소 Import
  - [ ] 환경 변수 설정 (NEXT_PUBLIC_APP_URL, SUPABASE 등)
- [x] 1.6 ESLint, Prettier 설정
- [x] 1.7 TypeScript 엄격 모드 설정

**참고**: PRD 섹션 11 (기술 스택)

---

### Task 2: 데이터베이스 및 인증 설정 ✅
- [x] 2.1 Supabase 프로젝트 생성
- [x] 2.2 Prisma 스키마 작성
  - [x] User 모델
  - [x] Analysis 모델
  - [x] Question 모델
  - [x] Purchase 모델
- [x] 2.3 Prisma 마이그레이션 실행 (Supabase MCP로 적용)
- [x] 2.4 ~~NextAuth.js 설정~~ -> Supabase Auth (@supabase/ssr)로 변경
  - [x] 이메일 로그인/회원가입 재구현
  - [x] Google 로그인 추가
  - [x] 미들웨어 통합 (`updateSession`)
- [x] 2.5 미들웨어 인증 가드 설정

**참고**: PRD 부록 A (데이터베이스 스키마)

---

### Task 3: 온보딩 화면 개발 ✅
- [x] 3.1 랜딩 페이지 (/)
  - [x] 한지 질감 배경 적용
  - [x] 먹 번짐 애니메이션 (Framer Motion)
  - [x] 헤드라인 타이포그래피
  - [x] CTA 버튼
- [x] 3.2 온보딩 화면 1: 스토리텔링 (/onboarding/step1)
  - [x] 애니메이션 영역
  - [x] 스토리 카피 표시
  - [x] 진행 바 컴포넌트
- [x] 3.3 온보딩 화면 2: 입력 폼 (/onboarding/step2)
  - [x] 생년월일 입력
  - [x] 양력/음력 토글
  - [x] 시간대 드롭다운 (GMT 선택)
  - [x] 성별 선택
  - [x] 유효성 검사
- [x] 3.4 온보딩 화면 3: 가치 제안 (/onboarding/step3)
  - [x] 타임라인 일러스트
  - [x] 혜택 리스트
  - [x] Framer Motion 애니메이션

**참고**: PRD 섹션 5.1-5.3 (온보딩 화면)

---

### Task 4: 분석 요청 플로우 ✅
- [x] 4.1 상세 정보 입력 (/analysis/focus)
  - [x] 카드 선택형 UI (재물/사랑/커리어/건강/종합)
  - [x] 선택 상태 관리 (Zustand)
- [x] 4.2 고민 입력 화면 (/analysis/question)
  - [x] 텍스트 입력 영역 (500자 제한)
  - [x] 예시 질문 자동 제안
  - [x] "고민 없음" 체크박스
- [x] 4.3 결제 화면 (/payment)
  - [x] 서비스 요약 카드
  - [x] 크레딧 패키지 선택
  - [x] Stripe Checkout 통합
- [x] 4.4 결제 API (/api/payment)
  - [x] POST /api/payment/create-checkout-session
  - [x] POST /api/payment/webhook
  - [x] /payment/success 페이지

**참고**: PRD 섹션 5.4-5.6 (분석 요청 화면)

---

### Task 5: 만세력 계산 엔진 (Python) ✅
- [x] 5.1 FastAPI 프로젝트 생성
- [x] 5.2 ManseryeokEngine 클래스 구현
  - [x] 음력→양력 변환 (lunar-python 라이브러리)
  - [x] 시간대 보정 로직
  - [x] 연주 계산 (입춘 기준)
  - [x] 월주 계산 (절입 고려)
  - [x] 일주 계산 (자시 기준)
  - [x] 시주 계산
- [x] 5.3 대운 계산 로직
  - [x] 양남음녀/음남양녀 순역 판단
  - [x] 10년 단위 대운 생성
- [x] 5.4 지장간 추출 로직
- [x] 5.5 API 엔드포인트 작성
  - [x] POST /api/manseryeok/calculate
  - [x] 입력 검증 (Pydantic)
- [x] 5.6 단위 테스트 작성 (12개 테스트 통과)
- [x] 5.7 Railway 배포 설정 (Dockerfile 작성 완료)

**참고**: PRD 섹션 6.2 Step 1 (만세력 엔진)

---

### Task 6: Gemini API 통합 ✅
- [x] 6.1 Google AI Studio API 키 발급
- [x] 6.2 SajuAnalyzer 클래스 구현
  - [x] Gemini 3.0 Pro 모델 초기화 (`gemini-3-pro-preview`)
  - [x] 프롬프트 생성 함수
  - [x] JSON 파싱 로직
- [x] 6.3 프롬프트 엔지니어링
  - [x] 시스템 프롬프트 작성
  - [x] 출력 JSON 스키마 정의
  - [x] 언어별 프롬프트 템플릿 (한국어만 우선)
- [x] 6.4 API 엔드포인트
  - [x] POST /api/analysis/gemini
  - [x] 타임아웃 처리 (30초)
  - [x] 에러 핸들링
- [ ] 6.5 응답 캐싱 (Redis) - 추후 구현

**참고**: PRD 섹션 6.2 Step 3 (Gemini AI 분석)

---

### Task 7: 시각화 생성 ✅
- [x] 7.1 SajuVisualizer 클래스 구현 (Python)
  - [x] PIL 설정 (Pillow 12.0.0)
  - [x] 한자 폰트 로드 (시스템 폰트 폴백 전략)
- [x] 7.2 사주 명반 이미지 생성
  - [x] 4개 기둥 카드 레이아웃 (800x400px)
  - [x] 오행별 색상 매핑 (木/火/土/金/水)
  - [x] PNG 출력 (Base64 인코딩)
- [ ] 7.3 Supabase 업로드 로직 (Phase 2)
- [x] 7.4 API 엔드포인트
  - [x] POST /api/visualization/pillar (11개 테스트 통과)

**참고**: PRD 섹션 6.2 Step 4 (시각화), 섹션 7.1 (사주 명반)

---

### Task 8: 결과 화면 ✅
- [x] 8.1 분석 진행 중 화면 (/analysis/processing)
  - [x] 로딩 애니메이션 (한자 회전)
  - [x] 진행 단계 표시 (5단계)
  - [x] 명리학 팁 로테이션 (5초)
  - [x] 에러 처리 및 재시도 버튼
- [x] 8.2 결과 화면 상단 (/analysis/result/[id])
  - [x] 사주 명반 이미지 표시 (PillarCard)
  - [x] 클릭 시 상세 모달 (PillarDetailModal)
- [x] 8.3 결과 화면 중단
  - [x] 오행 비율 차트 (Recharts BarChart)
  - [x] D3.js 상생상극 관계도 (ElementRelationGraph)
- [x] 8.4 결과 화면 하단
  - [x] 탭 메뉴 (총운/성격/재물/사랑/건강)
  - [x] AI 분석 텍스트 표시 (AnalysisSection)
  - [x] 마크다운 렌더링 (react-markdown)
  - [x] 점수 프로그레스 바
  - [x] 고전 인용 표시
- [x] 8.5 10년 대운 타임라인
  - [x] Recharts AreaChart
  - [x] 호버 툴팁
  - [x] 대운 카드 목록

**참고**: PRD 섹션 5.7-5.8 (분석 진행 및 결과 화면)

**구현 파일**:
- `/src/components/analysis/` - 8개 컴포넌트 (PillarDetailModal, ElementRelationGraph 추가)
- `/src/app/analysis/processing/page.tsx`
- `/src/app/analysis/result/[id]/page.tsx`
- `/src/stores/analysis.ts` - 상태 확장
- `/src/lib/constants/colors.ts` - 오행 색상

---

### Task 9: 결제 시스템 ✅ (Task 4에서 구현됨)
- [x] 9.1 Stripe 계정 생성 (Test Mode)
- [x] 9.2 Stripe Checkout Session API
  - [x] POST /api/payment/create-checkout-session
  - [x] 크레딧 금액 매핑
- [x] 9.3 Webhook 엔드포인트
  - [x] POST /api/payment/webhook
  - [x] 서명 검증
  - [x] 크레딧 충전 로직
  - [x] Purchase 레코드 생성
- [x] 9.4 결제 성공 페이지 (/payment/success)
- [ ] 9.5 결제 실패 페이지 (/payment/cancel)

**참고**: PRD 섹션 9.1 (크레딧 시스템)

---

### Task 10: 마이페이지 (기본) ✅
- [x] 10.1 프로필 섹션 (/mypage)
  - [x] 사용자 정보 표시
  - [x] 보유 크레딧 표시
  - [x] 크레딧 충전 버튼
- [x] 10.2 분석 기록 리스트
  - [x] 날짜별 정렬
  - [x] 카드 레이아웃
  - [x] [결과 보기] 링크
- [x] 10.3 API 엔드포인트
  - [x] GET /api/analysis/list
  - [x] GET /api/user/profile

**참고**: PRD 섹션 5.9 (마이페이지)

---

### Task 11: 통합 테스트 및 QA ✅
- [x] 11.1 E2E 테스트 (Playwright)
  - [x] 온보딩 플로우 (`tests/e2e/onboarding.spec.ts`)
  - [x] 분석 요청 플로우 (`tests/e2e/analysis.spec.ts`)
  - [x] 결제 플로우 (`tests/e2e/payment.spec.ts`)
- [x] 11.2 단위 테스트 (Vitest)
  - [x] 만세력 계산 로직 (Python pytest 25개)
  - [x] 유효성 검사 함수 (`tests/unit/lib/validation.test.ts`)
  - [x] Zustand 스토어 (`tests/unit/stores/analysis.test.ts`)
- [x] 11.3 성능 테스트
  - [x] Lighthouse CI 설정 (`lighthouserc.js`)
- [x] 11.4 크로스 브라우저 테스트 (Playwright projects)
  - [x] Chrome (chromium)
  - [x] Safari (webkit)
  - [x] Firefox
- [x] 11.5 모바일 반응형 테스트 (Playwright projects)
  - [x] iOS Safari (iPhone 12)
  - [x] Android Chrome (Pixel 5)

**테스트 실행**:
- `npm run test:unit` - 단위 테스트
- `npm run test:e2e` - E2E 테스트
- `npm run test:lighthouse` - 성능 테스트

---

## 🌍 Phase 2: 글로벌 확장 (Week 5-8)

### Task 13: i18n 구현 ✅
- [x] 13.1 next-intl 설정 (next-i18next 대신 App Router 최적화된 next-intl 사용)
- [x] 13.2 번역 파일 작성
  - [x] locales/ko.json
  - [x] locales/en.json
  - [x] locales/ja.json
  - [x] locales/zh.json
- [x] 13.3 언어 전환 UI
  - [x] 헤더 언어 드롭다운 (LanguageSwitcher 컴포넌트)
  - [x] URL 기반 언어 감지 (/en, /ja, /zh)
- [x] 13.4 명리 용어 매핑
  - [x] 한영일중 용어 사전 (locales/*.json 내 saju 섹션)
- [ ] 13.5 동적 폰트 로드 (Phase 2에서 추가 작업 필요)
  - [ ] Noto Serif KR/JP/SC

**참고**: PRD 섹션 8 (i18n 전략)

---

<!-- ⚠️ Task 14 수정됨 (2026.01.02)
     기존: RAG 시스템 구축 (Pinecone + OpenAI Embedding)
     변경: 프롬프트 엔지니어링 고도화
     사유: MVP 단계에서 RAG는 오버엔지니어링. 
           Gemini가 이미 명리학 고전 학습됨.
           프롬프트 최적화로 동등 이상의 품질 달성 가능.
           필요시 Phase 3에서 Supabase pgvector로 경량 도입 검토.
-->
### Task 14: 명리학 프롬프트 엔지니어링 (RAG 대체) ✅
- [x] 14.1 마스터 시스템 프롬프트 작성
  - [x] 명리학 전문가 페르소나 정의
  - [x] 분석 철학 및 원칙 명시
  - [x] 출력 톤앤매너 가이드라인
- [x] 14.2 자평진전(子平真詮) 핵심 원리 삽입
  - [x] 용신(用神) 선정 원칙
  - [x] 격국(格局) 판단 기준
  - [x] 십신(十神) 해석 프레임워크
  - [x] 합충형파해(合沖刑破害) 관계 정리
- [x] 14.3 궁통보감(窮通寶鑑) 조후론 삽입
  - [x] 계절별 오행 강약 해석
  - [x] 조후(調候) 용신 원리
  - [x] 월령(月令)에 따른 희기신(喜忌神) 판단
- [x] 14.4 The Destiny Code 서구권 프레임워크
  - [x] 영어권 사용자 친화적 용어 매핑
  - [x] 현대적 비유 및 설명 방식
  - [x] 실용적 조언 스타일 가이드
- [x] 14.5 언어별 프롬프트 최적화
  - [x] 한국어: 자평진전 용어 중심
  - [x] 일본어: 四柱推命 용어 적용
  - [x] 중국어: 원문 고전 용어 활용
  - [x] 영어: The Destiny Code 스타일

**참고**: PRD 섹션 6.2 Step 2-3, 프로젝트 파일 내 고전 서적 txt 활용
**비고**: RAG 필요시 Phase 3에서 Supabase pgvector로 경량 구현 검토

---

### Task 15: 고급 시각화 ✅
- [x] 15.1 오행 관계도 (D3.js 완성)
  - [x] 5개 노드 원형 배치
  - [x] 상생/상극 화살표
  - [x] 호버 인터랙션
  - [x] 툴팁
- [x] 15.2 React Flow 통합 (선택) - D3.js 사용으로 스킵
- [x] 15.3 SVG 출력 및 저장
- [x] 15.4 대운 타임라인 고도화
  - [x] 연도별 길흉 점수
  - [x] 클릭 시 상세 정보 (아코디언 확장)

**참고**: PRD 섹션 7.2-7.3 (시각화)

**구현 파일**:
- `src/lib/utils/svg-download.ts` - SVG 다운로드 유틸리티
- `src/components/analysis/ElementRelationGraph.tsx` - D3.js 오행 관계도 + 다운로드 버튼
- `src/components/analysis/DaewunTimeline.tsx` - 대운 아코디언 확장

---

### Task 16: AI 후속 질문 기능 ✅
- [x] 16.1 질문 입력 UI (/analysis/result/[id])
  - [x] 텍스트 영역 (500자 제한)
  - [x] [질문하기] 버튼
  - [x] 크레딧 확인 및 표시
- [x] 16.2 API 엔드포인트
  - [x] POST /api/analysis/save - 분석 결과 DB 저장
  - [x] GET /api/analysis/:id - 분석 결과 + 질문 히스토리 조회
  - [x] POST /api/analysis/:id/question - 후속 질문 처리
  - [x] 컨텍스트 유지 (이전 분석 + 질문 히스토리)
- [x] 16.3 질문 기록 표시
  - [x] Q&A 스레드 형태 (채팅 UI)
  - [x] 타임스탬프
- [x] 16.4 크레딧 차감 로직 (10 크레딧/질문)

**참고**: PRD 섹션 5.8.4 (AI 추가 질문)

**구현 파일**:
- `/src/app/api/analysis/save/route.ts` - 분석 저장 API
- `/src/app/api/analysis/[id]/route.ts` - 분석 조회 API
- `/src/app/api/analysis/[id]/question/route.ts` - 후속 질문 API
- `/src/components/analysis/FollowUpQuestion.tsx` - Q&A UI 컴포넌트
- `/src/lib/ai/analyzer.ts` - followUp 메서드 추가
- `/src/lib/ai/prompts.ts` - generateFollowUpPrompt 함수
- `/src/lib/ai/types.ts` - FollowUpInput/Response 타입
- `/src/stores/analysis.ts` - 질문 상태 관리

---

### Task 17: 마이페이지 확장 ✅
- [x] 17.1 사이드바 메뉴
  - [x] 분석 기록
  - [x] 질문 기록
  - [x] 알림
  - [x] 설정
- [x] 17.2 질문 기록 탭
  - [x] 분석별 그룹화
  - [x] 검색 기능
- [x] 17.3 알림 설정
  - [x] 이메일 알림 On/Off
  - [x] 신년 사주 리마인더
- [x] 17.4 프로필 수정
  - [x] PATCH /api/user/profile

**참고**: PRD 섹션 5.9 (마이페이지)

---

### Task 18: 다국어 프롬프트 최적화 ✅
- [x] 18.1 영어 프롬프트 작성
  - [x] The Destiny Code 기반
  - [x] PRD 스타일 십신 용어 (Companion, Creative Output, Direct Resource 등)
  - [x] 서구권 용어 사용 & 이해하기 쉽게 풀이 설명
- [x] 18.2 일본어 프롬프트 작성
  - [x] 四柱推命 용어 & 이해하기 쉽게 풀이 설명
- [x] 18.3 중국어 프롬프트 작성
  - [x] zh-CN (간체) / zh-TW (번체) 분리
  - [x] 이해하기 쉽게 풀이 설명
- [x] 18.4 한국어
  - [x] 자평진전/궁통보감 용어 & 이해하기 쉽게 풀이 설명
- [x] 18.5 자평진전/궁통보감 다국어화 (고전 핵심 원리)
  - [x] 용신 5원칙 (억부/조후/통관/병약/전왕) 5개 언어
  - [x] 격국 8격 5개 언어
  - [x] 십신 해석 5개 언어
  - [x] 계절별 오행/조후 4원리 5개 언어
- [x] 18.6 프롬프트 빌더 통합 (builder.py)
- [x] 18.7 프론트엔드 i18n 설정 (routing.ts)
- [x] 18.8 단위 테스트 작성 (40개 테스트 통과)

**구현 파일**:
- `/python/prompts/locales/` - en.py, zh_cn.py, zh_tw.py 등 (십신 용어 수정)
- `/python/prompts/classics/ziping.py` - 5개 언어 다국어화
- `/python/prompts/classics/qiongtong.py` - 5개 언어 다국어화
- `/python/prompts/builder.py` - zh-CN/zh-TW 분리, _normalize_language()
- `/src/i18n/routing.ts` - locales 배열 (ko, en, ja, zh-CN, zh-TW)
- `/locales/zh-CN.json`, `/locales/zh-TW.json` - 중국어 간체/번체 분리
- `/python/tests/test_prompts.py` - 다국어 프롬프트 테스트 (40개)

**참고**: PRD 섹션 8.1 (언어별 용어 매핑)

---

### Task 19: SEO 최적화 ✅
- [x] 19.1 메타 태그 설정
  - [x] title, description (5개 언어)
  - [x] OG 태그 (title, description, url, siteName, locale, images)
  - [x] Twitter 카드 (summary_large_image)
  - [x] Canonical URL (로케일별)
  - [x] Alternates (hreflang 자동 생성)
- [x] 19.2 sitemap.xml 생성 (`/src/app/sitemap.ts`)
  - [x] 공개 페이지 5개 × 5개 로케일 = 25개 URL
  - [x] hreflang alternate 링크 포함
- [x] 19.3 robots.txt (`/src/app/robots.ts`)
  - [x] 크롤링 규칙 (API, auth, mypage, payment 제외)
- [x] 19.4 구조화된 데이터 (JSON-LD)
  - [x] WebApplication 스키마
  - [x] Service 스키마
  - [x] FAQPage 스키마 (5개 언어)
- [x] 19.5 다국어 hreflang 태그
  - [x] sitemap.xml에서 alternates.languages 생성
  - [x] layout.tsx에서 metadata.alternates 설정
- [ ] 19.6 Google Search Console 연동 (배포 후)
- [x] 19.7 페이지 속도 최적화
  - [x] 이미지 최적화 (`next.config.mjs` - avif, webp 포맷)
  - [x] 폰트 로딩 (`localFont` + `display: swap`)
  - [x] 압축 활성화 (`compress: true`)

**구현 파일**:
- `/src/app/robots.ts` - robots.txt 생성
- `/src/app/sitemap.ts` - sitemap.xml 생성 (hreflang 포함)
- `/src/app/[locale]/layout.tsx` - 메타데이터 확장 (Twitter, OG, Canonical, Alternates)
- `/src/components/seo/JsonLd.tsx` - JSON-LD 구조화 데이터 (3종)
- `/next.config.mjs` - 이미지 최적화, 압축 설정

---

## 📈 Phase 3: 최적화 및 확장 (Week 9-12)

### Task 20: 신년 사주 분석 ✅
- [x] 20.1 신년 분석 페이지 (/analysis/yearly)
- [x] 20.2 연도 입력 UI (YearSelector 컴포넌트)
- [x] 20.3 월별 흐름 프롬프트 작성 (python/prompts/yearly_prompt.py)
- [x] 20.4 Gemini API 호출 (연도 중심, analyzeYearly())
- [x] 20.5 월별 타임라인 차트 (MonthlyTimeline 컴포넌트)
- [x] 20.6 길흉일 캘린더 표시 (LuckyDaysCalendar 컴포넌트)
- [x] 20.7 API 엔드포인트
  - [x] POST /api/analysis/yearly
  - [x] GET /api/analysis/yearly/[id]
  - [x] POST /api/prompts/build/yearly (Python)
- [x] 20.8 추가 컴포넌트
  - [x] QuarterlyOverview - 분기별 카드
  - [x] YearlyAdviceCard - 분야별 조언
- [x] 20.9 DB 테이블 생성 (yearly_analyses)
- [x] 20.10 i18n 번역 (ko, en, ja, zh-CN, zh-TW)

**참고**: PRD 섹션 9.1 (서비스 가격표)

---

### Task 21: 에러 처리 및 로깅 (추후 진행)
- [ ] 21.1 전역 에러 핸들러
- [ ] 21.2 사용자 친화적 에러 메시지
  - [ ] 만세력 계산 실패
  - [ ] Gemini API 타임아웃
  - [ ] 결제 실패
- [ ] 21.3 에러 페이지 커스터마이징
  - [ ] 404
  - [ ] 500
- [ ] 21.4 상세 로깅
  - [ ] 사용자 액션
  - [ ] API 호출
  - [ ] 에러 스택

---

### Task 22: 배포 및 모니터링
- [ ] 22.1 Vercel 프로덕션 배포
- [ ] 22.2 도메인 연결
- [ ] 22.3 SSL 인증서 확인
- [ ] 22.4 Vercel Analytics 설정
- [ ] 22.5 로그 수집 (LogRocket)

---

---


## 🔥 긴급 버그/이슈 트래킹

### Critical
- [ ] 

### High
- [ ] 

### Medium
- [ ] 

### Low
- [ ] 

---

## 📚 참고 문서

- [PRD 전체 문서](./saju_service_prd.md)
- Gemini API Docs: https://ai.google.dev/docs
- Stripe Docs: https://stripe.com/docs
- Pinecone Docs: https://docs.pinecone.io
- Next.js Docs: https://nextjs.org/docs

---

**최종 수정일**: 2026.01.03 (Task 19 SEO 최적화 완료 - robots, sitemap, metadata, JSON-LD)
