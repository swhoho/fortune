# Master's Insight AI - 개발 TODO

**프로젝트**: 글로벌 사주 분석 웹 서비스  
**작성일**: 2026.01.02  
**예상 기간**: 12주 (3 Phases)

---

## 📊 전체 진행 현황

- [ ] Phase 1: MVP (4주) - 27/35 완료
- [ ] Phase 2: 글로벌 확장 (4주) - 0/28 완료
- [ ] Phase 3: 최적화 및 확장 (4주) - 0/22 완료

---

## 🚀 Phase 1: MVP (Week 1-4)

### Task 1: 프로젝트 초기 설정 ✅
- [x] 1.1 Next.js 14 프로젝트 생성 (App Router)
- [x] 1.2 Tailwind CSS + shadcn/ui 설정
- [x] 1.3 환경 변수 설정 (.env.local)
- [x] 1.4 Git 저장소 초기화 및 .gitignore 설정
- [ ] 1.5 Vercel 프로젝트 연결
  - [ ] GitHub 저장소 Import
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
- [x] 2.4 NextAuth.js 설정 (이메일 로그인)
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
- [ ] 7.3 AWS S3 업로드 로직 (Phase 2)
- [x] 7.4 API 엔드포인트
  - [x] POST /api/visualization/pillar (11개 테스트 통과)

**참고**: PRD 섹션 6.2 Step 4 (시각화), 섹션 7.1 (사주 명반)

---

### Task 8: 결과 화면
- [ ] 8.1 분석 진행 중 화면 (/analysis/processing)
  - [ ] 로딩 애니메이션 (한자 회전)
  - [ ] 진행 단계 표시
  - [ ] 명리학 팁 로테이션
- [ ] 8.2 결과 화면 상단 (/analysis/result/[id])
  - [ ] 사주 명반 이미지 표시
  - [ ] 클릭 시 상세 모달
- [ ] 8.3 결과 화면 중단
  - [ ] 오행 관계도 (D3.js - 간단 버전)
- [ ] 8.4 결과 화면 하단
  - [ ] 탭 메뉴 (총운/성격/재물/사랑/건강)
  - [ ] AI 분석 텍스트 표시
  - [ ] 마크다운 렌더링
- [ ] 8.5 10년 대운 타임라인
  - [ ] Recharts 라인 차트
  - [ ] 호버 툴팁

**참고**: PRD 섹션 5.7-5.8 (분석 진행 및 결과 화면)

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

### Task 11: 통합 테스트 및 QA
- [ ] 11.1 E2E 테스트 (Playwright)
  - [ ] 온보딩 플로우
  - [ ] 분석 요청 플로우
  - [ ] 결제 플로우
- [ ] 11.2 단위 테스트 (Jest)
  - [ ] 만세력 계산 로직
  - [ ] 유효성 검사 함수
- [ ] 11.3 성능 테스트
  - [ ] Lighthouse 점수 90+ 목표
- [ ] 11.4 크로스 브라우저 테스트
  - [ ] Chrome
  - [ ] Safari
  - [ ] Firefox
- [ ] 11.5 모바일 반응형 테스트
  - [ ] iOS Safari
  - [ ] Android Chrome

---

## 🌍 Phase 2: 글로벌 확장 (Week 5-8)

### Task 13: i18n 구현
- [ ] 13.1 next-i18next 설정
- [ ] 13.2 번역 파일 작성
  - [ ] locales/ko.json
  - [ ] locales/en.json
  - [ ] locales/ja.json
  - [ ] locales/zh.json
- [ ] 13.3 언어 전환 UI
  - [ ] 헤더 언어 드롭다운
  - [ ] URL 기반 언어 감지
- [ ] 13.4 명리 용어 매핑
  - [ ] 한영일중 용어 사전
