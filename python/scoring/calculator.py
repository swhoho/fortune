"""
리포트 점수 계산 모듈
사주 원국(pillars)과 지장간(jijanggan) 기반으로 각 영역별 점수 산출

v4.0 기준 (레퍼런스 기반 고도화):
- Phase 1: 지장간 월률분야 비율 적용 (30일 기준)
- Phase 2: 12운성 가중치 적용 (제왕/건록=+0.6, 묘/절/사=-0.4)
- Phase 3: 지지 상호작용 가중치 (충=1.4, 형=1.5, 원진=0.8, 파/해=0.5)
- 공식: 50 + (rawScore - 50) × SENSITIVITY → clamp(0, 100)
- SENSITIVITY: 1.5 (편차 증폭 계수)
"""
from typing import Dict, Any, List, Tuple, Optional


# ============================================
# 상수 정의
# ============================================

BASE_SCORE = 50
MIN_SCORE = 0
MAX_SCORE = 100

# v4.0: SENSITIVITY 제거 (Phase 1/2/3으로 충분한 차별화)
# 기존 SENSITIVITY = 1.5 → 삭제


# ============================================
# Phase 1: 지장간 월률분야 비율 (30일 기준)
# 출처: 사주분석마스터 v7.0
# ============================================

HIDDEN_STEMS_RATIO: Dict[str, List[float]] = {
    # 사생지 (寅申巳亥): 여기 7일, 중기 7일, 정기 16일
    '寅': [7/30, 7/30, 16/30],
    '申': [7/30, 7/30, 16/30],
    '巳': [7/30, 7/30, 16/30],
    '亥': [7/30, 7/30, 16/30],
    # 왕지 (卯酉子午): 여기 10일, 중기 0일, 정기 20일 (子는 지장간 1개)
    '卯': [10/30, 0, 20/30],
    '酉': [10/30, 0, 20/30],
    '子': [10/30, 0, 20/30],  # 癸 하나만 있음
    '午': [10/30, 9/30, 11/30],  # 丁己 중기 있음
    # 고지 (辰戌丑未): 여기 9일, 중기 3일, 정기 18일
    '辰': [9/30, 3/30, 18/30],
    '戌': [9/30, 3/30, 18/30],
    '丑': [9/30, 3/30, 18/30],
    '未': [9/30, 3/30, 18/30],
}


# ============================================
# Phase 2: 12운성 가중치
# 출처: 사주분석마스터 v7.0
# ============================================

WUNSEONG_WEIGHTS: Dict[str, float] = {
    '장생': 0.3,
    '목욕': 0.1,
    '관대': 0.4,
    '건록': 0.6,
    '제왕': 0.6,
    '쇠': -0.1,
    '병': -0.2,
    '사': -0.4,
    '묘': -0.4,
    '절': -0.4,
    '태': 0.0,
    '양': 0.2,
}

# 12운성 매트릭스 (천간 × 지지)
JIBYEON_12WUNSEONG: Dict[str, Dict[str, str]] = {
    '甲': {'子': '목욕', '丑': '관대', '寅': '건록', '卯': '제왕', '辰': '쇠', '巳': '병', '午': '사', '未': '묘', '申': '절', '酉': '태', '戌': '양', '亥': '장생'},
    '乙': {'子': '병', '丑': '양', '寅': '사', '卯': '건록', '辰': '관대', '巳': '장생', '午': '목욕', '未': '관대', '申': '절', '酉': '태', '戌': '묘', '亥': '사'},
    '丙': {'子': '태', '丑': '양', '寅': '장생', '卯': '목욕', '辰': '관대', '巳': '건록', '午': '제왕', '未': '쇠', '申': '병', '酉': '사', '戌': '묘', '亥': '절'},
    '丁': {'子': '절', '丑': '묘', '寅': '사', '卯': '병', '辰': '쇠', '巳': '건록', '午': '제왕', '未': '관대', '申': '목욕', '酉': '장생', '戌': '양', '亥': '태'},
    '戊': {'子': '태', '丑': '양', '寅': '장생', '卯': '목욕', '辰': '관대', '巳': '건록', '午': '제왕', '未': '쇠', '申': '병', '酉': '사', '戌': '묘', '亥': '절'},
    '己': {'子': '절', '丑': '묘', '寅': '사', '卯': '병', '辰': '쇠', '巳': '건록', '午': '제왕', '未': '관대', '申': '목욕', '酉': '장생', '戌': '양', '亥': '태'},
    '庚': {'子': '사', '丑': '묘', '寅': '절', '卯': '태', '辰': '양', '巳': '장생', '午': '목욕', '未': '관대', '申': '건록', '酉': '제왕', '戌': '쇠', '亥': '병'},
    '辛': {'子': '장생', '丑': '양', '寅': '태', '卯': '절', '辰': '묘', '巳': '사', '午': '병', '未': '쇠', '申': '건록', '酉': '제왕', '戌': '관대', '亥': '목욕'},
    '壬': {'子': '제왕', '丑': '쇠', '寅': '병', '卯': '사', '辰': '묘', '巳': '절', '午': '태', '未': '양', '申': '장생', '酉': '목욕', '戌': '관대', '亥': '건록'},
    '癸': {'子': '제왕', '丑': '관대', '寅': '목욕', '卯': '장생', '辰': '양', '巳': '태', '午': '절', '未': '묘', '申': '사', '酉': '병', '戌': '쇠', '亥': '건록'},
}


