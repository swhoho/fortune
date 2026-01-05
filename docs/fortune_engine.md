# 사주 분석 엔진 (Fortune Engine)

> 사주 분석의 전체 파이프라인을 정의하고 지속적으로 개선하기 위한 문서

**목적**: AI 사주 분석의 정확도와 품질을 높이기 위해 분석 로직, 프롬프트, 고전 해석 규칙을 체계적으로 관리

---

## 📊 분석 파이프라인 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        사주 분석 파이프라인                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1. 입력]        [2. 만세력]       [3. RAG]        [4. AI 분석]        │
│  ─────────────────────────────────────────────────────────────────────  │
│  생년월일    →    사주 계산    →   고전 검색   →   Gemini 분석          │
│  시간대           대운 계산         문헌 매칭       JSON 출력            │
│  성별             지장간            인용 추출       다국어 처리          │
│                                                                         │
│  [5. 시각화]      [6. 출력]                                             │
│  ─────────────────────────────────────────────────────────────────────  │
│  명반 이미지  →   결과 저장                                             │
│  오행 그래프      사용자 전달                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 v2.0 멀티스텝 파이프라인 (Task 6)

### 아키텍처 개요

```
v1.0: [입력] → [Gemini 1회] → [결과]

v2.0: [입력] → [만세력] → [지장간] → [기본분석] → [성격] → [적성] → [재물/연애] → [점수] → [시각화] → [저장]
                  ↓          ↓          ↓           ↓         ↓           ↓
               Python     Python     Gemini#1   Gemini#2  Gemini#3    Gemini#4
                                       ↘          ↓         ↙
                                        (병렬 처리: 성격/적성/재물)
```

### 10단계 파이프라인

| 단계 | 이름 | 설명 | 엔진 | 예상 시간 |
|------|------|------|------|----------|
| 1 | `manseryeok` | 만세력 계산 | Python | ~0.5초 |
| 2 | `jijanggan` | 지장간 추출 | Python | ~0.2초 |
| 3 | `basic_analysis` | 격국/용신 분석 | Gemini | ~5초 |
| 4 | `personality` | 성격 분석 | Gemini | ~4초 |
| 5 | `aptitude` | 적성 분석 | Gemini | ~4초 |
| 6 | `fortune` | 재물/연애 분석 | Gemini | ~4초 |
| 7 | `scoring` | 점수 산출 | TypeScript | ~0.1초 |
| 8 | `visualization` | 명반 생성 | Python | ~1초 |
| 9 | `saving` | DB 저장 | Prisma | ~0.3초 |
| 10 | `complete` | 완료 | - | - |

### 병렬 처리 최적화

`personality`, `aptitude`, `fortune` 단계는 `Promise.allSettled`로 병렬 실행:
- 순차 실행: ~12초
- 병렬 실행: ~5초 (약 60% 단축)

### 구현 파일

```
src/lib/ai/
├── types.ts          # PipelineStep, PipelineIntermediateResults 타입
├── pipeline.ts       # AnalysisPipeline 클래스 + createAnalysisPipeline 팩토리
└── index.ts          # export

python/prompts/
├── builder.py        # build_step() 메서드 (단계별 프롬프트)
└── classics_summary.py # 멀티스텝용 핵심 요약
```

### AnalysisPipeline 클래스

```typescript
// 팩토리 함수 (동시성 안전)
export function createAnalysisPipeline(options?: PipelineOptions): AnalysisPipeline

// 주요 메서드
execute(input): Promise<PipelineResponse>           // 전체 실행
executeFromStep(input, step): Promise<PipelineResponse>  // 특정 단계부터 재실행
hydrate(results, fromStep): void                    // 상태 복원 (재시도용)

// 옵션
interface PipelineOptions {
  enableParallel?: boolean;  // 병렬 처리 (기본: true)
  retryCount?: number;       // 재시도 횟수 (기본: 1)
  onProgress?: (progress) => void;
  onStepComplete?: (step, result) => void;
  onError?: (step, error) => void;
}
```

### 에러 복구 전략

| 에러 유형 | 재시도 | 전략 |
|----------|--------|------|
| TIMEOUT | O | 타임아웃 1.5배 후 재시도 |
| RATE_LIMIT | O | 2초 대기 후 재시도 |
| PARSE_ERROR | O | 프롬프트 수정 후 재시도 |
| INVALID_INPUT | X | 사용자에게 안내 |

**부분 실패 처리**:
- 만세력/기본분석 실패 → 전체 중단
- 성격/적성/재물 일부 실패 → 부분 결과 제공
- 점수/시각화 실패 → 텍스트 결과만 제공

### API 엔드포인트

- `POST /api/analysis/pipeline` - 파이프라인 실행 (60초 타임아웃)
- `POST /api/analysis/pipeline/retry` - 실패 단계부터 재시도

---

## 📈 점수 계산 알고리즘 (Task 21)

### 개요

파이프라인 7단계(`scoring`)에서 실행되는 십신(十神) 기반 특성 점수 계산 모듈.

### 십신(十神) 정의

일간(日干)을 기준으로 다른 천간과의 관계:

| 십신 | 관계 | 성격 특성 |
|------|------|----------|
| 비견 | 같은 오행, 같은 음양 | 독립심, 경쟁심, 자존심 |
| 겁재 | 같은 오행, 다른 음양 | 추진력, 승부욕, 결단력 |
| 식신 | 내가 생하는 오행, 같은 음양 | 표현력, 여유, 낙천성 |
| 상관 | 내가 생하는 오행, 다른 음양 | 창의성, 반항, 예리함 |
| 정재 | 내가 극하는 오행, 다른 음양 | 안정, 성실, 근면 |
| 편재 | 내가 극하는 오행, 같은 음양 | 사교성, 투자, 변동 |
| 정관 | 나를 극하는 오행, 다른 음양 | 책임감, 명예, 원칙 |
| 편관 | 나를 극하는 오행, 같은 음양 | 권력, 카리스마, 결단 |
| 정인 | 나를 생하는 오행, 다른 음양 | 학습, 인내, 포용력 |
| 편인 | 나를 생하는 오행, 같은 음양 | 직관, 독창성, 전문성 |

