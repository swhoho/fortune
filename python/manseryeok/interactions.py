"""
지지 상호작용 분석 모듈
합(合), 충(沖), 형(刑), 파(破), 해(害/原嗔) 관계 판별

명리학 원칙:
- 충(沖): 180도 대립, 갈등/충돌
- 형(刑): 자해/손상, 법적 문제
- 합(合): 조화/결합
- 해(害/原嗔): 은근한 불화
- 파(破): 파괴/손실
"""
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum


class InteractionType(Enum):
    """상호작용 유형"""
    COMBINATION = "합"      # 合 - 화합, 조화
    CLASH = "충"            # 沖 - 충돌, 갈등
    PUNISHMENT = "형"       # 刑 - 형벌, 자해
    HARM = "해"             # 害/元嗔 - 해악, 불화
    DESTRUCTION = "파"      # 破 - 파괴, 손실


@dataclass
class Interaction:
    """상호작용 결과"""
    type: InteractionType
    branches: Tuple[str, str]
    weight: float           # 영향 강도 (0.0-1.0)
    result_element: str     # 합의 경우 결과 오행
    description: str        # 해석


# ============================================
# 지지 합 (六合) - 12지지 중 2개가 합하여 새로운 오행 생성
# ============================================
BRANCH_COMBINATIONS = {
    ("子", "丑"): ("土", 0.9, "자축합토"),
    ("丑", "子"): ("土", 0.9, "자축합토"),
    ("寅", "亥"): ("木", 0.9, "인해합목"),
    ("亥", "寅"): ("木", 0.9, "인해합목"),
    ("卯", "戌"): ("火", 0.8, "묘술합화"),
    ("戌", "卯"): ("火", 0.8, "묘술합화"),
    ("辰", "酉"): ("金", 0.8, "진유합금"),
    ("酉", "辰"): ("金", 0.8, "진유합금"),
    ("巳", "申"): ("水", 0.8, "사신합수"),
    ("申", "巳"): ("水", 0.8, "사신합수"),
    ("午", "未"): ("火", 0.7, "오미합화"),  # 또는 土로 보기도 함
    ("未", "午"): ("火", 0.7, "오미합화"),
}

# ============================================
# 지지 충 (六沖) - 정반대 위치, 강한 충돌
# ============================================
BRANCH_CLASHES = {
    ("子", "午"): (1.0, "자오충"),
    ("午", "子"): (1.0, "자오충"),
    ("丑", "未"): (0.9, "축미충"),
    ("未", "丑"): (0.9, "축미충"),
    ("寅", "申"): (1.0, "인신충"),
    ("申", "寅"): (1.0, "인신충"),
    ("卯", "酉"): (1.0, "묘유충"),
    ("酉", "卯"): (1.0, "묘유충"),
    ("辰", "戌"): (0.9, "진술충"),
    ("戌", "辰"): (0.9, "진술충"),
    ("巳", "亥"): (1.0, "사해충"),
    ("亥", "巳"): (1.0, "사해충"),
}

# ============================================
# 지지 형 (三刑) - 자해/손상, 법적 문제
# ============================================
BRANCH_PUNISHMENTS = {
    # 무례지형 (無禮之刑): 寅巳申 삼형
    ("寅", "巳"): (0.8, "인사형 (무례지형)"),
    ("巳", "寅"): (0.8, "인사형 (무례지형)"),
    ("巳", "申"): (0.8, "사신형 (무례지형)"),
    ("申", "巳"): (0.8, "사신형 (무례지형)"),
    ("申", "寅"): (0.8, "신인형 (무례지형)"),
    ("寅", "申"): (0.8, "신인형 (무례지형)"),
    # 무은지형 (無恩之刑): 丑戌未 삼형
    ("丑", "戌"): (0.7, "축술형 (무은지형)"),
    ("戌", "丑"): (0.7, "축술형 (무은지형)"),
    ("戌", "未"): (0.7, "술미형 (무은지형)"),
    ("未", "戌"): (0.7, "술미형 (무은지형)"),
    ("未", "丑"): (0.7, "미축형 (무은지형)"),
    ("丑", "未"): (0.7, "미축형 (무은지형)"),
    # 지세지형 (持勢之刑): 子卯
    ("子", "卯"): (0.6, "자묘형 (지세지형)"),
    ("卯", "子"): (0.6, "자묘형 (지세지형)"),
    # 자형 (自刑): 辰辰, 午午, 酉酉, 亥亥
    ("辰", "辰"): (0.5, "진진자형"),
    ("午", "午"): (0.5, "오오자형"),
    ("酉", "酉"): (0.5, "유유자형"),
    ("亥", "亥"): (0.5, "해해자형"),
}

