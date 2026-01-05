# Master's Insight AI - TODO v2.0

> 사주 분석 서비스 v2.0 개발 작업 체크리스트

**Version**: 2.0.0  
**Last Updated**: 2026-01-03  
**Total Tasks**: 28개

---

## 레퍼런스 이미지 매핑

| 파일명 | 위치 | 참고 내용 | 관련 Task |
|--------|------|----------|-----------|
| `Home.PNG` | `/docs/reference/Home.PNG` | 홈화면 **구조만** 참고 (디자인 X) | Task 1 |
| `register.PNG` | `/docs/reference/register.PNG` | 입력 필드 **구조만** 참고 | Task 3 |
| `register_users.PNG` | `/docs/reference/register_users.PNG` | 목록 UI **구조만** 참고 | Task 4 |
| `fortune1.PNG` | `/docs/reference/fortune1.PNG` | 사주명식 + 대운 구조 | Task 12 |
| `fortune2.PNG` | `/docs/reference/fortune2.PNG` | 성격 섹션 구조 | Task 13 |
| `fortune3.PNG` | `/docs/reference/fortune3.PNG` | 사주특성 문단 구조 | Task 14 |
| `fortune4.PNG` | `/docs/reference/fortune4.PNG` | 특성 그래프 구조 | Task 15 |
| `fortune5-7.PNG` | `/docs/reference/fortune5-7.PNG` | 적성/재능 섹션 구조 | Task 16 |
| `fortune8.PNG` | `/docs/reference/fortune8.PNG` | 업무/적성 그래프 구조 | Task 17 |
| `fortune9.PNG` | `/docs/reference/fortune9.PNG` | 재물운 섹션 구조 | Task 18 |
| `fortune10-11.PNG` | `/docs/reference/fortune10-11.PNG` | 연애 섹션 구조 | Task 19 |

---

## 기존 시스템 활용 체크리스트

개발 전 확인 필요한 기존 파일들:

```
✅ 재사용 (수정 없음)
- python/manseryeok/          # 만세력 엔진
- src/components/analysis/PillarCard.tsx
- src/components/analysis/ElementChart.tsx
- src/components/analysis/DaewunTimeline.tsx

🔧 확장 (기존 기반 수정)
- src/lib/ai/analyzer.ts      # 멀티스텝 추가
- src/stores/analysis.ts      # 프로필 상태 추가
- src/app/[locale]/analysis/  # 라우트 확장

➕ 신규 추가
- src/app/[locale]/home/
- src/app/[locale]/profiles/
- src/components/profile/
- src/components/report/
- src/app/api/profiles/
```

---

## Phase 1: 홈화면 & 프로필 관리 (Week 1)

### Task 1: 홈화면 구현

**참조 구조**: `/docs/reference/Home.PNG` (구조만, 디자인은 독자적)

```
우리 디자인:
- 배경: #f8f8f8 (기존 브랜드)
- 액센트: #d4af37 (금색)
- 카드 기반 레이아웃
- Framer Motion 애니메이션
```

- [x] 1.1 `/[locale]/home/page.tsx` 생성
- [x] 1.2 메뉴 카드 컴포넌트 (`HomeMenuCard`, `HomeMenuGrid`, `HomeHeader`)
- [x] 1.3 기존 랜딩페이지와 연결 정리 (로그인 시 /home 리다이렉트)
- [x] 1.4 반응형 레이아웃

**기존 코드 참고**: `src/app/[locale]/page.tsx` (랜딩 페이지)

**완료**: 2026-01-03

---

### Task 2: Profile 데이터 모델 & API ✅

**완료**: 2026-01-03

**구현 내용**:
- Supabase `profiles` 테이블 생성 (RLS 정책 포함)
- `analyses` 테이블에 `profile_id` FK 추가
- Profile CRUD API 구현
- Zod 스키마 + 날짜 검증 강화

