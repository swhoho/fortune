# Master's Insight AI - API 명세

**Local**: `http://localhost:3000/api` (Next.js) / `http://localhost:8000` (Python)

---

## 인증

Supabase Auth 사용 (`@supabase/ssr`)

- **Provider**: Email/Password, Google OAuth
- **Session**: JWT + Cookie
- **인증 필요 라우트**: `/analysis/*`, `/mypage/*`, `/payment/*`, `/api/analysis/*`, `/api/user/*`, `/api/payment/*`

---

## 프로필 API

### POST /api/profiles
프로필 생성 | **인증**: 필수

```json
{ "name": "홍길동", "gender": "male", "birthDate": "1990-05-15", "birthTime": "14:30", "calendarType": "solar" }
```

### GET /api/profiles
프로필 목록 | **인증**: 필수

### GET /api/profiles/:id
프로필 상세 | **인증**: 필수

### PUT /api/profiles/:id
프로필 수정 | **인증**: 필수

### DELETE /api/profiles/:id
프로필 삭제 | **인증**: 필수

---

## 프로필 리포트 API

### POST /api/profiles/:id/report
리포트 생성 시작 | **인증**: 필수 | **크레딧**: 70C

```json
{ "retryFromStep": "personality" }  // 선택적
```
→ `{ "success": true, "reportId": "...", "pollUrl": "/api/profiles/{id}/report/status" }`

### GET /api/profiles/:id/report
완료된 리포트 조회 | **인증**: 필수

