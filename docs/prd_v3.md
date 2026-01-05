# Fortune Engine v3.0 - 분석 정확도 향상 PRD

> Gemini 사주 분석 정확도 향상을 위한 엔진 + 프롬프트 개선 계획

**Version**: 3.0
**Last Updated**: 2026-01-05
**Status**: Completed

---

## 1. 개요

### 1.1 목표
- **분석 정확도**: +25-30% 향상
- **토큰 효율**: 120KB → 40-60KB (-50%)
- **분석 일관성**: LLM 자유 해석 → 규칙 기반 하이브리드

### 1.2 범위
- Python 만세력 엔진 고도화
- 프롬프트 시스템 최적화
- TypeScript 파이프라인 개선

### 1.3 참조 원문

| 문서 | 핵심 내용 | 활용도 |
|------|----------|--------|
| `窮通寶鑑.txt` (97KB) | 조후론, 계절별 오행, 월별 용신 | 핵심 |
| `子平真诠评.txt` (86KB) | 용신 5원칙, 격국론, 합충형파해 | 핵심 |
| `Bazi-The-Destiny-Code.txt` (90KB) | 현대적 BaZi 프레임워크, Luck Cycles | 보조 |
| `사주분석마스터.txt` (36KB) | 규칙 기반 엔진 V7.0, 가중치 공식 | 핵심 |
| `쳇gpt-코드.txt` (25KB) | 물상론, 12신살, 사건 강도 공식 V8.0 | 보조 |

---

## 2. 현재 시스템 분석

### 2.1 파이프라인 구조 (v2.0)

```
[만세력] → [지장간] → [기본분석] → [성격/적성/재물] → [점수] → [시각화]
  Python    Python     Gemini        Gemini (병렬)     TypeScript   Python
```

### 2.2 주요 한계점

| 영역 | 문제점 | 영향도 |
|------|--------|--------|
| 대운 데이터 | 계산되지만 Gemini에 전달 안됨 | 높음 |
| 고전 프롬프트 | 120KB 전체 포함 (토큰 낭비) | 높음 |
| 지지 상호작용 | 형/원진/파해 가중치 미구현 | 중간 |
| 십신 분포 | 점수 계산에만 사용, Gemini 미공유 | 중간 |
| 조후 색채 | 寒暖燥濕 튜닝 로직 없음 | 중간 |
| 12신살 | 역마/장성 등 미구현 | 낮음 |

### 2.3 개선 방향

```
v2.0: [입력] → [Gemini 자유 해석] → [결과]

v3.0: [입력] → [규칙 기반 사전 분석] → [Gemini 서술] → [검증] → [결과]
                    ↓
              (격국/용신/조후/십신)
```

---

## 3. 개선 Task 체크리스트

### 병렬 작업 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    만세력 분석 데이터 흐름                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [만세력 엔진 (기존)]                                             │
│         │                                                       │
│         ▼                                                       │
│  pillars, jijanggan, daewun (공통 입력)                          │
│         │                                                       │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│  Group 1   Group 2                                              │
│  (병렬)     (병렬)                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**중요**: 만세력 분석 결과(pillars, jijanggan, daewun)는 **모든 Task의 공통 입력**입니다.
- 기존 만세력 엔진은 이미 구현되어 있음 (`python/manseryeok/`)
- Group 1, 2는 이 공통 데이터를 **활용**하는 개선 작업
- 개발 단계에서는 서로 의존성 없이 **병렬 진행 가능**

---

### Task 1: 데이터 완성도 개선

> **Group 1** | Python 엔진 + TypeScript 파이프라인

