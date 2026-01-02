"""
프롬프트 API 스키마
Pydantic 모델 정의
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List, Any


class PillarInfo(BaseModel):
    """기둥 정보"""
    stem: str = Field(..., description="천간")
    branch: str = Field(..., description="지지")
    element: Optional[str] = Field(None, description="오행")
    stemElement: Optional[str] = Field(None, description="천간 오행")


class PillarsInfo(BaseModel):
    """사주 팔자 정보"""
    year: PillarInfo = Field(..., description="연주")
    month: PillarInfo = Field(..., description="월주")
    day: PillarInfo = Field(..., description="일주")
    hour: PillarInfo = Field(..., description="시주")


class DaewunInfo(BaseModel):
    """대운 정보"""
    age: Optional[int] = Field(None, description="시작 나이")
    startAge: Optional[int] = Field(None, description="시작 나이 (별칭)")
    stem: str = Field(..., description="천간")
    branch: str = Field(..., description="지지")
    startYear: Optional[int] = Field(None, description="시작 연도")


class PromptBuildOptions(BaseModel):
    """프롬프트 빌드 옵션"""
    includeZiping: bool = Field(True, description="자평진전 포함 여부")
    includeQiongtong: bool = Field(True, description="궁통보감 포함 여부")
    includeWestern: bool = Field(True, description="서구권 프레임워크 포함 여부")


class PromptBuildRequest(BaseModel):
    """프롬프트 빌드 요청"""
    language: Literal['ko', 'en', 'ja', 'zh'] = Field('ko', description="언어")
    pillars: Dict[str, Any] = Field(..., description="사주 팔자")
    daewun: Optional[List[Dict[str, Any]]] = Field(default=[], description="대운 목록")
    focusArea: Optional[Literal['wealth', 'love', 'career', 'health', 'overall']] = Field(
        None, description="집중 분석 영역"
    )
    question: Optional[str] = Field(None, max_length=500, description="사용자 질문")
    options: PromptBuildOptions = Field(default_factory=PromptBuildOptions, description="빌드 옵션")

    class Config:
        json_schema_extra = {
            "example": {
                "language": "ko",
                "pillars": {
                    "year": {"stem": "庚", "branch": "午", "element": "金"},
                    "month": {"stem": "辛", "branch": "巳", "element": "金"},
                    "day": {"stem": "甲", "branch": "子", "element": "木"},
                    "hour": {"stem": "辛", "branch": "未", "element": "金"}
                },
                "daewun": [
                    {"age": 1, "stem": "壬", "branch": "午", "startYear": 1991}
                ],
                "focusArea": "career",
                "question": "올해 이직해도 괜찮을까요?",
                "options": {
                    "includeZiping": True,
                    "includeQiongtong": True,
                    "includeWestern": True
                }
            }
        }


class PromptMetadata(BaseModel):
    """프롬프트 메타데이터"""
    version: str = Field(..., description="프롬프트 버전")
    language: str = Field(..., description="언어")
    includedModules: List[str] = Field(..., description="포함된 모듈")
    generatedAt: str = Field(..., description="생성 시각 (ISO 8601)")


class PromptBuildResponse(BaseModel):
    """프롬프트 빌드 응답"""
    systemPrompt: str = Field(..., description="시스템 프롬프트")
    userPrompt: str = Field(..., description="사용자 프롬프트")
    outputSchema: Dict[str, Any] = Field(..., description="출력 JSON 스키마")
    metadata: PromptMetadata = Field(..., description="메타데이터")


class YearlyPromptBuildRequest(BaseModel):
    """신년 사주 분석 프롬프트 빌드 요청"""
    language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] = Field('ko', description="언어")
    targetYear: int = Field(..., description="분석 대상 연도")
    birthYear: int = Field(..., description="생년")
    pillars: Dict[str, Any] = Field(..., description="사주 팔자")
    daewun: Optional[List[Dict[str, Any]]] = Field(default=[], description="대운 목록")
    currentDaewun: Optional[Dict[str, Any]] = Field(None, description="현재 대운")
    gender: Literal['male', 'female'] = Field(..., description="성별")
    options: PromptBuildOptions = Field(default_factory=PromptBuildOptions, description="빌드 옵션")

    class Config:
        json_schema_extra = {
            "example": {
                "language": "ko",
                "targetYear": 2026,
                "birthYear": 1990,
                "pillars": {
                    "year": {"stem": "庚", "branch": "午", "element": "金"},
                    "month": {"stem": "辛", "branch": "巳", "element": "金"},
                    "day": {"stem": "甲", "branch": "子", "element": "木"},
                    "hour": {"stem": "辛", "branch": "未", "element": "金"}
                },
                "daewun": [
                    {"age": 1, "stem": "壬", "branch": "午", "startYear": 1991}
                ],
                "currentDaewun": {"age": 36, "stem": "戊", "branch": "申", "startYear": 2026},
                "gender": "male",
                "options": {
                    "includeZiping": True,
                    "includeQiongtong": True,
                    "includeWestern": True
                }
            }
        }
