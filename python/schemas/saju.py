"""
사주 분석 API 스키마 정의
Pydantic v2 모델
"""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator


class Gender(str, Enum):
    """성별 (대운 방향 결정)"""
    MALE = "male"
    FEMALE = "female"


class CalculateRequest(BaseModel):
    """만세력 계산 요청"""
    birthDatetime: datetime = Field(
        ...,
        description="생년월일시 (ISO 8601 형식)",
        examples=["1990-05-15T14:30:00"]
    )
    timezone: str = Field(
        default="GMT+9",
        description="시간대 (예: GMT+9, GMT-5)",
        examples=["GMT+9"]
    )
    isLunar: bool = Field(
        default=False,
        description="음력 여부"
    )
    gender: Gender = Field(
        ...,
        description="성별 (대운 방향 결정)"
    )

    @field_validator('birthDatetime')
    @classmethod
    def validate_datetime(cls, v: datetime) -> datetime:
        """생년월일 범위 검증"""
        if v.year < 1900 or v.year > 2100:
            raise ValueError("지원 연도 범위: 1900-2100년")
        return v

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        """시간대 형식 검증"""
        if not v.startswith("GMT"):
            raise ValueError("시간대 형식: GMT+9, GMT-5 등")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "birthDatetime": "1990-05-15T14:30:00",
                "timezone": "GMT+9",
                "isLunar": False,
                "gender": "male"
            }
        }
    }


class Pillar(BaseModel):
    """사주 기둥 (한 개)"""
    stem: str = Field(..., description="천간 (한자)", examples=["甲"])
    branch: str = Field(..., description="지지 (한자)", examples=["子"])
    element: str = Field(..., description="오행 (한자)", examples=["木"])


class Pillars(BaseModel):
    """사주 팔자 (4개 기둥)"""
    year: Pillar = Field(..., description="연주 (年柱)")
    month: Pillar = Field(..., description="월주 (月柱)")
    day: Pillar = Field(..., description="일주 (日柱)")
    hour: Pillar = Field(..., description="시주 (時柱)")


class DaewunItem(BaseModel):
    """대운 항목"""
    age: int = Field(..., description="시작 나이", examples=[1])
    stem: str = Field(..., description="천간", examples=["壬"])
    branch: str = Field(..., description="지지", examples=["午"])
    startYear: int = Field(..., description="시작 연도", examples=[1991])


class Jijanggan(BaseModel):
    """지장간 (각 지지에 숨어있는 천간)"""
    year: list[str] = Field(..., description="연주 지장간", examples=[["己", "丁"]])
    month: list[str] = Field(..., description="월주 지장간", examples=[["戊", "庚", "丙"]])
    day: list[str] = Field(..., description="일주 지장간", examples=[["癸"]])
    hour: list[str] = Field(..., description="시주 지장간", examples=[["己", "丁", "乙"]])


class CalculateResponse(BaseModel):
    """만세력 계산 응답"""
    pillars: Pillars = Field(..., description="사주 팔자")
    daewun: list[DaewunItem] = Field(..., description="대운 목록")
    jijanggan: Jijanggan = Field(..., description="지장간")

    model_config = {
        "json_schema_extra": {
            "example": {
                "pillars": {
                    "year": {"stem": "庚", "branch": "午", "element": "金"},
                    "month": {"stem": "辛", "branch": "巳", "element": "金"},
                    "day": {"stem": "甲", "branch": "子", "element": "木"},
                    "hour": {"stem": "辛", "branch": "未", "element": "金"}
                },
                "daewun": [
                    {"age": 1, "stem": "壬", "branch": "午", "startYear": 1991},
                    {"age": 11, "stem": "癸", "branch": "未", "startYear": 2001}
                ],
                "jijanggan": {
                    "year": ["己", "丁"],
                    "month": ["戊", "庚", "丙"],
                    "day": ["癸"],
                    "hour": ["己", "丁", "乙"]
                }
            }
        }
    }
