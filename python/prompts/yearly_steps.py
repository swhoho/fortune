"""
신년 분석 단계별 프롬프트 모듈
8단계 순차 실행용 프롬프트 빌더

Steps:
1. yearly_overview - 기본 정보 (year, summary, theme, score)
2-5. monthly_1_3, monthly_4_6, monthly_7_9, monthly_10_12 - 월별 운세
6. yearly_advice - 6섹션 연간 조언
7. key_dates - 핵심 길흉일
8. classical_refs - 고전 인용
"""
import json
from typing import Dict, Any, List, Literal

LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


class YearlyStepPrompts:
    """신년 분석 단계별 프롬프트 빌더"""

    # 기본 페르소나 (짧은 버전)
    PERSONA = {
        'ko': """당신은 30년 경력의 명리 대가입니다.
자평진전, 궁통보감, 적천수를 체화한 실전 전문가입니다.
따뜻하면서도 깊이 있는 통찰을 전합니다.""",
        'en': """You are a master practitioner with 30 years of experience in Chinese metaphysics.
You've internalized Ziping Zhengquan, Qiongtong Baojian, and Ditian Sui.""",
        'ja': """あなたは30年の経験を持つ命理学の大家です。
子平真詮、窮通宝鑑、滴天髄を体得した実践の専門家です。""",
        'zh-CN': """您是拥有30年经验的命理大师。
精通子平真诠、穷通宝鑑、滴天髓。""",
        'zh-TW': """您是擁有30年經驗的命理大師。
精通子平真詮、窮通寶鑑、滴天髓。"""
    }

    @classmethod
    def build_overview(
        cls,
        language: LocaleType,
        year: int,
        pillars: Dict[str, Any],
        daewun: List[Dict[str, Any]] = None
    ) -> str:
        """
        Step 1: 연간 기본 정보 프롬프트
        출력: year, summary, yearlyTheme, overallScore
        """
        pillars_str = cls._format_pillars(pillars, language)
        persona = cls.PERSONA.get(language, cls.PERSONA['ko'])

        if language == 'ko':
            return f"""{persona}

아래 사주의 {year}년 운세 기본 정보를 분석해주세요.

## 사주 정보
{pillars_str}

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

```json
{{
  "year": {year},
  "summary": "{year}년 운세 총평. 300-500자로 상세히 작성. 올해의 특징, 주요 기회와 도전, 주의할 점을 서사체로 풍부하게 설명.",
  "yearlyTheme": "올해의 주제 (예: 도약의 해, 안정의 해)",
  "overallScore": 75
}}
```

**주의사항**:
- summary는 300-500자로 상세히 작성 (서사체, 올해의 특징/기회/도전 포함)
- overallScore는 0-100 사이 정수
- yearlyTheme은 간결하게 (10자 이내)
"""
        elif language == 'en':
            return f"""{persona}

Analyze the basic fortune information for {year} based on the BaZi below.

## BaZi Information
{pillars_str}

## Response Format (JSON)
Respond ONLY with the JSON below. No other text.

```json
{{
  "year": {year},
  "summary": "Fortune summary for {year}. Write 300-500 characters in narrative style. Include the year's characteristics, key opportunities, challenges, and points to watch.",
  "yearlyTheme": "Theme of the year (e.g., Year of Growth)",
  "overallScore": 75
}}
```

**Requirements**:
- summary: Write 300-500 characters in narrative style (include characteristics, opportunities, challenges)
- overallScore: Integer between 0-100
- yearlyTheme: Keep it concise (under 20 characters)
"""
        else:
            # ja, zh-CN, zh-TW - 기본 한국어 구조 유지
            return cls.build_overview('ko', year, pillars, daewun)

    @classmethod
    def build_monthly(
        cls,
        language: LocaleType,
        year: int,
        months: List[int],
        pillars: Dict[str, Any],
        daewun: List[Dict[str, Any]] = None,
        overview_result: Dict[str, Any] = None
    ) -> str:
        """
        Steps 2-5: 월별 운세 프롬프트 (3개월씩)
        출력: monthlyFortunes (3개월분)
        """
        pillars_str = cls._format_pillars(pillars, language)
        persona = cls.PERSONA.get(language, cls.PERSONA['ko'])
        month_range = f"{months[0]}-{months[-1]}"

        # 이전 단계 결과 참조
        theme = overview_result.get('yearlyTheme', '') if overview_result else ''
        overall_score = overview_result.get('overallScore', 50) if overview_result else 50

        if language == 'ko':
            return f"""{persona}

{year}년 {month_range}월 운세를 분석해주세요.
올해 주제: {theme}, 전체 점수: {overall_score}점

## 사주 정보
{pillars_str}

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

```json
{{
  "monthlyFortunes": [
    {{
      "month": {months[0]},
      "theme": "{months[0]}월 테마",
      "score": "(0-100 사이 정수)",
      "overview": "이 달의 운세 개요 (150-200자 서사체)",
      "luckyDays": [
        {{"date": "{year}-{months[0]:02d}-15", "dayOfWeek": "수요일", "reason": "길일 이유", "suitableFor": ["계약", "시작"]}}
      ],
      "unluckyDays": [
        {{"date": "{year}-{months[0]:02d}-20", "dayOfWeek": "월요일", "reason": "흉일 이유", "avoid": ["큰 결정"]}}
      ],
      "advice": "이 달의 조언 (50-100자)",
      "keywords": ["키워드1", "키워드2", "키워드3"]
    }}
  ]
}}
```

**주의사항**:
- monthlyFortunes 배열에 {len(months)}개월({month_range}월) 데이터 필수
- 각 월별 luckyDays 3-5개, unluckyDays 1-3개
- overview는 서사체로 150-200자
- 날짜 형식: YYYY-MM-DD

**점수(score) 산정 규칙** (중요):
- 용신(用神)이 득령(得令)하거나 생조(生助)받는 달: 높은 점수
- 기신(忌神)이 왕성하거나 충극(冲剋)이 발생하는 달: 낮은 점수
- 월지(月支)와 일간(日干)의 생극제화(生剋制化) 관계를 면밀히 분석
- 월별 점수를 최대한 다양하게 배정 (최고-최저 간격 50점 이상 권장)
"""
        elif language == 'en':
            return f"""{persona}

Analyze the fortune for {month_range} months of {year}.
Yearly theme: {theme}, Overall score: {overall_score}

## BaZi Information
{pillars_str}

## Response Format (JSON)
Respond ONLY with the JSON below. No other text.

```json
{{
  "monthlyFortunes": [
    {{
      "month": {months[0]},
      "theme": "Theme for month {months[0]}",
      "score": "(integer 0-100)",
      "overview": "Monthly overview (150-200 characters)",
      "luckyDays": [
        {{"date": "{year}-{months[0]:02d}-15", "dayOfWeek": "Wednesday", "reason": "Reason", "suitableFor": ["contracts"]}}
      ],
      "unluckyDays": [
        {{"date": "{year}-{months[0]:02d}-20", "dayOfWeek": "Monday", "reason": "Reason", "avoid": ["big decisions"]}}
      ],
      "advice": "Monthly advice (50-100 characters)",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }}
  ]
}}
```

**Requirements**:
- Include {len(months)} months ({month_range}) in monthlyFortunes array
- 3-5 luckyDays, 1-3 unluckyDays per month

**Score Assignment Rules** (Important):
- Months when Useful God (用神) gains power: HIGH score
- Months when Harmful God (忌神) is strong or clashes occur: LOW score
- Analyze the relationship between Monthly Branch and Day Master
- Vary scores as much as possible across months (50+ point gap recommended)
"""
        else:
            return cls.build_monthly('ko', year, months, pillars, daewun, overview_result)

    @classmethod
    def build_yearly_advice(
        cls,
        language: LocaleType,
        year: int,
        pillars: Dict[str, Any],
        daewun: List[Dict[str, Any]] = None,
        overview_result: Dict[str, Any] = None
    ) -> str:
        """
        Step 6: 연간 조언 6섹션 프롬프트
        출력: yearlyAdvice (6섹션 × 상/하반기)
        """
        pillars_str = cls._format_pillars(pillars, language)
        persona = cls.PERSONA.get(language, cls.PERSONA['ko'])

        theme = overview_result.get('yearlyTheme', '') if overview_result else ''

        if language == 'ko':
            return f"""{persona}

{year}년 연간 조언을 6개 영역으로 분석해주세요.
올해 주제: {theme}

## 사주 정보
{pillars_str}

## 6개 영역
1. nature_and_soul - 본연의 성정과 신년의 기류
2. wealth_and_success - 재물과 비즈니스의 조류
3. career_and_honor - 직업적 성취와 명예의 궤적
4. document_and_wisdom - 문서의 인연과 학업의 결실
5. relationship_and_love - 인연의 파동과 사회적 관계
6. health_and_movement - 신체의 조화와 환경의 변화

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요.

```json
{{
  "yearlyAdvice": {{
    "nature_and_soul": {{
      "first_half": "상반기(1-6월) 본연의 성정 분석. 서사체로 400-500자. 자연의 비유와 명리학적 근거를 포함하여 따뜻하게 서술.",
      "second_half": "하반기(7-12월) 본연의 성정 분석. 서사체로 400-500자."
    }},
    "wealth_and_success": {{
      "first_half": "상반기 재물운 분석. 서사체로 500-600자.",
      "second_half": "하반기 재물운 분석. 서사체로 500-600자."
    }},
    "career_and_honor": {{
      "first_half": "상반기 직업/명예운 분석. 서사체로 500-600자.",
      "second_half": "하반기 직업/명예운 분석. 서사체로 500-600자."
    }},
    "document_and_wisdom": {{
      "first_half": "상반기 문서/학업운 분석. 서사체로 400-500자.",
      "second_half": "하반기 문서/학업운 분석. 서사체로 400-500자."
    }},
    "relationship_and_love": {{
      "first_half": "상반기 인연/관계운 분석. 서사체로 500-600자.",
      "second_half": "하반기 인연/관계운 분석. 서사체로 500-600자."
    }},
    "health_and_movement": {{
      "first_half": "상반기 건강/이동운 분석. 서사체로 400-500자.",
      "second_half": "하반기 건강/이동운 분석. 서사체로 400-500자."
    }}
  }}
}}
```

**주의사항**:
- 각 섹션 상반기/하반기 모두 작성 필수
- 서사체(줄글)로 작성, 불렛포인트 금지
- 실제 사주가 화법 사용: "북쪽에서 귀인을 만날 수 있습니다", "음력 3월경에..."
"""
        elif language == 'en':
            return f"""{persona}

Analyze yearly advice for {year} in 6 domains.
Yearly theme: {theme}

## BaZi Information
{pillars_str}

## Response Format (JSON)
```json
{{
  "yearlyAdvice": {{
    "nature_and_soul": {{
      "first_half": "First half (Jan-Jun) nature analysis. Narrative style, 400-500 characters.",
      "second_half": "Second half (Jul-Dec) nature analysis. Narrative style, 400-500 characters."
    }},
    "wealth_and_success": {{
      "first_half": "First half wealth analysis. 500-600 characters.",
      "second_half": "Second half wealth analysis. 500-600 characters."
    }},
    "career_and_honor": {{
      "first_half": "First half career analysis. 500-600 characters.",
      "second_half": "Second half career analysis. 500-600 characters."
    }},
    "document_and_wisdom": {{
      "first_half": "First half document/study analysis. 400-500 characters.",
      "second_half": "Second half document/study analysis. 400-500 characters."
    }},
    "relationship_and_love": {{
      "first_half": "First half relationship analysis. 500-600 characters.",
      "second_half": "Second half relationship analysis. 500-600 characters."
    }},
    "health_and_movement": {{
      "first_half": "First half health analysis. 400-500 characters.",
      "second_half": "Second half health analysis. 400-500 characters."
    }}
  }}
}}
```
"""
        else:
            return cls.build_yearly_advice('ko', year, pillars, daewun, overview_result)

    @classmethod
    def build_key_dates(
        cls,
        language: LocaleType,
        year: int,
        pillars: Dict[str, Any],
        monthly_fortunes: List[Dict[str, Any]] = None
    ) -> str:
        """
        Step 7: 핵심 길흉일 프롬프트
        출력: keyDates (10-15개)
        """
        pillars_str = cls._format_pillars(pillars, language)
        persona = cls.PERSONA.get(language, cls.PERSONA['ko'])

        if language == 'ko':
            return f"""{persona}

{year}년의 가장 중요한 길일과 흉일을 선정해주세요.

## 사주 정보
{pillars_str}

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요.

```json
{{
  "keyDates": [
    {{
      "date": "{year}-03-21",
      "type": "lucky",
      "significance": "연중 가장 중요한 길일",
      "recommendation": "중요한 계약, 사업 시작에 최적"
    }},
    {{
      "date": "{year}-07-15",
      "type": "unlucky",
      "significance": "주의가 필요한 날",
      "recommendation": "큰 결정을 피하고 안정을 취하세요"
    }}
  ]
}}
```

**주의사항**:
- keyDates 배열에 10-15개 날짜 포함
- type: "lucky" 또는 "unlucky"
- 날짜 형식: YYYY-MM-DD
- 연간 전체에서 가장 중요한 날짜들만 선정
"""
        elif language == 'en':
            return f"""{persona}

Select the most important lucky and unlucky dates for {year}.

## BaZi Information
{pillars_str}

## Response Format (JSON)
```json
{{
  "keyDates": [
    {{
      "date": "{year}-03-21",
      "type": "lucky",
      "significance": "Most important lucky day of the year",
      "recommendation": "Ideal for contracts, starting businesses"
    }}
  ]
}}
```

**Requirements**:
- Include 10-15 dates in keyDates array
- type: "lucky" or "unlucky"
"""
        else:
            return cls.build_key_dates('ko', year, pillars, monthly_fortunes)

    @classmethod
    def build_classical_refs(
        cls,
        language: LocaleType,
        year: int,
        pillars: Dict[str, Any],
        overview_result: Dict[str, Any] = None
    ) -> str:
        """
        Step 8: 고전 인용 프롬프트
        출력: classicalReferences (2-3개)
        """
        pillars_str = cls._format_pillars(pillars, language)
        persona = cls.PERSONA.get(language, cls.PERSONA['ko'])

        theme = overview_result.get('yearlyTheme', '') if overview_result else ''

        if language == 'ko':
            return f"""{persona}

{year}년 운세에 적합한 고전 명리학 인용구를 선정해주세요.
올해 주제: {theme}

## 사주 정보
{pillars_str}

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요.

```json
{{
  "classicalReferences": [
    {{
      "source": "자평진전",
      "quote": "고전 원문 인용",
      "interpretation": "현대적 해석과 이 사주에 대한 적용"
    }},
    {{
      "source": "궁통보감",
      "quote": "고전 원문 인용",
      "interpretation": "현대적 해석"
    }}
  ]
}}
```

**주의사항**:
- classicalReferences 배열에 2-3개 인용 포함
- source: "자평진전", "궁통보감", "적천수" 중 선택
- quote: 실제 고전 문헌의 관련 구절
- interpretation: 이 사주의 올해 운세에 어떻게 적용되는지 설명
"""
        elif language == 'en':
            return f"""{persona}

Select classical BaZi references appropriate for {year} fortune.
Yearly theme: {theme}

## BaZi Information
{pillars_str}

## Response Format (JSON)
```json
{{
  "classicalReferences": [
    {{
      "source": "Ziping Zhengquan",
      "quote": "Classical quote",
      "interpretation": "Modern interpretation"
    }}
  ]
}}
```

**Requirements**:
- Include 2-3 references in classicalReferences array
- source: "Ziping Zhengquan", "Qiongtong Baojian", or "Ditian Sui"
"""
        else:
            return cls.build_classical_refs('ko', year, pillars, overview_result)

    @classmethod
    def _format_pillars(cls, pillars: Dict[str, Any], language: LocaleType) -> str:
        """사주 정보를 문자열로 포맷"""
        if not pillars:
            return "사주 정보 없음"

        lines = []
        pillar_names = {
            'ko': {'year': '연주', 'month': '월주', 'day': '일주', 'hour': '시주'},
            'en': {'year': 'Year', 'month': 'Month', 'day': 'Day', 'hour': 'Hour'},
            'ja': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '時柱'},
            'zh-CN': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '时柱'},
            'zh-TW': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '時柱'},
        }

        names = pillar_names.get(language, pillar_names['ko'])

        for key in ['year', 'month', 'day', 'hour']:
            pillar = pillars.get(key, {})
            stem = pillar.get('stem', '?')
            branch = pillar.get('branch', '?')
            lines.append(f"- {names[key]}: {stem}{branch}")

        return "\n".join(lines)
