"""
자평진전(子平真詮) 핵심 원리 - 다국어 지원
청대 심효첨(沈孝瞻) 저 - 명리학 격국론의 정수
"""
from dataclasses import dataclass
from typing import List, Dict, Literal

LanguageType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


@dataclass
class YongshinPrinciple:
    """용신 선정 원칙"""
    name: Dict[str, str]        # 언어별 이름
    chinese: str                # 한자
    description: Dict[str, str] # 언어별 설명
    conditions: Dict[str, List[str]]  # 언어별 조건


@dataclass
class Structure:
    """격국 정의"""
    name: Dict[str, str]        # 언어별 격국명
    chinese: str                # 한자
    formation: Dict[str, str]   # 언어별 성립 조건
    success: Dict[str, str]     # 언어별 성격 조건
    failure: Dict[str, str]     # 언어별 패격 조건
    characteristics: Dict[str, str]  # 언어별 특징


@dataclass
class TenGod:
    """십신 정의"""
    name: Dict[str, str]        # 언어별 십신명
    chinese: str                # 한자
    relation: Dict[str, str]    # 언어별 일간과의 관계
    meaning: Dict[str, str]     # 언어별 의미
    positive: Dict[str, str]    # 언어별 긍정적 특성
    negative: Dict[str, str]    # 언어별 부정적 특성