# ============================================
# 지지 해 (六害/元嗔) - 은근한 불화
# ============================================
BRANCH_HARMS = {
    ("子", "未"): (0.7, "자미해"),
    ("未", "子"): (0.7, "자미해"),
    ("丑", "午"): (0.7, "축오해"),
    ("午", "丑"): (0.7, "축오해"),
    ("寅", "巳"): (0.6, "인사해"),  # 형과 중복
    ("巳", "寅"): (0.6, "인사해"),
    ("卯", "辰"): (0.5, "묘진해"),
    ("辰", "卯"): (0.5, "묘진해"),
    ("申", "亥"): (0.6, "신해해"),
    ("亥", "申"): (0.6, "신해해"),
    ("酉", "戌"): (0.5, "유술해"),
    ("戌", "酉"): (0.5, "유술해"),
}

# ============================================
# 지지 파 (六破) - 파괴/손실
# ============================================
BRANCH_DESTRUCTIONS = {
    ("子", "酉"): (0.5, "자유파"),
    ("酉", "子"): (0.5, "자유파"),
    ("丑", "辰"): (0.5, "축진파"),
    ("辰", "丑"): (0.5, "축진파"),
    ("寅", "亥"): (0.4, "인해파"),  # 합과 중복, 영향 낮음
    ("亥", "寅"): (0.4, "인해파"),
    ("卯", "午"): (0.5, "묘오파"),
    ("午", "卯"): (0.5, "묘오파"),
    ("巳", "申"): (0.4, "사신파"),  # 합과 중복
    ("申", "巳"): (0.4, "사신파"),
    ("未", "戌"): (0.5, "미술파"),
    ("戌", "未"): (0.5, "미술파"),
}


def find_all_interactions(branches: List[str]) -> List[Interaction]:
    """
    지지 목록에서 모든 상호작용 찾기

    Args:
        branches: 지지 목록 (예: ["午", "巳", "子", "未"])

    Returns:
        발견된 모든 상호작용 목록
    """
    interactions = []

    for i, b1 in enumerate(branches):
        for j, b2 in enumerate(branches):
            if i >= j:
                continue

            pair = (b1, b2)

            # 합 확인
            if pair in BRANCH_COMBINATIONS:
                element, weight, desc = BRANCH_COMBINATIONS[pair]
                interactions.append(Interaction(
                    type=InteractionType.COMBINATION,
                    branches=(b1, b2),
                    weight=weight,
                    result_element=element,
                    description=desc
                ))

            # 충 확인
            if pair in BRANCH_CLASHES:
                weight, desc = BRANCH_CLASHES[pair]
                interactions.append(Interaction(
                    type=InteractionType.CLASH,
                    branches=(b1, b2),
                    weight=weight,
                    result_element="",
                    description=desc
                ))

            # 형 확인
            if pair in BRANCH_PUNISHMENTS:
                weight, desc = BRANCH_PUNISHMENTS[pair]
                interactions.append(Interaction(
                    type=InteractionType.PUNISHMENT,
                    branches=(b1, b2),
                    weight=weight,
                    result_element="",
                    description=desc
                ))

            # 해 확인
            if pair in BRANCH_HARMS:
                weight, desc = BRANCH_HARMS[pair]
                interactions.append(Interaction(
                    type=InteractionType.HARM,
                    branches=(b1, b2),
                    weight=weight,
                    result_element="",
                    description=desc
                ))

            # 파 확인
            if pair in BRANCH_DESTRUCTIONS:
                weight, desc = BRANCH_DESTRUCTIONS[pair]
                interactions.append(Interaction(
                    type=InteractionType.DESTRUCTION,
                    branches=(b1, b2),
                    weight=weight,
                    result_element="",
                    description=desc
                ))

    return interactions


