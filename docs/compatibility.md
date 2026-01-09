# 궁합 분석 시스템

> 연인 궁합 분석 - Python 점수 엔진 + Gemini AI 해석

## 개요

두 사람의 사주를 비교하여 궁합을 분석하는 시스템.
- **Python 엔진**: 만세력 계산 + 점수 계산 (100% 규칙 기반)
- **Gemini AI**: 점수 기반 해석 생성 (점수 계산 X)

## 크레딧

| 서비스 | 비용 |
|--------|------|
| 연인 궁합 | 70C |
| 무료 재시도 | 0C (실패한 분석 재시도) |

---

## 아키텍처

```
클라이언트 (Next.js)
    ↓ POST /api/analysis/compatibility
Next.js API Route
    ↓ 프로필 검증, 만세력 체크, 크레딧 차감
Python 백엔드 (Railway)
    ↓ 10단계 비동기 파이프라인
    ↓ GET /api/analysis/compatibility/{job_id}/status (폴링)
완료 → DB 저장 (Supabase)
```

---

## 파이프라인 (10단계)

| 단계 | 이름 | 엔진 | 설명 | 진행률 |
|------|------|------|------|--------|
| 1 | `manseryeok_a` | Python | A 사주 팔자 + 대운 계산 | 5% |
| 2 | `manseryeok_b` | Python | B 사주 팔자 + 대운 계산 | 10% |
| 3 | `compatibility_score` | Python | 5개 항목 점수 계산 | 25% |
| 4 | `trait_scores` | Python | 연애 스타일 5항목 | 35% |
| 5 | `relationship_type` | Gemini | 인연의 성격 분석 | 50% |
| 6 | `trait_interpretation` | Gemini | 연애 스타일 해석 | 60% |
| 7 | `conflict_analysis` | Gemini | 갈등 포인트 분석 | 70% |
| 8 | `marriage_fit` | Gemini | 결혼 적합도 분석 | 80% |
| 9 | `mutual_influence` | Gemini | 상호 영향 분석 | 90% |
| 10 | `saving` | DB | 결과 저장 | 97% |
| - | `complete` | - | 완료 | 100% |

**에러 처리**:
- Step 1-4 (Python): 실패 시 파이프라인 중단
- Step 5-9 (Gemini): 3회 재시도 후 실패해도 계속 진행, `failed_steps`에 기록

---

## Python 점수 엔진 (Step 3-4)

### 6개 항목 점수 (가중치 합 100%) - v2.0

| 항목 | 가중치 | 계산 로직 | 함수 |
|------|--------|-----------|------|
| 천간 조화 | 24% | 5합 성립률 (갑기합토, 을경합금...) | `calculate_stem_harmony()` |
| 지지 조화 | 24% | 6합(+) - 충×1.4 - 형×1.5 - 원진×0.8 - 파/해 | `calculate_branch_harmony()` |
| 오행 균형 | 19% | 보완 오행 +12, 과다 오행 -8 | `calculate_element_balance()` |
| 십신 호환 | 19% | `TEN_GOD_COMPATIBILITY` 매트릭스 | `calculate_ten_god_compatibility()` |
| 12운성 시너지 | 9% | 교차평가 (A일간→B일지, B일간→A일지) | `calculate_wunseong_synergy()` |
| 삼합/방합 시너지 | 5% | 삼합 3개 +20, 반합 +8, 방합 +15 | `calculate_combination_synergy()` |

**총점 계산**:
```python
total_score = int(
    stem_harmony * 0.24 +
    branch_harmony * 0.24 +
    element_balance * 0.19 +
    ten_god_compat * 0.19 +
    wunseong_synergy * 0.09 +
    combination_synergy * 0.05
)
```

### 천간 5합 규칙

```python
STEM_COMBINATIONS = {
    ('甲', '己'): ('土', ['辰', '戌', '丑', '未'], '갑기합토'),
    ('乙', '庚'): ('金', ['申', '酉'], '을경합금'),
    ('丙', '辛'): ('水', ['亥', '子'], '병신합수'),
    ('丁', '壬'): ('木', ['寅', '卯'], '정임합목'),
    ('戊', '癸'): ('火', ['巳', '午'], '무계합화'),
}
```

### 지지 상호작용 배수

| 관계 | 효과 | 배수 |
|------|------|------|
| 6합 | +20점 | ×0.6~1.0 |
| 충 | -25점 | ×1.4 |
| 형 | -20점 | ×1.5 |
| 원진 | -5~-15점 | ×0.8 |
| 해 | -10점 | ×1.0 |
| 파 | -10점 | ×1.0 |

### 원진(元辰) 페널티 (v2.0)