# ============================================
# Phase 3: 지지 상호작용 가중치
# 출처: 사주분석마스터 v8.0
# ============================================

INTERACTION_WEIGHTS: Dict[str, float] = {
    '충': 1.4,   # 고강도 변동
    '형': 1.5,   # 송사/수술/개혁
    '합': 1.0,   # 기준
    '원진': 0.8, # 심리적 불화
    '파': 0.5,   # 손상/지연
    '해': 0.5,   # 손상/지연
}

# 지지 충 관계 (6충)
BRANCH_CHUNG: Dict[str, str] = {
    '子': '午', '午': '子',
    '丑': '未', '未': '丑',
    '寅': '申', '申': '寅',
    '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰',
    '巳': '亥', '亥': '巳',
}

# 지지 형 관계 (삼형)
BRANCH_HYUNG: Dict[str, List[str]] = {
    '寅': ['巳', '申'],  # 무은지형
    '巳': ['寅', '申'],
    '申': ['寅', '巳'],
    '丑': ['戌', '未'],  # 무례지형
    '戌': ['丑', '未'],
    '未': ['丑', '戌'],
    '子': ['卯'],        # 무례지형
    '卯': ['子'],
    '辰': ['辰'],        # 자형
    '午': ['午'],
    '酉': ['酉'],
    '亥': ['亥'],
}

# 지지 원진 관계
BRANCH_WONJIN: Dict[str, str] = {
    '子': '未', '未': '子',
    '丑': '午', '午': '丑',
    '寅': '酉', '酉': '寅',
    '卯': '辰', '辰': '卯',
    '巳': '戌', '戌': '巳',
    '申': '亥', '亥': '申',
}

# 지지 파 관계
BRANCH_PA: Dict[str, str] = {
    '子': '酉', '酉': '子',
    '丑': '辰', '辰': '丑',
    '寅': '亥', '亥': '寅',
    '卯': '午', '午': '卯',
    '巳': '申', '申': '巳',
    '未': '戌', '戌': '未',
}

