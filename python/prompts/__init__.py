"""
명리학 AI 프롬프트 모듈
자평진전, 궁통보감, The Destiny Code 기반 다국어 프롬프트 시스템
"""
from .master_prompt import MasterPrompt
from .builder import (
    PromptBuilder,
    PromptBuildRequest,
    PromptBuildResponse,
    YearlyPromptBuildRequest,
)
from .schemas import (
    OUTPUT_JSON_SCHEMA,
    get_output_schema_description,
    YEARLY_OUTPUT_JSON_SCHEMA,
    get_yearly_output_schema_description,
)
from .yearly_prompt import YearlyPrompt

__all__ = [
    "MasterPrompt",
    "PromptBuilder",
    "PromptBuildRequest",
    "PromptBuildResponse",
    "YearlyPromptBuildRequest",
    "YearlyPrompt",
    "OUTPUT_JSON_SCHEMA",
    "get_output_schema_description",
    "YEARLY_OUTPUT_JSON_SCHEMA",
    "get_yearly_output_schema_description",
]

__version__ = "1.1.0"