def analyze_pillar_interactions(pillars: dict) -> Dict[str, List[Interaction]]:
    """
    사주 팔자의 지지 상호작용 분석

    Args:
        pillars: 사주 팔자 데이터
            {
                "year": {"stem": "庚", "branch": "午", ...},
                "month": {"stem": "辛", "branch": "巳", ...},
                ...
            }

    Returns:
        카테고리별 상호작용 목록
    """
    branches = [
        pillars["year"]["branch"],
        pillars["month"]["branch"],
        pillars["day"]["branch"],
        pillars["hour"]["branch"],
    ]

    all_interactions = find_all_interactions(branches)

    result = {
        "combinations": [],
        "clashes": [],
        "punishments": [],
        "harms": [],
        "destructions": [],
    }

    for interaction in all_interactions:
        if interaction.type == InteractionType.COMBINATION:
            result["combinations"].append(interaction)
        elif interaction.type == InteractionType.CLASH:
            result["clashes"].append(interaction)
        elif interaction.type == InteractionType.PUNISHMENT:
            result["punishments"].append(interaction)
        elif interaction.type == InteractionType.HARM:
            result["harms"].append(interaction)
        elif interaction.type == InteractionType.DESTRUCTION:
            result["destructions"].append(interaction)

    return result


def get_interaction_summary(interactions: Dict[str, List[Interaction]], language: str = 'ko') -> str:
    """
    상호작용 요약 문자열 생성 (프롬프트용)

    Args:
        interactions: analyze_pillar_interactions() 결과
        language: 언어 코드

    Returns:
        요약 문자열
    """
    parts = []

    if interactions["combinations"]:
        items = [i.description for i in interactions["combinations"]]
        parts.append("합(合): " + ", ".join(items))

    if interactions["clashes"]:
        items = [i.description for i in interactions["clashes"]]
        parts.append("충(沖): " + ", ".join(items))

    if interactions["punishments"]:
        items = [i.description for i in interactions["punishments"]]
        parts.append("형(刑): " + ", ".join(items))

    if interactions["harms"]:
        items = [i.description for i in interactions["harms"]]
        parts.append("해(害): " + ", ".join(items))

    if interactions["destructions"]:
        items = [i.description for i in interactions["destructions"]]
        parts.append("파(破): " + ", ".join(items))

    if not parts:
        return "특이 상호작용 없음"

    return " | ".join(parts)


def calculate_interaction_score(interactions: Dict[str, List[Interaction]]) -> float:
    """
    상호작용 종합 점수 계산

    PRD 기준 가중치:
    - 충(沖): 1.4x
    - 형(刑): 1.5x (송사/수술 위험)
    - 합(合): 1.0x
    - 해(害/原嗔): 0.8x
    - 파(破): 0.5x

    Returns:
        종합 점수 (양수: 길, 음수: 흉)
    """
    score = 0.0

    # 합: 긍정적
    for i in interactions["combinations"]:
        score += i.weight * 1.0

    # 충: 부정적 (1.4x)
    for i in interactions["clashes"]:
        score -= i.weight * 1.4

    # 형: 부정적 (1.5x)
    for i in interactions["punishments"]:
        score -= i.weight * 1.5

    # 해: 부정적 (0.8x)
    for i in interactions["harms"]:
        score -= i.weight * 0.8

    # 파: 부정적 (0.5x)
    for i in interactions["destructions"]:
        score -= i.weight * 0.5

    return round(score, 2)


def to_dict(interaction: Interaction) -> dict:
    """Interaction을 dict로 변환 (JSON 직렬화용)"""
    return {
        "type": interaction.type.value,
        "branches": interaction.branches,
        "weight": interaction.weight,
        "result_element": interaction.result_element,
        "description": interaction.description,
    }


def interactions_to_dict(interactions: Dict[str, List[Interaction]]) -> dict:
    """상호작용 분석 결과를 dict로 변환"""
    return {
        "combinations": [to_dict(i) for i in interactions["combinations"]],
        "clashes": [to_dict(i) for i in interactions["clashes"]],
        "punishments": [to_dict(i) for i in interactions["punishments"]],
        "harms": [to_dict(i) for i in interactions["harms"]],
        "destructions": [to_dict(i) for i in interactions["destructions"]],
        "summary": get_interaction_summary(interactions),
        "score": calculate_interaction_score(interactions),
    }
