# 궁합 분석 시스템

> 연인 궁합 분석 - Python 점수 엔진 + Gemini AI 해석

## 개요

두 사람의 사주를 비교하여 궁합을 분석하는 시스템.
- **Python 엔진**: 모든 점수 계산 (100% 규칙 기반)
- **Gemini AI**: 점수 기반 해석 생성 (점수 계산 X)

## 크레딧

| 서비스 | 비용 |
|--------|------|
| 연인 궁합 | 70C |
| 섹션 재분석 | 0C (무료) |

---

## 점수 체계 (Python 엔진)

### 5개 항목 점수 (가중치 합 100%)

| 항목 | 가중치 | 계산 로직 | 파일 위치 |
|------|--------|-----------|-----------|
| 천간 조화 | 25% | 5합 성립률 (갑기합토, 을경합금...) | `compatibility_engine.py:calculate_stem_harmony()` |
| 지지 조화 | 25% | 6합 - 충×1.4 - 형×1.5 - 파/해 | `compatibility_engine.py:calculate_branch_harmony()` |
| 오행 균형 | 20% | 보완 오행 +12, 과다 오행 -8 | `compatibility_engine.py:calculate_element_balance()` |
| 십신 호환 | 20% | `TEN_GOD_COMPATIBILITY` 매트릭스 | `compatibility_engine.py:calculate_ten_god_compatibility()` |
| 12운성 시너지 | 10% | `WUNSEONG_SYNERGY` 매트릭스 (상대 일지 기준) | `compatibility_engine.py:calculate_wunseong_synergy()` |

### 연애 스타일 5항목

| 항목 | 영문 키 | 십신 매핑 |
|------|---------|-----------|
| 표현력 | expression | 식신×1.5, 상관×1.3 |
| 독점욕 | possessiveness | 편관×1.5, 겁재×1.3 |
| 헌신도 | devotion | 정인×1.5, 정재×1.3 |
| 모험심 | adventure | 편재×1.5, 상관×1.3 |
| 안정추구 | stability | 정관×1.5, 정인×1.3 |

---

## 파이프라인 (10단계)

| 단계 | 이름 | 엔진 | 진행률 |
|-----|------|------|--------|
| 1 | `manseryeok_a` | Python | 5% |
| 2 | `manseryeok_b` | Python | 10% |
| 3 | `compatibility_score` | Python | 25% |
| 4 | `trait_scores` | Python | 35% |
| 5 | `relationship_type` | Gemini | 50% |
| 6 | `trait_interpretation` | Gemini | 60% |
| 7 | `conflict_analysis` | Gemini | 70% |
| 8 | `marriage_fit` | Gemini | 80% |
| 9 | `mutual_influence` | Gemini | 90% |
| 10 | `saving` | - | 100% |

**중요**: Gemini 단계 실패 시 `failed_steps`에 기록, 나머지 계속 진행

---

## DB 스키마

테이블: `compatibility_analyses`

```sql
-- 주요 컬럼
id UUID PRIMARY KEY,
user_id TEXT NOT NULL,
profile_id_a UUID, profile_id_b UUID,
analysis_type VARCHAR DEFAULT 'romance',
status VARCHAR DEFAULT 'pending',  -- pending/processing/completed/failed
job_id TEXT,
progress_percent INTEGER DEFAULT 0,

-- Python 결과
pillars_a JSONB, pillars_b JSONB,
total_score INTEGER,
scores JSONB,  -- 5개 항목 점수
trait_scores_a JSONB, trait_scores_b JSONB,
interactions JSONB,

-- Gemini 결과
relationship_type JSONB,
trait_interpretation JSONB,
conflict_analysis JSONB,
marriage_fit JSONB,
mutual_influence JSONB,
failed_steps TEXT[] DEFAULT '{}'
```

---

## 파일 구조

```
python/
├── manseryeok/
│   └── compatibility_engine.py    # 점수 계산 엔진
├── services/
│   └── compatibility_service.py   # 파이프라인 서비스
└── schemas/
    └── compatibility.py           # Pydantic 스키마

src/
├── app/[locale]/compatibility/
│   ├── page.tsx                   # 유형 선택
│   └── romance/
│       ├── new/page.tsx           # 프로필 선택
│       └── [id]/
│           ├── page.tsx           # 결과 (3탭)
│           └── generating/page.tsx # 생성 중
└── app/api/analysis/compatibility/
    ├── route.ts                   # POST: 분석 시작
    └── [id]/route.ts              # GET: 결과 조회
```

---

## Gemini 스키마 주의사항

> **절대 금지**: response_schema에 default 값 넣지 말 것 (Gemini가 그대로 복사)

```python
# BAD - default 값 있음
{"score": {"type": "integer", "default": 50}}

# GOOD - description만
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

**Version**: 1.0.0
**Created**: 2026-01-09
