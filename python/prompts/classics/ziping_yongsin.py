"""
자평진전(子平真詮) 용신 5원칙 매트릭스
청대 심효첨(沈孝瞻) 저 - 제8장 '论用神' 기반

용신 5원칙:
1. 억부(抑扶) - 일간 강약에 따른 설기/생조
2. 조후(調候) - 한난조습 조절 (궁통보감)
3. 통관(通關) - 오행 대치 시 중재
4. 병약(病藥) - 격국 파괴자/치료자
5. 전왕(專旺) - 극강 오행 순응

지원 언어: ko, en, ja, zh-CN, zh-TW
"""
from dataclasses import dataclass
from typing import Dict, List, Optional, Literal

LanguageType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


@dataclass
class YongsinEntry:
    """용신 엔트리 (다국어)"""
    formation: str                # 격국 (정관격, 편관격 등)
    formation_chinese: str        # 격국 한자
    day_master_strength: str      # 일간 강약 (strong/weak/balanced)
    primary_god: str              # 1순위 용신
    secondary_god: str            # 2순위 용신
    xi_shen: List[str]            # 희신 (좋은 신)
    ji_shen: List[str]            # 기신 (나쁜 신)
    principle: str                # 적용 원칙 (억부/조후/통관/병약/전왕)
    condition: Dict[str, str]     # 조건 설명 (5개 언어)
    outcome: Dict[str, str]       # 결과/효과 (5개 언어)
    original: str                 # 원문 발췌 (한자)


# =============================================================================
# 용신 5원칙 정의 (다국어)
# =============================================================================
YONGSIN_PRINCIPLES: Dict[str, Dict[str, str]] = {
    "억부": {
        "ko": "일간(日干)의 강약(强弱)에 따라 억제하거나 부조(扶助)합니다. 신강(身强)하면 설기(泄氣)하고, 신약(身弱)하면 생조(生助)합니다.",
        "en": "Suppress if Day Master is too strong, support if too weak. The most fundamental principle for balance.",
        "ja": "日干の強弱に応じて抑制または扶助します。身強なら洩気し、身弱なら生助します。",
        "zh-CN": "根据日干强弱来抑制或扶助。身强则泄气，身弱则生助。",
        "zh-TW": "根據日干強弱來抑制或扶助。身強則洩氣，身弱則生助。",
    },
    "조후": {
        "ko": "계절의 한난조습(寒暖燥濕)을 조절합니다. 겨울 출생은 火로 조난(調暖), 여름 출생은 水로 조한(調寒)합니다.",
        "en": "Regulate seasonal climate. Winter birth needs Fire for warmth, summer birth needs Water for cooling.",
        "ja": "季節の寒暖燥湿を調節します。冬生まれは火で調暖、夏生まれは水で調寒します。",
        "zh-CN": "调节季节的寒暖燥湿。冬生用火调暖，夏生用水调寒。",
        "zh-TW": "調節季節的寒暖燥濕。冬生用火調暖，夏生用水調寒。",
    },
    "통관": {
        "ko": "대립하는 두 오행 사이를 중재합니다. 金木 대립 시 水로 통관, 水火 대립 시 木으로 통관합니다.",
        "en": "Mediate between two conflicting elements. Water mediates Metal-Wood, Wood mediates Water-Fire.",
        "ja": "対立する二つの五行の間を仲介します。金木対立は水で通関、水火対立は木で通関します。",
        "zh-CN": "调解两个对立五行之间的矛盾。金木对立用水通关，水火对立用木通关。",
        "zh-TW": "調解兩個對立五行之間的矛盾。金木對立用水通關，水火對立用木通關。",
    },
    "병약": {
        "ko": "사주의 병폐(病弊)를 치료합니다. 격국을 파괴하는 글자가 '병(病)', 그것을 제거하는 글자가 '약(藥)'입니다.",
        "en": "Cure the chart's ailments. The element destroying structure is 'disease', what neutralizes it is 'medicine'.",
        "ja": "四柱の病弊を治療します。格局を破壊する字が「病」、それを除去する字が「薬」です。",
        "zh-CN": "治疗八字的病弊。破坏格局的字为「病」，克制它的字为「药」。",
        "zh-TW": "治療八字的病弊。破壞格局的字為「病」，剋制它的字為「藥」。",
    },
    "전왕": {
        "ko": "한 오행이 압도적으로 강할 때 그 기세를 따릅니다. 종격(從格)이나 화격(化格) 등 특수 격국에 적용됩니다.",
        "en": "Follow the dominant element's momentum when overwhelmingly strong. Applied in special structures like Follow formations.",
        "ja": "一つの五行が圧倒的に強い時、その勢いに従います。従格や化格など特殊な格局に適用されます。",
        "zh-CN": "当某一五行压倒性地强时，顺从其势。适用于从格、化格等特殊格局。",
        "zh-TW": "當某一五行壓倒性地強時，順從其勢。適用於從格、化格等特殊格局。",
    },
}


