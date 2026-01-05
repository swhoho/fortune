"""
대운 분석 프롬프트
- 순풍운/역풍운 비율 계산
- 나이에 맞는 구체적 설명 생성
"""
from typing import List, Dict, Any, Literal

LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


# 나이대별 생애주기 키워드 (한국어)
LIFE_STAGE_KEYWORDS_KO = {
    (0, 6): "영유아기, 부모 보살핌, 첫 교육",
    (7, 11): "초등학교, 친구, 놀이, 학원, 부모 의존",
    (12, 16): "사춘기, 중고등학교, 입시, 또래관계, 정체성",
    (17, 21): "대학, 진로 탐색, 첫사랑, 독립 시작, 자아실현",
    (22, 26): "취업, 사회초년생, 연애, 자기개발, 첫 직장",
    (27, 31): "커리어 확립, 결혼 고민, 자격증, 대학원, 전문성",
    (32, 36): "결혼/출산, 직장 안정, 내집마련, 가정",
    (37, 41): "승진, 육아, 중간관리자, 건강관리 시작",
    (42, 46): "중년의 위기, 자녀 교육, 재테크, 인생 재정비",
    (47, 51): "경력 정점, 노후 준비, 자녀 독립, 리더십",
    (52, 56): "은퇴 준비, 건강 중시, 인생 2막, 자녀 결혼",
    (57, 61): "은퇴, 여유, 손주, 건강, 취미생활",
    (62, 100): "노년, 여생, 지혜, 건강관리, 가족",
}

# 나이대별 생애주기 키워드 (영어)
LIFE_STAGE_KEYWORDS_EN = {
    (0, 6): "early childhood, parental care, first education",
    (7, 11): "elementary school, friends, play, activities, parental dependence",
    (12, 16): "puberty, middle/high school, exams, peer relationships, identity",
    (17, 21): "college, career exploration, first love, independence, self-realization",
    (22, 26): "employment, early career, dating, self-development, first job",
    (27, 31): "career establishment, marriage considerations, certifications, graduate school",
    (32, 36): "marriage/children, job stability, home ownership, family",
    (37, 41): "promotion, parenting, middle management, health awareness",
    (42, 46): "midlife transition, children's education, investments, life reassessment",
    (47, 51): "career peak, retirement planning, children leaving home, leadership",
    (52, 56): "pre-retirement, health focus, second chapter, children's marriage",
    (57, 61): "retirement, leisure, grandchildren, health, hobbies",
    (62, 100): "senior years, wisdom, health management, family",
}

# 십신별 키워드 (한국어)
TEN_GOD_KEYWORDS_KO = {
    "비견": "경쟁, 자립, 동료, 형제, 독립심, 자존심",
    "겁재": "도전, 모험, 투자, 경쟁자, 분쟁, 손재",
    "식신": "창의력, 표현, 취미, 맛집, 여유, 재능발휘",
    "상관": "재능, 반항, 예술, 구설, 자유분방, 감성",
    "정재": "저축, 안정, 급여, 근면, 꾸준한 수입, 알뜰",
    "편재": "투자, 사업, 부수입, 유흥, 기회, 융통성",
    "정관": "승진, 명예, 책임, 질서, 직장, 안정",
    "편관": "압박, 변화, 권력, 스트레스, 도전, 극복",
    "정인": "학업, 자격증, 보호, 부모, 학습, 인정",
    "편인": "특수기술, 영감, 고독, 변덕, 창의적 사고, 독학",
}

# 십신별 키워드 (영어)
TEN_GOD_KEYWORDS_EN = {
    "비견": "competition, independence, colleagues, siblings, self-reliance",
    "겁재": "challenge, adventure, investment, competitors, disputes",
    "식신": "creativity, expression, hobbies, leisure, talent expression",
    "상관": "talent, rebellion, art, gossip, free-spirited, emotional",
    "정재": "savings, stability, salary, diligence, steady income",
    "편재": "investment, business, side income, opportunities, flexibility",
    "정관": "promotion, honor, responsibility, order, career, stability",
    "편관": "pressure, change, authority, stress, challenges, overcoming",
    "정인": "study, certifications, protection, parents, learning, recognition",
    "편인": "special skills, inspiration, solitude, creativity, self-learning",
}