- [ ] 13.5 동적 폰트 로드
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
### Task 14: 명리학 프롬프트 엔지니어링 (RAG 대체)
- [ ] 14.1 마스터 시스템 프롬프트 작성
  - [ ] 명리학 전문가 페르소나 정의
  - [ ] 분석 철학 및 원칙 명시
  - [ ] 출력 톤앤매너 가이드라인
- [ ] 14.2 자평진전(子平真詮) 핵심 원리 삽입
  - [ ] 용신(用神) 선정 원칙
  - [ ] 격국(格局) 판단 기준
  - [ ] 십신(十神) 해석 프레임워크
  - [ ] 합충형파해(合沖刑破害) 관계 정리
- [ ] 14.3 궁통보감(窮通寶鑑) 조후론 삽입
  - [ ] 계절별 오행 강약 해석
  - [ ] 조후(調候) 용신 원리
  - [ ] 월령(月令)에 따른 희기신(喜忌神) 판단
- [ ] 14.4 The Destiny Code 서구권 프레임워크
  - [ ] 영어권 사용자 친화적 용어 매핑
  - [ ] 현대적 비유 및 설명 방식
  - [ ] 실용적 조언 스타일 가이드
- [ ] 14.5 Few-shot 예시 구축
  - [ ] 고품질 분석 예시 5개 작성
  - [ ] 좋은 분석 vs 나쁜 분석 대비 예시
  - [ ] 포커스 영역별 예시 (재물/사랑/커리어/건강)
- [ ] 14.6 프롬프트 테스트 및 튜닝
  - [ ] 동일 사주 10회 분석 일관성 테스트
  - [ ] 전문가 검토 (가능시)
  - [ ] A/B 테스트용 프롬프트 버전 관리
- [ ] 14.7 언어별 프롬프트 최적화
  - [ ] 한국어: 자평진전 용어 중심
  - [ ] 일본어: 四柱推命 용어 적용
  - [ ] 중국어: 원문 고전 용어 활용
  - [ ] 영어: The Destiny Code 스타일

**참고**: PRD 섹션 6.2 Step 2-3, 프로젝트 파일 내 고전 서적 txt 활용
**비고**: RAG 필요시 Phase 3에서 Supabase pgvector로 경량 구현 검토

---

### Task 15: 고급 시각화
- [ ] 15.1 오행 관계도 (D3.js 완성)
  - [ ] 5개 노드 원형 배치
  - [ ] 상생/상극 화살표
  - [ ] 호버 인터랙션
  - [ ] 툴팁
- [ ] 15.2 React Flow 통합 (선택)
- [ ] 15.3 SVG 출력 및 저장
- [ ] 15.4 대운 타임라인 고도화
  - [ ] 연도별 길흉 점수
  - [ ] 클릭 시 상세 정보

**참고**: PRD 섹션 7.2-7.3 (시각화)

---

### Task 16: AI 후속 질문 기능
- [ ] 16.1 질문 입력 UI (/analysis/result/[id])
  - [ ] 텍스트 영역
  - [ ] [질문하기] 버튼
  - [ ] 크레딧 확인
- [ ] 16.2 API 엔드포인트
  - [ ] POST /api/analysis/:id/question
  - [ ] 컨텍스트 유지 (이전 분석 + 질문 히스토리)
- [ ] 16.3 질문 기록 표시
  - [ ] Q&A 스레드 형태
  - [ ] 타임스탬프
- [ ] 16.4 크레딧 차감 로직

**참고**: PRD 섹션 5.8.4 (AI 추가 질문)

---

### Task 17: 마이페이지 확장
- [ ] 17.1 사이드바 메뉴
  - [ ] 분석 기록
  - [ ] 질문 기록
  - [ ] 알림
  - [ ] 설정
- [ ] 17.2 질문 기록 탭
  - [ ] 분석별 그룹화
  - [ ] 검색 기능
- [ ] 17.3 알림 설정
  - [ ] 이메일 알림 On/Off
  - [ ] 신년 사주 리마인더
- [ ] 17.4 프로필 수정
  - [ ] PATCH /api/user/profile

**참고**: PRD 섹션 5.9 (마이페이지)