### 점수 계산 공식

```typescript
// 1. 십신 추출 (가중치 적용)
const tenGodCounts = extractTenGods(pillars, jijanggan);
// - 천간: 가중치 1.0
// - 지장간 정기: 가중치 1.0
// - 지장간 여기/중기: 가중치 0.3

// 2. 특성 점수 계산
let score = 50;  // 기본점수
for (tenGod in counts) {
  score += TRAIT_MODIFIERS[trait][tenGod] * counts[tenGod];
}
return clamp(score, 0, 100);
```

### 35개 특성 항목

| 카테고리 | 항목 (10개) |
|---------|------------|
| 성격 특성 | 의지력, 사교성, 인내력, 독립심, 신뢰성, 배려심, 유머감각, 협동심, 표현력, 성실도 |
| 업무 능력 | 기획력, 추진력, 실행력, 완성도, 관리력 |
| 적성 특성 | 분석력, 협동심, 학습력, 창의력, 예술성, 표현력, 활동성, 도전정신, 사업감각, 신뢰성 |
| 연애 특성 | 배려심, 유머감각, 감성, 자존감, 모험심, 성실도, 사교성, 경제관념, 신뢰성, 표현력 |

### 구현 파일

```
src/lib/score/
├── types.ts              # TenGod, TenGodCounts 타입
├── constants.ts          # 천간/지지/오행 매핑
├── ten-gods.ts           # 십신 추출 함수
├── trait-modifiers.ts    # 35개 특성 영향 매핑
├── calculator.ts         # 점수 계산 로직
└── index.ts              # 모듈 export
```

### 테스트

- `tests/unit/lib/score/ten-gods.test.ts` (22개)
- `tests/unit/lib/score/calculator.test.ts` (16개)

---

## 1️⃣ 입력 처리 (Input Processing)

### 필수 입력값

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| birthDatetime | DateTime | 생년월일시 | 1990-05-15T14:30:00 |
| timezone | String | 출생지 시간대 | GMT+9 |
| isLunar | Boolean | 음력 여부 | false |
| gender | Enum | 성별 (대운 방향 결정) | male / female |

### 선택 입력값

| 필드 | 타입 | 설명 |
|------|------|------|
| focusArea | Enum | 집중 분석 영역 (wealth/love/career/health/comprehensive) |
| question | String | 사용자 고민 (500자 제한) |

### 시간대 처리 규칙

```python
# 진태양시 보정 (선택적 적용)
# 한국: 경도 127° 기준, 표준시와 약 30분 차이
def adjust_true_solar_time(datetime, longitude):
    # 경도 1° = 4분
    offset_minutes = (longitude - 135) * 4  # 한국 표준시 기준 135°
    return datetime + timedelta(minutes=offset_minutes)
```

---

## 2️⃣ 만세력 계산 (Manseryeok Engine)

### 사주 팔자 계산

#### 연주 (年柱)
- **기준**: 입춘(立春) 기점
- **규칙**: 입춘 전 출생 → 전년도 간지

#### 월주 (月柱)
- **기준**: 절입(節入) 시각
- **24절기 절입표**: 

| 월 | 절기 | 대략적 날짜 |
|----|------|------------|
| 1월 (寅) | 입춘 | 2/4 |
| 2월 (卯) | 경칩 | 3/6 |
| 3월 (辰) | 청명 | 4/5 |
| ... | ... | ... |

#### 일주 (日柱)
- **기준**: 자시(子時, 23:00) 기점
- **규칙**: 23:00 이후 출생 → 다음날 일주

#### 시주 (時柱)
- **12시진 매핑**:

| 시진 | 시간 | 지지 |
|------|------|------|
| 자시 | 23:00-01:00 | 子 |
| 축시 | 01:00-03:00 | 丑 |
| 인시 | 03:00-05:00 | 寅 |
| ... | ... | ... |

### 대운 계산

```python
def calculate_daewun(gender, year_stem):
    """
    대운 순역 판단
    - 양남음녀: 순행 (월주 다음 간지로)
    - 음남양녀: 역행 (월주 이전 간지로)
    """
    yang_stems = ['甲', '丙', '戊', '庚', '壬']
    is_yang_year = year_stem in yang_stems
    
    if (gender == 'male' and is_yang_year) or (gender == 'female' and not is_yang_year):
        return 'forward'  # 순행
    else:
        return 'backward'  # 역행
```

### 지장간 (支藏干)

| 지지 | 지장간 (여기/중기/정기) |
|------|------------------------|
| 子 | 癸 |
| 丑 | 癸, 辛, 己 |
| 寅 | 戊, 丙, 甲 |
| 卯 | 乙 |
| 辰 | 乙, 癸, 戊 |
| 巳 | 戊, 庚, 丙 |
| 午 | 己, 丁 |
| 未 | 丁, 乙, 己 |
| 申 | 己, 壬, 庚 |
| 酉 | 辛 |
| 戌 | 辛, 丁, 戊 |
| 亥 | 戊, 甲, 壬 |

---

## 3️⃣ RAG 시스템 (고전 문헌 검색)

### 학습 문헌

| 문헌 | 언어 | 핵심 내용 | 우선순위 |
|------|------|----------|----------|
| 자평진전 (子平真詮) | 한문 | 격국론, 용신론 | ⭐⭐⭐ |
| 궁통보감 (窮通寶鑑) | 한문 | 조후론, 월령 분석 | ⭐⭐⭐ |
| The Destiny Code | 영문 | 서구권 해석 프레임 | ⭐⭐ |
| 적천수 (滴天髓) | 한문 | 심화 이론 | ⭐⭐ |

