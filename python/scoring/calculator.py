"""
리포트 점수 계산 모듈
사주 원국(pillars)과 지장간(jijanggan) 기반으로 각 영역별 점수 산출

v3.0 기준 (TypeScript와 동기화):
- 공식: 50 + (rawScore - 50) × SENSITIVITY → clamp(0, 100)
- SENSITIVITY: 1.5 (편차 증폭 계수)
- Modifier 범위: 업무/연애 max ±30, 성격/적성 max ±20
- 목표 분포: 특성별 명확한 차이, 극단값 허용
"""
from typing import Dict, Any, List


# ============================================
# 상수 정의
# ============================================

BASE_SCORE = 50
MIN_SCORE = 0
MAX_SCORE = 100

# 편차 증폭 계수 (v3.0)
# 50점 기준으로 편차를 1.5배 증폭하여 점수 분포 극단화
SENSITIVITY = 1.5


# ============================================
# 십신별 영역 영향도 (modifier)
# v3.0: TypeScript와 동기화 - 범위 확대
# ============================================

# 업무 능력 점수 modifier (max ±30)
WORK_MODIFIERS = {
    "planning": {  # 기획력
        "편인": 30, "정인": 23, "상관": 13, "정관": 8,
        "식신": 5, "편관": 0, "비견": -7, "정재": -10,
        "겁재": -20, "편재": -17,
    },
    "drive": {  # 추진력
        "겁재": 30, "편관": 23, "비견": 17, "상관": 7,
        "편재": 3, "정관": 0, "식신": -7, "편인": -10,
        "정인": -20, "정재": -17,
    },
    "execution": {  # 실행력
        "편관": 23, "겁재": 20, "정재": 17, "비견": 13,
        "편재": 3, "정관": 0, "식신": -7, "상관": -10,
        "정인": -13, "편인": -20,
    },
    "completion": {  # 완성도
        "정재": 30, "정관": 23, "정인": 20, "식신": 7,
        "편인": 3, "비견": 0, "편재": -10, "편관": -13,
        "상관": -17, "겁재": -17,
    },
    "management": {  # 관리력
        "정관": 30, "정인": 20, "정재": 20, "편관": 7,
        "편재": 3, "비견": 0, "식신": -7, "편인": -10,
        "겁재": -17, "상관": -20,
    },
}

# 연애 특성 점수 modifier (max ±30)
LOVE_MODIFIERS = {
    "consideration": {  # 배려심
        "식신": 30, "정인": 23, "정재": 13, "정관": 7,
        "편재": 3, "상관": 0, "비견": -10, "편인": -13,
        "편관": -17, "겁재": -20,
    },
    "humor": {  # 유머감각
        "식신": 30, "상관": 23, "편재": 13, "겁재": 7,
        "편인": 3, "비견": 0, "정재": -10, "편관": -13,
        "정인": -17, "정관": -20,
    },
    "emotion": {  # 감성
        "식신": 23, "상관": 20, "편인": 20, "정인": 10,
        "편재": 3, "겁재": 0, "비견": -10, "정재": -13,
        "정관": -17, "편관": -20,
    },
    "selfEsteem": {  # 자존감
        "비견": 30, "겁재": 20, "편관": 13, "정관": 7,
        "편인": 3, "상관": 0, "식신": -10, "편재": -13,
        "정인": -17, "정재": -17,
    },
    "adventure": {  # 모험심
        "겁재": 30, "편재": 23, "상관": 17, "편관": 3,
        "비견": 3, "편인": 0, "식신": -10, "정관": -17,
        "정인": -17, "정재": -17,
    },
    "sincerity": {  # 성실도
        "정재": 30, "정관": 23, "정인": 20, "비견": 3,
        "편관": 3, "식신": 0, "편인": -10, "편재": -17,
        "겁재": -17, "상관": -20,
    },
    "sociability": {  # 사교력
        "식신": 30, "상관": 23, "편재": 17, "정재": 7,
        "정관": 3, "겁재": 0, "비견": -10, "편관": -13,
        "정인": -20, "편인": -20,
    },
    "finance": {  # 경제관념
        "정재": 30, "편재": 20, "정관": 13, "비견": 7,
        "정인": 7, "편관": 0, "식신": -10, "편인": -13,
        "상관": -17, "겁재": -20,
    },
    "trustworthiness": {  # 신뢰성
        "정관": 30, "정인": 23, "정재": 20, "비견": 7,
        "편관": 0, "식신": 0, "편재": -10, "편인": -13,
        "겁재": -20, "상관": -20,
    },
    "expressiveness": {  # 표현력
        "상관": 30, "식신": 23, "편재": 10, "겁재": 7,
        "비견": 3, "편관": 0, "정재": -10, "정관": -13,
        "편인": -17, "정인": -17,
    },
}

# 적성 점수 modifier (max ±20)
APTITUDE_MODIFIERS = {
    "artistry": {  # 예술성
        "상관": 20, "식신": 16, "편인": 14, "편재": 4,
        "정관": -11, "비견": -4, "정인": 0, "겁재": 0,
        "정재": -4, "편관": -4,
    },
    "business": {  # 사업감각
        "편재": 20, "겁재": 14, "상관": 11, "편관": 7,
        "정인": -11, "정재": -4, "정관": 0, "비견": 4,
        "식신": 0, "편인": 0,
    },
}