**대운(daewun) 응답 필드**:
```json
{
  "daewun": [{
    "age": 7,
    "endAge": 16,
    "stem": "壬",
    "branch": "午",
    "startYear": 1997,
    "startDate": "1997-05-15",
    "tenGod": "편인",
    "tenGodType": "인성운",
    "favorablePercent": 65,
    "unfavorablePercent": 35,
    "description": "학업 성장기, 부모 영향력, 기초 다지기"
  }]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| tenGod | string | 십신 (비견, 겁재, 식신, 상관, 정재, 편재, 정관, 편관, 정인, 편인) |
| tenGodType | string | 십신 유형 (비겁운, 식상운, 재성운, 관성운, 인성운) |
| favorablePercent | number | 순풍운 비율 (0-100) |
| unfavorablePercent | number | 역풍운 비율 (0-100) |
| description | string | 나이에 맞는 대운 설명 |

### GET /api/profiles/:id/report/status
리포트 생성 상태 폴링 (5초 간격) | **인증**: 필수

```json
{ "status": "in_progress", "currentStep": "personality", "progressPercent": 45, "stepStatuses": {...} }
```

### POST /api/profiles/:id/report/reanalyze
섹션 재분석 | **인증**: 필수 | **크레딧**: 5C

```json
{ "sectionType": "personality" }  // personality | aptitude | fortune
```

### POST /api/profiles/:id/report/question
AI 후속 질문 | **인증**: 필수 | **크레딧**: 10C

```json
{ "question": "제 사주에서 재물운을 높이려면 어떻게 해야 하나요?" }
```
→ `{ "answer": "...", "creditsUsed": 10 }`

### GET /api/profiles/:id/report/question
해당 프로필 리포트의 질문 히스토리 조회 | **인증**: 필수

```json
[{ "id": "uuid", "question": "...", "answer": "...", "createdAt": "..." }]
```

---

## Consultation API (1:1 상담)

### POST /api/profiles/:id/consultation/sessions
상담 세션 생성 | **인증**: 필수 | **크레딧**: 10C

```json
{ "title": "상담 제목 (선택)" }
```
→ `{ "success": true, "data": { "sessionId": "uuid", "creditsUsed": 10, "remainingCredits": 150 } }`

**세션 정책**:
- 세션당 **2라운드** 질문 가능
- 1라운드 = 사용자 질문 → AI 추가질문(선택) → 사용자 답변(선택) → AI 최종 답변

### GET /api/profiles/:id/consultation/sessions
세션 목록 조회 | **인증**: 필수

```json
{
  "sessions": [{
    "id": "uuid",
    "title": "상담 제목",
    "status": "active",
    "questionCount": 1,
    "creditsUsed": 10,
    "createdAt": "..."
  }]
}
```

### POST /api/profiles/:id/consultation/sessions/:sessionId/messages
메시지 전송 | **인증**: 필수 | **크레딧**: 무료 (세션 생성 시 선차감)

```json
{
  "content": "질문 내용",
  "messageType": "user_question",
  "skipClarification": false
}
```

| messageType | 설명 |
|-------------|------|
| `user_question` | 새 질문 (라운드 시작) |
| `user_clarification` | AI 추가질문에 대한 답변 |

**중복 방지 (v1.32)**: 프론트엔드 Ref 세마포어 + 백엔드 OCC 패턴으로 중복 응답 방지

### GET /api/profiles/:id/consultation/sessions/:sessionId/messages
메시지 목록 조회 | **인증**: 필수

```json
{
  "session": { "id": "uuid", "questionCount": 1, "maxQuestions": 2 },
  "messages": [{
    "id": "uuid",
    "type": "user_question",
    "content": "...",
    "status": "completed",
    "questionRound": 1
  }]
}
```

### PATCH /api/profiles/:id/consultation/sessions/:sessionId/messages
실패한 AI 메시지 재생성 | **인증**: 필수 | **크레딧**: 무료

```json
{ "messageId": "uuid" }
```

---

## 분석 API

### POST /api/analysis/pipeline
멀티스텝 AI 분석 (프로필 리포트 생성용) | **인증**: 필수 | **타임아웃**: 60초

단계: manseryeok → jijanggan → basic_analysis → personality/aptitude/fortune (병렬) → scoring → visualization → saving

### POST /api/analysis/pipeline/retry
실패 단계부터 재시도 | **인증**: 필수

```json
{ "fromStep": "personality", "input": {...}, "previousResults": {...} }
```

### POST /api/analysis/yearly
신년 사주 분석 | **인증**: 필수 | **크레딧**: 50C

```json
{
  "targetYear": 2026,
  "profileId": "uuid",           // 프로필 ID (필수)
  "pillars": {...},              // 사주 기둥
  "daewun": [...],               // 대운 정보
  "language": "ko"
}
```

**에러 응답 (422 - 사주 분석 필요)**:
```json
{
  "success": false,
  "error": "기본 사주 분석 이후에 이용할 수 있는 서비스입니다.",
  "errorCode": "SAJU_REQUIRED"
}
```

### POST /api/analysis/yearly/:id/reanalyze
신년 분석 섹션 재분석 | **인증**: 필수 | **크레딧**: 0C (무료)

실패한 섹션만 재분석합니다. 분석 실패는 서비스 책임이므로 무료로 제공됩니다.

**Request Body**:
```json
{
  "stepType": "yearly_advice"
}
```

| stepType | 설명 |
|----------|------|
| `yearly_advice` | 분야별 조언 (사업/재물/건강/관계/자기개발) |
| `key_dates` | 연중 핵심 날짜 (길일/흉일) |
| `classical_refs` | 고전 인용 (자평진전, 궁통보감) |
| `monthly_1_3` | 1~3월 월운 |
| `monthly_4_6` | 4~6월 월운 |
| `monthly_7_9` | 7~9월 월운 |
| `monthly_10_12` | 10~12월 월운 |

**Response**:
```json
{
  "success": true,
  "message": "재분석이 완료되었습니다",
  "data": {
    "analysisId": "uuid",
    "stepType": "yearly_advice",
    "result": { "yearlyAdvice": {...} }
  }
}
```

---

## 사용자 API

### GET /api/user/profile
사용자 정보 조회 | **인증**: 필수

### PATCH /api/user/profile
사용자 정보 수정 | **인증**: 필수

### GET /api/user/credits/check
크레딧 잔액 확인 | **인증**: 필수

```json
{ "current": 50, "required": 30, "sufficient": true }
```

### GET /api/user/questions
사용자의 전체 질문 히스토리 조회 | **인증**: 필수

```json
[{ "id": "uuid", "profileId": "...", "profileName": "...", "question": "...", "answer": "...", "createdAt": "..." }]
```

---

## 결제 API

### POST /api/payment/create-checkout-session
Stripe 결제 세션 생성

| Package | 크레딧 | 가격 |
|---------|--------|------|
| starter | 50C | $5 |
| popular | 110C | $10 |
| premium | 350C | $30 |

### POST /api/payment/webhook
Stripe 웹훅 (checkout.session.completed 처리)

---

## Python API

### POST /api/manseryeok
만세력 계산

```json
{ "birth_datetime": "1990-05-15T14:30:00", "timezone": "Asia/Seoul", "is_lunar": false, "gender": "male" }
```

### POST /api/visualization/pillar
사주 명반 이미지 생성 (800x400px PNG)

### POST /api/prompts/step
멀티스텝 프롬프트 빌드 (step: basic | personality | aptitude | fortune)

---

## Python 프롬프트 모듈 API

### prompts.western (The Destiny Code)

서구권 BaZi 현대화 프레임워크

```python
from prompts.western import (
    TEN_GODS_MAPPING,           # 십신 다국어 매핑
    FIVE_FACTORS_MAPPING,       # 오행 다국어 매핑
    get_destiny_advice,         # 십신별 조언 조회
    get_ten_god_name,           # 십신 이름 변환
    build_luck_cycle_prompt,    # 대운 프롬프트 생성
    build_destiny_code_analysis_prompt,  # 분석 프롬프트 생성
)
```

#### `get_destiny_advice(ten_god, strength, language) -> Dict`

십신과 강약에 따른 조언 조회

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| ten_god | str | 십신 키 (정관, 편관, 정재, 식신 등) |
| strength | str | `"strong"` \| `"weak"` \| `"balanced"` |
| language | str | `"ko"` \| `"en"` \| `"ja"` \| `"zh-CN"` \| `"zh-TW"` |

**반환값**: `{ ten_god, career_advice, relationship_advice, action_items, avoid_items, insight }`

```python
advice = get_destiny_advice('정관', 'strong', 'en')
# {'ten_god': 'Direct Officer', 'career_advice': 'Structured organizations with...', ...}
```

#### `build_luck_cycle_prompt(cycle_type, stem, branch, interaction, is_favorable, language) -> str`

대운/세운 분석 프롬프트 생성

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| cycle_type | str | `"daewun"` \| `"year"` \| `"month"` |
| stem | str | 천간 (甲~癸) |
| branch | str | 지지 (寅~丑) |
| interaction | str | 상호작용 유형 (합/충/형/해/파) |
| is_favorable | bool | True=용신운, False=기신운 |
| language | str | 언어 코드 |

**반환값**: 마크다운 형식 프롬프트 문자열

#### `build_destiny_code_analysis_prompt(ten_god, strength, language) -> str`

십신 분석 전체 프롬프트 생성

**반환값**: 마크다운 형식 분석 결과 문자열

---

## v1.x → v2.0 API 마이그레이션

v2.0에서 `analyses` 테이블 기반 API가 `profiles` + `profile_reports` 테이블 기반으로 전환되었습니다.

### API 대체 매핑

| v1.x (삭제됨) | v2.0 (대체) | 크레딧 | 비고 |
|---------------|-------------|--------|------|
| `POST /api/analysis/save` | `POST /api/profiles/:id/report` | 50C | 프로필 기반 리포트 생성 |
| `GET /api/analysis/:id` | `GET /api/profiles/:id/report` | - | 프로필 ID로 조회 |
| `GET /api/analysis/list` | `GET /api/profiles` | - | 프로필 목록으로 대체 |
| `POST /api/analysis/:id/question` | `POST /api/profiles/:id/report/question` | 10C | 후속 질문 API |

### 데이터 흐름 변경

**v1.x (삭제)**:
```
사용자 입력 → /api/analysis/save → analyses 테이블 → /api/analysis/:id
```

**v2.0 (현재)**:
```
프로필 등록 → /api/profiles → profiles 테이블
         ↓