### 청크 분할 전략

```python
CHUNK_CONFIG = {
    "chunk_size": 500,      # 토큰 기준
    "overlap": 50,          # 겹침
    "separator": "\n\n",    # 문단 구분
}
```

### 검색 쿼리 생성

```python
def generate_rag_query(pillars, focus_area):
    """
    사주 정보를 기반으로 RAG 검색 쿼리 생성
    """
    day_master = pillars['day']['stem']  # 일간
    queries = [
        f"{day_master} 일간 성격 특성",
        f"{day_master} 용신 분석",
        f"{focus_area} 운세 {day_master}",
    ]
    return queries
```

---

## 4️⃣ AI 분석 (Gemini Integration)

### 모델 설정

| 설정 | 값 | 설명 |
|------|------|------|
| 모델 | `gemini-3-pro-preview` | Gemini 3.0 Pro |
| Temperature | 0.7 | 창의성과 일관성 균형 |
| Max Output Tokens | 8192 | 충분한 분석 결과 생성 |
| Top P | 0.8 | 다양성 조절 |
| Response Format | application/json | JSON 응답 강제 |

### 구현 파일

```
src/lib/ai/
├── types.ts      # AI 분석 결과 타입 + 후속 질문 타입 (Task 16)
├── gemini.ts     # Gemini 클라이언트 초기화
├── prompts.ts    # 폴백용 시스템 프롬프트 + generateFollowUpPrompt (Task 16)
├── analyzer.ts   # SajuAnalyzer 클래스 (analyze + followUp 메서드)
└── index.ts      # 모듈 export

python/prompts/           # 다국어 명리학 프롬프트 시스템 (Task 14, 18)
├── master_prompt.py      # 30년 거장 페르소나
├── classics/
│   ├── ziping.py         # 자평진전 (용신/격국/십신/합충) - 5개 언어
│   └── qiongtong.py      # 궁통보감 (조후론) - 5개 언어
├── western/
│   └── destiny_code.py   # The Destiny Code (서구권 프레임워크)
├── locales/
│   ├── ko.py             # 한국어 (한자 병기, 존댓말)
│   ├── en.py             # 영어 (PRD/The Destiny Code 스타일)
│   ├── ja.py             # 일본어 (四柱推命, 敬語)
│   ├── zh_cn.py          # 중국어 간체 (八字命理, 简体字)
│   └── zh_tw.py          # 중국어 번체 (八字命理, 繁體字)
├── builder.py            # 프롬프트 조합 빌더 (zh-CN/zh-TW 분리)
└── schemas.py            # JSON 출력 스키마

src/app/api/analysis/gemini/
└── route.ts      # POST /api/analysis/gemini (language 파라미터 지원)
```

### 프롬프트 시스템 아키텍처 (Task 14)

```
┌─────────────────────────────────────────────────────────────┐
│                    프롬프트 빌드 파이프라인                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [1. 마스터]     [2. 고전]        [3. 서구권]    [4. 로케일]  │
│  ───────────────────────────────────────────────────────── │
│  페르소나    →   자평진전     →   The Destiny  →  언어별     │
│  분석 원칙       궁통보감         Code           스타일       │
│                                                             │
│  [5. 스키마]     [6. 사주 정보]                              │
│  ─────────────────────────────────────────────────────────  │
│  JSON 출력   →   팔자/대운/질문                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**API 엔드포인트**: `POST /api/prompts/build` (Python FastAPI)
- Request: `{ language, pillars, daewun, focusArea, question, options }`
- Response: `{ systemPrompt, userPrompt, outputSchema, metadata }`

**프롬프트 조합 순서**:
1. **마스터 프롬프트** - 30년 경력 명리학 거장 페르소나, 분석 원칙
2. **자평진전** - 용신 5원칙, 8격, 십신, 합충형파해
3. **궁통보감** - 계절별 오행, 한난조습 조후론, 월령 용신표
4. **The Destiny Code** - 현대적 비유, Action-oriented 조언 (모든 언어)
5. **로케일** - 언어별 톤, 용어 스타일, 고전 인용 방식
6. **출력 스키마** - JSON 형식 설명

### 시스템 프롬프트 구조

```
[역할 정의]
당신은 30년 경력의 명리학 거장입니다. 자평진전, 궁통보감, 적천수 등
고전을 깊이 연구했으며, 현대적이고 논리적인 해석을 제공합니다.

[분석 원칙]
1. 일간(日干) 중심 분석
2. 격국(格局) 우선 판단
3. 용신(用神) → 희신(喜神) → 기신(忌神) 순서
4. 대운(大運) 흐름 분석
5. 건설적이고 실용적인 조언

[자평진전 원리]
- 용신 5원칙 (억부/조후/통관/병약/전왕)
- 격국 8격 (정관격, 편관격, 정인격...)
- 십신 해석 프레임워크
- 합충형파해 관계

[궁통보감 조후론]
- 계절별 오행 왕쇠
- 한난조습 조절 원리
- 일간별 월령 조후 용신표

[현대적 해석 (The Destiny Code)]
- 용어 매핑 (Day Master, Useful God...)
- 오행을 에너지 타입으로 설명
- Action-oriented 조언 형식

[언어별 스타일]
- ko: 한자 병기, 존댓말 (자평진전/궁통보감 용어)
- en: PRD/The Destiny Code 스타일 (Companion, Creative Output, Direct Resource 등)
- ja: 四柱推命 용어, 敬語
- zh-CN: 八字命理 전통 표현, 简体字 (子平真诠, 穷通宝鉴)
- zh-TW: 八字命理 전통 표현, 繁體字 (子平真詮, 窮通寶鑑)

[출력 형식]
{JSON 스키마}

[사주 정보]
{팔자, 대운, 지장간}

