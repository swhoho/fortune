"""
신년 사주 분석 API 스키마
비동기 작업 처리용 Pydantic 모델
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    """작업 상태"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class YearlyPipelineStep(str, Enum):
    """신년 분석 파이프라인 단계 (7단계 순차 실행)"""
    YEARLY_OVERVIEW = "yearly_overview"      # Step 1: 기본 정보
    MONTHLY_1_3 = "monthly_1_3"              # Step 2: 1-3월
    MONTHLY_4_6 = "monthly_4_6"              # Step 3: 4-6월
    MONTHLY_7_9 = "monthly_7_9"              # Step 4: 7-9월
    MONTHLY_10_12 = "monthly_10_12"          # Step 5: 10-12월
    YEARLY_ADVICE = "yearly_advice"          # Step 6: 6섹션 조언
    CLASSICAL_REFS = "classical_refs"        # Step 7: 고전 인용
    COMPLETE = "complete"                    # 완료


class YearlyAnalysisRequest(BaseModel):
    """신년 분석 요청"""
    target_year: int = Field(..., ge=2000, le=2100, description="분석 대상 연도")
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field('ko', description="언어")
    pillars: Dict[str, Any] = Field(..., description="사주 팔자")
    daewun: Optional[List[Dict[str, Any]]] = Field(default=[], description="대운 목록")
    birth_year: int = Field(..., description="생년 (점수 계산용)")
    gender: Literal['male', 'female'] = Field(..., description="성별")
    user_id: str = Field(..., description="사용자 ID")
    profile_id: Optional[str] = Field(None, description="프로필 ID")
    analysis_id: Optional[str] = Field(None, description="DB 분석 레코드 ID (중간 저장용)")


class YearlyAnalysisStartResponse(BaseModel):
    """신년 분석 시작 응답"""
    job_id: str = Field(..., description="작업 ID")
    status: JobStatus = Field(..., description="작업 상태")
    message: str = Field(..., description="메시지")


class MonthlyFortune(BaseModel):
    """월별 운세"""
    month: int = Field(..., ge=1, le=12, description="월")
    overall_score: int = Field(..., ge=0, le=100, description="종합 점수")
    summary: str = Field(..., description="요약")
    lucky_days: List[str] = Field(..., description="길일 (YYYY-MM-DD)")
    unlucky_days: List[str] = Field(..., description="흉일 (YYYY-MM-DD)")
    advice: str = Field(..., description="조언")


class QuarterlyHighlight(BaseModel):
    """분기별 하이라이트"""
    quarter: int = Field(..., ge=1, le=4, description="분기")
    theme: str = Field(..., description="테마")
    description: str = Field(..., description="설명")
    score: int = Field(..., ge=0, le=100, description="점수")


class SectionContent(BaseModel):
    """섹션 콘텐츠 (상반기/하반기 구분)"""
    first_half: str = Field(..., description="상반기(1~6월) 분석 (400~700자 서사체)")
    second_half: str = Field(..., description="하반기(7~12월) 분석 (400~700자 서사체)")


class YearlyAdvice(BaseModel):
    """6개 섹션 연간 조언 (v2.0)"""
    nature_and_soul: SectionContent = Field(
        ..., description="SECTION 1: 본연의 성정과 신년의 기류 (일간 심리학적 접근)"
    )
    wealth_and_success: SectionContent = Field(
        ..., description="SECTION 2: 재물과 비즈니스의 조류 (재성/식상 분석)"
    )
    career_and_honor: SectionContent = Field(
        ..., description="SECTION 3: 직업적 성취와 명예의 궤적 (관성 분석)"
    )
    document_and_wisdom: SectionContent = Field(
        ..., description="SECTION 4: 문서의 인연과 학업의 결실 (인성 분석)"
    )
    relationship_and_love: SectionContent = Field(
        ..., description="SECTION 5: 인연의 파동과 사회적 관계 (연애/귀인운)"
    )
    health_and_movement: SectionContent = Field(
        ..., description="SECTION 6: 신체의 조화와 환경의 변화 (건강/역마)"
    )


class YearlyAnalysisResult(BaseModel):
    """신년 분석 결과"""
    year: int = Field(..., description="분석 연도")
    summary: str = Field(..., description="연간 총평")
    yearly_theme: str = Field(..., description="올해의 테마")
    overall_score: int = Field(..., ge=0, le=100, description="연간 종합 점수")
    monthly_fortunes: List[MonthlyFortune] = Field(..., description="월별 운세")
    quarterly_highlights: Optional[List[QuarterlyHighlight]] = Field(
        default=[], description="분기별 하이라이트 (deprecated)"
    )
    yearly_advice: YearlyAdvice = Field(..., description="6개 섹션 분야별 조언")
    classical_references: List[Dict[str, str]] = Field(..., description="고전 인용")


class YearlyAnalysisStatusResponse(BaseModel):
    """신년 분석 상태 응답"""
    job_id: str = Field(..., description="작업 ID")
    status: JobStatus = Field(..., description="작업 상태")
    progress_percent: int = Field(0, ge=0, le=100, description="진행률")
    current_step: Optional[str] = Field(None, description="현재 단계")
    step_statuses: Optional[Dict[str, str]] = Field(
        None,
        description="단계별 상태 (pending/in_progress/completed/failed)"
    )
    result: Optional[Dict[str, Any]] = Field(None, description="분석 결과")
    error: Optional[str] = Field(None, description="에러 메시지")
    error_step: Optional[str] = Field(None, description="에러 발생 단계")
    created_at: str = Field(..., description="생성 시각")
    updated_at: str = Field(..., description="업데이트 시각")