리포트 생성 → /api/profiles/:id/report → profile_reports 테이블
         ↓
리포트 조회 → /api/profiles/:id/report
```

### 크레딧 비용 (v2.0)

| 서비스 | 크레딧 | API |
|--------|--------|-----|
| 리포트 생성 | 70C | `POST /api/profiles/:id/report` |
| 섹션 재분석 | 5C | `POST /api/profiles/:id/report/reanalyze` |
| 신년 분석 | 50C | `POST /api/analysis/yearly` |
| 신년 섹션 재분석 | 0C | `POST /api/analysis/yearly/:id/reanalyze` |
| AI 후속 질문 | 10C | `POST /api/profiles/:id/report/question` |
| 상담 세션 | 10C | `POST /api/profiles/:id/consultation/sessions` |
| **궁합 분석** | **70C** | `POST /api/analysis/compatibility` |

---

## 에러 코드

| Code | 설명 |
|------|------|
| 400 | 입력값 오류 |
| 401 | 인증 필요 |
| 402 | 크레딧 부족 |
| 404 | 리소스 없음 |
| 429 | Rate Limit |
| 504 | 타임아웃 |

---

## 스키마 동기화 (v2.1)

### Python Code-First 타입 생성

Python Pydantic 모델이 단일 소스이며, TypeScript 타입은 자동 생성됩니다.

```bash
# 타입 생성 명령어
npm run generate:types