- [x] **Task 1: 데이터 완성도 개선** ✅ (2026-01-04)
  - [x] Task 1.1: 대운 정보 Gemini 전달 ✅
    - [x] 1.1.1: `fetchStepPrompt`에 daewun 파라미터 추가
    - [x] 1.1.2: Python `builder.py`의 `format_daewun_list` 활용
    - [x] 1.1.3: 단계 4-6 프롬프트에 대운 컨텍스트 삽입
    - **파일**: `src/lib/ai/pipeline/index.ts`
  - [x] Task 1.2: 대운 시작 나이 정밀 계산 ✅
    - [x] 1.2.1: `daewun.py`의 `_calculate_start_age` 함수 개선
    - [x] 1.2.2: 절입 시각 기반 계산 로직 구현 (Julian Day 사용)
    - [x] 1.2.3: `lunar_python`의 `getNextJie`/`getPrevJie` 활용
    - **파일**: `python/manseryeok/daewun.py`
  - [x] Task 1.3: 십신 분포 사전 계산 ✅ (2026-01-05)
    - [x] 1.3.1: `extractTenGods` 결과를 `PipelineContext`에 저장 → `ten-gods.ts` 구현됨
    - [x] 1.3.2: 십신 분포 요약 텍스트 생성 함수 → `format_ten_gods_context()` (locale_strings.py)
    - [x] 1.3.3: Gemini 프롬프트에 십신 분포 섹션 추가 → `fetchStepPrompt`에서 `tenGodCounts` 전달
    - **파일**: `src/lib/ai/pipeline/index.ts`, `python/schemas/prompt.py`, `python/main.py`

---

### Task 2: 프롬프트 최적화

> **Group 2** | 프롬프트 시스템

- [x] **Task 2: 프롬프트 최적화** ✅ 2026-01-05
  - [x] Task 2.1: 동적 고전 선택 시스템
    - [x] 2.1.1: 분석 유형별 필요 고전 매핑 테이블
      ```python
      STEP_CLASSIC_MAP = {
        'basic': ['ziping_core', 'qiongtong_johu'],
        'personality': ['ten_gods_guide'],
        'aptitude': ['ziping_core'],
        'fortune': ['ziping_core', 'qiongtong_johu']
      }
      ```
    - [x] 2.1.2: `build_system_prompt_v3` 함수 구현
    - [x] 2.1.3: 일간별 조후 필터링 로직
    - **파일**: `python/prompts/builder.py`
  - [x] Task 2.2: 사주 정보 구조화
    - [x] 2.2.1: JSON 기반 사주 데이터 포맷 정의
      ```json
      {
        "day_master": {
          "stem": "甲", "element": "木", "strength": "weak",
          "symbol": "큰 나무"
        },
        "ten_gods": {
          "month": {"god": "偏印", "meaning": "특수재능"},
          "hour": {"god": "正官", "meaning": "책임감"}
        }
      }
      ```
    - [x] 2.2.2: 십신 사전 매핑 (월간/시간 기준)
    - [x] 2.2.3: 격국 후보 자동 추출 로직
    - **파일**: `python/prompts/builder.py`, `python/prompts/locale_strings.py`
  - [x] Task 2.3: 조후 가능성 분석
    - [x] 2.3.1: `analyze_johu_feasibility` 함수 구현
      ```python
      def analyze_johu_feasibility(pillars, daewun) -> dict:
        return {
          "required_element": "癸水",
          "available": True,
          "strength_level": 7,
          "position": ["月", "寅宮"],
          "urgency": "high"
        }
      ```
    - [x] 2.3.2: 필요 오행의 유무/강도/위치 계산
    - [x] 2.3.3: 대운에서 조후 보충 가능성 분석
    - **파일**: `python/prompts/builder.py` (신규 함수)

---

### Task 3: 엔진 고도화

> **Group 1** | Python 엔진 (Task 1과 병렬 진행 가능)

- [x] **Task 3: 엔진 고도화** ✅ (2026-01-04)
  - [x] Task 3.1: 지지 상호작용 확장 ✅
    - [x] 3.1.1: 지지 형(刑) 가중치 구현
    - [x] 3.1.2: 지지 원진(元辰/害) 가중치 구현
    - [x] 3.1.3: 지지 파/해(破/害) 가중치 구현
    - [x] 3.1.4: 합충형파해 종합 분석 (`analyze_all_interactions`)
    - **파일**: `python/manseryeok/interactions.py` (12KB)
  - [x] Task 3.2: 격국 자동 분류 ✅
    - [x] 3.2.1: `classify_formation` 함수 구현
    - [x] 3.2.2: 일간 강약 판단 로직 (`FormationResult.day_strength`)
    - [x] 3.2.3: 격국 후보 및 품질 반환 (`quality: 상/중/하`)
    - **파일**: `python/manseryeok/formation.py` (10KB)
  - [x] Task 3.3: 12신살 분석 모듈 ✅
    - [x] 3.3.1: 12신살 테이블 정의 (천을귀인, 문창성, 역마, 도화 등)
    - [x] 3.3.2: 신살 추출 함수 구현 (`Sinsal` dataclass)
    - [x] 3.3.3: 길신/흉신 분류 (`is_lucky` 필드)
    - **파일**: `python/manseryeok/sinsal.py` (14KB)

