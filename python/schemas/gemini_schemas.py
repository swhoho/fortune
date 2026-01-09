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
# v1.2 (2026-01-08): 실생활 조언 필드 추가
# - dayMaster.description: 일간 성격/행동 패턴 설명
# - structure.typeChinese, practicalAdvice: 격국 한자 + 실생활 조언
# - usefulGod.practicalApplication: 용신 활용법
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
                "stem": {"type": "string", "description": "천간 한자 (甲~癸)"},
                "element": {"type": "string", "description": "오행 한자 (木火土金水)"},
                "yinYang": {"type": "string", "description": "음양 (陰/陽)"},
                "characteristics": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "행동 특성 키워드 4-5개 (예: 리더십 강함, 숨김없는 표현)"
                },
                "description": {
                    "type": "string",
                    "description": "일간의 실제 성격과 행동 패턴 2-3문장. 대인관계 특징, 강점과 약점 포함"
                }
            },
            "required": ["stem", "element", "yinYang", "characteristics", "description"]
        },
        "structure": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "description": "격국명 한글 음독만 (반드시 한글로! 예: 식신격, 상관격, 정관격). 한자 사용 금지"},
                "typeChinese": {"type": "string", "description": "격국 한자 (예: 傷官格)"},
                "quality": {"type": "string", "description": "품질 (上/中/下)"},
                "description": {"type": "string", "description": "격국 형성 원리와 삶의 방식"},
                "practicalAdvice": {
                    "type": "object",
                    "description": "격국별 실생활 조언",
                    "properties": {
                        "lifeStrategy": {
                            "type": "string",
                            "description": "인생 전략 2-3문장. 이 격국이 성공하려면 어떤 방향으로 나아가야 하는지"
                        },
                        "careerTips": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "추천 직업 3-4개 (예: 크리에이터, 변호사)"
                        },
                        "pitfallsToAvoid": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "주의사항 2-3개. 빠지기 쉬운 함정"
                        }
                    },
                    "required": ["lifeStrategy", "careerTips", "pitfallsToAvoid"]
                }
            },
            "required": ["type", "typeChinese", "quality", "description", "practicalAdvice"]
        },
        "usefulGod": {
            "type": "object",
            "properties": {
                "primary": {"type": "string", "description": "용신 오행 한자 (木火土金水)"},
                "secondary": {"type": "string", "description": "희신 오행 한자 (없으면 빈 문자열)"},
                "harmful": {"type": "string", "description": "기신 오행 한자"},
                "reasoning": {"type": "string", "description": "용신 선정 근거"},
                "practicalApplication": {
                    "type": "string",
                    "description": "실생활 활용법 3-4문장. 유리한 업종, 좋은 방위(동서남북), 도움 되는 색상, 추천 활동, 기신 관련 피해야 할 것"
                }
            },
            "required": ["primary", "harmful", "reasoning", "practicalApplication"]
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
                    "favorablePercent": {"type": "integer", "description": "0-100 사이 순풍운 비율 (독립 계산)"},
                    "unfavorablePercent": {"type": "integer", "description": "0-100 사이 역풍운 비율 (독립 계산, 합계 100% 불필요)"}
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
    "classical_refs": CLASSICAL_REFS_SCHEMA,
    "daewun_analysis": DAEWUN_ANALYSIS_SCHEMA,
})


# ============================================
# Compatibility Analysis Schemas (궁합 분석)
# 주의: default 값 절대 금지! (Gemini가 그대로 복사함)
# ============================================

RELATIONSHIP_TYPE_SCHEMA = {
    "type": "object",
    "description": "인연의 성격 분석 - 두 사람이 만났을 때 형성되는 관계 유형",
    "properties": {
        "keywords": {
            "type": "array",
            "items": {"type": "string"},
            "description": "관계 유형을 나타내는 핵심 키워드 3-4개 (예: 불꽃같은 열정, 운명적 끌림)"
        },
        "firstImpression": {
            "type": "string",
            "description": "두 사람의 첫인상과 서로에게 끌리는 이유 분석 (150-200자)"
        },
        "developmentPattern": {
            "type": "string",
            "description": "관계가 시간에 따라 어떻게 발전하는지 예측 (200-300자). 초기-중기-장기 단계별 변화 포함"
        }
    },
    "required": ["keywords", "firstImpression", "developmentPattern"]
}

