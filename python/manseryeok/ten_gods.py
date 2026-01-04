"""
십신(十神) 계산 모듈
일간(日干)을 기준으로 다른 천간과의 관계 판별

십신 5계열:
- 비겁(比劫): 비견, 겁재 - 같은 오행
- 식상(食傷): 식신, 상관 - 내가 생하는 오행
- 재성(財星): 편재, 정재 - 내가 극하는 오행
- 관성(官星): 편관, 정관 - 나를 극하는 오행
- 인성(印星): 편인, 정인 - 나를 생하는 오행
"""
from typing import Dict, List
from .constants import (
    HEAVENLY_STEMS,
    YANG_STEMS,
    YIN_STEMS,
    STEM_TO_ELEMENT,
    ELEMENT_GENERATES,
    ELEMENT_OVERCOMES,
    JIJANGGAN_TABLE,
)


# 십신 이름 (한국어)
TEN_GOD_NAMES = [
    "비견", "겁재",  # 비겁 - 같은 오행
    "식신", "상관",  # 식상 - 내가 생하는 오행
    "편재", "정재",  # 재성 - 내가 극하는 오행
    "편관", "정관",  # 관성 - 나를 극하는 오행
    "편인", "정인",  # 인성 - 나를 생하는 오행
]

# 십신 영어 이름 (The Destiny Code 스타일)
TEN_GOD_ENGLISH = {
    "비견": "Friend",
    "겁재": "Rob Wealth",
    "식신": "Eating God",
    "상관": "Hurting Officer",
    "편재": "Indirect Wealth",
    "정재": "Direct Wealth",
    "편관": "Seven Killings",
    "정관": "Direct Officer",
    "편인": "Indirect Resource",
    "정인": "Direct Resource",
}

# 십신 계열
TEN_GOD_CATEGORIES = {
    "비겁": ["비견", "겁재"],
    "식상": ["식신", "상관"],
    "재성": ["편재", "정재"],
    "관성": ["편관", "정관"],
    "인성": ["편인", "정인"],
}


def _get_generating_element(element: str) -> str:
    """나를 생하는 오행 (인성)"""
    for gen, result in ELEMENT_GENERATES.items():
        if result == element:
            return gen
    return ""


def _get_overcoming_element(element: str) -> str:
    """나를 극하는 오행 (관성)"""
    for over, result in ELEMENT_OVERCOMES.items():
        if result == element:
            return over
    return ""


def determine_ten_god(day_master: str, target_stem: str) -> str:
    """
    일간과 다른 천간의 십신 관계 판별

    Args:
        day_master: 일간 (예: "甲")
        target_stem: 대상 천간 (예: "丙")

    Returns:
        십신 이름 (예: "식신")
    """
    if day_master == target_stem:
        return "비견"

    day_element = STEM_TO_ELEMENT[day_master]
    target_element = STEM_TO_ELEMENT[target_stem]

    # 음양 판단
    day_is_yang = day_master in YANG_STEMS
    target_is_yang = target_stem in YANG_STEMS
    same_polarity = day_is_yang == target_is_yang

    # 1. 같은 오행 (비겁)
    if day_element == target_element:
        return "비견" if same_polarity else "겁재"

    # 2. 내가 생하는 오행 (식상)
    if ELEMENT_GENERATES.get(day_element) == target_element:
        return "식신" if same_polarity else "상관"

    # 3. 내가 극하는 오행 (재성)
    if ELEMENT_OVERCOMES.get(day_element) == target_element:
        return "편재" if same_polarity else "정재"

    # 4. 나를 극하는 오행 (관성)
    overcoming = _get_overcoming_element(day_element)
    if overcoming == target_element:
        return "편관" if same_polarity else "정관"

    # 5. 나를 생하는 오행 (인성)
    generating = _get_generating_element(day_element)
    if generating == target_element:
        return "편인" if same_polarity else "정인"

    # 예외 (발생하지 않아야 함)
    return "비견"


