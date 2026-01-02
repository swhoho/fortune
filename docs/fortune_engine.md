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
├── types.ts      # AI 분석 결과 타입 정의
├── gemini.ts     # Gemini 클라이언트 초기화
├── prompts.ts    # 시스템 프롬프트 및 JSON 스키마
├── analyzer.ts   # SajuAnalyzer 클래스 (메인 로직)
└── index.ts      # 모듈 export

src/app/api/analysis/gemini/
└── route.ts      # POST /api/analysis/gemini 엔드포인트
```

### 시스템 프롬프트 구조

```
[역할 정의]
당신은 30년 경력의 명리학 전문가입니다. 자평진전, 궁통보감 등 
고전을 깊이 연구했으며, 현대적이고 논리적인 해석을 제공합니다.

[분석 원칙]
1. 일간(日干)을 중심으로 분석
2. 격국(格局)을 먼저 판단
3. 용신(用神)과 희신(喜神) 도출
4. 대운과 세운의 흐름 분석
5. 구체적이고 실용적인 조언 제공

[출력 형식]
반드시 아래 JSON 스키마를 따라 응답하세요:
{출력 스키마}

[RAG 컨텍스트]
{검색된 고전 문헌 인용}

[사주 정보]
{계산된 사주 팔자, 대운, 지장간}

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

### 프롬프트 버전 관리

| 버전 | 날짜 | 변경 내용 | 성능 |
|------|------|----------|------|
| v1.0 | 2026-01-02 | 초기 버전 | - |
| v1.1 | - | - | - |

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

---

## 6️⃣ 품질 개선 로그

### 개선 이력

| 날짜 | 영역 | 이전 | 이후 | 결과 |
|------|------|------|------|------|
| 2026-01-02 | 문서 생성 | - | 초기 버전 | - |
| 2026-01-02 | 만세력 엔진 | 미구현 | Python FastAPI 구현 완료 | 12개 테스트 통과 |
| 2026-01-02 | Gemini API | 미구현 | gemini-3-pro-preview 통합 완료 | Task 6 완료 |
| 2026-01-02 | 명반 시각화 | 미구현 | SajuVisualizer 구현 완료 | 11개 테스트 통과 |

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

**최종 수정**: 2026-01-02 (Task 7: 명반 시각화 구현 완료)
