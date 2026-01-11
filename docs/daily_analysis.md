# 오늘의 운세 시스템

> 구독자/무료체험 전용 일일 운세 분석 서비스

## 개요

매일 사용자의 사주(대표 프로필)와 당일 간지를 분석하여 맞춤형 운세를 제공합니다.

### 접근 조건

```
구독자 (subscription_status = 'active')
  OR
무료체험 중 (daily_fortune_trial_started_at + 3일 > NOW())
```

| 항목 | 내용 |
|------|------|
| **서비스 대상** | 구독자 + 최초 3일 무료체험 |
| **분석 기준** | 대표 프로필 (`is_primary = true`) |
| **크레딧** | 무료 (구독/무료체험 혜택) |
| **히스토리** | 최근 1년간 조회 가능 |

## 아키텍처

### 3단계 파이프라인

```
[만세력 계산] → [Gemini 분석] → [DB 저장]
     ↓              ↓              ↓
  당일 간지      6개 영역       daily_fortunes
  (일진 계산)    점수/설명         UPSERT
```

### 파일 구조

| 레이어 | 파일 | 설명 |
|--------|------|------|
| API | `src/app/api/daily-fortune/route.ts` | GET(조회), POST(생성) |
| API | `src/app/api/daily-fortune/history/route.ts` | 히스토리 조회 |
| Python | `python/services/daily_fortune_service.py` | 3단계 파이프라인 |
| Python | `python/prompts/daily_prompts.py` | Gemini 프롬프트 |
| Python | `python/schemas/daily.py` | Pydantic 스키마 |
| Frontend | `src/components/daily-fortune/` | 컴포넌트 |

## API 명세

### GET /api/daily-fortune

오늘의 운세 조회 (캐시 확인)

**응답 (성공 - 캐시 있음)**:
```json
{
  "success": true,
  "cached": true,
  "data": {
    "id": "uuid",
    "fortune_date": "2026-01-12",
    "day_stem": "甲",
    "day_branch": "子",
    "day_element": "木",
    "overall_score": 75,
    "summary": "오늘은...",
    "lucky_color": "녹색",
    "lucky_number": 3,
    "lucky_direction": "동쪽"
  },
  "profile": { "id": "...", "name": "..." },
  "subscription": {
    "isSubscribed": true,
    "isTrialActive": false,
    "trialRemainingDays": 0
  }
}
```

**응답 (캐시 없음 - 생성 필요)**:
```json
{
  "success": true,
  "cached": false,
  "needsGeneration": true,
  "data": null,
  "pillars": { "year": {...}, "month": {...}, ... },
  "daewun": [...]
}
```

**응답 (구독 필요)**:
```json
{
  "success": false,
  "requireSubscription": true,
  "canStartTrial": true,
  "message": "3일 무료체험을 시작해보세요!"
}
```

### POST /api/daily-fortune

오늘의 운세 생성 (Python 호출)

**요청**:
```json
{
  "profileId": "uuid",
  "pillars": { "year": {...}, ... },
  "daewun": [...]
}
```

**응답**:
```json
{
  "success": true,
  "cached": false,
  "data": { ... }
}
```

### GET /api/daily-fortune/history

히스토리 조회 (최대 1년)

**쿼리 파라미터**:
- `limit`: 조회 개수 (default: 30, max: 365)
- `offset`: 시작 위치 (default: 0)
- `month`: 특정 월 필터 (YYYY-MM)

**응답**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 30,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalCount": 100,
    "averageScore": 65,
    "highestScore": 92,
    "lowestScore": 38
  }
}
```

## Python 서비스

### DailyFortuneService

```python
class DailyFortuneService:
    """오늘의 운세 분석 서비스 (3단계 간소화 파이프라인)"""

    async def generate_fortune(
        self,
        user_id: str,
        profile_id: str,
        target_date: str,
        pillars: Dict,
        daewun: list = None,
        language: str = 'ko'
    ) -> Dict:
        # Step 1: 당일 간지 계산
        day_pillars = self.calculate_day_pillars(target_date)

        # Step 2: Gemini 분석
        fortune_result = await self._analyze_fortune(...)

        # Step 3: DB 저장
        await self._save_to_db(user_id, profile_id, result)

        return result
