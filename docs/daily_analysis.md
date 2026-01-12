# 오늘의 운세 시스템 v4.0

> 구독자/무료체험 전용 일일 운세 분석 서비스 (고전 명리학 기반 고도화 + Report 패턴)

## 개요

매일 사용자의 사주(대표 프로필)와 당일 간지를 고전 명리학 이론에 기반하여 분석합니다.

### v4.0 주요 변경 (Task 12-15 고도화)

| 항목 | v3.0 | v4.0 |
|------|------|------|
| **파이프라인** | 10단계 | 14단계 |
| **형/파/해/원진** | ❌ 미적용 | ✅ 부정적 상호작용 감지 (-7~-15점) |
| **12신살** | ❌ 미적용 | ✅ 길신/흉신 감지 (±10~15점) |
| **조후 튜닝** | ❌ 미적용 | ✅ 계절 기후 워드 (+12점) |
| **물상론** | ❌ 미적용 | ✅ 십신 사건 키워드 프롬프트 |

### v3.0 주요 변경 (Report Analysis 패턴 도입)

| 항목 | v2.0 | v3.0 |
|------|------|------|
| **중간 저장** | ❌ 최종만 저장 | ✅ 각 단계마다 DB 저장 |
| **상태 추적** | ❌ 없음 | ✅ status, progress_percent |
| **상태 폴링 API** | ❌ 없음 | ✅ `GET /api/daily-fortune/status` |
| **Fallback 처리** | ❌ 전체 실패 | ✅ Gemini 실패 시 기본값 |
| **진행률 UI** | ❌ 스피너만 | ✅ Progress bar + 단계 표시 |
| **재시도 피드백** | ✅ 있음 | ✅ 3회 재시도 + error feedback |

### v2.0 주요 변경

| 항목 | v1.0 | v2.0 |
|------|------|------|
| 파이프라인 | 3단계 | 10단계 |
| 12운성 | 미적용 | 점수 보정 (±6점) |
| 복음/반음 | 미적용 | 감지 및 배수 적용 |
| 조후용신 | 미적용 | 계절 맞춤 분석 (+10점) |
| 삼합/방합 | 미적용 | 국 형성 시 영역 점수 상승 |
| 행운 정보 | 당일 오행 기준 | 개인 용신 기반 개인화 |

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

### 14단계 파이프라인 (v4.0 - Task 12-15 고도화)

```
[1. 일진 계산]        → 진행률 5%
       ↓
[2. 12운성 분석]      → 진행률 10%  (Task 7)
       ↓
[3. 복음/반음 감지]   → 진행률 15%  (Task 8)
       ↓
[4. 형/파/해/원진]    → 진행률 20%  (Task 12) ← 신규
       ↓
[5. 12신살 감지]      → 진행률 25%  (Task 13) ← 신규
       ↓
[6. 조후용신 분석]    → 진행률 30%  (Task 9)
       ↓
[7. 조후 튜닝]        → 진행률 35%  (Task 15) ← 신규
       ↓
[8. 삼합/방합 감지]   → 진행률 40%  (Task 10)
       ↓
[9. 용신 정보 조회]   → 진행률 45%  (Task 11)
       ↓
[10. 물상론 정보]     → 진행률 50%  (Task 14) ← 신규
       ↓
[11. Gemini 분석]     → 진행률 75%  (3회 재시도 + Fallback)
       ↓
[12. 점수 보정]       → 진행률 85%
       ↓
[13. 영역별 점수 반영] → 진행률 90%
       ↓
[14. 완료]            → 진행률 100%, status='completed'
```

### 진행률 상수 (DAILY_FORTUNE_PROGRESS)

```python
DAILY_FORTUNE_PROGRESS = {
    "day_calculation": 5,        # Step 1
    "wunseong": 10,              # Step 2 (Task 7)
    "timing": 15,                # Step 3 (Task 8)
    "negative_interactions": 20, # Step 4 (Task 12) ← 신규
    "shinssal": 25,              # Step 5 (Task 13) ← 신규
    "johu": 30,                  # Step 6 (Task 9)
    "johu_tuning": 35,           # Step 7 (Task 15) ← 신규
    "combination": 40,           # Step 8 (Task 10)
    "useful_god": 45,            # Step 9 (Task 11)
    "mulsangron": 50,            # Step 10 (Task 14) ← 신규
    "gemini_analysis": 75,       # Step 11 (가장 오래 걸림)
    "score_adjustment": 85,      # Step 12
    "area_adjustment": 90,       # Step 13
    "complete": 100,             # Step 14
}
```