# =============================================================================
# 正官格 (정관격) - Direct Officer Structure
# =============================================================================
ZHENGGUANGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="정관격", formation_chinese="正官格",
        day_master_strength="strong",
        primary_god="財", secondary_god="食傷",
        xi_shen=["財星", "食神"],
        ji_shen=["印星", "比劫"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 정관격: 일간이 강하고 정관이 약함",
            "en": "Strong body Direct Officer: Day Master strong, Officer weak",
            "ja": "身強の正官格：日干が強く正官が弱い",
            "zh-CN": "身强正官格：日干强旺，正官偏弱",
            "zh-TW": "身強正官格：日干強旺，正官偏弱",
        },
        outcome={
            "ko": "財로 官을 생하고 食傷으로 설기하면 귀격(貴格)",
            "en": "Wealth supports Officer, Output drains excess - noble structure",
            "ja": "財で官を生じ食傷で洩気すれば貴格",
            "zh-CN": "财生官，食伤泄秀则成贵格",
            "zh-TW": "財生官，食傷洩秀則成貴格",
        },
        original="正官格，身旺喜財以生官，食傷以制身。"
    ),
    "weak": YongsinEntry(
        formation="정관격", formation_chinese="正官格",
        day_master_strength="weak",
        primary_god="印", secondary_god="比劫",
        xi_shen=["印星", "比劫"],
        ji_shen=["財星", "食傷"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 정관격: 일간이 약하고 관성이 무거움",
            "en": "Weak body Direct Officer: Day Master weak, Officer too heavy",
            "ja": "身弱の正官格：日干が弱く官星が重い",
            "zh-CN": "身弱正官格：日干弱，官星过重",
            "zh-TW": "身弱正官格：日干弱，官星過重",
        },
        outcome={
            "ko": "印으로 官을 화(化)하고 신을 생하면 官印相生 귀격",
            "en": "Resource transforms Officer and supports Day Master - Officer-Resource mutual support",
            "ja": "印で官を化し身を生じれば官印相生の貴格",
            "zh-CN": "印化官生身，官印相生成贵格",
            "zh-TW": "印化官生身，官印相生成貴格",
        },
        original="正官格，身弱喜印綬化官生身，官印相生，名垂青史。"
    ),
    "balanced": YongsinEntry(
        formation="정관격", formation_chinese="正官格",
        day_master_strength="balanced",
        primary_god="財", secondary_god="印",
        xi_shen=["財星", "印星"],
        ji_shen=["傷官", "七殺"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 정관격: 일간과 관성이 균형",
            "en": "Balanced Direct Officer: Day Master and Officer in harmony",
            "ja": "中和の正官格：日干と官星が均衡",
            "zh-CN": "中和正官格：日干与官星平衡",
            "zh-TW": "中和正官格：日干與官星平衡",
        },
        outcome={
            "ko": "傷官이 없고 財印이 있으면 상격(上格)",
            "en": "No Hurting Officer, with Wealth and Resource - superior structure",
            "ja": "傷官がなく財印があれば上格",
            "zh-CN": "无伤官，有财印则为上格",
            "zh-TW": "無傷官，有財印則為上格",
        },
        original="正官格，身官均衡，喜財印並用，忌傷官克官。"
    ),
}


# =============================================================================
# 偏官格/七殺格 (편관격) - Seven Killings Structure
# =============================================================================
PIANGUANGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="편관격", formation_chinese="偏官格(七殺格)",
        day_master_strength="strong",
        primary_god="財", secondary_god="七殺",
        xi_shen=["財星", "七殺"],
        ji_shen=["印星", "食神"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 편관격: 일간이 강하여 칠살을 감당 가능",
            "en": "Strong body Seven Killings: Day Master can handle the Killings",
            "ja": "身強の偏官格：日干が強く七殺に堪えられる",
            "zh-CN": "身强偏官格：日干强旺可担七杀",
            "zh-TW": "身強偏官格：日干強旺可擔七殺",
        },
        outcome={
            "ko": "財로 殺을 생하면 殺刃格으로 권력과 위엄을 얻음",
            "en": "Wealth supports Killings - Killing-Blade structure brings power",
            "ja": "財で殺を生じれば殺刃格で権力と威厳を得る",
            "zh-CN": "财生杀成杀刃格，得权势威严",
            "zh-TW": "財生殺成殺刃格，得權勢威嚴",
        },
        original="七殺格，身強殺淺，喜財滋殺。殺刃相停，貴而有權。"
    ),
    "weak": YongsinEntry(
        formation="편관격", formation_chinese="偏官格(七殺格)",
        day_master_strength="weak",
        primary_god="食神", secondary_god="印",
        xi_shen=["食神", "印星"],
        ji_shen=["財星", "七殺"],
        principle="병약",
        condition={
            "ko": "신약(身弱)한 편관격: 칠살이 너무 무거워 제화(制化) 필요",
            "en": "Weak body Seven Killings: Killings too heavy, needs control or transformation",
            "ja": "身弱の偏官格：七殺が重すぎて制化が必要",
            "zh-CN": "身弱偏官格：七杀过重需制化",
            "zh-TW": "身弱偏官格：七殺過重需制化",
        },
        outcome={
            "ko": "食神으로 殺을 제어하거나(食神制殺), 印으로 殺을 화(印化殺)하면 귀격",
            "en": "Eating God controls Killings or Resource transforms them - noble structure",
            "ja": "食神で殺を制するか印で殺を化すれば貴格",
            "zh-CN": "食神制杀或印星化杀则成贵格",
            "zh-TW": "食神制殺或印星化殺則成貴格",
        },
        original="七殺格，身弱殺重，喜食神制殺，或印綬化殺。"
    ),
    "balanced": YongsinEntry(
        formation="편관격", formation_chinese="偏官格(七殺格)",
        day_master_strength="balanced",
        primary_god="食神", secondary_god="財",
        xi_shen=["食神", "財星"],
        ji_shen=["傷官", "正官"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 편관격: 칠살과 일간이 균형, 官殺 혼잡 주의",
            "en": "Balanced Seven Killings: Killings and Day Master balanced, avoid mixing Officers",
            "ja": "中和の偏官格：七殺と日干が均衡、官殺混雑に注意",
            "zh-CN": "中和偏官格：七杀与日干平衡，忌官杀混杂",
            "zh-TW": "中和偏官格：七殺與日干平衡，忌官殺混雜",
        },
        outcome={
            "ko": "食神으로 殺을 제어하고 財로 생조하면 위엄과 권력을 겸비",
            "en": "Eating God controls Killings with Wealth support - authority and power",
            "ja": "食神で殺を制し財で生助すれば威厳と権力を兼備",
            "zh-CN": "食神制杀，财来生杀，威权兼备",
            "zh-TW": "食神制殺，財來生殺，威權兼備",
        },
        original="七殺格，殺印相生，或食神制殺，皆為貴格。忌官殺混雜。"
    ),
}