def get_life_stage_keywords(age: int, language: str = 'ko') -> str:
    """나이에 해당하는 생애주기 키워드 반환"""
    keywords_map = LIFE_STAGE_KEYWORDS_EN if language == 'en' else LIFE_STAGE_KEYWORDS_KO

    for (start, end), keywords in keywords_map.items():
        if start <= age <= end:
            return keywords
    return ""


def get_ten_god_keywords(ten_god: str, language: str = 'ko') -> str:
    """십신에 해당하는 키워드 반환"""
    keywords_map = TEN_GOD_KEYWORDS_EN if language == 'en' else TEN_GOD_KEYWORDS_KO
    return keywords_map.get(ten_god, "")


# ============================================
# 대운 분석 프롬프트
# ============================================

DAEWUN_ANALYSIS_PROMPT_KO = """## 대운 분석 전문가 역할

당신은 30년 경력의 대운 분석 전문가입니다.
각 대운에 대해 순풍운/역풍운 비율과 나이에 맞는 구체적 설명을 분석해주세요.

### 입력 데이터
- 일간: {day_master} ({day_master_element})
- 용신: {useful_god}
- 기신: {harmful_god}
- 현재 나이: {current_age}세
- 대운 목록:
{daewun_list}

### 분석 원칙

#### 1. 순풍운/역풍운 비율 (합계 100%)
- 대운 천간/지지가 용신과 같은 오행이면 순풍 ↑
- 대운 천간/지지가 기신과 같은 오행이면 역풍 ↑
- 원국과 합/충/형 관계 고려
- 최소 15%, 최대 85%로 제한 (극단값 방지)

#### 2. 나이에 맞는 구체적 설명 (가장 중요!)

십신별 키워드 (나이에 맞게 변형):
- 비견운: 경쟁, 자립, 동료, 형제
- 겁재운: 도전, 모험, 투자, 경쟁자
- 식신운: 창의력, 표현, 취미, 맛집
- 상관운: 재능, 반항, 예술, 구설
- 정재운: 저축, 안정, 급여, 근면
- 편재운: 투자, 사업, 부수입, 유흥
- 정관운: 승진, 명예, 책임, 질서
- 편관운: 압박, 변화, 권력, 스트레스
- 정인운: 학업, 자격증, 보호, 부모
- 편인운: 특수기술, 영감, 고독, 변덕

### 중요 규칙
1. description은 해당 나이대에 실제로 겪을 수 있는 구체적 사건으로 작성
2. 쉼표로 구분된 4-6개의 키워드/문구 형태
3. 긍정적 내용과 주의사항을 균형있게 포함
4. 한국어로 작성, 간결하게 (50자 내외)
5. 각 대운의 ageRange, tenGod, tenGodType은 입력값 그대로 사용

### 출력 형식 (JSON)
```json
{{
  "daewunAnalysis": [
    {{
      "ageRange": "7세~16세",
      "tenGod": "겁재",
      "tenGodType": "비겁운",
      "favorablePercent": 15,
      "unfavorablePercent": 85,
      "description": "새로운 친구와의 어울림, 게임과 오락에 빠짐, 치열한 경쟁, 삼각관계, 학원비 부족"
    }},
    {{
      "ageRange": "22세~31세",
      "tenGod": "식신",
      "tenGodType": "식상운",
      "favorablePercent": 65,
      "unfavorablePercent": 35,
      "description": "진로모색과 아이디어 개발의 시기, 창업에 대한 관심 증가, 표현력이 늘어 인기 상승, 꾸준한 노력이 빛을 발함"
    }}
  ]
}}
```

위 입력 데이터를 바탕으로 각 대운을 분석하여 JSON 형식으로 응답해주세요.
"""

