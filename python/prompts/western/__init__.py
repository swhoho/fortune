"""
서구권 명리학 프레임워크
The Destiny Code 기반 현대적 해석

지원 언어: ko, en, ja, zh-CN, zh-TW
"""
from .destiny_code import (
    # 타입
    LanguageType,
    # 데이터클래스
    TermMapping,
    ElementEnergy,
    DestinyAdvice,
    LuckCycleEntry,
    # 클래스
    DestinyCodePrompt,
    # 매핑 데이터
    TEN_GODS_MAPPING,
    FIVE_FACTORS_MAPPING,
    DESTINY_ADVICE_DB,
    LUCK_INTERACTIONS,
    LUCK_CYCLE_THEMES,
    # 헬퍼 함수
    get_ten_god_name,
    get_destiny_advice,
    get_all_destiny_advice,
    get_luck_interaction,
    build_luck_cycle_prompt,
    build_destiny_code_analysis_prompt,
)

__all__ = [
    # 타입
    "LanguageType",
    # 데이터클래스
    "TermMapping",
    "ElementEnergy",
    "DestinyAdvice",
    "LuckCycleEntry",
    # 클래스
    "DestinyCodePrompt",
    # 매핑 데이터
    "TEN_GODS_MAPPING",
    "FIVE_FACTORS_MAPPING",
    "DESTINY_ADVICE_DB",
    "LUCK_INTERACTIONS",
    "LUCK_CYCLE_THEMES",
    # 헬퍼 함수
    "get_ten_god_name",
    "get_destiny_advice",
    "get_all_destiny_advice",
    "get_luck_interaction",
    "build_luck_cycle_prompt",
    "build_destiny_code_analysis_prompt",
]
