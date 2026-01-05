"""
사건 강도 점수 계산 모듈
사주 원국(Natal)과 세운(Dynamic)의 길흉을 수치화

Score Logic (v5.0 - Task 5):
최종점수 = clamp(기본점수 + 세운조정값, -100, +100)

기본점수(Natal) = 격국품질점수(-20~+30) + 신살점수(-20~+20) + 사주내상호작용점수(-20~+20)
세운조정값(Dynamic) = 세운십신점수(-30~+30) + 세운상호작용점수(-20~+20)
"""
from typing import List, Dict, Optional, Tuple, Literal
from dataclasses import dataclass

# 상대 import (manseryeok 모듈)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from manseryeok.formation import FormationResult
from manseryeok.sinsal import Sinsal
from manseryeok.interactions import (
    Interaction,
    InteractionType,
    BRANCH_COMBINATIONS,
    BRANCH_CLASHES,
    BRANCH_PUNISHMENTS,
    BRANCH_HARMS,
    BRANCH_DESTRUCTIONS,
)
from manseryeok.constants import (
    STEM_TO_ELEMENT,
    ELEMENT_GENERATES,
    ELEMENT_OVERCOMES,
    HEAVENLY_STEMS,
    EARTHLY_BRANCHES,
)


# ============================================
# 다국어 문자열 (i18n)
# ============================================

SCORE_STRINGS = {
    "formation_quality": {
        "ko": "격국 품질({type}, {quality}): {score:+.1f}",
        "en": "Formation quality ({type}, {quality}): {score:+.1f}",
        "ja": "格局品質（{type}、{quality}）：{score:+.1f}",
        "zh-CN": "格局品质（{type}，{quality}）：{score:+.1f}",
        "zh-TW": "格局品質（{type}，{quality}）：{score:+.1f}",
    },
    "sinsal": {
        "ko": "신살 (길신:{lucky}, 흉신:{unlucky}): {score:+.1f}",
        "en": "Sinsal (Lucky:{lucky}, Unlucky:{unlucky}): {score:+.1f}",
        "ja": "神殺（吉神：{lucky}、凶神：{unlucky}）：{score:+.1f}",
        "zh-CN": "神煞（吉神：{lucky}，凶神：{unlucky}）：{score:+.1f}",
        "zh-TW": "神煞（吉神：{lucky}，凶神：{unlucky}）：{score:+.1f}",
    },
    "sinsal_empty": {
        "ko": "신살: {score:+.1f}",
        "en": "Sinsal: {score:+.1f}",
        "ja": "神殺：{score:+.1f}",
        "zh-CN": "神煞：{score:+.1f}",
        "zh-TW": "神煞：{score:+.1f}",
    },
    "natal_interactions": {
        "ko": "원국 상호작용: {score:+.1f}",
        "en": "Natal interactions: {score:+.1f}",
        "ja": "命式相互作用：{score:+.1f}",
        "zh-CN": "命局互动：{score:+.1f}",
        "zh-TW": "命局互動：{score:+.1f}",
    },
    "year_stem": {
        "ko": "세운 천간 {stem}({element}): {score:+.1f}",
        "en": "Year stem {stem}({element}): {score:+.1f}",
        "ja": "年干 {stem}（{element}）：{score:+.1f}",
        "zh-CN": "流年天干 {stem}（{element}）：{score:+.1f}",
        "zh-TW": "流年天干 {stem}（{element}）：{score:+.1f}",
    },
    "year_branch": {
        "ko": "세운 지지 {branch} 상호작용: {score:+.1f}",
        "en": "Year branch {branch} interactions: {score:+.1f}",
        "ja": "年支 {branch} 相互作用：{score:+.1f}",
        "zh-CN": "流年地支 {branch} 互动：{score:+.1f}",
        "zh-TW": "流年地支 {branch} 互動：{score:+.1f}",
    },
    "no_year": {
        "ko": "세운 정보 없음 (기본 점수만 산출)",
        "en": "No year info (base score only)",
        "ja": "年運情報なし（基本点のみ）",
        "zh-CN": "无流年信息（仅基础分）",
        "zh-TW": "無流年資訊（僅基礎分）",
    },
    "final": {
        "ko": "--- 최종: {score:+.1f} ({label})",
        "en": "--- Final: {score:+.1f} ({label})",
        "ja": "--- 最終：{score:+.1f}（{label}）",
        "zh-CN": "--- 最终：{score:+.1f}（{label}）",
        "zh-TW": "--- 最終：{score:+.1f}（{label}）",
    },
}


