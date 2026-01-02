"""
English Prompt Locale
Modern, action-oriented style with BaZi terminology
"""
from typing import Dict


class EnglishLocale:
    """English locale prompt configuration"""

    LANGUAGE_CODE = 'en'
    LANGUAGE_NAME = 'English'

    # Tone & Style
    TONE = "Authoritative yet warm, professional but accessible"

    # Terminology Style
    TERMINOLOGY_STYLE = "Standard BaZi English terms (Day Master, Useful God, etc.)"

    # Classical Quote Style
    CLASSICAL_QUOTE_STYLE = "Original Chinese with English translation and interpretation"

    # Ten Gods Terms (PRD / The Destiny Code 스타일)
    TEN_GODS: Dict[str, str] = {
        "bijian": "Companion (比肩)",           # 비견 - 나와 동등한 동료
        "jiecai": "Rob Wealth (劫財)",          # 겁재
        "shishen": "Creative Output (食神)",    # 식신 - 창의적 표현
        "shangguan": "Hurting Officer (傷官)",  # 상관
        "zhengcai": "Direct Wealth (正財)",     # 정재
        "piancai": "Indirect Wealth (偏財)",    # 편재
        "zhengguan": "Direct Officer (正官)",   # 정관
        "qisha": "Seven Killings (偏官)",       # 칠살/편관
        "zhengyin": "Direct Resource (正印)",   # 정인 - 직접적 자원
        "pianyin": "Indirect Resource (偏印)",  # 편인 - 간접적 자원
    }

    # Element Terms
    ELEMENTS: Dict[str, str] = {
        "wood": "Wood (木)",
        "fire": "Fire (火)",
        "earth": "Earth (土)",
        "metal": "Metal (金)",
        "water": "Water (水)",
    }

    # Focus Area Labels
    FOCUS_AREA_LABELS: Dict[str, str] = {
        "wealth": "Wealth & Finance",
        "love": "Love & Relationships",
        "career": "Career & Success",
        "health": "Health & Wellness",
        "overall": "Comprehensive Analysis",
    }

    # Focus Area Descriptions
    FOCUS_AREA_DESCRIPTIONS: Dict[str, str] = {
        "wealth": "Financial flow, investment timing, and wealth-building strategies.",
        "love": "Relationship timing, compatibility factors, and connection strategies.",
        "career": "Career aptitude, advancement opportunities, and professional direction.",
        "health": "Physical vulnerabilities, wellness strategies, and preventive measures.",
        "overall": "Life direction, major patterns, and comprehensive life strategy.",
    }

    @classmethod
    def get_system_instruction(cls) -> str:
        """English system instructions"""
        return """
## Language & Style Guidelines

### Language
- All responses must be in English
- Use formal but accessible language
- Avoid jargon without explanation

### Terminology
- Use standard BaZi English terms
- First occurrence: "Day Master (日干) - your core essence"
- Subsequent uses: "Day Master" only
- Provide brief explanations for technical terms

### Classical References
- Include original Chinese characters when quoting classics
- Always provide English translation
- Add modern interpretation/application

### Tone & Manner
- Authoritative yet warm and encouraging
- Confident but not dogmatic
- Solution-focused, not problem-focused
- Use "tends to" and "may" instead of absolute predictions

### Advice Style
- Action-oriented and specific
- Include timing recommendations
- Provide 2-3 concrete action steps
- Connect insights to modern life contexts

Example:
- Poor: "You will have good luck"
- Good: "The second half of 2026, particularly September-October, shows strong opportunity energy. Consider expanding your network during this period..."

### Cultural Adaptation
- Use Western analogies when helpful (e.g., "similar to your Sun sign in astrology")
- Connect to modern career and lifestyle contexts
- Avoid cultural assumptions that don't translate
"""

    @classmethod
    def get_pillars_format(cls) -> str:
        """Four Pillars display format"""
        return """
## Four Pillars Display Format

Present the chart information as follows:

### Your BaZi Chart (Four Pillars)
| Hour Pillar | Day Pillar | Month Pillar | Year Pillar |
|:-----------:|:----------:|:------------:|:-----------:|
| {hour_stem} | {day_stem}★ | {month_stem} | {year_stem} |
| {hour_branch} | {day_branch} | {month_branch} | {year_branch} |

★ The Day Master represents YOU - your core essence and identity.
"""

    @classmethod
    def get_analysis_structure(cls) -> str:
        """Analysis structure guide"""
        return """
## Analysis Structure

1. **Executive Summary** (2-3 sentences)
   - Key chart characteristics and core strengths

2. **Personality Profile**
   - Day Master characteristics
   - 3-5 personality keywords
   - Strengths and growth areas

3. **Life Domain Analysis** (Wealth/Love/Career/Health)
   - Score (0-100) for each domain
   - Detailed analysis
   - Specific, actionable advice

4. **Five-Year Outlook**
   - Theme for each year
   - Score and key recommendations
   - Optimal timing for major decisions

5. **Classical Wisdom** (1-3 references)
   - Source text
   - Original quote
   - Modern interpretation and application
"""

    @classmethod
    def build(cls) -> str:
        """Build complete English locale prompt"""
        parts = [
            cls.get_system_instruction(),
            cls.get_pillars_format(),
            cls.get_analysis_structure(),
        ]

        return "\n".join(parts)
