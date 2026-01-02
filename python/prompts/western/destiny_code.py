"""
The Destiny Code 서구권 프레임워크
현대적이고 실용적인 해석 스타일
"""
from dataclasses import dataclass
from typing import List, Dict, Literal


@dataclass
class TermMapping:
    """동양-서양 용어 매핑"""
    korean: str         # 한국어
    chinese: str        # 한자
    english: str        # 영문
    modern_analogy: str # 현대적 비유


@dataclass
class ElementEnergy:
    """오행 에너지 특성"""
    element: str        # 오행
    english: str        # 영문명
    energy_type: str    # 에너지 유형
    keywords: List[str] # 핵심 키워드
    careers: List[str]  # 적합 직업
    action_advice: str  # 실천 조언


class DestinyCodePrompt:
    """서구권 프레임워크 프롬프트 생성"""

    # 용어 매핑 (동양 → 서양)
    TERM_MAPPINGS: List[TermMapping] = [
        # 기본 개념
        TermMapping("사주팔자", "四柱八字", "Four Pillars / BaZi Chart",
                   "Your cosmic DNA - the energetic blueprint you were born with"),
        TermMapping("일간", "日干", "Day Master",
                   "Your core essence - like your Sun sign in Western astrology, but more precise"),
        TermMapping("용신", "用神", "Useful God / Favorable Element",
                   "Your key success factor - the energy that unlocks your potential"),
        TermMapping("기신", "忌神", "Unfavorable Element",
                   "Challenging energy - areas requiring caution and strategic management"),
        TermMapping("격국", "格局", "Chart Structure / Life Pattern",
                   "Your life's architectural blueprint - the overall pattern of your destiny"),
        TermMapping("대운", "大運", "Luck Pillars / Decade Cycles",
                   "10-year life seasons - major shifts in your life's direction"),
        TermMapping("세운", "歲運", "Annual Luck / Yearly Energy",
                   "Annual themes and opportunities"),

        # 십신
        TermMapping("비견", "比肩", "Shoulder / Companion",
                   "Peer energy - competition, independence, self-reliance"),
        TermMapping("겁재", "劫財", "Rob Wealth",
                   "Aggressive competition - partnership dynamics, risk-taking"),
        TermMapping("식신", "食神", "Eating God / Output",
                   "Creative expression - talents, ideas, artistic output"),
        TermMapping("상관", "傷官", "Hurting Officer",
                   "Rebellious creativity - innovation, disruption, questioning authority"),
        TermMapping("정재", "正財", "Direct Wealth",
                   "Stable income - salary, investments, steady growth"),
        TermMapping("편재", "偏財", "Indirect Wealth",
                   "Windfall potential - entrepreneurship, speculative gains"),
        TermMapping("정관", "正官", "Direct Officer",
                   "Career authority - corporate success, leadership, reputation"),
        TermMapping("편관", "偏官", "Seven Killings",
                   "Power & pressure - executive power, military, high-stakes roles"),
        TermMapping("정인", "正印", "Direct Seal",
                   "Knowledge & protection - education, credentials, support systems"),
        TermMapping("편인", "偏印", "Indirect Seal",
                   "Unconventional wisdom - specialized skills, intuition, esoteric knowledge"),
    ]

    # 오행 에너지 매핑
    ELEMENT_ENERGIES: List[ElementEnergy] = [
        ElementEnergy(
            element="木",
            english="Wood",
            energy_type="Growth & Vision",
            keywords=["growth", "planning", "ambition", "benevolence", "flexibility"],
            careers=["Creative industries", "Education", "Consulting", "Startups", "Environmental sector"],
            action_advice="Focus on long-term planning. Invest in learning and personal development."
        ),
        ElementEnergy(
            element="火",
            english="Fire",
            energy_type="Passion & Visibility",
            keywords=["passion", "recognition", "charisma", "expression", "transformation"],
            careers=["Entertainment", "Media", "Marketing", "Public speaking", "Leadership roles"],
            action_advice="Build your personal brand. Seek visibility and public recognition."
        ),
        ElementEnergy(
            element="土",
            english="Earth",
            energy_type="Stability & Nurturing",
            keywords=["stability", "trust", "patience", "nurturing", "groundedness"],
            careers=["Real estate", "HR", "Healthcare", "Agriculture", "Hospitality"],
            action_advice="Create stable foundations. Build trust through consistency and reliability."
        ),
        ElementEnergy(
            element="金",
            english="Metal",
            energy_type="Precision & Justice",
            keywords=["precision", "discipline", "justice", "refinement", "determination"],
            careers=["Finance", "Law", "Engineering", "Surgery", "Quality control"],
            action_advice="Focus on excellence and precision. Make decisive choices and follow through."
        ),
        ElementEnergy(
            element="水",
            english="Water",
            energy_type="Wisdom & Adaptability",
            keywords=["wisdom", "adaptability", "communication", "intuition", "networking"],
            careers=["Research", "Consulting", "Writing", "Trade", "Technology"],
            action_advice="Embrace change and stay adaptable. Leverage your network and communication skills."
        ),
    ]

    # 현대적 해석 프레임워크
    MODERN_FRAMEWORKS: Dict[str, str] = {
        "career_mapping": """
## Career Alignment Framework

Your chart reveals natural strengths that align with specific career paths:

**Wealth Stars Dominant (財星)**
→ Business, Finance, Sales, Entrepreneurship
→ Action: Develop financial acumen and negotiation skills

**Officer Stars Dominant (官星)**
→ Management, Law, Government, Corporate Leadership
→ Action: Seek structured career paths with clear advancement

**Output Stars Dominant (食傷)**
→ Creative fields, Teaching, Entertainment, Writing
→ Action: Create content, share expertise, build audience

**Resource Stars Dominant (印星)**
→ Research, Education, Consulting, Healing professions
→ Action: Invest in credentials and specialized knowledge

**Companion Stars Dominant (比劫)**
→ Independent ventures, Competitive fields, Athletics
→ Action: Build personal brand and self-reliance
""",
        "relationship_dynamics": """
## Relationship Dynamics

Your chart indicates specific patterns in relationships:

**For romantic partnerships:**
- Day Master strength determines your capacity to commit
- Wealth stars (for men) / Officer stars (for women) indicate spouse characteristics
- Relationship timing correlates with Wealth/Officer stars in luck cycles

**For business partnerships:**
- Companion stars indicate peer dynamics
- Too many: competition > collaboration
- Too few: difficulty finding equal partners

**Action Steps:**
- Identify your relationship timing windows
- Understand your partner compatibility factors
- Work on areas that your chart shows as challenging
""",
        "timing_strategy": """
## Strategic Timing Framework

Use your luck cycles for optimal decision-making:

**Favorable Element Years (用神運)**
✓ Major investments and commitments
✓ Career changes and launches
✓ Relationship milestones
✓ Expansion and growth initiatives

**Challenging Element Years (忌神運)**
✓ Consolidate rather than expand
✓ Focus on maintenance and preparation
✓ Build reserves and safety nets
✓ Develop skills for future opportunities

**Clash Years (冲)**
✓ Expect change and movement
✓ Prepare for transitions
✓ Stay flexible and adaptable

**Combination Years (合)**
✓ New relationships and partnerships
✓ Mergers and collaborations
✓ Resolution of conflicts
"""
    }

    # 실용적 조언 템플릿
    ACTION_TEMPLATES: Dict[str, List[str]] = {
        "monthly": [
            "This month, focus on {focus_area} as your chart shows heightened {element} energy.",
            "Key dates to watch: {dates} when {aspect} activates.",
            "Recommended action: {specific_action}",
        ],
        "quarterly": [
            "Q{quarter} Theme: {theme}",
            "Priority areas: {priorities}",
            "Opportunities: {opportunities}",
            "Challenges to navigate: {challenges}",
        ],
        "annual": [
            "Annual Theme: {theme}",
            "Best months for: Career ({career_months}), Relationships ({relationship_months}), Wealth ({wealth_months})",
            "Key strategic focus: {strategy}",
        ]
    }

    @classmethod
    def get_term_glossary(cls, language: Literal['ko', 'en', 'ja', 'zh'] = 'en') -> str:
        """용어 사전 프롬프트"""
        lines = ["## Key Terms & Modern Interpretations\n"]

        for t in cls.TERM_MAPPINGS:
            if language == 'en':
                lines.append(f"**{t.english}** ({t.chinese})")
            elif language == 'ko':
                lines.append(f"**{t.korean}** ({t.chinese} / {t.english})")
            elif language == 'ja':
                lines.append(f"**{t.chinese}** ({t.english})")
            elif language == 'zh':
                lines.append(f"**{t.chinese}** ({t.english})")

            lines.append(f"- {t.modern_analogy}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_element_guide(cls, language: Literal['ko', 'en', 'ja', 'zh'] = 'en') -> str:
        """오행 에너지 가이드"""
        lines = ["## Five Elements as Energy Types\n"]

        for e in cls.ELEMENT_ENERGIES:
            if language == 'en':
                lines.append(f"### {e.english} ({e.element}) - {e.energy_type}")
            elif language == 'ko':
                lines.append(f"### {e.element} ({e.english}) - {e.energy_type}")
            elif language == 'ja':
                lines.append(f"### {e.element} ({e.english}) - {e.energy_type}")
            elif language == 'zh':
                lines.append(f"### {e.element} ({e.english}) - {e.energy_type}")

            lines.append(f"**Keywords**: {', '.join(e.keywords)}")
            lines.append(f"**Ideal careers**: {', '.join(e.careers)}")
            lines.append(f"**Action advice**: {e.action_advice}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_modern_interpretation_style(cls) -> str:
        """현대적 해석 스타일 가이드"""
        lines = [
            "## Modern Interpretation Guidelines\n",
            "### Communication Style",
            "- Use clear, actionable language",
            "- Connect ancient wisdom to modern contexts",
            "- Provide specific, measurable advice",
            "- Focus on empowerment, not fatalism",
            "",
            "### Key Principles",
            "1. **Strength-based**: Lead with natural talents and advantages",
            "2. **Action-oriented**: Every insight should have a practical application",
            "3. **Timing-conscious**: Emphasize when to act, not just what to do",
            "4. **Growth-focused**: Present challenges as development opportunities",
            "",
            "### Avoid",
            "- Superstitious language or fear-based messaging",
            "- Vague predictions without actionable guidance",
            "- Negative determinism (\"you will fail\")",
            "- Cultural-specific terms without explanation",
            ""
        ]

        return "\n".join(lines)

    @classmethod
    def get_frameworks(cls) -> str:
        """현대적 프레임워크 모음"""
        lines = ["## Practical Application Frameworks\n"]

        for key, content in cls.MODERN_FRAMEWORKS.items():
            lines.append(content)
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_action_advice_format(cls) -> str:
        """Action-oriented 조언 형식"""
        return """
## Advice Delivery Format

When providing advice, use this structure:

### 1. Insight (What)
Explain the pattern or tendency revealed by the chart.

### 2. Implication (So What)
Connect the insight to real-world outcomes and possibilities.

### 3. Action (Now What)
Provide 2-3 specific, actionable recommendations.

### Example:
**Insight**: Your chart shows strong Wood energy with Fire as your Useful God.
**Implication**: You thrive when expressing ideas and gaining visibility. Suppressed creativity leads to frustration.
**Action**:
- Start a side project that showcases your ideas
- Seek speaking or presentation opportunities at work
- Build your online presence through content creation

### Timing Recommendations:
- Best period for [action]: [timing based on luck cycles]
- Prepare during: [preparation phase]
- Avoid major moves during: [challenging periods]
"""

    @classmethod
    def build(cls, language: Literal['ko', 'en', 'ja', 'zh'] = 'en') -> str:
        """The Destiny Code 전체 프롬프트"""
        parts = [
            "# Modern Interpretation Framework (The Destiny Code)\n",
            "Bridging ancient wisdom with contemporary life applications.\n",
            cls.get_term_glossary(language),
            cls.get_element_guide(language),
            cls.get_modern_interpretation_style(),
            cls.get_frameworks(),
            cls.get_action_advice_format()
        ]

        return "\n".join(parts)