```

### 일진 계산

60갑자 기준 (1900-01-01 = 甲子일)

```python
def calculate_day_pillars(self, target_date: str) -> Dict:
    base_date = date(1900, 1, 1)
    days_diff = (target - base_date).days

    stem_idx = days_diff % 10
    branch_idx = days_diff % 12

    return {
        "stem": STEMS[stem_idx],
        "branch": BRANCHES[branch_idx],
        "element": STEM_ELEMENT[stem]
    }
```

## 분석 영역

| 영역 | 설명 |
|------|------|
| **overall_score** | 종합 운세 (0-100) |
| **career_fortune** | 직장/사업운 |
| **wealth_fortune** | 재물운 |
| **love_fortune** | 연애운 |
| **health_fortune** | 건강운 |
| **relationship_fortune** | 대인관계운 |

### 각 영역 구조

```json
{
  "score": 75,
  "title": "순조로운 업무 흐름",
  "description": "오늘은...",
  "tip": "오전 시간대에..."
}
```

## 무료체험 시스템

### 작동 방식

1. **최초 접근**: POST 요청 시 `daily_fortune_trial_started_at` 자동 설정
2. **유효 기간**: 3일 (72시간)
3. **계정당 1회**: 이미 사용한 계정은 구독 필요

### 프론트엔드 분기

```tsx
// 구독자 또는 무료체험 중
if (isSubscribed || isTrialActive) {
  return <DailyFortuneCard />;
}

// 무료체험 가능
if (canStartTrial) {
  return <SubscriptionPrompt canStartTrial onStartTrial={...} />;
}

// 구독 필요
return <SubscriptionPrompt />;
```

## DB 스키마

### daily_fortunes 테이블

```sql
CREATE TABLE daily_fortunes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fortune_date DATE NOT NULL,

  -- 당일 간지
  day_stem TEXT NOT NULL,
  day_branch TEXT NOT NULL,
  day_element TEXT NOT NULL,

  -- 분석 결과
  overall_score INTEGER NOT NULL,
  summary TEXT NOT NULL,
  lucky_color TEXT,
  lucky_number INTEGER,
  lucky_direction TEXT,

  -- 6개 영역 (JSONB)
  career_fortune JSONB,
  wealth_fortune JSONB,
  love_fortune JSONB,
  health_fortune JSONB,
  relationship_fortune JSONB,
  advice TEXT,

  language TEXT DEFAULT 'ko',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, fortune_date)
);
```

### users 테이블 (추가 컬럼)

```sql
ALTER TABLE users ADD COLUMN daily_fortune_trial_started_at TIMESTAMPTZ DEFAULT NULL;
```

## 프론트엔드 컴포넌트

### DailyFortuneCard

홈 화면 최상단에 배치되는 메인 카드

```tsx
<DailyFortuneCard />
// 상태: loading → subscription | generating | ready | error
```

### FortuneScoreGauge

원형 점수 게이지

```tsx
<FortuneScoreGauge score={75} size="md" />
```

### SubscriptionPrompt

비구독자용 구독 유도 카드

```tsx
<SubscriptionPrompt
  canStartTrial={true}
  onStartTrial={() => {...}}
/>
```

## 오행 색상

| 오행 | Hex | 용도 |
|------|-----|------|
| 木 | `#4ade80` | 점수 80+ |
| 火 | `#ef4444` | 점수 20- |
| 土 | `#f59e0b` | 점수 40-60 |
| 金 | `#e5e7eb` | 간지 표시 |
| 水 | `#1e3a8a` | 간지 표시 |

---

**Last Updated**: 2026-01-12
