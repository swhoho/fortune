"""
AI 분석 출력 JSON 스키마 정의
Gemini responseSchema 및 프롬프트 내 스키마 설명용
"""
from typing import Literal

LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']

# Gemini 응답 JSON 스키마
OUTPUT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "사주 분석 한 줄 요약 (50자 이내)"
        },
        "personality": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "성격 분석 제목"},
                "content": {"type": "string", "description": "성격 분석 상세 내용 (500자)"},
                "keywords": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "성격 키워드 3-5개"
                }
            },
            "required": ["title", "content", "keywords"]
        },
        "wealth": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "content": {"type": "string"},
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "advice": {"type": "string"}
            },
            "required": ["title", "content", "score", "advice"]
        },
        "love": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "content": {"type": "string"},
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "advice": {"type": "string"}
            },
            "required": ["title", "content", "score", "advice"]
        },
        "career": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "content": {"type": "string"},
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "advice": {"type": "string"}
            },
            "required": ["title", "content", "score", "advice"]
        },
        "health": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "content": {"type": "string"},
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "advice": {"type": "string"}
            },
            "required": ["title", "content", "score", "advice"]
        },
        "yearly_flow": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer"},
                    "theme": {"type": "string"},
                    "score": {"type": "integer", "minimum": 0, "maximum": 100},
                    "advice": {"type": "string"}
                },
                "required": ["year", "theme", "score", "advice"]
            },
            "description": "향후 5년간 연도별 운세"
        },
        "classical_references": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {"type": "string", "description": "고전 출처"},
                    "quote": {"type": "string", "description": "원문 인용"},
                    "interpretation": {"type": "string", "description": "현대적 해석"}
                },
                "required": ["source", "quote", "interpretation"]
            },
            "description": "관련 고전 인용 1-3개"
        }
    },
    "required": [
        "summary",
        "personality",
        "wealth",
        "love",
        "career",
        "health",
        "yearly_flow",
        "classical_references"
    ]
}


def get_output_schema_description(language: Literal['ko', 'en', 'ja', 'zh']) -> str:
    """언어별 출력 스키마 설명 문자열 반환"""

    descriptions = {
        'ko': """
## 출력 형식 (JSON)
반드시 아래 형식으로 응답하세요:

```json
{
  "summary": "사주 한 줄 요약 (50자 이내)",
  "personality": {
    "title": "성격 분석",
    "content": "성격 분석 상세 내용 (500자)",
    "keywords": ["키워드1", "키워드2", "키워드3"]
  },
  "wealth": {
    "title": "재물운",
    "content": "상세 분석",
    "score": 0-100,
    "advice": "구체적 조언"
  },
  "love": { ... },
  "career": { ... },
  "health": { ... },
  "yearly_flow": [
    {"year": 2026, "theme": "테마", "score": 0-100, "advice": "조언"}
  ],
  "classical_references": [
    {"source": "자평진전", "quote": "원문", "interpretation": "해석"}
  ]
}
```
""",
        'en': """
## Output Format (JSON)
You must respond in the following format:

```json
{
  "summary": "One-line summary (under 50 characters)",
  "personality": {
    "title": "Personality Analysis",
    "content": "Detailed personality analysis (500 characters)",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  },
  "wealth": {
    "title": "Wealth Fortune",
    "content": "Detailed analysis",
    "score": 0-100,
    "advice": "Specific advice"
  },
  "love": { ... },
  "career": { ... },
  "health": { ... },
  "yearly_flow": [
    {"year": 2026, "theme": "Theme", "score": 0-100, "advice": "Advice"}
  ],
  "classical_references": [
    {"source": "Ziping Zhengquan", "quote": "Original text", "interpretation": "Interpretation"}
  ]
}
```
""",
        'ja': """
## 出力形式 (JSON)
必ず以下の形式で回答してください：

```json
{
  "summary": "運勢の一言要約（50文字以内）",
  "personality": {
    "title": "性格分析",
    "content": "性格分析の詳細（500文字）",
    "keywords": ["キーワード1", "キーワード2", "キーワード3"]
  },
  "wealth": {
    "title": "金運",
    "content": "詳細分析",
    "score": 0-100,
    "advice": "具体的なアドバイス"
  },
  "love": { ... },
  "career": { ... },
  "health": { ... },
  "yearly_flow": [
    {"year": 2026, "theme": "テーマ", "score": 0-100, "advice": "アドバイス"}
  ],
  "classical_references": [
    {"source": "子平真詮", "quote": "原文", "interpretation": "解釈"}
  ]
}
```
""",
        'zh': """
## 输出格式 (JSON)
必须按以下格式回答：

```json
{
  "summary": "命盘一句话总结（50字以内）",
  "personality": {
    "title": "性格分析",
    "content": "性格分析详细内容（500字）",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  },
  "wealth": {
    "title": "财运",
    "content": "详细分析",
    "score": 0-100,
    "advice": "具体建议"
  },
  "love": { ... },
  "career": { ... },
  "health": { ... },
  "yearly_flow": [
    {"year": 2026, "theme": "主题", "score": 0-100, "advice": "建议"}
  ],
  "classical_references": [
    {"source": "子平真诠", "quote": "原文", "interpretation": "解读"}
  ]
}
```
"""
    }

    return descriptions.get(language, descriptions['ko'])


