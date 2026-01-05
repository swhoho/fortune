"""
리포트 분석 API 스키마
비동기 작업 처리용 Pydantic 모델
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List, Any
from enum import Enum


class JobStatus(str, Enum):
    """작업 상태"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class PipelineStep(str, Enum):
    """파이프라인 단계"""
    MANSERYEOK = "manseryeok"
    JIJANGGAN = "jijanggan"
    BASIC_ANALYSIS = "basic_analysis"
    PERSONALITY = "personality"
    APTITUDE = "aptitude"
    FORTUNE = "fortune"
    SCORING = "scoring"
    VISUALIZATION = "visualization"
    SAVING = "saving"
    COMPLETE = "complete"


class ReportAnalysisRequest(BaseModel):
    """리포트 분석 요청"""
    report_id: str = Field(..., description="리포트 ID (DB primary key)")
    profile_id: str = Field(..., description="프로필 ID")
    user_id: str = Field(..., description="사용자 ID")

    # 프로필 정보
    birth_date: str = Field(..., description="생년월일 (YYYY-MM-DD)")
    birth_time: Optional[str] = Field("12:00", description="출생 시간 (HH:MM)")
    gender: Literal['male', 'female'] = Field(..., description="성별")
    calendar_type: Literal['solar', 'lunar'] = Field('solar', description="양력/음력")

    # 언어
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field('ko', description="언어")

    # 재시도용 (기존 데이터 있을 때)
    retry_from_step: Optional[str] = Field(None, description="재시도 시작 단계")
    existing_pillars: Optional[Dict[str, Any]] = Field(None, description="기존 사주 데이터")
    existing_daewun: Optional[List[Dict[str, Any]]] = Field(None, description="기존 대운 데이터")
    existing_analysis: Optional[Dict[str, Any]] = Field(None, description="기존 분석 결과")


class ReportAnalysisStartResponse(BaseModel):
    """리포트 분석 시작 응답"""
    job_id: str = Field(..., description="작업 ID")
    report_id: str = Field(..., description="리포트 ID")
    status: JobStatus = Field(..., description="작업 상태")
    message: str = Field(..., description="메시지")


class ReportAnalysisStatusResponse(BaseModel):
    """리포트 분석 상태 응답"""
    job_id: str = Field(..., description="작업 ID")
    report_id: str = Field(..., description="리포트 ID")
    status: JobStatus = Field(..., description="작업 상태")
    progress_percent: int = Field(0, ge=0, le=100, description="진행률")
    current_step: Optional[str] = Field(None, description="현재 단계")
    step_statuses: Optional[Dict[str, str]] = Field(None, description="단계별 상태")

    # 결과 (완료 시)
    pillars: Optional[Dict[str, Any]] = Field(None, description="사주 데이터")
    daewun: Optional[List[Dict[str, Any]]] = Field(None, description="대운 데이터")
    jijanggan: Optional[Dict[str, Any]] = Field(None, description="지장간 데이터")
    analysis: Optional[Dict[str, Any]] = Field(None, description="분석 결과")
    scores: Optional[Dict[str, Any]] = Field(None, description="점수")
    visualization_url: Optional[str] = Field(None, description="시각화 URL")

    # 에러
    error: Optional[str] = Field(None, description="에러 메시지")
    error_step: Optional[str] = Field(None, description="에러 발생 단계")
    retryable: bool = Field(True, description="재시도 가능 여부")

    # 타임스탬프
    created_at: str = Field(..., description="생성 시각")
    updated_at: str = Field(..., description="업데이트 시각")
