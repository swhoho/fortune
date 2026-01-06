"""
리포트 분석 단계별 Pydantic 스키마
Gemini 응답 검증 + Default 값으로 null 방지
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# ============================================
# Step 1: Basic Analysis
# ============================================

class DayMasterSchema(BaseModel):
    """일간 특성"""
    stem: str = Field(default="")
    element: str = Field(default="")
    yinYang: str = Field(default="")
    characteristics: List[str] = Field(default_factory=list)


class StructureSchema(BaseModel):
    """격국 정보"""
    type: str = Field(default="")
    quality: str = Field(default="中")
    description: str = Field(default="")


class UsefulGodSchema(BaseModel):
    """용신/기신 정보"""
    primary: str = Field(default="")
    secondary: str = Field(default="")
    harmful: str = Field(default="")
    reasoning: str = Field(default="")


class BasicAnalysisSchema(BaseModel):
    """Step 1: 기본 분석"""
    summary: str = Field(default="")
    dayMaster: DayMasterSchema = Field(default_factory=DayMasterSchema)
    structure: StructureSchema = Field(default_factory=StructureSchema)
    usefulGod: UsefulGodSchema = Field(default_factory=UsefulGodSchema)


# ============================================
# Step 2: Personality
# ============================================

class WillpowerSchema(BaseModel):
    """의지력"""
    score: int = Field(default=50, ge=0, le=100)
    description: str = Field(default="")


class SocialStyleSchema(BaseModel):
    """대인관계 스타일"""
    type: str = Field(default="")
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)


class PersonalitySchema(BaseModel):
    """Step 2: 성격 분석"""
    outerPersonality: str = Field(default="")
    innerPersonality: str = Field(default="")
    willpower: WillpowerSchema = Field(default_factory=WillpowerSchema)
    socialStyle: SocialStyleSchema = Field(default_factory=SocialStyleSchema)


# ============================================
# Step 3: Aptitude
# ============================================

class TalentItemSchema(BaseModel):
    """재능 항목"""
    name: str = Field(default="")
    basis: Optional[str] = None
    level: int = Field(default=50, ge=0, le=100)
    description: str = Field(default="")


class RecommendedFieldSchema(BaseModel):
    """추천 분야"""
    name: str = Field(default="")
    suitability: int = Field(default=70, ge=0, le=100)
    description: str = Field(default="")


class AvoidFieldSchema(BaseModel):
    """피해야 할 분야"""
    name: str = Field(default="")
    reason: str = Field(default="")


class TalentUsageSchema(BaseModel):
    """재능 활용 상태"""
    currentLevel: int = Field(default=50, ge=0, le=100)
    potential: int = Field(default=70, ge=0, le=100)
    advice: str = Field(default="")


class StudyStyleSchema(BaseModel):
    """학습 스타일"""
    type: str = Field(default="")
    description: str = Field(default="")


class AptitudeSchema(BaseModel):
    """Step 3: 적성 분석"""
    keywords: List[str] = Field(default_factory=list)
    talents: List[TalentItemSchema] = Field(default_factory=list)
    recommendedFields: List[RecommendedFieldSchema] = Field(default_factory=list)
    avoidFields: List[AvoidFieldSchema] = Field(default_factory=list)
    talentUsage: TalentUsageSchema = Field(default_factory=TalentUsageSchema)
    studyStyle: Optional[StudyStyleSchema] = None


# ============================================
# Step 4: Fortune (Wealth + Love)
# ============================================

class WealthAnalysisSchema(BaseModel):
    """재물운 분석"""
    pattern: str = Field(default="")
    wealthScore: int = Field(default=50, ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    advice: str = Field(default="")
    # 기존 필드 (ContentCard용)
    wealthFortune: str = Field(default="")
    partnerInfluence: str = Field(default="")


class LoveAnalysisSchema(BaseModel):
    """연애운 분석"""
    style: str = Field(default="")
    loveScore: int = Field(default=50, ge=0, le=100)
    idealPartner: List[str] = Field(default_factory=list)
    compatibilityPoints: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    loveAdvice: str = Field(default="")
    # 기존 필드 (ContentCard용)
    datingPsychology: str = Field(default="")
    spouseView: str = Field(default="")
    personalityPattern: str = Field(default="")


class FortuneSchema(BaseModel):
    """Step 4: 재물/연애 분석"""
    wealth: WealthAnalysisSchema = Field(default_factory=WealthAnalysisSchema)
    love: LoveAnalysisSchema = Field(default_factory=LoveAnalysisSchema)


# ============================================
# 단계별 스키마 매핑
# ============================================

STEP_SCHEMAS = {
    "basic": BasicAnalysisSchema,
    "basic_analysis": BasicAnalysisSchema,
    "personality": PersonalitySchema,
    "aptitude": AptitudeSchema,
    "fortune": FortuneSchema,
}


def validate_step_response(step_name: str, response: dict, raise_on_error: bool = False) -> dict:
    """
    단계별 응답 검증 + Default 값 적용

    Args:
        step_name: 단계명 (basic, personality, aptitude, fortune)
        response: Gemini 응답 (정규화된 dict)
        raise_on_error: True면 검증 실패 시 예외 발생 (재시도 로직용)

    Returns:
        검증된 dict (누락 필드는 default 값으로 채움)
    """
    schema_class = STEP_SCHEMAS.get(step_name)
    if not schema_class:
        return response

    try:
        validated = schema_class.model_validate(response)
        return validated.model_dump()
    except Exception:
        if raise_on_error:
            raise  # 재시도 로직이 이 예외를 잡아서 재시도함
        # 검증 실패 시 기본값으로 채우기
        return schema_class().model_dump()
