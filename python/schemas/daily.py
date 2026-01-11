"""
오늘의 운세 API 스키마
Pydantic 모델 정의
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List, Any
from datetime import date
from enum import Enum


class DailyJobStatus(str, Enum):
    """작업 상태"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class FortuneSection(BaseModel):
    """운세 영역별 결과"""
    score: int = Field(..., ge=0, le=100, description="점수 (0-100)")
    title: str = Field(..., description="영역 제목")
    description: str = Field(..., description="상세 설명 (100-200자)")
    tip: str = Field(..., description="팁/조언 (50자 이내)")


class DailyFortuneRequest(BaseModel):
    """오늘의 운세 생성 요청"""
    user_id: str = Field(..., description="사용자 ID")
    profile_id: str = Field(..., description="프로필 ID")
    target_date: str = Field(..., description="대상 날짜 (YYYY-MM-DD)")
    pillars: Dict[str, Any] = Field(..., description="사주 팔자")
    daewun: Optional[List[Dict[str, Any]]] = Field(default=[], description="대운 목록")
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field(
        'ko', description="언어"
    )


class DailyFortuneResult(BaseModel):
    """오늘의 운세 결과"""
    fortune_date: str = Field(..., description="운세 날짜")
    day_stem: str = Field(..., description="당일 천간")
    day_branch: str = Field(..., description="당일 지지")
    day_element: str = Field(..., description="당일 오행")
    overall_score: int = Field(..., ge=0, le=100, description="종합 점수")
    summary: str = Field(..., description="오늘의 총평 (200-400자)")
    lucky_color: Optional[str] = Field(None, description="행운의 색상")
    lucky_number: Optional[int] = Field(None, description="행운의 숫자")
    lucky_direction: Optional[str] = Field(None, description="행운의 방향")
    career_fortune: FortuneSection = Field(..., description="직장/사업운")
    wealth_fortune: FortuneSection = Field(..., description="재물운")
    love_fortune: FortuneSection = Field(..., description="연애운")
    health_fortune: FortuneSection = Field(..., description="건강운")
    relationship_fortune: FortuneSection = Field(..., description="대인관계운")
    advice: str = Field(..., description="오늘의 조언")


class DailyFortuneStartResponse(BaseModel):
    """오늘의 운세 생성 시작 응답"""
    success: bool = Field(True, description="성공 여부")
    fortune_id: Optional[str] = Field(None, description="운세 ID")
    status: str = Field("processing", description="처리 상태")
    message: str = Field(..., description="메시지")


class DailyFortuneResponse(BaseModel):
    """오늘의 운세 조회 응답"""
    success: bool = Field(True, description="성공 여부")
    data: Optional[DailyFortuneResult] = Field(None, description="운세 데이터")
    cached: bool = Field(False, description="캐시 여부")
    message: Optional[str] = Field(None, description="메시지")