[사용자 질문]
{focusArea}, {question}
```

### 출력 JSON 스키마

```json
{
  "summary": "한 줄 요약 (50자 이내)",
  "personality": {
    "title": "성격 분석",
    "content": "상세 내용 (500자)",
    "keywords": ["키워드1", "키워드2"]
  },
  "wealth": {
    "title": "재물운",
    "content": "상세 내용",
    "score": 75,
    "advice": "구체적 조언"
  },
  "love": { ... },
  "career": { ... },
  "health": { ... },
  "yearly_flow": [
    { "year": 2026, "theme": "변화", "score": 80, "advice": "..." }
  ],
  "classical_references": [
    { "source": "자평진전", "quote": "甲木者...", "interpretation": "..." }
  ]
}
```

### 멀티스텝 분석용 프롬프트 모듈 (Task 7)

**파일**: `python/prompts/classics_summary.py`

v2.0 멀티스텝 파이프라인에서 각 단계별 컨텍스트 효율을 극대화하기 위한 핵심 요약 모듈.
기존 ziping.py (714줄), qiongtong.py (1410줄)을 300-500토큰으로 압축.

**모듈 구성**:
| 상수 | 토큰 | 설명 | 사용 단계 |
|------|------|------|----------|
| `ZIPING_SUMMARY` | ~300 | 용신 5원칙, 정격 8격, 오행 생극제화 | Step 2 (기본분석) |
| `QIONGTONG_SUMMARY` | ~400 | 조후론 핵심, 계절별 조후, 한난조습 4원리 | Step 2-3 |
| `TEN_GODS_GUIDE` | ~350 | 십신 5계열 성격 해석 (비겁/식상/재성/관성/인성) | Step 3 (성격분석) |
| `DAY_MASTER_TRAITS` | ~600 | 10일간 특성 테이블 (성격/강점/약점/적합분야/조후우선순위) | Step 2-4 |

**헬퍼 함수**:
```python
get_ziping_summary(language: str) -> str
get_qiongtong_summary(language: str) -> str
get_ten_gods_guide(language: str) -> str
get_day_master_traits(day_master: str) -> dict
get_day_master_johu(day_master: str, season: str) -> str
build_multistep_prompt(step: str, language: str, day_master: str, season: str) -> str
```

**멀티스텝 파이프라인 연동**:
```
[Step 1: 만세력] → 기존 API
     ↓
[Step 2: 기본분석] → ZIPING + QIONGTONG + DAY_MASTER_TRAITS
     ↓
[Step 3: 성격분석] → TEN_GODS_GUIDE
     ↓
[Step 4: 적성분석] → DAY_MASTER_TRAITS['suitable']
     ↓
[Step 5: 재물/연애] → 종합 컨텍스트
```

**다국어 지원**: ko, en, ja, zh-CN, zh-TW (5개 언어)

### 단계별 상세 프롬프트 (Task 9-11)

**파일**: `python/prompts/builder.py` - `_get_step_instructions()`

멀티스텝 파이프라인의 각 분석 단계별 전문화된 프롬프트.

#### Task 9: 성격 분석 프롬프트 (personality)

**분석 항목**:
| 항목 | 설명 | 점수 범위 |
|------|------|----------|
| 의지력 | 비견/겁재 비중 기반 | 0-100 |
| 겉성격 | 시주 + 일간 조합 | 텍스트 |
| 속성격 | 월주 + 일간 조합 | 텍스트 |
| 대인관계 스타일 | 식상/재성/관성 비중 | 주도형/협조형/관망형 |

**분석 원칙**:
- 비견/겁재 강함 → 의지력/독립심 강함
- 식상 강함 → 표현력/창의성 뛰어남
- 재성 강함 → 현실감각/사교성 좋음
- 관성 강함 → 책임감/규율 중시
- 인성 강함 → 학습능력/보호본능 강함

**참조 고전**: `get_ten_gods_guide(language)` - 십신 해석 가이드

#### Task 10: 적성 분석 프롬프트 (aptitude)

**분석 항목**:
| 항목 | 설명 |
|------|------|
| 핵심 키워드 | 3-5개 대표 단어 |
| 타고난 재능 | 재능명, 수준(0-100), 설명 (최소 3개) |
| 추천 분야 | 분야명, 적합도(0-100), 추천 이유 (최소 5개) |
| 피해야 할 분야 | 기신 오행 관련 분야 |
| 재능 활용 상태 | 현재 발휘 수준, 잠재력, 개발 조언 |

**적성 원칙**:
- 식신/상관 강함 → 창의력, 예술, 표현 분야
- 정재/편재 강함 → 사업, 금융, 영업 분야
- 정관/편관 강함 → 공직, 관리, 법률 분야
- 정인/편인 강함 → 학문, 연구, 교육 분야
- 비견/겁재 강함 → 독립사업, 경쟁 분야

**참조 고전**: `get_ziping_summary(language)` - 자평진전 격국 원리

#### Task 11: 재물/연애 분석 프롬프트 (fortune)

**재물운 분석**:
| 항목 | 설명 |
|------|------|
| 패턴 유형 | 축재형/소비형/투자형/안정형 |
| 재물 강점 | 3가지 (구체적 상황 포함) |
| 재물 리스크 | 3가지 (주의 상황 포함) |
| 재물 점수 | 0-100 |
| 재물 조언 | 구체적이고 실천 가능한 조언 |

**연애운 분석**:
| 항목 | 설명 |
|------|------|
| 스타일 유형 | 적극형/수동형/감성형/이성형 |
| 이상형 특성 | 외모, 성격, 직업 등 |
| 결혼관 | 결혼에 대한 태도, 적합한 시기 |
| 궁합 점수 | 0-100 |
| 주의사항 | 3가지 (피해야 할 패턴) |

**재성/관성 해석 기준**:
- 정재(正財): 안정적 수입, 저축, 근면, 계획적 재테크
- 편재(偏財): 투기적 수입, 사교력, 융통성, 기회 포착
- 남성: 정재=아내, 편재=연인
- 여성: 정관=남편, 편관=연인
- 식상: 표현력, 매력, 자녀운

**민감 내용 순화 가이드라인** (프롬프트 내 통합):
- "이혼" → "결혼 생활의 도전"
- "파산" → "재정적 어려움"
- 부정적 표현을 완곡하게 처리

**참조 고전**: `get_ziping_summary()` + `get_qiongtong_summary()` - 자평진전 + 궁통보감 통합

### 프롬프트 버전 관리

| 버전 | 날짜 | 변경 내용 | 성능 |
|------|------|----------|------|
| v1.0 | 2026-01-02 | 초기 버전 | - |
| v1.1 | 2026-01-02 | 후속 질문 프롬프트 추가 (Task 16) | - |
| v1.2 | 2026-01-03 | 멀티스텝용 classics_summary.py 추가 (Task 7) | - |
| v1.3 | 2026-01-03 | 성격/적성/재물·연애 프롬프트 5개 언어 (Task 9-11) | - |
| v1.4 | 2026-01-05 | 궁통보감 조후 매트릭스 완성 (Task 4.1) | - |

---

## 조후 분석 시스템 (Task 4.1)

궁통보감(窮通寶鑑) 기반 10일간 × 12월 = 120개 조후 용신 데이터.

### 파일 구조

```
python/prompts/classics/
├── __init__.py          # 모듈 export
├── qiongtong.py         # 기존 프롬프트
├── qiongtong_matrix.py  # 조후 매트릭스 (120개) ← 신규
└── ziping.py            # 자평진전
```

### JohuEntry 데이터 구조

```python
@dataclass
class JohuEntry:
    day_master: str      # 일간 (甲~癸)
    month: str           # 월지 (寅~丑)
    primary_god: str     # 1순위 용신
    secondary_god: str   # 2순위 용신
    condition: Dict[str, str]  # 조건 (ko/en/ja/zh-CN/zh-TW)
    outcome: Dict[str, str]    # 결과/효과
    warning: Dict[str, str]    # 주의사항
    original: str              # 원문 (한자)