### 중간 저장 패턴 (_update_fortune_status)

Report Analysis 패턴을 적용하여 각 단계마다 DB에 상태를 저장합니다.

```python
async def _update_fortune_status(
    self,
    user_id: str,
    profile_id: str,
    fortune_date: str,
    status: str,                    # pending | in_progress | completed | failed
    progress_percent: int,          # 0-100
    step_statuses: Dict[str, str],  # 각 단계별 상태
    partial_result: Dict = None,    # 중간 결과 (gemini_result 등)
    error: Dict = None              # 에러 정보
)
```

### Fallback 처리

Gemini 3회 재시도 실패 시 기본 운세 응답을 반환합니다 (전체 실패 방지).

```python
FALLBACK_MESSAGES = {
    'ko': {
        'summary': '오늘은 평온한 하루가 예상됩니다...',
        'career': '업무에서 큰 변화 없이 안정적인 흐름이 이어집니다.',
        'wealth': '재물 운은 평이합니다...',
        ...
    },
    'en': {...}, 'ja': {...}, 'zh-CN': {...}, 'zh-TW': {...}
}

def _get_fallback_fortune(self, language: str) -> Dict:
    """Gemini 실패 시 기본 운세 응답"""
    msgs = FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES['ko'])
    return {
        "overallScore": 50,
        "summary": msgs['summary'],
        "careerFortune": {...},
        ...
    }
```

### 점수 계산 공식 (v4.0)

```python
base_score = Gemini 분석 점수 (0-100)

# 긍정적 보너스 (Task 7-11, 13, 15)
total_bonus = (
    wunseong_bonus +      # 12운성 (±6점, Task 7)
    johu_bonus +          # 조후 일치 (+10점, Task 9)
    combination_bonus +   # 삼합/방합 (+8~15점, Task 10)
    useful_god_bonus +    # 용신 일치 (+15점, Task 11)
    shinssal_bonus +      # 12신살 (±10~15점, Task 13) ← 신규
    johu_tuning_bonus     # 조후 튜닝 (+12점, Task 15) ← 신규
)

# 부정적 패널티 (Task 12)
total_penalty = (
    hyeong_penalty +      # 형(刑) (-15점)
    pa_penalty +          # 파(破) (-10점)
    hae_penalty +         # 해(害) (-10점)
    wonjin_penalty        # 원진(元辰) (-7점)
)

# 복음/반음 배수
timing_modifier = 1.0
if 복음: timing_modifier += 0.4
if 반음: timing_modifier += 0.7

# 최종 점수 계산
adjusted_score = (base_score + total_bonus + total_penalty - 50) × timing_modifier + 50
final_score = clamp(adjusted_score, 0, 100)
```

### 파일 구조

| 레이어 | 파일 | 설명 |
|--------|------|------|
| API | `src/app/api/daily-fortune/route.ts` | GET(조회), POST(생성) |
| API | `src/app/api/daily-fortune/history/route.ts` | 히스토리 조회 |
| Python | `python/main.py` | `GET /api/daily-fortune/status` 상태 폴링 |
| Python | `python/services/daily_fortune_service.py` | 10단계 파이프라인 (v3.0) |
| Python | `python/prompts/daily_prompts.py` | Gemini 프롬프트 |
| Python | `python/schemas/daily.py` | Pydantic 스키마 |
| Frontend | `src/components/daily-fortune/` | 컴포넌트 (generating 진행률 UI) |

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

### GET /api/daily-fortune/status (v3.0)

진행 상태 폴링 (generating 화면용)

**쿼리 파라미터**:
- `profile_id`: 프로필 ID (필수)
- `date`: 날짜 YYYY-MM-DD (필수)

**응답 (진행 중)**:
```json
{
  "status": "in_progress",
  "progress_percent": 60,
  "step_statuses": {
    "day_calculation": "completed",
    "wunseong": "completed",
    "timing": "completed",
    "johu": "completed",
    "combination": "completed",
    "useful_god": "in_progress",
    "gemini_analysis": "pending",
    "score_adjustment": "pending",
    "complete": "pending"
  }
}
```

