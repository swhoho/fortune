"""
Gemini response_schema 정의
Pydantic 스키마와 동기화된 JSON Schema 형식

v1.1 (2026-01-07):
- Gemini 미지원 필드 제거 (minimum, maximum, minItems, enum)
- description으로 범위/조건 명시

주의: Gemini response_schema는 표준 JSON Schema 아님!
지원 필드: type, description, properties, items, required, nullable
미지원: minimum, maximum, minItems, maxItems, enum, pattern, format
"""

# ============================================
# Personality Schema (Step 2)
# ============================================
PERSONALITY_SCHEMA = {
    "type": "object",
    "properties": {
        "outerPersonality": {
            "type": "string",
            "description": "겉으로 보이는 성격 (300-500자)"
        },
        "innerPersonality": {
            "type": "string",
            "description": "내면의 성격 (300-500자)"
        },
        "willpower": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "description": "0-100 사이 점수"},
                "description": {"type": "string"}
            },
            "required": ["score", "description"]
        },
        "socialStyle": {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "weaknesses": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["type", "strengths", "weaknesses"]
        }
    },
    "required": ["outerPersonality", "innerPersonality", "willpower", "socialStyle"]
}

# ============================================
# Aptitude Schema (Step 3)
# ============================================
APTITUDE_SCHEMA = {
    "type": "object",
    "properties": {
        "keywords": {
            "type": "array",
            "items": {"type": "string"},
            "description": "적성 키워드 3-5개"
        },
        "talents": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "basis": {"type": "string"},
                    "level": {"type": "integer", "description": "0-100 사이 점수"},
                    "description": {"type": "string"}
                },
                "required": ["name", "level", "description"]
            }
        },
        "recommendedFields": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "suitability": {"type": "integer", "description": "0-100 사이 적합도"},
                    "description": {"type": "string"}
                },
                "required": ["name", "suitability", "description"]
            }
        },
        "avoidFields": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "reason": {"type": "string"}
                },
                "required": ["name", "reason"]
            }
        },
        "talentUsage": {
            "type": "object",
            "properties": {
                "currentLevel": {"type": "integer", "description": "0-100 사이 현재 수준"},
                "potential": {"type": "integer", "description": "0-100 사이 잠재력"},
                "advice": {"type": "string"}
            },
            "required": ["currentLevel", "potential", "advice"]
        },
        "studyStyle": {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["type", "description"]
        }
    },
    "required": ["keywords", "talents", "recommendedFields", "avoidFields", "talentUsage"]
}

# ============================================
# Fortune Schema (Step 4)
# ============================================
FORTUNE_SCHEMA = {
    "type": "object",
    "properties": {
        "wealth": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "wealthScore": {"type": "integer", "description": "0-100 사이 점수"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "risks": {"type": "array", "items": {"type": "string"}},
                "advice": {"type": "string"},
                "wealthFortune": {"type": "string"},
                "partnerInfluence": {"type": "string"}
            },
            "required": ["pattern", "wealthScore", "strengths", "risks", "advice"]
        },
        "love": {
            "type": "object",
            "properties": {
                "style": {"type": "string"},
                "loveScore": {"type": "integer", "description": "0-100 사이 점수"},
                "idealPartner": {"type": "array", "items": {"type": "string"}},
                "compatibilityPoints": {"type": "array", "items": {"type": "string"}},
                "warnings": {"type": "array", "items": {"type": "string"}},
                "loveAdvice": {"type": "string"},
                "datingPsychology": {"type": "string"},
                "spouseView": {"type": "string"},
                "personalityPattern": {"type": "string"}
            },
            "required": ["style", "loveScore", "idealPartner", "warnings", "loveAdvice"]
        }
    },
    "required": ["wealth", "love"]
}

# ============================================
# Basic Analysis Schema (Step 1)
# ============================================
BASIC_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "500자 이상의 상세한 사주 요약. 일간의 의미와 특성을 일상적 비유로 설명하고, 격국과 용신이 왜 필요한지 초보자도 이해할 수 있게 작성"
        },
        "dayMaster": {
            "type": "object",
            "properties": {
                "stem": {"type": "string"},
                "element": {"type": "string"},
                "yinYang": {"type": "string"},
                "characteristics": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["stem", "element", "yinYang", "characteristics"]
        },
        "structure": {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "quality": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["type", "quality", "description"]
        },
        "usefulGod": {
            "type": "object",
            "properties": {
                "primary": {"type": "string"},
                "secondary": {"type": "string"},
                "harmful": {"type": "string"},
                "reasoning": {"type": "string"}
            },
            "required": ["primary", "harmful", "reasoning"]
        }
    },
    "required": ["summary", "dayMaster", "structure", "usefulGod"]
}

# ============================================
# 단계별 스키마 매핑
# ============================================
GEMINI_SCHEMAS = {
    "basic": BASIC_ANALYSIS_SCHEMA,
    "basic_analysis": BASIC_ANALYSIS_SCHEMA,
    "personality": PERSONALITY_SCHEMA,
    "aptitude": APTITUDE_SCHEMA,
    "fortune": FORTUNE_SCHEMA,
}


# ============================================
# Yearly Analysis Schemas
# ============================================

