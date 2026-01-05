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
    # Task 2: 프롬프트 최적화
    STEP_CLASSIC_MAP,
    build_system_prompt_v3,
    build_filtered_johu_prompt,
    DayMasterInfo,
    TenGodInfo,
    StructuredPillarsData,
    DAY_MASTER_SYMBOLS,
    TEN_GOD_MEANINGS,
    structure_pillars_data,
    extract_formation_candidates,
    JohuFeasibility,
    analyze_johu_feasibility,
    format_johu_feasibility,
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
    # Task 2: 프롬프트 최적화
    "STEP_CLASSIC_MAP",
    "build_system_prompt_v3",
    "build_filtered_johu_prompt",
    "DayMasterInfo",
    "TenGodInfo",
    "StructuredPillarsData",
    "DAY_MASTER_SYMBOLS",
    "TEN_GOD_MEANINGS",
    "structure_pillars_data",
    "extract_formation_candidates",
    "JohuFeasibility",
    "analyze_johu_feasibility",
    "format_johu_feasibility",
]

__version__ = "1.3.0"  # Task 2 프롬프트 최적화