```python
WONJIN = {
    '子': '酉', '丑': '午', '寅': '未', '卯': '申',
    '辰': '亥', '巳': '戌', '午': '丑', '未': '寅',
    '申': '卯', '酉': '子', '戌': '巳', '亥': '辰',
}
```

| 위치 조합 | 감점 |
|-----------|------|
| 일지-일지 원진 | -15점 × 0.8 |
| 월지-일지 원진 | -10점 × 0.8 |
| 기타 원진 | -5점 × 0.8 |

### 삼합/방합 시너지 (v2.0)

```python
SAMHAP = {
    ('寅', '午', '戌'): ('火局', '인오술 화국'),
    ('申', '子', '辰'): ('水局', '신자진 수국'),
    ('巳', '酉', '丑'): ('金局', '사유축 금국'),
    ('亥', '卯', '未'): ('木局', '해묘미 목국'),
}
```

| 조합 | 보너스 |
|------|--------|
| 삼합 3개 형성 | +20점 |
| 반합 형성 | +8점 |
| 방합 3개 형성 | +15점 |

### 도화살 분석 (v2.0)

```python
DOHWA = {
    '寅': '卯', '午': '卯', '戌': '卯',  # 인오술 → 묘
    '申': '酉', '子': '酉', '辰': '酉',  # 신자진 → 유
    '巳': '午', '酉': '午', '丑': '午',  # 사유축 → 오
    '亥': '子', '卯': '子', '未': '子',  # 해묘미 → 자
}
```

| 유형 | 보너스 | 설명 |
|------|--------|------|
| 쌍방 도화 | +15점 | 서로 도화 성립 |
| 일방 도화 | +8점 | 한쪽만 도화 |
| 특별 끌림 | +10점 | A 도화지가 B 사주에 존재 |

### 연애 스타일 5항목 (Step 4)

| 항목 | 영문 키 | 주요 십신 |
|------|---------|-----------|
| 표현력 | expression | 식신×1.5, 상관×1.3 |
| 독점욕 | possessiveness | 편관×1.5, 겁재×1.3 |
| 헌신도 | devotion | 정인×1.5, 정재×1.3 |
| 모험심 | adventure | 편재×1.5, 상관×1.3 |
| 안정추구 | stability | 정관×1.5, 정인×1.3 |

---

## Gemini AI 분석 (Step 5-9)

**모델**: Gemini 2.0 Flash (response_schema 제어)

### Step 5: 인연의 성격 (`relationship_type`)

**출력**:
```json
{
  "keywords": ["키워드 3-4개"],
  "firstImpression": "첫인상과 끌림 (150-200자)",
  "developmentPattern": "관계 발전 패턴 (200-300자)"
}
```

### Step 6: 연애 스타일 해석 (`trait_interpretation`)

**출력**:
```json
{
  "items": [
    {
      "trait": "expression",
      "traitName": "표현력",
      "a_interpretation": "A의 해석 (50-100자)",
      "b_interpretation": "B의 해석 (50-100자)",
      "comparison": "비교 (80-120자)"
    }
    // ... 5개
  ],
  "overall": "종합 평가 (150-200자)"
}
```

### Step 7: 갈등 포인트 (`conflict_analysis`)

**입력 강조**: 간지 상호작용 (충/형/해/파)

**출력**:
```json
{
  "conflictPoints": [
    {
      "source": "갈등 원인",
      "description": "일상 표현 (100-150자)",
      "resolution": "해결 조언 (80-120자)"
    }
    // ... 2-4개
  ],
  "avoidBehaviors": ["피해야 할 행동 3-4개"],
  "communicationTips": "소통 방법 (100-150자)"
}
```

### Step 8: 결혼 적합도 (`marriage_fit`)

**출력**:
```json
{
  "score": 75,  // 결혼 관점 재평가 (총점과 별개)
  "postMarriageChange": "결혼 후 변화 (150-200자)",
  "roleDistribution": "역할 분담 (100-150자)",
  "childFortune": "자녀운 (100-150자)",
  "wealthSynergy": "재물운 (100-150자)"
}
```

### Step 9: 상호 영향 (`mutual_influence`)

**입력 강조**: 십신 관계 (A→B, B→A)

**출력**:
```json
{
  "aToB": {
    "tenGod": "정재",
    "meaning": "십신 의미 (50-80자)",
    "positiveInfluence": "긍정 영향 (100-150자)",
    "caution": "주의점 (80-120자)"
  },
  "bToA": { ... },
  "synergy": "시너지 요약 (150-200자)"
}
```

---

## API 엔드포인트

### 분석 시작 (Next.js → Python)

**Next.js**: `POST /api/analysis/compatibility`

