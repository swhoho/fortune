"""
만세력 계산 엔진 패키지 (v3.0)

기본 모듈:
- engine.py: ManseryeokEngine 클래스 (통합)
- calendar.py: 음력/양력 변환
- pillars.py: 연/월/일/시주 계산
- daewun.py: 대운 계산 (정밀 시작 나이)
- jijanggan.py: 지장간 추출
- constants.py: 천간/지지/오행 상수

v3.0 추가 모듈:
- ten_gods.py: 십신(十神) 계산
- interactions.py: 지지 상호작용 (합충형파해)
- sinsal.py: 12신살 분석
- formation.py: 격국 자동 분류
"""
from .engine import ManseryeokEngine
from .ten_gods import (
    extract_ten_gods,
    determine_ten_god,
    format_ten_gods,
    get_category_totals,
    ten_gods_to_dict,
)
from .interactions import (
    analyze_pillar_interactions,
    get_interaction_summary,
    calculate_interaction_score,
    interactions_to_dict,
)
from .sinsal import (
    analyze_sinsal,
    format_sinsal_summary,
    sinsals_to_dict,
)
from .formation import (
    determine_formation,
    format_formation,
    formation_to_dict,
    get_formation_summary,
    FormationResult,
)

__all__ = [
    # 메인 엔진
    "ManseryeokEngine",
    # 십신
    "extract_ten_gods",
    "determine_ten_god",
    "format_ten_gods",
    "get_category_totals",
    "ten_gods_to_dict",
    # 상호작용
    "analyze_pillar_interactions",
    "get_interaction_summary",
    "calculate_interaction_score",
    "interactions_to_dict",
    # 신살
    "analyze_sinsal",
    "format_sinsal_summary",
    "sinsals_to_dict",
    # 격국
    "determine_formation",
    "format_formation",
    "formation_to_dict",
    "get_formation_summary",
    "FormationResult",
]