TRAIT_INTERPRETATION_SCHEMA = {
    "type": "object",
    "description": "연애 스타일 5항목 해석 - Python 점수를 바탕으로 각 항목 해석",
    "properties": {
        "items": {
            "type": "array",
            "description": "5개 항목(expression, possessiveness, devotion, adventure, stability) 해석",
            "items": {
                "type": "object",
                "properties": {
                    "trait": {
                        "type": "string",
                        "description": "항목명 (expression/possessiveness/devotion/adventure/stability)"
                    },
                    "traitName": {
                        "type": "string",
                        "description": "항목 한글명 (표현력/독점욕/헌신도/모험심/안정추구)"
                    },
                    "a_interpretation": {
                        "type": "string",
                        "description": "A의 해당 특성 해석 (50-100자)"
                    },
                    "b_interpretation": {
                        "type": "string",
                        "description": "B의 해당 특성 해석 (50-100자)"
                    },
                    "comparison": {
                        "type": "string",
                        "description": "두 사람의 해당 특성 비교 분석 (80-120자)"
                    }
                },
                "required": ["trait", "traitName", "a_interpretation", "b_interpretation", "comparison"]
            }
        },
        "overall": {
            "type": "string",
            "description": "연애 스타일 종합 평가 - 두 사람의 연애 케미 분석 (150-200자)"
        }
    },
    "required": ["items", "overall"]
}

CONFLICT_ANALYSIS_SCHEMA = {
    "type": "object",
    "description": "갈등 포인트 분석 - 충/형/파/해 기반 갈등 요소 도출",
    "properties": {
        "conflictPoints": {
            "type": "array",
            "description": "발생 가능한 갈등 포인트 목록 (2-4개)",
            "items": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string",
                        "description": "갈등의 명리학적 원인 (예: 子午 충, 寅巳 형)"
                    },
                    "description": {
                        "type": "string",
                        "description": "갈등이 일상에서 어떻게 나타나는지 구체적 설명 (100-150자)"
                    },
                    "resolution": {
                        "type": "string",
                        "description": "갈등 해결을 위한 실질적 조언 (80-120자)"
                    }
                },
                "required": ["source", "description", "resolution"]
            }
        },
        "avoidBehaviors": {
            "type": "array",
            "items": {"type": "string"},
            "description": "관계에서 피해야 할 행동 패턴 3-4개"
        },
        "communicationTips": {
            "type": "string",
            "description": "두 사람의 효과적인 소통 방법 (100-150자)"
        }
    },
    "required": ["conflictPoints", "avoidBehaviors", "communicationTips"]
}

MARRIAGE_FIT_SCHEMA = {
    "type": "object",
    "description": "결혼 적합도 분석 - 장기 관계와 결혼 후 예측",
    "properties": {
        "score": {
            "type": "integer",
            "description": "결혼 적합도 점수 (0-100). 총 궁합점수와 별개로 결혼 관점에서 평가"
        },
        "postMarriageChange": {
            "type": "string",
            "description": "결혼 후 예상되는 관계 변화 (150-200자)"
        },
        "roleDistribution": {
            "type": "string",
            "description": "가정 내 자연스러운 역할 분담 예측 (100-150자)"
        },
        "childFortune": {
            "type": "string",
            "description": "자녀운과 육아 시너지 (100-150자)"
        },
        "wealthSynergy": {
            "type": "string",
            "description": "재물운 시너지 - 경제적 협력 가능성 (100-150자)"
        }
    },
    "required": ["score", "postMarriageChange", "roleDistribution", "childFortune", "wealthSynergy"]
}

MUTUAL_INFLUENCE_SCHEMA = {
    "type": "object",
    "description": "상호 영향 분석 - 서로에게 주는 영향",
    "properties": {
        "aToB": {
            "type": "object",
            "description": "A가 B에게 주는 영향",
            "properties": {
                "tenGod": {
                    "type": "string",
                    "description": "A가 B에게 어떤 십신인지 (예: 정재, 편관)"
                },
                "meaning": {
                    "type": "string",
                    "description": "해당 십신의 관계적 의미 (50-80자)"
                },
                "positiveInfluence": {
                    "type": "string",
                    "description": "A가 B에게 주는 긍정적 영향 (100-150자)"
                },
                "caution": {
                    "type": "string",
                    "description": "A가 B에게 주의해야 할 점 (80-120자)"
                }
            },
            "required": ["tenGod", "meaning", "positiveInfluence", "caution"]
        },
        "bToA": {
            "type": "object",
            "description": "B가 A에게 주는 영향",
            "properties": {
                "tenGod": {
                    "type": "string",
                    "description": "B가 A에게 어떤 십신인지"
                },
                "meaning": {
                    "type": "string",
                    "description": "해당 십신의 관계적 의미 (50-80자)"
                },
                "positiveInfluence": {
                    "type": "string",
                    "description": "B가 A에게 주는 긍정적 영향 (100-150자)"
                },
                "caution": {
                    "type": "string",
                    "description": "B가 A에게 주의해야 할 점 (80-120자)"
                }
            },
            "required": ["tenGod", "meaning", "positiveInfluence", "caution"]
        },
        "synergy": {
            "type": "string",
            "description": "두 사람의 상호작용 시너지 종합 요약 (150-200자)"
        }
    },
    "required": ["aToB", "bToA", "synergy"]
}