```

### 사용 예시

```python
from prompts.classics import get_johu_entry, build_johu_prompt

# 개별 조후 조회
entry = get_johu_entry("甲", "寅")
print(entry.primary_god)      # "丙"
print(entry.condition["ko"])  # "초봄 한기가 남아있어 調候(조후)가 급선무"

# 프롬프트 생성
prompt = build_johu_prompt("甲", "寅", language="ko")
```

### 지원 언어

| 코드 | 언어 | 특징 |
|------|------|------|
| `ko` | 한국어 | 한자(읽기) 형태 (예: 丙(병)火) |
| `en` | 영어 | 로마자 표기 |
| `ja` | 일본어 | 한자 + 히라가나 |
| `zh-CN` | 중국어 간체 | 원문 기반 |
| `zh-TW` | 중국어 번체 | 원문 기반 |

---

## The Destiny Code 프레임워크 (Task 4.3)

Joey Yap의 "BaZi - The Destiny Code" 기반 서구권 적합 현대적 BaZi 프레임워크.

### 파일 구조

```
python/prompts/western/
├── __init__.py          # 모듈 export
└── destiny_code.py      # The Destiny Code 프레임워크
```

### 핵심 컴포넌트

#### 1. 십신 다국어 매핑 (`TEN_GODS_MAPPING`)

```python
TEN_GODS_MAPPING = {
    "비견": {"ko": "비견(比肩)", "en": "Friend", "ja": "比肩（ひけん）", ...},
    "겁재": {"ko": "겁재(劫財)", "en": "Rob Wealth", ...},
    "식신": {"ko": "식신(食神)", "en": "Eating God", ...},
    "상관": {"ko": "상관(傷官)", "en": "Hurting Officer", ...},
    "정재": {"ko": "정재(正財)", "en": "Direct Wealth", ...},
    "편재": {"ko": "편재(偏財)", "en": "Indirect Wealth", ...},
    "정관": {"ko": "정관(正官)", "en": "Direct Officer", ...},
    "편관": {"ko": "편관(偏官)", "en": "Seven Killings", ...},
    "정인": {"ko": "정인(正印)", "en": "Direct Resource", ...},
    "편인": {"ko": "편인(偏印)", "en": "Indirect Resource", ...},
}
```

#### 2. DestinyAdvice 데이터클래스

```python
@dataclass
class DestinyAdvice:
    ten_god: str                           # 십신
    strength: Literal["strong", "weak", "balanced"]
    career_advice: Dict[str, str]          # 직업 조언 (5개 언어)
    relationship_advice: Dict[str, str]    # 관계 조언
    action_items: Dict[str, List[str]]     # 실천 항목
    avoid_items: Dict[str, List[str]]      # 피해야 할 것
    insight: Dict[str, str]                # 핵심 통찰
```

#### 3. LuckCycleEntry 프레임워크

```python
@dataclass
class LuckCycleEntry:
    cycle_type: Literal["daewun", "year", "month"]  # 대운/세운/월운
    pillar_stem: str                         # 천간
    pillar_branch: str                       # 지지
    interaction_with_chart: str              # 상호작용 유형
    theme: Dict[str, str]                    # 주제 (5개 언어)
    opportunities: Dict[str, List[str]]      # 기회
    challenges: Dict[str, List[str]]         # 도전
    action_advice: Dict[str, str]            # 실천 조언
    timing_quality: Literal["excellent", "good", "neutral", "challenging", "difficult"]
```

### 헬퍼 함수

```python
from prompts.western import (
    get_destiny_advice,
    build_luck_cycle_prompt,
    build_destiny_code_analysis_prompt
)

# 십신별 조언 조회
advice = get_destiny_advice('정관', 'strong', 'ko')
print(advice['career_advice'])  # "체계적인 조직에서 승진 경로가..."

