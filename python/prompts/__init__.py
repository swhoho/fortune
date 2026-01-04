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

# Task 7: 멀티스텝 분석용 요약 모듈
from .classics_summary import (
    ZIPING_SUMMARY,
    QIONGTONG_SUMMARY,
    TEN_GODS_GUIDE,
    DAY_MASTER_TRAITS,
    get_ziping_summary,
    get_qiongtong_summary,
    get_ten_gods_guide,
    get_day_master_traits,
    get_day_master_johu,
    build_multistep_prompt,
)

__all__ = [
    # 기존 모듈
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
    # Task 7: 멀티스텝용 요약
    "ZIPING_SUMMARY",
    "QIONGTONG_SUMMARY",
    "TEN_GODS_GUIDE",
    "DAY_MASTER_TRAITS",
    "get_ziping_summary",
    "get_qiongtong_summary",
    "get_ten_gods_guide",
    "get_day_master_traits",
    "get_day_master_johu",
    "build_multistep_prompt",
]

__version__ = "1.2.0"