```json
// Request
{
  "profileIdA": "uuid",
  "profileIdB": "uuid",
  "analysisType": "romance",
  "language": "ko"
}

// Response (성공)
{
  "success": true,
  "analysisId": "uuid",
  "jobId": "uuid",
  "status": "processing",
  "pollUrl": "/api/analysis/compatibility/{id}"
}

// Response (만세력 없음)
{
  "success": false,
  "error": "여호정의 기본 사주 분석을 먼저 완료해주세요.",
  "errorCode": "SAJU_REQUIRED",
  "missingProfiles": ["여호정"]
}
```

### 상태 조회 (폴링)

**Next.js**: `GET /api/analysis/compatibility/{id}`

```json
// 진행 중
{
  "success": true,
  "status": "processing",
  "progressPercent": 50,
  "currentStep": "relationship_type",
  "stepStatuses": {
    "manseryeok_a": "completed",
    "manseryeok_b": "completed",
    "compatibility_score": "completed",
    "trait_scores": "completed",
    "relationship_type": "in_progress",
    ...
  }
}

// 완료
{
  "success": true,
  "status": "completed",
  "progressPercent": 100,
  "data": { ... 전체 분석 결과 ... }
}
```

### 기존 분석 확인 (UI용)

**Next.js**: `GET /api/analysis/compatibility/check?profileIdA=...&profileIdB=...`

```json
// 무료 재시도 가능
{
  "exists": true,
  "isFreeRetry": true,
  "status": "failed",
  "analysisId": "uuid"
}

// 이미 완료
{
  "exists": true,
  "isCompleted": true,
  "analysisId": "uuid"
}
```

---

## DB 스키마

테이블: `compatibility_analyses`

```sql
id UUID PRIMARY KEY,
user_id TEXT NOT NULL,
profile_id_a UUID, profile_id_b UUID,
analysis_type VARCHAR DEFAULT 'romance',
language VARCHAR DEFAULT 'ko',
status VARCHAR DEFAULT 'pending',  -- pending/processing/completed/failed
job_id TEXT,
progress_percent INTEGER DEFAULT 0,
credits_used INTEGER DEFAULT 70,

-- Python 결과 (Step 1-4)
pillars_a JSONB, pillars_b JSONB,
daewun_a JSONB, daewun_b JSONB,
total_score INTEGER,
scores JSONB,  -- 5개 항목 상세
trait_scores_a JSONB, trait_scores_b JSONB,
interactions JSONB,  -- 간지 상호작용

-- Gemini 결과 (Step 5-9)
relationship_type JSONB,
trait_interpretation JSONB,
conflict_analysis JSONB,
marriage_fit JSONB,
mutual_influence JSONB,

-- 메타
failed_steps TEXT[] DEFAULT '{}',
error TEXT,
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ
```

---

## 프론트엔드 데이터 구조

> **중요**: Python 엔진 출력과 프론트엔드 기대값이 다를 수 있으므로 주의

### `pillars` 객체 구조

DB에서 반환되는 실제 구조:
```json
{
  "year": { "stem": "甲", "branch": "寅", "element": "木" },
  "month": { "stem": "壬", "branch": "午", "element": "水" },
  "day": { "stem": "丙", "branch": "子", "element": "火" },
  "hour": { "stem": "戊", "branch": "戌", "element": "土" }
}
```

**주의**: `element` 필드 하나만 존재. `stemElement`/`branchElement`로 분리되지 않음.

### `interactions` 객체 구조

```json
{
  "stemCombinations": [
    { "name": "갑기합토", "stems": ["甲", "己"], "formed": true, "transformedElement": "土" }
  ],
  "branchCombinations": [
    { "name": "자축합토", "branches": ["子", "丑"], "formed": true, "transformedElement": "土" }
  ],
  "branchClashes": [
    { "name": "자오충", "branches": ["子", "午"], "severity": "high" }
  ],
  "branchHarms": [
    { "name": "자미해", "branches": ["子", "未"], "severity": "medium" }
  ],
  "branchPunishments": [
    { "name": "자묘형", "branches": ["子", "卯"], "severity": "medium" }
  ],
  "branchWonjin": [
    { "type": "원진", "branches": ["卯", "申"], "severity": "low", "positions": [...] }
  ],
  "peachBlossom": {
    "typeA": "쌍방 도화",
    "typeB": "일방 도화",
    "attractionBonus": 23,
    "description": "..."
  },
  "samhapBanghap": [
    { "type": "삼합", "branches": ["寅", "午", "戌"], "element": "火", "bonus": 20 }
  ]
}
```

### `branchWonjin` 필드 (v2.0)

**실제 구조**:
```typescript
interface BranchWonjinItem {
  type: string;        // "원진"
  branches: string[];  // ["卯", "申"]
  severity: string;    // "low" | "medium" | "high"
  positions: { a: string; b: string }[];
}
```