**응답 (완료)**:
```json
{
  "status": "completed",
  "progress_percent": 100,
  "step_statuses": { ... },
  "result": {
    "id": "uuid",
    "fortune_date": "2026-01-12",
    "overall_score": 75,
    ...
  }
}
```

**응답 (실패)**:
```json
{
  "status": "failed",
  "progress_percent": 60,
  "step_statuses": { ... },
  "error": {
    "message": "Gemini API 호출 실패",
    "step": "gemini_analysis"
  }
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

### DailyFortuneService v4.0

```python
class DailyFortuneService:
    """오늘의 운세 분석 서비스 v4.0 (Task 12-15 고도화)"""

    async def generate_fortune(self, user_id, profile_id, target_date, pillars, daewun, language):
        # Step 1: 당일 간지 계산
        day_pillars = self.calculate_day_pillars(target_date)

        # Step 2: 12운성 분석 (Task 7)
        wunseong_info = self.calculate_12wunseong_score(pillars, day_branch)

        # Step 3: 복음/반음 감지 (Task 8)
        timing_info = self.detect_timing_patterns(pillars, day_stem, day_branch)

        # Step 4: 형/파/해/원진 감지 (Task 12) ← 신규
        negative_interactions_info = self.detect_negative_interactions(pillars, day_branch)

        # Step 5: 12신살 감지 (Task 13) ← 신규
        shinssal_info = self.detect_12shinssal(year_branch, day_branch)

        # Step 6: 조후용신 분석 (Task 9)
        johu_info = self.analyze_johu(pillars, day_stem, target_date)

        # Step 7: 조후 튜닝 워드 (Task 15) ← 신규
        johu_tuning_info = self.apply_johu_tuning(month_branch, day_stem)

        # Step 8: 삼합/방합 감지 (Task 10)
        combination_info = self.detect_combination_formation(pillars, day_branch)

        # Step 9: 용신 정보 조회 (Task 11)
        useful_god = await self.get_useful_god_from_report(profile_id)

        # Step 10: 물상론 정보 (Task 14) ← 신규
        mulsangron_info = self.get_mulsangron_info(day_stem, natal_day_stem, language)

        # Step 11: Gemini 분석 (고도화 정보 전달)
        fortune_result = await self._analyze_fortune(...)

        # Step 12-14: 점수 보정, 영역 반영, DB 저장
        ...
        return result
```

### 고전 명리학 모듈

#### 12운성 분석 (Task 7)

일간이 당일 지지에서 어떤 12운성 상태인지 계산

```python
WUNSEONG_WEIGHTS = {
    '건록': +0.6, '제왕': +0.6,  # 최강 (+6점)
    '장생': +0.3, '관대': +0.4,  # 좋음
    '사': -0.4, '묘': -0.4, '절': -0.4,  # 약함 (-4점)
}

def calculate_12wunseong_score(self, pillars, day_branch):
    wunseong = get_12wunseong(day_stem, day_branch)
    score_bonus = WUNSEONG_WEIGHTS.get(wunseong, 0) * 10
    return {"wunseong": wunseong, "score_bonus": score_bonus}
```

#### 복음/반음 감지 (Task 8)

- **복음(伏吟)**: 당일 간지 = 원국 간지 → 사건 반복 (×1.4)
- **반음(反吟)**: 당일 지지가 원국 지지와 충 → 급변 (×1.7)

```python
def detect_timing_patterns(self, pillars, day_stem, day_branch):
    fuyin_list = []  # 복음 발생 위치
    fanyin_list = []  # 반음 발생 위치

    for pillar in ['year', 'month', 'day', 'hour']:
        if natal_stem == day_stem and natal_branch == day_branch:
            fuyin_list.append({'type': 'full', ...})
        if BRANCH_CHUNG.get(natal_branch) == day_branch:
            fanyin_list.append(...)

    score_modifier = 1.0 + 0.4*len(fuyin) + 0.7*len(fanyin)
    return {"score_modifier": score_modifier, "message": ...}
```

#### 조후용신 분석 (Task 9)

월령에 따른 조후 필요 오행 판단 (궁통보감 기반)

```python
JOHU_NEEDED_STEMS = {
    '子': ['丙', '戊'],  # 한겨울: 火로 조한
    '午': ['壬', '庚'],  # 한여름: 水로 조열
    ...
}