def extract_ten_gods(pillars: dict, jijanggan: dict) -> Dict[str, float]:
    """
    사주 팔자에서 십신 분포 추출 (가중치 포함)

    가중치 기준:
    - 천간: 1.0
    - 지장간 정기: 1.0
    - 지장간 여기/중기: 0.3

    Args:
        pillars: 사주 팔자
            {
                "year": {"stem": "庚", "branch": "午"},
                "month": {"stem": "辛", "branch": "巳"},
                "day": {"stem": "甲", "branch": "子"},
                "hour": {"stem": "辛", "branch": "未"},
            }
        jijanggan: 지장간
            {
                "year": ["己", "丁"],
                "month": ["戊", "庚", "丙"],
                "day": ["癸"],
                "hour": ["丁", "乙", "己"],
            }

    Returns:
        십신별 가중치 합산 값
        {
            "비견": 0.0,
            "겁재": 0.0,
            "식신": 1.3,
            ...
        }
    """
    counts = {name: 0.0 for name in TEN_GOD_NAMES}
    day_master = pillars["day"]["stem"]

    # 1. 천간 분석 (연/월/시주 - 일간 제외, 가중치 1.0)
    for key in ["year", "month", "hour"]:
        stem = pillars[key]["stem"]
        ten_god = determine_ten_god(day_master, stem)
        counts[ten_god] += 1.0

    # 2. 지장간 분석 (4주 모두, 가중치 변동)
    # 지장간: [여기, 중기, 정기] 순서 (constants.py 기준)
    # 정기(마지막): 1.0, 그 외: 0.3
    for key in ["year", "month", "day", "hour"]:
        stems = jijanggan.get(key, [])
        if not stems:
            continue

        for i, stem in enumerate(stems):
            # 마지막 원소가 정기 (가중치 1.0)
            if i == len(stems) - 1:
                weight = 1.0
            else:
                weight = 0.3

            ten_god = determine_ten_god(day_master, stem)
            counts[ten_god] += weight

    return counts


def format_ten_gods(ten_god_counts: Dict[str, float], language: str = 'ko') -> str:
    """
    십신 분포 포맷팅 (프롬프트용)

    Args:
        ten_god_counts: extract_ten_gods() 결과
        language: 언어 코드

    Returns:
        포맷된 문자열
    """
    # 가중치 0.5 이상인 것만 표시
    significant = {k: v for k, v in ten_god_counts.items() if v >= 0.5}

    if not significant:
        return "특이 십신 분포 없음"

    # 가중치 높은 순 정렬
    sorted_items = sorted(significant.items(), key=lambda x: x[1], reverse=True)

    if language == 'en':
        items = [f"{TEN_GOD_ENGLISH.get(k, k)}: {v:.1f}" for k, v in sorted_items]
    else:
        items = [f"{k}: {v:.1f}" for k, v in sorted_items]

    return ", ".join(items)


def get_dominant_ten_god(ten_god_counts: Dict[str, float]) -> str:
    """
    가장 강한 십신 반환

    Args:
        ten_god_counts: extract_ten_gods() 결과

    Returns:
        가장 강한 십신 이름
    """
    if not ten_god_counts:
        return "비견"

    return max(ten_god_counts.items(), key=lambda x: x[1])[0]


def get_category_totals(ten_god_counts: Dict[str, float]) -> Dict[str, float]:
    """
    십신 5계열별 합계

    Returns:
        {
            "비겁": 2.3,
            "식상": 1.0,
            "재성": 0.6,
            "관성": 1.5,
            "인성": 0.0,
        }
    """
    totals = {}
    for category, gods in TEN_GOD_CATEGORIES.items():
        total = sum(ten_god_counts.get(god, 0.0) for god in gods)
        totals[category] = round(total, 2)
    return totals


def ten_gods_to_dict(ten_god_counts: Dict[str, float]) -> dict:
    """십신 분석 결과를 dict로 변환"""
    return {
        "counts": ten_god_counts,
        "categories": get_category_totals(ten_god_counts),
        "dominant": get_dominant_ten_god(ten_god_counts),
        "summary": format_ten_gods(ten_god_counts),
    }
