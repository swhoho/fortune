"""
Gemini 응답 정규화 모듈
DB 저장 전 키 이름을 표준화하여 TypeScript와의 일관성 유지
"""
import re
from typing import Any, Dict, Union, List

# ============================================
# 키 매핑 정의
# ============================================

# Basic Analysis 키 매핑
BASIC_KEY_MAPPING = {
    '일간': 'dayMaster',
    'day_master': 'dayMaster',
    '격국': 'structure',
    '용신': 'usefulGod',
    'useful_god': 'usefulGod',
    '요약': 'summary',
}

DAY_MASTER_MAPPING = {
    '천간': 'stem',
    '오행': 'element',
    '음양': 'yinYang',
    'yin_yang': 'yinYang',
    '특성': 'characteristics',
}

STRUCTURE_MAPPING = {
    '격국명': 'type',
    '격국_유형': 'type',
    '품질': 'quality',
    '설명': 'description',
}

USEFUL_GOD_MAPPING = {
    '용신_오행': 'primary',
    '희신': 'secondary',
    '기신': 'harmful',
    '근거': 'reasoning',
    'reason': 'reasoning',
}

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
    # basic analysis
    '일간': 'dayMaster',
    '격국': 'structure',
    '용신': 'usefulGod',
    '요약': 'summary',
    '천간': 'stem',
    '오행': 'element',
    '음양': 'yinYang',
    '격국명': 'type',
    '품질': 'quality',
    '용신_오행': 'primary',
    '희신': 'secondary',
    '기신': 'harmful',
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
    '특성들': 'characteristics',
    # aptitude
    '핵심_키워드': 'keywords',
    '타고난_재능': 'talents',
    '추천_분야': 'recommendedFields',
    '회피_분야': 'avoidFields',
    '재능_활용_상태': 'talentUsage',
    '현재_수준': 'currentLevel',
    '잠재력': 'potential',
    '조언': 'advice',
    '이름': 'name',
    '적합도': 'suitability',
    '수준': 'level',
    '이유': 'reason',
    '학습_스타일': 'studyStyle',
    # fortune
    '재물운': 'wealth',
    '연애운': 'love',
    '패턴_유형': 'pattern',
    '패턴': 'pattern',
    '재물_점수': 'wealthScore',
    '연애_점수': 'loveScore',
    '재물운_강점': 'strengths',
    '재물운_리스크': 'risks',
    '리스크': 'risks',
    '스타일_유형': 'style',
    '스타일': 'style',
    '이상형_특성': 'idealPartner',
    '이상형': 'idealPartner',
    '궁합_포인트': 'compatibilityPoints',
    '주의사항': 'warnings',
    '연애_조언': 'loveAdvice',
    '재물_조언': 'advice',
    # 기존 ContentCard 필드
    '연애심리': 'datingPsychology',
    '배우자관': 'spouseView',
    '성격_패턴': 'personalityPattern',
    '재물_유형': 'wealthFortune',
    '배우자_영향': 'partnerInfluence',
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
    # yearly_advice 섹션 키
    '본연의_성정': 'natureAndSoul',
    '재물과_성공': 'wealthAndSuccess',
    '직업과_명예': 'careerAndHonor',
    '문서와_지혜': 'documentAndWisdom',
    '인연과_사랑': 'relationshipAndLove',
    '건강과_이동': 'healthAndMovement',
}

# Yearly Advice 섹션 키 매핑 (모든 변형 처리)
YEARLY_ADVICE_SECTION_MAPPING = {
    # snake_case → camelCase
    'nature_and_soul': 'natureAndSoul',
    'wealth_and_success': 'wealthAndSuccess',
    'career_and_honor': 'careerAndHonor',
    'document_and_wisdom': 'documentAndWisdom',
    'relationship_and_love': 'relationshipAndLove',
    'health_and_movement': 'healthAndMovement',
    # 한글 키
    '본연의_성정': 'natureAndSoul',
    '재물과_성공': 'wealthAndSuccess',
    '직업과_명예': 'careerAndHonor',
    '문서와_지혜': 'documentAndWisdom',
    '인연과_사랑': 'relationshipAndLove',
    '건강과_이동': 'healthAndMovement',
    # camelCase (이미 정규화된 경우)
    'natureAndSoul': 'natureAndSoul',
    'wealthAndSuccess': 'wealthAndSuccess',
    'careerAndHonor': 'careerAndHonor',
    'documentAndWisdom': 'documentAndWisdom',
    'relationshipAndLove': 'relationshipAndLove',
    'healthAndMovement': 'healthAndMovement',
}