# 대운 프롬프트 생성
prompt = build_luck_cycle_prompt('daewun', '甲', '子', '충', True, 'ko')

# 분석 프롬프트 생성
analysis = build_destiny_code_analysis_prompt('정관', 'strong', 'en')
```

### 지원 십신 × 강약

| 십신 | strong | weak | balanced |
|------|--------|------|----------|
| 정관 | ✅ | ✅ | ✅ |
| 편관 | ✅ | ✅ | ✅ |
| 정재 | ✅ | ✅ | ✅ |
| 식신 | ✅ | ✅ | ✅ |

(추후 나머지 십신 확장 예정)

### 대운 상호작용 유형

| 유형 | 설명 |
|------|------|
| 합(合) | 새로운 인연과 협력의 기회 |
| 충(冲) | 변화와 이동의 시기 |
| 형(刑) | 시험과 갈등의 시기 |
| 해(害) | 숨겨진 장애물의 시기 |
| 파(破) | 기존 구조가 깨지는 시기 |
| 용신운 | 유리한 에너지의 황금기 |
| 기신운 | 도전적 에너지의 시기 |

---

### 후속 질문 시스템 (Task 16)

사용자가 기존 분석 결과를 기반으로 추가 질문을 할 수 있는 기능.

**특징**:
- 이전 분석 + Q&A 히스토리 컨텍스트 유지
- 질문당 10 크레딧 차감
- 300-500자 한국어 답변
- DB 저장으로 Long-term Memory 구현

**프롬프트 구조** (`generateFollowUpPrompt`):
```
[역할 정의]
30년 경력 명리학 전문가로서 이전 분석 기반 후속 답변 제공

[이전 분석 요약]
- 사주 팔자 (4기둥)
- 성격/재물/연애/직장/건강 분석 요약
- 점수 정보

[질문 히스토리]
Q1: ...
A1: ...
(최근 5개까지)

[새 질문]
사용자 질문

[응답 가이드라인]
- 이전 분석과 일관성 유지
- 명리학적 근거 제시
- 300-500자 한국어
- 건설적 조언
```

**API 엔드포인트**: `POST /api/analysis/:id/question`
- Request: `{ question: string }`
- Response: `{ success, data: { answer, questionId, creditsUsed, remainingCredits } }`

**구현 파일**:
```
src/app/api/analysis/[id]/question/route.ts  # 후속 질문 API
src/components/analysis/FollowUpQuestion.tsx # Q&A 스레드 UI
src/stores/analysis.ts                        # 질문 상태 관리
```

---

## 5️⃣ 시각화 (Visualization)

### 사주 명반 이미지

```
┌─────────────────────────────────────────┐
│     時柱      日柱      月柱      年柱   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐│
│  │  辛   │ │  甲   │ │  辛   │ │  庚   ││
│  │ (金)  │ │ (木)  │ │ (金)  │ │ (金)  ││
│  ├───────┤ ├───────┤ ├───────┤ ├───────┤│
│  │  未   │ │  子   │ │  巳   │ │  午   ││
│  │ (土)  │ │ (水)  │ │ (火)  │ │ (火)  ││
│  └───────┘ └───────┘ └───────┘ └───────┘│
└─────────────────────────────────────────┘
```

### 구현 상세 (Phase 1 완료)

**클래스**: `SajuVisualizer` (`python/visualization/visualizer.py`)
- 이미지 크기: 800x400px
- 출력 형식: Base64 PNG
- 폰트: 시스템 폰트 폴백 (Arial Unicode / AppleSDGothicNeo)

**오행 색상 매핑**:
| 오행 | 배경색 | 텍스트색 |
|------|--------|---------|
| 木 | `#4ade80` | `#1a1a1a` |
| 火 | `#ef4444` | `#ffffff` |
| 土 | `#f59e0b` | `#1a1a1a` |
| 金 | `#e5e7eb` | `#1a1a1a` |
| 水 | `#1e3a8a` | `#ffffff` |

**API 엔드포인트**: `POST /api/visualization/pillar`
- Request: `{ pillars: Pillars }`
- Response: `{ imageBase64: "data:image/png;base64,..." }`

### 오행 비율 그래프

- 차트 타입: Recharts BarChart
- X축: 木, 火, 土, 金, 水
- Y축: 개수 (0-8)
- 색상: 오행별 컬러 매핑

### 오행 상생상극 관계도 (Phase 2 완료)

**컴포넌트**: `ElementRelationGraph` (`src/components/analysis/ElementRelationGraph.tsx`)

```
           木 (green)
          /   \
    상생↙     ↘상극
       /         \
     水 ←───────→ 火
      \    상극    /
   상생↖         ↗상생
        \       /
         金 ─── 土
           상극
```

- D3.js SVG 렌더링
- 5개 노드 원형 배치 (72도 간격)
- 상생 화살표 (초록 `#22c55e`): 木→火→土→金→水→木 (외곽 곡선)
- 상극 화살표 (빨강 `#ef4444`): 木→土→水→火→金→木 (내부 점선)
- 호버 시 오행 설명 툴팁
- 사용자 사주 강한 오행 하이라이트 (글로우 효과)

### 기둥 상세 모달 (Phase 2 완료)

**컴포넌트**: `PillarDetailModal` (`src/components/analysis/PillarDetailModal.tsx`)

- shadcn/ui Dialog 사용
- 명반 이미지에서 각 기둥(시/일/월/연주) 클릭 시 표시
- 표시 정보:
  - 천간: 한자 + 오행 + 음양
  - 지지: 한자 + 오행 + 음양
  - 지장간: 3개 숨겨진 천간 (오행별 색상 적용)

### SVG 다운로드 (Task 15 완료)

**유틸리티**: `src/lib/utils/svg-download.ts`

