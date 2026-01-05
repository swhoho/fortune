"""
점수-서술 일관성 검증 모듈
AI 생성 서술이 규칙 기반 점수와 일관되는지 검증

v5.0 - Task 5.3.3 구현
"""
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ConsistencyLevel(Enum):
    """일관성 수준"""
    CONSISTENT = "consistent"           # 완전 일관
    MINOR_DISCREPANCY = "minor"         # 경미한 불일치
    MAJOR_DISCREPANCY = "major"         # 중대한 불일치
    CONTRADICTION = "contradiction"     # 모순


@dataclass
class ValidationResult:
    """검증 결과"""
    level: ConsistencyLevel
    score: float                        # 0.0 ~ 1.0
    issues: List[str]                   # 발견된 문제
    suggestions: List[str]              # 개선 제안


# 점수 범위별 키워드 (길/흉 감정) - 도메인 특화 키워드 포함
POSITIVE_KEYWORDS = {
    "ko": [
        "좋", "길", "발전", "성공", "성장", "행운", "호조", "순조", "희망", "기회", "번영", "상승", "득",
        "승진", "합격", "결혼", "취업", "계약", "협력", "화합", "인연", "횡재", "수입", "안정", "건강",
        "명예", "인기", "창작", "혁신", "돌파", "인정", "효도", "풍요", "보호", "학업", "자격",
    ],
    "en": [
        "good", "favorable", "success", "growth", "luck", "opportunity", "prosperity", "rise", "gain", "positive",
        "promotion", "marriage", "employment", "contract", "cooperation", "harmony", "fortune", "income", "stable",
        "health", "honor", "popular", "creative", "innovation", "breakthrough", "recognition", "abundance",
    ],
    "ja": [
        "良", "吉", "発展", "成功", "成長", "幸運", "順調", "希望", "機会", "繁栄", "上昇", "得",
        "昇進", "合格", "結婚", "就職", "契約", "協力", "調和", "縁", "横財", "収入", "安定", "健康",
        "名誉", "人気", "創作", "革新", "突破", "認知", "豊穣", "保護", "学業", "資格",
    ],
    "zh-CN": [
        "好", "吉", "发展", "成功", "成长", "幸运", "顺利", "希望", "机会", "繁荣", "上升", "得",
        "升职", "通过", "结婚", "就业", "合同", "合作", "和谐", "缘分", "横财", "收入", "稳定", "健康",
        "名誉", "人气", "创作", "创新", "突破", "认可", "富足", "保护", "学业", "资格",
    ],
    "zh-TW": [
        "好", "吉", "發展", "成功", "成長", "幸運", "順利", "希望", "機會", "繁榮", "上升", "得",
        "升職", "通過", "結婚", "就業", "合同", "合作", "和諧", "緣分", "橫財", "收入", "穩定", "健康",
        "名譽", "人氣", "創作", "創新", "突破", "認可", "富足", "保護", "學業", "資格",
    ],
}

NEGATIVE_KEYWORDS = {
    "ko": [
        "나쁘", "흉", "실패", "손실", "위험", "주의", "어려", "장애", "갈등", "하락", "실", "조심", "경계",
        "사고", "질병", "수술", "해고", "이별", "파산", "도난", "사기", "송사", "관재", "배신", "구속",
        "스트레스", "불안", "우울", "피해", "분쟁", "충돌", "파괴", "손상", "고독", "압박",
    ],
    "en": [
        "bad", "unfavorable", "fail", "loss", "risk", "caution", "difficult", "obstacle", "conflict", "decline", "careful",
        "accident", "illness", "surgery", "dismissal", "breakup", "bankruptcy", "theft", "fraud", "lawsuit", "betrayal",
        "detention", "stress", "anxiety", "depression", "damage", "dispute", "clash", "destruction", "loneliness", "pressure",
    ],
    "ja": [
        "悪", "凶", "失敗", "損失", "危険", "注意", "困難", "障害", "葛藤", "下落", "失", "気をつけ",
        "事故", "病気", "手術", "解雇", "別れ", "破産", "盗難", "詐欺", "訴訟", "裏切り", "拘束",
        "ストレス", "不安", "憂鬱", "被害", "紛争", "衝突", "破壊", "損傷", "孤独", "プレッシャー",
    ],
    "zh-CN": [
        "坏", "凶", "失败", "损失", "危险", "注意", "困难", "障碍", "冲突", "下降", "失", "小心",
        "事故", "疾病", "手术", "解雇", "分手", "破产", "盗窃", "诈骗", "诉讼", "背叛", "拘留",
        "压力", "焦虑", "抑郁", "伤害", "纠纷", "冲突", "破坏", "损伤", "孤独", "压迫",
    ],
    "zh-TW": [
        "壞", "凶", "失敗", "損失", "危險", "注意", "困難", "障礙", "衝突", "下降", "失", "小心",
        "事故", "疾病", "手術", "解雇", "分手", "破產", "盜竊", "詐騙", "訴訟", "背叛", "拘留",
        "壓力", "焦慮", "抑鬱", "傷害", "糾紛", "衝突", "破壞", "損傷", "孤獨", "壓迫",
    ],
}