```sql
-- 구현된 테이블
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE NOT NULL,
  birth_time VARCHAR(5),
  calendar_type VARCHAR(20) DEFAULT 'solar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [x] 2.1 Supabase에 Profile 테이블 생성 (Prisma 대신 직접 SQL)
- [x] 2.2 `POST /api/profiles` (생성)
- [x] 2.3 `GET /api/profiles` (목록)
- [x] 2.4 `GET /api/profiles/:id` (상세)
- [x] 2.5 `PUT /api/profiles/:id` (수정)
- [x] 2.6 `DELETE /api/profiles/:id` (삭제)
- [x] 2.7 Zod 스키마 (`src/lib/validations/profile.ts`)

**생성된 파일**:
- `src/lib/validations/profile.ts` - Zod 스키마
- `src/types/profile.ts` - 타입 정의
- `src/app/api/profiles/route.ts` - POST/GET API
- `src/app/api/profiles/[id]/route.ts` - GET/PUT/DELETE API

---

### Task 3: 프로필 등록 폼 ✅

**완료**: 2026-01-03

**참조 구조**: `/docs/reference/register.PNG` (입력 필드만)

```tsx
// 기존 온보딩 폼 컴포넌트 참고하여 구현
// src/app/[locale]/onboarding/step1/page.tsx 참고
```

- [x] 3.1 `/[locale]/profiles/new/page.tsx` 생성
- [x] 3.2 `ProfileForm` 컴포넌트
- [x] 3.3 이름 입력 필드
- [x] 3.4 생년월일 입력 (DatePicker or 숫자 입력)
- [x] 3.5 시간 입력 (선택사항)
- [x] 3.6 달력 유형 선택 (양력/음력/윤달)
- [x] 3.7 성별 선택
- [x] 3.8 폼 제출 & 유효성 검사

**기존 코드 참고**: `src/app/[locale]/onboarding/step1/`

**생성된 파일**:
- `src/app/[locale]/profiles/new/page.tsx` - 프로필 등록 페이지
- `src/components/profile/ProfileForm.tsx` - 등록/수정 폼 컴포넌트

---

### Task 4: 프로필 목록 화면 ✅

**완료**: 2026-01-03

**참조 구조**: `/docs/reference/register_users.PNG`

- [x] 4.1 `/[locale]/profiles/page.tsx` 생성
- [x] 4.2 `ProfileList` 컴포넌트
- [x] 4.3 `ProfileCard` 컴포넌트
- [x] 4.4 정렬 기능 (이름순/등록순)
- [x] 4.5 편집/삭제 액션
- [x] 4.6 빈 상태 UI
- [x] 4.7 TanStack Query 연동

**기존 코드 참고**: `src/components/mypage/AnalysisHistory.tsx`

**생성된 파일**:
- `src/app/[locale]/profiles/page.tsx` - 프로필 목록 페이지
- `src/components/profile/ProfileList.tsx` - 목록 컴포넌트 (정렬 기능)
- `src/components/profile/ProfileCard.tsx` - 카드 컴포넌트
- `src/components/profile/EmptyProfiles.tsx` - 빈 상태 UI
- `src/hooks/use-profiles.ts` - TanStack Query 훅

---

### Task 5: 프로필 상세 & 리포트 진입점 ✅

**완료**: 2026-01-03

- [x] 5.1 `/[locale]/profiles/[id]/page.tsx` 생성
- [x] 5.2 프로필 정보 카드 (ProfileInfoCard + 인라인 편집)
- [x] 5.3 "리포트 생성" 버튼 (첫 분석 시)
- [x] 5.4 "리포트 보기" 버튼 (분석 완료 시)
- [x] 5.5 편집/삭제 액션 (인라인 편집 + DeleteProfileDialog)

**생성된 파일**:
- `src/app/[locale]/profiles/[id]/page.tsx` - 프로필 상세 페이지
- `src/components/profile/ProfileInfoCard.tsx` - 정보 카드 (인라인 편집 지원)
- `src/components/profile/DeleteProfileDialog.tsx` - 삭제 확인 다이얼로그
- `src/components/profile/index.ts` - 배럴 export

**i18n 업데이트**: 5개 언어 (`locales/*.json`)에 `profile` 네임스페이스 추가

---

## Phase 2: 멀티스텝 분석 엔진 (Week 2)

### Task 6: 멀티스텝 파이프라인 설계 ✅

**완료**: 2026-01-03

```
기존 단일 호출:
[입력] → [Gemini 1회] → [결과]

v2.0 멀티스텝:
[입력] → [만세력] → [기본분석] → [성격] → [적성] → [재물/연애] → [점수] → [결과]
              ↓         ↓          ↓         ↓           ↓
           기존API   Gemini#1   Gemini#2  Gemini#3    Gemini#4
```

- [x] 6.1 `AnalysisPipeline` 클래스 설계 (`src/lib/ai/pipeline.ts`)
- [x] 6.2 단계별 상태 관리 (Zustand `src/stores/analysis.ts`)
- [x] 6.3 진행률 추적 기능 (`PipelineProcessingScreen.tsx`)
- [x] 6.4 에러 핸들링 & 재시도 로직 (`hydrate`, `executeFromStep`)

**구현 내용**:
- 10단계 파이프라인 (manseryeok → complete)
- 병렬 처리: personality/aptitude/fortune 동시 실행 (`Promise.allSettled`)
- 재시도: 실패 단계부터 재시작 (`executeFromStep`)
- 상태 복원: 이전 결과 hydrate 기능
- 타임아웃: 단계별 10-15초, 전체 60초 제한

**생성된 파일**:
```
src/lib/ai/pipeline.ts           # AnalysisPipeline 클래스
src/lib/ai/types.ts              # PipelineStep, PipelineIntermediateResults 타입
src/stores/analysis.ts           # 파이프라인 상태/액션 확장
src/components/analysis/PipelineProcessingScreen.tsx  # 10단계 진행률 UI
src/app/api/analysis/pipeline/route.ts     # 파이프라인 API
src/app/api/analysis/pipeline/retry/route.ts  # 재시도 API
python/prompts/builder.py        # build_step() 메서드 추가
```

---

### Task 7: 고전 이론 프롬프트 모듈

**RAG 대신 프롬프트 직접 임베딩**

기존 txt 파일 참고:
- `窮通寶鑑.txt` → 조후론 핵심 추출
- `子平真诠评.txt` → 용신론 핵심 추출
- `사주분석마스터.txt` → 십신/격국 해석

```python
# python/prompts/classics_summary.py 생성
ZIPING_SUMMARY = """
## 용신 5원칙 (자평진전)
1. 억부용신: 일간 강약 조절
2. 조후용신: 한난조습 조절  
3. 통관용신: 대립 오행 중재
4. 병약용신: 병이 있으면 약으로
5. 전왕용신: 극강하면 따름
"""

QIONGTONG_SUMMARY = """
## 조후론 핵심 (궁통보감)
- 겨울생: 火로 따뜻하게
- 여름생: 水로 시원하게
- 건조: 水로 윤택
- 습함: 火로 건조
"""

TEN_GODS_GUIDE = """
## 십신 성격 해석
- 비견: 독립심, 자존심, 경쟁심
- 겁재: 추진력, 승부욕, 극단성
...
"""
```

- [x] 7.1 자평진전 핵심 요약 작성 ✅
- [x] 7.2 궁통보감 조후론 요약 작성 ✅
- [x] 7.3 십신 해석 가이드 작성 ✅
- [x] 7.4 일간별 특성 매핑 테이블 ✅

**예상 시간**: 4시간

---

### Task 8: Step 2 - 기본 분석 프롬프트

```python
BASIC_ANALYSIS_PROMPT = """
당신은 30년 경력의 명리학 거장입니다.

{ZIPING_SUMMARY}
{QIONGTONG_SUMMARY}

## 사주 정보
년주: {year_pillar}
월주: {month_pillar}
일주: {day_pillar}
시주: {hour_pillar}

## 분석 요청
1. 일간 특성 (성격의 근본)
2. 격국 판단 (월지 기준)
3. 용신 판단 (억부/조후)
4. 한 줄 요약

## JSON 출력
{
  "dayMasterAnalysis": "...",
  "geukguk": "...",
  "yongsin": "...",
  "summary": "..."
}
"""
```

- [x] 8.1 기본 분석 프롬프트 작성 ✅
- [x] 8.2 JSON 파싱 로직 ✅
- [x] 8.3 테스트 ✅

**예상 시간**: 3시간
**완료**: 2026-01-03 (classics_summary 압축 버전 통합, /api/prompts/step 엔드포인트)

---

### Task 9: Step 3 - 성격 섹션 프롬프트 ✅

**참조 구조**: `/docs/reference/fortune2.PNG`

**완료**: 2026-01-03

```python
PERSONALITY_PROMPT = """
{MASTER_PERSONA}
{TEN_GODS_GUIDE}

## 이전 분석 결과
{basic_analysis}

## 사주 정보
{pillars}

## 분석 요청
1. 의지력 (0-100점, 비견/겁재 기반)
2. 겉으로 보이는 성격 (시주 + 일간)
3. 내면의 성격 (월주 + 일간)
4. 대인관계 스타일

## JSON 출력
{
  "willpower": { "score": 50, "description": "..." },
  "outerPersonality": "...",
  "innerPersonality": "...",
  "relationshipStyle": "..."
}
"""
```

- [x] 9.1 성격 분석 프롬프트 작성 (5개 언어: ko, en, ja, zh-CN, zh-TW)
- [x] 9.2 기존 분석 결과 Context 주입 (TEN_GODS_GUIDE 통합)
- [x] 9.3 테스트 (test_prompts.py - TestPersonalityPrompt)

**구현 파일**: `python/prompts/builder.py` - `_get_step_instructions()['personality']`

---

### Task 10: Step 4 - 적성 섹션 프롬프트 ✅

**참조 구조**: `/docs/reference/fortune5-7.PNG`

**완료**: 2026-01-03

- [x] 10.1 적성 분석 프롬프트 작성 (5개 언어: ko, en, ja, zh-CN, zh-TW)
- [x] 10.2 키워드 추출 로직 (프롬프트 내 분석 원칙으로 가이드)
- [x] 10.3 추천 분야 매핑 (십신 기반 적성 원칙 통합)
- [x] 10.4 테스트 (test_prompts.py - TestAptitudePrompt)

**구현 파일**: `python/prompts/builder.py` - `_get_step_instructions()['aptitude']`

**분석 항목**:
- 핵심 키워드 (3-5개)
- 타고난 재능 (수준 0-100)
- 추천 분야 (적합도 0-100)
- 피해야 할 분야 (기신 오행 기반)
- 재능 활용 상태

---

### Task 11: Step 5 - 재물/연애 섹션 프롬프트 ✅

**참조 구조**: `/docs/reference/fortune9-10.PNG`

**완료**: 2026-01-03

- [x] 11.1 재물운 프롬프트 작성 (5개 언어, 정재/편재 해석 가이드)
- [x] 11.2 연애 스타일 프롬프트 작성 (관성/식상 해석 가이드)
- [x] 11.3 민감 내용 순화 로직 (프롬프트 내 가이드라인으로 통합)
- [x] 11.4 테스트 (test_prompts.py - TestFortunePrompt)

**구현 파일**: `python/prompts/builder.py` - `_get_step_instructions()['fortune']`

**재물운 분석 항목**:
- 패턴 유형 (축재형/소비형/투자형/안정형)
- 재물 강점/리스크 (각 3가지)
- 재물 점수 (0-100)
- 구체적 조언

**연애운 분석 항목**:
- 스타일 유형 (적극형/수동형/감성형/이성형)
- 이상형 특성
- 결혼관
- 궁합 점수 (0-100)
- 주의사항

**순화 가이드라인**: "이혼" → "결혼 생활의 도전", "파산" → "재정적 어려움"

---

## Phase 3: 리포트 UI (Week 3-4)

### Task 12: 사주 명식 섹션 (확장) ✅

**참조 구조**: `/docs/reference/fortune1.PNG`

**완료**: 2026-01-03

- [x] 12.1 ProfileInfoHeader 컴포넌트 (이름, 생일, 나이 표시)
- [x] 12.2 SajuTable 컴포넌트 (시/일/월/년 천간지지 테이블)
- [x] 12.3 DaewunHorizontalScroll 컴포넌트 (대운 가로 스크롤)

**생성된 파일**:
- `src/types/report.ts` - 리포트 타입 정의
- `src/components/report/ProfileInfoHeader.tsx`
- `src/components/report/SajuTable.tsx`
- `src/components/report/DaewunHorizontalScroll.tsx`

---

### Task 13: 성격 분석 섹션 ✅

**참조 구조**: `/docs/reference/fortune2.PNG`

**완료**: 2026-01-03

- [x] 13.1 `PersonalitySection` 컴포넌트 (성격 섹션 컨테이너)
- [x] 13.2 의지력 게이지 (`WillpowerGauge`) - 프로그레스 바 + 50% 기준선
- [x] 13.3 `PersonalityCard` 컴포넌트 (라벨 + 요약 + 설명)
- [x] 13.4 대인관계 카드 (PersonalityCard 재사용)

**생성된 파일**:
- `src/components/report/WillpowerGauge.tsx`
- `src/components/report/PersonalityCard.tsx`
- `src/components/report/PersonalitySection.tsx`

---

### Task 14: 사주 특성 섹션 ✅

**참조 구조**: `/docs/reference/fortune3.PNG`

**완료**: 2026-01-03

- [x] 14.1 `CharacteristicsSection` 컴포넌트
- [x] 14.2 문단 렌더링 로직 (react-markdown 사용)
- [x] 14.3 스크롤 최적화 (maxHeight + 페이드 그라데이션)

**생성된 파일**:
- `src/components/report/CharacteristicsSection.tsx`
- `src/components/report/index.ts` - 모듈 export

---

### Task 15: 특성 그래프 컴포넌트 ✅

**참조 구조**: `/docs/reference/fortune4.PNG`

**완료**: 2026-01-03

- [x] 15.1 `TraitGraph` 컴포넌트 구현 (헤더 + 범례 + TraitBar 리스트)
- [x] 15.2 `TraitBar` 컴포넌트 (단일 가로 막대)
- [x] 15.3 50% 기준 색상 분기 (#f59e0b 미만, #ef4444 이상)
- [x] 15.4 진입 애니메이션 (Framer Motion staggered)
- [x] 15.5 반응형 레이아웃 + 접근성 (aria-* 속성)

**생성된 파일**:
- `src/components/report/TraitBar.tsx` - 단일 막대 컴포넌트
- `src/components/report/TraitGraph.tsx` - 그래프 컨테이너

---

### Task 16: 적성/재능 섹션 ✅

**참조 구조**: `/docs/reference/fortune5.PNG`, `fortune6.PNG`, `fortune7.PNG`

**완료**: 2026-01-03

- [x] 16.1 `AptitudeSection` 컴포넌트 (8개 하위 섹션 조합)
- [x] 16.2 `KeywordBadge` 컴포넌트 (primary/secondary variant)
- [x] 16.3 `ContentCard` 컴포넌트 (재능/커리어 설명 카드)

**생성된 파일**:
- `src/components/report/KeywordBadge.tsx` - 키워드 뱃지
- `src/components/report/ContentCard.tsx` - 콘텐츠 카드
- `src/components/report/AptitudeSection.tsx` - 적성 섹션 전체
- `src/types/report.ts` - TraitItem, ContentCardData, AptitudeSectionData 타입 추가

---

### Task 17: 업무/적성 그래프 섹션 ✅

**참조 구조**: `/docs/reference/fortune8.PNG`

**완료**: 2026-01-03

- [x] 17.1 업무 능력 그래프 (5개 항목: 기획/연구, 끈기/정력, 실천/수단, 완성/판매, 관리/평가)
- [x] 17.2 적성 특성 그래프 (10개 항목: 비판력, 협동심, 습득력, 창의력, 예술성, 표현력, 활동력, 모험심, 사업감각, 신뢰성)
- [x] 17.3 Task 15 TraitGraph 재사용

**생성된 파일**:
- `src/components/report/WorkAptitudeSection.tsx` - 업무/적성 그래프 섹션
- `src/types/report.ts` - WorkAbilityData, AptitudeTraitsData 타입 추가

---

### Task 18: 재물운 섹션 ✅

**참조 구조**: `/docs/reference/fortune9.PNG`

**완료**: 2026-01-03

- [x] 18.1 `WealthSection` 컴포넌트
- [x] 18.2 재물운 카드 (ContentCard 재사용)
- [x] 18.3 재물 특성 그래프 (선택)
- [x] 18.4 재물 점수 표시 (선택)

**생성된 파일**:
- `src/components/report/WealthSection.tsx` - 재물운 섹션
- `src/types/report.ts` - WealthSectionData 타입 추가

---

### Task 19: 연애/결혼 섹션 ✅

**참조 구조**: `/docs/reference/fortune10-11.PNG`

**완료**: 2026-01-03

- [x] 19.1 `RomanceSection` 컴포넌트
- [x] 19.2 연애심리 카드 (ContentCard 재사용)
- [x] 19.3 배우자관 카드 (ContentCard 재사용)
- [x] 19.4 성적패턴 카드 (선택, ContentCard 재사용)
- [x] 19.5 연애 특성 그래프 (10개 항목: 배려심, 유머감각, 예술성, 허영심, 모험심, 성실도, 사교력, 재테크, 신뢰성, 표현력)

**생성된 파일**:
- `src/components/report/RomanceSection.tsx` - 연애/결혼 섹션
- `src/types/report.ts` - RomanceTraitsData, RomanceSectionData 타입 추가

---

### Task 20: 전체 리포트 레이아웃 ✅

**완료**: 2026-01-03

- [x] 20.1 `/[locale]/profiles/[id]/report/page.tsx` 생성
- [x] 20.2 섹션 조합 레이아웃 (6개 섹션: 사주, 성격, 특성, 적성, 재물, 연애)
- [x] 20.3 스크롤 네비게이션 (`ReportNavigation` 컴포넌트)
- [x] 20.4 PDF 내보내기 버튼 (placeholder 구현)

**생성된 파일**:
- `src/app/[locale]/profiles/[id]/report/page.tsx` - 전체 리포트 페이지
- `src/components/report/ReportNavigation.tsx` - 스크롤 네비게이션 (6개 섹션, 스크롤 위치 감지)

**i18n 업데이트**: 5개 언어 번역 추가 (report.wealth, report.romance, report.navigation, report.actions)

---

### Task 21: 점수 계산 모듈 ✅

**완료**: 2026-01-03

**구현 내용**:
- 십신(十神) 기반 35개 특성 점수 계산 모듈
- 일간과 천간/지장간의 관계에서 십신 분포 추출
- 35개 특성별 십신 영향 매핑 테이블
- 단위 테스트 38개 통과

**알고리즘**:
```typescript
// 십신 추출: 일간 기준 오행/음양 비교
determineTenGod(dayMaster, targetStem) → TenGod

// 점수 계산: 기본 50 + 십신별 가중치
calculateTraitScore(tenGodCounts, modifiers) → 0-100
```

- [x] 21.1 십신 추출 함수 (`ten-gods.ts`)
- [x] 21.2 성격 특성 점수 (10개)
- [x] 21.3 업무 능력 점수 (5개)
- [x] 21.4 적성 특성 점수 (10개)
- [x] 21.5 연애 특성 점수 (10개)
- [x] 21.6 단위 테스트 (38개)

**생성된 파일**:
```
src/lib/score/
├── index.ts              # 모듈 export
├── types.ts              # TenGod, TenGodCounts 타입
├── constants.ts          # 천간/지지/오행 매핑
├── ten-gods.ts           # 십신 추출 함수
├── trait-modifiers.ts    # 35개 특성 영향 매핑
└── calculator.ts         # 점수 계산 로직

tests/unit/lib/score/
├── ten-gods.test.ts      # 십신 추출 테스트 (22개)
└── calculator.test.ts    # 점수 계산 테스트 (16개)
```

**수정된 파일**:
- `src/lib/ai/types.ts` - ScoreResult 타입 확장 (20개 → 35개)
- `src/lib/ai/pipeline.ts` - calculateScores() 십신 기반 로직 연동

**버전 히스토리**:
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0.0 | 2026-01-03 | 초기 구현 (십신 기반 35개 특성 점수) |
| 2.0.9 | 2026-01-05 | modifier 스케일 축소 (×0.75, max ±15 → ±11) |

---

## Phase 4: 통합 & 마무리 (Week 5)

### Task 22: 로딩 UI ✅

**완료**: 2026-01-03

- [x] 22.1 멀티스텝 진행률 표시 (PipelineProcessingScreen i18n)
- [x] 22.2 단계별 메시지 (5개 언어 번역)
- [x] 22.3 에러 복구 UI (재시도/취소 버튼)
- [x] 22.4 폴링 기반 상태 확인 (5초 간격)

**구현 내용**:
- `PipelineProcessingScreen` i18n 적용 (`useTranslations('pipeline')`)
- `/profiles/[id]/generating/page.tsx` 생성 (폴링 로직)
- `/api/profiles/[id]/report/status` 상태 폴링 API
- 5개 언어 번역: ko, en, ja, zh-CN, zh-TW

**생성/수정된 파일**:
```
src/components/analysis/PipelineProcessingScreen.tsx  # i18n 적용
src/app/[locale]/profiles/[id]/generating/page.tsx    # 생성 중 페이지
src/app/api/profiles/[id]/report/status/route.ts      # 상태 폴링 API
locales/*.json                                        # pipeline 번역 키
```

---

### Task 23: 크레딧 연동 ✅

**완료**: 2026-01-03

- [x] 23.1 리포트 생성 시 50C 차감 (`POST /api/profiles/[id]/report`)
- [x] 23.2 섹션 재분석 시 5C 차감 (`POST /api/profiles/[id]/report/reanalyze`)
- [x] 23.3 크레딧 부족 시 안내 (`InsufficientCreditsDialog`)

**구현 내용**:
- `SERVICE_CREDITS.profileReport = 50`, `sectionReanalysis = 5` 추가
- `/api/user/credits/check` 크레딧 확인 API
- `InsufficientCreditsDialog` 크레딧 부족 다이얼로그
- `useCreditsBalance`, `useReportCreditsCheck` TanStack Query 훅
- 프로필 상세 페이지 연동 (크레딧 확인 후 generating 페이지로 이동)

**생성된 파일**:
```
src/lib/stripe.ts                                    # SERVICE_CREDITS 확장
src/app/api/user/credits/check/route.ts              # 크레딧 확인 API
src/app/api/profiles/[id]/report/route.ts            # 리포트 생성/조회 API
src/app/api/profiles/[id]/report/reanalyze/route.ts  # 섹션 재분석 API
src/components/credits/InsufficientCreditsDialog.tsx # 크레딧 부족 다이얼로그
src/hooks/use-credits.ts                             # TanStack Query 훅
locales/*.json                                       # credits 번역 키
```

**Supabase 테이블 추가 필요**:
```sql
-- profile_reports 테이블
CREATE TABLE profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  current_step VARCHAR(50),
  progress_percent INT DEFAULT 0,
  step_statuses JSONB DEFAULT '{}',
  estimated_time_remaining INT DEFAULT 0,
  error JSONB,
  pillars JSONB,
  daewun JSONB,
  analysis JSONB,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- reanalysis_logs 테이블
CREATE TABLE reanalysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES profile_reports(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  section_type VARCHAR(50) NOT NULL,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Task 24: 기존 기능 연결 ✅

**완료**: 2026-01-04

- [x] 24.1 신년 운세 → 프로필 연동
  - `analysis.ts` 스토어: `selectedProfileId`, `selectedProfile` 상태 추가
  - `ProfileSelector` 컴포넌트 생성 (카드 형태 UI)
  - `/analysis/yearly/page.tsx` ProfileSelector 통합
  - `/api/analysis/yearly` profileId 파라미터 지원
- [x] 24.2 마이페이지 → 프로필 목록 연결
  - `MypageSidebar.tsx` "프로필 관리" 링크 추가 (/profiles)
  - 5개 언어 i18n 업데이트 (mypage.sidebar.profiles)
- [x] 24.3 기존 분석 기록 마이그레이션 SQL 준비
  - `docs/migrations/task24_profile_migration.sql` 생성
  - DRY RUN + 실제 UPDATE SQL 포함

**생성된 파일**:
```
src/components/profile/ProfileSelector.tsx  # 프로필 선택 카드 컴포넌트
docs/migrations/task24_profile_migration.sql  # 마이그레이션 SQL
```

**수정된 파일**:
```
src/stores/analysis.ts              # selectedProfileId, selectedProfile 추가
src/app/[locale]/analysis/yearly/page.tsx  # ProfileSelector 통합
src/app/api/analysis/yearly/route.ts  # profileId 파라미터 지원
src/components/mypage/MypageSidebar.tsx  # 프로필 관리 링크 추가
locales/*.json (5개 언어)           # profile.selector, mypage.sidebar.profiles 등 추가
```

---

## 추가 기능 (v2.1 예정)

### Task 25: 궁합 분석

- [ ] 25.1 Couple 모델
- [ ] 25.2 궁합 프롬프트
- [ ] 25.3 궁합 리포트 UI

### Task 26: 대운/년운 상세

- [ ] 26.1 대운 상세 분석
- [ ] 26.2 년운 분석

---


## 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0.0 | 2026-01-03 | 초기 작성 - 프로필 관리, 멀티스텝 분석, 상세 리포트 |
| 2.0.1 | 2026-01-03 | Task 7 완료 - classics_summary.py 멀티스텝 프롬프트 모듈 |
| 2.0.2 | 2026-01-03 | Task 8 완료 - 기본 분석 프롬프트, /api/prompts/step 엔드포인트 |
| 2.0.3 | 2026-01-03 | Task 9~11 완료 - 성격/적성/재물·연애 프롬프트 5개 언어 구현, 테스트 88개 추가 |
| 2.0.4 | 2026-01-03 | Task 15~16 완료 - TraitGraph, KeywordBadge, ContentCard, AptitudeSection 컴포넌트 |
| 2.0.5 | 2026-01-03 | Task 3~5 완료 - 프로필 CRUD UI (등록폼, 목록, 상세+인라인편집), TanStack Query 훅, 5개 언어 번역 |
| 2.0.6 | 2026-01-03 | Task 17~20 완료 - WorkAptitudeSection, WealthSection, RomanceSection, ReportNavigation, 리포트 페이지, i18n 5개 언어 |
| 2.0.7 | 2026-01-03 | Task 22~23 완료 - 로딩 UI (폴링 기반 진행률), 크레딧 연동 (50C 리포트, 5C 재분석), 5개 언어 번역 |
| 2.0.8 | 2026-01-04 | Task 24 완료 - 기존 기능 연결 (신년운세→프로필, 마이페이지→프로필목록, 마이그레이션 SQL) |

---

**End of TODO v2.0**
