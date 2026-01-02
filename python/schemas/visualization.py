"""
시각화 API 스키마
- VisualizationRequest: 명반 시각화 요청
- VisualizationResponse: Base64 이미지 응답
"""
from pydantic import BaseModel, Field
from .saju import Pillars


class VisualizationRequest(BaseModel):
    """명반 시각화 요청"""
    pillars: Pillars = Field(..., description="사주 팔자 데이터")

    model_config = {
        "json_schema_extra": {
            "example": {
                "pillars": {
                    "year": {"stem": "庚", "branch": "午", "element": "金"},
                    "month": {"stem": "辛", "branch": "巳", "element": "金"},
                    "day": {"stem": "甲", "branch": "子", "element": "木"},
                    "hour": {"stem": "辛", "branch": "未", "element": "金"}
                }
            }
        }
    }


class VisualizationResponse(BaseModel):
    """명반 시각화 응답"""
    imageBase64: str = Field(
        ...,
        description="Base64 인코딩된 PNG 이미지 (data:image/png;base64,... 형식)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "imageBase64": "data:image/png;base64,iVBORw0KGgo..."
            }
        }
    }
