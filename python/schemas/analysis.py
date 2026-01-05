"""
비동기 분석 API 스키마
후속 질문 및 섹션 재분석용 Pydantic 모델
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List, Any
from enum import Enum


class QuestionStatus(str, Enum):
    """질문 처리 상태"""
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ReanalysisStatus(str, Enum):
    """재분석 처리 상태"""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================
# 후속 질문 스키마
# ============================================

class QuestionHistoryItem(BaseModel):
    """질문 히스토리 아이템"""
    question: str = Field(..., description="질문")
    answer: str = Field(..., description="답변")
    created_at: str = Field(..., description="생성 시각")


class FollowUpQuestionRequest(BaseModel):
    """후속 질문 처리 요청 (Python 백그라운드)"""
    question_id: str = Field(..., description="질문 레코드 ID")
    profile_id: str = Field(..., description="프로필 ID")
    user_id: str = Field(..., description="사용자 ID")
    report_id: str = Field(..., description="리포트 ID")
    question: str = Field(..., description="사용자 질문")
    pillars: Dict[str, Any] = Field(..., description="사주 팔자")
    previous_analysis: Dict[str, Any] = Field(..., description="기존 분석 결과")
    question_history: List[QuestionHistoryItem] = Field(
        default=[], description="이전 질문 히스토리"
    )
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field(
        'ko', description="언어"
    )


class FollowUpQuestionStartResponse(BaseModel):
    """후속 질문 시작 응답"""
    status: str = Field("accepted", description="처리 상태")
    message: str = Field(..., description="메시지")


# ============================================
# 섹션 재분석 스키마
# ============================================

class SectionReanalyzeRequest(BaseModel):
    """섹션 재분석 요청 (Python 백그라운드)"""
    reanalysis_id: str = Field(..., description="재분석 레코드 ID")
    report_id: str = Field(..., description="리포트 ID")
    profile_id: str = Field(..., description="프로필 ID")
    user_id: str = Field(..., description="사용자 ID")
    section_type: Literal['personality', 'aptitude', 'fortune'] = Field(
        ..., description="재분석 섹션 타입"
    )
    pillars: Dict[str, Any] = Field(..., description="사주 팔자")
    daewun: Optional[List[Dict[str, Any]]] = Field(
        default=[], description="대운 목록"
    )
    jijanggan: Optional[Dict[str, Any]] = Field(
        None, description="지장간 데이터"
    )
    existing_analysis: Dict[str, Any] = Field(
        ..., description="기존 분석 결과"
    )
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field(
        'ko', description="언어"
    )


class SectionReanalyzeStartResponse(BaseModel):
    """섹션 재분석 시작 응답"""
    status: str = Field("accepted", description="처리 상태")
    message: str = Field(..., description="메시지")