---

### Task 4: 원문 기반 고전 프롬프트 보강

> **Group 2** | 프롬프트 시스템 (Task 2와 병렬 진행 가능)

- [x] **Task 4: 고전 프롬프트 보강** ✅ (2026-01-05)
  - [x] Task 4.1: 궁통보감 조후론 상세화 ✅ (2026-01-05)
    - [x] 4.1.1: 10일간 × 12월 조후 매트릭스 구축 → `python/prompts/classics/qiongtong_matrix.py` (120개 조합)
      ```python
      # 窮通寶鑑 기반
      JOHU_MATRIX = {
        '甲': {
          '寅月': {'primary': '丙', 'secondary': '癸', 'note': '寒木向陽'},
          '卯月': {'primary': '庚', 'secondary': '丁', 'note': '羊刃架殺'},
          ...
        },
        '乙': {...},
        ...
      }
      ```
    - [x] 4.1.2: 계절별 한난조습 판단 로직 (JohuEntry에 통합)
    - [x] 4.1.3: `get_johu_entry(day_master, month)` + `build_johu_prompt()` 함수
    - **파일**: `python/prompts/classics/qiongtong_matrix.py` ✅
    - **다국어**: ko, en, ja, zh-CN, zh-TW 지원
  - [x] Task 4.2: 자평진전 용신 5원칙 체계화 ✅ (2026-01-05)
    - [x] 4.2.1: 억부/조후/통관/병약/전왕 분류 로직 → `YONGSIN_PRINCIPLES` dict
      ```python
      YONGSIN_PRINCIPLES = {
        '억부': '일간 강약에 따른 설기/생조',
        '조후': '한난조습 조절 (궁통보감)',
        '통관': '오행 대치 시 중재',
        '병약': '격국 파괴자/치료자',
        '전왕': '극강 오행 순응'
      }
      ```
    - [x] 4.2.2: 용신 결정 우선순위 알고리즘 → 10격국 × 3강약 = 30개 `YongsinEntry`
    - [x] 4.2.3: 격국별 용신 추천 테이블 → `YONGSIN_MATRIX` (희신/기신 매핑)
    - **파일**: `python/prompts/classics/ziping_yongsin.py` ✅
    - **다국어**: ko, en, ja, zh-CN, zh-TW 지원
  - [x] Task 4.3: The Destiny Code 현대화 표현 ✅
    - [x] 4.3.1: 영어 십신 용어 매핑 → `TEN_GODS_MAPPING` (10개 십신 × 5개 언어)
      ```python
      TEN_GODS_MAPPING = {
        '비견': {'ko': '비견(比肩)', 'en': 'Friend', 'ja': '比肩（ひけん）', ...},
        '겁재': {'ko': '겁재(劫財)', 'en': 'Rob Wealth', ...},
        '식신': {'ko': '식신(食神)', 'en': 'Eating God', ...},
        '상관': {'ko': '상관(傷官)', 'en': 'Hurting Officer', ...},
        '정재': {'ko': '정재(正財)', 'en': 'Direct Wealth', ...},
        '편재': {'ko': '편재(偏財)', 'en': 'Indirect Wealth', ...},
        '정관': {'ko': '정관(正官)', 'en': 'Direct Officer', ...},
        '편관': {'ko': '편관(偏官)', 'en': 'Seven Killings', ...},
        '정인': {'ko': '정인(正印)', 'en': 'Direct Resource', ...},
        '편인': {'ko': '편인(偏印)', 'en': 'Indirect Resource', ...}
      }
      ```
    - [x] 4.3.2: Action-oriented 조언 템플릿 → `DestinyAdvice` 데이터클래스, `DESTINY_ADVICE_DB`
    - [x] 4.3.3: Luck Cycles 분석 프레임워크 → `LuckCycleEntry`, `LUCK_INTERACTIONS`, `LUCK_CYCLE_THEMES`
    - **파일**: `python/prompts/western/destiny_code.py` ✅
    - **다국어**: ko, en, ja, zh-CN, zh-TW 지원
    - **헬퍼 함수**: `get_destiny_advice()`, `build_luck_cycle_prompt()`, `build_destiny_code_analysis_prompt()`