def _get_string(key: str, language: str, **kwargs) -> str:
    """다국어 문자열 포맷팅"""
    template = SCORE_STRINGS.get(key, {}).get(language)
    if not template:
        template = SCORE_STRINGS.get(key, {}).get("ko", "")
    return template.format(**kwargs)


# ============================================
# Task 5.1.3: 사건 강도 변환 테이블
# ============================================

@dataclass
class EventIntensity:
    """사건 강도 정보"""
    level: Literal["HIGH", "MID", "LOW", "WARNING", "CRITICAL"]
    label: Dict[str, str]  # 다국어 라벨
    probability: str       # 확률 표시
    description: Dict[str, str]  # 다국어 설명


# 점수 범위 → 강도 매핑
EVENT_INTENSITY_TABLE: Dict[Tuple[int, int], EventIntensity] = {
    (60, 100): EventIntensity(
        level="HIGH",
        label={"ko": "대길", "en": "Highly Favorable", "ja": "大吉", "zh-CN": "大吉", "zh-TW": "大吉"},
        probability="90%+",
        description={
            "ko": "매우 좋은 기운이 감지됩니다. 중요한 결정을 내리기에 좋은 시기입니다.",
            "en": "Very favorable energy detected. Good time for important decisions.",
            "ja": "非常に良い運気が感じられます。重要な決定に適した時期です。",
            "zh-CN": "非常好的运势。适合做重要决定。",
            "zh-TW": "非常好的運勢。適合做重要決定。",
        }
    ),
    (20, 60): EventIntensity(
        level="MID",
        label={"ko": "길", "en": "Favorable", "ja": "吉", "zh-CN": "吉", "zh-TW": "吉"},
        probability="70%+",
        description={
            "ko": "전반적으로 긍정적인 흐름입니다. 순조로운 진행이 예상됩니다.",
            "en": "Overall positive flow. Smooth progress expected.",
            "ja": "全般的に良い流れです。順調な進行が予想されます。",
            "zh-CN": "整体运势积极。预期进展顺利。",
            "zh-TW": "整體運勢積極。預期進展順利。",
        }
    ),
    (-20, 20): EventIntensity(
        level="LOW",
        label={"ko": "평", "en": "Neutral", "ja": "平", "zh-CN": "平", "zh-TW": "平"},
        probability="50%",
        description={
            "ko": "평범한 시기입니다. 큰 변화 없이 안정적으로 유지됩니다.",
            "en": "Neutral period. Stability without major changes.",
            "ja": "平凡な時期です。大きな変化なく安定しています。",
            "zh-CN": "平常时期。没有大变化，保持稳定。",
            "zh-TW": "平常時期。沒有大變化，保持穩定。",
        }
    ),
    (-60, -20): EventIntensity(
        level="WARNING",
        label={"ko": "주의", "en": "Caution", "ja": "注意", "zh-CN": "注意", "zh-TW": "注意"},
        probability="70%+",
        description={
            "ko": "주의가 필요한 시기입니다. 신중한 판단이 요구됩니다.",
            "en": "Period requiring caution. Careful judgment needed.",
            "ja": "注意が必要な時期です。慎重な判断が求められます。",
            "zh-CN": "需要注意的时期。需要谨慎判断。",
            "zh-TW": "需要注意的時期。需要謹慎判斷。",
        }
    ),
    (-100, -60): EventIntensity(
        level="CRITICAL",
        label={"ko": "흉", "en": "Challenging", "ja": "凶", "zh-CN": "凶", "zh-TW": "凶"},
        probability="90%+",
        description={
            "ko": "도전적인 시기입니다. 중요한 결정은 미루고 방어적으로 대처하세요.",
            "en": "Challenging period. Postpone major decisions and be defensive.",
            "ja": "挑戦的な時期です。重要な決定は延期し、守備的に対処してください。",
            "zh-CN": "挑战期。推迟重要决定，采取防御态度。",
            "zh-TW": "挑戰期。推遲重要決定，採取防禦態度。",
        }
    ),
}


