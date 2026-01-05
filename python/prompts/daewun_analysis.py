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
각 대운에 대해 순풍운/역풍운 비율, 점수 근거, 그리고 나이에 맞는 상세 분석을 작성해주세요.

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

#### 2. 점수 근거 (scoreReasoning) - 반드시 작성
왜 이런 순풍/역풍 비율이 나왔는지 명리학적 근거를 설명합니다:
- 대운 천간이 용신/기신과 어떤 관계인지
- 대운 지지가 용신/기신과 어떤 관계인지
- 원국과의 합/충/형/해/파 관계가 있는지
- 예시: "대운 천간 癸水가 용신 水와 일치하여 순풍 기운이 강합니다. 지지 亥水 역시 용신 오행과 같아 안정감을 더합니다. 다만 원국 日支 巳火와 충(冲) 관계로 변동성이 예상됩니다."

#### 3. 상세 요약 (summary) - 300~500자
해당 10년 대운 기간 동안의 전반적인 운세 흐름을 상세히 설명합니다:
- 십신의 특성이 해당 나이대에 어떻게 발현되는지
- 이 시기에 주력해야 할 것과 피해야 할 것
- 구체적인 인생 영역별 조언 (직업, 재물, 관계, 건강 등)
- 긍정적 측면과 주의사항을 균형있게 포함
- 실용적이고 현실적인 조언 위주로 작성

십신별 핵심 특성:
- 비견운: 경쟁, 자립, 동료, 형제, 독립심
- 겁재운: 도전, 모험, 투자, 경쟁자, 손재수
- 식신운: 창의력, 표현, 취미, 재능발휘, 여유
- 상관운: 재능, 반항, 예술, 구설, 자유분방
- 정재운: 저축, 안정, 급여, 근면, 꾸준한 수입
- 편재운: 투자, 사업, 부수입, 유흥, 기회
- 정관운: 승진, 명예, 책임, 질서, 조직생활
- 편관운: 압박, 변화, 권력, 스트레스, 도전
- 정인운: 학업, 자격증, 보호, 부모, 학습
- 편인운: 특수기술, 영감, 고독, 창의적 사고

### 중요 규칙
1. scoreReasoning: 점수의 명리학적 근거 (80~150자)
2. summary: 해당 나이대에 맞는 상세 분석 (300~500자, 반드시 이 범위 준수)
3. 각 대운의 ageRange, tenGod, tenGodType은 입력값 그대로 사용
4. 한국어로 작성

### 출력 형식 (JSON)
```json
{{
  "daewunAnalysis": [
    {{
      "ageRange": "7세~16세",
      "tenGod": "겁재",
      "tenGodType": "비겁운",
      "favorablePercent": 35,
      "unfavorablePercent": 65,
      "scoreReasoning": "대운 천간이 기신 오행과 일치하여 역풍 기운이 우세합니다. 지지는 원국과 형(刑) 관계로 갈등과 시련이 예상되나, 천간의 일부 생조 관계로 완전한 흉운은 아닙니다.",
      "summary": "이 시기는 학창시절과 사춘기가 겹치는 중요한 성장기입니다. 겁재의 기운이 강하게 작용하여 또래 친구들과의 경쟁이 치열해지고, 승부욕이 강해지는 시기입니다. 학업에서는 경쟁심이 동기부여가 될 수 있으나, 지나친 승부욕은 오히려 스트레스로 작용할 수 있습니다. 친구 관계에서 다툼이 생기기 쉽고, 형제자매와의 갈등도 예상됩니다. 부모님의 재정적 지원이 원활하지 않을 수 있어 용돈 관리에 신경 써야 합니다. 이 시기에는 무리한 투자나 도박성 행위를 절대 피하고, 기본에 충실한 학업과 체력 관리에 집중하는 것이 좋습니다. 운동이나 취미활동을 통해 경쟁 에너지를 건전하게 발산하면 오히려 성장의 발판이 될 수 있습니다."
    }},
    {{
      "ageRange": "27세~36세",
      "tenGod": "정인",
      "tenGodType": "인성운",
      "favorablePercent": 75,
      "unfavorablePercent": 25,
      "scoreReasoning": "대운 천간이 용신 오행과 일치하여 순풍 기운이 강합니다. 지지 역시 용신과 합을 이루어 안정감을 더하며, 원국과 조화로운 관계를 형성합니다.",
      "summary": "인성운이 들어오는 이 시기는 학습과 성장, 인정받음의 시기입니다. 사회생활 초반부터 중반까지 해당하는 이 기간은 자격증 취득, 대학원 진학, 전문 교육 등 자기계발에 투자하면 좋은 결과를 얻을 수 있습니다. 직장에서는 상사나 선배의 인정을 받기 쉽고, 좋은 멘토를 만날 가능성이 높습니다. 결혼을 고려한다면 이 시기가 적기이며, 배우자운도 좋은 편입니다. 부동산이나 안정적인 자산 형성에도 유리합니다. 다만 인성이 강하면 지나치게 신중해지거나 행동력이 떨어질 수 있으니, 기회가 왔을 때 과감하게 도전하는 자세도 필요합니다. 건강 면에서는 소화기 계통에 주의하고, 규칙적인 생활습관을 유지하는 것이 좋습니다."
    }}
  ]
}}
```

