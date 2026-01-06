"""
리포트 점수 계산 모듈
사주 원국(pillars)과 지장간(jijanggan) 기반으로 각 영역별 점수 산출

v2.1 기준:
- 공식: 50 + Σ(modifier × tenGodCount) → clamp(0, 100)
- Modifier 범위: max ±11
- 목표 분포: 10~90점 골고루 분포
"""
from typing import Dict, Any, List


# ============================================
# 십신별 영역 영향도 (modifier)
# ============================================

# 업무 능력 점수 modifier
WORK_MODIFIERS = {
    "planning": {  # 기획/연구
        "정인": 10, "편인": 8, "정관": 6, "식신": 4,
        "비견": -2, "겁재": -4,
    },
    "drive": {  # 끈기/정력
        "비견": 10, "겁재": 8, "편관": 6, "상관": 4,
        "편인": -3, "정인": -2,
    },
    "execution": {  # 실천/수단
        "편재": 10, "정재": 8, "식신": 6, "상관": 5,
        "정인": -3, "편인": -4,
    },
    "completion": {  # 완성/판매
        "정관": 10, "정재": 8, "식신": 6, "편재": 4,
        "상관": -3, "겁재": -4,
    },
    "management": {  # 관리/평가
        "정관": 10, "편관": 8, "정인": 6, "정재": 4,
        "겁재": -4, "상관": -5,
    },
}

# 연애 특성 점수 modifier
LOVE_MODIFIERS = {
    "consideration": {  # 배려심
        "정인": 10, "정재": 8, "식신": 6, "정관": 4,
        "겁재": -5, "상관": -3,
    },
    "humor": {  # 유머감각
        "식신": 10, "상관": 8, "편재": 6, "겁재": 4,
        "정관": -3, "편관": -4,
    },
    "sincerity": {  # 성실도
        "정관": 10, "정재": 8, "정인": 6, "비견": 4,
        "상관": -4, "편재": -3,
    },
    "emotion": {  # 감성/표현력 (기존 호환)
        "상관": 10, "식신": 8, "편인": 5, "정재": 3,
        "편관": -3, "정관": -2,
    },
    "adventure": {  # 모험심
        "편재": 10, "상관": 8, "겁재": 6, "편관": 5,
        "정인": -4, "정관": -3,
    },
    "sociability": {  # 사교력
        "편재": 10, "식신": 8, "상관": 6, "겁재": 4,
        "편인": -4, "정인": -2,
    },
    "finance": {  # 재테크
        "정재": 10, "편재": 8, "식신": 5, "정관": 4,
        "겁재": -5, "비견": -3,
    },
    "trustworthiness": {  # 신뢰성
        "정관": 10, "정재": 8, "정인": 6, "비견": 3,
        "상관": -5, "겁재": -3,
    },
    "expressiveness": {  # 표현력
        "상관": 10, "식신": 8, "편재": 5, "겁재": 3,
        "정관": -3, "편관": -2,
    },
    "selfEsteem": {  # 자존감/허영심
        "비견": 8, "겁재": 6, "편관": 5, "상관": 4,
        "정인": -2, "식신": -1,
    },
}

# 적성 점수 modifier
APTITUDE_MODIFIERS = {
    "artistry": {  # 예술성
        "상관": 11, "식신": 9, "편인": 7, "편재": 4,
        "정관": -3, "편관": -4,
    },
    "business": {  # 사업 능력
        "편재": 11, "정재": 8, "식신": 6, "편관": 4,
        "정인": -3, "편인": -2,
    },
}

# 재물 점수 modifier
WEALTH_MODIFIERS = {
    "stability": {  # 안정성
        "정재": 11, "정관": 8, "정인": 6, "비견": 3,
        "겁재": -5, "편재": -2,
    },
    "growth": {  # 성장 가능성
        "편재": 11, "식신": 8, "상관": 6, "편관": 4,
        "정인": -3, "비견": -2,
    },
}


