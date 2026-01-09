"""
궁합 분석 API 스키마
Python 점수 엔진 결과 + Gemini 분석 결과

주의사항:
- Gemini response_schema에 default 값 금지 (AI가 그대로 복사함)
- 모든 점수는 Python 엔진에서 계산
- Gemini는 해석만 담당
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List, Any
from enum import Enum


# ============================================
# Enums
# ============================================

class CompatibilityJobStatus(str, Enum):
    """궁합 분석 작업 상태"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CompatibilityPipelineStep(str, Enum):
    """궁합 분석 파이프라인 단계 (10단계)"""
    MANSERYEOK_A = "manseryeok_a"              # 1: A 만세력 계산
    MANSERYEOK_B = "manseryeok_b"              # 2: B 만세력 계산
    COMPATIBILITY_SCORE = "compatibility_score"  # 3: 5개 항목 점수 계산
    TRAIT_SCORES = "trait_scores"              # 4: 연애 스타일 점수
    RELATIONSHIP_TYPE = "relationship_type"     # 5: 인연의 성격 (Gemini)
    TRAIT_INTERPRETATION = "trait_interpretation"  # 6: 연애 스타일 해석 (Gemini)
    CONFLICT_ANALYSIS = "conflict_analysis"     # 7: 갈등 포인트 (Gemini)
    MARRIAGE_FIT = "marriage_fit"              # 8: 결혼 적합도 (Gemini)
    MUTUAL_INFLUENCE = "mutual_influence"       # 9: 상호 영향 (Gemini)
    SAVING = "saving"                          # 10: DB 저장
    COMPLETE = "complete"                      # 완료


# ============================================
# Request/Response Models
# ============================================

class CompatibilityAnalysisRequest(BaseModel):
    """궁합 분석 요청"""
    profile_id_a: str = Field(..., description="첫 번째 참여자 프로필 ID")
    profile_id_b: str = Field(..., description="두 번째 참여자 프로필 ID")
    analysis_type: Literal['romance', 'friend'] = Field(
        'romance', description="분석 유형 (romance/friend)"
    )
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field(
        'ko', description="언어"
    )
    user_id: str = Field(..., description="사용자 ID")
    analysis_id: Optional[str] = Field(None, description="DB 분석 레코드 ID (중간 저장용)")


class CompatibilityAnalysisStartResponse(BaseModel):
    """궁합 분석 시작 응답"""
    job_id: str = Field(..., description="작업 ID")
    analysis_id: Optional[str] = Field(None, description="DB 분석 레코드 ID")
    status: CompatibilityJobStatus = Field(..., description="작업 상태")
    message: str = Field(..., description="메시지")


# ============================================
# Python 점수 엔진 결과 스키마
# ============================================

class StemCombination(BaseModel):
    """천간 합 정보"""
    stems: List[str] = Field(..., description="합을 이루는 천간 쌍 (예: ['甲', '己'])")
    result: str = Field(..., description="합화 결과 오행 (예: '土')")
    name: str = Field(..., description="합 이름 (예: '갑기합토')")
    probability: float = Field(..., ge=0, le=1, description="합화 성립률 (0-1)")
    positions: List[str] = Field(..., description="위치 (예: ['A.year.stem', 'B.day.stem'])")


class StemHarmonyScore(BaseModel):
    """천간 조화 점수 (25% 가중치)"""
    score: int = Field(..., ge=0, le=100, description="천간 조화 점수")
    combinations: List[StemCombination] = Field(..., description="성립된 천간 합 목록")
    clashes: List[Dict[str, Any]] = Field(..., description="천간 충돌 목록")


class BranchInteraction(BaseModel):
    """지지 상호작용 정보"""
    branches: List[str] = Field(..., description="관련 지지 (예: ['寅', '亥'])")
    type: str = Field(..., description="상호작용 유형 (합/충/형/파/해)")
    result: Optional[str] = Field(None, description="결과 오행 (합의 경우)")
    name: str = Field(..., description="상호작용 이름 (예: '인해합목')")
    severity: Optional[str] = Field(None, description="심각도 (high/medium/low)")
    positions: List[str] = Field(..., description="위치")


class BranchHarmonyScore(BaseModel):
    """지지 조화 점수 (25% 가중치)"""
    score: int = Field(..., ge=0, le=100, description="지지 조화 점수")
    combinations: List[BranchInteraction] = Field(..., description="지지 합 목록")
    clashes: List[BranchInteraction] = Field(..., description="지지 충 목록")
    punishments: List[BranchInteraction] = Field(..., description="지지 형 목록")
    harms: List[BranchInteraction] = Field(..., description="지지 파/해 목록")


class ElementBalance(BaseModel):
    """오행 균형 정보"""
    element: str = Field(..., description="오행 (木火土金水)")
    a_strength: float = Field(..., description="A의 해당 오행 강도")
    b_strength: float = Field(..., description="B의 해당 오행 강도")