위 입력 데이터를 바탕으로 각 대운을 분석하여 JSON 형식으로 응답해주세요.
"""

DAEWUN_ANALYSIS_PROMPT_EN = """## Fortune Period (大運) Analysis Expert Role

You are a Fortune Period analysis expert with 30 years of experience.
Analyze the favorable/unfavorable ratio, score reasoning, and detailed analysis for each fortune period.

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

#### 2. Score Reasoning (scoreReasoning) - Required
Explain the metaphysical basis for the favorable/unfavorable ratio:
- How the fortune period stem relates to Useful/Harmful God
- How the fortune period branch relates to Useful/Harmful God
- Any harmony/clash/punishment relationships with natal chart
- Example: "The fortune period stem matches the Useful God element, bringing favorable energy. The branch also harmonizes with the Useful God, adding stability. However, a clash with the natal day branch suggests some volatility."

#### 3. Detailed Summary (summary) - 300~500 characters
Comprehensive analysis of the entire 10-year fortune period:
- How the Ten God characteristics manifest at this age
- What to focus on and what to avoid during this period
- Specific advice for life areas (career, wealth, relationships, health)
- Balance positive aspects with cautions
- Practical, realistic advice

Ten God Core Characteristics:
- Companion: competition, independence, colleagues, siblings
- Rob Wealth: challenge, adventure, investment, competitors
- Eating God: creativity, expression, hobbies, talent
- Hurting Officer: talent, rebellion, art, gossip
- Direct Wealth: savings, stability, salary, diligence
- Indirect Wealth: investment, business, opportunities
- Direct Officer: promotion, honor, responsibility, organization
- Indirect Officer: pressure, change, authority, challenges
- Direct Resource: study, certifications, protection, learning
- Indirect Resource: special skills, inspiration, creativity

### Important Rules
1. scoreReasoning: Metaphysical basis for scores (80-150 characters)
2. summary: Detailed age-appropriate analysis (300-500 characters, strictly follow this range)
3. Use input values as-is for ageRange, tenGod, tenGodType
4. Write in English

### Output Format (JSON)
```json
{{
  "daewunAnalysis": [
    {{
      "ageRange": "7-16",
      "tenGod": "Rob Wealth",
      "tenGodType": "Companion Period",
      "favorablePercent": 35,
      "unfavorablePercent": 65,
      "scoreReasoning": "The fortune period stem matches the Harmful God element, creating unfavorable energy. The branch forms a punishment relationship with the natal chart, suggesting conflicts and trials.",
      "summary": "This period covers crucial school years and puberty. The Rob Wealth energy intensifies competition among peers and heightens your competitive spirit. In academics, this drive can motivate you, but excessive competitiveness may cause stress. Friendships may face conflicts, and sibling rivalries are possible. Financial support from parents might be limited, so managing allowances wisely is important. Avoid risky investments or gambling behaviors during this time. Focus on fundamentals: studies and physical fitness. Channel competitive energy through sports or hobbies for healthy development. This challenging period can become a foundation for growth if navigated wisely."
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
                    "scoreReasoning": {"type": "string", "minLength": 80, "maxLength": 200},
                    "summary": {"type": "string", "minLength": 300, "maxLength": 500}
                },
                "required": ["ageRange", "tenGod", "tenGodType", "favorablePercent", "unfavorablePercent", "scoreReasoning", "summary"]
            }
        }
    },
    "required": ["daewunAnalysis"]
}