# 지지 해 관계
BRANCH_HAE: Dict[str, str] = {
    '子': '未', '未': '子',
    '丑': '午', '午': '丑',
    '寅': '巳', '巳': '寅',
    '卯': '辰', '辰': '卯',
    '申': '亥', '亥': '申',
    '酉': '戌', '戌': '酉',
}


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
    사주 점수 계산 (v4.0)

    Phase 1: 지장간 월률분야 비율 적용
    Phase 2: 12운성 가중치 적용
    Phase 3: 지지 상호작용 배수 적용

    Args:
        pillars: 사주 원국 (year, month, day, hour)
        jijanggan: 지장간 정보

    Returns:
        {
            "work": {"planning": int, "drive": int, ...},
            "love": {"consideration": int, "humor": int, ...},
            "aptitude": {"artistry": int, "business": int},
            "wealth": {"stability": int, "growth": int},
            "willpower": int,
            "wunseongBonus": float,  # 12운성 보너스 (디버그용)
            "interactionModifier": float,  # 상호작용 배수 (디버그용)
            "interactions": dict  # 충/형/원진/파/해 관계 (디버그용)
        }
    """
    # Phase 1: 십신 카운트 추출 (월률분야 비율 적용)
    ten_gods = _extract_ten_god_counts(pillars, jijanggan)

    # Phase 2: 12운성 보너스 계산
    wunseong_bonus = calculate_wunseong_bonus(pillars)

    # Phase 3: 지지 상호작용 배수 계산
    interaction_modifier = calculate_interaction_modifier(pillars)
    interactions = analyze_branch_interactions(pillars)

    # 각 영역별 점수 계산 (Phase 2, 3 적용)
    scores = {
        "work": _calculate_area_scores(ten_gods, WORK_MODIFIERS, wunseong_bonus, interaction_modifier),
        "love": _calculate_area_scores(ten_gods, LOVE_MODIFIERS, wunseong_bonus, interaction_modifier),
        "aptitude": _calculate_area_scores(ten_gods, APTITUDE_MODIFIERS, wunseong_bonus, interaction_modifier),
        "wealth": _calculate_area_scores(ten_gods, WEALTH_MODIFIERS, wunseong_bonus, interaction_modifier),
        "willpower": _calculate_single_score(ten_gods, WILLPOWER_MODIFIERS, wunseong_bonus, interaction_modifier),
        # 디버그용 정보
        "wunseongBonus": round(wunseong_bonus, 2),
        "interactionModifier": round(interaction_modifier, 2),
        "interactions": interactions,
    }

    # 종합 점수 계산 (세부 점수 평균)
    scores["wealthScore"] = (scores["wealth"]["stability"] + scores["wealth"]["growth"]) // 2
    scores["loveScore"] = sum(scores["love"].values()) // len(scores["love"])

    return scores


def _calculate_single_score(
    ten_gods: Dict[str, float],
    modifiers: Dict[str, int],
    wunseong_bonus: float = 0.0,
    interaction_modifier: float = 1.0
) -> int:
    """
    단일 점수 계산 (의지력 등)

    v4.0 공식:
    1. rawScore = 50 + Σ(modifier × count)
    2. + wunseong_bonus × 5 (12운성 보너스)
    3. delta = rawScore - 50
    4. final = 50 + delta × interaction_modifier
    5. clamp(0, 100)
    """
    raw_score = BASE_SCORE

    for god, modifier in modifiers.items():
        count = ten_gods.get(god, 0)
        raw_score += modifier * count

    # Phase 2: 12운성 보너스 (±12점 범위)
    raw_score += wunseong_bonus * 5

    # Phase 3: 상호작용 배수 적용
    delta = raw_score - BASE_SCORE
    final_score = BASE_SCORE + delta * interaction_modifier

    # 0~100 범위로 클램프
    return max(MIN_SCORE, min(MAX_SCORE, int(round(final_score))))


def _extract_ten_god_counts(pillars: Dict[str, Any], jijanggan: Dict[str, Any] = None) -> Dict[str, float]:
    """
    사주에서 십신 카운트 추출

    v4.0: 지장간 월률분야 비율 적용 (Phase 1)
    - 천간: 각 주(年月時)의 십신 (일간 제외) - 가중치 1.0
    - 지지 본기: 각 주의 지지 본기 십신 - 가중치 1.0
    - 지장간: 여기/중기/정기 각각 월률분야 비율 적용
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

    # 지장간 월률분야 비율 적용 (v4.0 Phase 1)
    if jijanggan:
        for pillar_name, jj_list in jijanggan.items():
            if isinstance(jj_list, list) and len(jj_list) > 0:
                # 해당 지지의 월률분야 비율 가져오기
                branch = pillars.get(pillar_name, {}).get("branch", "")
                ratios = HIDDEN_STEMS_RATIO.get(branch, [0.23, 0.23, 0.54])  # 기본값

                for idx, jj in enumerate(jj_list):
                    if isinstance(jj, dict):
                        jj_ten_god = jj.get("tenGod") or jj.get("ten_god", "")
                        if jj_ten_god and jj_ten_god != "알수없음":
                            # 여기(0), 중기(1), 정기(2) 순서
                            ratio_idx = min(idx, len(ratios) - 1)
                            weight = ratios[ratio_idx] if ratio_idx < len(ratios) else 0.5
                            counts[jj_ten_god] = counts.get(jj_ten_god, 0) + weight

    return counts


def _calculate_area_scores(
    ten_gods: Dict[str, float],
    modifiers: Dict[str, Dict[str, int]],
    wunseong_bonus: float = 0.0,
    interaction_modifier: float = 1.0
) -> Dict[str, int]:
    """
    영역별 점수 계산 (v4.0)

    공식:
    1. rawScore = 50 + Σ(modifier × count)
    2. + wunseong_bonus × 5 (12운성 보너스)
    3. delta = rawScore - 50
    4. final = 50 + delta × interaction_modifier
    5. clamp(0, 100)
    """
    scores = {}

    for key, mods in modifiers.items():
        raw_score = BASE_SCORE
        for god, mod in mods.items():
            count = ten_gods.get(god, 0)
            raw_score += mod * count

        # Phase 2: 12운성 보너스
        raw_score += wunseong_bonus * 5

        # Phase 3: 상호작용 배수 적용
        delta = raw_score - BASE_SCORE
        final_score = BASE_SCORE + delta * interaction_modifier

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


def get_dominant_ten_god(ten_gods: Dict[str, float]) -> str:
    """가장 많은 십신 반환"""
    if not ten_gods:
        return ""
    return max(ten_gods, key=ten_gods.get)


# ============================================
# Phase 2: 12운성 가중치 계산 (v4.0)
# ============================================

