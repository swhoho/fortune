"""
Gemini 응답 정규화 모듈
DB 저장 전 키 이름을 표준화하여 TypeScript와의 일관성 유지
"""
import re
from typing import Any, Dict, Union, List

# ============================================
# 키 매핑 정의
# ============================================

# Aptitude 키 매핑
APTITUDE_KEY_MAPPING = {
    'abilityStatus': 'talentUsage',
    'talentUsageStatus': 'talentUsage',
    'talent_utilization': 'talentUsage',
    '재능_활용_상태': 'talentUsage',
    '타고난_재능': 'talents',
    '추천_분야': 'recommendedFields',
    'recommended_fields': 'recommendedFields',
    '회피_분야': 'avoidFields',
    'avoided_fields': 'avoidFields',
    '핵심_키워드': 'keywords',
}

TALENT_USAGE_FIELD_MAPPING = {
    'current_level': 'currentLevel',
    'current': 'currentLevel',
    '현재_수준': 'currentLevel',
    'potential_level': 'potential',
    '잠재력': 'potential',
    '조언': 'advice',
    'developmentTips': 'advice',
}

# Personality 키 매핑
PERSONALITY_KEY_MAPPING = {
    'outer_personality': 'outerPersonality',
    '겉성격': 'outerPersonality',
    'inner_personality': 'innerPersonality',
    '속성격': 'innerPersonality',
    'social_style': 'socialStyle',
    'interpersonal_style': 'socialStyle',
    '대인관계_스타일': 'socialStyle',
}

OUTER_PERSONALITY_MAPPING = {
    '인상': 'impression',
    '근거': 'basis',
    '사회적_페르소나': 'socialPersona',
    'social_persona': 'socialPersona',
}

INNER_PERSONALITY_MAPPING = {
    '본성': 'trueNature',
    'true_nature': 'trueNature',
    '근거': 'basis',
    '감정_처리방식': 'emotionalProcessing',
    'emotional_processing': 'emotionalProcessing',
}

# Fortune 키 매핑
WEALTH_KEY_MAPPING = {
    '패턴_유형': 'pattern',
    '재물_점수': 'wealthScore',
    'wealth_score': 'wealthScore',
    'score': 'wealthScore',
    '재물운_강점': 'strengths',
    '재물운_리스크': 'risks',
    '조언': 'advice',
}

LOVE_KEY_MAPPING = {
    '스타일_유형': 'style',
    '연애_점수': 'loveScore',
    'love_score': 'loveScore',
    'score': 'loveScore',
    '이상형_특성': 'idealPartner',
    'ideal_partner': 'idealPartner',
    '궁합_포인트': 'compatibilityPoints',
    'compatibility_points': 'compatibilityPoints',
    '주의사항': 'warnings',
    '연애_조언': 'loveAdvice',
    'love_advice': 'loveAdvice',
}

# ============================================
# 전역 한글 키 → camelCase 매핑
# ============================================

KOREAN_KEY_MAPPING = {
    # personality
    '겉성격': 'outerPersonality',
    '속성격': 'innerPersonality',
    '대인관계_스타일': 'socialStyle',
    '의지력': 'willpower',
    '본성': 'trueNature',
    '근거': 'basis',
    '인상': 'impression',
    '사회적_페르소나': 'socialPersona',
    '감정_처리방식': 'emotionalProcessing',
    '유형': 'type',
    '강점': 'strengths',
    '약점': 'weaknesses',
    '설명': 'description',
    '점수': 'score',
    '특성': 'traits',
    # aptitude
    '핵심_키워드': 'keywords',
    '타고난_재능': 'talents',
    '추천_분야': 'recommendedFields',
    '회피_분야': 'avoidFields',
    '재능_활용_상태': 'talentUsage',
    '현재_수준': 'currentLevel',
    '잠재력': 'potential',
    '조언': 'advice',
    # fortune
    '재물운': 'wealth',
    '연애운': 'love',
    '패턴_유형': 'pattern',
    '재물_점수': 'wealthScore',
    '연애_점수': 'loveScore',
    '재물운_강점': 'strengths',
    '재물운_리스크': 'risks',
    '스타일_유형': 'style',
    '이상형_특성': 'idealPartner',
    '궁합_포인트': 'compatibilityPoints',
    '연애_조언': 'loveAdvice',
    # yearly
    '상반기': 'firstHalf',
    '하반기': 'secondHalf',
    '월별_운세': 'monthlyFortune',
    '주요_키워드': 'mainKeywords',
    '총운': 'overallFortune',
    '재물': 'wealth',
    '연애': 'love',
    '건강': 'health',
    '직업': 'career',
}