def get_event_intensity(score: float, language: str = "ko") -> Dict[str, str]:
    """
    점수 → 사건 강도 변환

    Args:
        score: 최종 점수 (-100 ~ +100)
        language: 언어 코드

    Returns:
        {level, label, probability, description}
    """
    for (min_val, max_val), intensity in EVENT_INTENSITY_TABLE.items():
        if min_val <= score < max_val:
            return {
                "level": intensity.level,
                "label": intensity.label.get(language, intensity.label["ko"]),
                "probability": intensity.probability,
                "description": intensity.description.get(language, intensity.description["ko"]),
            }

    # 범위 외 (clamp 되어 있으므로 도달하지 않아야 함)
    if score >= 100:
        intensity = EVENT_INTENSITY_TABLE[(60, 100)]
    else:
        intensity = EVENT_INTENSITY_TABLE[(-100, -60)]

    return {
        "level": intensity.level,
        "label": intensity.label.get(language, intensity.label["ko"]),
        "probability": intensity.probability,
        "description": intensity.description.get(language, intensity.description["ko"]),
    }


# ============================================
# Task 5.1.1: 점수 계산 함수들
# ============================================

@dataclass
class EventScore:
    """이벤트/세운 점수 결과"""
    total: float                    # 최종 점수 (-100 ~ +100)
    natal_score: float              # 사주 원국 기본 점수 (-60 ~ +70)
    dynamic_modifier: float         # 세운/대운 조정값 (-50 ~ +50)
    components: Dict[str, float]    # 세부 항목 점수
    explanation: List[str]          # 점수 산출 근거 (AI 프롬프트용)
    intensity: Optional[Dict[str, str]] = None  # 강도 정보


def _clamp(value: float, min_val: float, max_val: float) -> float:
    """값을 범위 내로 제한"""
    return max(min_val, min(value, max_val))


def calculate_formation_quality_score(formation: FormationResult) -> float:
    """
    격국 품질 점수 계산 (-20 ~ +30)

    기준:
    - 품질 상(High): +20
    - 품질 중(Mid): +10
    - 품질 하(Low): 0
    - 투출(Transparent): +10
    - 잡격: -10
    - 신강/신약 균형: 중화 +5
    """
    score = 0.0

    # 기본 품질 점수
    if formation.quality == "상":
        score += 20
    elif formation.quality == "중":
        score += 10
    # "하"는 0점

    # 투출 가산점
    if formation.is_transparent:
        score += 10

    # 잡격인 경우 감점
    if formation.formation_type == "잡격":
        score -= 10

    # 중화 보너스
    if formation.day_strength == "중화":
        score += 5

    return _clamp(score, -20, 30)


def calculate_sinsal_score(sinsals: List[Sinsal]) -> float:
    """
    신살 점수 계산 (-20 ~ +20)

    기준:
    - 길신: weight * 5 (가산)
    - 흉신: weight * 5 (감산)
    """
    score = 0.0

    for s in sinsals:
        if s.is_lucky:
            score += s.weight * 5
        else:
            score -= s.weight * 5

    return _clamp(score, -20, 20)


