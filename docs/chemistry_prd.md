# 궁합 분석 기능 PRD (docs/chemistry_prd.md)

> 연인 궁합 분석 시스템 설계서

---

## 주의사항 (구현 전 필독)

### 기존 구현에서 배운 교훈

1. **default 값 절대 금지**
   - Gemini response_schema에 default 값을 넣으면 AI가 그대로 복사
   - 모든 필드는 AI가 직접 생성하도록 빈 상태로 제공
   - 예시 값도 프롬프트에만 포함, 스키마에는 미포함

2. **점수 계산은 Python 엔진으로**
   - Gemini에게 점수 계산 시키면 일관성 없음
   - 모든 점수는 Python에서 규칙 기반 계산 후 Gemini에게 해석만 요청
   - `python/scoring/calculator.py` 패턴 참고

3. **response_schema 제약사항**
   - Gemini는 `minimum`, `maximum`, `minItems`, `enum` 미지원
   - 대신 `description`에 범위/조건 명시
   - 예: `"description": "0-100 범위의 점수"` (X: `"minimum": 0`)

4. **Normalize → Validate 필수**
   - Gemini 응답 후 `normalize_all_keys()` → `validate_step_response()`
   - 한글 키 → camelCase 변환 필수

5. **재시도 + 에러 피드백**
   - 3회 재시도 시 이전 에러를 프롬프트에 포함
   - `previous_error` 파라미터 활용

---

## 1. 기능 개요

### 진입 플로우
```
홈 → 궁합 분석 → 유형 선택 (연인/친구)
├─ 연인 궁합: 기존 프로필 2개 선택 또는 직접 입력
└─ 친구 궁합: (추후 구현)
```

### 크레딧
| 서비스 | 크레딧 |
|--------|--------|
| 연인 궁합 | 70C |
| 섹션 재분석 | 0C (무료) |

---

## 2. 분석 섹션 구성 (창의적 재설계)

### 탭 구조 (3개)
```
[궁합점수] [궁합분석] [사주비교]
```

### 2.1 궁합점수 탭 (Python 엔진 100%)

> 모든 점수는 Python에서 계산, UI에서 시각화만

**섹션 구성:**

```
┌─────────────────────────────────────────────┐
│ 총 궁합 점수: 72점                          │
│ "좋은 인연의 가능성이 높습니다"              │
├─────────────────────────────────────────────┤
│                                             │
│ ◆ 천간 조화 (天干) ──────────── 85점       │
│   甲-己 합토 성립 (갑기합토)                 │
│   합화 성립률: 78%                          │
│                                             │
│ ◆ 지지 조화 (地支) ──────────── 65점       │
│   寅-亥 합목 (인해합목)                      │
│   충/형/파/해: 子-午 충 1개                  │
│                                             │
│ ◆ 오행 균형 (五行) ──────────── 70점       │
│   [레이더 차트: 두 사람 오행 분포]           │
│   보완 오행: 金 (A에게 부족, B가 보충)       │
│                                             │
│ ◆ 십신 호환성 (十神) ─────────── 68점      │
│   A→B: 정재 (사랑하는 대상)                 │
│   B→A: 정관 (존경하는 대상)                 │
│                                             │
│ ◆ 12운성 에너지 ─────────────── 75점       │
│   A: 건록 (활발) / B: 관대 (성숙)           │
│                                             │
└─────────────────────────────────────────────┘
```

**점수 가중치:**
| 항목 | 가중치 | Python 계산 로직 |
|------|--------|-----------------|
| 천간 조화 | 25% | 5합 성립률 (`_calculate_hehua_probability`) |
| 지지 조화 | 25% | 6합 - 충/형/파/해 (`JICHE_CHUNG`, `INTERACTION_WEIGHTS`) |
| 오행 균형 | 20% | 오행 강도 차이 (`calculate_ohang_strength`) |
| 십신 호환성 | 20% | 상호 십신 관계 (`get_ten_god`) |
| 12운성 에너지 | 10% | 두 사람 12운성 조합 (`JIBYEON_12WUNSEONG`) |

---

### 2.2 궁합분석 탭 (Gemini AI 해석)