# ============================================
# Task 20: 신년 분석 출력 스키마
# ============================================

YEARLY_OUTPUT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "year": {
            "type": "integer",
            "description": "분석 대상 연도"
        },
        "summary": {
            "type": "string",
            "description": "연도 총평 (100자 이내)"
        },
        "yearlyTheme": {
            "type": "string",
            "description": "해의 주제 (예: 도약의 해)"
        },
        "overallScore": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
            "description": "종합 점수"
        },
        "monthlyFortunes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "month": {"type": "integer", "minimum": 1, "maximum": 12},
                    "theme": {"type": "string"},
                    "score": {"type": "integer", "minimum": 0, "maximum": 100},
                    "overview": {"type": "string", "description": "월별 개요 (100-200자)"},
                    "luckyDays": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string", "description": "YYYY-MM-DD 형식"},
                                "dayOfWeek": {"type": "string"},
                                "reason": {"type": "string"},
                                "suitableFor": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            },
                            "required": ["date", "dayOfWeek", "reason", "suitableFor"]
                        },
                        "minItems": 3,
                        "maxItems": 5
                    },
                    "unluckyDays": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "dayOfWeek": {"type": "string"},
                                "reason": {"type": "string"},
                                "avoid": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            },
                            "required": ["date", "dayOfWeek", "reason", "avoid"]
                        },
                        "minItems": 1,
                        "maxItems": 3
                    },
                    "advice": {"type": "string"},
                    "keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 3,
                        "maxItems": 3
                    }
                },
                "required": ["month", "theme", "score", "overview", "luckyDays", "unluckyDays", "advice", "keywords"]
            },
            "minItems": 12,
            "maxItems": 12
        },
        "quarterlyHighlights": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "quarter": {"type": "integer", "minimum": 1, "maximum": 4},
                    "theme": {"type": "string"},
                    "score": {"type": "integer", "minimum": 0, "maximum": 100},
                    "summary": {"type": "string"}
                },
                "required": ["quarter", "theme", "score", "summary"]
            },
            "minItems": 4,
            "maxItems": 4
        },
        "keyDates": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "type": {"type": "string", "enum": ["lucky", "unlucky", "neutral"]},
                    "significance": {"type": "string"},
                    "recommendation": {"type": "string"}
                },
                "required": ["date", "type", "significance", "recommendation"]
            },
            "minItems": 10,
            "maxItems": 15
        },
        "yearlyAdvice": {
            "type": "object",
            "properties": {
                "wealth": {"type": "string"},
                "love": {"type": "string"},
                "career": {"type": "string"},
                "health": {"type": "string"}
            },
            "required": ["wealth", "love", "career", "health"]
        },
        "classicalReferences": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "quote": {"type": "string"},
                    "interpretation": {"type": "string"}
                },
                "required": ["source", "quote", "interpretation"]
            }
        }
    },
    "required": [
        "year",
        "summary",
        "yearlyTheme",
        "overallScore",
        "monthlyFortunes",
        "quarterlyHighlights",
        "keyDates",
        "yearlyAdvice",
        "classicalReferences"
    ]
}