def analyze_johu(self, pillars, day_stem, target_date):
    needed = JOHU_NEEDED_STEMS.get(month_branch, [])
    matches = day_stem in needed
    return {"day_stem_matches": matches, "score_bonus": 10 if matches else 0}
```

#### 삼합/방합 감지 (Task 10)

당일 지지가 원국과 삼합/방합 완성 여부 확인

```python
SAMHAP = {
    ('寅', '午', '戌'): ('火局', '인오술 화국'),
    ('申', '子', '辰'): ('水局', '신자진 수국'),
    ...
}

# 점수 보너스
삼합 완성: +15점
방합 완성: +12점
반합: +8점

# 영역 매핑
水局 → wealth_fortune (+20점)
木局 → career_fortune (+20점)
火局 → love_fortune (+20점)
```

#### 용신 기반 행운 정보 (Task 11)

개인 사주의 용신을 기반으로 행운 정보 개인화

```python
# 기존 (모든 사람 동일)
day_element = '火' → lucky_color = '빨간색'

# 개선 (개인 용신 기반)
useful_god = '水' → lucky_color = '검정색'
useful_god = '木' → lucky_direction = '동쪽'

# 용신 일치 보너스
if 당일 천간 오행 == 용신: +15점
```

#### 형/파/해/원진 분석 (Task 12)

당일 지지와 원국 지지 간 부정적 상호작용 감지

```python
# 형(刑) - 3종류 + 자형
JICHE_HYEONG = {
    '무은지형': frozenset(['寅', '巳', '申']),  # 은혜 없는 형벌
    '지세지형': frozenset(['丑', '戌', '未']),  # 권세에 기댄 형벌
    '무례지형': frozenset(['子', '卯']),        # 예의 없는 형벌
}
JICHE_JAHYEONG = frozenset(['辰', '午', '酉', '亥'])  # 자형

# 파(破)
JICHE_PA = {('子', '酉'), ('丑', '辰'), ('寅', '亥'), ...}

# 해(害)
JICHE_HAE = {('子', '未'), ('丑', '午'), ('寅', '巳'), ...}

# 원진(元辰) - 심리적 갈등
JICHE_WONJIN = {'子': '未', '丑': '午', '寅': '巳', ...}

# 점수 감점
NEGATIVE_INTERACTION_SCORES = {
    '형': -15,   # 가장 심각
    '파': -10,
    '해': -10,
    '원진': -7,  # 심리적 영향
}
```

#### 12신살 분석 (Task 13)

연지(年支) 기준으로 당일 지지에 해당하는 신살 판단

```python
SHINSSAL_TABLE = {
    '역마살': {  # 이동, 변동 (+10점)
        frozenset(['申', '子', '辰']): '寅',
        frozenset(['寅', '午', '戌']): '申',
        frozenset(['巳', '酉', '丑']): '亥',
        frozenset(['亥', '卯', '未']): '巳',
    },
    '장성살': {...},  # 리더십 (+12점)
    '화개살': {...},  # 학문/예술 (+8점)
    '겁살': {...},    # 갑작스러운 변화 (-12점)
    '재살': {...},    # 재난 위험 (-15점)
    '천살': {...},    # 하늘의 재앙 (-10점)
}

SHINSSAL_SCORES = {
    '역마살': {'score': 10, 'favorable': True},
    '장성살': {'score': 12, 'favorable': True},
    '화개살': {'score': 8, 'favorable': True},
    '겁살': {'score': -12, 'favorable': False},
    '재살': {'score': -15, 'favorable': False},
    '천살': {'score': -10, 'favorable': False},
}
```

#### 물상론 정보 (Task 14)

기존 `mulsangron.py` DB를 활용하여 십신별 사건 키워드 프롬프트에 적용

```python
def get_mulsangron_info(self, day_stem, natal_day_stem, language):
    """물상론 정보 반환"""
    ten_god = self._calculate_ten_god(day_stem, natal_day_stem)

    from prompts.mulsangron import MULSANGRON
    mulsang_data = MULSANGRON.get(ten_god, {})

    return {
        "ten_god": ten_god,
        "ten_god_hanja": "正官",
        "relationship": "당일 천간이 일간을 극함",
        "favorable_events": ["승진", "관직 취득", "명예 획득"],
        "unfavorable_events": ["관재", "송사", "해고"],
        "related_people": ["상사", "정부 관리"],
    }