def normalize_all_keys(obj: Any) -> Any:
    """
    모든 키를 camelCase로 정규화 (한글 + snake_case → camelCase)
    DB 저장 전 호출하여 일관성 보장
    """
    if obj is None:
        return obj

    if isinstance(obj, list):
        return [normalize_all_keys(item) for item in obj]

    if not isinstance(obj, dict):
        return obj

    result = {}
    for key, value in obj.items():
        # 1. 한글 키 → 영문 camelCase
        if key in KOREAN_KEY_MAPPING:
            camel_key = KOREAN_KEY_MAPPING[key]
        # 2. snake_case → camelCase
        elif '_' in key and not key.startswith('_'):
            camel_key = re.sub(r'_([a-z])', lambda m: m.group(1).upper(), key)
        else:
            camel_key = key

        # 재귀 적용
        result[camel_key] = normalize_all_keys(value)

    return result


# ============================================
# 정규화 함수
# ============================================

def _normalize_dict(data: Dict, mapping: Dict[str, str]) -> Dict:
    """딕셔너리 키를 매핑에 따라 정규화"""
    if not isinstance(data, dict):
        return data
    result = {}
    for key, value in data.items():
        standard_key = mapping.get(key, key)
        result[standard_key] = value
    return result


def normalize_personality(raw: Dict[str, Any]) -> Dict[str, Any]:
    """personality 응답 정규화 (하위 호환성 + 기본값 처리)"""
    if raw is None:
        return raw

    result = _normalize_dict(raw, PERSONALITY_KEY_MAPPING)

    # outerPersonality: 문자열 → 객체 변환 (하위 호환성)
    if 'outerPersonality' in result:
        if isinstance(result['outerPersonality'], str):
            # 기존 문자열 형식 → 객체로 변환
            result['outerPersonality'] = {
                'impression': '',
                'basis': '',
                'socialPersona': result['outerPersonality']
            }
        elif isinstance(result['outerPersonality'], dict):
            result['outerPersonality'] = _normalize_dict(
                result['outerPersonality'], OUTER_PERSONALITY_MAPPING
            )

    # innerPersonality: 문자열 → 객체 변환 (하위 호환성)
    if 'innerPersonality' in result:
        if isinstance(result['innerPersonality'], str):
            result['innerPersonality'] = {
                'trueNature': '',
                'basis': '',
                'emotionalProcessing': result['innerPersonality']
            }
        elif isinstance(result['innerPersonality'], dict):
            result['innerPersonality'] = _normalize_dict(
                result['innerPersonality'], INNER_PERSONALITY_MAPPING
            )

    # 기본값 보장
    if 'willpower' not in result:
        result['willpower'] = {'score': 50, 'description': ''}
    if 'socialStyle' not in result:
        result['socialStyle'] = {'type': '', 'strengths': [], 'weaknesses': []}

    return result


def normalize_aptitude(raw: Dict[str, Any]) -> Dict[str, Any]:
    """aptitude 응답 정규화 (기본값 처리)"""
    if raw is None:
        return raw

    result = _normalize_dict(raw, APTITUDE_KEY_MAPPING)

    # talentUsage 내부 정규화
    if 'talentUsage' in result and isinstance(result['talentUsage'], dict):
        result['talentUsage'] = _normalize_dict(
            result['talentUsage'], TALENT_USAGE_FIELD_MAPPING
        )

    # 기본값 보장
    if 'keywords' not in result:
        result['keywords'] = []
    if 'talents' not in result:
        result['talents'] = []
    if 'recommendedFields' not in result:
        result['recommendedFields'] = []
    if 'avoidFields' not in result:
        result['avoidFields'] = []
    if 'talentUsage' not in result:
        result['talentUsage'] = {'currentLevel': 50, 'potential': 50, 'advice': ''}

    return result


def normalize_fortune(raw: Dict[str, Any]) -> Dict[str, Any]:
    """fortune 응답 정규화 (기본값 처리)"""
    if raw is None:
        return raw

    result = {}

    # wealth 정규화
    wealth = raw.get('wealth') or raw.get('재물운')
    if wealth:
        result['wealth'] = _normalize_dict(wealth, WEALTH_KEY_MAPPING)
        # wealthScore 기본값
        if 'wealthScore' not in result['wealth']:
            result['wealth']['wealthScore'] = 50
    else:
        result['wealth'] = {
            'pattern': '', 'wealthScore': 50, 'strengths': [], 'risks': [], 'advice': ''
        }

    # love 정규화
    love = raw.get('love') or raw.get('연애운')
    if love:
        result['love'] = _normalize_dict(love, LOVE_KEY_MAPPING)
        # loveScore 기본값
        if 'loveScore' not in result['love']:
            result['love']['loveScore'] = 50
    else:
        result['love'] = {
            'style': '', 'loveScore': 50, 'idealPartner': [],
            'compatibilityPoints': [], 'warnings': [], 'loveAdvice': ''
        }

    return result


def normalize_response(step_name: str, raw_response: Dict[str, Any]) -> Dict[str, Any]:
    """단계별 응답 정규화 라우터"""
    normalizers = {
        'personality': normalize_personality,
        'aptitude': normalize_aptitude,
        'fortune': normalize_fortune,
    }

    normalizer = normalizers.get(step_name)
    if normalizer:
        return normalizer(raw_response)

    return raw_response  # basic 등은 원본 반환