def calculate_natal_interactions(interactions: Dict[str, List[Interaction]]) -> float:
    """
    사주 원국 상호작용 점수 (-20 ~ +20)

    기준 (PRD 가중치 반영):
    - 합: +5 × weight
    - 충: -6 × weight (1.4x 반영)
    - 형: -7.5 × weight (1.5x 반영)
    - 해: -4 × weight (0.8x 반영)
    - 파: -2.5 × weight (0.5x 반영)
    """
    score = 0.0

    # 합 (긍정)
    for i in interactions.get("combinations", []):
        score += i.weight * 5

    # 충 (부정, 강함 - 1.4x)
    for i in interactions.get("clashes", []):
        score -= i.weight * 6

    # 형 (부정 - 1.5x)
    for i in interactions.get("punishments", []):
        score -= i.weight * 7.5

    # 해 (부정, 약함 - 0.8x)
    for i in interactions.get("harms", []):
        score -= i.weight * 4

    # 파 (부정, 약함 - 0.5x)
    for i in interactions.get("destructions", []):
        score -= i.weight * 2.5

    return _clamp(score, -20, 20)


# ============================================
# Task 5.1.2: 세운 관련 점수 함수들
# ============================================

def determine_yongshin_elements(day_strength: str, day_master: str) -> Tuple[List[str], List[str]]:
    """
    용신(좋은 오행)과 기신(나쁜 오행) 판단

    Args:
        day_strength: 신강/신약/중화
        day_master: 일간 (예: "甲")

    Returns:
        (용신_오행_목록, 기신_오행_목록)
    """
    me = STEM_TO_ELEMENT.get(day_master, "木")

    # 오행 관계 계산
    output = ELEMENT_GENERATES.get(me, "火")      # 식상 (내가 생)
    wealth = ELEMENT_OVERCOMES.get(me, "土")      # 재성 (내가 극)

    # 역추적
    officer = None
    for k, v in ELEMENT_OVERCOMES.items():
        if v == me:
            officer = k  # 관성 (나를 극)
            break
    officer = officer or "金"

    resource = None
    for k, v in ELEMENT_GENERATES.items():
        if v == me:
            resource = k  # 인성 (나를 생)
            break
    resource = resource or "水"

    companion = me  # 비겁 (나와 같음)

    if day_strength == "신강":
        # 신강하면 설기(식상)하거나 극(관성)하거나 소모(재성)해야 함
        yongshin = [officer, output, wealth]
        kishin = [resource, companion]

    elif day_strength == "신약":
        # 신약하면 생조(인성)하거나 부조(비겁)해야 함
        yongshin = [resource, companion]
        kishin = [officer, output, wealth]

    else:  # 중화
        # 중화는 조후나 통관을 봄. 일반적으로 식상/재성을 긍정적으로 봄
        yongshin = [output, wealth]
        kishin = [officer]  # 중화에서 관성 과다는 부담

    return yongshin, kishin


def calculate_year_ten_god_score(
    day_master: str,
    year_stem: str,
    yongshin_elements: List[str],
    kishin_elements: List[str]
) -> float:
    """
    세운 천간 십신 점수 (-30 ~ +30)

    Args:
        day_master: 일간
        year_stem: 세운 천간
        yongshin_elements: 용신(좋은) 오행 목록
        kishin_elements: 기신(나쁜) 오행 목록

    Returns:
        점수 (-30 ~ +30)
    """
    target_element = STEM_TO_ELEMENT.get(year_stem, "木")

    # 1. 용신(Good)에 해당하는지
    if target_element in yongshin_elements:
        # 첫 번째 용신이면 최고 점수
        if len(yongshin_elements) > 0 and target_element == yongshin_elements[0]:
            return 30  # 용신
        return 20  # 희신

    # 2. 기신(Bad)에 해당하는지
    if target_element in kishin_elements:
        if len(kishin_elements) > 0 and target_element == kishin_elements[0]:
            return -30  # 기신
        return -20  # 구신

    # 3. 중립
    return 0


