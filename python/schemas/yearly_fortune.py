"""
신년 분석 Gemini 응답 검증용 Pydantic 스키마
Gemini 응답 검증 + Default 값으로 null 방지
"""
from pydantic import BaseModel, Field
from typing import List, Optional


# ============================================
# Yearly Overview (Step 1)
# ============================================

class YearlyOverviewSchema(BaseModel):
    """연간 총평 스키마"""
    year: int = Field(default=2026)
    summary: str = Field(default="")
    yearlyTheme: str = Field(default="")
    overallScore: int = Field(default=50, ge=0, le=100)


# ============================================
# Monthly Fortune (Step 2-5)
# ============================================

class MonthlyFortuneItemSchema(BaseModel):
    """월별 운세 항목"""
    month: int = Field(default=1, ge=1, le=12)
    summary: str = Field(default="")
    overallScore: int = Field(default=50, ge=0, le=100)
    luckyDays: List[int] = Field(default_factory=list)
    luckyNights: List[int] = Field(default_factory=list)
    advice: str = Field(default="")


class MonthlyFortunesSchema(BaseModel):
    """월별 운세 묶음 (3개월씩)"""
    monthlyFortunes: List[MonthlyFortuneItemSchema] = Field(default_factory=list)


# ============================================
# Yearly Advice (Step 6)
# ============================================

class HalfPeriodSchema(BaseModel):
    """상반기/하반기 콘텐츠"""
    firstHalf: str = Field(default="")
    secondHalf: str = Field(default="")


class YearlyAdviceContentSchema(BaseModel):
    """6개 섹션 조언"""
    natureAndSoul: HalfPeriodSchema = Field(default_factory=HalfPeriodSchema)
    wealthAndSuccess: HalfPeriodSchema = Field(default_factory=HalfPeriodSchema)
    careerAndHonor: HalfPeriodSchema = Field(default_factory=HalfPeriodSchema)
    documentAndWisdom: HalfPeriodSchema = Field(default_factory=HalfPeriodSchema)
    relationshipAndLove: HalfPeriodSchema = Field(default_factory=HalfPeriodSchema)
    healthAndMovement: HalfPeriodSchema = Field(default_factory=HalfPeriodSchema)


class YearlyAdviceSchema(BaseModel):
    """yearly_advice 단계 응답"""
    yearlyAdvice: YearlyAdviceContentSchema = Field(default_factory=YearlyAdviceContentSchema)


# ============================================
# Classical References (Step 7)
# ============================================

class ClassicalRefItemSchema(BaseModel):
    """고전 인용 항목"""
    source: str = Field(default="")
    quote: str = Field(default="")
    interpretation: str = Field(default="")


class ClassicalRefsSchema(BaseModel):
    """고전 인용 응답"""
    classicalReferences: List[ClassicalRefItemSchema] = Field(default_factory=list)


# ============================================
# 검증 함수
# ============================================

def validate_yearly_overview(response: dict, raise_on_error: bool = False) -> dict:
    """연간 총평 검증"""
    try:
        validated = YearlyOverviewSchema.model_validate(response)
        return validated.model_dump()
    except Exception:
        if raise_on_error:
            raise
        return YearlyOverviewSchema().model_dump()


def validate_monthly_fortunes(response: dict, raise_on_error: bool = False) -> dict:
    """월별 운세 검증"""
    try:
        validated = MonthlyFortunesSchema.model_validate(response)
        return validated.model_dump()
    except Exception:
        if raise_on_error:
            raise
        return MonthlyFortunesSchema().model_dump()


def validate_yearly_advice(response: dict, raise_on_error: bool = False) -> dict:
    """6개 섹션 조언 검증"""
    try:
        validated = YearlyAdviceSchema.model_validate(response)
        return validated.model_dump()
    except Exception:
        if raise_on_error:
            raise
        return YearlyAdviceSchema().model_dump()


def validate_classical_refs(response: dict, raise_on_error: bool = False) -> dict:
    """고전 인용 검증"""
    try:
        validated = ClassicalRefsSchema.model_validate(response)
        return validated.model_dump()
    except Exception:
        if raise_on_error:
            raise
        return ClassicalRefsSchema().model_dump()


# ============================================
# 단계별 검증 라우터
# ============================================

YEARLY_STEP_VALIDATORS = {
    "yearly_overview": validate_yearly_overview,
    "monthly_1_3": validate_monthly_fortunes,
    "monthly_4_6": validate_monthly_fortunes,
    "monthly_7_9": validate_monthly_fortunes,
    "monthly_10_12": validate_monthly_fortunes,
    "yearly_advice": validate_yearly_advice,
    "classical_refs": validate_classical_refs,
}


def validate_yearly_step(step_name: str, response: dict, raise_on_error: bool = False) -> dict:
    """
    단계별 응답 검증 라우터

    Args:
        step_name: 단계명 (yearly_overview, monthly_1_3, ..., classical_refs)
        response: Gemini 응답 (정규화된 dict)
        raise_on_error: True면 검증 실패 시 예외 발생 (재시도 로직용)

    Returns:
        검증된 dict
    """
    validator = YEARLY_STEP_VALIDATORS.get(step_name)
    if validator:
        return validator(response, raise_on_error)
    return response