# =============================================================================
# 正印格 (정인격) - Direct Resource Structure
# =============================================================================
ZHENGYINGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="정인격", formation_chinese="正印格",
        day_master_strength="strong",
        primary_god="財", secondary_god="食傷",
        xi_shen=["財星", "食傷"],
        ji_shen=["印星", "比劫"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 정인격: 인수가 과다하여 오히려 의존적",
            "en": "Strong body Direct Resource: Too much Resource creates dependency",
            "ja": "身強の正印格：印が過多でかえって依存的",
            "zh-CN": "身强正印格：印过多反而依赖性强",
            "zh-TW": "身強正印格：印過多反而依賴性強",
        },
        outcome={
            "ko": "財로 印을 제어하거나 食傷으로 설기하면 자립 가능",
            "en": "Wealth controls Resource or Output drains - enables independence",
            "ja": "財で印を制するか食傷で洩気すれば自立可能",
            "zh-CN": "财制印或食伤泄秀则能自立",
            "zh-TW": "財制印或食傷洩秀則能自立",
        },
        original="正印格，身旺印重，喜財破印，或食傷泄秀。"
    ),
    "weak": YongsinEntry(
        formation="정인격", formation_chinese="正印格",
        day_master_strength="weak",
        primary_god="官", secondary_god="印",
        xi_shen=["官星", "印星"],
        ji_shen=["財星", "食傷"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 정인격: 관성이 인성을 생하여 일간을 보호",
            "en": "Weak body Direct Resource: Officer supports Resource to protect Day Master",
            "ja": "身弱の正印格：官星が印星を生じて日干を保護",
            "zh-CN": "身弱正印格：官生印护身",
            "zh-TW": "身弱正印格：官生印護身",
        },
        outcome={
            "ko": "官印相生하면 학문과 명예를 얻고 벼슬길이 열림",
            "en": "Officer-Resource mutual support brings scholarship and official career",
            "ja": "官印相生すれば学問と名誉を得て仕官の道が開ける",
            "zh-CN": "官印相生得学问名誉，仕途顺遂",
            "zh-TW": "官印相生得學問名譽，仕途順遂",
        },
        original="正印格，身弱喜官印相生，名利雙收。"
    ),
    "balanced": YongsinEntry(
        formation="정인격", formation_chinese="正印格",
        day_master_strength="balanced",
        primary_god="官", secondary_god="食傷",
        xi_shen=["官星", "食傷"],
        ji_shen=["財星", "偏印"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 정인격: 인성과 일간이 조화",
            "en": "Balanced Direct Resource: Resource and Day Master in harmony",
            "ja": "中和の正印格：印星と日干が調和",
            "zh-CN": "中和正印格：印与日干调和",
            "zh-TW": "中和正印格：印與日干調和",
        },
        outcome={
            "ko": "官으로 인을 생하고 食傷으로 재능을 발휘하면 상격",
            "en": "Officer supports Resource, Output expresses talent - superior structure",
            "ja": "官で印を生じ食傷で才能を発揮すれば上格",
            "zh-CN": "官生印，食伤泄秀展才华则为上格",
            "zh-TW": "官生印，食傷洩秀展才華則為上格",
        },
        original="正印格，官印相生，食傷泄秀，文章蓋世。"
    ),
}


# =============================================================================
# 偏印格/梟神格 (편인격) - Indirect Resource Structure
# =============================================================================
PIANYINGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="편인격", formation_chinese="偏印格(梟神格)",
        day_master_strength="strong",
        primary_god="財", secondary_god="食傷",
        xi_shen=["財星", "傷官"],
        ji_shen=["偏印", "比劫"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 편인격: 효신(梟神)이 강하여 고집 센 성격",
            "en": "Strong body Indirect Resource: Strong Owl God creates stubborn character",
            "ja": "身強の偏印格：梟神が強く頑固な性格",
            "zh-CN": "身强偏印格：枭神强旺性格固执",
            "zh-TW": "身強偏印格：梟神強旺性格固執",
        },
        outcome={
            "ko": "財로 효신을 제어하면 재물과 명예를 겸함",
            "en": "Wealth controls Owl God - combines wealth and honor",
            "ja": "財で梟神を制すれば財物と名誉を兼ねる",
            "zh-CN": "财制枭神则财名双收",
            "zh-TW": "財制梟神則財名雙收",
        },
        original="偏印格，身旺梟重，喜財星制梟，傷官泄秀。"
    ),
    "weak": YongsinEntry(
        formation="편인격", formation_chinese="偏印格(梟神格)",
        day_master_strength="weak",
        primary_god="七殺", secondary_god="偏印",
        xi_shen=["七殺", "偏印"],
        ji_shen=["財星", "食神"],
        principle="통관",
        condition={
            "ko": "신약(身弱)한 편인격: 효신이 칠살을 화(化)하여 보호",
            "en": "Weak body Indirect Resource: Owl God transforms Seven Killings for protection",
            "ja": "身弱の偏印格：梟神が七殺を化して保護",
            "zh-CN": "身弱偏印格：枭神化杀护身",
            "zh-TW": "身弱偏印格：梟神化殺護身",
        },
        outcome={
            "ko": "殺印相生하면 권력과 특수 재능을 겸비",
            "en": "Killing-Resource mutual support combines power with special talents",
            "ja": "殺印相生すれば権力と特殊才能を兼備",
            "zh-CN": "杀印相生则权力与特殊才能兼备",
            "zh-TW": "殺印相生則權力與特殊才能兼備",
        },
        original="偏印格，身弱殺旺，喜梟神化殺，殺印相生。"
    ),
    "balanced": YongsinEntry(
        formation="편인격", formation_chinese="偏印格(梟神格)",
        day_master_strength="balanced",
        primary_god="財", secondary_god="七殺",
        xi_shen=["財星", "七殺"],
        ji_shen=["食神"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 편인격: 식신이 있으면 효신탈식(梟神奪食) 주의",
            "en": "Balanced Indirect Resource: Watch for Owl stealing food if Eating God present",
            "ja": "中和の偏印格：食神があれば梟神奪食に注意",
            "zh-CN": "中和偏印格：有食神需防枭神夺食",
            "zh-TW": "中和偏印格：有食神需防梟神奪食",
        },
        outcome={
            "ko": "食神이 없거나 財로 효신을 제어하면 독창적 재능 발휘",
            "en": "No Eating God or Wealth controls Owl - expresses original talents",
            "ja": "食神がないか財で梟神を制すれば独創的才能を発揮",
            "zh-CN": "无食神或财制枭则发挥独创才能",
            "zh-TW": "無食神或財制梟則發揮獨創才能",
        },
        original="偏印格，忌見食神，梟神奪食。宜財星制梟。"
    ),
}


