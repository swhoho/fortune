"""
점수 계산 모듈
사주 원국(Natal)과 세운(Dynamic)의 길흉을 수치화

v5.0 - Task 5 구현
v5.1 - 리포트 점수 계산 (calculate_scores) 추가
"""
from .event_score import (
    EventScore,
    EventIntensity,
    calculate_event_score,
    get_event_intensity,
    format_score_context,
    # 개별 점수 함수들
    calculate_formation_quality_score,
    calculate_sinsal_score,
    calculate_natal_interactions,
    calculate_year_ten_god_score,
    calculate_year_interaction_score,
    determine_yongshin_elements,
)
from .validation import (
    ConsistencyLevel,
    ValidationResult,
    validate_score_narrative_consistency,
    validate_event_prediction_consistency,
    format_validation_result,
)
# 리포트 점수 계산 (work, love, aptitude, wealth)
from .calculator import (
    calculate_scores,
    get_ten_god_type,
    get_dominant_ten_god,
)

__all__ = [
    # 리포트 점수 계산 (report_analysis.py에서 사용)
    "calculate_scores",
    "get_ten_god_type",
    "get_dominant_ten_god",
    # 사건 점수 계산
    "EventScore",
    "EventIntensity",
    "calculate_event_score",
    "get_event_intensity",
    "format_score_context",
    "calculate_formation_quality_score",
    "calculate_sinsal_score",
    "calculate_natal_interactions",
    "calculate_year_ten_god_score",
    "calculate_year_interaction_score",
    "determine_yongshin_elements",
    # 일관성 검증
    "ConsistencyLevel",
    "ValidationResult",
    "validate_score_narrative_consistency",
    "validate_event_prediction_consistency",
    "format_validation_result",
]