> Python 점수 + 만세력 데이터를 Gemini에게 전달하여 해석

**섹션 구성 (6개 섹션):**

#### 섹션 1: 인연의 성격 (Gemini)
```
두 사람이 만났을 때 어떤 관계가 형성되는가?
- 관계 유형 키워드 3-4개
- 첫인상 / 끌림의 이유
- 관계 발전 패턴 (200-300자)
```

#### 섹션 2: 연애 스타일 비교 (Python 점수 + Gemini 해석)
```
두 사람의 연애 방식 비교 (각 0-100점, Python 계산)

[표현력]    A: ████████░░ 80%  /  B: ██████░░░░ 60%
[독점욕]    A: ██████░░░░ 60%  /  B: ████████░░ 80%
[헌신도]    A: ███████░░░ 70%  /  B: █████░░░░░ 50%
[모험심]    A: █████░░░░░ 50%  /  B: ███████░░░ 70%
[안정추구]  A: ████░░░░░░ 40%  /  B: ████████░░ 80%

각 항목별 Gemini 해석 (50-100자씩)
```

#### 섹션 3: 갈등 포인트 (Python 충/형 분석 + Gemini 해석)
```
- 발생 가능한 갈등 요소 (충/형/파/해 기반)
- 갈등 해결 조언
- 피해야 할 행동 패턴
```

#### 섹션 4: 결혼 적합도 (Gemini)
```
- 결혼 후 예상 관계 변화
- 가정 내 역할 분담 예측
- 자녀운 / 재물운 시너지
```

#### 섹션 5: 서로에게 주는 영향 (Python 십신 + Gemini 해석)
```
◆ A가 B에게 주는 영향
  십신: 정재 (재물/애정의 대상)
  긍정적 영향: ...
  주의할 점: ...

◆ B가 A에게 주는 영향
  십신: 정관 (권위/존경의 대상)
  긍정적 영향: ...
  주의할 점: ...
```

#### 섹션 6: 관계 발전 조언 (Gemini)
```
- 연애 단계별 조언 (썸 → 연애 → 결혼)
- 위기 극복 팁
- 장기 관계 유지 비결
```

---

### 2.3 사주비교 탭 (Python 만세력)

> 두 사람의 사주 명식 비교 (기존 SajuTable 재사용)

```
┌─ A님의 사주 ──────────────────────┐
│ 시   일   월   년                 │
│ 丙   甲   庚   辛                 │
│ 寅   午   申   丑                 │
│                                  │
│ [대운 스크롤]                     │
└──────────────────────────────────┘

┌─ B님의 사주 ──────────────────────┐
│ 시   일   월   년                 │
│ 丁   己   乙   癸                 │
│ 卯   亥   卯   未                 │
│                                  │
│ [대운 스크롤]                     │
└──────────────────────────────────┘

┌─ 간지 상호작용 ──────────────────┐
│ 천간: 甲-己 합토 ✓               │
│ 지지: 午-亥 (특이 관계 없음)      │
│       寅-亥 합목 ✓               │
│       申-寅 충 ⚠                │
└──────────────────────────────────┘
```

---

## 3. 분석 파이프라인 (10단계)

| 단계 | 이름 | 엔진 | 설명 | 진행률 |
|-----|------|------|------|--------|
| 1 | `manseryeok_a` | Python | A 만세력 계산 | 5% |
| 2 | `manseryeok_b` | Python | B 만세력 계산 | 10% |
| 3 | `compatibility_score` | Python | 5개 항목 점수 계산 | 25% |
| 4 | `trait_scores` | Python | 연애 스타일 5항목 점수 | 35% |
| 5 | `relationship_type` | Gemini | 인연의 성격 분석 | 50% |
| 6 | `trait_interpretation` | Gemini | 연애 스타일 해석 | 60% |
| 7 | `conflict_analysis` | Gemini | 갈등 포인트 분석 | 70% |
| 8 | `marriage_fit` | Gemini | 결혼 적합도 분석 | 80% |
| 9 | `mutual_influence` | Gemini | 상호 영향 분석 | 90% |
| 10 | `saving` | - | DB 저장 | 100% |