# =============================================================================
# 正財格 (정재격) - Direct Wealth Structure
# =============================================================================
ZHENGCAIGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="정재격", formation_chinese="正財格",
        day_master_strength="strong",
        primary_god="財", secondary_god="官",
        xi_shen=["財星", "官星"],
        ji_shen=["比劫", "印星"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 정재격: 일간이 강하여 재성을 감당 가능",
            "en": "Strong body Direct Wealth: Day Master strong enough to handle Wealth",
            "ja": "身強の正財格：日干が強く財星を担える",
            "zh-CN": "身强正财格：日干强可担财",
            "zh-TW": "身強正財格：日干強可擔財",
        },
        outcome={
            "ko": "財旺生官하여 재물과 지위를 겸함",
            "en": "Strong Wealth supports Officer - combines wealth and position",
            "ja": "財旺生官して財物と地位を兼ねる",
            "zh-CN": "财旺生官，财位双收",
            "zh-TW": "財旺生官，財位雙收",
        },
        original="正財格，身旺任財，財旺生官，富而且貴。"
    ),
    "weak": YongsinEntry(
        formation="정재격", formation_chinese="正財格",
        day_master_strength="weak",
        primary_god="比劫", secondary_god="印",
        xi_shen=["比劫", "印星"],
        ji_shen=["財星", "官殺"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 정재격: 재성이 무거워 일간이 감당 불가",
            "en": "Weak body Direct Wealth: Too much Wealth overwhelms Day Master",
            "ja": "身弱の正財格：財が重く日干が担えない",
            "zh-CN": "身弱正财格：财重身弱不能担",
            "zh-TW": "身弱正財格：財重身弱不能擔",
        },
        outcome={
            "ko": "比劫으로 신을 도우면 재물을 감당할 수 있음",
            "en": "Companions support Day Master to handle Wealth",
            "ja": "比劫で身を助ければ財を担える",
            "zh-CN": "比劫帮身则能担财",
            "zh-TW": "比劫幫身則能擔財",
        },
        original="正財格，身弱財重，喜比劫幫身，印星護身。"
    ),
    "balanced": YongsinEntry(
        formation="정재격", formation_chinese="正財格",
        day_master_strength="balanced",
        primary_god="食傷", secondary_god="官",
        xi_shen=["食傷", "官星"],
        ji_shen=["比劫", "七殺"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 정재격: 일간과 재성이 균형",
            "en": "Balanced Direct Wealth: Day Master and Wealth in harmony",
            "ja": "中和の正財格：日干と財星が均衡",
            "zh-CN": "中和正财格：日干与财星平衡",
            "zh-TW": "中和正財格：日干與財星平衡",
        },
        outcome={
            "ko": "食傷生財하고 財生官하면 부귀를 겸함",
            "en": "Output produces Wealth, Wealth supports Officer - wealth and nobility",
            "ja": "食傷生財し財生官すれば富貴を兼ねる",
            "zh-CN": "食伤生财，财生官，富贵双全",
            "zh-TW": "食傷生財，財生官，富貴雙全",
        },
        original="正財格，食傷生財，財旺生官，名利雙收。忌比劫分財。"
    ),
}


# =============================================================================
# 偏財格 (편재격) - Indirect Wealth Structure
# =============================================================================
PIANCAIGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="편재격", formation_chinese="偏財格",
        day_master_strength="strong",
        primary_god="財", secondary_god="官殺",
        xi_shen=["偏財", "官殺"],
        ji_shen=["比劫", "印星"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 편재격: 일간이 강하여 큰 재물을 감당",
            "en": "Strong body Indirect Wealth: Day Master strong for large wealth",
            "ja": "身強の偏財格：日干が強く大きな財を担える",
            "zh-CN": "身强偏财格：日干强可担大财",
            "zh-TW": "身強偏財格：日干強可擔大財",
        },
        outcome={
            "ko": "偏財가 旺하고 官殺을 생하면 사업 대성",
            "en": "Strong Indirect Wealth supporting Officer/Killings - great business success",
            "ja": "偏財が旺し官殺を生じれば事業大成",
            "zh-CN": "偏财旺生官杀，事业大成",
            "zh-TW": "偏財旺生官殺，事業大成",
        },
        original="偏財格，身旺財旺，喜財生官殺，大富大貴。"
    ),
    "weak": YongsinEntry(
        formation="편재격", formation_chinese="偏財格",
        day_master_strength="weak",
        primary_god="比劫", secondary_god="印",
        xi_shen=["比劫", "印星"],
        ji_shen=["財星", "官殺"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 편재격: 재다신약(財多身弱)으로 재물에 시달림",
            "en": "Weak body Indirect Wealth: Too much wealth, Day Master struggles",
            "ja": "身弱の偏財格：財多身弱で財に苦しむ",
            "zh-CN": "身弱偏财格：财多身弱为财所困",
            "zh-TW": "身弱偏財格：財多身弱為財所困",
        },
        outcome={
            "ko": "比劫으로 분재(分財)하면 재물을 다룰 수 있음",
            "en": "Companions help share and manage wealth",
            "ja": "比劫で分財すれば財を扱える",
            "zh-CN": "比劫分财则能理财",
            "zh-TW": "比劫分財則能理財",
        },
        original="偏財格，身弱財旺，喜比劫分財，印星護身。"
    ),
    "balanced": YongsinEntry(
        formation="편재격", formation_chinese="偏財格",
        day_master_strength="balanced",
        primary_god="食傷", secondary_god="官",
        xi_shen=["食傷", "官星"],
        ji_shen=["比劫", "七殺"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 편재격: 재성과 일간이 조화",
            "en": "Balanced Indirect Wealth: Wealth and Day Master in harmony",
            "ja": "中和の偏財格：財星と日干が調和",
            "zh-CN": "中和偏财格：财与日干调和",
            "zh-TW": "中和偏財格：財與日干調和",
        },
        outcome={
            "ko": "食傷生財하면 사업수완이 뛰어나 대재(大財)를 모음",
            "en": "Output produces Wealth - excellent business skills, great fortune",
            "ja": "食傷生財すれば商才に優れ大財を成す",
            "zh-CN": "食伤生财则商才出众，财源广进",
            "zh-TW": "食傷生財則商才出眾，財源廣進",
        },
        original="偏財格，食傷生財，商才出眾，富甲一方。"
    ),
}


