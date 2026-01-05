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


class YearlyAdvice(BaseModel):
    """분야별 연간 조언"""
    career: str = Field(..., description="직업/사업")
    wealth: str = Field(..., description="재물")
    love: str = Field(..., description="연애/결혼")
    health: str = Field(..., description="건강")
    relationships: str = Field(..., description="대인관계")


class YearlyAnalysisResult(BaseModel):
    """신년 분석 결과"""
    year: int = Field(..., description="분석 연도")
    summary: str = Field(..., description="연간 총평")
    yearly_theme: str = Field(..., description="올해의 테마")
    overall_score: int = Field(..., ge=0, le=100, description="연간 종합 점수")
    monthly_fortunes: List[MonthlyFortune] = Field(..., description="월별 운세")
    quarterly_highlights: List[QuarterlyHighlight] = Field(..., description="분기별 하이라이트")
    key_dates: Dict[str, List[str]] = Field(..., description="핵심 날짜 (lucky/unlucky)")
    yearly_advice: YearlyAdvice = Field(..., description="분야별 조언")
    classical_references: List[Dict[str, str]] = Field(..., description="고전 인용")


class YearlyAnalysisStatusResponse(BaseModel):
    """신년 분석 상태 응답"""
    job_id: str = Field(..., description="작업 ID")
    status: JobStatus = Field(..., description="작업 상태")
    progress_percent: int = Field(0, ge=0, le=100, description="진행률")
    current_step: Optional[str] = Field(None, description="현재 단계")
    result: Optional[Dict[str, Any]] = Field(None, description="분석 결과")
    error: Optional[str] = Field(None, description="에러 메시지")
    created_at: str = Field(..., description="생성 시각")
    updated_at: str = Field(..., description="업데이트 시각")