**핵심 원칙:**
- 1-4단계: Python 엔진으로 모든 점수 계산
- 5-9단계: Gemini에게 점수 데이터 전달 → 해석만 요청
- Gemini 단계 실패 시 `failed_steps`에 기록, 나머지 진행

---

## 4. Python 점수 엔진 상세

### 4.1 천간 조화 점수 (0-100)

```python
# python/manseryeok/compatibility_engine.py

STEM_COMBINATIONS = {
    ('甲', '己'): ('土', '갑기합토'),
    ('乙', '庚'): ('金', '을경합금'),
    ('丙', '辛'): ('水', '병신합수'),
    ('丁', '壬'): ('木', '정임합목'),
    ('戊', '癸'): ('火', '무계합화'),
}

def calculate_stem_harmony(pillars_a: dict, pillars_b: dict) -> dict:
    """
    두 사람의 천간 합 분석

    Returns:
        {
            "score": 85,
            "combinations": [{"stems": ["甲", "己"], "result": "土", "name": "갑기합토", "probability": 0.78}],
            "clashes": []
        }
    """
    # 사주분석마스터.txt의 _calculate_hehua_probability 로직 적용
    # 1. 월령 지지 조건
    # 2. 통근 조건
    # 3. 오행 강도 조건
```

### 4.2 지지 조화 점수 (0-100)

```python
def calculate_branch_harmony(pillars_a: dict, pillars_b: dict) -> dict:
    """
    두 사람의 지지 합/충/형/파/해 분석

    가중치 (사주분석마스터.txt 기반):
    - 6합: +20점
    - 삼합 완성: +30점
    - 충: -25점 * 1.4
    - 형: -20점 * 1.5
    - 파/해: -10점

    Returns:
        {
            "score": 65,
            "combinations": [{"branches": ["寅", "亥"], "result": "木", "name": "인해합목"}],
            "clashes": [{"branches": ["子", "午"], "type": "충", "severity": "high"}],
            "punishments": [],
            "harms": []
        }
    """
```

### 4.3 오행 균형 점수 (0-100)

```python
def calculate_element_balance(pillars_a: dict, pillars_b: dict) -> dict:
    """
    두 사람의 오행 분포 비교

    - 서로 부족한 오행을 보완하면 높은 점수
    - 같은 오행이 과다하면 낮은 점수

    Returns:
        {
            "score": 70,
            "a_elements": {"木": 3.5, "火": 2.0, "土": 1.5, "金": 0.5, "水": 2.5},
            "b_elements": {"木": 1.0, "火": 1.5, "土": 3.0, "金": 2.5, "水": 2.0},
            "complementary": ["金"],  # A에게 부족, B가 보충
            "excessive": ["土"]       # 둘 다 과다
        }
    """
```

### 4.4 십신 호환성 점수 (0-100)

```python
TEN_GOD_COMPATIBILITY = {
    # A→B 십신 기준, 점수 (연인 관계)
    ('정재', '정관'): 90,   # 이상적 배우자 관계
    ('정재', '정인'): 75,   # 보호-피보호 관계
    ('편재', '편관'): 70,   # 열정적 관계
    ('비견', '비견'): 50,   # 친구 같은 관계
    ('상관', '편관'): 40,   # 갈등 가능성
    # ... 100가지 조합
}

def calculate_ten_god_compatibility(pillars_a: dict, pillars_b: dict) -> dict:
    """
    A의 일간이 B에게 어떤 십신인지, B의 일간이 A에게 어떤 십신인지 분석

    Returns:
        {
            "score": 68,
            "a_to_b": {"tenGod": "정재", "meaning": "사랑하는 대상"},
            "b_to_a": {"tenGod": "정관", "meaning": "존경하는 대상"},
            "relationship_type": "이상적 배우자 관계"
        }
    """
```

### 4.5 12운성 에너지 점수 (0-100)