---

### Task 5: 점수 계산 고도화

> **Group 3** | 통합 (Group 1, 2 완료 후 순차 진행)

- [x] **Task 5: 점수 계산 고도화** ✅ (2026-01-05)
  - [x] Task 5.1: 사건 강도 공식 구현 ✅
    - [x] 5.1.1: 원문 V8.0 기반 점수 공식 이식 (가산 방식으로 개선)
      ```python
      # 최종 점수 = clamp(기본점수 + 세운조정값, -100, +100)
      # 기본점수 = 격국품질(-20~+30) + 신살(-20~+20) + 원국상호작용(-20~+20)
      # 세운조정값 = 세운십신(-30~+30) + 세운지지상호작용(-20~+20)
      def calculate_event_score(formation, sinsals, natal_interactions,
                                pillars, current_year, language) -> EventScore:
        natal_score = formation_score + sinsal_score + interaction_score
        dynamic_modifier = year_stem_score + year_branch_score
        return clamp(natal_score + dynamic_modifier, -100, +100)
      ```
    - [x] 5.1.2: 용신/기신 오행 판단 로직 (`determine_yongshin_elements`)
    - [x] 5.1.3: 점수 → 사건 강도 변환 테이블 (5단계, 5개 언어)
      ```python
      EVENT_INTENSITY_TABLE = {
        (60, 100): {'level': 'HIGH', 'label': '대길/Highly Favorable/大吉'},
        (20, 60): {'level': 'MID', 'label': '길/Favorable/吉'},
        (-20, 20): {'level': 'LOW', 'label': '평/Neutral/平'},
        (-60, -20): {'level': 'WARNING', 'label': '주의/Caution/注意'},
        (-100, -60): {'level': 'CRITICAL', 'label': '흉/Challenging/凶'}
      }
      ```
    - **파일**: `python/scoring/event_score.py` ✅ (702줄)
  - [x] Task 5.2: 물상론 DB 구축 ✅
    - [x] 5.2.1: 십성별 길흉 사건 매핑 테이블 (10개 십신 × 5개 언어)
      ```python
      MULSANGRON = {
        '비견': {'인물': [...], '길': [...], '흉': [...]},
        '겁재': {...}, '식신': {...}, '상관': {...},
        '정재': {...}, '편재': {...}, '정관': {...},
        '편관': {...}, '정인': {...}, '편인': {...}
      }
      ```
    - [x] 5.2.2: 충/형/합별 물상 정의 (5개 상호작용 × 5개 언어)
      ```python
      INTERACTION_MULSANG = {
        '합': {'description': ..., 'events': [...], 'caution': [...]},
        '충': {...}, '형': {...}, '해': {...}, '파': {...}
      }
      ```
    - [x] 5.2.3: 사건 예측 템플릿 생성 (`generate_event_prediction_template`)
    - **파일**: `python/prompts/mulsangron.py` ✅ (450줄)
  - [x] Task 5.3: Hybrid 모델 통합 ✅
    - [x] 5.3.1: Python 규칙 기반 점수 → Gemini 서술
      - `YearlyPromptBuildRequest.score_context` 추가
      - `YearlyPromptBuildRequest.event_prediction_context` 추가
      - `_build_yearly_user_prompt`에서 컨텍스트 삽입
    - [x] 5.3.2: 점수 근거 투명성 개선 (`format_score_context`, 5개 언어 지원)
    - [x] 5.3.3: 일관성 검증 로직
      - `validate_score_narrative_consistency`: 점수-서술 감정 일치도
      - `validate_event_prediction_consistency`: 예측 사건 언급 비율
      - 도메인 특화 감정 키워드 (50+ 키워드 × 5개 언어)
    - **파일**: `python/prompts/builder.py`, `python/scoring/validation.py` ✅ (240줄)
  - [x] Task 5.4: 점수 정규분포 개선 ✅
    - [x] 5.4.1: modifier 스케일 축소 (×0.75)
      - 기존 max ±15 → max ±11
      - 목표: 10~90점 골고루 분포, 0점/100점 극단값 회피
    - [x] 5.4.2: 테스트 케이스 수정
    - [x] 5.4.3: 문서 업데이트
    - **파일**: `src/lib/score/trait-modifiers.ts`