- `downloadSvg(svgElement, filename)`: SVG 파일 다운로드
- `downloadSvgAsPng(svgElement, filename, scale)`: PNG 변환 다운로드
- 오행 관계도 헤더에 다운로드 버튼 추가

### 대운 타임라인 아코디언 (Task 15 완료)

**컴포넌트**: `DaewunTimeline` (`src/components/analysis/DaewunTimeline.tsx`)

- 대운 카드 클릭 시 인라인 확장 (AnimatePresence)
- 확장 콘텐츠:
  - 천간(天干) 의미: 10개 천간별 상세 설명
  - 지지(地支) 의미: 12개 지지별 상세 설명
  - 종합 조언: 현재/미래 대운별 맞춤 조언
- 상수 정의: `STEM_MEANINGS`, `BRANCH_MEANINGS`

---

## 6️⃣ 품질 개선 로그

### 개선 이력

| 날짜 | 영역 | 이전 | 이후 | 결과 |
|------|------|------|------|------|
| 2026-01-02 | 문서 생성 | - | 초기 버전 | - |
| 2026-01-02 | 만세력 엔진 | 미구현 | Python FastAPI 구현 완료 | 12개 테스트 통과 |
| 2026-01-02 | Gemini API | 미구현 | gemini-3-pro-preview 통합 완료 | Task 6 완료 |
| 2026-01-02 | 명반 시각화 | 미구현 | SajuVisualizer 구현 완료 | 11개 테스트 통과 |
| 2026-01-02 | D3.js 관계도 | 미구현 | ElementRelationGraph 구현 완료 | Task 8 Phase 2 |
| 2026-01-02 | 기둥 상세 모달 | 미구현 | PillarDetailModal 구현 완료 | Task 8 Phase 2 |
| 2026-01-02 | SVG 다운로드 | 미구현 | svg-download.ts 유틸리티 구현 | Task 15 |
| 2026-01-02 | 대운 아코디언 | 기본 카드 | 클릭 시 인라인 확장 구현 | Task 15 |
| 2026-01-02 | 프롬프트 엔지니어링 | 한국어 고정 prompts.ts | Python 다국어 프롬프트 시스템 구축 | Task 14 |
| 2026-01-02 | 자평진전/궁통보감 | 미적용 | 고전 원칙 기반 프롬프트 삽입 | Task 14 |
| 2026-01-02 | The Destiny Code | 영어만 적용 | 모든 언어(ko/en/ja/zh)에 적용 | Task 14 |
| 2026-01-02 | 후속 질문 시스템 | 미구현 | DB 저장 + Q&A 스레드 구현 | Task 16 |
| 2026-01-02 | SajuAnalyzer | analyze만 | followUp 메서드 추가 | Task 16 |
| 2026-01-02 | 결과 페이지 | temp ID 사용 | 실제 분석 ID로 DB 연동 | Task 16 |
| 2026-01-02 | 다국어 프롬프트 | 4개 언어 (ko/en/ja/zh) | 5개 언어 (ko/en/ja/zh-CN/zh-TW) | Task 18 |
| 2026-01-02 | 자평진전/궁통보감 | 한국어 고정 | 5개 언어 다국어화 (고전 원리) | Task 18 |
| 2026-01-02 | 영어 십신 용어 | 일반 용어 | PRD/The Destiny Code 스타일 | Task 18 |
| 2026-01-02 | 중국어 로케일 | zh 단일 | zh-CN/zh-TW 분리 (간체/번체) | Task 18 |

### 구현 상세

**사용 라이브러리**: `lunar-python` (6tail/lunar)
- 입춘/절입 기준 사주 계산 내장
- 음력/양력 변환 지원
- 절입 시각 데이터 내장

**구현 파일**:
```
python/
├── main.py                 # FastAPI 엔트리포인트
├── manseryeok/
│   ├── engine.py           # ManseryeokEngine 클래스
│   ├── calendar.py         # 음력/양력 변환
│   ├── pillars.py          # 사주 계산 (입춘/절입 기준)
│   ├── daewun.py           # 대운 계산
│   ├── jijanggan.py        # 지장간 추출
│   └── constants.py        # 상수 정의
├── visualization/
│   ├── visualizer.py       # SajuVisualizer 클래스
│   └── constants.py        # 오행 색상, 이미지 크기 상수
├── schemas/
│   ├── saju.py             # 만세력 Pydantic 모델
│   └── visualization.py    # 시각화 Pydantic 모델
└── tests/
    ├── test_engine.py      # 만세력 테스트
    └── test_visualization.py # 시각화 테스트
```

**Phase 2 예정**:
- 진태양시 보정 (경도 기반)
- 대운 시작 나이 정밀 계산 (절입까지 남은 일수/3)


---

## 📚 참고 자료

### 명리학 용어 사전

| 용어 | 한자 | 영문 | 설명 |
|------|------|------|------|
| 일간 | 日干 | Day Master | 사주의 중심, 나 자신 |
| 격국 | 格局 | Structure | 사주의 유형/패턴 |
| 용신 | 用神 | Useful God | 사주를 보완하는 오행 |
| 대운 | 大運 | Luck Cycle | 10년 단위 운의 흐름 |
| 세운 | 歲運 | Annual Luck | 연도별 운세 |

### 외부 링크