# 재물 점수 modifier (max ±30)
WEALTH_MODIFIERS = {
    "stability": {  # 안정성
        "정재": 30, "정관": 23, "정인": 20, "비견": 7,
        "편관": 3, "식신": 0, "편재": -10, "편인": -13,
        "겁재": -20, "상관": -17,
    },
    "growth": {  # 성장 가능성
        "편재": 30, "식신": 23, "상관": 17, "편관": 7,
        "겁재": 3, "비견": 0, "정재": -10, "정관": -13,
        "정인": -17, "편인": -17,
    },
}

# 의지력 점수 modifier (max ±20)
WILLPOWER_MODIFIERS = {
    "비견": 20, "겁재": 16, "편관": 11, "정관": 7,
    "식신": -7, "상관": -4, "편인": 0, "정인": -4,
    "정재": -4, "편재": -4,
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
            "wealth": {"stability": int, "growth": int},
            "willpower": int  # 의지력 점수 (0-100)
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
        "willpower": _calculate_single_score(ten_gods, WILLPOWER_MODIFIERS),
    }

    return scores


def _calculate_single_score(ten_gods: Dict[str, int], modifiers: Dict[str, int]) -> int:
    """
    단일 점수 계산 (의지력 등)

    v3.0 공식: 50 + (rawScore - 50) × SENSITIVITY → clamp(0, 100)
    """
    raw_score = BASE_SCORE

    for god, modifier in modifiers.items():
        count = ten_gods.get(god, 0)
        raw_score += modifier * count

    # 편차 증폭
    delta = raw_score - BASE_SCORE
    amplified_delta = delta * SENSITIVITY
    final_score = BASE_SCORE + amplified_delta

    # 0~100 범위로 클램프
    return max(MIN_SCORE, min(MAX_SCORE, int(round(final_score))))


def _extract_ten_god_counts(pillars: Dict[str, Any], jijanggan: Dict[str, Any] = None) -> Dict[str, int]:
    """
    사주에서 십신 카운트 추출

    v3.0: 지장간 여기/중기 가중치 0, 정기만 카운팅
    - 천간: 각 주(年月時)의 십신 (일간 제외) - 가중치 1.0
    - 지지 본기: 각 주의 지지 본기 십신 - 가중치 1.0
    - 지장간 정기만: 가중치 1.0 (여기/중기는 노이즈로 제거)
    """
    from manseryeok.daewun import get_ten_god_relation

    counts: Dict[str, float] = {}

    # 일간 추출 (십신 계산의 기준)
    day_stem = pillars.get("day", {}).get("stem", "")

    # 천간 십신 (가중치 1.0)
    for pillar_name in ["year", "month", "hour"]:  # day는 일간이므로 제외
        pillar = pillars.get(pillar_name, {})

        stem_ten_god = pillar.get("stemTenGod") or pillar.get("stem_ten_god", "")

        if not stem_ten_god and day_stem:
            stem = pillar.get("stem", "")
            if stem:
                stem_ten_god = get_ten_god_relation(day_stem, stem)

        if stem_ten_god and stem_ten_god != "알수없음":
            counts[stem_ten_god] = counts.get(stem_ten_god, 0) + 1.0

    # 지지 십신 (가중치 1.0)
    for pillar_name in ["year", "month", "day", "hour"]:
        pillar = pillars.get(pillar_name, {})

        branch_ten_god = pillar.get("branchTenGod") or pillar.get("branch_ten_god", "")
        if branch_ten_god and branch_ten_god != "알수없음":
            counts[branch_ten_god] = counts.get(branch_ten_god, 0) + 1.0

    # 지장간 정기만 카운트 (v3.0: 여기/중기는 노이즈로 제거)
    if jijanggan:
        for pillar_name, jj_list in jijanggan.items():
            if isinstance(jj_list, list) and len(jj_list) > 0:
                # 정기(마지막 요소)만 카운팅 (가중치 1.0)
                main_jj = jj_list[-1] if jj_list else {}
                if isinstance(main_jj, dict):
                    jj_ten_god = main_jj.get("tenGod") or main_jj.get("ten_god", "")
                    if jj_ten_god and jj_ten_god != "알수없음":
                        counts[jj_ten_god] = counts.get(jj_ten_god, 0) + 1.0

    # 정수로 변환 (반올림)
    return {k: int(round(v)) for k, v in counts.items()}


def _calculate_area_scores(ten_gods: Dict[str, int], modifiers: Dict[str, Dict[str, int]]) -> Dict[str, int]:
    """
    영역별 점수 계산

    v3.0 공식: 50 + (rawScore - 50) × SENSITIVITY → clamp(0, 100)
    """
    scores = {}

    for key, mods in modifiers.items():
        raw_score = BASE_SCORE
        for god, mod in mods.items():
            count = ten_gods.get(god, 0)
            raw_score += mod * count

        # 편차 증폭 (v3.0)
        delta = raw_score - BASE_SCORE
        amplified_delta = delta * SENSITIVITY
        final_score = BASE_SCORE + amplified_delta

        # 0~100 범위로 클램프
        scores[key] = max(MIN_SCORE, min(MAX_SCORE, int(round(final_score))))

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