# 내부 동작:
# 1. FastAPI → openapi.json 추출
# 2. openapi-typescript → src/types/generated.d.ts
# 3. openapi-zod-client → src/types/schemas.ts (런타임 검증)
```

### 타입 파일 구조

```
python/schemas/           # Source of Truth
├── saju.py              # Pillars, DaewunItem, Jijanggan
├── prompt.py            # PromptBuildRequest/Response
└── visualization.py     # VisualizationRequest/Response

src/types/
├── generated.d.ts       # 자동 생성 (수정 금지)
├── schemas.ts           # Zod 스키마 (런타임 검증)
└── index.ts             # Re-export
```

### API 응답 검증

```typescript
import { PillarsSchema } from '@/types/schemas';

// 런타임 검증
const result = PillarsSchema.safeParse(apiResponse);
if (!result.success) {
  console.error('Schema mismatch:', result.error);
}
```

---

## 궁합 분석 API (v2.0)

### POST /api/analysis/compatibility
궁합 분석 시작 | **인증**: 필수 | **크레딧**: 70C

```json
{
  "profileIdA": "uuid-a",
  "profileIdB": "uuid-b",
  "analysisType": "romance",
  "language": "ko"
}
```
→ `{ "success": true, "analysisId": "...", "jobId": "...", "status": "processing", "pollUrl": "/api/analysis/compatibility/{id}" }`

### GET /api/analysis/compatibility/:id
궁합 분석 상태/결과 조회 | **인증**: 필수

**진행 중 응답**:
```json
{
  "success": true,
  "status": "processing",
  "progressPercent": 50,
  "currentStep": "relationship_type",
  "stepStatuses": { "manseryeok_a": "completed", ... }
}
```

**완료 시 응답 (v2.0)**:
```json
{
  "success": true,
  "status": "completed",
  "data": {
    "totalScore": 72,
    "scores": {
      "stemHarmony": { "score": 75, "weight": 24 },
      "branchHarmony": { "score": 68, "weight": 24 },
      "elementBalance": { "score": 70, "weight": 19 },
      "tenGodCompatibility": { "score": 72, "weight": 19 },
      "wunsungSynergy": { "score": 65, "weight": 9 },
      "combinationSynergy": { "score": 80, "weight": 5 }
    },
    "interactions": {
      "wonjin": [{ "pillars": ["일지", "일지"], "penalty": -15 }],
      "samhapBanghap": [{ "type": "삼합", "branches": ["寅", "午", "戌"], "element": "火" }],
      "dohwa": { "type": "bilateral", "branches": ["卯", "午"] }
    },
    "johu": {
      "a": { "tendency": "寒", "tuneWords": ["침착", "내성적"] },
      "b": { "tendency": "暖", "tuneWords": ["열정적", "외향적"] },
      "compatibility": "보완적"
    },
    "relationshipType": { "keywords": [...], "firstImpression": "..." },
    "conflictAnalysis": { "conflictPoints": [...], "wonjinWarning": "..." },
    "marriageFit": { "score": 75 },
    "mutualInfluence": { "aToB": {...}, "bToA": {...} }
  }
}
```

### 점수 항목 (6개)

| 항목 | 가중치 | 설명 |
|------|--------|------|
| stemHarmony | 24% | 천간 조화 (합/극) |
| branchHarmony | 24% | 지지 조화 (합/충/형/원진) |
| elementBalance | 19% | 오행 균형 |
| tenGodCompatibility | 19% | 십신 호환성 |
| wunsungSynergy | 9% | 12운성 시너지 |
| combinationSynergy | 5% | 삼합/방합 국 형성 |

### v2.0 추가 기능

| 기능 | 설명 |
|------|------|
| 원진(元辰) | 일지-일지 -15점, 월지-일지 -10점 |
| 삼합/방합 | 삼합 +20점, 반합 +8점, 방합 +15점 |
| 도화살 | 쌍방 +15점, 일방 +8점 |
| 조후(調候) | 寒/暖/燥/濕 기후 궁합 |

### Python Backend API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/analysis/compatibility` | 분석 작업 시작 (비동기) |
| GET | `/api/analysis/compatibility/{job_id}/status` | 작업 상태 조회 |

---

**최종 수정**: 2026-01-09 (궁합 분석 v2.0)