```python
WUNSEONG_COMBINATIONS = {
    # (A의 12운성, B의 12운성): 점수
    ('건록', '건록'): 85,   # 둘 다 활발 → 시너지
    ('건록', '제왕'): 90,   # 활발 + 최고 → 최상
    ('제왕', '제왕'): 75,   # 둘 다 최고 → 경쟁 가능
    ('묘', '장생'): 60,     # 침체 + 시작 → 재생 가능
    ('절', '절'): 30,       # 둘 다 침체 → 어려움
    # ... 144가지 조합
}

def calculate_wunseong_synergy(pillars_a: dict, pillars_b: dict) -> dict:
    """
    두 사람의 12운성 조합 분석

    Returns:
        {
            "score": 75,
            "a_wunseong": "건록",
            "b_wunseong": "관대",
            "synergy_type": "활발-성숙 조합"
        }
    """
```

### 4.6 연애 스타일 점수 (각 0-100)

```python
def calculate_romance_traits(pillars: dict, gender: str) -> dict:
    """
    개인의 연애 스타일 점수 계산 (십신 기반)

    - 표현력: 식신/상관 강도
    - 독점욕: 편관/겁재 강도
    - 헌신도: 정인/정재 강도
    - 모험심: 편재/상관 강도
    - 안정추구: 정관/정인 강도

    Returns:
        {
            "expression": 80,
            "possessiveness": 60,
            "devotion": 70,
            "adventure": 50,
            "stability": 40
        }
    """
```

---

## 5. DB 스키마