class ZipingPrompt:
    """자평진전 기반 프롬프트 생성 - 다국어 지원"""

    # 헤더 텍스트
    HEADERS: Dict[str, str] = {
        'ko': "# 자평진전(子平真詮) 분석 원리\n\n청대 심효첨(沈孝瞻)의 격국론을 기반으로 분석합니다.\n",
        'en': "# Analysis Principles from Ziping Zhenchuan (子平真詮)\n\nBased on Shen Xiaozhan's格局 theory from the Qing Dynasty.\n",
        'ja': "# 子平真詮（しへいしんせん）分析原理\n\n清代の沈孝瞻による格局論に基づいて分析します。\n",
        'zh-CN': "# 子平真诠分析原理\n\n基于清代沈孝瞻的格局论进行分析。\n",
        'zh-TW': "# 子平真詮分析原理\n\n基於清代沈孝瞻的格局論進行分析。\n",
    }

    # 용신 선정 5원칙
    YONGSHIN_PRINCIPLES: List[YongshinPrinciple] = [
        YongshinPrinciple(
            name={
                'ko': "억부용신",
                'en': "Suppression-Support God",
                'ja': "抑扶用神（よくふようしん）",
                'zh-CN': "抑扶用神",
                'zh-TW': "抑扶用神",
            },
            chinese="抑扶用神",
            description={
                'ko': """일간의 강약(强弱)에 따라 억제하거나 부조하는 용신입니다.
가장 기본적이고 보편적인 용신 선정법으로, 강한 일간은 억제하고 약한 일간은 도와주는 원리입니다.""",
                'en': """The Useful God that suppresses or supports based on the Day Master's strength.
The most fundamental method - suppress if too strong, support if too weak. Think of it as finding balance.""",
                'ja': """日干の強弱に応じて抑制または扶助する用神です。
最も基本的で普遍的な用神選定法であり、強い日干は抑え、弱い日干は助ける原理です。""",
                'zh-CN': """根据日干强弱来抑制或扶助的用神。
这是最基本、最普遍的用神选定法，强者宜抑，弱者宜扶。""",
                'zh-TW': """根據日干強弱來抑制或扶助的用神。
這是最基本、最普遍的用神選定法，強者宜抑，弱者宜扶。""",
            },
            conditions={
                'ko': [
                    "일간이 과강(過强)할 때: 식상/재성/관성으로 설기(泄氣)하거나 극(克)합니다",
                    "일간이 과약(過弱)할 때: 인성/비겁으로 생조(生助)합니다",
                    "신강사주(身强四柱): 재관을 용신으로 삼아 발복",
                    "신약사주(身弱四柱): 인비를 용신으로 삼아 보호"
                ],
                'en': [
                    "When Day Master is too strong: Use Output/Wealth/Officer to drain or control",
                    "When Day Master is too weak: Use Resource/Companion to support",
                    "Strong chart: Wealth and Officer as Useful God bring prosperity",
                    "Weak chart: Resource and Companion as Useful God provide protection"
                ],
                'ja': [
                    "日干が過強の時：食傷・財星・官星で洩気または剋する",
                    "日干が過弱の時：印星・比劫で生助する",
                    "身強四柱：財官を用神として発福",
                    "身弱四柱：印比を用神として保護"
                ],
                'zh-CN': [
                    "日干过强时：用食伤/财星/官星泄气或克制",
                    "日干过弱时：用印星/比劫生助",
                    "身强四柱：以财官为用神而发福",
                    "身弱四柱：以印比为用神而保护"
                ],
                'zh-TW': [
                    "日干過強時：用食傷/財星/官星洩氣或剋制",
                    "日干過弱時：用印星/比劫生助",
                    "身強四柱：以財官為用神而發福",
                    "身弱四柱：以印比為用神而保護"
                ],
            }
        ),
        YongshinPrinciple(
            name={
                'ko': "조후용신",
                'en': "Climate-Regulating God",
                'ja': "調候用神（ちょうこうようしん）",
                'zh-CN': "调候用神",
                'zh-TW': "調候用神",
            },
            chinese="調候用神",
            description={
                'ko': """계절의 한난(寒暖)을 조절하는 용신입니다.
궁통보감의 핵심 이론으로, 출생월의 기후에 따라 필요한 오행을 취합니다.""",
                'en': """The Useful God that regulates seasonal climate (cold/heat).
Based on Qiong Tong Bao Jian theory - balancing the climate of your birth month.""",
                'ja': """季節の寒暖を調節する用神です。
窮通宝鑑の核心理論で、出生月の気候に応じて必要な五行を取ります。""",
                'zh-CN': """调节季节寒暖的用神。
穷通宝鉴的核心理论，根据出生月的气候取用所需五行。""",
                'zh-TW': """調節季節寒暖的用神。
窮通寶鑑的核心理論，根據出生月的氣候取用所需五行。""",
            },
            conditions={
                'ko': [
                    "겨울(亥子丑월) 출생: 火로 따뜻하게 조절 (調暖)",
                    "여름(巳午未월) 출생: 水로 시원하게 조절 (調寒)",
                    "건조한 사주: 水로 습윤하게 (潤燥)",
                    "습한 사주: 火로 건조하게 (燥濕)"
                ],
                'en': [
                    "Winter birth (Hai-Zi-Chou months): Fire warms the chart",
                    "Summer birth (Si-Wu-Wei months): Water cools the chart",
                    "Dry chart: Water adds moisture",
                    "Damp chart: Fire brings warmth and dryness"
                ],
                'ja': [
                    "冬（亥子丑月）生まれ：火で暖かく調節（調暖）",
                    "夏（巳午未月）生まれ：水で涼しく調節（調寒）",
                    "乾燥した四柱：水で潤す（潤燥）",
                    "湿った四柱：火で乾燥させる（燥湿）"
                ],
                'zh-CN': [
                    "冬季（亥子丑月）出生：用火调暖",
                    "夏季（巳午未月）出生：用水调寒",
                    "干燥的八字：用水润燥",
                    "潮湿的八字：用火燥湿"
                ],
                'zh-TW': [
                    "冬季（亥子丑月）出生：用火調暖",
                    "夏季（巳午未月）出生：用水調寒",
                    "乾燥的八字：用水潤燥",
                    "潮濕的八字：用火燥濕"
                ],
            }
        ),
        YongshinPrinciple(
            name={
                'ko': "통관용신",
                'en': "Mediating God",
                'ja': "通関用神（つうかんようしん）",
                'zh-CN': "通关用神",
                'zh-TW': "通關用神",
            },
            chinese="通關用神",
            description={
                'ko': """대립하는 두 오행 사이를 중재하는 용신입니다.
상극 관계에 있는 오행들의 갈등을 해소하여 조화를 이룹니다.""",
                'en': """The Useful God that mediates between two conflicting elements.
Resolves tension between clashing elements by acting as a bridge.""",
                'ja': """対立する二つの五行の間を仲介する用神です。
相剋関係にある五行の葛藤を解消し、調和をもたらします。""",
                'zh-CN': """调解两个对立五行之间矛盾的用神。
通过作为桥梁，解决相克五行之间的冲突。""",
                'zh-TW': """調解兩個對立五行之間矛盾的用神。
通過作為橋樑，解決相剋五行之間的衝突。""",
            },
            conditions={
                'ko': [
                    "金木 대립: 水로 통관 (金生水, 水生木)",
                    "木土 대립: 火로 통관 (木生火, 火生土)",
                    "土水 대립: 金으로 통관 (土生金, 金生水)",
                    "水火 대립: 木으로 통관 (水生木, 木生火)",
                    "火金 대립: 土로 통관 (火生土, 土生金)"
                ],
                'en': [
                    "Metal-Wood conflict: Water mediates (Metal→Water→Wood)",
                    "Wood-Earth conflict: Fire mediates (Wood→Fire→Earth)",
                    "Earth-Water conflict: Metal mediates (Earth→Metal→Water)",
                    "Water-Fire conflict: Wood mediates (Water→Wood→Fire)",
                    "Fire-Metal conflict: Earth mediates (Fire→Earth→Metal)"
                ],
                'ja': [
                    "金木対立：水で通関（金生水、水生木）",
                    "木土対立：火で通関（木生火、火生土）",
                    "土水対立：金で通関（土生金、金生水）",
                    "水火対立：木で通関（水生木、木生火）",
                    "火金対立：土で通関（火生土、土生金）"
                ],
                'zh-CN': [
                    "金木对立：用水通关（金生水，水生木）",
                    "木土对立：用火通关（木生火，火生土）",
                    "土水对立：用金通关（土生金，金生水）",
                    "水火对立：用木通关（水生木，木生火）",
                    "火金对立：用土通关（火生土，土生金）"
                ],
                'zh-TW': [
                    "金木對立：用水通關（金生水，水生木）",
                    "木土對立：用火通關（木生火，火生土）",
                    "土水對立：用金通關（土生金，金生水）",
                    "水火對立：用木通關（水生木，木生火）",
                    "火金對立：用土通關（火生土，土生金）"
                ],
            }
        ),
        YongshinPrinciple(
            name={
                'ko': "병약용신",
                'en': "Disease-Medicine God",
                'ja': "病薬用神（びょうやくようしん）",
                'zh-CN': "病药用神",
                'zh-TW': "病藥用神",
            },
            chinese="病藥用神",
            description={
                'ko': """사주의 병폐(病弊)를 치료하는 용신입니다.
사주에 해로운 글자(病)를 제거하거나 억제하는 글자(藥)를 찾습니다.""",
                'en': """The Useful God that cures the chart's ailments.
Identifies harmful elements (disease) and finds what neutralizes them (medicine).""",
                'ja': """四柱の病弊を治療する用神です。
四柱に害を与える字（病）を除去または抑制する字（薬）を見つけます。""",
                'zh-CN': """治疗八字病弊的用神。
找出克制或去除有害五行（病）的五行（药）。""",
                'zh-TW': """治療八字病弊的用神。
找出剋制或去除有害五行（病）的五行（藥）。""",
            },
            conditions={
                'ko': [
                    "격국을 파괴하는 글자가 '병'",
                    "그 병을 극하거나 합거하는 글자가 '약'",
                    "병이 있고 약이 있으면 귀격(貴格)",
                    "병이 있고 약이 없으면 하격(下格)"
                ],
                'en': [
                    "The element destroying the structure is the 'disease'",
                    "The element controlling or combining away the disease is the 'medicine'",
                    "Disease with medicine = Noble chart with potential",
                    "Disease without medicine = Lower quality chart"
                ],
                'ja': [
                    "格局を破壊する字が「病」",
                    "その病を剋したり合去する字が「薬」",
                    "病があり薬があれば貴格",
                    "病があり薬がなければ下格"
                ],
                'zh-CN': [
                    "破坏格局的字为「病」",
                    "克制或合去病的字为「药」",
                    "有病有药为贵格",
                    "有病无药为下格"
                ],
                'zh-TW': [
                    "破壞格局的字為「病」",
                    "剋制或合去病的字為「藥」",
                    "有病有藥為貴格",
                    "有病無藥為下格"
                ],
            }
        ),
        YongshinPrinciple(
            name={
                'ko': "전왕용신",
                'en': "Dominant Flow God",
                'ja': "専旺用神（せんおうようしん）",
                'zh-CN': "专旺用神",
                'zh-TW': "專旺用神",
            },
            chinese="專旺用神",
            description={
                'ko': """한 오행이 압도적으로 강할 때 그 기세를 따르는 용신입니다.
종격(從格)이나 화격(化格) 등 특수 격국에 적용됩니다.""",
                'en': """The Useful God that follows the dominant element's momentum.
Applied in special structures like Follow structures - go with the flow rather than fight it.""",
                'ja': """一つの五行が圧倒的に強い時、その勢いに従う用神です。
従格や化格など特殊な格局に適用されます。""",
                'zh-CN': """当某一五行压倒性地强时，顺从其势的用神。
适用于从格、化格等特殊格局。""",
                'zh-TW': """當某一五行壓倒性地強時，順從其勢的用神。
適用於從格、化格等特殊格局。""",
            },
            conditions={
                'ko': [
                    "종아격(從兒格): 식상이 태왕하면 식상을 따름",
                    "종재격(從財格): 재성이 태왕하면 재성을 따름",
                    "종살격(從殺格): 관살이 태왕하면 관살을 따름",
                    "역행하면 파격, 순행하면 성격"
                ],
                'en': [
                    "Follow Output: When Output stars dominate, follow them",
                    "Follow Wealth: When Wealth stars dominate, follow them",
                    "Follow Power: When Officer/Killings dominate, follow them",
                    "Going against = failure, Going with = success"
                ],
                'ja': [
                    "従児格：食傷が太旺すれば食傷に従う",
                    "従財格：財星が太旺すれば財星に従う",
                    "従殺格：官殺が太旺すれば官殺に従う",
                    "逆行すれば破格、順行すれば成格"
                ],
                'zh-CN': [
                    "从儿格：食伤太旺则从食伤",
                    "从财格：财星太旺则从财星",
                    "从杀格：官杀太旺则从官杀",
                    "逆行则破格，顺行则成格"
                ],
                'zh-TW': [
                    "從兒格：食傷太旺則從食傷",
                    "從財格：財星太旺則從財星",
                    "從殺格：官殺太旺則從官殺",
                    "逆行則破格，順行則成格"
                ],
            }
        )
    ]

    # 정격 8격 - 핵심만 다국어화
    EIGHT_STRUCTURES: List[Structure] = [
        Structure(
            name={'ko': "정관격", 'en': "Direct Officer Structure", 'ja': "正官格", 'zh-CN': "正官格", 'zh-TW': "正官格"},
            chinese="正官格",
            formation={
                'ko': "월지 지장간에 정관이 투출하거나, 월지 본기가 정관인 경우",
                'en': "Direct Officer appears in the month branch's hidden stems or is the primary qi",
                'ja': "月支の蔵干に正官が透出、または月支の本気が正官の場合",
                'zh-CN': "月支藏干中正官透出，或月支本气为正官",
                'zh-TW': "月支藏干中正官透出，或月支本氣為正官",
            },
            success={
                'ko': "정관이 하나뿐이고 상관의 극이 없으며, 재성이 생조하는 경우",
                'en': "Single Officer, no Hurting Officer attack, supported by Wealth",
                'ja': "正官が一つだけで傷官の剋がなく、財星が生助する場合",
                'zh-CN': "正官唯一，无伤官克，财星生助",
                'zh-TW': "正官唯一，無傷官剋，財星生助",
            },
            failure={
                'ko': "상관이 정관을 극하거나, 정관이 혼잡하거나, 칠살과 섞인 경우",
                'en': "Hurting Officer attacks, multiple Officers, or mixed with Seven Killings",
                'ja': "傷官が正官を剋する、正官が混雑、七殺と混じる場合",
                'zh-CN': "伤官克正官，正官混杂，或与七杀混杂",
                'zh-TW': "傷官剋正官，正官混雜，或與七殺混雜",
            },
            characteristics={
                'ko': "명예, 직위, 규율을 중시. 공직, 대기업 적합. 정도를 걷는 성품.",
                'en': "Values honor, position, discipline. Suited for government, corporations. Principled nature.",
                'ja': "名誉、地位、規律を重視。公職、大企業に適合。正道を歩む性格。",
                'zh-CN': "重视名誉、地位、纪律。适合公职、大企业。正派性格。",
                'zh-TW': "重視名譽、地位、紀律。適合公職、大企業。正派性格。",
            }
        ),
        Structure(
            name={'ko': "편관격", 'en': "Seven Killings Structure", 'ja': "偏官格", 'zh-CN': "偏官格", 'zh-TW': "偏官格"},
            chinese="偏官格(七殺格)",
            formation={
                'ko': "월지 지장간에 편관(칠살)이 투출하거나, 월지 본기가 칠살인 경우",
                'en': "Seven Killings appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に偏官（七殺）が透出、または月支の本気が七殺の場合",
                'zh-CN': "月支藏干中偏官（七杀）透出，或月支本气为七杀",
                'zh-TW': "月支藏干中偏官（七殺）透出，或月支本氣為七殺",
            },
            success={
                'ko': "식신으로 제살하거나(食神制殺), 인성으로 화살하는(印星化殺) 경우",
                'en': "Controlled by Eating God or transformed by Resource",
                'ja': "食神で制殺、または印星で化殺する場合",
                'zh-CN': "食神制杀，或印星化杀",
                'zh-TW': "食神制殺，或印星化殺",
            },
            failure={
                'ko': "칠살이 제화되지 않고 일간을 공격하거나, 식상과 인성이 동시에 있는 경우",
                'en': "Uncontrolled Killings attacking Day Master, or both Output and Resource present",
                'ja': "七殺が制化されず日干を攻撃、または食傷と印星が同時にある場合",
                'zh-CN': "七杀未制化而攻日干，或食伤与印星同时存在",
                'zh-TW': "七殺未制化而攻日干，或食傷與印星同時存在",
            },
            characteristics={
                'ko': "권위, 결단력, 추진력. 군인, 검찰, 외과의사 적합. 강한 카리스마.",
                'en': "Authority, decisiveness, drive. Suited for military, law, surgery. Strong charisma.",
                'ja': "権威、決断力、推進力。軍人、検察、外科医に適合。強いカリスマ。",
                'zh-CN': "权威、决断力、执行力。适合军人、检察官、外科医生。魅力强大。",
                'zh-TW': "權威、決斷力、執行力。適合軍人、檢察官、外科醫生。魅力強大。",
            }
        ),
        Structure(
            name={'ko': "정인격", 'en': "Direct Resource Structure", 'ja': "正印格", 'zh-CN': "正印格", 'zh-TW': "正印格"},
            chinese="正印格",
            formation={
                'ko': "월지 지장간에 정인이 투출하거나, 월지 본기가 정인인 경우",
                'en': "Direct Resource appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に正印が透出、または月支の本気が正印の場合",
                'zh-CN': "月支藏干中正印透出，或月支本气为正印",
                'zh-TW': "月支藏干中正印透出，或月支本氣為正印",
            },
            success={
                'ko': "관성이 인성을 생조하고, 재성의 극이 없는 경우 (官印相生)",
                'en': "Officer supports Resource, no Wealth attack (Officer-Resource mutual support)",
                'ja': "官星が印星を生助し、財星の剋がない場合（官印相生）",
                'zh-CN': "官星生印，无财星克（官印相生）",
                'zh-TW': "官星生印，無財星剋（官印相生）",
            },
            failure={
                'ko': "재성이 인성을 극하거나, 식상이 인성을 설기하는 경우",
                'en': "Wealth attacks Resource, or Output drains Resource",
                'ja': "財星が印星を剋する、または食傷が印星を洩気する場合",
                'zh-CN': "财星克印，或食伤泄印",
                'zh-TW': "財星剋印，或食傷洩印",
            },
            characteristics={
                'ko': "학문, 자격증, 보호본능. 교육자, 연구직 적합. 이론적 사고.",
                'en': "Learning, credentials, protective nature. Suited for education, research. Theoretical thinking.",
                'ja': "学問、資格、保護本能。教育者、研究職に適合。理論的思考。",
                'zh-CN': "学问、资格证、保护本能。适合教育者、研究职。理论性思维。",
                'zh-TW': "學問、資格證、保護本能。適合教育者、研究職。理論性思維。",
            }
        ),
        Structure(
            name={'ko': "편인격", 'en': "Indirect Resource Structure", 'ja': "偏印格", 'zh-CN': "偏印格", 'zh-TW': "偏印格"},
            chinese="偏印格(梟神格)",
            formation={
                'ko': "월지 지장간에 편인이 투출하거나, 월지 본기가 편인인 경우",
                'en': "Indirect Resource appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に偏印が透出、または月支の本気が偏印の場合",
                'zh-CN': "月支藏干中偏印透出，或月支本气为偏印",
                'zh-TW': "月支藏干中偏印透出，或月支本氣為偏印",
            },
            success={
                'ko': "편인이 칠살을 화하거나, 재성으로 편인을 제어하는 경우",
                'en': "Indirect Resource transforms Killings, or controlled by Wealth",
                'ja': "偏印が七殺を化する、または財星で偏印を制御する場合",
                'zh-CN': "偏印化杀，或财星制偏印",
                'zh-TW': "偏印化殺，或財星制偏印",
            },
            failure={
                'ko': "편인이 식신을 극하는 경우 (梟神奪食) - 의식주 불안정",
                'en': "Indirect Resource attacks Eating God (stealing livelihood) - instability in basic needs",
                'ja': "偏印が食神を剋する場合（梟神奪食）- 衣食住の不安定",
                'zh-CN': "偏印克食神（枭神夺食）- 衣食住不稳定",
                'zh-TW': "偏印剋食神（梟神奪食）- 衣食住不穩定",
            },
            characteristics={
                'ko': "특수 재능, 비주류, 창의성. 예술가, 철학자 적합. 독창적 사고.",
                'en': "Special talents, unconventional, creative. Suited for arts, philosophy. Original thinking.",
                'ja': "特殊才能、非主流、創造性。芸術家、哲学者に適合。独創的思考。",
                'zh-CN': "特殊才能、非主流、创造性。适合艺术家、哲学家。独创性思维。",
                'zh-TW': "特殊才能、非主流、創造性。適合藝術家、哲學家。獨創性思維。",
            }
        ),
        Structure(
            name={'ko': "식신격", 'en': "Creative Output Structure", 'ja': "食神格", 'zh-CN': "食神格", 'zh-TW': "食神格"},
            chinese="食神格",
            formation={
                'ko': "월지 지장간에 식신이 투출하거나, 월지 본기가 식신인 경우",
                'en': "Eating God appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に食神が透出、または月支の本気が食神の場合",
                'zh-CN': "月支藏干中食神透出，或月支本气为食神",
                'zh-TW': "月支藏干中食神透出，或月支本氣為食神",
            },
            success={
                'ko': "식신이 재성을 생하고, 편인의 극이 없는 경우 (食神生財)",
                'en': "Eating God produces Wealth, no Indirect Resource attack",
                'ja': "食神が財星を生じ、偏印の剋がない場合（食神生財）",
                'zh-CN': "食神生财，无偏印克",
                'zh-TW': "食神生財，無偏印剋",
            },
            failure={
                'ko': "편인이 식신을 극하거나 (倒食), 관성이 많은 경우",
                'en': "Indirect Resource attacks (reversed eating), or too many Officers",
                'ja': "偏印が食神を剋する（倒食）、または官星が多い場合",
                'zh-CN': "偏印克食神（倒食），或官星过多",
                'zh-TW': "偏印剋食神（倒食），或官星過多",
            },
            characteristics={
                'ko': "표현력, 여유, 재능. 예능인, 요리사, 강사 적합. 낙천적 성격.",
                'en': "Expression, ease, talent. Suited for entertainment, culinary arts, teaching. Optimistic.",
                'ja': "表現力、余裕、才能。芸能人、料理人、講師に適合。楽天的性格。",
                'zh-CN': "表达力、从容、才华。适合艺人、厨师、讲师。乐观性格。",
                'zh-TW': "表達力、從容、才華。適合藝人、廚師、講師。樂觀性格。",
            }
        ),
        Structure(
            name={'ko': "상관격", 'en': "Hurting Officer Structure", 'ja': "傷官格", 'zh-CN': "伤官格", 'zh-TW': "傷官格"},
            chinese="傷官格",
            formation={
                'ko': "월지 지장간에 상관이 투출하거나, 월지 본기가 상관인 경우",
                'en': "Hurting Officer appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に傷官が透出、または月支の本気が傷官の場合",
                'zh-CN': "月支藏干中伤官透出，或月支本气为伤官",
                'zh-TW': "月支藏干中傷官透出，或月支本氣為傷官",
            },
            success={
                'ko': "상관이 재성을 생하거나 (傷官生財), 인성으로 상관을 제어하는 경우",
                'en': "Hurting Officer produces Wealth, or controlled by Resource",
                'ja': "傷官が財星を生じる（傷官生財）、または印星で傷官を制御する場合",
                'zh-CN': "伤官生财，或印星制伤官",
                'zh-TW': "傷官生財，或印星制傷官",
            },
            failure={
                'ko': "상관이 정관을 극하거나 (傷官見官), 비겁이 없어 신약한 경우",
                'en': "Hurting Officer attacks Direct Officer, or too weak without Companions",
                'ja': "傷官が正官を剋する（傷官見官）、または比劫がなく身弱の場合",
                'zh-CN': "伤官见官，或无比劫身弱",
                'zh-TW': "傷官見官，或無比劫身弱",
            },
            characteristics={
                'ko': "반항심, 창의력, 기술. 변호사, 예술가, 기술자 적합. 독립적 성격.",
                'en': "Rebellious, creative, skilled. Suited for law, arts, engineering. Independent.",
                'ja': "反抗心、創造力、技術。弁護士、芸術家、技術者に適合。独立的性格。",
                'zh-CN': "叛逆心、创造力、技术。适合律师、艺术家、技术者。独立性格。",
                'zh-TW': "叛逆心、創造力、技術。適合律師、藝術家、技術者。獨立性格。",
            }
        ),
        Structure(
            name={'ko': "정재격", 'en': "Direct Wealth Structure", 'ja': "正財格", 'zh-CN': "正财格", 'zh-TW': "正財格"},
            chinese="正財格",
            formation={
                'ko': "월지 지장간에 정재가 투출하거나, 월지 본기가 정재인 경우",
                'en': "Direct Wealth appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に正財が透出、または月支の本気が正財の場合",
                'zh-CN': "月支藏干中正财透出，或月支本气为正财",
                'zh-TW': "月支藏干中正財透出，或月支本氣為正財",
            },
            success={
                'ko': "일간이 강하고 식상이 재성을 생조하며, 비겁의 분탈이 없는 경우",
                'en': "Strong Day Master, Output supports Wealth, no Companion robbery",
                'ja': "日干が強く食傷が財星を生助し、比劫の分奪がない場合",
                'zh-CN': "日干强旺，食伤生财，无比劫分夺",
                'zh-TW': "日干強旺，食傷生財，無比劫分奪",
            },
            failure={
                'ko': "비겁이 재성을 분탈하거나, 일간이 약해 재성을 감당 못하는 경우",
                'en': "Companions rob Wealth, or Day Master too weak to handle Wealth",
                'ja': "比劫が財星を分奪する、または日干が弱く財星を担えない場合",
                'zh-CN': "比劫分夺财星，或日干弱不能担财",
                'zh-TW': "比劫分奪財星，或日干弱不能擔財",
            },
            characteristics={
                'ko': "안정 추구, 근면성실, 저축. 회계사, 금융업 적합. 계획적 성격.",
                'en': "Stability-seeking, diligent, saves money. Suited for accounting, finance. Methodical.",
                'ja': "安定志向、勤勉誠実、貯蓄。会計士、金融業に適合。計画的性格。",
                'zh-CN': "追求稳定、勤勉踏实、储蓄。适合会计、金融业。有计划性格。",
                'zh-TW': "追求穩定、勤勉踏實、儲蓄。適合會計、金融業。有計劃性格。",
            }
        ),
        Structure(
            name={'ko': "편재격", 'en': "Indirect Wealth Structure", 'ja': "偏財格", 'zh-CN': "偏财格", 'zh-TW': "偏財格"},
            chinese="偏財格",
            formation={
                'ko': "월지 지장간에 편재가 투출하거나, 월지 본기가 편재인 경우",
                'en': "Indirect Wealth appears in the month branch or is the primary qi",
                'ja': "月支の蔵干に偏財が透出、または月支の本気が偏財の場合",
                'zh-CN': "月支藏干中偏财透出，或月支本气为偏财",
                'zh-TW': "月支藏干中偏財透出，或月支本氣為偏財",
            },
            success={
                'ko': "일간이 강하고 편재가 관성을 생조하며, 비겁의 분탈이 없는 경우",
                'en': "Strong Day Master, Indirect Wealth supports Officer, no robbery",
                'ja': "日干が強く偏財が官星を生助し、比劫の分奪がない場合",
                'zh-CN': "日干强旺，偏财生官，无比劫分夺",
                'zh-TW': "日干強旺，偏財生官，無比劫分奪",
            },
            failure={
                'ko': "비겁이 편재를 분탈하거나, 일간이 약해 재성을 감당 못하는 경우",
                'en': "Companions rob Wealth, or Day Master too weak to handle Wealth",
                'ja': "比劫が偏財を分奪する、または日干が弱く財星を担えない場合",
                'zh-CN': "比劫分夺偏财，或日干弱不能担财",
                'zh-TW': "比劫分奪偏財，或日干弱不能擔財",
            },
            characteristics={
                'ko': "투기성, 사교성, 융통성. 사업가, 영업직 적합. 대범한 성격.",
                'en': "Speculative, social, flexible. Suited for business, sales. Bold nature.",
                'ja': "投機性、社交性、融通性。事業家、営業職に適合。大胆な性格。",
                'zh-CN': "投机性、社交性、灵活性。适合事业家、销售。大胆性格。",
                'zh-TW': "投機性、社交性、靈活性。適合事業家、銷售。大膽性格。",
            }
        )
    ]

    # 합충형파해 관계 (한국어만 유지 - 전문 용어)
    HEAVENLY_STEM_COMBINATIONS = {
        "갑기합토": ("甲己合土", "甲 + 己 → 土로 화함"),
        "을경합금": ("乙庚合金", "乙 + 庚 → 金으로 화함"),
        "병신합수": ("丙辛合水", "丙 + 辛 → 水로 화함"),
        "정임합목": ("丁壬合木", "丁 + 壬 → 木으로 화함"),
        "무계합화": ("戊癸合火", "戊 + 癸 → 火로 화함")
    }

    EARTHLY_BRANCH_CLASHES = {
        "자오충": ("子午冲", "子 ↔ 午 水火對立"),
        "축미충": ("丑未冲", "丑 ↔ 未 土土衝突"),
        "인신충": ("寅申冲", "寅 ↔ 申 木金對立"),
        "묘유충": ("卯酉冲", "卯 ↔ 酉 木金對立"),
        "진술충": ("辰戌冲", "辰 ↔ 戌 土土衝突"),
        "사해충": ("巳亥冲", "巳 ↔ 亥 火水對立")
    }

    @classmethod
    def get_yongshin_principles_text(cls, language: LanguageType = 'ko') -> str:
        """용신 선정 5원칙 프롬프트 텍스트"""
        section_titles = {
            'ko': "## 용신(用神) 선정 5원칙\n",
            'en': "## Five Principles for Selecting the Useful God\n",
            'ja': "## 用神選定の5原則\n",
            'zh-CN': "## 用神选定五原则\n",
            'zh-TW': "## 用神選定五原則\n",
        }
        condition_labels = {
            'ko': "**적용 조건:**",
            'en': "**Application:**",
            'ja': "**適用条件:**",
            'zh-CN': "**应用条件:**",
            'zh-TW': "**應用條件:**",
        }

        lines = [section_titles.get(language, section_titles['ko'])]

        for p in cls.YONGSHIN_PRINCIPLES:
            lines.append(f"### {p.name.get(language, p.name['ko'])} ({p.chinese})")
            lines.append(p.description.get(language, p.description['ko']))
            lines.append(f"\n{condition_labels.get(language, condition_labels['ko'])}")
            for cond in p.conditions.get(language, p.conditions['ko']):
                lines.append(f"- {cond}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_structure_analysis_guide(cls, language: LanguageType = 'ko') -> str:
        """8격 판단 가이드"""
        section_titles = {
            'ko': "## 격국(格局) 8격 판단\n\n격국은 월지(月支)를 중심으로 판단합니다.\n",
            'en': "## Eight Structures Analysis\n\nStructure is determined by the Month Branch.\n",
            'ja': "## 格局の八格判断\n\n格局は月支を中心に判断します。\n",
            'zh-CN': "## 格局八格判断\n\n格局以月支为中心判断。\n",
            'zh-TW': "## 格局八格判斷\n\n格局以月支為中心判斷。\n",
        }
        labels = {
            'ko': {"formation": "성립", "success": "성격(成格)", "failure": "패격(敗格)", "characteristics": "특성"},
            'en': {"formation": "Formation", "success": "Success", "failure": "Failure", "characteristics": "Traits"},
            'ja': {"formation": "成立", "success": "成格", "failure": "敗格", "characteristics": "特性"},
            'zh-CN': {"formation": "成立", "success": "成格", "failure": "败格", "characteristics": "特性"},
            'zh-TW': {"formation": "成立", "success": "成格", "failure": "敗格", "characteristics": "特性"},
        }

        label = labels.get(language, labels['ko'])
        lines = [section_titles.get(language, section_titles['ko'])]

        for s in cls.EIGHT_STRUCTURES:
            lines.append(f"### {s.name.get(language, s.name['ko'])} ({s.chinese})")
            lines.append(f"**{label['formation']}**: {s.formation.get(language, s.formation['ko'])}")
            lines.append(f"**{label['success']}**: {s.success.get(language, s.success['ko'])}")
            lines.append(f"**{label['failure']}**: {s.failure.get(language, s.failure['ko'])}")
            lines.append(f"**{label['characteristics']}**: {s.characteristics.get(language, s.characteristics['ko'])}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_combination_rules(cls, language: LanguageType = 'ko') -> str:
        """합충형파해 규칙 (간략 버전)"""
        section_titles = {
            'ko': "## 합충(合沖) 관계\n",
            'en': "## Combinations and Clashes\n",
            'ja': "## 合冲関係\n",
            'zh-CN': "## 合冲关系\n",
            'zh-TW': "## 合沖關係\n",
        }

        lines = [section_titles.get(language, section_titles['ko'])]

        # 천간합
        lines.append("### 天干合 (Heavenly Stem Combinations)\n")
        for key, (chinese, desc) in cls.HEAVENLY_STEM_COMBINATIONS.items():
            lines.append(f"- **{chinese}**: {desc}")
        lines.append("")

        # 지지충
        lines.append("### 地支冲 (Earthly Branch Clashes)\n")
        for key, (chinese, desc) in cls.EARTHLY_BRANCH_CLASHES.items():
            lines.append(f"- **{chinese}**: {desc}")
        lines.append("")

        return "\n".join(lines)

    @classmethod
    def build(cls, language: LanguageType = 'ko') -> str:
        """자평진전 전체 프롬프트 조각"""
        # 레거시 호환: 'zh' → 'zh-CN'
        if language == 'zh':
            language = 'zh-CN'

        parts = [
            cls.HEADERS.get(language, cls.HEADERS['ko']),
            cls.get_yongshin_principles_text(language),
            cls.get_structure_analysis_guide(language),
            cls.get_combination_rules(language)
        ]

        return "\n".join(parts)
