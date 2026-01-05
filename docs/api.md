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
리포트 생성 시작 | **인증**: 필수 | **크레딧**: 50C

```json
{ "retryFromStep": "personality" }  // 선택적
```
→ `{ "success": true, "reportId": "...", "pollUrl": "/api/profiles/{id}/report/status" }`

### GET /api/profiles/:id/report
완료된 리포트 조회 | **인증**: 필수

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
신년 사주 분석 | **인증**: 필수 | **크레딧**: 30C

```json
{
  "targetYear": 2026,
  "profileId": "uuid",           // 프로필 ID (필수)
  "pillars": {...},              // 사주 기둥
  "daewun": [...],               // 대운 정보
  "language": "ko"
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
| 리포트 생성 | 50C | `POST /api/profiles/:id/report` |
| 섹션 재분석 | 5C | `POST /api/profiles/:id/report/reanalyze` |
| 신년 분석 | 30C | `POST /api/analysis/yearly` |
| AI 후속 질문 | 10C | `POST /api/profiles/:id/report/question` |

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

**최종 수정**: 2026-01-04 (v2.0 후속 질문 API 추가, Coming Soon 제거)