**⚠️ `name` 필드 없음** - 프론트엔드에서 fallback 처리 필요:
```typescript
item.name || `${item.branches?.join('')}원진`
```

### `peachBlossom` 필드 (v2.0)

**실제 구조**:
```typescript
interface PeachBlossom {
  typeA: string;          // A의 도화 유형
  typeB: string;          // B의 도화 유형
  attractionBonus: number; // 매력도 보너스 (구: score)
  description: string;
}
```

**⚠️ `score` 필드명 변경** → `attractionBonus`

---

## 에러 처리

### SAJU_REQUIRED (만세력 없음)

기본 사주 분석(profile_reports)이 없는 프로필로 궁합 분석 시도 시:

```json
{
  "success": false,
  "error": "여호정, 박유민의 기본 사주 분석을 먼저 완료해주세요.",
  "errorCode": "SAJU_REQUIRED",
  "missingProfiles": ["여호정", "박유민"]
}
```

**HTTP Status**: 400

### 재시도 전략 (Gemini)

각 단계 **3회 재시도** + 이전 오류 피드백:

```python
for attempt in range(1, 4):
    try:
        result = await gemini_call(prompt, previous_error)
        break
    except Exception as e:
        previous_error = str(e)
        if attempt == 3:
            failed_steps.append(step_name)
            result = None
```

---

## 파일 구조

```
python/
├── manseryeok/
│   ├── engine.py                 # 만세력 계산
│   └── compatibility_engine.py   # 궁합 점수 계산
├── services/
│   └── compatibility_service.py  # 파이프라인 오케스트레이션
├── schemas/
│   ├── compatibility.py          # Pydantic 요청/응답
│   └── gemini_schemas.py         # Gemini response_schema
└── main.py                       # FastAPI 엔드포인트

src/
├── app/[locale]/compatibility/
│   ├── page.tsx                  # 유형 선택
│   └── romance/
│       ├── new/page.tsx          # 프로필 선택
│       └── [id]/
│           ├── page.tsx          # 결과 (3탭)
│           └── generating/page.tsx
└── app/api/analysis/compatibility/
    ├── route.ts                  # POST: 시작
    ├── check/route.ts            # GET: 기존 확인
    └── [id]/route.ts             # GET: 상태/결과
```

---

## Gemini 스키마 주의사항

> **절대 금지**: response_schema에 default 값 넣지 말 것

```python
# BAD
{"score": {"type": "integer", "default": 50}}

# GOOD
{"score": {"type": "integer", "description": "0-100 범위의 점수"}}
```

---

## 점수 등급

| 점수 범위 | 등급 | 색상 |
|-----------|------|------|
| 85-100 | 천생연분 | #ef4444 (red) |
| 70-84 | 좋은 인연 | #22c55e (green) |
| 55-69 | 보통 | #eab308 (yellow) |
| 40-54 | 노력 필요 | #f97316 (orange) |
| 0-39 | 주의 | #dc2626 (dark red) |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-09 | v2.0.0 | 고전 명리학 고도화 (원진/삼합/방합/도화살/조후/물상론) |
| 2026-01-09 | v1.1.0 | 만세력 예외 처리 추가 (SAJU_REQUIRED), 무료 재시도 로직, 기존 분석 확인 API |
| 2026-01-09 | v1.0.0 | 초기 버전 - 10단계 파이프라인 |

---

## v2.0 고전 명리학 강화

### 조후(調候) 분석 - 궁통보감 기반

월지별 기후 성질로 두 사람의 에너지 조화를 분석:

| 조후 | 월지 | 특성 |
|------|------|------|
| 寒 | 亥, 子, 丑, 寅 | 차분하고 깊음, 내면 지향적 |
| 暖 | 巳, 午 | 따뜻하고 활력있음, 외향적 |
| 燥 | 未, 申, 酉, 戌 | 날카롭고 예민함, 결단력 |
| 濕 | 卯, 辰 | 부드럽고 유연함, 수용적 |

**조후 궁합**:
- 寒-暖: 상호 보완 (+5점)
- 燥-濕: 완벽한 조화 (+8점)
- 같은 조후: 동질 심화 (-2~-5점)

### 물상론 DB

`python/prompts/compatibility_prompts.py`에 구현:
- `MUSANG_DATABASE`: 십신 10개 × 길흉 물상
- `TENSHIN_COMPATIBILITY_MUSANG`: 십신 조합별 관계 역학
- `CHUNG_MUSANG`: 6충별 구체적 갈등 상황
- `DOHWA_MUSANG`: 도화살 유형별 해석

---

**최종 수정**: 2026-01-09 (v2.0.0)