YEARLY_OVERVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "year": {"type": "integer"},
        "summary": {"type": "string", "description": "300-500자 연간 요약"},
        "yearlyTheme": {"type": "string"},
        "overallScore": {"type": "integer", "description": "0-100 사이 점수"}
    },
    "required": ["year", "summary", "yearlyTheme", "overallScore"]
}

MONTHLY_FORTUNES_SCHEMA = {
    "type": "object",
    "properties": {
        "monthlyFortunes": {
            "type": "array",
            "description": "3개월 운세 배열",
            "items": {
                "type": "object",
                "properties": {
                    "month": {"type": "integer", "description": "1-12 사이 월"},
                    "theme": {"type": "string"},
                    "score": {"type": "integer", "description": "0-100 사이 점수"},
                    "overview": {"type": "string"},
                    "luckyDays": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "description": {"type": "string"}
                            }
                        }
                    },
                    "unluckyDays": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "date": {"type": "string"},
                                "description": {"type": "string"}
                            }
                        }
                    },
                    "advice": {"type": "string"},
                    "keywords": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["month", "theme", "score", "overview", "advice"]
            }
        }
    },
    "required": ["monthlyFortunes"]
}

YEARLY_ADVICE_SCHEMA = {
    "type": "object",
    "properties": {
        "yearlyAdvice": {
            "type": "object",
            "properties": {
                "nature_and_soul": {
                    "type": "object",
                    "properties": {
                        "first_half": {"type": "string"},
                        "second_half": {"type": "string"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "wealth_and_success": {
                    "type": "object",
                    "properties": {
                        "first_half": {"type": "string"},
                        "second_half": {"type": "string"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "career_and_honor": {
                    "type": "object",
                    "properties": {
                        "first_half": {"type": "string"},
                        "second_half": {"type": "string"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "document_and_wisdom": {
                    "type": "object",
                    "properties": {
                        "first_half": {"type": "string"},
                        "second_half": {"type": "string"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "relationship_and_love": {
                    "type": "object",
                    "properties": {
                        "first_half": {"type": "string"},
                        "second_half": {"type": "string"}
                    },
                    "required": ["first_half", "second_half"]
                },
                "health_and_movement": {
                    "type": "object",
                    "properties": {
                        "first_half": {"type": "string"},
                        "second_half": {"type": "string"}
                    },
                    "required": ["first_half", "second_half"]
                }
            },
            "required": [
                "nature_and_soul", "wealth_and_success", "career_and_honor",
                "document_and_wisdom", "relationship_and_love", "health_and_movement"
            ]
        }
    },
    "required": ["yearlyAdvice"]
}

KEY_DATES_SCHEMA = {
    "type": "object",
    "properties": {
        "keyDates": {
            "type": "array",
            "description": "최소 5개 이상의 주요 일자",
            "items": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "type": {"type": "string", "description": "lucky 또는 unlucky"},
                    "description": {"type": "string"},
                    "category": {"type": "string"}
                },
                "required": ["date", "type", "description"]
            }
        }
    },
    "required": ["keyDates"]
}

CLASSICAL_REFS_SCHEMA = {
    "type": "object",
    "properties": {
        "classicalReferences": {
            "type": "array",
            "description": "최소 2개 이상의 고전 인용",
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
    "required": ["classicalReferences"]
}

# ============================================
# Daewun Analysis Schema (대운 분석)
# ============================================
DAEWUN_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "daewunAnalysis": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "index": {"type": "integer"},
                    "scoreReasoning": {"type": "string", "description": "점수 산정 근거 (200-300자)"},
                    "summary": {"type": "string", "description": "대운 기간 종합 분석 (300-500자)"},
                    "favorablePercent": {"type": "integer", "description": "0-100 사이 유리한 비율"},
                    "unfavorablePercent": {"type": "integer", "description": "0-100 사이 불리한 비율"}
                },
                "required": ["scoreReasoning", "summary", "favorablePercent", "unfavorablePercent"]
            }
        }
    },
    "required": ["daewunAnalysis"]
}

# 단계별 스키마 매핑 확장
GEMINI_SCHEMAS.update({
    "yearly_overview": YEARLY_OVERVIEW_SCHEMA,
    "monthly_1_3": MONTHLY_FORTUNES_SCHEMA,
    "monthly_4_6": MONTHLY_FORTUNES_SCHEMA,
    "monthly_7_9": MONTHLY_FORTUNES_SCHEMA,
    "monthly_10_12": MONTHLY_FORTUNES_SCHEMA,
    "yearly_advice": YEARLY_ADVICE_SCHEMA,
    "key_dates": KEY_DATES_SCHEMA,
    "classical_refs": CLASSICAL_REFS_SCHEMA,
    "daewun_analysis": DAEWUN_ANALYSIS_SCHEMA,
})


def get_gemini_schema(step_name: str) -> dict:
    """
    단계별 Gemini response_schema 반환

    Args:
        step_name: 단계명 (basic, personality, aptitude, fortune, yearly_*, monthly_*)

    Returns:
        JSON Schema 딕셔너리 (없으면 None)
    """
    return GEMINI_SCHEMAS.get(step_name)