- [Gemini API Docs](https://ai.google.dev/docs)
- [Pinecone Docs](https://docs.pinecone.io)

---

## 🎆 신년 사주 분석 (Task 20)

### 개요

특정 연도(주로 다음 해)에 대한 월별 상세 운세 분석을 제공합니다.
세운(歲運)과 월운(月運)을 중심으로 12개월의 흐름과 길흉일을 분석합니다.

### 분석 요소

| 요소 | 설명 |
|------|------|
| 세운(歲運) | 해당 연도의 천간/지지와 사주의 상호작용 |
| 월운(月運) | 12개월 각각의 천간/지지와 사주 관계 |
| 길흉일 | 월별 3-5개 길일, 1-3개 흉일 선정 |
| 분기 분석 | 4분기 주요 테마와 점수 |
| 분야별 조언 | 재물/애정/직장/건강 연간 조언 |

### 길흉일 선정 기준

**길일(Lucky Days)**:
- 일진이 용신/희신과 합하거나 생하는 날
- 천을귀인(天乙貴人)이 있는 날
- 문창성(文昌星), 천의성(天醫星) 등 길신이 있는 날
- 해당 월의 건왕지지(建旺支地)와 조화로운 날

**흉일(Unlucky Days)**:
- 일진이 기신과 충하거나 형하는 날
- 공망(空亡)에 해당하는 날
- 백호(白虎), 도화(桃花) 등 흉살이 강한 날
- 삼살(三殺) 방향과 충돌하는 날

### 프롬프트 구조

```
python/prompts/yearly_prompt.py
├── SYSTEM_PROMPT         # 신년 분석 전문가 역할 정의
├── USER_PROMPT           # 연도별 분석 요청 템플릿
└── 다국어 지원            # ko, en, ja, zh-CN, zh-TW
```

### 출력 JSON 스키마

```json
{
  "year": 2026,
  "summary": "연간 요약",
  "yearlyTheme": "테마",
  "overallScore": 75,
  "monthlyFortunes": [
    {
      "month": 1,
      "theme": "새로운 시작",
      "score": 70,
      "overview": "...",
      "luckyDays": [...],
      "unluckyDays": [...],
      "advice": "...",
      "keywords": [...]
    }
  ],
  "quarterlyHighlights": [...],
  "keyDates": [...],
  "yearlyAdvice": {
    "wealth": {...},
    "love": {...},
    "career": {...},
    "health": {...}
  },
  "classicalReferences": [...]
}
```

### UI 컴포넌트

| 컴포넌트 | 설명 | 위치 |
|---------|------|------|
| YearSelector | 연도 선택 드롭다운 | src/components/analysis/yearly/ |
| MonthlyTimeline | 월별 운세 차트 | AreaChart + 월별 카드 |
| LuckyDaysCalendar | 길흉일 캘린더 | 월별 그리드 + 상세 표시 |
| QuarterlyOverview | 분기별 카드 | 4분기 요약 |
| YearlyAdviceCard | 분야별 조언 | 4개 분야 탭 |

### 페이지 라우트

- `/[locale]/analysis/yearly` - 연도 선택
- `/[locale]/analysis/yearly/processing` - 분석 처리 중
- `/[locale]/analysis/yearly/result/[id]` - 결과 페이지

---

## 🔧 백엔드 리팩토링 (v2.1) - 완료

### 개요

코드 품질 및 유지보수성 향상을 위한 리팩토링. **Gemini 검증 완료, 3 Phase 모두 구현 완료**.

### Phase 1: PromptBuilder 로케일 딕셔너리화 ✅

**파일**: `python/prompts/locale_strings.py` (431줄 신규)

**변경 사항**:
- `builder.py`에서 모든 언어별 문자열 추출
- 5개 언어 지원 (ko, en, ja, zh-CN, zh-TW)
- 한국어 조사 자동 처리 (`has_batchim()`, `apply_korean_particles()`)

```python
# 사용 예
from prompts.locale_strings import get_locale_string, format_pillars_table

title = get_locale_string('pillars_title', 'ko')  # "## 사주 팔자"
table = format_pillars_table(pillars, 'ja')  # 일본어 테이블
```

**결과**: `builder.py` 1,469줄 → 1,303줄 (11% 감소)

### Phase 2: AnalysisPipeline 클래스 분해 ✅

**구조**:
```
src/lib/ai/pipeline/
├── index.ts          # AnalysisPipeline 오케스트레이션 (v2.1.0)
├── step-executor.ts  # StepExecutor: 타임아웃 + 재시도
├── context.ts        # PipelineContext: 공유 상태 (AbortController)
└── types.ts          # 상수 + 인터페이스 정의
```

**핵심 클래스**:
```typescript
// PipelineContext - 단일 상태 소스
class PipelineContext {
  readonly abortController: AbortController;
  intermediateResults: PipelineIntermediateResults;
  stepStatuses: Record<PipelineStep, StepStatus>;

  start(): void;
  hydrate(results, fromStep): void;  // 재시도용 상태 복원
  abort(): void;
}

// StepExecutor - 실행 + 에러 핸들링
class StepExecutor {
  async execute<T>(step, executor, options?): Promise<T>;
  // 타임아웃, 재시도, 에러 분류 통합
}
```

**효과**: SRP 준수, 각 모듈 독립 테스트 가능

### Phase 3: Python Code-First 스키마 동기화 ✅

**파일**:
- `python/export_openapi.py` - OpenAPI JSON 내보내기
- `scripts/generate-types.sh` - 타입 생성 자동화
- `src/types/generated.d.ts` - 자동 생성 TypeScript (수정 금지)
- `src/types/index.ts` - 편의 타입 re-export

**사용법**:
```bash
npm run generate:types
```

**생성되는 타입**:
```typescript
import { Pillars, DaewunItem, Jijanggan, CalculateResponse } from '@/types';
```

**효과**: Python Pydantic이 Single Source of Truth, 타입 불일치 0%

### 리팩토링 요약

| Phase | 영역 | 상태 | 효과 |
|-------|------|------|------|
| 1 | PromptBuilder | ✅ 완료 | 11% 코드 감소, 다국어 유지보수 용이 |
| 2 | AnalysisPipeline | ✅ 완료 | SRP 준수, 모듈별 테스트 가능 |
| 3 | 스키마 동기화 | ✅ 완료 | 타입 자동 생성, 불일치 방지 |

---

**최종 수정**: 2026-01-04 (백엔드 리팩토링 v2.1 완료)