```sql
CREATE TABLE compatibility_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- 참여자
  profile_id_a UUID REFERENCES profiles(id),
  profile_id_b UUID REFERENCES profiles(id),
  analysis_type VARCHAR DEFAULT 'romance',

  -- Job 패턴
  status VARCHAR DEFAULT 'pending',
  job_id TEXT,
  progress_percent INTEGER DEFAULT 0,
  current_step TEXT,
  step_statuses JSONB DEFAULT '{}',
  failed_steps TEXT[] DEFAULT '{}',
  error TEXT,

  -- 만세력 (Python)
  pillars_a JSONB,
  pillars_b JSONB,
  daewun_a JSONB,
  daewun_b JSONB,

  -- 점수 (Python 엔진)
  total_score INTEGER,
  scores JSONB,  -- 5개 항목 점수
  trait_scores_a JSONB,  -- A 연애 스타일
  trait_scores_b JSONB,  -- B 연애 스타일
  interactions JSONB,  -- 천간합/지지충 상세

  -- Gemini 분석 (섹션별)
  relationship_type JSONB,
  trait_interpretation JSONB,
  conflict_analysis JSONB,
  marriage_fit JSONB,
  mutual_influence JSONB,

  -- 메타
  language TEXT DEFAULT 'ko',
  credits_used INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Task 세분화

### Task 1: 인프라 설정

#### Task 1.1: DB 마이그레이션
- [ ] `supabase/migrations/20260109_compatibility.sql` 생성
- [ ] `compatibility_analyses` 테이블 생성
- [ ] RLS 정책 설정
- [ ] 인덱스 생성

#### Task 1.2: Pydantic 스키마 정의
- [ ] `python/schemas/compatibility.py` 생성
- [ ] `CompatibilityScores` 스키마 (5개 점수)
- [ ] `TraitScores` 스키마 (5개 연애 스타일)
- [ ] `InteractionData` 스키마 (천간합/지지충)
- [ ] 각 Gemini 단계별 응답 스키마

#### Task 1.3: API 엔드포인트 스켈레톤
- [ ] `src/app/api/analysis/compatibility/route.ts` (POST: 분석 시작)
- [ ] `src/app/api/analysis/compatibility/[id]/route.ts` (GET: 결과 조회)
- [ ] `src/app/api/analysis/compatibility/[id]/status/route.ts` (GET: 폴링)

---

### Task 2: Python 점수 엔진

#### Task 2.1: 기본 구조 설정
- [ ] `python/manseryeok/compatibility_engine.py` 생성
- [ ] `CompatibilityEngine` 클래스 스켈레톤
- [ ] 상수 정의 (STEM_COMBINATIONS, BRANCH_INTERACTIONS 등)

#### Task 2.2: 천간 조화 점수 구현
- [ ] `calculate_stem_harmony()` 함수
- [ ] 5합 성립률 계산 로직 (`_calculate_hehua_probability` 참고)
- [ ] 월령 지지 조건 체크
- [ ] 통근 조건 체크

#### Task 2.3: 지지 조화 점수 구현
- [ ] `calculate_branch_harmony()` 함수
- [ ] 6합 계산 로직
- [ ] 충/형/파/해 계산 로직
- [ ] 삼합/방합 국 형성 체크

#### Task 2.4: 오행 균형 점수 구현
- [ ] `calculate_element_balance()` 함수
- [ ] `calculate_ohang_strength()` 재사용
- [ ] 보완/과다 오행 판정 로직

#### Task 2.5: 십신 호환성 점수 구현
- [ ] `calculate_ten_god_compatibility()` 함수
- [ ] `TEN_GOD_COMPATIBILITY` 매트릭스 정의 (100가지 조합)
- [ ] A→B, B→A 양방향 분석

#### Task 2.6: 12운성 에너지 점수 구현
- [ ] `calculate_wunseong_synergy()` 함수
- [ ] `WUNSEONG_COMBINATIONS` 매트릭스 정의 (144가지 조합)

#### Task 2.7: 연애 스타일 점수 구현
- [ ] `calculate_romance_traits()` 함수
- [ ] 십신 강도 기반 5항목 점수 계산

#### Task 2.8: 통합 점수 계산
- [ ] `calculate_total_score()` 함수
- [ ] 가중치 적용 (25/25/20/20/10)
- [ ] 최종 점수 클램핑 (0-100)

---

### Task 3: 파이프라인 서비스

#### Task 3.1: 서비스 클래스 구조
- [ ] `python/services/compatibility_service.py` 생성
- [ ] `CompatibilityService` 클래스
- [ ] `JobStore` 연동 (기존 패턴)

#### Task 3.2: 만세력 단계 구현
- [ ] `_step_manseryeok_a()` - A 만세력 계산
- [ ] `_step_manseryeok_b()` - B 만세력 계산
- [ ] 기존 `/calculate` API 재사용

#### Task 3.3: Python 점수 단계 구현
- [ ] `_step_compatibility_score()` - 5개 항목 점수
- [ ] `_step_trait_scores()` - 연애 스타일 점수
- [ ] DB 중간 저장 로직

#### Task 3.4: Gemini 분석 단계 구현
- [ ] `_step_relationship_type()` - 인연의 성격
- [ ] `_step_trait_interpretation()` - 연애 스타일 해석
- [ ] `_step_conflict_analysis()` - 갈등 포인트
- [ ] `_step_marriage_fit()` - 결혼 적합도
- [ ] `_step_mutual_influence()` - 상호 영향

#### Task 3.5: 재시도 + 에러 피드백
- [ ] 3회 재시도 로직
- [ ] `previous_error` 프롬프트 포함
- [ ] `failed_steps` 배열 관리

#### Task 3.6: FastAPI 라우터
- [ ] `python/main.py`에 라우터 추가
- [ ] `POST /compatibility/analyze`
- [ ] `GET /compatibility/{job_id}/status`

---

### Task 4: Gemini 프롬프트

#### Task 4.1: 프롬프트 구조 설계
- [ ] `python/prompts/compatibility/` 폴더 생성
- [ ] 공통 컨텍스트 템플릿 (만세력 + 점수 데이터)

#### Task 4.2: 인연의 성격 프롬프트
- [ ] `relationship_type.py`
- [ ] 입력: 두 사람 만세력, 십신 관계
- [ ] 출력: 관계 유형, 끌림 이유, 발전 패턴

#### Task 4.3: 연애 스타일 해석 프롬프트
- [ ] `trait_interpretation.py`
- [ ] 입력: Python 계산 5항목 점수
- [ ] 출력: 각 항목별 해석 (50-100자)

#### Task 4.4: 갈등 포인트 프롬프트
- [ ] `conflict_analysis.py`
- [ ] 입력: 충/형/파/해 데이터
- [ ] 출력: 갈등 요소, 해결 조언, 피해야 할 행동

#### Task 4.5: 결혼 적합도 프롬프트
- [ ] `marriage_fit.py`
- [ ] 입력: 종합 점수, 십신 관계
- [ ] 출력: 결혼 후 변화, 역할 분담, 자녀운

#### Task 4.6: 상호 영향 프롬프트
- [ ] `mutual_influence.py`
- [ ] 입력: A→B, B→A 십신
- [ ] 출력: 각 방향별 긍정/주의점

#### Task 4.7: Gemini 스키마 정의
- [ ] `python/schemas/gemini_schemas.py`에 추가
- [ ] 각 단계별 `response_schema` (default 값 없이!)

---

### Task 5: 프론트엔드 페이지

#### Task 5.1: 라우팅 구조
- [ ] `src/app/[locale]/compatibility/page.tsx` - 유형 선택
- [ ] `src/app/[locale]/compatibility/romance/new/page.tsx` - 프로필 선택
- [ ] `src/app/[locale]/compatibility/romance/[id]/page.tsx` - 결과
- [ ] `src/app/[locale]/compatibility/romance/[id]/generating/page.tsx` - 생성 중

#### Task 5.2: 프로필 선택 컴포넌트
- [ ] `src/components/compatibility/ProfileSelector.tsx`
- [ ] 기존 프로필 목록에서 선택
- [ ] 직접 입력 폼 (이름, 생년월일, 성별)
- [ ] 두 사람 선택 완료 후 분석 시작 버튼

#### Task 5.3: 생성 중 화면
- [ ] 기존 `PipelineProcessingScreen` 재사용
- [ ] 10단계 진행률 표시
- [ ] 폴링 로직 (`use-compatibility.ts`)

---

### Task 6: 궁합점수 탭 UI

#### Task 6.1: 탭 컨테이너
- [ ] `src/components/compatibility/CompatibilityTabs.tsx`
- [ ] 3개 탭 전환 UI

#### Task 6.2: 총점 섹션
- [ ] `src/components/compatibility/ScoreTab/TotalScore.tsx`
- [ ] 큰 숫자 + 한줄 평가
- [ ] 애니메이션 효과

#### Task 6.3: 5개 항목 점수 카드
- [ ] `src/components/compatibility/ScoreTab/HarmonyScores.tsx`
- [ ] 천간/지지/오행/십신/12운성 점수
- [ ] 각 항목별 상세 정보 토글

#### Task 6.4: 오행 레이더 차트
- [ ] `src/components/compatibility/ScoreTab/ElementChart.tsx`
- [ ] Recharts 레이더 차트 (두 사람 중첩)
- [ ] 보완/과다 오행 표시

---

### Task 7: 궁합분석 탭 UI

#### Task 7.1: 인연의 성격 섹션
- [ ] `src/components/compatibility/AnalysisTab/RelationshipType.tsx`
- [ ] 키워드 뱃지 + 설명 카드

#### Task 7.2: 연애 스타일 비교 섹션
- [ ] `src/components/compatibility/AnalysisTab/TraitComparison.tsx`
- [ ] 두 사람 비교 바 차트 (5항목)
- [ ] 각 항목별 해석 텍스트

#### Task 7.3: 갈등 포인트 섹션
- [ ] `src/components/compatibility/AnalysisTab/ConflictPoints.tsx`
- [ ] 경고 아이콘 + 갈등 요소 리스트
- [ ] 해결 조언 카드

#### Task 7.4: 결혼 적합도 섹션
- [ ] `src/components/compatibility/AnalysisTab/MarriageFit.tsx`
- [ ] 점수 + 상세 분석

#### Task 7.5: 상호 영향 섹션
- [ ] `src/components/compatibility/AnalysisTab/MutualInfluence.tsx`
- [ ] A→B, B→A 양방향 카드

---

### Task 8: 사주비교 탭 UI

#### Task 8.1: 사주표 컴포넌트
- [ ] `src/components/compatibility/ChartTab/SajuComparison.tsx`
- [ ] 기존 `SajuTable` 재사용 (2개)
- [ ] 대운 스크롤 (기존 `DaewunHorizontalScroll` 재사용)

#### Task 8.2: 간지 상호작용 표시
- [ ] `src/components/compatibility/ChartTab/InteractionDisplay.tsx`
- [ ] 천간합/지지충 시각적 표시
- [ ] 연결선 또는 하이라이트

---

### Task 9: API 연동

#### Task 9.1: TanStack Query 훅
- [ ] `src/hooks/use-compatibility.ts`
- [ ] `useCreateCompatibility()` - 분석 시작
- [ ] `useCompatibilityStatus()` - 폴링
- [ ] `useCompatibilityResult()` - 결과 조회

#### Task 9.2: Next.js API 라우트 구현
- [ ] POST `/api/analysis/compatibility` - Python API 프록시
- [ ] GET `/api/analysis/compatibility/[id]` - 결과 조회
- [ ] GET `/api/analysis/compatibility/[id]/status` - 폴링

#### Task 9.3: 크레딧 차감 로직
- [ ] 분석 시작 전 크레딧 확인
- [ ] 70C 차감 (기존 패턴 따름)

---

### Task 10: 테스트 및 검증

#### Task 10.1: Python 단위 테스트
- [ ] `python/tests/test_compatibility_engine.py`
- [ ] 천간합 점수 계산 테스트
- [ ] 지지충 점수 계산 테스트
- [ ] 전체 점수 계산 테스트

#### Task 10.2: API 통합 테스트
- [ ] 파이프라인 전체 플로우 테스트
- [ ] 재시도 시나리오 테스트
- [ ] 실패 복구 테스트

#### Task 10.3: E2E 테스트
- [ ] Playwright: 프로필 선택 → 분석 완료
- [ ] 3탭 전환 테스트
- [ ] 모바일 반응형 테스트

---

## 7. 파일 구조 최종

```
python/
├── manseryeok/
│   └── compatibility_engine.py    # Task 2
├── services/
│   └── compatibility_service.py   # Task 3
├── prompts/
│   └── compatibility/
│       ├── relationship_type.py   # Task 4.2
│       ├── trait_interpretation.py # Task 4.3
│       ├── conflict_analysis.py   # Task 4.4
│       ├── marriage_fit.py        # Task 4.5
│       └── mutual_influence.py    # Task 4.6
├── schemas/
│   └── compatibility.py           # Task 1.2
└── tests/
    └── test_compatibility_engine.py # Task 10.1