# =============================================================================
# 食神格 (식신격) - Eating God Structure
# =============================================================================
SHISHENGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="식신격", formation_chinese="食神格",
        day_master_strength="strong",
        primary_god="食神", secondary_god="財",
        xi_shen=["食神", "財星"],
        ji_shen=["偏印", "比劫"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 식신격: 일간이 강하여 식신으로 설기 가능",
            "en": "Strong body Eating God: Day Master strong, can drain through Eating God",
            "ja": "身強の食神格：日干が強く食神で洩気可能",
            "zh-CN": "身强食神格：日干强可用食神泄秀",
            "zh-TW": "身強食神格：日干強可用食神洩秀",
        },
        outcome={
            "ko": "食神生財하면 재능으로 부를 창출",
            "en": "Eating God produces Wealth - talents create fortune",
            "ja": "食神生財すれば才能で富を創出",
            "zh-CN": "食神生财，才华创富",
            "zh-TW": "食神生財，才華創富",
        },
        original="食神格，身旺食旺，喜食神生財，富而有壽。"
    ),
    "weak": YongsinEntry(
        formation="식신격", formation_chinese="食神格",
        day_master_strength="weak",
        primary_god="印", secondary_god="比劫",
        xi_shen=["印星", "比劫"],
        ji_shen=["財星", "官殺"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 식신격: 식신이 과다하여 신이 허약",
            "en": "Weak body Eating God: Too much Eating God weakens Day Master",
            "ja": "身弱の食神格：食神が過多で身が虚弱",
            "zh-CN": "身弱食神格：食多身弱",
            "zh-TW": "身弱食神格：食多身弱",
        },
        outcome={
            "ko": "印으로 식신을 제어하고 신을 생하면 안정",
            "en": "Resource controls Eating God and supports Day Master - stability",
            "ja": "印で食神を制し身を生じれば安定",
            "zh-CN": "印制食生身则安稳",
            "zh-TW": "印制食生身則安穩",
        },
        original="食神格，身弱食旺，喜印星制食護身。"
    ),
    "balanced": YongsinEntry(
        formation="식신격", formation_chinese="食神格",
        day_master_strength="balanced",
        primary_god="財", secondary_god="食神",
        xi_shen=["財星", "食神"],
        ji_shen=["偏印", "官殺"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 식신격: 효신(偏印)이 없으면 최상",
            "en": "Balanced Eating God: Best without Owl God (Indirect Resource)",
            "ja": "中和の食神格：梟神（偏印）がなければ最上",
            "zh-CN": "中和食神格：无枭神则最佳",
            "zh-TW": "中和食神格：無梟神則最佳",
        },
        outcome={
            "ko": "食神生財하면 의식주가 풍족하고 장수함",
            "en": "Eating God produces Wealth - abundance in life and longevity",
            "ja": "食神生財すれば衣食住が豊かで長寿",
            "zh-CN": "食神生财则衣食无忧，福寿双全",
            "zh-TW": "食神生財則衣食無憂，福壽雙全",
        },
        original="食神格，食神制殺或生財，皆為吉格。忌枭神奪食。"
    ),
}


# =============================================================================
# 傷官格 (상관격) - Hurting Officer Structure
# =============================================================================
SHANGGUANGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="상관격", formation_chinese="傷官格",
        day_master_strength="strong",
        primary_god="傷官", secondary_god="財",
        xi_shen=["傷官", "財星"],
        ji_shen=["官星", "印星"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 상관격: 일간이 강하여 상관으로 설기",
            "en": "Strong body Hurting Officer: Day Master strong, drains through Hurting Officer",
            "ja": "身強の傷官格：日干が強く傷官で洩気",
            "zh-CN": "身强伤官格：日干强用伤官泄秀",
            "zh-TW": "身強傷官格：日干強用傷官洩秀",
        },
        outcome={
            "ko": "傷官生財하면 창의력으로 대재(大財)를 모음",
            "en": "Hurting Officer produces Wealth - creativity generates great fortune",
            "ja": "傷官生財すれば創造力で大財を成す",
            "zh-CN": "伤官生财则创意生财，富甲天下",
            "zh-TW": "傷官生財則創意生財，富甲天下",
        },
        original="傷官格，身旺傷旺，喜傷官生財，富貴雙全。"
    ),
    "weak": YongsinEntry(
        formation="상관격", formation_chinese="傷官格",
        day_master_strength="weak",
        primary_god="印", secondary_god="比劫",
        xi_shen=["印星", "比劫"],
        ji_shen=["財星", "傷官"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 상관격: 상관이 과다하여 신이 손상",
            "en": "Weak body Hurting Officer: Too much Hurting Officer damages Day Master",
            "ja": "身弱の傷官格：傷官が過多で身が損傷",
            "zh-CN": "身弱伤官格：伤多身弱",
            "zh-TW": "身弱傷官格：傷多身弱",
        },
        outcome={
            "ko": "印으로 상관을 제어하면 재능이 빛남 (傷官佩印)",
            "en": "Resource controls Hurting Officer - talents shine (Hurting Officer wearing Resource)",
            "ja": "印で傷官を制すれば才能が輝く（傷官佩印）",
            "zh-CN": "印制伤官则才华绽放（伤官佩印）",
            "zh-TW": "印制傷官則才華綻放（傷官佩印）",
        },
        original="傷官格，身弱傷旺，喜印星制傷護身，傷官佩印，貴氣逼人。"
    ),
    "balanced": YongsinEntry(
        formation="상관격", formation_chinese="傷官格",
        day_master_strength="balanced",
        primary_god="財", secondary_god="印",
        xi_shen=["財星", "印星"],
        ji_shen=["正官"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 상관격: 傷官見官 반드시 회피",
            "en": "Balanced Hurting Officer: Must avoid Hurting Officer seeing Official",
            "ja": "中和の傷官格：傷官見官は必ず回避",
            "zh-CN": "中和伤官格：必须避免伤官见官",
            "zh-TW": "中和傷官格：必須避免傷官見官",
        },
        outcome={
            "ko": "傷官生財 또는 傷官佩印하면 귀격",
            "en": "Hurting Officer produces Wealth or wears Resource - noble structure",
            "ja": "傷官生財または傷官佩印すれば貴格",
            "zh-CN": "伤官生财或伤官佩印则成贵格",
            "zh-TW": "傷官生財或傷官佩印則成貴格",
        },
        original="傷官格，傷官見官，為禍百端。喜傷官生財或傷官佩印。"
    ),
}