```

#### 조후 튜닝 워드 (Task 15)

계절별 기후 특성(寒/暖/燥/濕) 워드 적용

```python
MONTH_CLIMATE = {
    '寅': '寒', '卯': '濕', '辰': '濕',  # 봄
    '巳': '暖', '午': '暖', '未': '燥',  # 여름
    '申': '燥', '酉': '燥', '戌': '燥',  # 가을
    '亥': '寒', '子': '寒', '丑': '寒',  # 겨울
}

JOHU_TUNING_WORDS = {
    '寒': {
        'feeling': '활동력 저하, 움츠림',
        'solution': ['丙', '丁'],  # 火
        'message_lack': '활력이 떨어지기 쉬운 날입니다.',
        'message_solve': '오늘은 활력을 되찾기 좋은 날입니다!',
    },
    '暖': {
        'feeling': '과잉 활동, 소진',
        'solution': ['壬', '癸'],  # 水
        ...
    },
    '燥': {...},
    '濕': {...},
}

# 조후 해결 시 +12점
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

  -- v3.0: 진행 상태 추적
  status TEXT DEFAULT 'completed',          -- pending | in_progress | completed | failed
  progress_percent INTEGER DEFAULT 100,     -- 0-100
  step_statuses JSONB DEFAULT '{}',         -- 각 단계별 상태
  error JSONB,                              -- 에러 정보
  gemini_result JSONB,                      -- Gemini 원본 응답 (중간 저장용)

  language TEXT DEFAULT 'ko',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, fortune_date)
);

-- 상태 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_fortunes_status
  ON daily_fortunes(user_id, profile_id, fortune_date, status);
```

### users 테이블 (추가 컬럼)

```sql
ALTER TABLE users ADD COLUMN daily_fortune_trial_started_at TIMESTAMPTZ DEFAULT NULL;
```

## 상담 탭 연동 (v5.0)

오늘의 운세 상세 페이지에서 AI 상담이 가능합니다.

### 탭 구조

| 탭 | 설명 |
|-----|------|
| 운세 | 기존 운세 상세 정보 |
| 상담 | ConsultationTab 컴포넌트 재사용 |

### URL 파라미터

```
/daily-fortune/{id}?tab=fortune   # 운세 탭 (기본)
/daily-fortune/{id}?tab=consultation  # 상담 탭
```

### 권한 제어

- **운세 탭**: 공유 링크로 누구나 접근 가능
- **상담 탭**: 본인만 접근 가능 (타인 → AUTH_FORBIDDEN 에러)

### 컴포넌트 구조

```
DailyFortuneDetailPage
├── AppHeader (공유 버튼: 운세 탭에서만 표시)
├── DailyFortuneNavigation (2탭: 운세/상담)
├── [운세 탭] 기존 운세 컨텐츠
└── [상담 탭] ConsultationTab (profileId 전달)
```

### 파일

| 파일 | 설명 |
|------|------|
| `src/components/daily-fortune/DailyFortuneNavigation.tsx` | 탭 네비게이션 |
| `src/app/[locale]/daily-fortune/[id]/page.tsx` | 상세 페이지 (탭 로직) |

---

## 프론트엔드 컴포넌트

### DailyFortuneCard (v3.0)

홈 화면 최상단에 배치되는 메인 카드

```tsx
<DailyFortuneCard />
// 상태: loading → subscription | generating | ready | error
```

**v3.0 generating 화면 개선**:

```tsx
// 상태 폴링 (1초 간격, 최대 60초)
const pollStatus = async () => {
  const res = await fetch(`/api/daily-fortune/status?profile_id=...&date=...`);
  const data = await res.json();

  setProgress(data.progress_percent);
  setCurrentStep(inProgressStep);

  if (data.status === 'completed') {
    setData(data.result);
    setState('ready');
  }
};

// Progress Bar + 현재 단계 표시
<div className="h-2 bg-[#333] rounded-full">
  <motion.div
    className="h-full bg-gradient-to-r from-[#d4af37] to-[#f5d77a]"
    animate={{ width: `${progress}%` }}
  />
