"""
The Destiny Code 서구권 프레임워크
현대적이고 실용적인 해석 스타일

Joey Yap의 "BaZi - The Destiny Code" 기반
지원 언어: ko, en, ja, zh-CN, zh-TW
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Literal

LanguageType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


# =============================================================================
# 4.3.1: 십신 용어 다국어 매핑 (The Destiny Code 용어 기준)
# =============================================================================
TEN_GODS_MAPPING: Dict[str, Dict[str, str]] = {
    "비견": {
        "ko": "비견(比肩)",
        "en": "Friend",
        "ja": "比肩（ひけん）",
        "zh-CN": "比肩",
        "zh-TW": "比肩",
    },
    "겁재": {
        "ko": "겁재(劫財)",
        "en": "Rob Wealth",
        "ja": "劫財（ごうざい）",
        "zh-CN": "劫财",
        "zh-TW": "劫財",
    },
    "식신": {
        "ko": "식신(食神)",
        "en": "Eating God",
        "ja": "食神（しょくじん）",
        "zh-CN": "食神",
        "zh-TW": "食神",
    },
    "상관": {
        "ko": "상관(傷官)",
        "en": "Hurting Officer",
        "ja": "傷官（しょうかん）",
        "zh-CN": "伤官",
        "zh-TW": "傷官",
    },
    "정재": {
        "ko": "정재(正財)",
        "en": "Direct Wealth",
        "ja": "正財（せいざい）",
        "zh-CN": "正财",
        "zh-TW": "正財",
    },
    "편재": {
        "ko": "편재(偏財)",
        "en": "Indirect Wealth",
        "ja": "偏財（へんざい）",
        "zh-CN": "偏财",
        "zh-TW": "偏財",
    },
    "정관": {
        "ko": "정관(正官)",
        "en": "Direct Officer",
        "ja": "正官（せいかん）",
        "zh-CN": "正官",
        "zh-TW": "正官",
    },
    "편관": {
        "ko": "편관(偏官/七殺)",
        "en": "Seven Killings",
        "ja": "偏官（へんかん）/七殺",
        "zh-CN": "偏官/七杀",
        "zh-TW": "偏官/七殺",
    },
    "정인": {
        "ko": "정인(正印)",
        "en": "Direct Resource",
        "ja": "正印（せいいん）",
        "zh-CN": "正印",
        "zh-TW": "正印",
    },
    "편인": {
        "ko": "편인(偏印)",
        "en": "Indirect Resource",
        "ja": "偏印（へんいん）",
        "zh-CN": "偏印",
        "zh-TW": "偏印",
    },
}

# 오행 다국어 매핑 (The Five Factors)
FIVE_FACTORS_MAPPING: Dict[str, Dict[str, str]] = {
    "재성": {
        "ko": "재성(財星) - 재물",
        "en": "Wealth Star - Financial capacity",
        "ja": "財星 - 財産・収入",
        "zh-CN": "财星 - 财富能力",
        "zh-TW": "財星 - 財富能力",
    },
    "관성": {
        "ko": "관성(官星) - 권위/직장",
        "en": "Officer Star - Authority & Career",
        "ja": "官星 - 権威・職業",
        "zh-CN": "官星 - 权威/事业",
        "zh-TW": "官星 - 權威/事業",
    },
    "인성": {
        "ko": "인성(印星) - 지식/지원",
        "en": "Resource Star - Knowledge & Support",
        "ja": "印星 - 知識・サポート",
        "zh-CN": "印星 - 知识/支持",
        "zh-TW": "印星 - 知識/支持",
    },
    "식상": {
        "ko": "식상(食傷) - 창의력/표현",
        "en": "Output Star - Creativity & Expression",
        "ja": "食傷 - 創造力・表現",
        "zh-CN": "食伤 - 创造力/表达",
        "zh-TW": "食傷 - 創造力/表達",
    },
    "비겁": {
        "ko": "비겁(比劫) - 경쟁/자립",
        "en": "Companion Star - Competition & Self-reliance",
        "ja": "比劫 - 競争・自立",
        "zh-CN": "比劫 - 竞争/自立",
        "zh-TW": "比劫 - 競爭/自立",
    },
}


# =============================================================================
# 4.3.2: Action-oriented 조언 템플릿 (다국어)
# =============================================================================
@dataclass
class DestinyAdvice:
    """현대적 BaZi 조언 (다국어) - The Destiny Code 스타일"""
    ten_god: str                           # 십신 (한국어 키)
    strength: Literal["strong", "weak", "balanced"]  # 강약
    career_advice: Dict[str, str]          # 직업 조언 (5개 언어)
    relationship_advice: Dict[str, str]    # 관계 조언 (5개 언어)
    action_items: Dict[str, List[str]]     # 실천 항목 (5개 언어)
    avoid_items: Dict[str, List[str]]      # 피해야 할 것 (5개 언어)
    insight: Dict[str, str]                # 핵심 통찰 (5개 언어)


# 십신별 조언 데이터베이스
DESTINY_ADVICE_DB: Dict[str, Dict[str, DestinyAdvice]] = {
    # 정관 (Direct Officer)
    "정관": {
        "strong": DestinyAdvice(
            ten_god="정관",
            strength="strong",
            career_advice={
                "ko": "체계적인 조직에서 승진 경로가 명확한 직장이 적합합니다. 공무원, 대기업 관리직, 법조인 등이 좋습니다.",
                "en": "Structured organizations with clear advancement paths suit you best. Consider government, corporate management, or legal professions.",
                "ja": "体系的な組織で昇進経路が明確な職場が適しています。公務員、大企業管理職、法曹界などが良いでしょう。",
                "zh-CN": "适合在体系完善的组织中工作，晋升路径清晰。适合公务员、大企业管理岗、法律界等。",
                "zh-TW": "適合在體系完善的組織中工作，晉升路徑清晰。適合公務員、大企業管理崗、法律界等。",
            },
            relationship_advice={
                "ko": "책임감이 강해 신뢰할 수 있는 파트너입니다. 다만 지나친 원칙주의로 융통성이 부족할 수 있습니다.",
                "en": "Your strong sense of responsibility makes you a trustworthy partner. However, excessive rigidity may limit flexibility.",
                "ja": "責任感が強く信頼できるパートナーです。ただし、過度の原則主義で柔軟性に欠ける場合があります。",
                "zh-CN": "责任感强，是值得信赖的伴侣。但过于讲原则可能缺乏灵活性。",
                "zh-TW": "責任感強，是值得信賴的伴侶。但過於講原則可能缺乏靈活性。",
            },
            action_items={
                "ko": ["리더십 개발 프로그램 참여", "자격증/인증 획득", "멘토링 역할 수행", "장기 경력 계획 수립"],
                "en": ["Join leadership development programs", "Obtain certifications", "Take on mentoring roles", "Create a long-term career plan"],
                "ja": ["リーダーシップ開発プログラムへの参加", "資格・認証の取得", "メンタリング役割の遂行", "長期キャリア計画の策定"],
                "zh-CN": ["参加领导力发展项目", "获取资格认证", "担任导师角色", "制定长期职业规划"],
                "zh-TW": ["參加領導力發展項目", "獲取資格認證", "擔任導師角色", "制定長期職業規劃"],
            },
            avoid_items={
                "ko": ["불확실성 높은 스타트업", "프리랜서 등 비정형 직업", "규칙 없는 환경", "과도한 위험 감수"],
                "en": ["High-uncertainty startups", "Freelance or unstructured jobs", "Rule-free environments", "Excessive risk-taking"],
                "ja": ["不確実性の高いスタートアップ", "フリーランス等の非定型職", "規則のない環境", "過度なリスクテイキング"],
                "zh-CN": ["高不确定性的创业", "自由职业等非正式工作", "无规则的环境", "过度冒险"],
                "zh-TW": ["高不確定性的創業", "自由職業等非正式工作", "無規則的環境", "過度冒險"],
            },
            insight={
                "ko": "정관이 강하면 사회적 지위와 명예를 중시합니다. 자신의 능력을 공식적으로 인정받을 수 있는 환경에서 빛납니다.",
                "en": "Strong Direct Officer values social status and reputation. You shine in environments where abilities are formally recognized.",
                "ja": "正官が強いと社会的地位と名誉を重視します。能力が公式に認められる環境で輝きます。",
                "zh-CN": "正官强旺时重视社会地位和声誉。在能力被正式认可的环境中表现出色。",
                "zh-TW": "正官強旺時重視社會地位和聲譽。在能力被正式認可的環境中表現出色。",
            },
        ),
        "weak": DestinyAdvice(
            ten_god="정관",
            strength="weak",
            career_advice={
                "ko": "지나친 권위나 압박 없는 환경이 필요합니다. 창의적 직종이나 자율성 높은 직장을 고려하세요.",
                "en": "You need environments without excessive authority or pressure. Consider creative fields or autonomous workplaces.",
                "ja": "過度な権威や圧力のない環境が必要です。創造的な職種や自律性の高い職場を検討してください。",
                "zh-CN": "需要没有过度权威或压力的环境。考虑创意领域或自主性高的工作。",
                "zh-TW": "需要沒有過度權威或壓力的環境。考慮創意領域或自主性高的工作。",
            },
            relationship_advice={
                "ko": "권위적인 파트너보다 동등한 관계를 선호합니다. 지지해주는 관계에서 성장합니다.",
                "en": "Prefer equal partnerships over authoritative ones. You grow in supportive relationships.",
                "ja": "権威的なパートナーより対等な関係を好みます。支持的な関係で成長します。",
                "zh-CN": "喜欢平等关系而非权威式伴侣。在支持性关系中成长。",
                "zh-TW": "喜歡平等關係而非權威式伴侶。在支持性關係中成長。",
            },
            action_items={
                "ko": ["자기주장 훈련", "소규모 리더십 경험 축적", "신뢰할 수 있는 멘토 찾기", "점진적 책임 확대"],
                "en": ["Practice assertiveness", "Gain small leadership experiences", "Find a trusted mentor", "Gradually expand responsibilities"],
                "ja": ["自己主張の訓練", "小規模なリーダーシップ経験の蓄積", "信頼できるメンターを探す", "段階的な責任拡大"],
                "zh-CN": ["练习自我主张", "积累小型领导经验", "寻找可信赖的导师", "逐步扩大责任"],
                "zh-TW": ["練習自我主張", "積累小型領導經驗", "尋找可信賴的導師", "逐步擴大責任"],
            },
            avoid_items={
                "ko": ["과도한 경쟁 환경", "엄격한 위계질서", "과도한 책임 부담", "권위주의적 상사"],
                "en": ["Overly competitive environments", "Strict hierarchies", "Excessive responsibility burdens", "Authoritarian bosses"],
                "ja": ["過度な競争環境", "厳格な階層構造", "過度な責任負担", "権威主義的な上司"],
                "zh-CN": ["过度竞争的环境", "严格的等级制度", "过度的责任负担", "专制型上司"],
                "zh-TW": ["過度競爭的環境", "嚴格的等級制度", "過度的責任負擔", "專制型上司"],
            },
            insight={
                "ko": "정관이 약하면 자유로운 환경에서 더 빛납니다. 억압받지 않을 때 창의성이 발휘됩니다.",
                "en": "Weak Direct Officer thrives in free environments. Creativity flourishes without suppression.",
                "ja": "正官が弱いと自由な環境でより輝きます。抑圧されない時に創造性が発揮されます。",
                "zh-CN": "正官弱时在自由环境中更出色。不受压抑时创造力得以发挥。",
                "zh-TW": "正官弱時在自由環境中更出色。不受壓抑時創造力得以發揮。",
            },
        ),
        "balanced": DestinyAdvice(
            ten_god="정관",
            strength="balanced",
            career_advice={
                "ko": "유연하게 다양한 환경에 적응 가능합니다. 균형 잡힌 조직문화의 회사가 이상적입니다.",
                "en": "Adaptable to various environments. Companies with balanced organizational culture are ideal.",
                "ja": "柔軟に様々な環境に適応可能です。バランスの取れた組織文化の会社が理想的です。",
                "zh-CN": "能灵活适应各种环境。组织文化平衡的公司最为理想。",
                "zh-TW": "能靈活適應各種環境。組織文化平衡的公司最為理想。",
            },
            relationship_advice={
                "ko": "균형 잡힌 관계를 형성합니다. 주고받는 것이 자연스럽습니다.",
                "en": "Form balanced relationships. Give and take comes naturally.",
                "ja": "バランスの取れた関係を形成します。与えることと受け取ることが自然です。",
                "zh-CN": "形成平衡的关系。给予和接受都很自然。",
                "zh-TW": "形成平衡的關係。給予和接受都很自然。",
            },
            action_items={
                "ko": ["강점과 약점 분석", "다양한 역할 경험", "네트워크 확장", "지속적 자기계발"],
                "en": ["Analyze strengths and weaknesses", "Experience various roles", "Expand network", "Continuous self-development"],
                "ja": ["強みと弱みの分析", "様々な役割の経験", "ネットワークの拡大", "継続的な自己啓発"],
                "zh-CN": ["分析优势和劣势", "体验各种角色", "拓展人脉", "持续自我发展"],
                "zh-TW": ["分析優勢和劣勢", "體驗各種角色", "拓展人脈", "持續自我發展"],
            },
            avoid_items={
                "ko": ["극단적 환경", "과도한 스트레스", "불균형한 관계", "한쪽으로 치우친 선택"],
                "en": ["Extreme environments", "Excessive stress", "Unbalanced relationships", "One-sided choices"],
                "ja": ["極端な環境", "過度なストレス", "不均衡な関係", "偏った選択"],
                "zh-CN": ["极端环境", "过度压力", "不平衡的关系", "偏向一方的选择"],
                "zh-TW": ["極端環境", "過度壓力", "不平衡的關係", "偏向一方的選擇"],
            },
            insight={
                "ko": "정관이 균형잡히면 안정과 변화 사이에서 지혜롭게 선택할 수 있습니다.",
                "en": "Balanced Direct Officer allows wise choices between stability and change.",
                "ja": "正官がバランスを取れていると、安定と変化の間で賢明な選択ができます。",
                "zh-CN": "正官平衡时能在稳定与变化之间做出明智选择。",
                "zh-TW": "正官平衡時能在穩定與變化之間做出明智選擇。",
            },
        ),
    },
    # 편관/칠살 (Seven Killings)
    "편관": {
        "strong": DestinyAdvice(
            ten_god="편관",
            strength="strong",
            career_advice={
                "ko": "도전적이고 압박감 있는 환경에서 역량을 발휘합니다. 경찰, 군인, 위기관리, 고위 경영진 등이 적합합니다.",
                "en": "Thrive under pressure and challenges. Police, military, crisis management, or executive roles suit you.",
                "ja": "挑戦的でプレッシャーのある環境で能力を発揮します。警察、軍人、危機管理、上級管理職などが適しています。",
                "zh-CN": "在压力和挑战性环境中表现出色。适合警察、军人、危机管理或高管职位。",
                "zh-TW": "在壓力和挑戰性環境中表現出色。適合警察、軍人、危機管理或高管職位。",
            },
            relationship_advice={
                "ko": "강한 성격으로 상대를 압도할 수 있습니다. 파트너의 자율성을 존중하는 연습이 필요합니다.",
                "en": "Your strong personality may overwhelm partners. Practice respecting partner's autonomy.",
                "ja": "強い性格で相手を圧倒することがあります。パートナーの自律性を尊重する練習が必要です。",
                "zh-CN": "强势性格可能压倒伴侣。需要练习尊重伴侣的自主性。",
                "zh-TW": "強勢性格可能壓倒伴侶。需要練習尊重伴侶的自主性。",
            },
            action_items={
                "ko": ["스트레스 관리 기술 습득", "협상/갈등해결 기술 개발", "고강도 운동 루틴", "분노 조절 연습"],
                "en": ["Learn stress management", "Develop negotiation skills", "High-intensity exercise routine", "Practice anger management"],
                "ja": ["ストレス管理技術の習得", "交渉・紛争解決スキルの開発", "高強度運動ルーティン", "怒りのコントロール練習"],
                "zh-CN": ["学习压力管理技巧", "培养谈判技能", "高强度运动习惯", "练习愤怒管理"],
                "zh-TW": ["學習壓力管理技巧", "培養談判技能", "高強度運動習慣", "練習憤怒管理"],
            },
            avoid_items={
                "ko": ["과도한 통제욕", "공격적 의사소통", "권력 남용", "타인 무시"],
                "en": ["Excessive control", "Aggressive communication", "Power abuse", "Ignoring others"],
                "ja": ["過度なコントロール欲", "攻撃的なコミュニケーション", "権力の乱用", "他人の無視"],
                "zh-CN": ["过度控制欲", "攻击性沟通", "滥用权力", "忽视他人"],
                "zh-TW": ["過度控制欲", "攻擊性溝通", "濫用權力", "忽視他人"],
            },
            insight={
                "ko": "칠살이 강하면 강한 추진력과 권력욕이 있습니다. 이 에너지를 건설적으로 활용하면 큰 성취가 가능합니다.",
                "en": "Strong Seven Killings brings powerful drive and ambition. Channel this energy constructively for great achievements.",
                "ja": "七殺が強いと強い推進力と権力欲があります。このエネルギーを建設的に活用すれば大きな成果が可能です。",
                "zh-CN": "七杀强旺时有强大的推动力和权力欲。建设性地运用这种能量可实现大成就。",
                "zh-TW": "七殺強旺時有強大的推動力和權力欲。建設性地運用這種能量可實現大成就。",
            },
        ),
        "weak": DestinyAdvice(
            ten_god="편관",
            strength="weak",
            career_advice={
                "ko": "갈등이 적고 협력적인 환경이 적합합니다. 지원 역할이나 팀 중심 직무를 고려하세요.",
                "en": "Low-conflict, collaborative environments suit you. Consider support roles or team-oriented positions.",
                "ja": "対立の少ない協力的な環境が適しています。サポート役やチーム中心の職務を検討してください。",
                "zh-CN": "适合冲突少、协作性强的环境。考虑支持性角色或团队导向的职位。",
                "zh-TW": "適合衝突少、協作性強的環境。考慮支持性角色或團隊導向的職位。",
            },
            relationship_advice={
                "ko": "조화로운 관계를 추구하지만 자기주장이 부족할 수 있습니다. 필요시 경계 설정을 연습하세요.",
                "en": "Seek harmonious relationships but may lack assertiveness. Practice setting boundaries when needed.",
                "ja": "調和のある関係を求めますが、自己主張が不足することがあります。必要時に境界設定を練習してください。",
                "zh-CN": "追求和谐关系但可能缺乏自我主张。需要时练习设定界限。",
                "zh-TW": "追求和諧關係但可能缺乏自我主張。需要時練習設定界限。",
            },
            action_items={
                "ko": ["자신감 구축", "적당한 경쟁 경험", "자기방어 기술 학습", "건강한 경계 설정"],
                "en": ["Build confidence", "Experience healthy competition", "Learn self-defense skills", "Set healthy boundaries"],
                "ja": ["自信の構築", "適度な競争経験", "自己防衛スキルの学習", "健全な境界設定"],
                "zh-CN": ["建立自信", "体验适度竞争", "学习自我保护技能", "设定健康界限"],
                "zh-TW": ["建立自信", "體驗適度競爭", "學習自我保護技能", "設定健康界限"],
            },
            avoid_items={
                "ko": ["위험한 상황", "공격적인 사람들", "과도한 압박", "갈등 상황"],
                "en": ["Dangerous situations", "Aggressive people", "Excessive pressure", "Conflict situations"],
                "ja": ["危険な状況", "攻撃的な人々", "過度なプレッシャー", "対立状況"],
                "zh-CN": ["危险情况", "攻击性强的人", "过度压力", "冲突场合"],
                "zh-TW": ["危險情況", "攻擊性強的人", "過度壓力", "衝突場合"],
            },
            insight={
                "ko": "칠살이 약하면 평화로운 환경에서 더 잘 기능합니다. 자신만의 페이스를 존중하세요.",
                "en": "Weak Seven Killings functions better in peaceful environments. Respect your own pace.",
                "ja": "七殺が弱いと平和な環境でより良く機能します。自分のペースを尊重してください。",
                "zh-CN": "七杀弱时在平和环境中表现更好。尊重自己的节奏。",
                "zh-TW": "七殺弱時在平和環境中表現更好。尊重自己的節奏。",
            },
        ),
        "balanced": DestinyAdvice(
            ten_god="편관",
            strength="balanced",
            career_advice={
                "ko": "적절한 도전과 안정의 균형이 있는 직장이 이상적입니다.",
                "en": "Workplaces with balanced challenge and stability are ideal.",
                "ja": "適切な挑戦と安定のバランスがある職場が理想的です。",
                "zh-CN": "挑战与稳定平衡的工作环境最为理想。",
                "zh-TW": "挑戰與穩定平衡的工作環境最為理想。",
            },
            relationship_advice={
                "ko": "상호 존중하는 균형 잡힌 관계를 형성할 수 있습니다.",
                "en": "Can form balanced, mutually respectful relationships.",
                "ja": "相互尊重のバランスの取れた関係を形成できます。",
                "zh-CN": "能形成相互尊重的平衡关系。",
                "zh-TW": "能形成相互尊重的平衡關係。",
            },
            action_items={
                "ko": ["상황에 맞는 대응력 개발", "리더십과 팔로워십 균형", "건강한 경쟁심 유지"],
                "en": ["Develop situational responsiveness", "Balance leadership and followership", "Maintain healthy competitiveness"],
                "ja": ["状況に応じた対応力の開発", "リーダーシップとフォロワーシップのバランス", "健全な競争心の維持"],
                "zh-CN": ["培养情境应对能力", "平衡领导力和追随力", "保持健康的竞争心"],
                "zh-TW": ["培養情境應對能力", "平衡領導力和追隨力", "保持健康的競爭心"],
            },
            avoid_items={
                "ko": ["극단적 선택", "불필요한 갈등", "수동적 태도"],
                "en": ["Extreme choices", "Unnecessary conflicts", "Passive attitudes"],
                "ja": ["極端な選択", "不必要な対立", "受動的な態度"],
                "zh-CN": ["极端选择", "不必要的冲突", "被动态度"],
                "zh-TW": ["極端選擇", "不必要的衝突", "被動態度"],
            },
            insight={
                "ko": "칠살이 균형잡히면 필요할 때 강하게, 평소엔 부드럽게 행동할 수 있습니다.",
                "en": "Balanced Seven Killings allows strength when needed, softness otherwise.",
                "ja": "七殺がバランスを取れていると、必要な時は強く、普段は柔らかく行動できます。",
                "zh-CN": "七杀平衡时，该强则强，平时温和。",
                "zh-TW": "七殺平衡時，該強則強，平時溫和。",
            },
        ),
    },
    # 정재 (Direct Wealth)
    "정재": {
        "strong": DestinyAdvice(
            ten_god="정재",
            strength="strong",
            career_advice={
                "ko": "재무, 회계, 은행, 부동산 등 안정적 재산 관리 분야에서 빛납니다. 투자보다 저축형입니다.",
                "en": "Excel in stable wealth management: finance, accounting, banking, real estate. Saver rather than investor.",
                "ja": "財務、会計、銀行、不動産など安定的な資産管理分野で輝きます。投資より貯蓄型です。",
                "zh-CN": "在财务、会计、银行、房地产等稳定理财领域表现出色。储蓄型而非投资型。",
                "zh-TW": "在財務、會計、銀行、房地產等穩定理財領域表現出色。儲蓄型而非投資型。",
            },
            relationship_advice={
                "ko": "물질적 안정을 제공하는 데 능숙합니다. 감정적 연결도 중요히 여기세요.",
                "en": "Good at providing material stability. Remember emotional connection matters too.",
                "ja": "物質的な安定を提供することに長けています。感情的なつながりも大切にしてください。",
                "zh-CN": "善于提供物质稳定。也要重视情感连接。",
                "zh-TW": "善於提供物質穩定。也要重視情感連接。",
            },
            action_items={
                "ko": ["장기 재무 계획 수립", "정기적 저축 습관", "부동산 투자 검토", "자산 다각화"],
                "en": ["Create long-term financial plans", "Regular savings habits", "Consider real estate", "Diversify assets"],
                "ja": ["長期財務計画の策定", "定期的な貯蓄習慣", "不動産投資の検討", "資産の多様化"],
                "zh-CN": ["制定长期财务计划", "养成定期储蓄习惯", "考虑房地产投资", "资产多元化"],
                "zh-TW": ["制定長期財務計劃", "養成定期儲蓄習慣", "考慮房地產投資", "資產多元化"],
            },
            avoid_items={
                "ko": ["고위험 투기", "충동 소비", "보증", "과도한 인색함"],
                "en": ["High-risk speculation", "Impulse spending", "Guaranteeing others' debts", "Excessive stinginess"],
                "ja": ["高リスク投機", "衝動消費", "保証人になること", "過度なけち"],
                "zh-CN": ["高风险投机", "冲动消费", "替人担保", "过度吝啬"],
                "zh-TW": ["高風險投機", "衝動消費", "替人擔保", "過度吝嗇"],
            },
            insight={
                "ko": "정재가 강하면 꾸준한 수입과 저축 능력이 뛰어납니다. 안정적인 재산 축적이 가능합니다.",
                "en": "Strong Direct Wealth brings steady income and saving ability. Stable wealth accumulation is possible.",
                "ja": "正財が強いと安定した収入と貯蓄能力に優れています。安定的な資産蓄積が可能です。",
                "zh-CN": "正财强旺时收入稳定、储蓄能力强。能稳定积累财富。",
                "zh-TW": "正財強旺時收入穩定、儲蓄能力強。能穩定積累財富。",
            },
        ),
        "weak": DestinyAdvice(
            ten_god="정재",
            strength="weak",
            career_advice={
                "ko": "재무 관리에 도움이 필요합니다. 전문가 조언을 구하고, 안정적 수입원을 확보하세요.",
                "en": "Need help with financial management. Seek expert advice and secure stable income sources.",
                "ja": "財務管理に助けが必要です。専門家のアドバイスを求め、安定した収入源を確保してください。",
                "zh-CN": "财务管理需要帮助。寻求专家建议，确保稳定收入来源。",
                "zh-TW": "財務管理需要幫助。尋求專家建議，確保穩定收入來源。",
            },
            relationship_advice={
                "ko": "물질적 부분보다 정서적 유대에 집중하세요. 재정은 파트너와 협력하여 관리하면 좋습니다.",
                "en": "Focus on emotional bonds over material aspects. Manage finances cooperatively with partner.",
                "ja": "物質的な部分より情緒的な絆に集中してください。財務はパートナーと協力して管理すると良いです。",
                "zh-CN": "注重情感纽带而非物质方面。与伴侣合作管理财务。",
                "zh-TW": "注重情感紐帶而非物質方面。與伴侶合作管理財務。",
            },
            action_items={
                "ko": ["재무 교육 받기", "자동 저축 설정", "지출 추적", "재정 파트너/전문가 활용"],
                "en": ["Get financial education", "Set up automatic savings", "Track expenses", "Use financial partners/experts"],
                "ja": ["財務教育を受ける", "自動貯蓄の設定", "支出追跡", "財務パートナー/専門家の活用"],
                "zh-CN": ["接受财务教育", "设置自动储蓄", "追踪支出", "借助财务伙伴/专家"],
                "zh-TW": ["接受財務教育", "設置自動儲蓄", "追蹤支出", "借助財務夥伴/專家"],
            },
            avoid_items={
                "ko": ["재정 무관심", "빚", "단독 대규모 투자", "충동 구매"],
                "en": ["Financial neglect", "Debt", "Solo large investments", "Impulse purchases"],
                "ja": ["財務への無関心", "借金", "単独の大規模投資", "衝動買い"],
                "zh-CN": ["忽视财务", "负债", "独自大额投资", "冲动购物"],
                "zh-TW": ["忽視財務", "負債", "獨自大額投資", "衝動購物"],
            },
            insight={
                "ko": "정재가 약하면 돈 관리에 더 의식적인 노력이 필요합니다. 시스템과 전문가를 활용하세요.",
                "en": "Weak Direct Wealth requires more conscious effort in money management. Use systems and experts.",
                "ja": "正財が弱いとお金の管理により意識的な努力が必要です。システムと専門家を活用してください。",
                "zh-CN": "正财弱时需要更有意识地管理金钱。善用系统和专家。",
                "zh-TW": "正財弱時需要更有意識地管理金錢。善用系統和專家。",
            },
        ),
        "balanced": DestinyAdvice(
            ten_god="정재",
            strength="balanced",
            career_advice={
                "ko": "재정과 다른 분야의 균형이 좋습니다. 다양한 수입원을 개발할 수 있습니다.",
                "en": "Good balance between finances and other areas. Can develop diverse income sources.",
                "ja": "財務と他の分野のバランスが良いです。様々な収入源を開発できます。",
                "zh-CN": "财务与其他领域平衡良好。可以开发多种收入来源。",
                "zh-TW": "財務與其他領域平衡良好。可以開發多種收入來源。",
            },
            relationship_advice={
                "ko": "물질과 감정의 균형을 자연스럽게 유지합니다.",
                "en": "Naturally maintain balance between material and emotional aspects.",
                "ja": "物質と感情のバランスを自然に維持します。",
                "zh-CN": "自然地保持物质与情感的平衡。",
                "zh-TW": "自然地保持物質與情感的平衡。",
            },
            action_items={
                "ko": ["균형 잡힌 포트폴리오", "수입-지출 균형", "적정 위험 투자"],
                "en": ["Balanced portfolio", "Income-expense balance", "Moderate risk investments"],
                "ja": ["バランスの取れたポートフォリオ", "収支バランス", "適度なリスク投資"],
                "zh-CN": ["平衡的投资组合", "收支平衡", "适度风险投资"],
                "zh-TW": ["平衡的投資組合", "收支平衡", "適度風險投資"],
            },
            avoid_items={
                "ko": ["극단적 인색 또는 낭비", "재정 무관심"],
                "en": ["Extreme stinginess or waste", "Financial neglect"],
                "ja": ["極端なけちまたは浪費", "財務への無関心"],
                "zh-CN": ["极端吝啬或浪费", "忽视财务"],
                "zh-TW": ["極端吝嗇或浪費", "忽視財務"],
            },
            insight={
                "ko": "정재가 균형잡히면 필요한 곳에 쓰고 저축도 할 수 있는 재무 지혜가 있습니다.",
                "en": "Balanced Direct Wealth brings financial wisdom to spend wisely and save appropriately.",
                "ja": "正財がバランスを取れていると、必要な所に使い貯蓄もできる財務の知恵があります。",
                "zh-CN": "正财平衡时有财务智慧，该花则花，该省则省。",
                "zh-TW": "正財平衡時有財務智慧，該花則花，該省則省。",
            },
        ),
    },
    # 식신 (Eating God)
    "식신": {
        "strong": DestinyAdvice(
            ten_god="식신",
            strength="strong",
            career_advice={
                "ko": "창의적 표현이 중요한 분야가 적합합니다. 요리, 예술, 글쓰기, 교육, 콘텐츠 제작 등이 좋습니다.",
                "en": "Fields requiring creative expression suit you. Cooking, arts, writing, education, content creation excel.",
                "ja": "創造的な表現が重要な分野が適しています。料理、芸術、執筆、教育、コンテンツ制作などが良いです。",
                "zh-CN": "适合需要创意表达的领域。烹饪、艺术、写作、教育、内容创作等都很出色。",
                "zh-TW": "適合需要創意表達的領域。烹飪、藝術、寫作、教育、內容創作等都很出色。",
            },
            relationship_advice={
                "ko": "따뜻하고 배려심 깊은 파트너입니다. 자녀 양육에 특히 재능이 있습니다.",
                "en": "Warm, nurturing partner. Especially talented in raising children.",
                "ja": "温かく思いやりのあるパートナーです。子育てに特に才能があります。",
                "zh-CN": "温暖体贴的伴侣。尤其擅长养育孩子。",
                "zh-TW": "溫暖體貼的伴侶。尤其擅長養育孩子。",
            },
            action_items={
                "ko": ["창작 활동 정기화", "요리/예술 클래스", "블로그/유튜브 시작", "지식 공유 활동"],
                "en": ["Regular creative activities", "Cooking/art classes", "Start blog/YouTube", "Knowledge sharing"],
                "ja": ["創作活動の定期化", "料理/アートクラス", "ブログ/YouTube開始", "知識共有活動"],
                "zh-CN": ["定期创作活动", "烹饪/艺术课程", "开始写博客/做视频", "知识分享活动"],
                "zh-TW": ["定期創作活動", "烹飪/藝術課程", "開始寫部落格/做影片", "知識分享活動"],
            },
            avoid_items={
                "ko": ["창의성 억압 환경", "반복적 단순 업무", "표현 기회 없는 직장", "과식/탐닉"],
                "en": ["Creativity-suppressing environments", "Repetitive simple tasks", "Jobs without expression", "Overeating/indulgence"],
                "ja": ["創造性を抑圧する環境", "反復的な単純作業", "表現機会のない職場", "過食/耽溺"],
                "zh-CN": ["压制创造力的环境", "重复性简单工作", "无表达机会的工作", "暴饮暴食/沉迷"],
                "zh-TW": ["壓制創造力的環境", "重複性簡單工作", "無表達機會的工作", "暴飲暴食/沉迷"],
            },
            insight={
                "ko": "식신이 강하면 타고난 창의력과 표현력이 있습니다. 이를 발휘할 출구가 필요합니다.",
                "en": "Strong Eating God brings natural creativity and expression. Needs outlets to express.",
                "ja": "食神が強いと生まれながらの創造力と表現力があります。これを発揮する出口が必要です。",
                "zh-CN": "食神强旺时有天生的创造力和表达力。需要发挥的出口。",
                "zh-TW": "食神強旺時有天生的創造力和表達力。需要發揮的出口。",
            },
        ),
        "weak": DestinyAdvice(
            ten_god="식신",
            strength="weak",
            career_advice={
                "ko": "구조화된 환경에서 일하면서 창의성을 점진적으로 개발하세요.",
                "en": "Work in structured environments while gradually developing creativity.",
                "ja": "構造化された環境で働きながら創造性を徐々に開発してください。",
                "zh-CN": "在结构化环境中工作，同时逐步培养创造力。",
                "zh-TW": "在結構化環境中工作，同時逐步培養創造力。",
            },
            relationship_advice={
                "ko": "감정 표현을 의식적으로 연습하세요. 파트너에게 생각을 말로 전달하는 것이 중요합니다.",
                "en": "Consciously practice emotional expression. Verbal communication with partner matters.",
                "ja": "感情表現を意識的に練習してください。パートナーに考えを言葉で伝えることが重要です。",
                "zh-CN": "有意识地练习情感表达。与伴侣的言语沟通很重要。",
                "zh-TW": "有意識地練習情感表達。與伴侶的言語溝通很重要。",
            },
            action_items={
                "ko": ["작은 창작부터 시작", "표현력 워크숍", "일기 쓰기", "취미 활동 탐색"],
                "en": ["Start with small creations", "Expression workshops", "Journal writing", "Explore hobbies"],
                "ja": ["小さな創作から始める", "表現力ワークショップ", "日記を書く", "趣味活動の探索"],
                "zh-CN": ["从小创作开始", "表达力工作坊", "写日记", "探索兴趣爱好"],
                "zh-TW": ["從小創作開始", "表達力工作坊", "寫日記", "探索興趣愛好"],
            },
            avoid_items={
                "ko": ["표현 기회 완전 포기", "감정 억압", "타인 아이디어만 따르기"],
                "en": ["Completely giving up expression", "Suppressing emotions", "Only following others' ideas"],
                "ja": ["表現機会の完全放棄", "感情の抑圧", "他人のアイデアだけに従う"],
                "zh-CN": ["完全放弃表达机会", "压抑情感", "只跟随他人想法"],
                "zh-TW": ["完全放棄表達機會", "壓抑情感", "只跟隨他人想法"],
            },
            insight={
                "ko": "식신이 약하면 창의적 표현에 더 의식적 노력이 필요합니다. 꾸준한 연습으로 개발 가능합니다.",
                "en": "Weak Eating God requires more conscious effort in creative expression. Develops with consistent practice.",
                "ja": "食神が弱いと創造的な表現により意識的な努力が必要です。継続的な練習で開発可能です。",
                "zh-CN": "食神弱时创意表达需要更多有意识的努力。持续练习可以培养。",
                "zh-TW": "食神弱時創意表達需要更多有意識的努力。持續練習可以培養。",
            },
        ),
        "balanced": DestinyAdvice(
            ten_god="식신",
            strength="balanced",
            career_advice={
                "ko": "창의성과 실용성의 균형이 좋습니다. 다양한 분야에서 적응 가능합니다.",
                "en": "Good balance of creativity and practicality. Adaptable across various fields.",
                "ja": "創造性と実用性のバランスが良いです。様々な分野で適応可能です。",
                "zh-CN": "创造力与实用性平衡良好。可适应各种领域。",
                "zh-TW": "創造力與實用性平衡良好。可適應各種領域。",
            },
            relationship_advice={
                "ko": "적절히 표현하고 적절히 경청하는 균형 있는 소통이 가능합니다.",
                "en": "Balanced communication - expressing and listening appropriately.",
                "ja": "適切に表現し適切に傾聴するバランスの取れたコミュニケーションが可能です。",
                "zh-CN": "平衡的沟通——适当表达、适当倾听。",
                "zh-TW": "平衡的溝通——適當表達、適當傾聽。",
            },
            action_items={
                "ko": ["창의적 취미 유지", "업무에 창의성 접목", "지속적 아이디어 기록"],
                "en": ["Maintain creative hobbies", "Apply creativity at work", "Continuously record ideas"],
                "ja": ["創造的な趣味の維持", "仕事に創造性を接合", "継続的なアイデア記録"],
                "zh-CN": ["保持创意爱好", "将创造力应用于工作", "持续记录想法"],
                "zh-TW": ["保持創意愛好", "將創造力應用於工作", "持續記錄想法"],
            },
            avoid_items={
                "ko": ["창의성 완전 포기", "과도한 자기표현"],
                "en": ["Completely abandoning creativity", "Excessive self-expression"],
                "ja": ["創造性の完全放棄", "過度な自己表現"],
                "zh-CN": ["完全放弃创造力", "过度自我表达"],
                "zh-TW": ["完全放棄創造力", "過度自我表達"],
            },
            insight={
                "ko": "식신이 균형잡히면 적절한 때에 창의성을 발휘하고 필요시 실용적으로 행동합니다.",
                "en": "Balanced Eating God expresses creativity at the right time and acts practically when needed.",
                "ja": "食神がバランスを取れていると適切な時に創造性を発揮し、必要時は実用的に行動します。",
                "zh-CN": "食神平衡时在适当时机发挥创造力，需要时务实行动。",
                "zh-TW": "食神平衡時在適當時機發揮創造力，需要時務實行動。",
            },
        ),
    },
}


# =============================================================================
# 4.3.3: Luck Cycles 분석 프레임워크 (The Destiny Code 스타일)
# =============================================================================
@dataclass
class LuckCycleEntry:
    """대운/세운 분석 (The Destiny Code 스타일, 다국어)"""
    cycle_type: Literal["daewun", "year", "month"]  # 대운/세운/월운
    pillar_stem: str                         # 천간
    pillar_branch: str                       # 지지
    interaction_with_chart: str              # 원국과의 상호작용 유형
    theme: Dict[str, str]                    # 주제 (5개 언어)
    opportunities: Dict[str, List[str]]      # 기회 (5개 언어)
    challenges: Dict[str, List[str]]         # 도전 (5개 언어)
    action_advice: Dict[str, str]            # 실천 조언 (5개 언어)
    timing_quality: Literal["excellent", "good", "neutral", "challenging", "difficult"]


# 대운 상호작용 유형 정의
LUCK_INTERACTIONS: Dict[str, Dict[str, str]] = {
    "합": {
        "ko": "합(合) - 새로운 인연과 협력의 기회. 관계 형성에 유리한 시기입니다.",
        "en": "Combination (合) - Opportunities for new connections and collaboration. Favorable for relationship formation.",
        "ja": "合 - 新しい縁と協力の機会。関係形成に有利な時期です。",
        "zh-CN": "合 - 新缘分与合作的机会。有利于建立关系的时期。",
        "zh-TW": "合 - 新緣分與合作的機會。有利於建立關係的時期。",
    },
    "충": {
        "ko": "충(冲) - 변화와 이동의 시기. 현상 유지보다 적극적 변화가 요구됩니다.",
        "en": "Clash (冲) - Period of change and movement. Active transformation required over status quo.",
        "ja": "冲 - 変化と移動の時期。現状維持より積極的な変化が求められます。",
        "zh-CN": "冲 - 变化和移动的时期。需要积极变化而非维持现状。",
        "zh-TW": "沖 - 變化和移動的時期。需要積極變化而非維持現狀。",
    },
    "형": {
        "ko": "형(刑) - 시험과 갈등의 시기. 인내와 신중한 행동이 필요합니다.",
        "en": "Punishment (刑) - Period of tests and conflicts. Patience and careful action needed.",
        "ja": "刑 - 試練と葛藤の時期。忍耐と慎重な行動が必要です。",
        "zh-CN": "刑 - 考验和冲突的时期。需要耐心和谨慎行动。",
        "zh-TW": "刑 - 考驗和衝突的時期。需要耐心和謹慎行動。",
    },
    "해": {
        "ko": "해(害) - 숨겨진 장애물의 시기. 표면 아래의 문제에 주의하세요.",
        "en": "Harm (害) - Period of hidden obstacles. Watch for problems beneath the surface.",
        "ja": "害 - 隠れた障害の時期。表面下の問題に注意してください。",
        "zh-CN": "害 - 隐藏障碍的时期。注意表面下的问题。",
        "zh-TW": "害 - 隱藏障礙的時期。注意表面下的問題。",
    },
    "파": {
        "ko": "파(破) - 기존 구조가 깨지는 시기. 새로운 시작을 준비하세요.",
        "en": "Destruction (破) - Period when existing structures break. Prepare for new beginnings.",
        "ja": "破 - 既存の構造が壊れる時期。新しい始まりに備えてください。",
        "zh-CN": "破 - 现有结构瓦解的时期。准备新的开始。",
        "zh-TW": "破 - 現有結構瓦解的時期。準備新的開始。",
    },
    "용신운": {
        "ko": "용신운(用神運) - 유리한 에너지가 들어오는 황금기. 적극적 행동이 권장됩니다.",
        "en": "Favorable Element Period - Golden time with supportive energy. Active action recommended.",
        "ja": "用神運 - 有利なエネルギーが入る黄金期。積極的な行動が推奨されます。",
        "zh-CN": "用神运 - 有利能量进入的黄金期。建议积极行动。",
        "zh-TW": "用神運 - 有利能量進入的黃金期。建議積極行動。",
    },
    "기신운": {
        "ko": "기신운(忌神運) - 도전적 에너지의 시기. 방어적 자세와 내실 다지기가 필요합니다.",
        "en": "Unfavorable Element Period - Challenging energy time. Defensive stance and consolidation needed.",
        "ja": "忌神運 - 挑戦的なエネルギーの時期。守りの姿勢と内実の強化が必要です。",
        "zh-CN": "忌神运 - 挑战性能量的时期。需要防守姿态和夯实基础。",
        "zh-TW": "忌神運 - 挑戰性能量的時期。需要防守姿態和夯實基礎。",
    },
}


# 대운 테마별 조언 템플릿
LUCK_CYCLE_THEMES: Dict[str, Dict[str, Dict[str, str]]] = {
    "career": {
        "용신운": {
            "ko": "커리어 확장과 승진의 최적기입니다. 새 프로젝트를 시작하거나 이직을 고려하세요.",
            "en": "Optimal time for career expansion and promotion. Start new projects or consider job changes.",
            "ja": "キャリア拡大と昇進の最適期です。新プロジェクトを始めるか転職を検討してください。",
            "zh-CN": "职业发展和晋升的最佳时期。开始新项目或考虑换工作。",
            "zh-TW": "職業發展和晉升的最佳時期。開始新項目或考慮換工作。",
        },
        "기신운": {
            "ko": "현재 위치를 지키며 실력을 쌓는 시기입니다. 무리한 도전은 피하세요.",
            "en": "Time to maintain position and build skills. Avoid excessive challenges.",
            "ja": "現在の位置を守りながら実力を積む時期です。無理な挑戦は避けてください。",
            "zh-CN": "守住现有位置、积累实力的时期。避免过度挑战。",
            "zh-TW": "守住現有位置、積累實力的時期。避免過度挑戰。",
        },
    },
    "wealth": {
        "용신운": {
            "ko": "투자와 사업 확장에 유리한 시기입니다. 기회를 적극 활용하세요.",
            "en": "Favorable time for investment and business expansion. Actively seize opportunities.",
            "ja": "投資と事業拡大に有利な時期です。機会を積極的に活用してください。",
            "zh-CN": "投资和业务扩展的有利时期。积极把握机会。",
            "zh-TW": "投資和業務擴展的有利時期。積極把握機會。",
        },
        "기신운": {
            "ko": "보수적 재무 관리가 필요합니다. 저축과 위험 회피에 집중하세요.",
            "en": "Conservative financial management needed. Focus on savings and risk avoidance.",
            "ja": "保守的な財務管理が必要です。貯蓄とリスク回避に集中してください。",
            "zh-CN": "需要保守的财务管理。专注于储蓄和规避风险。",
            "zh-TW": "需要保守的財務管理。專注於儲蓄和規避風險。",
        },
    },
    "relationship": {
        "용신운": {
            "ko": "새로운 인연과 관계 발전에 좋은 시기입니다. 적극적으로 만남에 나서세요.",
            "en": "Good time for new connections and relationship development. Actively pursue meetings.",
            "ja": "新しい縁と関係発展に良い時期です。積極的に出会いに出てください。",
            "zh-CN": "结识新人和发展关系的好时期。积极参与社交。",
            "zh-TW": "結識新人和發展關係的好時期。積極參與社交。",
        },
        "기신운": {
            "ko": "기존 관계 유지에 집중하세요. 새로운 관계는 신중하게 접근하세요.",
            "en": "Focus on maintaining existing relationships. Approach new relationships cautiously.",
            "ja": "既存の関係維持に集中してください。新しい関係は慎重にアプローチしてください。",
            "zh-CN": "专注于维护现有关系。谨慎对待新关系。",
            "zh-TW": "專注於維護現有關係。謹慎對待新關係。",
        },
    },
    "health": {
        "용신운": {
            "ko": "건강 상태가 양호한 시기입니다. 체력 증진 활동을 시작하기 좋습니다.",
            "en": "Period of good health. Good time to start fitness activities.",
            "ja": "健康状態が良好な時期です。体力増進活動を始めるのに良いです。",
            "zh-CN": "健康状况良好的时期。适合开始健身活动。",
            "zh-TW": "健康狀況良好的時期。適合開始健身活動。",
        },
        "기신운": {
            "ko": "건강 관리에 주의가 필요합니다. 정기 검진과 충분한 휴식을 취하세요.",
            "en": "Health management attention needed. Get regular checkups and adequate rest.",
            "ja": "健康管理に注意が必要です。定期検診と十分な休息を取ってください。",
            "zh-CN": "需要注意健康管理。定期体检、充分休息。",
            "zh-TW": "需要注意健康管理。定期體檢、充分休息。",
        },
    },
}


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


# =============================================================================
# 헬퍼 함수들
# =============================================================================

def get_ten_god_name(ten_god: str, language: LanguageType = 'ko') -> str:
    """
    십신 이름을 해당 언어로 반환

    Args:
        ten_god: 십신 키 (한국어: 비견, 겁재, 식신 등)
        language: 언어 코드 (ko, en, ja, zh-CN, zh-TW)

    Returns:
        해당 언어로 된 십신 이름
    """
    if ten_god in TEN_GODS_MAPPING:
        return TEN_GODS_MAPPING[ten_god].get(language, ten_god)
    return ten_god


def get_destiny_advice(
    ten_god: str,
    strength: Literal["strong", "weak", "balanced"],
    language: LanguageType = 'ko'
) -> Optional[Dict[str, str]]:
    """
    십신과 강약에 따른 조언을 반환

    Args:
        ten_god: 십신 키 (한국어: 정관, 편관, 정재, 식신 등)
        strength: 강약 (strong/weak/balanced)
        language: 언어 코드 (ko, en, ja, zh-CN, zh-TW)

    Returns:
        조언 딕셔너리 또는 None (데이터 없음 시)

    Example:
        >>> advice = get_destiny_advice('정관', 'strong', 'ko')
        >>> print(advice['career_advice'])
        "체계적인 조직에서 승진 경로가 명확한 직장이 적합합니다..."
    """
    if ten_god not in DESTINY_ADVICE_DB:
        return None

    if strength not in DESTINY_ADVICE_DB[ten_god]:
        return None

    advice: DestinyAdvice = DESTINY_ADVICE_DB[ten_god][strength]

    return {
        "ten_god": get_ten_god_name(ten_god, language),
        "ten_god_key": ten_god,
        "strength": strength,
        "career_advice": advice.career_advice.get(language, advice.career_advice.get('ko', '')),
        "relationship_advice": advice.relationship_advice.get(language, advice.relationship_advice.get('ko', '')),
        "action_items": advice.action_items.get(language, advice.action_items.get('ko', [])),
        "avoid_items": advice.avoid_items.get(language, advice.avoid_items.get('ko', [])),
        "insight": advice.insight.get(language, advice.insight.get('ko', '')),
    }


def get_all_destiny_advice(language: LanguageType = 'ko') -> Dict[str, Dict[str, Dict]]:
    """
    모든 십신별 조언을 해당 언어로 반환

    Args:
        language: 언어 코드

    Returns:
        중첩 딕셔너리 {십신: {강약: 조언}}
    """
    result = {}
    for ten_god in DESTINY_ADVICE_DB:
        result[ten_god] = {}
        for strength in DESTINY_ADVICE_DB[ten_god]:
            advice = get_destiny_advice(ten_god, strength, language)
            if advice:
                result[ten_god][strength] = advice
    return result


def get_luck_interaction(interaction_type: str, language: LanguageType = 'ko') -> str:
    """
    대운 상호작용 설명을 반환

    Args:
        interaction_type: 상호작용 유형 (합, 충, 형, 해, 파, 용신운, 기신운)
        language: 언어 코드

    Returns:
        상호작용 설명 문자열
    """
    if interaction_type in LUCK_INTERACTIONS:
        return LUCK_INTERACTIONS[interaction_type].get(language, '')
    return ''


def build_luck_cycle_prompt(
    cycle_type: Literal["daewun", "year", "month"],
    pillar_stem: str,
    pillar_branch: str,
    interaction: str,
    is_favorable: bool,
    language: LanguageType = 'ko'
) -> str:
    """
    대운/세운 분석 프롬프트를 생성

    Args:
        cycle_type: 운 유형 (daewun/year/month)
        pillar_stem: 천간
        pillar_branch: 지지
        interaction: 상호작용 유형 (합/충/형/해/파)
        is_favorable: 용신운 여부 (True=용신운, False=기신운)
        language: 언어 코드

    Returns:
        프롬프트 문자열

    Example:
        >>> prompt = build_luck_cycle_prompt('daewun', '甲', '子', '충', True, 'ko')
    """
    cycle_names = {
        "daewun": {"ko": "대운(大運)", "en": "Decade Luck Pillar", "ja": "大運", "zh-CN": "大运", "zh-TW": "大運"},
        "year": {"ko": "세운(歲運)", "en": "Annual Luck", "ja": "歳運", "zh-CN": "流年", "zh-TW": "流年"},
        "month": {"ko": "월운(月運)", "en": "Monthly Luck", "ja": "月運", "zh-CN": "流月", "zh-TW": "流月"},
    }

    luck_type = "용신운" if is_favorable else "기신운"
    cycle_name = cycle_names.get(cycle_type, {}).get(language, cycle_type)
    interaction_desc = get_luck_interaction(interaction, language)
    luck_type_desc = get_luck_interaction(luck_type, language)

    # 테마별 조언 수집
    themes_advice = []
    for theme_key in ["career", "wealth", "relationship", "health"]:
        if theme_key in LUCK_CYCLE_THEMES:
            theme_advice = LUCK_CYCLE_THEMES[theme_key].get(luck_type, {}).get(language)
            if theme_advice:
                theme_labels = {
                    "career": {"ko": "직업/커리어", "en": "Career", "ja": "キャリア", "zh-CN": "事业", "zh-TW": "事業"},
                    "wealth": {"ko": "재물/투자", "en": "Wealth", "ja": "財運", "zh-CN": "财运", "zh-TW": "財運"},
                    "relationship": {"ko": "인간관계", "en": "Relationships", "ja": "人間関係", "zh-CN": "人际关系", "zh-TW": "人際關係"},
                    "health": {"ko": "건강", "en": "Health", "ja": "健康", "zh-CN": "健康", "zh-TW": "健康"},
                }
                label = theme_labels[theme_key].get(language, theme_key)
                themes_advice.append(f"**{label}**: {theme_advice}")

    prompt_parts = [
        f"## {cycle_name}: {pillar_stem}{pillar_branch}",
        "",
        f"### 운의 성격",
        luck_type_desc,
        "",
    ]

    if interaction_desc:
        prompt_parts.extend([
            f"### 원국과의 상호작용",
            interaction_desc,
            "",
        ])

    if themes_advice:
        prompt_parts.extend([
            "### 분야별 조언",
            *themes_advice,
            "",
        ])

    return "\n".join(prompt_parts)


def build_destiny_code_analysis_prompt(
    ten_god: str,
    strength: Literal["strong", "weak", "balanced"],
    language: LanguageType = 'ko'
) -> str:
    """
    십신 분석을 위한 전체 프롬프트 생성

    Args:
        ten_god: 십신
        strength: 강약
        language: 언어

    Returns:
        분석 프롬프트 문자열
    """
    advice = get_destiny_advice(ten_god, strength, language)
    if not advice:
        return ""

    ten_god_name = advice['ten_god']

    header_labels = {
        "ko": {
            "title": "분석 결과",
            "insight": "핵심 통찰",
            "career": "직업/커리어 조언",
            "relationship": "관계 조언",
            "action": "실천 항목",
            "avoid": "피해야 할 것",
        },
        "en": {
            "title": "Analysis Result",
            "insight": "Key Insight",
            "career": "Career Advice",
            "relationship": "Relationship Advice",
            "action": "Action Items",
            "avoid": "Things to Avoid",
        },
        "ja": {
            "title": "分析結果",
            "insight": "核心洞察",
            "career": "キャリアアドバイス",
            "relationship": "人間関係アドバイス",
            "action": "実践項目",
            "avoid": "避けるべきこと",
        },
        "zh-CN": {
            "title": "分析结果",
            "insight": "核心洞察",
            "career": "职业建议",
            "relationship": "关系建议",
            "action": "行动项目",
            "avoid": "应避免的事项",
        },
        "zh-TW": {
            "title": "分析結果",
            "insight": "核心洞察",
            "career": "職業建議",
            "relationship": "關係建議",
            "action": "行動項目",
            "avoid": "應避免的事項",
        },
    }

    labels = header_labels.get(language, header_labels['ko'])
    strength_labels = {
        "ko": {"strong": "강(强)", "weak": "약(弱)", "balanced": "균형(均衡)"},
        "en": {"strong": "Strong", "weak": "Weak", "balanced": "Balanced"},
        "ja": {"strong": "強", "weak": "弱", "balanced": "均衡"},
        "zh-CN": {"strong": "强", "weak": "弱", "balanced": "均衡"},
        "zh-TW": {"strong": "強", "weak": "弱", "balanced": "均衡"},
    }

    strength_label = strength_labels.get(language, strength_labels['ko']).get(strength, strength)

    parts = [
        f"# {labels['title']}: {ten_god_name} ({strength_label})",
        "",
        f"## {labels['insight']}",
        advice['insight'],
        "",
        f"## {labels['career']}",
        advice['career_advice'],
        "",
        f"## {labels['relationship']}",
        advice['relationship_advice'],
        "",
        f"## {labels['action']}",
    ]

    for item in advice['action_items']:
        parts.append(f"- {item}")

    parts.extend([
        "",
        f"## {labels['avoid']}",
    ])

    for item in advice['avoid_items']:
        parts.append(f"- {item}")

    return "\n".join(parts)