---

## 4. 기술 상세

### 4.1 병렬 진행 그룹

```
┌─────────────────────────────────────────────────────────────────────┐
│                         병렬 진행 구조                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [만세력 엔진 (기존)] ─────────────────────────────────────────────  │
│         │                                                           │
│         ▼                                                           │
│  pillars, jijanggan, daewun (공통 입력)                              │
│         │                                                           │
│    ┌────┴────────────────────┐                                      │
│    ▼                         ▼                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │  Group 1 (엔진)      │  │  Group 2 (프롬프트)  │  ← 병렬 진행     │
│  │  ─────────────────  │  │  ─────────────────  │                   │
│  │  Task 1: 데이터완성  │  │  Task 2: 프롬프트   │                   │
│  │   - 대운 전달       │  │   - 동적 고전선택   │                   │
│  │   - 대운 정밀계산   │  │   - 사주 구조화     │                   │
│  │   - 십신 분포       │  │   - 조후 분석       │                   │
│  │  Task 3: 엔진고도화  │  │  Task 4: 고전보강   │                   │
│  │   - 지지 상호작용   │  │   - 궁통보감 상세화 │                   │
│  │   - 격국 분류       │  │   - 자평진전 체계화 │                   │
│  │   - 12신살          │  │   - 현대화 표현     │                   │
│  └─────────┬───────────┘  └─────────┬───────────┘                   │
│            └──────────┬─────────────┘                               │
│                       ▼                                             │
│            ┌─────────────────────┐                                  │
│            │  Group 3 (통합)      │  ← 순차 진행                     │
│            │  ─────────────────  │                                  │
│            │  Task 5: 점수고도화  │                                  │
│            │   - 사건 강도 공식  │                                  │
│            │   - 물상론 DB       │                                  │
│            │   - Hybrid 통합     │                                  │
│            └─────────────────────┘                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**병렬 작업 핵심**:
- **Group 1 (Task 1 & 3)**: Python 엔진 개선, TypeScript 파이프라인 수정
- **Group 2 (Task 2 & 4)**: 프롬프트 시스템 개선 (Python)
- **Group 3 (Task 5)**: 양쪽 결과물 통합 (순차)

### 4.2 수정 파일 목록

#### Python 백엔드

| 파일 | Task | 변경 내용 |
|------|------|----------|
| `python/manseryeok/daewun.py` | 1.2 | 대운 시작 나이 정밀 계산 |
| `python/manseryeok/engine.py` | 3.1 | 지지 상호작용 확장 |
| `python/prompts/builder.py` | 2.1, 2.2, 2.3 | 동적 프롬프트 선택, 구조화, 조후 분석 |
| `python/prompts/classics_summary.py` | 4.1, 4.2 | 조후론/용신론 상세화 |
| `python/prompts/western/destiny_code.py` | 4.3 | 현대화 표현 |

#### TypeScript 프론트엔드

| 파일 | Task | 변경 내용 |
|------|------|----------|
| `src/lib/ai/pipeline/index.ts` | 1.1, 1.3, 5.3 | 대운/십신 전달, Hybrid 통합 |
| `src/lib/ai/pipeline/context.ts` | 1.3 | 십신 분포 저장 |
| `src/lib/score/calculator.ts` | 5.1 | 사건 강도 공식 (필요시) |

#### 신규 파일

| 파일 | Task | 설명 | 상태 |
|------|------|------|------|
| `python/prompts/classics/qiongtong_matrix.py` | 4.1 | 10일간×12월 조후 매트릭스 | ✅ |
| `python/prompts/classics/ziping_yongsin.py` | 4.2 | 자평진전 용신 5원칙 | ✅ |
| `python/prompts/western/destiny_code.py` | 4.3 | The Destiny Code 현대화 | ✅ |
| `python/manseryeok/sinsal.py` | 3.3 | 12신살 분석 모듈 | ✅ |
| `python/manseryeok/formation.py` | 3.2 | 격국 자동 분류 | ✅ |
| `python/manseryeok/interactions.py` | 3.1 | 지지 상호작용 | ✅ |
| `python/prompts/mulsangron.py` | 5.2 | 물상론 DB (십신별 길흉 매핑) | ✅ |
| `python/scoring/__init__.py` | 5.1 | 점수 모듈 export | ✅ |
| `python/scoring/event_score.py` | 5.1 | 사건 강도 점수 계산 | ✅ |
| `python/scoring/validation.py` | 5.3 | 점수-서술 일관성 검증 | ✅ |

---

## 5. 예상 효과

### 5.1 정량적 효과

| 항목 | 현재 | 개선 후 | 변화 |
|------|------|--------|------|
| 분석 정확도 | 기준 | +25-30% | ⬆️ |
| 토큰 사용량 | 120KB | 40-60KB | ⬇️ 50% |
| 응답 속도 | 기준 | +30% | ⬆️ |
| 분석 일관성 | 낮음 | 높음 | ⬆️ |

### 5.2 정성적 효과

- **규칙 기반 검증**: Gemini 응답의 일관성 보장
- **근거 투명성**: 점수 산출 로직 명시
- **고전 준수**: 자평진전/궁통보감 원칙 체계적 적용
- **다국어 품질**: 언어별 적절한 용어 사용

---

## 6. 구현 로드맵 (병렬 진행)

### Phase 1-2: Group 1 & 2 병렬 진행

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Group 1 (엔진)                    Group 2 (프롬프트)            │
│  ──────────────────────           ──────────────────────         │
│                                                                  │
│  Week 1                           Week 1                         │
│  ├─ Task 1.1 대운 정보 전달       ├─ Task 2.1 동적 고전 선택     │
│  ├─ Task 1.2 대운 정밀 계산       ├─ Task 2.2 사주 정보 구조화   │
│  └─ Task 1.3 십신 분포 공유       └─ Task 2.3 조후 분석          │
│                                                                  │
│  Week 2                           Week 2                         │
│  ├─ Task 3.1 지지 상호작용        ├─ Task 4.1 궁통보감 조후론    │
│  ├─ Task 3.2 격국 분류            ├─ Task 4.2 자평진전 용신론    │
│  └─ Task 3.3 12신살               └─ Task 4.3 The Destiny Code   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 3: Group 3 통합 (순차 진행)

```
Week 3
├── Task 5.1 사건 강도 공식 (Group 1 결과 활용)
├── Task 5.2 물상론 DB (Group 2 결과 활용)
└── Task 5.3 Hybrid 모델 통합 (양쪽 통합)
```

### 병렬 작업 시 주의사항

| 항목 | Group 1 | Group 2 |
|------|---------|---------|
| **주 담당** | Python 엔진 + TS 파이프라인 | Python 프롬프트 |
| **공통 의존** | 만세력 결과 (pillars, daewun) | 만세력 결과 (pillars, daewun) |
| **인터페이스** | API 응답 스키마 유지 | 프롬프트 함수 시그니처 유지 |
| **통합 시점** | Week 3 시작 전 | Week 3 시작 전 |

---

## 7. 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 토큰 증가 | 중간 | 동적 고전 선택으로 상쇄 |
| 규칙 충돌 | 낮음 | 우선순위 명확화 |
| API 호환성 | 중간 | 점진적 마이그레이션 |
| 테스트 커버리지 | 높음 | 단계별 테스트 추가 |

---

## 8. 성공 기준

- [ ] 분석 정확도 +25% 이상 (사용자 피드백 기반) - 검증 필요
- [ ] 토큰 사용량 -40% 이상 - 검증 필요
- [x] 모든 Task 체크리스트 완료 ✅ (Task 1~5 완료)
- [ ] 단위 테스트 커버리지 80% 이상 - 추가 테스트 필요
- [x] 5개 언어 동일 품질 유지 ✅ (ko, en, ja, zh-CN, zh-TW 지원)

---

**작성자**: Claude
**검토자**: -
**승인자**: -
