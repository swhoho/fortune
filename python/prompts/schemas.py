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


def get_output_schema_description(language: Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']) -> str:
    """언어별 출력 스키마 설명 문자열 반환"""

    descriptions = {
        'ko': """
## 출력 형식 (JSON)
**중요**: JSON 키는 반드시 영문을 사용하고, 값(내용)만 한국어로 작성하세요.
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
**重要**: JSONキーは必ず英語を使用し、値（内容）のみ日本語で記述してください。
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
        'zh-CN': """
## 输出格式 (JSON)
**重要**: JSON键必须使用英文，仅值（内容）用中文书写。
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
""",
        'zh-TW': """
## 輸出格式 (JSON)
**重要**: JSON鍵必須使用英文，僅值（內容）用中文書寫。
必須按以下格式回答：

```json
{
  "summary": "命盤一句話總結（50字以內）",
  "personality": {
    "title": "性格分析",
    "content": "性格分析詳細內容（500字）",
    "keywords": ["關鍵詞1", "關鍵詞2", "關鍵詞3"]
  },
  "wealth": {
    "title": "財運",
    "content": "詳細分析",
    "score": 0-100,
    "advice": "具體建議"
  },
  "love": { ... },
  "career": { ... },
  "health": { ... },
  "yearly_flow": [
    {"year": 2026, "theme": "主題", "score": 0-100, "advice": "建議"}
  ],
  "classical_references": [
    {"source": "子平真詮", "quote": "原文", "interpretation": "解讀"}
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
            "description": "분기별 하이라이트 (deprecated - 빈 배열 허용)",
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
            "minItems": 0,
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
            "description": "6개 섹션 연간 조언 (상반기/하반기 구분)",
            "properties": {
                "nature_and_soul": {
                    "type": "object",
                    "description": "SECTION 1: 본연의 성정과 신년의 기류",
                    "properties": {
                        "first_half": {"type": "string", "description": "상반기(1~6월) 분석 (400~600자)"},
                        "second_half": {"type": "string", "description": "하반기(7~12월) 분석 (400~600자)"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "wealth_and_success": {
                    "type": "object",
                    "description": "SECTION 2: 재물과 비즈니스의 조류",
                    "properties": {
                        "first_half": {"type": "string", "description": "상반기(1~6월) 분석 (500~700자)"},
                        "second_half": {"type": "string", "description": "하반기(7~12월) 분석 (500~700자)"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "career_and_honor": {
                    "type": "object",
                    "description": "SECTION 3: 직업적 성취와 명예의 궤적",
                    "properties": {
                        "first_half": {"type": "string", "description": "상반기(1~6월) 분석 (500~700자)"},
                        "second_half": {"type": "string", "description": "하반기(7~12월) 분석 (500~700자)"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "document_and_wisdom": {
                    "type": "object",
                    "description": "SECTION 4: 문서의 인연과 학업의 결실",
                    "properties": {
                        "first_half": {"type": "string", "description": "상반기(1~6월) 분석 (400~600자)"},
                        "second_half": {"type": "string", "description": "하반기(7~12월) 분석 (400~600자)"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "relationship_and_love": {
                    "type": "object",
                    "description": "SECTION 5: 인연의 파동과 사회적 관계",
                    "properties": {
                        "first_half": {"type": "string", "description": "상반기(1~6월) 분석 (500~700자)"},
                        "second_half": {"type": "string", "description": "하반기(7~12월) 분석 (500~700자)"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "health_and_movement": {
                    "type": "object",
                    "description": "SECTION 6: 신체의 조화와 환경의 변화",
                    "properties": {
                        "first_half": {"type": "string", "description": "상반기(1~6월) 분석 (400~600자)"},
                        "second_half": {"type": "string", "description": "하반기(7~12월) 분석 (400~600자)"}
                    },
                    "required": ["first_half", "second_half"]
                }
            },
            "required": [
                "nature_and_soul",
                "wealth_and_success",
                "career_and_honor",
                "document_and_wisdom",
                "relationship_and_love",
                "health_and_movement"
            ]
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

**중요**: JSON 키는 반드시 영문을 사용하고, 값(내용)만 한국어로 작성하세요.
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
  "quarterlyHighlights": [],
  "keyDates": [
    {{"date": "{year}-03-21", "type": "lucky", "significance": "중요도", "recommendation": "추천 사항"}}
  ],
  "yearlyAdvice": {{
    "nature_and_soul": {{
      "first_half": "상반기 본연의 성정 분석 (400~600자 서사체)",
      "second_half": "하반기 본연의 성정 분석 (400~600자 서사체)"
    }},
    "wealth_and_success": {{
      "first_half": "상반기 재물운 분석 (500~700자 서사체)",
      "second_half": "하반기 재물운 분석 (500~700자 서사체)"
    }},
    "career_and_honor": {{
      "first_half": "상반기 직업운 분석 (500~700자 서사체)",
      "second_half": "하반기 직업운 분석 (500~700자 서사체)"
    }},
    "document_and_wisdom": {{
      "first_half": "상반기 문서/학업운 분석 (400~600자 서사체)",
      "second_half": "하반기 문서/학업운 분석 (400~600자 서사체)"
    }},
    "relationship_and_love": {{
      "first_half": "상반기 인연/관계운 분석 (500~700자 서사체)",
      "second_half": "하반기 인연/관계운 분석 (500~700자 서사체)"
    }},
    "health_and_movement": {{
      "first_half": "상반기 건강/이동운 분석 (400~600자 서사체)",
      "second_half": "하반기 건강/이동운 분석 (400~600자 서사체)"
    }}
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
  "quarterlyHighlights": [],
  "keyDates": [
    {{"date": "{year}-03-21", "type": "lucky", "significance": "Significance", "recommendation": "Recommendation"}}
  ],
  "yearlyAdvice": {{
    "nature_and_soul": {{
      "first_half": "First half nature/soul analysis (400-600 chars narrative)",
      "second_half": "Second half nature/soul analysis (400-600 chars narrative)"
    }},
    "wealth_and_success": {{
      "first_half": "First half wealth analysis (500-700 chars narrative)",
      "second_half": "Second half wealth analysis (500-700 chars narrative)"
    }},
    "career_and_honor": {{
      "first_half": "First half career analysis (500-700 chars narrative)",
      "second_half": "Second half career analysis (500-700 chars narrative)"
    }},
    "document_and_wisdom": {{
      "first_half": "First half document/study analysis (400-600 chars narrative)",
      "second_half": "Second half document/study analysis (400-600 chars narrative)"
    }},
    "relationship_and_love": {{
      "first_half": "First half relationship analysis (500-700 chars narrative)",
      "second_half": "Second half relationship analysis (500-700 chars narrative)"
    }},
    "health_and_movement": {{
      "first_half": "First half health/movement analysis (400-600 chars narrative)",
      "second_half": "Second half health/movement analysis (400-600 chars narrative)"
    }}
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

**重要**: JSONキーは必ず英語を使用し、値（内容）のみ日本語で記述してください。
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
  "quarterlyHighlights": [],
  "keyDates": [...],
  "yearlyAdvice": {{
    "nature_and_soul": {{"first_half": "上半期分析", "second_half": "下半期分析"}},
    "wealth_and_success": {{"first_half": "上半期分析", "second_half": "下半期分析"}},
    "career_and_honor": {{"first_half": "上半期分析", "second_half": "下半期分析"}},
    "document_and_wisdom": {{"first_half": "上半期分析", "second_half": "下半期分析"}},
    "relationship_and_love": {{"first_half": "上半期分析", "second_half": "下半期分析"}},
    "health_and_movement": {{"first_half": "上半期分析", "second_half": "下半期分析"}}
  }},
  "classicalReferences": [...]
}}
```

**重要**: monthlyFortunesには必ず12ヶ月すべてを含めてください。yearlyAdviceは6つのセクションで上半期/下半期に分けて記述してください。
""",
        'zh-CN': f"""
## 输出格式 (JSON) - {year}年 年度运势

**重要**: JSON键必须使用英文，仅值（内容）用中文书写。
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
  "quarterlyHighlights": [],
  "keyDates": [...],
  "yearlyAdvice": {{
    "nature_and_soul": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "wealth_and_success": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "career_and_honor": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "document_and_wisdom": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "relationship_and_love": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "health_and_movement": {{"first_half": "上半年分析", "second_half": "下半年分析"}}
  }},
  "classicalReferences": [...]
}}
```

**重要**: monthlyFortunes必须包含全部12个月。yearlyAdvice需包含6个板块，每个板块分上半年/下半年叙述。
""",
        'zh-TW': f"""
## 輸出格式 (JSON) - {year}年 年度運勢

**重要**: JSON鍵必須使用英文，僅值（內容）用中文書寫。
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
  "quarterlyHighlights": [],
  "keyDates": [...],
  "yearlyAdvice": {{
    "nature_and_soul": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "wealth_and_success": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "career_and_honor": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "document_and_wisdom": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "relationship_and_love": {{"first_half": "上半年分析", "second_half": "下半年分析"}},
    "health_and_movement": {{"first_half": "上半年分析", "second_half": "下半年分析"}}
  }},
  "classicalReferences": [...]
}}
```

**重要**: monthlyFortunes必須包含全部12個月。yearlyAdvice需包含6個板塊，每個板塊分上半年/下半年敘述。
"""
    }

    return descriptions.get(language, descriptions['ko'])