DAEWUN_ANALYSIS_PROMPT_EN = """## Fortune Period (大運) Analysis Expert Role

You are a Fortune Period analysis expert with 30 years of experience.
Analyze the favorable/unfavorable ratio and age-appropriate descriptions for each fortune period.

### Input Data
- Day Master: {day_master} ({day_master_element})
- Useful God: {useful_god}
- Harmful God: {harmful_god}
- Current Age: {current_age}
- Fortune Periods:
{daewun_list}

### Analysis Principles

#### 1. Favorable/Unfavorable Ratio (Total 100%)
- If fortune period element matches Useful God → favorable ↑
- If fortune period element matches Harmful God → unfavorable ↑
- Consider harmony/clash relationships with natal chart
- Limit to min 15%, max 85% (prevent extreme values)

#### 2. Age-Appropriate Description (Most Important!)

Ten God Keywords (adapt to age):
- Companion: competition, independence, colleagues
- Rob Wealth: challenge, adventure, investment
- Eating God: creativity, expression, hobbies
- Hurting Officer: talent, rebellion, art
- Direct Wealth: savings, stability, salary
- Indirect Wealth: investment, business, opportunities
- Direct Officer: promotion, honor, responsibility
- Indirect Officer: pressure, change, authority
- Direct Resource: study, certifications, protection
- Indirect Resource: special skills, inspiration, solitude

### Important Rules
1. Description should be concrete events appropriate for that age range
2. Format: 4-6 keywords/phrases separated by commas
3. Balance positive content with cautions
4. Keep concise (under 60 characters)
5. Use input values as-is for ageRange, tenGod, tenGodType

### Output Format (JSON)
```json
{{
  "daewunAnalysis": [
    {{
      "ageRange": "7-16",
      "tenGod": "Rob Wealth",
      "tenGodType": "Companion Period",
      "favorablePercent": 15,
      "unfavorablePercent": 85,
      "description": "making new friends, gaming obsession, fierce competition, relationship troubles, financial constraints"
    }}
  ]
}}
```

Analyze each fortune period based on the input data and respond in JSON format.
"""


def build_daewun_analysis_prompt(
    day_master: str,
    day_master_element: str,
    useful_god: str,
    harmful_god: str,
    current_age: int,
    daewun_list: List[Dict[str, Any]],
    language: LocaleType = 'ko'
) -> str:
    """
    대운 분석 프롬프트 빌드

    Args:
        day_master: 일간 (甲~癸)
        day_master_element: 일간 오행 (木火土金水)
        useful_god: 용신 오행
        harmful_god: 기신 오행
        current_age: 현재 나이
        daewun_list: 대운 목록 (calculate_daewun_with_ten_god 결과)
        language: 언어 코드

    Returns:
        프롬프트 문자열
    """
    # 대운 목록 포맷팅
    daewun_str_parts = []
    for dw in daewun_list:
        age_range = f"{dw['age']}세~{dw['endAge']}세"
        ten_god = dw.get('tenGod', '알수없음')
        ten_god_type = dw.get('tenGodType', '알수없음')
        stem = dw.get('stem', '?')
        branch = dw.get('branch', '?')
        start_year = dw.get('startYear', '?')

        # 생애주기 키워드 추가
        life_keywords = get_life_stage_keywords(dw['age'], language)
        ten_god_keywords = get_ten_god_keywords(ten_god, language)

        daewun_str_parts.append(
            f"  - {age_range} ({stem}{branch}): {ten_god_type} ({ten_god}), "
            f"시작연도: {start_year}년\n"
            f"    생애주기: {life_keywords}\n"
            f"    십신 키워드: {ten_god_keywords}"
        )

    daewun_list_str = "\n".join(daewun_str_parts)

    # 언어별 프롬프트 선택
    if language == 'en':
        prompt_template = DAEWUN_ANALYSIS_PROMPT_EN
    else:
        prompt_template = DAEWUN_ANALYSIS_PROMPT_KO

    return prompt_template.format(
        day_master=day_master,
        day_master_element=day_master_element,
        useful_god=useful_god,
        harmful_god=harmful_god,
        current_age=current_age,
        daewun_list=daewun_list_str
    )


# ============================================
# 출력 스키마
# ============================================

DAEWUN_ANALYSIS_OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "daewunAnalysis": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "ageRange": {"type": "string"},
                    "tenGod": {"type": "string"},
                    "tenGodType": {"type": "string"},
                    "favorablePercent": {"type": "integer", "minimum": 0, "maximum": 100},
                    "unfavorablePercent": {"type": "integer", "minimum": 0, "maximum": 100},
                    "description": {"type": "string"}
                },
                "required": ["ageRange", "tenGod", "tenGodType", "favorablePercent", "unfavorablePercent", "description"]
            }
        }
    },
    "required": ["daewunAnalysis"]
}
