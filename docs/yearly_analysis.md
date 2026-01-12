# 신년 분석 파이프라인

> 특정 연도 월별 상세 운세 분석 (비동기 9단계)

**소스 코드**: `python/services/yearly_analysis.py`

---

## 파이프라인 단계

| 단계 | 이름 | 설명 | 진행률 |
|------|------|------|--------|
| 1 | `yearly_overview` | 연간 기본 정보 (year, summary, theme, score) | 10% |
| 2 | `monthly_1_3` | 1~3월 월별 운세 | 22% |
| 3 | `monthly_4_6` | 4~6월 월별 운세 | 34% |
| 4 | `monthly_7_9` | 7~9월 월별 운세 | 46% |
| 5 | `monthly_10_12` | 10~12월 월별 운세 | 58% |
| 6 | `yearly_advice` | 6섹션 연간 조언 | 75% |
| 7 | `key_dates` | 핵심 길흉일 (최소 5개) | 85% |
| 8 | `classical_refs` | 고전 인용 (최소 2개) | 95% |
| 9 | `complete` | 완료 | 100% |

---

## API 엔드포인트

### 분석 시작
```
POST /api/analysis/yearly
```

**Request**:
```json
{
  "user_id": "uuid",
  "analysis_id": "uuid",
  "target_year": 2026,
  "pillars": { "year": {...}, "month": {...}, "day": {...}, "hour": {...} },
  "daewun": [...],
  "language": "ko"
}
```

**Response**:
```json
{
  "job_id": "uuid"
}
```

### 상태 폴링
```
GET /api/analysis/yearly/{job_id}
```

**Response**:
```json
{
  "job_id": "uuid",
  "status": "in_progress",
  "progress_percent": 46,
  "current_step": "monthly_7_9",
  "step_statuses": {
    "yearly_overview": "completed",
    "monthly_1_3": "completed",
    "monthly_4_6": "completed",
    "monthly_7_9": "in_progress",
    ...
  },
  "result": {
    "year": 2026,
    "summary": "...",
    "yearlyTheme": "...",
    "overallScore": 72,
    "monthlyFortunes": [...]
  },
  "failed_steps": [],
  "error": null
}
```

---

## 6섹션 연간 조언 (`yearly_advice`)

| 섹션 키 (camelCase) | 한국어 | 설명 |
|---------------------|--------|------|
| `natureAndSoul` | 본연의 성정 | 비겁(比劫) - 자아, 형제, 친구 |
| `wealthAndSuccess` | 재물과 비즈니스 | 재성(財星) - 돈, 아버지, 이성 |
| `careerAndHonor` | 직업과 명예 | 관성(官星) - 직장, 명예, 남편 |
| `documentAndWisdom` | 문서와 학업 | 인성(印星) - 학업, 어머니, 자격증 |
| `relationshipAndLove` | 인연과 관계 | 식상(食傷) - 자녀, 표현, 아이디어 |
| `healthAndMovement` | 건강과 이동 | 오행 균형 - 건강, 운동, 이동 |

**Half 키**:
- `firstHalf`: 상반기 (1~6월)
- `secondHalf`: 하반기 (7~12월)

---

## 월별 운세 스키마

```json
{
  "month": 1,
  "theme": "새로운 시작",
  "score": 75,
  "overview": "월별 개요 (200-300자)",
  "luckyDays": [
    { "date": "2026-01-15", "description": "길일 설명" }
  ],
  "unluckyDays": [
    { "date": "2026-01-23", "description": "흉일 설명" }
  ],
  "advice": "구체적인 조언",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}
```

**점수 다양화 규칙**:
- 월별 점수 최고-최저 간격: **50점 이상 권장**
- 목표 분포: 20~90점 골고루

---

## 에러 처리

### 만세력 422 에러

기본 사주 분석이 완료되지 않은 프로필로 신년 분석 시도 시:

```json
{
  "success": false,
  "error": "기본 사주 분석 이후에 이용할 수 있는 서비스입니다.",
  "errorCode": "SAJU_REQUIRED"
}
```

**HTTP Status**: 400

---

## 재분석 기능

특정 단계만 무료로 재분석:

```python
await yearly_analysis_service.reanalyze_step(
    analysis_id="uuid",
    step_type="yearly_advice",  # 재분석할 단계
    pillars=pillars,
    daewun=daewun,
    target_year=2026,
    language="ko",
    existing_analysis=existing_analysis
)
```

**지원 단계**:
- `yearly_advice` - 6섹션 조언
- `key_dates` - 핵심 길흉일
- `classical_refs` - 고전 인용
- `monthly_1_3`, `monthly_4_6`, `monthly_7_9`, `monthly_10_12` - 월별 운세

---

## 정규화 + Pydantic 검증 (v4.0)

Gemini 응답의 키 불일치 + 타입/구조 검증:

**파일**:
- `python/services/normalizers.py` - 키 정규화
- `python/schemas/yearly_fortune.py` - Pydantic 스키마

### 2단계 파이프라인

```python
from services.normalizers import normalize_response, normalize_all_keys
from schemas.yearly_fortune import validate_yearly_step

# Step 1: 정규화 (snake_case/한글 → camelCase)
normalized = normalize_all_keys(normalize_response(step_name, result))

# Step 2: Pydantic 검증 (실패 시 재시도)
validated = validate_yearly_step(step_name, normalized, raise_on_error=True)
```

### 단계별 검증 함수

| 단계 | 검증 함수 | Pydantic 스키마 |
|------|----------|----------------|
| `yearly_overview` | `validate_yearly_overview()` | `YearlyOverviewSchema` |
| `monthly_*` | `validate_monthly_fortunes()` | `MonthlyFortunesSchema` |
| `yearly_advice` | `validate_yearly_advice()` | `YearlyAdviceSchema` |
| `classical_refs` | `validate_classical_refs()` | `ClassicalRefsSchema` |