</div>
<p>{STEP_LABELS[currentStep][locale]}</p>
<p>{progress}%</p>
```

**단계별 라벨 (다국어)**:

| 단계 | ko | en |
|------|-----|-----|
| day_calculation | 일진 계산 중... | Calculating day pillar... |
| wunseong | 12운성 분석 중... | Analyzing 12 stages... |
| timing | 복음/반음 감지 중... | Detecting patterns... |
| johu | 조후용신 분석 중... | Analyzing seasonal needs... |
| combination | 삼합/방합 감지 중... | Detecting combinations... |
| useful_god | 용신 정보 조회 중... | Looking up useful god... |
| gemini_analysis | AI 분석 중... | AI analyzing... |
| score_adjustment | 점수 계산 중... | Calculating scores... |
| complete | 완료! | Complete! |

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

## 응답 분석 메타 정보

v4.0부터 응답에 `_analysis_meta` 필드가 추가됩니다 (디버깅/분석용).

```json
{
  "_analysis_meta": {
    // Task 7: 12운성
    "wunseong": "건록",
    "wunseong_description": "에너지가 가장 안정적입니다...",

    // Task 8: 복음/반음
    "fuyin_count": 0,
    "fanyin_count": 1,

    // Task 9: 조후용신
    "johu_matched": true,
    "johu_advice": "추운 계절에 따뜻한 기운이...",

    // Task 10: 삼합/방합
    "combination_formed": true,
    "combination_type": "삼합",
    "affected_element": "火",

    // Task 11: 용신
    "useful_god": "水",
    "useful_god_matched": false,
    "personalized_lucky": true,

    // Task 12: 형/파/해/원진 ← 신규
    "negative_interactions": {
      "hyeong_count": 0,
      "pa_count": 1,
      "hae_count": 0,
      "wonjin_count": 1,
      "total_penalty": -17
    },

    // Task 13: 12신살 ← 신규
    "shinssal_detected": ["역마살"],
    "shinssal_bonus": 10,

    // Task 14: 물상론 ← 신규
    "mulsangron": {
      "ten_god": "정관",
      "ten_god_hanja": "正官",
      "relationship": "당일 천간이 일간을 극함"
    },

    // Task 15: 조후 튜닝 ← 신규
    "johu_tuning": {
      "climate": "寒",
      "is_solved": true,
      "bonus": 12
    },

    // v3.0: Fallback 여부
    "is_fallback": false,

    // 점수 상세 분석
    "score_breakdown": {
      "base": 65,
      "wunseong_bonus": 6,
      "johu_bonus": 10,
      "combination_bonus": 15,
      "useful_god_bonus": 0,
      "shinssal_bonus": 10,       // Task 13
      "johu_tuning_bonus": 12,    // Task 15
      "negative_penalty": -17,    // Task 12
      "timing_modifier": 1.7,
      "final": 82
    }
  }
}
```

---

**Last Updated**: 2026-01-12 (v4.0 Task 12-15 고도화)

## Changelog

### v4.0 (2026-01-12)
- **고전 명리학 확장 (Task 12-15)**
  - 형/파/해/원진 감지 (Task 12): 부정적 상호작용 분석 (-7~-15점)
  - 12신살 감지 (Task 13): 길신/흉신 판단 (±10~15점)
  - 물상론 적용 (Task 14): 십신 사건 키워드 프롬프트 통합
  - 조후 튜닝 워드 (Task 15): 계절 기후 개인화 (+12점)
- **파이프라인 확장**: 10단계 → 14단계
- **점수 계산 고도화**: 보너스 + 패널티 분리 계산
- **_analysis_meta 확장**: Task 12-15 정보 추가

### v3.0 (2026-01-12)
- **Report Analysis 패턴 도입**
  - 중간 저장 패턴 (`_update_fortune_status`)
  - 진행률 추적 (`DAILY_FORTUNE_PROGRESS`)
  - 상태 폴링 API (`GET /api/daily-fortune/status`)
  - Fallback 처리 (`_get_fallback_fortune`)
  - DB 컬럼 추가: status, progress_percent, step_statuses, error, gemini_result
- **generating 화면 개선**
  - Progress bar + 현재 단계 라벨 표시
  - 다국어 단계 라벨 (5개 언어)
  - 1초 폴링, 최대 60초 타임아웃

### v2.0 (2026-01-12)
- **고전 명리학 고도화 (Task 7-11)**
  - 12운성 점수 보정 (±6점)
  - 복음/반음 감지 (×1.4/×1.7 배수)
  - 조후용신 분석 (+10점)
  - 삼합/방합 감지 (+8~15점)
  - 용신 기반 행운 정보 개인화

### v1.0 (2026-01-12)
- 초기 구현 (3단계 파이프라인)
