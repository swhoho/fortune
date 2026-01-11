"""
오늘의 운세 프롬프트 빌더
Gemini AI용 프롬프트 생성
"""
from typing import Dict, Any, List, Optional

# 다국어 페르소나
PERSONA = {
    'ko': """당신은 30년 경력의 명리학 대가입니다. 매일의 운세를 사주 원국과 당일 간지의 상호작용으로 분석합니다.
분석은 서사체로 작성하며, bullet point나 리스트를 사용하지 않습니다.
핵심 포인트를 자연스러운 문장으로 연결하여 마치 대화하듯 조언을 전달합니다.""",

    'en': """You are a BaZi master with 30 years of experience. You analyze daily fortune through the interaction between natal chart and daily pillars.
Write in narrative prose without bullet points or lists.
Connect key insights naturally as if having a conversation with the reader.""",

    'ja': """あなたは30年の経験を持つ四柱推命の大家です。毎日の運勢を命式と日柱の相互作用で分析します。
箇条書きやリストは使わず、物語形式で記述してください。
重要なポイントを自然な文章でつなげ、対話するようにアドバイスを伝えてください。""",

    'zh-CN': """您是一位拥有30年经验的命理大师。您通过分析原命盘与当日干支的互动来解读每日运势。
请以叙述性散文形式撰写，不使用项目符号或列表。
自然地连接关键见解，如同与读者对话一般传达建议。""",

    'zh-TW': """您是一位擁有30年經驗的命理大師。您通過分析原命盤與當日干支的互動來解讀每日運勢。
請以敘述性散文形式撰寫，不使用項目符號或列表。
自然地連接關鍵見解，如同與讀者對話一般傳達建議。"""
}

# 오행 색상 매핑
ELEMENT_COLORS = {
    '木': {'ko': '초록색', 'en': 'green', 'ja': '緑', 'zh-CN': '绿色', 'zh-TW': '綠色'},
    '火': {'ko': '빨간색', 'en': 'red', 'ja': '赤', 'zh-CN': '红色', 'zh-TW': '紅色'},
    '土': {'ko': '노란색', 'en': 'yellow', 'ja': '黄色', 'zh-CN': '黄色', 'zh-TW': '黃色'},
    '金': {'ko': '흰색', 'en': 'white', 'ja': '白', 'zh-CN': '白色', 'zh-TW': '白色'},
    '水': {'ko': '검정색', 'en': 'black', 'ja': '黒', 'zh-CN': '黑色', 'zh-TW': '黑色'},
}

# 방향 매핑
ELEMENT_DIRECTIONS = {
    '木': {'ko': '동쪽', 'en': 'East', 'ja': '東', 'zh-CN': '东方', 'zh-TW': '東方'},
    '火': {'ko': '남쪽', 'en': 'South', 'ja': '南', 'zh-CN': '南方', 'zh-TW': '南方'},
    '土': {'ko': '중앙', 'en': 'Center', 'ja': '中央', 'zh-CN': '中央', 'zh-TW': '中央'},
    '金': {'ko': '서쪽', 'en': 'West', 'ja': '西', 'zh-CN': '西方', 'zh-TW': '西方'},
    '水': {'ko': '북쪽', 'en': 'North', 'ja': '北', 'zh-CN': '北方', 'zh-TW': '北方'},
}

# 천간-오행 매핑
STEM_ELEMENT = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
}

# 섹션 타이틀
SECTION_TITLES = {
    'career': {'ko': '직장/사업운', 'en': 'Career Fortune', 'ja': '仕事運', 'zh-CN': '事业运', 'zh-TW': '事業運'},
    'wealth': {'ko': '재물운', 'en': 'Wealth Fortune', 'ja': '財運', 'zh-CN': '财运', 'zh-TW': '財運'},
    'love': {'ko': '연애운', 'en': 'Love Fortune', 'ja': '恋愛運', 'zh-CN': '爱情运', 'zh-TW': '愛情運'},
    'health': {'ko': '건강운', 'en': 'Health Fortune', 'ja': '健康運', 'zh-CN': '健康运', 'zh-TW': '健康運'},
    'relationship': {'ko': '대인관계운', 'en': 'Relationship Fortune', 'ja': '対人運', 'zh-CN': '人际运', 'zh-TW': '人際運'},
}