def get_yearly_output_schema_description(language: LocaleType, year: int) -> str:
    """신년 분석용 출력 스키마 설명"""

    descriptions = {
        'ko': f"""
## 출력 형식 (JSON) - {year}년 신년 운세

반드시 아래 형식으로 응답하세요:

```json
{{
  "year": {year},
  "summary": "연도 총평 (100자 이내)",
  "yearlyTheme": "해의 주제 (예: 도약의 해)",
  "overallScore": 0-100,
  "monthlyFortunes": [
    {{
      "month": 1,
      "theme": "월의 테마",
      "score": 0-100,
      "overview": "월별 개요 (100-200자)",
      "luckyDays": [
        {{
          "date": "{year}-01-15",
          "dayOfWeek": "수요일",
          "reason": "길일인 이유",
          "suitableFor": ["계약", "이사", "취업"]
        }}
      ],
      "unluckyDays": [
        {{
          "date": "{year}-01-20",
          "dayOfWeek": "월요일",
          "reason": "흉일인 이유",
          "avoid": ["큰 결정", "이직"]
        }}
      ],
      "advice": "월별 조언",
      "keywords": ["키워드1", "키워드2", "키워드3"]
    }}
  ],
  "quarterlyHighlights": [
    {{"quarter": 1, "theme": "분기 테마", "score": 0-100, "summary": "분기 요약"}}
  ],
  "keyDates": [
    {{"date": "{year}-03-21", "type": "lucky", "significance": "중요도", "recommendation": "추천 사항"}}
  ],
  "yearlyAdvice": {{
    "wealth": "재물운 연간 조언",
    "love": "연애운 연간 조언",
    "career": "직장운 연간 조언",
    "health": "건강운 연간 조언"
  }},
  "classicalReferences": [
    {{"source": "자평진전", "quote": "원문", "interpretation": "해석"}}
  ]
}}
```

**중요**: monthlyFortunes는 반드시 12개월 모두 포함해야 합니다.
""",
        'en': f"""
## Output Format (JSON) - {year} Yearly Fortune

You must respond in the following format:

```json
{{
  "year": {year},
  "summary": "Yearly summary (under 100 characters)",
  "yearlyTheme": "Theme of the year (e.g., Year of Growth)",
  "overallScore": 0-100,
  "monthlyFortunes": [
    {{
      "month": 1,
      "theme": "Monthly theme",
      "score": 0-100,
      "overview": "Monthly overview (100-200 characters)",
      "luckyDays": [
        {{
          "date": "{year}-01-15",
          "dayOfWeek": "Wednesday",
          "reason": "Why this is a lucky day",
          "suitableFor": ["contracts", "moving", "job interviews"]
        }}
      ],
      "unluckyDays": [
        {{
          "date": "{year}-01-20",
          "dayOfWeek": "Monday",
          "reason": "Why to be cautious",
          "avoid": ["major decisions", "job changes"]
        }}
      ],
      "advice": "Monthly advice",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }}
  ],
  "quarterlyHighlights": [
    {{"quarter": 1, "theme": "Quarter theme", "score": 0-100, "summary": "Quarter summary"}}
  ],
  "keyDates": [
    {{"date": "{year}-03-21", "type": "lucky", "significance": "Significance", "recommendation": "Recommendation"}}
  ],
  "yearlyAdvice": {{
    "wealth": "Yearly wealth advice",
    "love": "Yearly love advice",
    "career": "Yearly career advice",
    "health": "Yearly health advice"
  }},
  "classicalReferences": [
    {{"source": "Ziping Zhengquan", "quote": "Original text", "interpretation": "Interpretation"}}
  ]
}}
```

**Important**: monthlyFortunes must include all 12 months.
""",
        'ja': f"""
## 出力形式 (JSON) - {year}年 年間運勢

必ず以下の形式で回答してください：

```json
{{
  "year": {year},
  "summary": "年間総評（100文字以内）",
  "yearlyTheme": "年のテーマ（例：飛躍の年）",
  "overallScore": 0-100,
  "monthlyFortunes": [
    {{
      "month": 1,
      "theme": "月のテーマ",
      "score": 0-100,
      "overview": "月別概要（100-200文字）",
      "luckyDays": [
        {{
          "date": "{year}-01-15",
          "dayOfWeek": "水曜日",
          "reason": "吉日の理由",
          "suitableFor": ["契約", "引越し", "就職"]
        }}
      ],
      "unluckyDays": [
        {{
          "date": "{year}-01-20",
          "dayOfWeek": "月曜日",
          "reason": "凶日の理由",
          "avoid": ["大きな決断", "転職"]
        }}
      ],
      "advice": "月別アドバイス",
      "keywords": ["キーワード1", "キーワード2", "キーワード3"]
    }}
  ],
  "quarterlyHighlights": [...],
  "keyDates": [...],
  "yearlyAdvice": {{...}},
  "classicalReferences": [...]
}}
```

**重要**: monthlyFortunesには必ず12ヶ月すべてを含めてください。
""",
        'zh-CN': f"""
## 输出格式 (JSON) - {year}年 年度运势

必须按以下格式回答：

```json
{{
  "year": {year},
  "summary": "年度总评（100字以内）",
  "yearlyTheme": "年度主题（例：飞跃之年）",
  "overallScore": 0-100,
  "monthlyFortunes": [
    {{
      "month": 1,
      "theme": "月度主题",
      "score": 0-100,
      "overview": "月度概述（100-200字）",
      "luckyDays": [
        {{
          "date": "{year}-01-15",
          "dayOfWeek": "星期三",
          "reason": "吉日原因",
          "suitableFor": ["签约", "搬家", "求职"]
        }}
      ],
      "unluckyDays": [...],
      "advice": "月度建议",
      "keywords": ["关键词1", "关键词2", "关键词3"]
    }}
  ],
  "quarterlyHighlights": [...],
  "keyDates": [...],
  "yearlyAdvice": {{...}},
  "classicalReferences": [...]
}}
```

**重要**: monthlyFortunes必须包含全部12个月。
""",
        'zh-TW': f"""
## 輸出格式 (JSON) - {year}年 年度運勢

必須按以下格式回答：

```json
{{
  "year": {year},
  "summary": "年度總評（100字以內）",
  "yearlyTheme": "年度主題（例：飛躍之年）",
  "overallScore": 0-100,
  "monthlyFortunes": [
    {{
      "month": 1,
      "theme": "月度主題",
      "score": 0-100,
      "overview": "月度概述（100-200字）",
      "luckyDays": [
        {{
          "date": "{year}-01-15",
          "dayOfWeek": "星期三",
          "reason": "吉日原因",
          "suitableFor": ["簽約", "搬家", "求職"]
        }}
      ],
      "unluckyDays": [...],
      "advice": "月度建議",
      "keywords": ["關鍵詞1", "關鍵詞2", "關鍵詞3"]
    }}
  ],
  "quarterlyHighlights": [...],
  "keyDates": [...],
  "yearlyAdvice": {{...}},
  "classicalReferences": [...]
}}
```

**重要**: monthlyFortunes必須包含全部12個月。
"""
    }

    return descriptions.get(language, descriptions['ko'])