### 정규화 키 매핑

| 입력 | 정규화 |
|------|--------|
| `nature_and_soul`, `본연의_성정` | `natureAndSoul` |
| `first_half`, `상반기` | `firstHalf` |
| `second_half`, `하반기` | `secondHalf` |
| `overall_score`, `종합점수` | `overallScore` |
| `lucky_days`, `길일` | `luckyDays` |
| `lucky_nights`, `길야` | `luckyNights` |

### 검증 실패 시 동작

```python
# raise_on_error=True → 예외 발생 → 재시도 로직에서 처리
try:
    validated = validate_yearly_step(step, normalized, raise_on_error=True)
except Exception:
    # 재시도 (최대 3회)
```

> **중요**: 검증 실패 시 기본값으로 대체하지 않고 **재시도**합니다.
> 선택적 필드(luckyDays 등)만 누락 시 기본값 `[]`으로 채워집니다.

---

## 연간 요약 (summary)

**글자 수**: 300-500자 (v2.5에서 100자 → 확장)

**프롬프트 위치**: `python/prompts/yearly_steps.py` - `build_overview()`

**포함 내용**:
- 올해의 주요 특징
- 핵심 기회와 도전
- 주의할 점
- 서사체 작성

---

## 재시도 전략 (v2.9)

각 단계 **3회 재시도** + **에러/응답 피드백** (report_analysis 패턴):

```python
last_error = None
last_response = None

for attempt in range(1, max_retries + 1):
    try:
        result = await self._call_gemini(
            prompt, step_name,
            previous_error=last_error if attempt > 1 else None,
            previous_response=last_response if attempt > 1 else None
        )
        last_response = result  # 다음 시도 피드백용
        # 검증 + DB 중간 저장
        break
    except Exception as e:
        last_error = str(e)
        logger.warning(f"실패 ({attempt}/{max_retries}): {e}")
```

**Gemini 피드백 프롬프트** (v2.9):
```
[이전 시도 실패 - 반드시 수정 필요]
이전 응답:
{ ... (JSON) ... }

오류: 누락된 섹션: ['natureAndSoul', ...]
위 응답의 오류를 수정하여 올바른 JSON으로 응답하세요.
```

**실패 시**:
- 해당 필드 `null` 설정
- `failed_steps` 배열에 추가
- 다음 단계로 진행

---

## 프롬프트 빌더

**파일**: `python/prompts/yearly_steps.py`

```python
class YearlyStepPrompts:
    @staticmethod
    def build_overview(language, year, pillars, daewun) -> str

    @staticmethod
    def build_monthly(language, year, months, pillars, daewun, overview_result) -> str

    @staticmethod
    def build_yearly_advice(language, year, pillars, daewun, overview_result) -> str

    @staticmethod
    def build_key_dates(language, year, pillars, monthly_fortunes) -> str

    @staticmethod
    def build_classical_refs(language, year, pillars, overview_result) -> str
```

---

## DB 저장

**테이블**: `yearly_analyses`

```sql
CREATE TABLE yearly_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  profile_id UUID REFERENCES profiles,
  target_year INT,
  analysis JSONB,           -- 전체 분석 (롤백용, 레거시)
  -- v2.5: 개별 섹션 컬럼
  overview JSONB,           -- year, summary, yearlyTheme, overallScore
  monthly_fortunes JSONB,   -- 12개월 운세 배열
  yearly_advice JSONB,      -- 6섹션 연간 조언
  key_dates JSONB,          -- 핵심 길흉일
  classical_refs JSONB,     -- 고전 인용
  status TEXT,  -- pending, in_progress, completed, failed
  error TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**듀얼 라이트 패턴 (v2.5)**:
```python
# Python 저장 시 analysis + 개별 컬럼 동시 저장
update_data = {
    "analysis": analysis,
    "overview": {
        "year": analysis.get("year"),
        "summary": analysis.get("summary"),
        ...
    },
    "monthly_fortunes": analysis.get("monthlyFortunes"),
    ...
}
```

**읽기 우선순위 (v2.5)**:
```typescript
// 개별 컬럼 우선, analysis 폴백
const analysisResult = {
  year: analysis.overview?.year ?? analysis.analysis?.year,
  monthlyFortunes: analysis.monthly_fortunes ?? analysis.analysis?.monthlyFortunes,
  ...
};
```

---

## 관련 문서

- [fortune_engine.md](./fortune_engine.md) - 만세력 엔진, 점수 시스템
- [report_analysis.md](./report_analysis.md) - 리포트 분석 파이프라인
- [consultation.md](./consultation.md) - 상담 AI 프롬프트

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-12 | v4.0 | Pydantic 검증 추가 (yearly_fortune.py), 2단계 정규화+검증 파이프라인 |
| 2026-01-07 | v2.9 | 검증 키 camelCase 통일, reanalyze_step() 3회 재시도 + 이전 응답 피드백 |
| 2026-01-07 | v2.8 | response_schema 미지원 필드 제거 (minimum, maximum, minItems, enum → description) |
| 2026-01-07 | v2.7 | 재분석 API 응답 중첩 제거, 만세력 422 에러 친절한 메시지 |
| 2026-01-07 | v2.6 | DB 컬럼 분리 (듀얼 라이트 + 폴백 읽기) |
| 2026-01-07 | v2.5 | 키 camelCase 정규화, summary 300-500자 확장, normalize_yearly_advice() 추가 |
| 2026-01-06 | v2.0 | 8단계 파이프라인, 재분석 기능 |

---

**최종 수정**: 2026-01-12 (v4.0)
