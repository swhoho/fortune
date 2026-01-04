"""
격국(格局) 자동 분류 모듈

격국 판별 기준:
1. 월지(月支) 정기의 십신 관계
2. 투출(透出) 여부 - 지장간이 천간에 드러났는지

8정격(正格):
- 정관격, 편관격, 정인격, 편인격
- 식신격, 상관격, 정재격, 편재격

특수격: (추후 확장)
- 종격, 화격, 양인격, 건록격 등
"""
from typing import Dict, List, Optional, NamedTuple
from dataclasses import dataclass
from .constants import (
    HEAVENLY_STEMS,
    YANG_STEMS,
    YIN_STEMS,
    STEM_TO_ELEMENT,
    JIJANGGAN_TABLE,
    ELEMENT_GENERATES,
    ELEMENT_OVERCOMES,
)
from .ten_gods import determine_ten_god, get_category_totals


@dataclass
class FormationResult:
    """격국 분석 결과"""
    formation_type: str  # 격국 이름 (예: "정관격")
    quality: str  # 품질 (상/중/하)
    day_strength: str  # 신강/신약/중화
    is_transparent: bool  # 투출 여부
    month_branch_god: str  # 월지 정기 십신
    description: str  # 설명


# 격국 이름
FORMATION_NAMES = {
    "정관": "정관격",
    "편관": "편관격",
    "정인": "정인격",
    "편인": "편인격",
    "식신": "식신격",
    "상관": "상관격",
    "정재": "정재격",
    "편재": "편재격",
    "비견": "건록격",  # 월지 정기가 비견이면 건록격
    "겁재": "양인격",  # 월지 정기가 겁재이면 양인격
}

# 격국 영문명
FORMATION_ENGLISH = {
    "정관격": "Direct Officer Frame",
    "편관격": "Seven Killings Frame",
    "정인격": "Direct Resource Frame",
    "편인격": "Indirect Resource Frame",
    "식신격": "Eating God Frame",
    "상관격": "Hurting Officer Frame",
    "정재격": "Direct Wealth Frame",
    "편재격": "Indirect Wealth Frame",
    "건록격": "Shoulder Frame",
    "양인격": "Rob Wealth Frame",
}

# 격국별 기본 설명
FORMATION_DESCRIPTIONS = {
    "정관격": "규율과 책임감이 강하며, 조직 내에서 인정받기 쉽다",
    "편관격": "카리스마와 추진력이 있으나, 압박과 도전이 따른다",
    "정인격": "학문적 소양과 인내심이 있으며, 지혜로운 조언자 역할",
    "편인격": "독창적 사고와 예술적 감각이 있으나, 고독할 수 있다",
    "식신격": "창의력과 표현력이 뛰어나며, 안정적인 복록을 누린다",
    "상관격": "재능이 출중하나 반항적 기질이 있어 관직과 충돌 가능",
    "정재격": "근면성실하고 재물 관리 능력이 뛰어나다",
    "편재격": "사업적 수완이 있으나 투기적 성향에 주의 필요",
    "건록격": "자립심이 강하고 독립적이나, 형제 갈등 주의",
    "양인격": "강인한 의지와 결단력이 있으나, 충동성 주의",
}


def _get_month_jijanggan(month_branch: str) -> List[str]:
    """월지의 지장간 반환"""
    return JIJANGGAN_TABLE.get(month_branch, [])


def _get_main_qi(month_branch: str) -> str:
    """월지의 정기(正氣) 반환 (지장간 마지막 요소)"""
    jijanggan = _get_month_jijanggan(month_branch)
    if jijanggan:
        return jijanggan[-1]  # 마지막이 정기
    return ""


def _check_transparency(pillars: dict, target_stem: str) -> bool:
    """
    투출(透出) 확인 - 지장간이 천간에 드러났는지

    Args:
        pillars: 사주 팔자
        target_stem: 확인할 천간

    Returns:
        천간에 해당 글자가 있으면 True
    """
    for key in ["year", "month", "hour"]:
        if pillars[key]["stem"] == target_stem:
            return True
    return False


def _assess_day_strength(ten_god_counts: Dict[str, float]) -> str:
    """
    일간 강약 판단

    신강: 인성 + 비겁 > 재성 + 관성 + 식상
    신약: 인성 + 비겁 < 재성 + 관성 + 식상
    중화: 비슷함

    Args:
        ten_god_counts: 십신 가중치 합계

    Returns:
        "신강" | "신약" | "중화"
    """
    categories = get_category_totals(ten_god_counts)

    # 나를 돕는 세력: 인성 + 비겁
    supporting = categories.get("인성", 0) + categories.get("비겁", 0)

    # 나를 소모하는 세력: 재성 + 관성 + 식상
    draining = (
        categories.get("재성", 0) +
        categories.get("관성", 0) +
        categories.get("식상", 0)
    )

    diff = supporting - draining

    if diff > 1.5:
        return "신강"
    elif diff < -1.5:
        return "신약"
    else:
        return "중화"