def count_sentiment_keywords(text: str, keywords: List[str]) -> int:
    """텍스트 내 감정 키워드 개수"""
    count = 0
    for kw in keywords:
        count += text.count(kw)
    return count


def analyze_narrative_sentiment(narrative: str, language: str = "ko") -> Tuple[int, int]:
    """
    서술 텍스트의 긍정/부정 감정 분석

    Args:
        narrative: AI 생성 서술 텍스트
        language: 언어 코드

    Returns:
        (긍정 키워드 수, 부정 키워드 수)
    """
    pos_keywords = POSITIVE_KEYWORDS.get(language, POSITIVE_KEYWORDS["ko"])
    neg_keywords = NEGATIVE_KEYWORDS.get(language, NEGATIVE_KEYWORDS["ko"])

    pos_count = count_sentiment_keywords(narrative, pos_keywords)
    neg_count = count_sentiment_keywords(narrative, neg_keywords)

    return pos_count, neg_count


def validate_score_narrative_consistency(
    score: float,
    narrative: str,
    language: str = "ko",
    strict: bool = False
) -> ValidationResult:
    """
    점수와 서술의 일관성 검증

    Args:
        score: 규칙 기반 점수 (-100 ~ +100)
        narrative: AI 생성 서술 텍스트
        language: 언어 코드
        strict: 엄격 모드 (경미한 불일치도 오류 처리)

    Returns:
        ValidationResult 객체
    """
    issues = []
    suggestions = []

    # 서술 감정 분석
    pos_count, neg_count = analyze_narrative_sentiment(narrative, language)
    total_sentiment = pos_count + neg_count

    # 감정 비율 계산
    if total_sentiment > 0:
        sentiment_ratio = (pos_count - neg_count) / total_sentiment
    else:
        sentiment_ratio = 0

    # 점수 정규화 (-1 ~ +1)
    normalized_score = score / 100.0

    # 차이 계산
    discrepancy = abs(normalized_score - sentiment_ratio)

    # 방향성 체크 (점수와 감정이 반대 방향인지)
    direction_mismatch = (normalized_score > 0.2 and sentiment_ratio < -0.2) or \
                         (normalized_score < -0.2 and sentiment_ratio > 0.2)

    # 일관성 수준 결정
    if direction_mismatch:
        level = ConsistencyLevel.CONTRADICTION
        if language == "en":
            issues.append(f"Score ({score:+.0f}) and narrative sentiment are contradictory")
            suggestions.append("Revise narrative to align with the calculated score")
        else:
            issues.append(f"점수({score:+.0f})와 서술 감정이 상반됩니다")
            suggestions.append("점수에 맞게 서술을 수정해주세요")
    elif discrepancy > 0.5:
        level = ConsistencyLevel.MAJOR_DISCREPANCY
        if language == "en":
            issues.append(f"Large gap between score ({score:+.0f}) and narrative tone")
            suggestions.append("Strengthen positive/negative expressions accordingly")
        else:
            issues.append(f"점수({score:+.0f})와 서술 톤 간 큰 차이")
            suggestions.append("긍정/부정 표현 강도를 조절해주세요")
    elif discrepancy > 0.3 or (strict and discrepancy > 0.2):
        level = ConsistencyLevel.MINOR_DISCREPANCY
        if language == "en":
            issues.append(f"Minor mismatch between score ({score:+.0f}) and narrative")
        else:
            issues.append(f"점수({score:+.0f})와 서술 간 미세 불일치")
    else:
        level = ConsistencyLevel.CONSISTENT

    # 일관성 점수 계산 (0 ~ 1)
    consistency_score = max(0, 1 - discrepancy)

    return ValidationResult(
        level=level,
        score=consistency_score,
        issues=issues,
        suggestions=suggestions
    )