# =============================================================================
# 建禄格 (건록격) - Monthly Salary Structure
# =============================================================================
JIANLUGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="건록격", formation_chinese="建禄格",
        day_master_strength="strong",
        primary_god="財", secondary_god="官殺",
        xi_shen=["財星", "官殺"],
        ji_shen=["印星", "比劫"],
        principle="억부",
        condition={
            "ko": "신강(身强)한 건록격: 월지가 일간의 녹(祿)으로 신이 강함",
            "en": "Strong body Monthly Salary: Month branch is Day Master's Salary, body very strong",
            "ja": "身強の建禄格：月支が日干の禄で身が強い",
            "zh-CN": "身强建禄格：月支为日干之禄，身极强",
            "zh-TW": "身強建祿格：月支為日干之祿，身極強",
        },
        outcome={
            "ko": "財官이 투출하면 부귀를 겸함",
            "en": "Wealth and Officer appearing brings both riches and nobility",
            "ja": "財官が透出すれば富貴を兼ねる",
            "zh-CN": "财官透出则富贵双全",
            "zh-TW": "財官透出則富貴雙全",
        },
        original="建禄格，月令建禄，身極旺。喜財官透出，忌印比成群。"
    ),
    "weak": YongsinEntry(
        formation="건록격", formation_chinese="建禄格",
        day_master_strength="weak",
        primary_god="印", secondary_god="比劫",
        xi_shen=["印星", "比劫"],
        ji_shen=["財星", "官殺"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 건록격: 드문 경우로 관살이 과다",
            "en": "Weak body Monthly Salary: Rare case with too many Officers/Killings",
            "ja": "身弱の建禄格：稀な場合で官殺が過多",
            "zh-CN": "身弱建禄格：罕见情况，官杀过多",
            "zh-TW": "身弱建祿格：罕見情況，官殺過多",
        },
        outcome={
            "ko": "印比로 신을 보호하면 안정",
            "en": "Resource and Companions protect Day Master - stability",
            "ja": "印比で身を保護すれば安定",
            "zh-CN": "印比护身则安稳",
            "zh-TW": "印比護身則安穩",
        },
        original="建禄格，若官殺重重，宜印比護身。"
    ),
    "balanced": YongsinEntry(
        formation="건록격", formation_chinese="建禄格",
        day_master_strength="balanced",
        primary_god="官", secondary_god="財",
        xi_shen=["官星", "財星"],
        ji_shen=["傷官", "劫財"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 건록격: 건록 자체는 용신이 아님, 별도 용신 필요",
            "en": "Balanced Monthly Salary: Salary itself not useful god, needs separate one",
            "ja": "中和の建禄格：建禄自体は用神ではなく、別途用神が必要",
            "zh-CN": "中和建禄格：建禄本身非用神，需另取用神",
            "zh-TW": "中和建祿格：建祿本身非用神，需另取用神",
        },
        outcome={
            "ko": "官殺을 용신으로 삼고 財로 생조하면 귀격",
            "en": "Officer/Killings as useful god with Wealth support - noble structure",
            "ja": "官殺を用神とし財で生助すれば貴格",
            "zh-CN": "以官杀为用神，财来生官则成贵格",
            "zh-TW": "以官殺為用神，財來生官則成貴格",
        },
        original="建禄格，本身非用神，須別取用神。喜官殺財星透出。"
    ),
}