---

### Task 18: 다국어 프롬프트 최적화
- [ ] 18.1 영어 프롬프트 작성
  - [ ] The Destiny Code 기반
  - [ ] 서구권 용어 사용
- [ ] 18.2 일본어 프롬프트 작성
  - [ ] 四柱推命 용어
- [ ] 18.3 중국어 프롬프트 작성
  - [ ] 간체/번체 지원
- [ ] 18.4 언어별 테스트
  - [ ] 각 언어로 5건 이상 분석

**참고**: PRD 섹션 8.1 (언어별 용어 매핑)

---

### Task 19: SEO 최적화
- [ ] 19.1 메타 태그 설정
  - [ ] title, description
  - [ ] OG 태그
  - [ ] Twitter 카드
- [ ] 19.2 sitemap.xml 생성
- [ ] 19.3 robots.txt
- [ ] 19.4 구조화된 데이터 (JSON-LD)
- [ ] 19.5 다국어 hreflang 태그
- [ ] 19.6 Google Search Console 연동
- [ ] 19.7 페이지 속도 최적화
  - [ ] 이미지 최적화 (WebP)
  - [ ] 폰트 로딩 최적화
  - [ ] 코드 스플리팅

---

### Task 20: 통합 테스트 (글로벌)
- [ ] 20.1 언어별 E2E 테스트
- [ ] 20.2 시간대별 테스트
  - [ ] GMT+9 (한국/일본)
  - [ ] GMT+8 (중국)
  - [ ] GMT-5 (미국 동부)
- [ ] 20.3 크로스 컬처 UX 검증

---

## 📈 Phase 3: 최적화 및 확장 (Week 9-12)

### Task 21: 신년 사주 분석
- [ ] 21.1 신년 분석 페이지 (/analysis/yearly)
- [ ] 21.2 연도 입력 UI
- [ ] 21.3 월별 흐름 프롬프트 작성
- [ ] 21.4 Gemini API 호출 (연도 중심)
- [ ] 21.5 월별 타임라인 차트
- [ ] 21.6 길흉일 캘린더 표시
- [ ] 21.7 API 엔드포인트
  - [ ] POST /api/analysis/yearly

**참고**: PRD 섹션 9.1 (서비스 가격표)

---

### Task 22: 궁합 분석
- [ ] 22.1 궁합 페이지 (/analysis/compatibility)
- [ ] 22.2 2인 입력 폼
  - [ ] 본인 정보
  - [ ] 상대방 정보
- [ ] 22.3 궁합 분석 프롬프트
  - [ ] 일주 합/충 분석
  - [ ] 오행 조화
  - [ ] 관계 조언
- [ ] 22.4 궁합 점수 시각화
  - [ ] 레이더 차트 (6개 축)
- [ ] 22.5 API 엔드포인트
  - [ ] POST /api/analysis/compatibility

**참고**: PRD 섹션 9.1 (궁합 분석)

---

### Task 23: 에러 처리 및 로깅
- [ ] 23.1 전역 에러 핸들러
- [ ] 23.2 사용자 친화적 에러 메시지
  - [ ] 만세력 계산 실패
  - [ ] Gemini API 타임아웃
  - [ ] 결제 실패
- [ ] 23.3 에러 페이지 커스터마이징
  - [ ] 404
  - [ ] 500
- [ ] 23.4 상세 로깅
  - [ ] 사용자 액션
  - [ ] API 호출
  - [ ] 에러 스택

---

### Task 24: 배포 및 모니터링
- [ ] 24.1 Vercel 프로덕션 배포
- [ ] 24.2 도메인 연결
- [ ] 24.3 SSL 인증서 확인
- [ ] 24.4 Sentry 통합 (에러 모니터링)
- [ ] 24.5 Vercel Analytics 설정
- [ ] 24.6 로그 수집 (LogRocket)

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

**최종 수정일**: 2026.01.02 (Task 4, 5, 6, 9 완료)