def validate_event_prediction_consistency(
    predicted_events: List[str],
    narrative: str,
    language: str = "ko"
) -> ValidationResult:
    """
    예측 사건과 서술의 일관성 검증

    Args:
        predicted_events: 물상론 예측 사건 목록
        narrative: AI 생성 서술
        language: 언어 코드

    Returns:
        ValidationResult 객체
    """
    issues = []
    suggestions = []

    # 예측 사건 중 서술에 언급된 것 체크 (대소문자 무시)
    mentioned_count = 0
    narrative_lower = narrative.lower()
    for event in predicted_events:
        # 사건 키워드가 서술에 포함되는지 확인 (대소문자 무시)
        if event.lower() in narrative_lower:
            mentioned_count += 1

    # 멘션 비율
    if predicted_events:
        mention_ratio = mentioned_count / len(predicted_events)
    else:
        mention_ratio = 1.0  # 예측 사건이 없으면 100% 일관

    # 일관성 수준 결정
    if mention_ratio >= 0.5:
        level = ConsistencyLevel.CONSISTENT
    elif mention_ratio >= 0.3:
        level = ConsistencyLevel.MINOR_DISCREPANCY
        if language == "en":
            issues.append(f"Only {mentioned_count}/{len(predicted_events)} predicted events mentioned")
        else:
            issues.append(f"예측 사건 {len(predicted_events)}개 중 {mentioned_count}개만 언급됨")
    else:
        level = ConsistencyLevel.MAJOR_DISCREPANCY
        if language == "en":
            issues.append(f"Predicted events poorly reflected in narrative")
            suggestions.append("Consider incorporating more predicted events")
        else:
            issues.append(f"예측 사건이 서술에 충분히 반영되지 않음")
            suggestions.append("예측 사건을 더 많이 반영해주세요")

    return ValidationResult(
        level=level,
        score=mention_ratio,
        issues=issues,
        suggestions=suggestions
    )


def format_validation_result(result: ValidationResult, language: str = "ko") -> str:
    """
    검증 결과를 문자열로 포맷팅

    Args:
        result: ValidationResult 객체
        language: 언어 코드

    Returns:
        포맷팅된 문자열
    """
    lines = []

    # 헤더
    if language == "en":
        lines.append(f"## Consistency Validation")
        lines.append(f"**Level**: {result.level.value}")
        lines.append(f"**Score**: {result.score:.1%}")
    else:
        lines.append(f"## 일관성 검증 결과")
        lines.append(f"**수준**: {result.level.value}")
        lines.append(f"**점수**: {result.score:.1%}")

    # 이슈
    if result.issues:
        if language == "en":
            lines.append("\n**Issues:**")
        else:
            lines.append("\n**발견된 문제:**")
        for issue in result.issues:
            lines.append(f"- {issue}")

    # 제안
    if result.suggestions:
        if language == "en":
            lines.append("\n**Suggestions:**")
        else:
            lines.append("\n**개선 제안:**")
        for suggestion in result.suggestions:
            lines.append(f"- {suggestion}")

    return "\n".join(lines)


__all__ = [
    "ConsistencyLevel",
    "ValidationResult",
    "analyze_narrative_sentiment",
    "validate_score_narrative_consistency",
    "validate_event_prediction_consistency",
    "format_validation_result",
]