class DailyFortunePrompts:
    """오늘의 운세 프롬프트 빌더"""

    @classmethod
    def build_fortune_prompt(
        cls,
        language: str,
        pillars: Dict[str, Any],
        day_stem: str,
        day_branch: str,
        target_date: str
    ) -> str:
        """
        오늘의 운세 분석 프롬프트 생성

        Args:
            language: 언어 코드
            pillars: 사주 팔자 데이터
            day_stem: 당일 천간
            day_branch: 당일 지지
            target_date: 대상 날짜 (YYYY-MM-DD)

        Returns:
            Gemini 프롬프트 문자열
        """
        persona = PERSONA.get(language, PERSONA['ko'])

        # 일간 추출
        day_pillar = pillars.get('day', {})
        natal_day_stem = day_pillar.get('stem', '')
        natal_day_branch = day_pillar.get('branch', '')

        # 당일 오행
        day_element = STEM_ELEMENT.get(day_stem, '土')

        # 사주 정보 포맷
        pillars_str = cls._format_pillars(pillars, language)

        # 분석 가이드
        analysis_guide = cls._get_analysis_guide(language)

        prompt = f"""{persona}

## 분석 대상
- 날짜: {target_date}
- 당일 천간: {day_stem}
- 당일 지지: {day_branch}
- 당일 오행: {day_element}

## 사주 원국
{pillars_str}

- 일간(日干): {natal_day_stem}
- 일지(日支): {natal_day_branch}

{analysis_guide}

## JSON 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 출력하세요.

{{
  "overallScore": 0-100 사이 정수 (당일 길흉 종합),
  "summary": "오늘의 총평 (200-400자, 서사체)",
  "luckyColor": "{ELEMENT_COLORS.get(day_element, {}).get(language, '노란색')}",
  "luckyNumber": 1-9 사이 정수,
  "luckyDirection": "{ELEMENT_DIRECTIONS.get(day_element, {}).get(language, '중앙')}",
  "careerFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['career'].get(language, '직장/사업운')}",
    "description": "직장/사업에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "wealthFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['wealth'].get(language, '재물운')}",
    "description": "재물에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "loveFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['love'].get(language, '연애운')}",
    "description": "연애에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "healthFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['health'].get(language, '건강운')}",
    "description": "건강에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "relationshipFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['relationship'].get(language, '대인관계운')}",
    "description": "대인관계에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "advice": "오늘 하루를 위한 종합 조언 (100-150자)"
}}
"""
        return prompt

    @classmethod
    def _format_pillars(cls, pillars: Dict[str, Any], language: str) -> str:
        """사주 팔자 포맷"""
        pillar_names = {
            'ko': {'year': '년주', 'month': '월주', 'day': '일주', 'hour': '시주'},
            'en': {'year': 'Year', 'month': 'Month', 'day': 'Day', 'hour': 'Hour'},
            'ja': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '時柱'},
            'zh-CN': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '时柱'},
            'zh-TW': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '時柱'},
        }
        names = pillar_names.get(language, pillar_names['ko'])

        lines = []
        for key in ['year', 'month', 'day', 'hour']:
            pillar = pillars.get(key, {})
            stem = pillar.get('stem', '?')
            branch = pillar.get('branch', '?')
            lines.append(f"- {names[key]}: {stem}{branch}")

        return '\n'.join(lines)

    @classmethod
    def _get_analysis_guide(cls, language: str) -> str:
        """분석 가이드"""
        guides = {
            'ko': """## 분석 기준

1. **일간과 당일 천간의 관계**: 생(生), 극(克), 합(合) 관계 분석
   - 생하면 기운이 북돋아지고, 극하면 갈등이 생기며, 합하면 조화를 이룹니다.

2. **일지와 당일 지지의 관계**: 충(沖), 형(刑), 합(合), 파(破), 해(害) 분석
   - 충은 변동과 충돌, 형은 시련, 합은 기회, 파는 분열, 해는 손해를 의미합니다.

3. **오행 밸런스 변화**: 당일 오행이 사주에 미치는 영향
   - 부족한 오행이 채워지면 좋고, 과다한 오행이 더해지면 주의가 필요합니다.

4. **점수 기준**:
   - 90-100: 대길 (매우 좋은 날)
   - 70-89: 길 (좋은 날)
   - 50-69: 평 (평범한 날)
   - 30-49: 소흉 (주의가 필요한 날)
   - 0-29: 흉 (조심해야 하는 날)

5. **점수 분포 규칙**:
   - 5개 영역의 점수가 모두 비슷하면 안 됩니다.
   - 최고 점수와 최저 점수 간격이 최소 30점 이상이어야 합니다.
   - 영역별로 의미 있는 차이를 두세요.""",

            'en': """## Analysis Criteria

1. **Day Master vs Daily Stem Relationship**: Analyze producing, controlling, combining relationships
   - Producing brings energy, controlling creates tension, combining brings harmony.

2. **Day Branch vs Daily Branch Relationship**: Analyze clash, punishment, combination, destruction, harm
   - Clash means change and conflict, punishment means trials, combination means opportunity.

3. **Five Elements Balance Change**: Impact of daily element on natal chart
   - Good if filling deficiency, caution needed if adding to excess.

4. **Score Criteria**:
   - 90-100: Excellent (very auspicious day)
   - 70-89: Good (favorable day)
   - 50-69: Average (normal day)
   - 30-49: Caution (needs attention)
   - 0-29: Challenging (be careful)

5. **Score Distribution Rules**:
   - All 5 areas should NOT have similar scores.
   - Gap between highest and lowest should be at least 30 points.
   - Create meaningful differences between areas.""",

            'ja': """## 分析基準

1. **日干と当日天干の関係**: 生、克、合の関係を分析
2. **日支と当日地支の関係**: 冲、刑、合、破、害を分析
3. **五行バランスの変化**: 当日の五行が命式に与える影響
4. **スコア基準**: 90-100:大吉、70-89:吉、50-69:平、30-49:小凶、0-29:凶
5. **スコア分布**: 5つの領域のスコアは全て似ていてはいけません。最高と最低の差は30点以上必要です。""",

            'zh-CN': """## 分析标准

1. **日干与当日天干的关系**: 分析生、克、合关系
2. **日支与当日地支的关系**: 分析冲、刑、合、破、害
3. **五行平衡变化**: 当日五行对命盘的影响
4. **评分标准**: 90-100:大吉、70-89:吉、50-69:平、30-49:小凶、0-29:凶
5. **评分分布**: 5个领域的分数不能都相似。最高分和最低分之间至少差30分。""",

            'zh-TW': """## 分析標準

1. **日干與當日天干的關係**: 分析生、克、合關係
2. **日支與當日地支的關係**: 分析沖、刑、合、破、害
3. **五行平衡變化**: 當日五行對命盤的影響
4. **評分標準**: 90-100:大吉、70-89:吉、50-69:平、30-49:小凶、0-29:凶
5. **評分分布**: 5個領域的分數不能都相似。最高分和最低分之間至少差30分。"""
        }
        return guides.get(language, guides['ko'])


# Gemini response_schema (JSON 강제 출력용)
DAILY_FORTUNE_SCHEMA = {
    "type": "object",
    "properties": {
        "overallScore": {"type": "integer"},
        "summary": {"type": "string"},
        "luckyColor": {"type": "string"},
        "luckyNumber": {"type": "integer"},
        "luckyDirection": {"type": "string"},
        "careerFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "wealthFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "loveFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "healthFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "relationshipFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "advice": {"type": "string"}
    },
    "required": [
        "overallScore", "summary", "luckyColor", "luckyNumber", "luckyDirection",
        "careerFortune", "wealthFortune", "loveFortune", "healthFortune",
        "relationshipFortune", "advice"
    ]
}