# =============================================================================
# 陽刃格 (양인격) - Yang Blade Structure
# =============================================================================
YANGRENGE: Dict[str, YongsinEntry] = {
    "strong": YongsinEntry(
        formation="양인격", formation_chinese="陽刃格(羊刃格)",
        day_master_strength="strong",
        primary_god="官殺", secondary_god="財",
        xi_shen=["官殺", "財星"],
        ji_shen=["印星", "比劫"],
        principle="병약",
        condition={
            "ko": "신강(身强)한 양인격: 양인(羊刃)이 있어 신이 극강",
            "en": "Strong body Yang Blade: Yang Blade makes body extremely strong",
            "ja": "身強の陽刃格：羊刃があり身が極強",
            "zh-CN": "身强阳刃格：羊刃使身极强",
            "zh-TW": "身強陽刃格：羊刃使身極強",
        },
        outcome={
            "ko": "官殺로 양인을 제어하면 권력과 위엄을 얻음 (殺刃格)",
            "en": "Officer/Killings controls Yang Blade - power and authority (Killing-Blade)",
            "ja": "官殺で羊刃を制すれば権力と威厳を得る（殺刃格）",
            "zh-CN": "官杀制刃得权势威严（杀刃格）",
            "zh-TW": "官殺制刃得權勢威嚴（殺刃格）",
        },
        original="陽刃格，刃旺身強，專喜官殺混透，殺刃格貴不可言。"
    ),
    "weak": YongsinEntry(
        formation="양인격", formation_chinese="陽刃格(羊刃格)",
        day_master_strength="weak",
        primary_god="比劫", secondary_god="印",
        xi_shen=["比劫", "印星"],
        ji_shen=["財星", "食傷"],
        principle="억부",
        condition={
            "ko": "신약(身弱)한 양인격: 드문 경우로 관살이 양인을 극함",
            "en": "Weak body Yang Blade: Rare case where Officers/Killings overcome Blade",
            "ja": "身弱の陽刃格：稀な場合で官殺が羊刃を剋する",
            "zh-CN": "身弱阳刃格：罕见情况，官杀克刃",
            "zh-TW": "身弱陽刃格：罕見情況，官殺剋刃",
        },
        outcome={
            "ko": "양인 자체가 신을 돕는 역할",
            "en": "Yang Blade itself helps support Day Master",
            "ja": "羊刃自体が身を助ける役割",
            "zh-CN": "羊刃本身帮扶日干",
            "zh-TW": "羊刃本身幫扶日干",
        },
        original="陽刃格，若官殺克刃，刃可助身。"
    ),
    "balanced": YongsinEntry(
        formation="양인격", formation_chinese="陽刃格(羊刃格)",
        day_master_strength="balanced",
        primary_god="七殺", secondary_god="正官",
        xi_shen=["七殺", "正官"],
        ji_shen=["食傷", "財星"],
        principle="병약",
        condition={
            "ko": "중화(中和)된 양인격: 殺刃 균형이 핵심",
            "en": "Balanced Yang Blade: Killing-Blade balance is key",
            "ja": "中和の陽刃格：殺刃の均衡が核心",
            "zh-CN": "中和阳刃格：杀刃平衡为关键",
            "zh-TW": "中和陽刃格：殺刃平衡為關鍵",
        },
        outcome={
            "ko": "殺刃이 균형을 이루면 장군의 위엄",
            "en": "Killing-Blade in balance - authority of a general",
            "ja": "殺刃が均衡を成せば将軍の威厳",
            "zh-CN": "杀刃平衡则有将帅之威",
            "zh-TW": "殺刃平衡則有將帥之威",
        },
        original="陽刃格，殺刃兩停，威震邊疆。"
    ),
}


# =============================================================================
# 통합 매트릭스
# =============================================================================
YONGSIN_MATRIX: Dict[str, Dict[str, YongsinEntry]] = {
    "정관격": ZHENGGUANGE,
    "편관격": PIANGUANGE,
    "정인격": ZHENGYINGE,
    "편인격": PIANYINGE,
    "정재격": ZHENGCAIGE,
    "편재격": PIANCAIGE,
    "식신격": SHISHENGE,
    "상관격": SHANGGUANGE,
    "건록격": JIANLUGE,
    "양인격": YANGRENGE,
}

# 격국 한자명 매핑
FORMATION_NAMES: Dict[str, Dict[str, str]] = {
    "정관격": {
        "ko": "정관격(正官格)", "en": "Direct Officer Structure",
        "ja": "正官格", "zh-CN": "正官格", "zh-TW": "正官格"
    },
    "편관격": {
        "ko": "편관격(偏官格/七殺格)", "en": "Seven Killings Structure",
        "ja": "偏官格（七殺格）", "zh-CN": "偏官格（七杀格）", "zh-TW": "偏官格（七殺格）"
    },
    "정인격": {
        "ko": "정인격(正印格)", "en": "Direct Resource Structure",
        "ja": "正印格", "zh-CN": "正印格", "zh-TW": "正印格"
    },
    "편인격": {
        "ko": "편인격(偏印格/梟神格)", "en": "Indirect Resource Structure",
        "ja": "偏印格（梟神格）", "zh-CN": "偏印格（枭神格）", "zh-TW": "偏印格（梟神格）"
    },
    "정재격": {
        "ko": "정재격(正財格)", "en": "Direct Wealth Structure",
        "ja": "正財格", "zh-CN": "正财格", "zh-TW": "正財格"
    },
    "편재격": {
        "ko": "편재격(偏財格)", "en": "Indirect Wealth Structure",
        "ja": "偏財格", "zh-CN": "偏财格", "zh-TW": "偏財格"
    },
    "식신격": {
        "ko": "식신격(食神格)", "en": "Eating God Structure",
        "ja": "食神格", "zh-CN": "食神格", "zh-TW": "食神格"
    },
    "상관격": {
        "ko": "상관격(傷官格)", "en": "Hurting Officer Structure",
        "ja": "傷官格", "zh-CN": "伤官格", "zh-TW": "傷官格"
    },
    "건록격": {
        "ko": "건록격(建禄格)", "en": "Monthly Salary Structure",
        "ja": "建禄格", "zh-CN": "建禄格", "zh-TW": "建祿格"
    },
    "양인격": {
        "ko": "양인격(陽刃格/羊刃格)", "en": "Yang Blade Structure",
        "ja": "陽刃格（羊刃格）", "zh-CN": "阳刃格（羊刃格）", "zh-TW": "陽刃格（羊刃格）"
    },
}


# =============================================================================
# 헬퍼 함수
# =============================================================================
def get_yongsin_entry(
    formation: str,
    day_master_strength: str = "balanced"
) -> Optional[YongsinEntry]:
    """
    격국과 일간 강약으로 용신 엔트리 조회

    Args:
        formation: 격국명 (정관격, 편관격, ...)
        day_master_strength: 일간 강약 (strong, weak, balanced)

    Returns:
        YongsinEntry 또는 None
    """
    formation_data = YONGSIN_MATRIX.get(formation)
    if not formation_data:
        return None
    return formation_data.get(day_master_strength)


