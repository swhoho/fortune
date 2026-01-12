"""
오늘의 운세 Pydantic 스키마
Gemini 응답 검증 + Default 값으로 null 방지
"""
from pydantic import BaseModel, Field
from typing import Optional


# ============================================
# 영역별 운세 스키마
# ============================================

class AreaFortuneSchema(BaseModel):
    """영역별 운세 (career, wealth, love, health, relationship)"""
    score: int = Field(default=50, ge=0, le=100)
    title: str = Field(default="")
    description: str = Field(default="")  # 100-200자 권장
    tip: str = Field(default="")  # 50자 이내 권장


# ============================================
# 오늘의 운세 전체 스키마
# ============================================

class DailyFortuneResponseSchema(BaseModel):
    """오늘의 운세 Gemini 응답 스키마"""
    overallScore: int = Field(default=50, ge=0, le=100)
    summary: str = Field(default="")  # 200-400자 권장
    careerFortune: AreaFortuneSchema = Field(default_factory=AreaFortuneSchema)
    wealthFortune: AreaFortuneSchema = Field(default_factory=AreaFortuneSchema)
    loveFortune: AreaFortuneSchema = Field(default_factory=AreaFortuneSchema)
    healthFortune: AreaFortuneSchema = Field(default_factory=AreaFortuneSchema)
    relationshipFortune: AreaFortuneSchema = Field(default_factory=AreaFortuneSchema)
    advice: str = Field(default="")  # 100-150자 권장
    # 선택적 필드
    luckyColor: Optional[str] = None
    luckyNumber: Optional[int] = None
    luckyDirection: Optional[str] = None


# ============================================
# 검증 함수
# ============================================

def validate_daily_fortune(response: dict, raise_on_error: bool = False) -> dict:
    """
    오늘의 운세 응답 검증 + Default 값 적용

    Args:
        response: Gemini 응답 (정규화된 dict)
        raise_on_error: True면 검증 실패 시 예외 발생 (재시도 로직용)

    Returns:
        검증된 dict (누락 필드는 default 값으로 채움)
    """
    try:
        validated = DailyFortuneResponseSchema.model_validate(response)
        return validated.model_dump()
    except Exception as e:
        if raise_on_error:
            raise  # 재시도 로직이 이 예외를 잡아서 재시도함
        # 검증 실패 시 기본값으로 채우기
        return DailyFortuneResponseSchema().model_dump()