def _assess_formation_quality(
    formation_type: str,
    ten_god_counts: Dict[str, float],
    is_transparent: bool,
    day_strength: str
) -> str:
    """
    격국 품질 평가

    상(上): 격국 투출 + 용신 배치 양호
    중(中): 격국 성립하나 투출 없음
    하(下): 격국 파손 또는 상충

    Args:
        formation_type: 격국 이름
        ten_god_counts: 십신 분포
        is_transparent: 투출 여부
        day_strength: 신강/신약/중화

    Returns:
        "상" | "중" | "하"
    """
    # 기본 품질 점수
    quality_score = 0

    # 투출 시 +2점
    if is_transparent:
        quality_score += 2

    # 격국별 용신 배치 확인
    categories = get_category_totals(ten_god_counts)

    # 신강한데 재관이 있으면 좋음 (재관용신)
    if day_strength == "신강":
        if categories.get("재성", 0) >= 1.0 or categories.get("관성", 0) >= 1.0:
            quality_score += 1

    # 신약한데 인비가 있으면 좋음 (인비용신)
    if day_strength == "신약":
        if categories.get("인성", 0) >= 1.0 or categories.get("비겁", 0) >= 1.0:
            quality_score += 1

    # 중화는 기본 +1
    if day_strength == "중화":
        quality_score += 1

    # 격국 특수 평가
    # 상관격인데 정관이 있으면 상관견관 - 감점
    if formation_type == "상관격":
        if ten_god_counts.get("정관", 0) >= 1.0:
            quality_score -= 1

    # 식신격인데 편인이 있으면 효신탈식 - 감점
    if formation_type == "식신격":
        if ten_god_counts.get("편인", 0) >= 1.0:
            quality_score -= 1

    # 점수 → 등급
    if quality_score >= 3:
        return "상"
    elif quality_score >= 1:
        return "중"
    else:
        return "하"


def determine_formation(
    pillars: dict,
    jijanggan: dict,
    ten_god_counts: Dict[str, float]
) -> FormationResult:
    """
    격국 자동 분류

    Args:
        pillars: 사주 팔자
            {
                "year": {"stem": "庚", "branch": "午"},
                "month": {"stem": "辛", "branch": "巳"},
                "day": {"stem": "甲", "branch": "子"},
                "hour": {"stem": "辛", "branch": "未"},
            }
        jijanggan: 지장간 (참조용)
        ten_god_counts: 십신 분포 (extract_ten_gods 결과)

    Returns:
        FormationResult 객체
    """
    day_master = pillars["day"]["stem"]
    month_branch = pillars["month"]["branch"]

    # 1. 월지 정기 추출
    main_qi = _get_main_qi(month_branch)
    if not main_qi:
        # 정기를 찾을 수 없는 경우 기본값
        return FormationResult(
            formation_type="잡격",
            quality="하",
            day_strength="중화",
            is_transparent=False,
            month_branch_god="",
            description="격국 판별 불가"
        )

    # 2. 월지 정기의 십신 판별
    month_god = determine_ten_god(day_master, main_qi)

    # 3. 격국 이름 결정
    formation_type = FORMATION_NAMES.get(month_god, "잡격")

    # 4. 투출 확인
    is_transparent = _check_transparency(pillars, main_qi)

    # 5. 일간 강약 판단
    day_strength = _assess_day_strength(ten_god_counts)

    # 6. 격국 품질 평가
    quality = _assess_formation_quality(
        formation_type, ten_god_counts, is_transparent, day_strength
    )

    # 7. 설명 생성
    description = FORMATION_DESCRIPTIONS.get(formation_type, "")

    return FormationResult(
        formation_type=formation_type,
        quality=quality,
        day_strength=day_strength,
        is_transparent=is_transparent,
        month_branch_god=month_god,
        description=description
    )


def format_formation(result: FormationResult, language: str = 'ko') -> str:
    """
    격국 결과 포맷팅 (프롬프트용)

    Args:
        result: FormationResult 객체
        language: 언어 코드

    Returns:
        포맷된 문자열
    """
    if language == 'en':
        formation_en = FORMATION_ENGLISH.get(result.formation_type, result.formation_type)
        strength_map = {"신강": "Strong", "신약": "Weak", "중화": "Balanced"}
        quality_map = {"상": "High", "중": "Medium", "하": "Low"}
        transparent = "Yes" if result.is_transparent else "No"

        return (
            f"Formation: {formation_en} ({quality_map[result.quality]} quality)\n"
            f"Day Master: {strength_map[result.day_strength]}\n"
            f"Transparency: {transparent}"
        )
    else:
        transparent = "투출" if result.is_transparent else "미투출"
        return (
            f"격국: {result.formation_type} (품질: {result.quality})\n"
            f"일간: {result.day_strength}\n"
            f"월지정기: {result.month_branch_god} ({transparent})\n"
            f"해석: {result.description}"
        )


def formation_to_dict(result: FormationResult) -> dict:
    """FormationResult를 dict로 변환"""
    return {
        "formation_type": result.formation_type,
        "formation_english": FORMATION_ENGLISH.get(result.formation_type, ""),
        "quality": result.quality,
        "day_strength": result.day_strength,
        "is_transparent": result.is_transparent,
        "month_branch_god": result.month_branch_god,
        "description": result.description,
    }


def get_formation_summary(result: FormationResult) -> str:
    """격국 요약 (짧은 버전)"""
    transparent = "투출" if result.is_transparent else ""
    return f"{result.formation_type}({result.quality}) - {result.day_strength} {transparent}".strip()
