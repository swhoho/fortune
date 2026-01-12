# 분석 파이프라인 공통 패턴

> 모든 Gemini 기반 분석에 적용되는 표준 패턴

---

## 2단계 정규화 + 검증 파이프라인

모든 Gemini 응답은 DB 저장 전 **정규화 → 검증** 단계를 거칩니다.

```python
from services.normalizers import normalize_all_keys, normalize_response
from schemas.{step}_fortune import validate_{step}

# Step 1: 정규화 (snake_case/한글 → camelCase)
normalized = normalize_all_keys(normalize_response(step_name, result))

# Step 2: Pydantic 검증 (실패 시 재시도)
validated = validate_{step}(normalized, raise_on_error=True)
```

---

## 적용 대상

| 분석 유형 | 파일 | 스키마 | 상태 |
|----------|------|--------|------|
| 전체 사주 분석 | `report_analysis.py` | `report_steps.py` | ✅ |
| 신년 분석 | `yearly_analysis.py` | `yearly_fortune.py` | ✅ |
| 오늘의 운세 | `daily_fortune_service.py` | `daily_fortune.py` | ✅ |
| 궁합 분석 | `compatibility_service.py` | - | ⚠️ (예정) |

---

## 정규화 규칙

### 1. 키 변환 우선순위

```python
# normalizers.py
def normalize_all_keys(obj):
    # 1. 한글 키 → 영문 camelCase (KOREAN_KEY_MAPPING)
    # 2. snake_case → camelCase
```

### 2. 단계별 정규화 함수

| 함수 | 단계 | 특수 처리 |
|------|------|----------|
| `normalize_basic()` | basic_analysis | dayMaster, structure, usefulGod 내부 정규화 |
| `normalize_personality()` | personality | 딕셔너리 → 문자열 추출 |
| `normalize_aptitude()` | aptitude | talentUsage 내부 정규화 |
| `normalize_fortune()` | fortune | wealth, love 분리 |
| `normalize_yearly_advice()` | yearly_advice | 6섹션 + firstHalf/secondHalf 기본값 |
| `normalize_monthly_fortunes()` | monthly_* | 배열 내부 정규화 |
| `normalize_daily_fortune()` | daily_fortune | 5개 영역 내부 정규화 |

---

## Pydantic 검증 규칙

### 1. 검증 함수 시그니처

```python
def validate_{step}(response: dict, raise_on_error: bool = False) -> dict:
    """
    Args:
        response: 정규화된 Gemini 응답
        raise_on_error: True면 검증 실패 시 예외 발생 (재시도 로직용)

    Returns:
        검증된 dict (선택적 필드는 기본값으로 채움)
    """
```

### 2. 필수 vs 선택 필드

| 필드 유형 | 검증 실패 시 동작 |
|----------|------------------|
| **필수** (summary, overallScore 등) | `raise_on_error=True` → 예외 발생 → **재시도** |
| **선택** (luckyDays, tips 등) | 누락 시 기본값 (`[]`, `""`, `50` 등)으로 채움 |

### 3. 기본값 정의

```python
# Pydantic 스키마에서 정의
class AreaFortuneSchema(BaseModel):
    score: int = Field(default=50, ge=0, le=100)  # 기본값 50
    title: str = Field(default="")                # 기본값 빈 문자열
    luckyDays: List[int] = Field(default_factory=list)  # 기본값 빈 배열
```

---

## 재시도 전략

### 표준 3회 재시도 + 에러 피드백

```python
max_retries = 3
last_error = None

for attempt in range(1, max_retries + 1):
    try:
        # Gemini 호출
        result = await gemini.generate_with_schema(
            prompt,
            response_schema=schema,
            previous_error=last_error if attempt > 1 else None
        )

        # 정규화 + 검증
        normalized = normalize_all_keys(normalize_response(step, result))
        validated = validate_step(step, normalized, raise_on_error=True)

        return validated

    except Exception as e:
        last_error = str(e)
        logger.warning(f"실패 ({attempt}/{max_retries}): {e}")

# 3회 실패 시 처리
raise Exception(f"최종 실패: {last_error}")
```

### 에러 피드백 프롬프트

```python
# gemini.py - generate_with_schema()
if previous_error:
    prompt = f"""
[이전 시도 실패 - 반드시 수정 필요]
오류: {previous_error}
위 오류를 수정하여 올바른 JSON으로 응답하세요.

{original_prompt}
"""
```

---

## 스키마 파일 구조

```
python/schemas/
├── report_steps.py      # 전체 사주 분석 스키마
├── yearly_fortune.py    # 신년 분석 스키마
├── daily_fortune.py     # 오늘의 운세 스키마
└── gemini_schemas.py    # Gemini response_schema (JSON 강제)
```

---

## 새 분석 추가 시 체크리스트

1. [ ] `python/schemas/{name}.py` - Pydantic 스키마 생성
2. [ ] `python/services/normalizers.py` - 정규화 함수 추가
3. [ ] `normalize_response()` 라우터에 등록
4. [ ] 서비스 파일에서 정규화 + 검증 적용
5. [ ] `docs/{name}.md` - 문서화

---

**최종 수정**: 2026-01-12