# 간지 상호작용 해석 스키마
INTERACTION_INTERPRETATION_SCHEMA = {
    "type": "object",
    "properties": {
        "peachBlossom": {
            "type": "object",
            "description": "도화살 해석",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "도화살 제목 (예: '민지의 도화', '쌍방 도화', '도화 없음')"
                },
                "description": {
                    "type": "string",
                    "description": "도화살이 이 커플에게 미치는 영향 (100-150자)"
                },
                "advice": {
                    "type": "string",
                    "description": "도화살 관련 조언 (50-80자)"
                }
            },
            "required": ["title", "description", "advice"]
        },
        "samhapBanghap": {
            "type": "object",
            "description": "삼합/방합 해석",
            "properties": {
                "formations": {
                    "type": "array",
                    "description": "형성된 삼합/방합 목록",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "삼합/방합 이름 (예: '해묘미 목국')"
                            },
                            "description": {
                                "type": "string",
                                "description": "이 조합이 커플에게 주는 의미 (80-120자)"
                            }
                        },
                        "required": ["name", "description"]
                    }
                },
                "emptyMessage": {
                    "type": "string",
                    "description": "삼합/방합이 없을 때 메시지 (60-100자)"
                }
            },
            "required": ["formations", "emptyMessage"]
        },
        "stemCombinations": {
            "type": "object",
            "description": "천간합 해석",
            "properties": {
                "items": {
                    "type": "array",
                    "description": "천간합 목록",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "천간합 이름 (예: '갑기합토')"
                            },
                            "description": {
                                "type": "string",
                                "description": "이 천간합의 의미 (80-100자)"
                            }
                        },
                        "required": ["name", "description"]
                    }
                },
                "emptyMessage": {
                    "type": "string",
                    "description": "천간합이 없을 때 메시지 (50-80자)"
                }
            },
            "required": ["items", "emptyMessage"]
        },
        "branchCombinations": {
            "type": "object",
            "description": "지지합(6합) 해석",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "required": ["name", "description"]
                    }
                },
                "emptyMessage": {"type": "string"}
            },
            "required": ["items", "emptyMessage"]
        },
        "branchClashes": {
            "type": "object",
            "description": "지지충(6충) 해석",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "required": ["name", "description"]
                    }
                },
                "emptyMessage": {
                    "type": "string",
                    "description": "충이 없을 때 긍정적 의미 설명 (60-100자)"
                }
            },
            "required": ["items", "emptyMessage"]
        },
        "branchPunishments": {
            "type": "object",
            "description": "지지형(3형) 해석",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "required": ["name", "description"]
                    }
                },
                "emptyMessage": {
                    "type": "string",
                    "description": "형이 없을 때 긍정적 의미 설명 (60-100자)"
                }
            },
            "required": ["items", "emptyMessage"]
        },
        "branchWonjin": {
            "type": "object",
            "description": "원진 해석",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "원진 이름 (한글 음독 포함, 예: '묘신(卯申)원진')"
                            },
                            "description": {
                                "type": "string",
                                "description": "이 원진이 커플에게 미치는 심리적 영향 (80-120자)"
                            }
                        },
                        "required": ["name", "description"]
                    }
                },
                "emptyMessage": {
                    "type": "string",
                    "description": "원진이 없을 때 긍정적 의미 (60-100자)"
                }
            },
            "required": ["items", "emptyMessage"]
        }
    },
    "required": ["peachBlossom", "samhapBanghap", "stemCombinations", "branchCombinations", "branchClashes", "branchPunishments", "branchWonjin"]
}

# 궁합 분석 스키마 매핑 추가
GEMINI_SCHEMAS.update({
    "relationship_type": RELATIONSHIP_TYPE_SCHEMA,
    "trait_interpretation": TRAIT_INTERPRETATION_SCHEMA,
    "conflict_analysis": CONFLICT_ANALYSIS_SCHEMA,
    "marriage_fit": MARRIAGE_FIT_SCHEMA,
    "mutual_influence": MUTUAL_INFLUENCE_SCHEMA,
    "interaction_interpretation": INTERACTION_INTERPRETATION_SCHEMA,
})


def get_gemini_schema(step_name: str) -> dict:
    """
    단계별 Gemini response_schema 반환

    Args:
        step_name: 단계명 (basic, personality, aptitude, fortune, yearly_*, monthly_*, relationship_type, ...)

    Returns:
        JSON Schema 딕셔너리 (없으면 None)
    """
    return GEMINI_SCHEMAS.get(step_name)