# Half 키 매핑
HALF_PERIOD_MAPPING = {
    'first_half': 'firstHalf',
    'second_half': 'secondHalf',
    '상반기': 'firstHalf',
    '하반기': 'secondHalf',
    'firstHalf': 'firstHalf',
    'secondHalf': 'secondHalf',
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
    """
    personality 응답 정규화 (v2.7 - Pydantic 호환)

    outerPersonality, innerPersonality는 문자열 타입 유지
    딕셔너리로 받은 경우 문자열로 추출 (response_schema 실패 시 안전장치)
    """
    if raw is None:
        return raw

    result = _normalize_dict(raw, PERSONALITY_KEY_MAPPING)

    # v2.7: outerPersonality - 문자열 유지, 딕셔너리 → 문자열 추출
    if 'outerPersonality' in result:
        if isinstance(result['outerPersonality'], dict):
            # 딕셔너리인 경우 → 문자열 추출 (Pydantic 호환)
            outer_dict = result['outerPersonality']
            result['outerPersonality'] = (
                outer_dict.get('socialPersona') or
                outer_dict.get('description') or
                outer_dict.get('impression') or
                str(outer_dict)  # 최종 fallback
            )
        elif not isinstance(result['outerPersonality'], str):
            result['outerPersonality'] = str(result['outerPersonality'])

    # v2.7: innerPersonality - 문자열 유지, 딕셔너리 → 문자열 추출
    if 'innerPersonality' in result:
        if isinstance(result['innerPersonality'], dict):
            # 딕셔너리인 경우 → 문자열 추출 (Pydantic 호환)
            inner_dict = result['innerPersonality']
            result['innerPersonality'] = (
                inner_dict.get('emotionalProcessing') or
                inner_dict.get('trueNature') or
                inner_dict.get('description') or
                str(inner_dict)  # 최종 fallback
            )
        elif not isinstance(result['innerPersonality'], str):
            result['innerPersonality'] = str(result['innerPersonality'])

    # 기본값 보장
    if 'outerPersonality' not in result:
        result['outerPersonality'] = ''
    if 'innerPersonality' not in result:
        result['innerPersonality'] = ''
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


def normalize_basic(raw: Dict[str, Any]) -> Dict[str, Any]:
    """basic_analysis 응답 정규화"""
    if raw is None:
        return raw

    result = _normalize_dict(raw, BASIC_KEY_MAPPING)

    # dayMaster 정규화
    if 'dayMaster' in result and isinstance(result['dayMaster'], dict):
        result['dayMaster'] = _normalize_dict(result['dayMaster'], DAY_MASTER_MAPPING)
        # characteristics 기본값
        if 'characteristics' not in result['dayMaster']:
            result['dayMaster']['characteristics'] = []

    # structure 정규화
    if 'structure' in result and isinstance(result['structure'], dict):
        result['structure'] = _normalize_dict(result['structure'], STRUCTURE_MAPPING)

    # usefulGod 정규화
    if 'usefulGod' in result and isinstance(result['usefulGod'], dict):
        result['usefulGod'] = _normalize_dict(result['usefulGod'], USEFUL_GOD_MAPPING)

    # 기본값 보장
    if 'summary' not in result:
        result['summary'] = ''
    if 'dayMaster' not in result:
        result['dayMaster'] = {'stem': '', 'element': '', 'yinYang': '', 'characteristics': []}
    if 'structure' not in result:
        result['structure'] = {'type': '', 'quality': '中', 'description': ''}
    if 'usefulGod' not in result:
        result['usefulGod'] = {'primary': '', 'secondary': '', 'harmful': '', 'reasoning': ''}

    return result


def normalize_yearly_advice(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    yearly_advice 응답 정규화 (방어적 처리)
    - 6개 섹션 키 명시적 매핑 (snake_case/한글 → camelCase)
    - 각 섹션에 firstHalf, secondHalf 기본값 보장
    - 누락된 섹션은 빈 문자열로 초기화
    """
    if raw is None:
        return raw

    # 기본 섹션 구조
    REQUIRED_SECTIONS = [
        'natureAndSoul',
        'wealthAndSuccess',
        'careerAndHonor',
        'documentAndWisdom',
        'relationshipAndLove',
        'healthAndMovement',
    ]

    result = {}

    # 기존 섹션 정규화
    for key, value in raw.items():
        # 섹션 키 정규화
        normalized_key = YEARLY_ADVICE_SECTION_MAPPING.get(key, key)

        if normalized_key in REQUIRED_SECTIONS:
            if isinstance(value, dict):
                # Half 키 정규화
                section_data = {}
                for half_key, half_value in value.items():
                    normalized_half = HALF_PERIOD_MAPPING.get(half_key, half_key)
                    section_data[normalized_half] = half_value if half_value else ''

                # firstHalf, secondHalf 기본값 보장
                if 'firstHalf' not in section_data:
                    section_data['firstHalf'] = ''
                if 'secondHalf' not in section_data:
                    section_data['secondHalf'] = ''

                result[normalized_key] = section_data
            elif isinstance(value, str):
                # 단일 문자열인 경우 → firstHalf로 변환
                result[normalized_key] = {
                    'firstHalf': value,
                    'secondHalf': ''
                }
            else:
                # 기타 → 빈 기본값
                result[normalized_key] = {
                    'firstHalf': '',
                    'secondHalf': ''
                }
        else:
            # 섹션이 아닌 키는 그대로 유지
            result[normalized_key] = value

    # 누락된 섹션 기본값 추가
    for section in REQUIRED_SECTIONS:
        if section not in result:
            result[section] = {
                'firstHalf': '',
                'secondHalf': ''
            }

    return result


# ============================================
# Daily Fortune 정규화 (v4.0)
# ============================================

DAILY_FORTUNE_KEY_MAPPING = {
    # snake_case → camelCase
    'overall_score': 'overallScore',
    'career_fortune': 'careerFortune',
    'wealth_fortune': 'wealthFortune',
    'love_fortune': 'loveFortune',
    'health_fortune': 'healthFortune',
    'relationship_fortune': 'relationshipFortune',
    'lucky_color': 'luckyColor',
    'lucky_number': 'luckyNumber',
    'lucky_direction': 'luckyDirection',
    # 한글 키
    '종합점수': 'overallScore',
    '요약': 'summary',
    '직업운': 'careerFortune',
    '재물운': 'wealthFortune',
    '연애운': 'loveFortune',
    '건강운': 'healthFortune',
    '인간관계운': 'relationshipFortune',
    '조언': 'advice',
    '행운의색': 'luckyColor',
    '행운의숫자': 'luckyNumber',
    '행운의방향': 'luckyDirection',
}

AREA_FORTUNE_KEY_MAPPING = {
    '점수': 'score',
    '제목': 'title',
    '설명': 'description',
    '팁': 'tip',
}


def normalize_daily_fortune(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    오늘의 운세 응답 정규화

    - snake_case/한글 키 → camelCase
    - 영역별 운세 내부 정규화
    - 기본값 보장
    """
    if raw is None:
        return raw

    result = _normalize_dict(raw, DAILY_FORTUNE_KEY_MAPPING)

    # 영역별 운세 정규화
    area_keys = ['careerFortune', 'wealthFortune', 'loveFortune',
                 'healthFortune', 'relationshipFortune']

    for key in area_keys:
        if key in result and isinstance(result[key], dict):
            result[key] = _normalize_dict(result[key], AREA_FORTUNE_KEY_MAPPING)
            # 기본값 보장
            if 'score' not in result[key]:
                result[key]['score'] = 50
            if 'title' not in result[key]:
                result[key]['title'] = ''
            if 'description' not in result[key]:
                result[key]['description'] = ''
            if 'tip' not in result[key]:
                result[key]['tip'] = ''
        else:
            # 누락된 영역 기본값
            result[key] = {'score': 50, 'title': '', 'description': '', 'tip': ''}

    # 최상위 필드 기본값
    if 'overallScore' not in result:
        result['overallScore'] = 50
    if 'summary' not in result:
        result['summary'] = ''
    if 'advice' not in result:
        result['advice'] = ''

    return result


def normalize_response(step_name: str, raw_response: Dict[str, Any]) -> Dict[str, Any]:
    """단계별 응답 정규화 라우터"""
    normalizers = {
        'basic': normalize_basic,
        'basic_analysis': normalize_basic,
        'personality': normalize_personality,
        'aptitude': normalize_aptitude,
        'fortune': normalize_fortune,
        'yearly_advice': normalize_yearly_advice,
        'daily_fortune': normalize_daily_fortune,
    }

    normalizer = normalizers.get(step_name)
    if normalizer:
        return normalizer(raw_response)

    return raw_response  # 미등록 단계는 원본 반환