src/
├── app/[locale]/compatibility/
│   ├── page.tsx                   # Task 5.1
│   └── romance/
│       ├── new/page.tsx           # Task 5.1
│       └── [id]/
│           ├── page.tsx           # Task 5.1
│           └── generating/page.tsx # Task 5.1
├── components/compatibility/
│   ├── ProfileSelector.tsx        # Task 5.2
│   ├── CompatibilityTabs.tsx      # Task 6.1
│   ├── ScoreTab/
│   │   ├── TotalScore.tsx         # Task 6.2
│   │   ├── HarmonyScores.tsx      # Task 6.3
│   │   └── ElementChart.tsx       # Task 6.4
│   ├── AnalysisTab/
│   │   ├── RelationshipType.tsx   # Task 7.1
│   │   ├── TraitComparison.tsx    # Task 7.2
│   │   ├── ConflictPoints.tsx     # Task 7.3
│   │   ├── MarriageFit.tsx        # Task 7.4
│   │   └── MutualInfluence.tsx    # Task 7.5
│   └── ChartTab/
│       ├── SajuComparison.tsx     # Task 8.1
│       └── InteractionDisplay.tsx # Task 8.2
├── hooks/
│   └── use-compatibility.ts       # Task 9.1
└── app/api/analysis/compatibility/
    ├── route.ts                   # Task 1.3, 9.2
    └── [id]/
        ├── route.ts               # Task 9.2
        └── status/route.ts        # Task 9.2

supabase/migrations/
└── 20260109_compatibility.sql     # Task 1.1
```

---

## 8. 검증 방법

1. **Python 엔진 검증**
   - 알려진 사주 조합으로 점수 계산 확인
   - 사주분석마스터.txt 예시와 비교

2. **Gemini 응답 품질**
   - default 값 복사 여부 확인
   - 해석 내용의 일관성 검토

3. **E2E 플로우**
   - 프로필 선택 → 분석 완료 → 3탭 확인
   - 크레딧 차감 확인
   - 재분석 기능 테스트

---

**Version**: 2.0.0
**Last Updated**: 2026-01-09