class ElementBalanceScore(BaseModel):
    """오행 균형 점수 (20% 가중치)"""
    score: int = Field(..., ge=0, le=100, description="오행 균형 점수")
    a_elements: Dict[str, float] = Field(..., description="A의 오행별 강도")
    b_elements: Dict[str, float] = Field(..., description="B의 오행별 강도")
    complementary: List[str] = Field(..., description="보완 오행 (A에게 부족, B가 보충)")
    excessive: List[str] = Field(..., description="둘 다 과다한 오행")
    balance_details: List[ElementBalance] = Field(..., description="오행별 상세")


class TenGodRelation(BaseModel):
    """십신 관계"""
    tenGod: str = Field(..., description="십신 (정재/편재/정관/편관/...)")
    meaning: str = Field(..., description="의미 설명")


class TenGodCompatibilityScore(BaseModel):
    """십신 호환성 점수 (20% 가중치)"""
    score: int = Field(..., ge=0, le=100, description="십신 호환성 점수")
    a_to_b: TenGodRelation = Field(..., description="A가 B에게 어떤 존재인지")
    b_to_a: TenGodRelation = Field(..., description="B가 A에게 어떤 존재인지")
    relationship_type: str = Field(..., description="관계 유형 요약")


class WunsengSynergyScore(BaseModel):
    """12운성 에너지 점수 (10% 가중치)"""
    score: int = Field(..., ge=0, le=100, description="12운성 시너지 점수")
    a_wunseong: str = Field(..., description="A의 12운성")
    b_wunseong: str = Field(..., description="B의 12운성")
    synergy_type: str = Field(..., description="시너지 유형 설명")


class CompatibilityScores(BaseModel):
    """5개 항목 종합 점수 (Python 엔진)"""
    totalScore: int = Field(..., ge=0, le=100, description="총 궁합 점수")
    stemHarmony: StemHarmonyScore = Field(..., description="천간 조화 (25%)")
    branchHarmony: BranchHarmonyScore = Field(..., description="지지 조화 (25%)")
    elementBalance: ElementBalanceScore = Field(..., description="오행 균형 (20%)")
    tenGodCompatibility: TenGodCompatibilityScore = Field(..., description="십신 호환 (20%)")
    wunsengSynergy: WunsengSynergyScore = Field(..., description="12운성 시너지 (10%)")


class TraitScores(BaseModel):
    """연애 스타일 5항목 점수 (Python 엔진, 십신 기반)"""
    expression: int = Field(..., ge=0, le=100, description="표현력 (식신/상관 강도)")
    possessiveness: int = Field(..., ge=0, le=100, description="독점욕 (편관/겁재 강도)")
    devotion: int = Field(..., ge=0, le=100, description="헌신도 (정인/정재 강도)")
    adventure: int = Field(..., ge=0, le=100, description="모험심 (편재/상관 강도)")
    stability: int = Field(..., ge=0, le=100, description="안정추구 (정관/정인 강도)")


# ============================================
# Gemini 분석 결과 스키마 (Pydantic 검증용)
# 주의: 이 스키마는 Gemini 응답 검증용
# Gemini response_schema는 gemini_schemas.py에 별도 정의
# ============================================

class RelationshipTypeResult(BaseModel):
    """인연의 성격 분석 결과 (Gemini)"""
    keywords: List[str] = Field(..., description="관계 유형 키워드 3-4개")
    firstImpression: str = Field(..., description="첫인상과 끌림의 이유")
    developmentPattern: str = Field(..., description="관계 발전 패턴 (200-300자)")


class TraitInterpretationItem(BaseModel):
    """연애 스타일 항목별 해석"""
    trait: str = Field(..., description="항목명 (expression/possessiveness/...)")
    a_interpretation: str = Field(..., description="A의 해석 (50-100자)")
    b_interpretation: str = Field(..., description="B의 해석 (50-100자)")
    comparison: str = Field(..., description="두 사람 비교 분석")


class TraitInterpretationResult(BaseModel):
    """연애 스타일 해석 결과 (Gemini)"""
    items: List[TraitInterpretationItem] = Field(..., description="5개 항목별 해석")
    overall: str = Field(..., description="연애 스타일 종합 평가")


class ConflictPoint(BaseModel):
    """갈등 포인트"""
    source: str = Field(..., description="갈등 원인 (충/형/파/해 기반)")
    description: str = Field(..., description="갈등 설명")
    resolution: str = Field(..., description="해결 조언")


class ConflictAnalysisResult(BaseModel):
    """갈등 포인트 분석 결과 (Gemini)"""
    conflictPoints: List[ConflictPoint] = Field(..., description="갈등 포인트 목록")
    avoidBehaviors: List[str] = Field(..., description="피해야 할 행동 패턴")
    communicationTips: str = Field(..., description="소통 팁")