def get_12wunseong(stem: str, branch: str) -> str:
    """
    천간과 지지로 12운성 반환

    Args:
        stem: 천간 (甲, 乙, 丙, ...)
        branch: 지지 (子, 丑, 寅, ...)

    Returns:
        12운성 (장생, 목욕, 관대, 건록, 제왕, 쇠, 병, 사, 묘, 절, 태, 양)
    """
    if stem in JIBYEON_12WUNSEONG and branch in JIBYEON_12WUNSEONG[stem]:
        return JIBYEON_12WUNSEONG[stem][branch]
    return "알수없음"


def calculate_wunseong_bonus(pillars: Dict[str, Any]) -> float:
    """
    12운성 기반 보너스 점수 계산 (Phase 2)

    일간이 각 지지에서 어떤 12운성 상태인지에 따라 가중치 적용
    - 건록/제왕: +0.6 (강한 상태)
    - 장생/관대/양: +0.2~0.4 (좋은 상태)
    - 묘/절/사: -0.4 (약한 상태)

    Returns:
        총 가중치 합계 (-1.6 ~ +2.4 범위)
    """
    day_stem = pillars.get("day", {}).get("stem", "")
    if not day_stem:
        return 0.0

    total_bonus = 0.0

    for pillar_name in ["year", "month", "day", "hour"]:
        pillar = pillars.get(pillar_name, {})
        branch = pillar.get("branch", "")

        if branch:
            wunseong = get_12wunseong(day_stem, branch)
            bonus = WUNSEONG_WEIGHTS.get(wunseong, 0.0)
            total_bonus += bonus

    return total_bonus


# ============================================
# Phase 3: 지지 상호작용 분석 (v4.0)
# ============================================

def analyze_branch_interactions(pillars: Dict[str, Any]) -> Dict[str, List[Tuple[str, str]]]:
    """
    사주 내 지지 상호작용 분석 (Phase 3)

    4개 지지 간 충/형/원진/파/해 관계 분석

    Returns:
        {
            '충': [('子', '午'), ...],
            '형': [('寅', '申'), ...],
            '원진': [...],
            '파': [...],
            '해': [...]
        }
    """
    branches = []
    for pillar_name in ["year", "month", "day", "hour"]:
        pillar = pillars.get(pillar_name, {})
        branch = pillar.get("branch", "")
        if branch:
            branches.append(branch)

    interactions: Dict[str, List[Tuple[str, str]]] = {
        '충': [],
        '형': [],
        '원진': [],
        '파': [],
        '해': [],
    }

    # 모든 지지 쌍 비교
    for i, b1 in enumerate(branches):
        for j, b2 in enumerate(branches):
            if i >= j:
                continue

            # 충 체크
            if BRANCH_CHUNG.get(b1) == b2:
                interactions['충'].append((b1, b2))

            # 형 체크
            if b2 in BRANCH_HYUNG.get(b1, []):
                interactions['형'].append((b1, b2))

            # 원진 체크
            if BRANCH_WONJIN.get(b1) == b2:
                interactions['원진'].append((b1, b2))

            # 파 체크
            if BRANCH_PA.get(b1) == b2:
                interactions['파'].append((b1, b2))

            # 해 체크
            if BRANCH_HAE.get(b1) == b2:
                interactions['해'].append((b1, b2))

    return interactions


def calculate_interaction_modifier(pillars: Dict[str, Any]) -> float:
    """
    지지 상호작용 기반 점수 배수 계산 (Phase 3)

    충/형이 많으면 변동성 증가 (배수 > 1.0)
    원진/파/해가 많으면 약화 (배수 < 1.0)

    Returns:
        점수 배수 (0.5 ~ 2.0 범위)
    """
    interactions = analyze_branch_interactions(pillars)

    # 충/형은 변동성 증가
    chung_count = len(interactions['충'])
    hyung_count = len(interactions['형'])

    # 원진/파/해는 약화
    wonjin_count = len(interactions['원진'])
    pa_count = len(interactions['파'])
    hae_count = len(interactions['해'])

    # 배수 계산: 1.0 기준으로 조정
    # 충/형이 있으면 점수 편차가 커짐 (극단화)
    positive_modifier = (
        chung_count * (INTERACTION_WEIGHTS['충'] - 1.0) +
        hyung_count * (INTERACTION_WEIGHTS['형'] - 1.0)
    )

    # 원진/파/해가 있으면 점수가 전반적으로 낮아짐
    negative_modifier = (
        wonjin_count * (1.0 - INTERACTION_WEIGHTS['원진']) +
        pa_count * (1.0 - INTERACTION_WEIGHTS['파']) +
        hae_count * (1.0 - INTERACTION_WEIGHTS['해'])
    )

    # 최종 배수: 1.0 + positive - negative (0.5 ~ 2.0 클램프)
    modifier = 1.0 + positive_modifier * 0.1 - negative_modifier * 0.1
    return max(0.5, min(2.0, modifier))