def build_yongsin_prompt(
    formation: str,
    day_master_strength: str = "balanced",
    language: LanguageType = 'ko'
) -> str:
    """
    용신 분석 프롬프트 생성

    Args:
        formation: 격국명
        day_master_strength: 일간 강약
        language: 언어 코드

    Returns:
        포맷팅된 프롬프트 문자열
    """
    entry = get_yongsin_entry(formation, day_master_strength)
    if not entry:
        return f"[용신 정보 없음: {formation} / {day_master_strength}]"

    # 섹션 타이틀
    titles = {
        "ko": "## 용신(用神) 분석",
        "en": "## Useful God Analysis",
        "ja": "## 用神分析",
        "zh-CN": "## 用神分析",
        "zh-TW": "## 用神分析",
    }

    # 라벨
    labels = {
        "ko": {
            "formation": "격국",
            "strength": "일간 강약",
            "principle": "적용 원칙",
            "primary": "1순위 용신",
            "secondary": "2순위 용신",
            "xi_shen": "희신(喜神)",
            "ji_shen": "기신(忌神)",
            "condition": "조건",
            "outcome": "효과",
            "original": "원문",
        },
        "en": {
            "formation": "Structure",
            "strength": "Day Master Strength",
            "principle": "Principle Applied",
            "primary": "Primary Useful God",
            "secondary": "Secondary Useful God",
            "xi_shen": "Favorable Gods",
            "ji_shen": "Unfavorable Gods",
            "condition": "Condition",
            "outcome": "Outcome",
            "original": "Original Text",
        },
        "ja": {
            "formation": "格局",
            "strength": "日干強弱",
            "principle": "適用原則",
            "primary": "第一用神",
            "secondary": "第二用神",
            "xi_shen": "喜神",
            "ji_shen": "忌神",
            "condition": "条件",
            "outcome": "効果",
            "original": "原文",
        },
        "zh-CN": {
            "formation": "格局",
            "strength": "日干强弱",
            "principle": "适用原则",
            "primary": "第一用神",
            "secondary": "第二用神",
            "xi_shen": "喜神",
            "ji_shen": "忌神",
            "condition": "条件",
            "outcome": "效果",
            "original": "原文",
        },
        "zh-TW": {
            "formation": "格局",
            "strength": "日干強弱",
            "principle": "適用原則",
            "primary": "第一用神",
            "secondary": "第二用神",
            "xi_shen": "喜神",
            "ji_shen": "忌神",
            "condition": "條件",
            "outcome": "效果",
            "original": "原文",
        },
    }

    # 강약 번역
    strength_names = {
        "strong": {"ko": "신강(身强)", "en": "Strong", "ja": "身強", "zh-CN": "身强", "zh-TW": "身強"},
        "weak": {"ko": "신약(身弱)", "en": "Weak", "ja": "身弱", "zh-CN": "身弱", "zh-TW": "身弱"},
        "balanced": {"ko": "중화(中和)", "en": "Balanced", "ja": "中和", "zh-CN": "中和", "zh-TW": "中和"},
    }

    label = labels.get(language, labels['ko'])
    formation_name = FORMATION_NAMES.get(formation, {}).get(language, formation)
    strength_name = strength_names.get(day_master_strength, {}).get(language, day_master_strength)
    principle_desc = YONGSIN_PRINCIPLES.get(entry.principle, {}).get(language, entry.principle)

    lines = [
        titles.get(language, titles['ko']),
        "",
        f"**{label['formation']}**: {formation_name}",
        f"**{label['strength']}**: {strength_name}",
        f"**{label['principle']}**: {entry.principle} - {principle_desc}",
        "",
        f"**{label['primary']}**: {entry.primary_god}",
        f"**{label['secondary']}**: {entry.secondary_god}",
        "",
        f"**{label['xi_shen']}**: {', '.join(entry.xi_shen)}",
        f"**{label['ji_shen']}**: {', '.join(entry.ji_shen)}",
        "",
        f"**{label['condition']}**: {entry.condition.get(language, entry.condition['ko'])}",
        f"**{label['outcome']}**: {entry.outcome.get(language, entry.outcome['ko'])}",
        "",
        f"**{label['original']}**: {entry.original}",
    ]

    return "\n".join(lines)


def get_all_formations() -> List[str]:
    """모든 격국명 목록 반환"""
    return list(YONGSIN_MATRIX.keys())


def get_yongsin_summary(language: LanguageType = 'ko') -> str:
    """
    용신 5원칙 요약 프롬프트 생성

    Args:
        language: 언어 코드

    Returns:
        5원칙 요약 문자열
    """
    titles = {
        "ko": "## 용신(用神) 5원칙 - 子平真詮 제8장",
        "en": "## Five Principles of Useful God - Chapter 8 of Ziping Zhenchuan",
        "ja": "## 用神五原則 - 子平真詮 第八章",
        "zh-CN": "## 用神五原则 - 子平真诠 第八章",
        "zh-TW": "## 用神五原則 - 子平真詮 第八章",
    }

    principle_names = {
        "억부": {"ko": "억부(抑扶)", "en": "Suppression-Support", "ja": "抑扶", "zh-CN": "抑扶", "zh-TW": "抑扶"},
        "조후": {"ko": "조후(調候)", "en": "Climate Regulation", "ja": "調候", "zh-CN": "调候", "zh-TW": "調候"},
        "통관": {"ko": "통관(通關)", "en": "Mediation", "ja": "通関", "zh-CN": "通关", "zh-TW": "通關"},
        "병약": {"ko": "병약(病藥)", "en": "Disease-Medicine", "ja": "病薬", "zh-CN": "病药", "zh-TW": "病藥"},
        "전왕": {"ko": "전왕(專旺)", "en": "Dominant Flow", "ja": "専旺", "zh-CN": "专旺", "zh-TW": "專旺"},
    }

    lines = [titles.get(language, titles['ko']), ""]

    for key, descriptions in YONGSIN_PRINCIPLES.items():
        name = principle_names.get(key, {}).get(language, key)
        desc = descriptions.get(language, descriptions['ko'])
        lines.append(f"### {name}")
        lines.append(desc)
        lines.append("")

    return "\n".join(lines)