class MarriageFitResult(BaseModel):
    """결혼 적합도 분석 결과 (Gemini)"""
    score: int = Field(..., ge=0, le=100, description="결혼 적합도 점수")
    postMarriageChange: str = Field(..., description="결혼 후 예상 관계 변화")
    roleDistribution: str = Field(..., description="가정 내 역할 분담 예측")
    childFortune: str = Field(..., description="자녀운 시너지")
    wealthSynergy: str = Field(..., description="재물운 시너지")


class MutualInfluenceDirection(BaseModel):
    """한 방향 영향"""
    tenGod: str = Field(..., description="십신")
    meaning: str = Field(..., description="의미")
    positiveInfluence: str = Field(..., description="긍정적 영향")
    caution: str = Field(..., description="주의할 점")


class MutualInfluenceResult(BaseModel):
    """상호 영향 분석 결과 (Gemini)"""
    aToB: MutualInfluenceDirection = Field(..., description="A가 B에게 주는 영향")
    bToA: MutualInfluenceDirection = Field(..., description="B가 A에게 주는 영향")
    synergy: str = Field(..., description="시너지 요약")


# ============================================
# 상태 응답 스키마
# ============================================

class CompatibilityAnalysisStatusResponse(BaseModel):
    """궁합 분석 상태 응답"""
    job_id: str = Field(..., description="작업 ID")
    analysis_id: Optional[str] = Field(None, description="분석 레코드 ID")
    status: CompatibilityJobStatus = Field(..., description="작업 상태")
    progress_percent: int = Field(0, ge=0, le=100, description="진행률")
    current_step: Optional[str] = Field(None, description="현재 단계")
    step_statuses: Optional[Dict[str, str]] = Field(
        None, description="단계별 상태"
    )
    failed_steps: Optional[List[str]] = Field(None, description="실패한 단계 목록")
    error: Optional[str] = Field(None, description="에러 메시지")
    created_at: Optional[str] = Field(None, description="생성 시각")
    updated_at: Optional[str] = Field(None, description="업데이트 시각")


class CompatibilityAnalysisResult(BaseModel):
    """궁합 분석 최종 결과"""
    analysis_id: str = Field(..., description="분석 ID")
    profile_id_a: str = Field(..., description="A 프로필 ID")
    profile_id_b: str = Field(..., description="B 프로필 ID")
    analysis_type: str = Field(..., description="분석 유형")

    # 만세력 데이터
    pillars_a: Dict[str, Any] = Field(..., description="A 사주 팔자")
    pillars_b: Dict[str, Any] = Field(..., description="B 사주 팔자")
    daewun_a: Optional[List[Dict[str, Any]]] = Field(None, description="A 대운")
    daewun_b: Optional[List[Dict[str, Any]]] = Field(None, description="B 대운")

    # Python 점수 결과
    total_score: int = Field(..., description="총 궁합 점수")
    scores: CompatibilityScores = Field(..., description="5개 항목 점수")
    trait_scores_a: TraitScores = Field(..., description="A 연애 스타일")
    trait_scores_b: TraitScores = Field(..., description="B 연애 스타일")
    interactions: Dict[str, Any] = Field(..., description="간지 상호작용 상세")

    # Gemini 분석 결과
    relationship_type: Optional[RelationshipTypeResult] = Field(None, description="인연의 성격")
    trait_interpretation: Optional[TraitInterpretationResult] = Field(None, description="연애 스타일 해석")
    conflict_analysis: Optional[ConflictAnalysisResult] = Field(None, description="갈등 포인트")
    marriage_fit: Optional[MarriageFitResult] = Field(None, description="결혼 적합도")
    mutual_influence: Optional[MutualInfluenceResult] = Field(None, description="상호 영향")

    # 메타
    language: str = Field(..., description="언어")
    credits_used: int = Field(..., description="사용된 크레딧")
    created_at: str = Field(..., description="생성 시각")


# ============================================
# 단계별 스키마 매핑 (검증용)
# ============================================

COMPATIBILITY_STEP_SCHEMAS = {
    "relationship_type": RelationshipTypeResult,
    "trait_interpretation": TraitInterpretationResult,
    "conflict_analysis": ConflictAnalysisResult,
    "marriage_fit": MarriageFitResult,
    "mutual_influence": MutualInfluenceResult,
}


def validate_compatibility_step(step_name: str, response: dict, raise_on_error: bool = False) -> dict:
    """
    궁합 분석 단계별 응답 검증

    Args:
        step_name: 단계명
        response: Gemini 응답
        raise_on_error: True면 검증 실패 시 예외 발생

    Returns:
        검증된 dict
    """
    schema_class = COMPATIBILITY_STEP_SCHEMAS.get(step_name)
    if not schema_class:
        return response

    try:
        validated = schema_class.model_validate(response)
        return validated.model_dump()
    except Exception:
        if raise_on_error:
            raise
        return response