def calculate_year_interaction_score(
    natal_branches: List[str],
    year_branch: str
) -> float:
    """
    세운 지지와 원국 지지의 상호작용 점수 (-20 ~ +20)

    Args:
        natal_branches: 원국 지지 4개 (년월일시)
        year_branch: 세운 지지

    Returns:
        점수 (-20 ~ +20)
    """
    score = 0.0

    for branch in natal_branches:
        pair = (branch, year_branch)
        rev_pair = (year_branch, branch)

        found = False

        # 합 (긍정)
        if pair in BRANCH_COMBINATIONS or rev_pair in BRANCH_COMBINATIONS:
            score += 10
            found = True

        if not found:
            # 충 (부정, 강함)
            if pair in BRANCH_CLASHES or rev_pair in BRANCH_CLASHES:
                score -= 15
                found = True

        if not found:
            # 형
            if pair in BRANCH_PUNISHMENTS or rev_pair in BRANCH_PUNISHMENTS:
                score -= 10
                found = True

        if not found:
            # 해
            if pair in BRANCH_HARMS or rev_pair in BRANCH_HARMS:
                score -= 5
                found = True

        if not found:
            # 파
            if pair in BRANCH_DESTRUCTIONS or rev_pair in BRANCH_DESTRUCTIONS:
                score -= 3

    return _clamp(score, -20, 20)


def get_year_ganzhi(year: int) -> Tuple[str, str]:
    """
    연도 → 천간지지 변환 (만세력 공식)

    Args:
        year: 연도 (예: 2026)

    Returns:
        (천간, 지지)
    """
    # 천간: (year - 4) % 10
    stem_idx = (year - 4) % 10
    stem = HEAVENLY_STEMS[stem_idx]

    # 지지: (year - 4) % 12
    branch_idx = (year - 4) % 12
    branch = EARTHLY_BRANCHES[branch_idx]

    return stem, branch


# ============================================
# 메인 함수: 통합 점수 계산
# ============================================

def calculate_event_score(
    formation: FormationResult,
    sinsals: List[Sinsal],
    natal_interactions: Dict[str, List[Interaction]],
    pillars: dict,
    current_year: Optional[int] = None,
    language: str = "ko"
) -> EventScore:
    """
    통합 이벤트 점수 계산

    Args:
        formation: 격국 분석 결과
        sinsals: 신살 분석 결과
        natal_interactions: 원국 상호작용
        pillars: 원국 데이터 (일간, 지지 목록 추출용)
        current_year: 분석 대상 연도 (선택)
        language: 언어 코드

    Returns:
        EventScore 객체
    """
    explanation = []

    # ========================================
    # 1. Natal Score Calculation (사주 원국)
    # ========================================
    score_formation = calculate_formation_quality_score(formation)
    explanation.append(_get_string(
        "formation_quality", language,
        type=formation.formation_type, quality=formation.quality, score=score_formation
    ))

    score_sinsal = calculate_sinsal_score(sinsals)
    if sinsals:
        lucky_count = sum(1 for s in sinsals if s.is_lucky)
        unlucky_count = len(sinsals) - lucky_count
        explanation.append(_get_string(
            "sinsal", language,
            lucky=lucky_count, unlucky=unlucky_count, score=score_sinsal
        ))
    else:
        explanation.append(_get_string("sinsal_empty", language, score=score_sinsal))

    score_natal_inter = calculate_natal_interactions(natal_interactions)
    explanation.append(_get_string("natal_interactions", language, score=score_natal_inter))

    natal_total = _clamp(score_formation + score_sinsal + score_natal_inter, -60, 70)

    # ========================================
    # 2. Dynamic Modifier Calculation (세운)
    # ========================================
    dynamic_total = 0.0
    score_year_stem = 0.0
    score_year_branch = 0.0

    if current_year:
        day_master = pillars.get("day", {}).get("stem", "甲")
        year_stem, year_branch = get_year_ganzhi(current_year)

        # 용신/기신 오행 판단
        yongshin, kishin = determine_yongshin_elements(formation.day_strength, day_master)

        # 세운 천간 점수
        score_year_stem = calculate_year_ten_god_score(
            day_master, year_stem, yongshin, kishin
        )
        year_element = STEM_TO_ELEMENT.get(year_stem, "?")
        explanation.append(_get_string(
            "year_stem", language,
            stem=year_stem, element=year_element, score=score_year_stem
        ))

        # 세운 지지 상호작용 점수
        natal_branches = [
            pillars.get("year", {}).get("branch", ""),
            pillars.get("month", {}).get("branch", ""),
            pillars.get("day", {}).get("branch", ""),
            pillars.get("hour", {}).get("branch", ""),
        ]
        natal_branches = [b for b in natal_branches if b]  # 빈 값 제거

        if natal_branches:
            score_year_branch = calculate_year_interaction_score(natal_branches, year_branch)
            explanation.append(_get_string(
                "year_branch", language,
                branch=year_branch, score=score_year_branch
            ))

        dynamic_total = _clamp(score_year_stem + score_year_branch, -50, 50)

    else:
        explanation.append(_get_string("no_year", language))

    # ========================================
    # 3. Final Total
    # ========================================
    total_raw = natal_total + dynamic_total
    total_clamped = _clamp(total_raw, -100, 100)

    # 강도 정보 추가
    intensity = get_event_intensity(total_clamped, language)

    explanation.append(_get_string(
        "final", language,
        score=total_clamped, label=intensity['label']
    ))

    return EventScore(
        total=total_clamped,
        natal_score=natal_total,
        dynamic_modifier=dynamic_total,
        components={
            "formation": score_formation,
            "sinsal": score_sinsal,
            "natal_interactions": score_natal_inter,
            "year_stem": score_year_stem,
            "year_branch": score_year_branch,
        },
        explanation=explanation,
        intensity=intensity,
    )