def calculate_scores(pillars: Dict[str, Any], jijanggan: Dict[str, Any]) -> Dict[str, Any]:
    """
    사주 점수 계산

    Args:
        pillars: 사주 원국 (year, month, day, hour)
        jijanggan: 지장간 정보

    Returns:
        {
            "work": {"planning": int, "drive": int, ...},
            "love": {"consideration": int, "humor": int, ...},
            "aptitude": {"artistry": int, "business": int},
            "wealth": {"stability": int, "growth": int}
        }
    """
    # 십신 카운트 추출
    ten_gods = _extract_ten_god_counts(pillars, jijanggan)

    # 각 영역별 점수 계산
    scores = {
        "work": _calculate_area_scores(ten_gods, WORK_MODIFIERS),
        "love": _calculate_area_scores(ten_gods, LOVE_MODIFIERS),
        "aptitude": _calculate_area_scores(ten_gods, APTITUDE_MODIFIERS),
        "wealth": _calculate_area_scores(ten_gods, WEALTH_MODIFIERS),
    }

    return scores


def _extract_ten_god_counts(pillars: Dict[str, Any], jijanggan: Dict[str, Any] = None) -> Dict[str, int]:
    """
    사주에서 십신 카운트 추출

    천간: 각 주(年月時)의 십신 (일간 제외)
    지지: 각 주의 지지 본기 십신

    Note: DB에 stemTenGod 키가 없는 경우 stem 값으로 직접 계산
    """
    # daewun.py의 십신 계산 함수 import
    from manseryeok.daewun import get_ten_god_relation

    counts: Dict[str, int] = {}

    # 일간 추출 (십신 계산의 기준)
    day_stem = pillars.get("day", {}).get("stem", "")

    # 천간 십신
    for pillar_name in ["year", "month", "hour"]:  # day는 일간이므로 제외
        pillar = pillars.get(pillar_name, {})

        # 1순위: 이미 저장된 십신 키 사용
        stem_ten_god = pillar.get("stemTenGod") or pillar.get("stem_ten_god", "")

        # 2순위: stem 값으로 직접 십신 계산
        if not stem_ten_god and day_stem:
            stem = pillar.get("stem", "")
            if stem:
                stem_ten_god = get_ten_god_relation(day_stem, stem)

        if stem_ten_god and stem_ten_god != "알수없음":
            counts[stem_ten_god] = counts.get(stem_ten_god, 0) + 1

    # 지지 십신 (지장간 정기 기준)
    for pillar_name in ["year", "month", "day", "hour"]:
        pillar = pillars.get(pillar_name, {})

        # 지지 십신 (직접 저장된 경우)
        branch_ten_god = pillar.get("branchTenGod") or pillar.get("branch_ten_god", "")
        if branch_ten_god and branch_ten_god != "알수없음":
            counts[branch_ten_god] = counts.get(branch_ten_god, 0) + 1

    # 지장간 정보가 있으면 추가 카운트 (정기 위주)
    if jijanggan:
        for pillar_name, jj_list in jijanggan.items():
            if isinstance(jj_list, list) and len(jj_list) > 0:
                # 정기(마지막 요소)의 십신만 카운트
                main_jj = jj_list[-1] if jj_list else {}
                if isinstance(main_jj, dict):
                    jj_ten_god = main_jj.get("tenGod") or main_jj.get("ten_god", "")
                    if jj_ten_god and jj_ten_god != "알수없음":
                        counts[jj_ten_god] = counts.get(jj_ten_god, 0) + 0.5  # 지장간은 0.5 가중치

    # 정수로 변환 (반올림)
    return {k: int(round(v)) for k, v in counts.items()}


def _calculate_area_scores(ten_gods: Dict[str, int], modifiers: Dict[str, Dict[str, int]]) -> Dict[str, int]:
    """
    영역별 점수 계산

    공식: 50 + Σ(modifier × count) → clamp(10, 90)
    """
    base = 50
    scores = {}

    for key, mods in modifiers.items():
        score = base
        for god, mod in mods.items():
            count = ten_gods.get(god, 0)
            score += mod * count

        # 10~90 범위로 클램프 (극단값 회피)
        scores[key] = max(10, min(90, int(score)))

    return scores


# ============================================
# 십신 타입 분류 (편의 함수)
# ============================================

TEN_GOD_TYPES = {
    "비겁": ["비견", "겁재"],
    "식상": ["식신", "상관"],
    "재성": ["정재", "편재"],
    "관성": ["정관", "편관"],
    "인성": ["정인", "편인"],
}


def get_ten_god_type(ten_god: str) -> str:
    """십신의 유형 반환"""
    for god_type, gods in TEN_GOD_TYPES.items():
        if ten_god in gods:
            return god_type
    return "알수없음"


def get_dominant_ten_god(ten_gods: Dict[str, int]) -> str:
    """가장 많은 십신 반환"""
    if not ten_gods:
        return ""
    return max(ten_gods, key=ten_gods.get)