# ============================================
# Task 5.3.2: 점수 컨텍스트 포맷팅 (프롬프트용)
# ============================================

# 점수 컨텍스트 헤더 다국어 (i18n)
CONTEXT_HEADERS = {
    "header": {
        "ko": "## 규칙 기반 점수 분석 (참조용)",
        "en": "## Rule-Based Scoring Analysis (Reference)",
        "ja": "## ルールベース点数分析（参照用）",
        "zh-CN": "## 规则评分分析（参考）",
        "zh-TW": "## 規則評分分析（參考）",
    },
    "total_score": {
        "ko": "**종합 점수**",
        "en": "**Total Score**",
        "ja": "**総合点数**",
        "zh-CN": "**综合分数**",
        "zh-TW": "**綜合分數**",
    },
    "breakdown": {
        "ko": "### 점수 내역:",
        "en": "### Score Breakdown:",
        "ja": "### 点数内訳：",
        "zh-CN": "### 分数明细：",
        "zh-TW": "### 分數明細：",
    },
    "instruction": {
        "ko": "위 점수를 참고하여 서술적 분석을 작성해주세요.",
        "en": "Please refer to these scores when writing the analysis narrative.",
        "ja": "上記の点数を参考にして、記述的な分析を作成してください。",
        "zh-CN": "请参考以上分数撰写分析叙述。",
        "zh-TW": "請參考以上分數撰寫分析敘述。",
    },
    "na": {
        "ko": "정보없음",
        "en": "N/A",
        "ja": "情報なし",
        "zh-CN": "无信息",
        "zh-TW": "無資訊",
    },
}


def format_score_context(score: EventScore, language: str = "ko") -> str:
    """
    점수 결과를 AI 프롬프트용 문자열로 변환

    Args:
        score: EventScore 객체
        language: 언어 코드

    Returns:
        프롬프트에 삽입할 문자열
    """
    # 헤더 문자열 가져오기 (폴백: 한국어)
    def get_header(key: str) -> str:
        return CONTEXT_HEADERS.get(key, {}).get(language, CONTEXT_HEADERS.get(key, {}).get("ko", ""))

    intensity_label = score.intensity['label'] if score.intensity else get_header("na")

    lines = [
        get_header("header"),
        "",
        f"{get_header('total_score')}: {score.total:+.1f} ({intensity_label})",
        "",
        get_header("breakdown"),
    ]
    lines.extend([f"- {exp}" for exp in score.explanation])
    lines.append("")
    lines.append(get_header("instruction"))

    return "\n".join(lines)
