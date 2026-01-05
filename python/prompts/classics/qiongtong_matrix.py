"""
궁통보감(窮通寶鑑) 조후 매트릭스 - 10일간 x 12월 = 120개 조합
명대 여춘태(余春台) 편집 원문 기반

지원 언어: ko, en, ja, zh-CN, zh-TW
"""
from dataclasses import dataclass
from typing import Dict, Optional, Literal

LanguageType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


@dataclass
class JohuEntry:
    """조후 용신 엔트리 (다국어)"""
    day_master: str           # 일간 (甲~癸)
    month: str                # 월지 (寅~丑)
    primary_god: str          # 1순위 용신
    secondary_god: str        # 2순위 용신
    condition: Dict[str, str] # 조건 (5개 언어)
    outcome: Dict[str, str]   # 결과/효과 (5개 언어)
    warning: Dict[str, str]   # 주의사항 (5개 언어)
    original: str             # 원문 발췌 (한자)


# =============================================================================
# 甲木 (갑목) - 큰 나무, 동량지재(棟梁之材)
# 원문: 窮通寶鑑 198-211줄
# =============================================================================
JIA_WOOD: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="甲", month="寅",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "초봄 한기가 남아있어 조후(調候)가 급선무",
            "en": "Early spring still has cold, climate balancing is priority",
            "ja": "初春の寒気が残り、調候が急務",
            "zh-CN": "初春尚有寒气，调候为先",
            "zh-TW": "初春尚有寒氣，調候為先"
        },
        outcome={
            "ko": "丙(병)火로 따뜻하게, 癸(계)水로 뿌리를 자양하면 성장 원만",
            "en": "Bing Fire warms, Gui Water nourishes roots for smooth growth",
            "ja": "丙火で暖め、癸水で根を滋養すれば成長円満",
            "zh-CN": "丙火暖身，癸水滋根，成长顺遂",
            "zh-TW": "丙火暖身，癸水滋根，成長順遂"
        },
        warning={
            "ko": "癸(계)水 없이 丙(병)火만 있으면 건조해져 뿌리가 마름",
            "en": "Only Bing Fire without Gui Water causes dryness and root withering",
            "ja": "癸水なく丙火のみでは乾燥し根が枯れる",
            "zh-CN": "只有丙火无癸水则干燥根枯",
            "zh-TW": "只有丙火無癸水則乾燥根枯"
        },
        original="寅月：調合氣候為要，丙火為主，癸水為佐。"
    ),
    "卯": JohuEntry(
        day_master="甲", month="卯",
        primary_god="庚", secondary_god="戊",
        condition={
            "ko": "양인(羊刃)격으로 목기가 왕성, 칠살(七殺)로 제어 필요",
            "en": "Yang Ren (Blade) formation with strong Wood, needs Seven Killings control",
            "ja": "羊刃格で木気が旺盛、七殺で制御が必要",
            "zh-CN": "羊刃格木气旺盛，需七杀控制",
            "zh-TW": "羊刃格木氣旺盛，需七殺控制"
        },
        outcome={
            "ko": "庚(경)金으로 다듬고 戊(무)己(기)土로 살(殺)을 생조하면 귀격",
            "en": "Geng Metal refines, Wu/Ji Earth supports Killing for noble status",
            "ja": "庚金で整え戊己土で殺を生助すれば貴格",
            "zh-CN": "庚金修剪，戊己土滋杀成贵格",
            "zh-TW": "庚金修剪，戊己土滋殺成貴格"
        },
        warning={
            "ko": "庚(경)金 없으면 丙(병)丁(정)火로 설기(泄氣)하되 제살(制殺)은 불가",
            "en": "Without Geng, use Bing/Ding Fire to release but cannot control Killing",
            "ja": "庚金なければ丙丁火で泄気するが制殺は不可",
            "zh-CN": "无庚用丙丁泄秀，但不能制杀",
            "zh-TW": "無庚用丙丁洩秀，但不能制殺"
        },
        original="卯月：陽刃駕殺，專用庚金，以戊己滋殺為佐。無庚，用丙丁泄秀，不取制殺。"
    ),
    "辰": JohuEntry(
        day_master="甲", month="辰",
        primary_god="丁", secondary_god="壬",
        condition={
            "ko": "늦봄 습토(濕土)에 金이 있으면 상관제살(傷官制殺)",
            "en": "Late spring wet Earth with Metal forms Hurting Officer controls Killing",
            "ja": "晩春の湿土に金があれば傷官制殺",
            "zh-CN": "晚春湿土有金则伤官制杀",
            "zh-TW": "晚春濕土有金則傷官制殺"
        },
        outcome={
            "ko": "丁(정)火로 庚(경)金을 제련하면 동량(棟梁)의 재목이 됨",
            "en": "Ding Fire refines Geng Metal to become pillar timber",
            "ja": "丁火で庚金を制錬すれば棟梁の材となる",
            "zh-CN": "丁火炼庚成栋梁之材",
            "zh-TW": "丁火煉庚成棟梁之材"
        },
        warning={
            "ko": "庚(경)金 없으면 壬(임)水를 쓰되 귀(貴)보다 부(富)에 치우침",
            "en": "Without Geng, use Ren Water but leans toward wealth over nobility",
            "ja": "庚金なければ壬水を用いるが貴より富に偏る",
            "zh-CN": "无庚用壬，富而不贵",
            "zh-TW": "無庚用壬，富而不貴"
        },
        original="辰月：用金必須丁火制之，為傷官制殺。無庚用壬。"
    ),
    "巳": JohuEntry(
        day_master="甲", month="巳",
        primary_god="癸", secondary_god="庚",
        condition={
            "ko": "초여름 화기(火氣) 왕성, 조후(調候)가 급선무",
            "en": "Early summer Fire energy is strong, climate balancing is urgent",
            "ja": "初夏の火気が旺盛、調候が急務",
            "zh-CN": "初夏火气旺盛，调候为急",
            "zh-TW": "初夏火氣旺盛，調候為急"
        },
        outcome={
            "ko": "癸(계)水로 화기를 식히고, 원국이 윤택하면 庚丁(정화) 병용",
            "en": "Gui Water cools Fire, if chart is moist use Geng and Ding together",
            "ja": "癸水で火気を冷まし、原局が潤沢なら庚丁併用",
            "zh-CN": "癸水降火，原局润泽则庚丁并用",
            "zh-TW": "癸水降火，原局潤澤則庚丁並用"
        },
        warning={
            "ko": "癸(계)水 없으면 목(木)이 타들어가 고갈됨",
            "en": "Without Gui Water, Wood burns out and exhausts",
            "ja": "癸水なければ木が燃え尽き枯渇する",
            "zh-CN": "无癸水则木焦枯",
            "zh-TW": "無癸水則木焦枯"
        },
        original="巳月：調合氣候，癸水為主。原局氣潤，庚丁為用。"
    ),
    "午": JohuEntry(
        day_master="甲", month="午",
        primary_god="癸", secondary_god="丁",
        condition={
            "ko": "한여름 목성허초(木性虛焦), 수분 공급이 급함",
            "en": "Midsummer Wood nature becomes scorched and hollow, moisture is urgent",
            "ja": "真夏の木性虚焦、水分補給が急務",
            "zh-CN": "盛夏木性虚焦，需急补水分",
            "zh-TW": "盛夏木性虛焦，需急補水分"
        },
        outcome={
            "ko": "癸(계)水가 있으면 뿌리가 살아나 발전 가능",
            "en": "With Gui Water, roots revive and development is possible",
            "ja": "癸水があれば根が蘇り発展可能",
            "zh-CN": "有癸水则根得活，可发展",
            "zh-TW": "有癸水則根得活，可發展"
        },
        warning={
            "ko": "癸(계)水 없으면 丁(정)火를 쓰되 북방 수운(水運)이 와야 발복",
            "en": "Without Gui, use Ding but needs northern Water luck for fortune",
            "ja": "癸水なければ丁火を用いるが北方水運が来て発福",
            "zh-CN": "无癸用丁，须行北方水运方发",
            "zh-TW": "無癸用丁，須行北方水運方發"
        },
        original="午月：木性虛焦，癸為主要。無癸用丁，亦宜運行北地。"
    ),
    "未": JohuEntry(
        day_master="甲", month="未",
        primary_god="癸", secondary_god="庚",
        condition={
            "ko": "상반월은 午(오)月과 같이 癸(계)水, 하반월은 金氣 점차 생성",
            "en": "First half like Wu month needs Gui, second half Metal Qi gradually forms",
            "ja": "上半月は午月同様癸水、下半月は金気が徐々に生成",
            "zh-CN": "上半月同午月用癸，下半月金气渐生",
            "zh-TW": "上半月同午月用癸，下半月金氣漸生"
        },
        outcome={
            "ko": "시기에 맞춰 癸(계)水 또는 庚丁(정화)을 쓰면 발전",
            "en": "Using Gui or Geng/Ding according to timing brings development",
            "ja": "時期に合わせ癸水または庚丁を用いれば発展",
            "zh-CN": "按时节用癸或庚丁则发展",
            "zh-TW": "按時節用癸或庚丁則發展"
        },
        warning={
            "ko": "토왕(土旺)한 경우 甲(갑)木으로 토를 제어해야 함",
            "en": "If Earth is strong, need Jia Wood to control Earth",
            "ja": "土旺の場合甲木で土を制御する必要",
            "zh-CN": "土旺需甲木制土",
            "zh-TW": "土旺需甲木制土"
        },
        original="未月：上半月同五月用癸，下半月用庚丁。"
    ),
    "申": JohuEntry(
        day_master="甲", month="申",
        primary_god="庚", secondary_god="丁",
        condition={
            "ko": "초가을 칠살(七殺) 당령, 상관제살(傷官制殺)이 관건",
            "en": "Early autumn Seven Killings in command, Hurting Officer controls Killing is key",
            "ja": "初秋七殺当令、傷官制殺が鍵",
            "zh-CN": "初秋七杀当令，伤官制杀为关键",
            "zh-TW": "初秋七殺當令，傷官制殺為關鍵"
        },
        outcome={
            "ko": "庚(경)金을 丁(정)火로 제련하면 귀격(貴格) 성립",
            "en": "Refining Geng Metal with Ding Fire establishes noble status",
            "ja": "庚金を丁火で制錬すれば貴格成立",
            "zh-CN": "丁火制庚成贵格",
            "zh-TW": "丁火制庚成貴格"
        },
        warning={
            "ko": "丁(정)火 없으면 壬(임)水를 쓰되 부(富)는 있어도 귀(貴)는 부족",
            "en": "Without Ding, use Ren Water but wealthy without noble status",
            "ja": "丁火なければ壬水を用いるが富あれど貴は不足",
            "zh-CN": "无丁用壬，富而不贵",
            "zh-TW": "無丁用壬，富而不貴"
        },
        original="申月：先用庚，再取丁，為傷官制殺，無丁用壬，富而不貴。"
    ),
    "酉": JohuEntry(
        day_master="甲", month="酉",
        primary_god="丁", secondary_god="丙",
        condition={
            "ko": "가을 금왕(金旺)하여 목이 극(剋)받음, 丁(정)火로 제살(制殺)",
            "en": "Autumn Metal is strong attacking Wood, Ding Fire controls Killing",
            "ja": "秋の金旺で木が剋される、丁火で制殺",
            "zh-CN": "秋季金旺克木，用丁火制杀",
            "zh-TW": "秋季金旺剋木，用丁火制殺"
        },
        outcome={
            "ko": "丁(정)火로 제살하고 丙(병)火로 조후하면 귀현(貴顯)",
            "en": "Ding controls Killing, Bing balances climate for honor and prominence",
            "ja": "丁火で制殺し丙火で調候すれば貴顕",
            "zh-CN": "丁火制杀丙火调候则贵显",
            "zh-TW": "丁火制殺丙火調候則貴顯"
        },
        warning={
            "ko": "丙(병)丁(정) 모두 없으면 금한(金寒)하여 발전 어려움",
            "en": "Without both Bing and Ding, Metal becomes cold and development is difficult",
            "ja": "丙丁共になければ金寒で発展困難",
            "zh-CN": "无丙丁则金寒难发",
            "zh-TW": "無丙丁則金寒難發"
        },
        original="酉月：用丁制殺，用丙調候，丁丙並用為佐。"
    ),
    "戌": JohuEntry(
        day_master="甲", month="戌",
        primary_god="庚", secondary_god="丁",
        condition={
            "ko": "가을 끝자락 토왕(土旺)과 금기(金氣) 공존, 상황에 따라 용신 선택",
            "en": "Late autumn with strong Earth and Metal coexisting, choose god by situation",
            "ja": "晩秋の土旺と金気が共存、状況に応じ用神選択",
            "zh-CN": "晚秋土旺金气并存，因情况选用神",
            "zh-TW": "晚秋土旺金氣並存，因情況選用神"
        },
        outcome={
            "ko": "土旺하면 甲(갑)木으로, 木旺하면 庚(경)金으로 균형 조절",
            "en": "If Earth strong use Jia Wood, if Wood strong use Geng Metal for balance",
            "ja": "土旺なら甲木、木旺なら庚金でバランス調整",
            "zh-CN": "土旺用甲木，木旺用庚金调整平衡",
            "zh-TW": "土旺用甲木，木旺用庚金調整平衡"
        },
        warning={
            "ko": "丁壬(임)癸(계)가 보조로 있어야 조후가 맞음",
            "en": "Need Ding/Ren/Gui as support for proper climate balance",
            "ja": "丁壬癸が補助としてあれば調候が合う",
            "zh-CN": "需丁壬癸辅助方合调候",
            "zh-TW": "需丁壬癸輔助方合調候"
        },
        original="戌月：土旺者用甲木，木旺者用庚金，丁壬癸為佐。"
    ),
    "亥": JohuEntry(
        day_master="甲", month="亥",
        primary_god="庚", secondary_god="丁",
        condition={
            "ko": "초겨울 水旺하고 木은 장생(長生), 庚(경)金으로 다듬어야 함",
            "en": "Early winter Water is strong, Wood at Long Life stage, needs Geng Metal refinement",
            "ja": "初冬水旺で木は長生、庚金で整える必要",
            "zh-CN": "初冬水旺木长生，需庚金修整",
            "zh-TW": "初冬水旺木長生，需庚金修整"
        },
        outcome={
            "ko": "庚(경)金으로 다듬고 丁(정)火로 제련, 丙(병)火로 조후하면 귀격",
            "en": "Geng refines, Ding forges, Bing balances climate for noble status",
            "ja": "庚金で整え丁火で制錬、丙火で調候すれば貴格",
            "zh-CN": "庚金修剪丁火炼庚丙火调候成贵格",
            "zh-TW": "庚金修剪丁火煉庚丙火調候成貴格"
        },
        warning={
            "ko": "水가 너무 많으면 戊(무)土로 제방을 쌓아야 함",
            "en": "If Water is too much, need Wu Earth to build dam",
            "ja": "水が多すぎれば戊土で堤防を築く必要",
            "zh-CN": "水多需戊土筑堤",
            "zh-TW": "水多需戊土築堤"
        },
        original="亥月：用庚金，取丁火制之，丙火調候。水旺用戊。"
    ),
    "子": JohuEntry(
        day_master="甲", month="子",
        primary_god="丁", secondary_god="庚",
        condition={
            "ko": "한겨울 목성생한(木性生寒), 丁(정)火로 먼저 따뜻하게",
            "en": "Midwinter Wood nature turns cold, Ding Fire warms first",
            "ja": "真冬の木性生寒、丁火で先に暖める",
            "zh-CN": "隆冬木性生寒，先用丁火温暖",
            "zh-TW": "隆冬木性生寒，先用丁火溫暖"
        },
        outcome={
            "ko": "丁先庚後, 丙(병)火가 보조하고 巳寅이 지지에 있으면 귀격",
            "en": "Ding first then Geng, Bing supports, with Si/Yin in branches means noble status",
            "ja": "丁先庚後、丙火が補助し巳寅が地支にあれば貴格",
            "zh-CN": "丁先庚后，丙火为佐，支见巳寅则贵格",
            "zh-TW": "丁先庚後，丙火為佐，支見巳寅則貴格"
        },
        warning={
            "ko": "巳寅 없이 丁(정)火만 있으면 따뜻하나 발복이 작음",
            "en": "Only Ding without Si/Yin is warm but fortune is limited",
            "ja": "巳寅なく丁火のみでは暖かいが発福が小さい",
            "zh-CN": "无巳寅只有丁火虽暖但发福小",
            "zh-TW": "無巳寅只有丁火雖暖但發福小"
        },
        original="子月：木性生寒，丁先庚後，丙火為佐，必須支見巳寅，方為貴格。"
    ),
    "丑": JohuEntry(
        day_master="甲", month="丑",
        primary_god="丁", secondary_god="庚",
        condition={
            "ko": "겨울 끝자락 한기가 극심, 丁(정)火가 반드시 필요",
            "en": "Late winter cold is extreme, Ding Fire is absolutely necessary",
            "ja": "冬の終わり寒気が極限、丁火が必須",
            "zh-CN": "冬末寒气极盛，丁火必不可少",
            "zh-TW": "冬末寒氣極盛，丁火必不可少"
        },
        outcome={
            "ko": "丁(정)火가 巳寅에 통근하고 甲(갑)木이 돕고 庚(경)金이 갑목을 쪼개 丁(정)火 인출",
            "en": "Ding rooted in Si/Yin, Jia assists, Geng splits Jia to draw out Ding",
            "ja": "丁火が巳寅に通根し甲木が助け庚金が甲を劈き丁火を引き出す",
            "zh-CN": "丁火通根巳寅，甲木为助，庚劈甲引丁",
            "zh-TW": "丁火通根巳寅，甲木為助，庚劈甲引丁"
        },
        warning={
            "ko": "丁(정)火 없으면 한목(寒木)으로 발전이 막힘",
            "en": "Without Ding Fire, cold Wood blocks development",
            "ja": "丁火なければ寒木で発展が阻まれる",
            "zh-CN": "无丁火则寒木难发",
            "zh-TW": "無丁火則寒木難發"
        },
        original="醜月：丁火必不可少，通根巳寅，甲木為助，用庚劈甲引丁。"
    ),
}


# =============================================================================
# 乙木 (을목) - 풀, 화초, 등나무
# 원문: 窮通寶鑑 378-391줄
# =============================================================================
YI_WOOD: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="乙", month="寅",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "초봄 한기가 남아 丙(병)火로 해한(解寒)이 우선",
            "en": "Early spring still cold, Bing Fire to resolve cold is priority",
            "ja": "初春の寒気が残り丙火で解寒が優先",
            "zh-CN": "初春寒气未消，丙火解寒为先",
            "zh-TW": "初春寒氣未消，丙火解寒為先"
        },
        outcome={
            "ko": "丙(병)火로 따뜻하게, 癸(계)水로 적당히 자양하면 성장",
            "en": "Bing Fire warms, moderate Gui Water nourishes for growth",
            "ja": "丙火で暖め、癸水で適度に滋養すれば成長",
            "zh-CN": "丙火温暖，癸水适度滋润则生长",
            "zh-TW": "丙火溫暖，癸水適度滋潤則生長"
        },
        warning={
            "ko": "癸(계)水가 丙(병)火를 제압하면 안됨 (困丙)",
            "en": "Gui Water must not suppress Bing Fire",
            "ja": "癸水が丙火を制圧してはならない（困丙）",
            "zh-CN": "癸水不宜困丙",
            "zh-TW": "癸水不宜困丙"
        },
        original="寅月：取丙火解寒，略取癸水為滋潤，不宜困丙。"
    ),
    "卯": JohuEntry(
        day_master="乙", month="卯",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "봄 乙(을)木이 제왕(帝旺), 癸(계)水로 자양하고 丙(병)火로 설수(泄秀)",
            "en": "Spring Yi Wood at Emperor stage, Gui nourishes, Bing releases talent",
            "ja": "春の乙木が帝旺、癸水で滋養し丙火で泄秀",
            "zh-CN": "春季乙木帝旺，癸水滋养丙火泄秀",
            "zh-TW": "春季乙木帝旺，癸水滋養丙火洩秀"
        },
        outcome={
            "ko": "癸丙(병화)이 갖추어지면 재능이 드러나 발전",
            "en": "With both Gui and Bing, talent manifests and development follows",
            "ja": "癸丙が揃えば才能が現れ発展",
            "zh-CN": "癸丙齐备则才能显现发展",
            "zh-TW": "癸丙齊備則才能顯現發展"
        },
        warning={
            "ko": "金을 보면 안됨 - 새싹을 베는 격",
            "en": "Must not see Metal - like cutting new sprouts",
            "ja": "金を見てはならない - 新芽を切るようなもの",
            "zh-CN": "不宜见金 - 如砍新芽",
            "zh-TW": "不宜見金 - 如砍新芽"
        },
        original="卯月：以癸滋木，用丙泄秀，不宜見金。"
    ),
    "辰": JohuEntry(
        day_master="乙", month="辰",
        primary_god="癸", secondary_god="戊",
        condition={
            "ko": "늦봄 습토, 지지가 수국(水局)을 이루면 특별 처리 필요",
            "en": "Late spring wet Earth, if branches form Water Frame needs special handling",
            "ja": "晩春の湿土、地支が水局を成せば特別処理が必要",
            "zh-CN": "晚春湿土，支成水局需特别处理",
            "zh-TW": "晚春濕土，支成水局需特別處理"
        },
        outcome={
            "ko": "癸(계)水로 자양하되, 水局이면 戊(무)土로 제방",
            "en": "Gui Water nourishes, if Water Frame then Wu Earth builds dam",
            "ja": "癸水で滋養し、水局なら戊土で堤防",
            "zh-CN": "癸水滋养，水局则戊土筑堤",
            "zh-TW": "癸水滋養，水局則戊土築堤"
        },
        warning={
            "ko": "水가 너무 많으면 초목이 떠다니게 됨",
            "en": "Too much Water makes plants float away",
            "ja": "水が多すぎると草木が浮いてしまう",
            "zh-CN": "水多则草木漂浮",
            "zh-TW": "水多則草木漂浮"
        },
        original="辰月：若支成水局，取戊為佐。"
    ),
    "巳": JohuEntry(
        day_master="乙", month="巳",
        primary_god="癸", secondary_god="",
        condition={
            "ko": "초여름 丙(병)火가 녹(祿)을 얻어 화기 왕성, 조후가 급함",
            "en": "Early summer Bing Fire gains prosperity, Fire energy strong, climate balancing urgent",
            "ja": "初夏丙火が禄を得て火気旺盛、調候が急務",
            "zh-CN": "初夏丙火得禄火气旺，调候为急",
            "zh-TW": "初夏丙火得祿火氣旺，調候為急"
        },
        outcome={
            "ko": "癸(계)水를 전용(專用)하여 화기를 식히면 초목이 살아남",
            "en": "Exclusively use Gui Water to cool Fire, plants survive",
            "ja": "癸水を専用して火気を冷ませば草木が生き残る",
            "zh-CN": "专用癸水降火则草木得活",
            "zh-TW": "專用癸水降火則草木得活"
        },
        warning={
            "ko": "癸(계)水 없으면 초목이 말라버림",
            "en": "Without Gui Water, plants wither",
            "ja": "癸水なければ草木が枯れる",
            "zh-CN": "无癸水则草木枯萎",
            "zh-TW": "無癸水則草木枯萎"
        },
        original="巳月：月令丙火得祿，專用癸水，調候為急。"
    ),
    "午": JohuEntry(
        day_master="乙", month="午",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "한여름 화기가 극성, 상반월은 癸(계)水 전용, 하반월은 丙癸(계수) 병용",
            "en": "Midsummer Fire is extreme, first half uses only Gui, second half uses both Bing and Gui",
            "ja": "真夏火気が極盛、上半月は癸水専用、下半月は丙癸併用",
            "zh-CN": "盛夏火气极盛，上半月专用癸水，下半月丙癸并用",
            "zh-TW": "盛夏火氣極盛，上半月專用癸水，下半月丙癸並用"
        },
        outcome={
            "ko": "시기에 맞게 용신을 쓰면 균형이 맞아 발전",
            "en": "Using gods according to timing brings balance and development",
            "ja": "時期に合わせ用神を用いれば均衡が取れ発展",
            "zh-CN": "按时节用神则平衡发展",
            "zh-TW": "按時節用神則平衡發展"
        },
        warning={
            "ko": "癸(계)水가 부족하면 화기에 타들어감",
            "en": "Insufficient Gui Water means burning from Fire",
            "ja": "癸水が不足すると火気に焼かれる",
            "zh-CN": "癸水不足则被火气焚烧",
            "zh-TW": "癸水不足則被火氣焚燒"
        },
        original="午月：上半月專用癸水，下半月丙癸並用。"
    ),
    "未": JohuEntry(
        day_master="乙", month="未",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "늦여름 토왕(土旺), 癸(계)水로 토를 윤택하게 하고 목을 자양",
            "en": "Late summer Earth is strong, Gui Water moistens Earth and nourishes Wood",
            "ja": "晩夏土旺、癸水で土を潤し木を滋養",
            "zh-CN": "晚夏土旺，癸水润土滋木",
            "zh-TW": "晚夏土旺，癸水潤土滋木"
        },
        outcome={
            "ko": "癸(계)水를 쓰되, 金水가 많으면 丙(병)火를 먼저 씀",
            "en": "Use Gui Water, but if Metal/Water is abundant use Bing Fire first",
            "ja": "癸水を用いるが、金水が多ければ丙火を先に用いる",
            "zh-CN": "用癸水，金水多则先用丙火",
            "zh-TW": "用癸水，金水多則先用丙火"
        },
        warning={
            "ko": "여름철 壬(임)癸(계)에 戊(무)己(기)가 혼잡하면 탁해짐",
            "en": "In summer if Ren/Gui mix with Wu/Ji it becomes murky",
            "ja": "夏季壬癸に戊己が混ざると濁る",
            "zh-CN": "夏月壬癸忌戊己杂乱",
            "zh-TW": "夏月壬癸忌戊己雜亂"
        },
        original="未月：潤土滋木，喜用癸水，柱多金水，先用丙火。夏月壬癸，切忌戊己雜亂。"
    ),
    "申": JohuEntry(
        day_master="乙", month="申",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "초가을 庚(경)金이 사령(司令), 丙(병)火로 제(制)하거나 癸(계)水로 화(化)",
            "en": "Early autumn Geng Metal commands, control with Bing Fire or transform with Gui Water",
            "ja": "初秋庚金が司令、丙火で制するか癸水で化す",
            "zh-CN": "初秋庚金司令，丙火制之或癸水化之",
            "zh-TW": "初秋庚金司令，丙火制之或癸水化之"
        },
        outcome={
            "ko": "丙(병화)이든 癸든 己(기)土가 보조하면 균형이 맞음",
            "en": "Whether Bing or Gui, with Ji Earth as support brings balance",
            "ja": "丙でも癸でも己土が補助すれば均衡が取れる",
            "zh-CN": "无论用丙用癸，己土为佐则均衡",
            "zh-TW": "無論用丙用癸，己土為佐則均衡"
        },
        warning={
            "ko": "己(기)土 없으면 木이 뿌리를 내리기 어려움",
            "en": "Without Ji Earth, Wood has difficulty rooting",
            "ja": "己土なければ木が根を張りにくい",
            "zh-CN": "无己土则木难扎根",
            "zh-TW": "無己土則木難扎根"
        },
        original="申月：月垣庚金司令，取丙火制之，或癸水化之。不論用丙用癸，皆己土為佐。"
    ),
    "酉": JohuEntry(
        day_master="乙", month="酉",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "가을 금왕(金旺), 상반월은 癸先丙後, 하반월은 丙先癸後",
            "en": "Autumn Metal is strong, first half Gui then Bing, second half Bing then Gui",
            "ja": "秋の金旺、上半月は癸先丙後、下半月は丙先癸後",
            "zh-CN": "秋季金旺，上半月癸先丙后，下半月丙先癸后",
            "zh-TW": "秋季金旺，上半月癸先丙後，下半月丙先癸後"
        },
        outcome={
            "ko": "시기에 맞게 癸丙(병화) 순서를 조절하면 귀현",
            "en": "Adjusting Gui/Bing order by timing brings honor",
            "ja": "時期に合わせ癸丙の順序を調節すれば貴顕",
            "zh-CN": "按时节调整癸丙顺序则贵显",
            "zh-TW": "按時節調整癸丙順序則貴顯"
        },
        warning={
            "ko": "癸(계)水 없으면 壬(임)水로 대체 가능하나 효과 감소",
            "en": "Without Gui, Ren Water can substitute but effect is reduced",
            "ja": "癸水なければ壬水で代替可能だが効果減少",
            "zh-CN": "无癸用壬可替代但效果减弱",
            "zh-TW": "無癸用壬可替代但效果減弱"
        },
        original="酉月：上半月癸先丙後，下半月用丙先癸後，無癸用壬。"
    ),
    "戌": JohuEntry(
        day_master="乙", month="戌",
        primary_god="甲", secondary_god="癸",
        condition={
            "ko": "늦가을 토왕(土旺)하고 금기(金氣)가 수원(水源)을 열어줌",
            "en": "Late autumn Earth is strong, Metal energy opens Water source",
            "ja": "晩秋土旺で金気が水源を開く",
            "zh-CN": "晚秋土旺，金发水源",
            "zh-TW": "晚秋土旺，金發水源"
        },
        outcome={
            "ko": "甲(갑)木을 보면 등나무가 큰 나무를 감싸는 격 (藤蘿系甲)",
            "en": "Seeing Jia Wood is like vine wrapping around big tree (Vine-Wraps-Jia)",
            "ja": "甲木を見れば藤蔓が大木に絡む格（藤蘿系甲）",
            "zh-CN": "见甲木则藤萝系甲之格",
            "zh-TW": "見甲木則藤蘿繫甲之格"
        },
        warning={
            "ko": "甲(갑)木 없으면 乙(을)木이 홀로 서기 어려움",
            "en": "Without Jia Wood, Yi Wood has difficulty standing alone",
            "ja": "甲木なければ乙木が独り立ち難い",
            "zh-CN": "无甲木则乙木难独立",
            "zh-TW": "無甲木則乙木難獨立"
        },
        original="戌月：以金發水之源。見甲，名藤蘿系甲。"
    ),
    "亥": JohuEntry(
        day_master="乙", month="亥",
        primary_god="丙", secondary_god="戊",
        condition={
            "ko": "초겨울 水旺, 乙(을)木은 양(陽)을 향하니 丙(병)火 전용",
            "en": "Early winter Water is strong, Yi Wood faces the sun so exclusively use Bing Fire",
            "ja": "初冬水旺、乙木は陽に向かうので丙火を専用",
            "zh-CN": "初冬水旺，乙木向阳专用丙火",
            "zh-TW": "初冬水旺，乙木向陽專用丙火"
        },
        outcome={
            "ko": "丙(병)火로 따뜻하게 하면 초목이 봄을 맞듯 생기를 얻음",
            "en": "Warming with Bing Fire gives plants vitality like spring",
            "ja": "丙火で暖めれば草木が春を迎えるように生気を得る",
            "zh-CN": "丙火温暖则草木如迎春般获生气",
            "zh-TW": "丙火溫暖則草木如迎春般獲生氣"
        },
        warning={
            "ko": "水가 너무 많으면 戊(무)土로 보조해야 함",
            "en": "If Water is too much, need Wu Earth as support",
            "ja": "水が多すぎれば戊土で補助が必要",
            "zh-CN": "水多需戊土为佐",
            "zh-TW": "水多需戊土為佐"
        },
        original="亥月：乙木向陽，專用丙火，水多以戊為佐。"
    ),
    "子": JohuEntry(
        day_master="乙", month="子",
        primary_god="丙", secondary_god="",
        condition={
            "ko": "한겨울 한목(寒木)이 양(陽)을 향함, 丙(병)火 전용",
            "en": "Midwinter cold Wood faces the sun, exclusively use Bing Fire",
            "ja": "真冬の寒木が陽に向かう、丙火を専用",
            "zh-CN": "隆冬寒木向阳，专用丙火",
            "zh-TW": "隆冬寒木向陽，專用丙火"
        },
        outcome={
            "ko": "丙(병)火가 있으면 얼어붙은 초목도 생기를 찾음",
            "en": "With Bing Fire, even frozen plants find vitality",
            "ja": "丙火があれば凍った草木も生気を取り戻す",
            "zh-CN": "有丙火则冻草木亦得生气",
            "zh-TW": "有丙火則凍草木亦得生氣"
        },
        warning={
            "ko": "癸(계)水를 꺼림 - 태양을 가리면 안됨",
            "en": "Avoid Gui Water - must not block the sun",
            "ja": "癸水を忌む - 太陽を遮ってはならない",
            "zh-CN": "忌见癸水 - 不可遮挡太阳",
            "zh-TW": "忌見癸水 - 不可遮擋太陽"
        },
        original="子月：寒木向陽，專用丙火，忌見癸水。"
    ),
    "丑": JohuEntry(
        day_master="乙", month="丑",
        primary_god="丙", secondary_god="",
        condition={
            "ko": "겨울 끝자락, 한곡회춘(寒谷回春)으로 丙(병)火 전용",
            "en": "Late winter, Cold Valley Returns to Spring so exclusively use Bing Fire",
            "ja": "冬の終わり、寒谷回春で丙火を専用",
            "zh-CN": "冬末寒谷回春，专用丙火",
            "zh-TW": "冬末寒谷回春，專用丙火"
        },
        outcome={
            "ko": "丙(병)火로 봄기운을 불어넣으면 만물이 소생",
            "en": "Bing Fire breathes spring energy, all things revive",
            "ja": "丙火で春の気を吹き込めば万物が蘇生",
            "zh-CN": "丙火注入春气则万物复苏",
            "zh-TW": "丙火注入春氣則萬物復甦"
        },
        warning={
            "ko": "丙(병)火 없으면 한기(寒氣)에 갇혀 발전 어려움",
            "en": "Without Bing Fire, trapped in cold and development is difficult",
            "ja": "丙火なければ寒気に閉じ込められ発展困難",
            "zh-CN": "无丙火则困于寒气难发展",
            "zh-TW": "無丙火則困於寒氣難發展"
        },
        original="醜月：寒谷回春，專用丙火。"
    ),
}


# =============================================================================
# 丙火 (병화) - 태양, 큰 불
# 원문: 窮通寶鑑 554-568줄
# =============================================================================
BING_FIRE: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="丙", month="寅",
        primary_god="壬", secondary_god="庚",
        condition={
            "ko": "초봄 丙(병)火가 생지(生地)를 만남, 壬(임)水로 제어 필요",
            "en": "Early spring Bing Fire meets birth place, needs Ren Water control",
            "ja": "初春丙火が生地に会う、壬水で制御が必要",
            "zh-CN": "初春丙火逢生地，需壬水制之",
            "zh-TW": "初春丙火逢生地，需壬水制之"
        },
        outcome={
            "ko": "壬(임)水로 제어하고 庚(경)金이 수원(水源)을 열면 귀격",
            "en": "Ren Water controls, Geng Metal opens water source for noble status",
            "ja": "壬水で制御し庚金が水源を開けば貴格",
            "zh-CN": "壬水制火庚金发水源则贵格",
            "zh-TW": "壬水制火庚金發水源則貴格"
        },
        warning={
            "ko": "壬(임)水 없으면 화기가 넘쳐 조급해짐",
            "en": "Without Ren Water, Fire energy overflows causing impatience",
            "ja": "壬水なければ火気が溢れ焦燥する",
            "zh-CN": "无壬水则火气过旺易躁",
            "zh-TW": "無壬水則火氣過旺易躁"
        },
        original="寅月：壬水為用，庚金發水之源為佐。"
    ),
    "卯": JohuEntry(
        day_master="丙", month="卯",
        primary_god="壬", secondary_god="戊",
        condition={
            "ko": "봄 목왕(木旺)하여 火를 생조, 壬(임)水 전용",
            "en": "Spring Wood is strong supporting Fire, exclusively use Ren Water",
            "ja": "春の木旺で火を生助、壬水を専用",
            "zh-CN": "春季木旺生火，专用壬水",
            "zh-TW": "春季木旺生火，專用壬水"
        },
        outcome={
            "ko": "壬(임)水가 있으면 목화통명(木火通明)의 격",
            "en": "With Ren Water, achieves Wood-Fire Bright Penetration formation",
            "ja": "壬水があれば木火通明の格",
            "zh-CN": "有壬水则成木火通明之格",
            "zh-TW": "有壬水則成木火通明之格"
        },
        warning={
            "ko": "水가 많으면 戊(무)土로 제방, 신약하면 인성(印星)으로 화(化)",
            "en": "If Water is much use Wu Earth dam, if body weak use Seal to transform",
            "ja": "水多ければ戊土で堤防、身弱なら印星で化す",
            "zh-CN": "水多用戊制，身弱用印化",
            "zh-TW": "水多用戊制，身弱用印化"
        },
        original="卯月：專用壬水，水多用戊制之，身弱用印化之。"
    ),
    "辰": JohuEntry(
        day_master="丙", month="辰",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "늦봄 습토(濕土), 壬(임)水 전용",
            "en": "Late spring wet Earth, exclusively use Ren Water",
            "ja": "晩春の湿土、壬水を専用",
            "zh-CN": "晚春湿土，专用壬水",
            "zh-TW": "晚春濕土，專用壬水"
        },
        outcome={
            "ko": "壬(임)水가 투출하면 태양이 강을 비추는 격",
            "en": "When Ren Water appears, like sun shining on river",
            "ja": "壬水が透出すれば太陽が川を照らす格",
            "zh-CN": "壬水透出如日照江河之格",
            "zh-TW": "壬水透出如日照江河之格"
        },
        warning={
            "ko": "土가 무거우면 甲(갑)木으로 소토(疏土)해야 함",
            "en": "If Earth is heavy, need Jia Wood to loosen Earth",
            "ja": "土が重ければ甲木で疏土する必要",
            "zh-CN": "土重需甲木疏土",
            "zh-TW": "土重需甲木疏土"
        },
        original="辰月：專用壬水，土重以甲為佐。"
    ),
    "巳": JohuEntry(
        day_master="丙", month="巳",
        primary_god="壬", secondary_god="庚",
        condition={
            "ko": "초여름 丙(병)火가 녹(祿)을 얻어 화기 극성",
            "en": "Early summer Bing Fire gains prosperity, Fire energy extreme",
            "ja": "初夏丙火が禄を得て火気が極盛",
            "zh-CN": "初夏丙火得禄火气极盛",
            "zh-TW": "初夏丙火得祿火氣極盛"
        },
        outcome={
            "ko": "壬(임)水로 제어하고 庚(경)金이 보조하면 균형",
            "en": "Ren Water controls, Geng Metal supports for balance",
            "ja": "壬水で制御し庚金が補助すれば均衡",
            "zh-CN": "壬水制火庚金为佐则均衡",
            "zh-TW": "壬水制火庚金為佐則均衡"
        },
        warning={
            "ko": "戊(무)土가 壬(임)水를 제압하면 안됨 (忌戊制壬)",
            "en": "Wu Earth must not suppress Ren Water",
            "ja": "戊土が壬水を制圧してはならない（忌戊制壬）",
            "zh-CN": "忌戊制壬",
            "zh-TW": "忌戊制壬"
        },
        original="巳月：以庚為佐，忌戊制壬。"
    ),
    "午": JohuEntry(
        day_master="丙", month="午",
        primary_god="壬", secondary_god="庚",
        condition={
            "ko": "한여름 丙(병)火가 제왕(帝旺), 화기가 극에 달함",
            "en": "Midsummer Bing Fire at Emperor stage, Fire energy peaks",
            "ja": "真夏丙火が帝旺、火気が極に達する",
            "zh-CN": "盛夏丙火帝旺，火气达极",
            "zh-TW": "盛夏丙火帝旺，火氣達極"
        },
        outcome={
            "ko": "壬庚(경금)이 申宮에 통근하면 최묘(最妙)",
            "en": "Ren and Geng rooted in Shen Palace is most excellent",
            "ja": "壬庚が申宮に通根すれば最妙",
            "zh-CN": "壬庚通根申宫为妙",
            "zh-TW": "壬庚通根申宮為妙"
        },
        warning={
            "ko": "壬(임)水 없으면 화기가 타올라 고갈됨",
            "en": "Without Ren Water, Fire burns out and depletes",
            "ja": "壬水なければ火気が燃え尽き枯渇",
            "zh-CN": "无壬水则火气焚尽",
            "zh-TW": "無壬水則火氣焚盡"
        },
        original="午月：壬庚以通根申宮為妙。"
    ),
    "未": JohuEntry(
        day_master="丙", month="未",
        primary_god="壬", secondary_god="庚",
        condition={
            "ko": "늦여름 토왕(土旺)하나 화기 아직 강함",
            "en": "Late summer Earth is strong but Fire energy still strong",
            "ja": "晩夏土旺だが火気はまだ強い",
            "zh-CN": "晚夏土旺但火气仍强",
            "zh-TW": "晚夏土旺但火氣仍強"
        },
        outcome={
            "ko": "壬(임)水로 화기를 식히고 庚(경)金이 보조",
            "en": "Ren Water cools Fire, Geng Metal supports",
            "ja": "壬水で火気を冷まし庚金が補助",
            "zh-CN": "壬水降火庚金为佐",
            "zh-TW": "壬水降火庚金為佐"
        },
        warning={
            "ko": "土가 많으면 甲(갑)木으로 소토 필요",
            "en": "If Earth is much, need Jia Wood to loosen",
            "ja": "土が多ければ甲木で疏土が必要",
            "zh-CN": "土多需甲木疏土",
            "zh-TW": "土多需甲木疏土"
        },
        original="未月：以庚為佐。"
    ),
    "申": JohuEntry(
        day_master="丙", month="申",
        primary_god="壬", secondary_god="戊",
        condition={
            "ko": "초가을 壬(임)水가 申宮에서 장생, 수기 강해짐",
            "en": "Early autumn Ren Water at Long Life in Shen, Water energy strengthens",
            "ja": "初秋壬水が申宮で長生、水気が強まる",
            "zh-CN": "初秋壬水申宫长生，水气渐强",
            "zh-TW": "初秋壬水申宮長生，水氣漸強"
        },
        outcome={
            "ko": "壬(임)水가 통근하면 일조강하(日照江河)의 격",
            "en": "Ren Water rooted forms Sun Shining on River formation",
            "ja": "壬水が通根すれば日照江河の格",
            "zh-CN": "壬水通根成日照江河之格",
            "zh-TW": "壬水通根成日照江河之格"
        },
        warning={
            "ko": "壬(임)水가 많으면 戊(무)土로 반드시 제방",
            "en": "If Ren Water is much, must use Wu Earth dam",
            "ja": "壬水が多ければ戊土で必ず堤防",
            "zh-CN": "壬多必取戊制",
            "zh-TW": "壬多必取戊制"
        },
        original="申月：壬水通根申宮，壬多必取戊制。"
    ),
    "酉": JohuEntry(
        day_master="丙", month="酉",
        primary_god="壬", secondary_god="癸",
        condition={
            "ko": "가을 금왕(金旺)하여 수원(水源) 풍부, 丙(병)火가 여럿이면 壬(임)水 필수",
            "en": "Autumn Metal strong with rich water source, multiple Bing needs Ren Water",
            "ja": "秋の金旺で水源豊富、丙火が多ければ壬水必須",
            "zh-CN": "秋季金旺水源丰，多丙必须壬水",
            "zh-TW": "秋季金旺水源豐，多丙必須壬水"
        },
        outcome={
            "ko": "사주에 丙(병화)이 많고 壬(임)水 하나가 고투(高透)하면 기격(奇格)",
            "en": "Many Bing with one high Ren Water is a rare formation",
            "ja": "四柱に丙が多く壬水一つが高透すれば奇格",
            "zh-CN": "四柱多丙一壬高透为奇格",
            "zh-TW": "四柱多丙一壬高透為奇格"
        },
        warning={
            "ko": "壬(임)水 없으면 癸(계)水로 대체 가능",
            "en": "Without Ren Water, Gui Water can substitute",
            "ja": "壬水なければ癸水で代替可能",
            "zh-CN": "无壬用癸",
            "zh-TW": "無壬用癸"
        },
        original="酉月：四柱多丙，一壬高透為奇。無壬為癸。"
    ),
    "戌": JohuEntry(
        day_master="丙", month="戌",
        primary_god="甲", secondary_god="壬",
        condition={
            "ko": "늦가을 토왕(土旺)하여 화기를 설기(泄氣), 토가 빛을 가림",
            "en": "Late autumn Earth strong draining Fire, Earth dims the light",
            "ja": "晩秋土旺で火気を泄気、土が光を晦ます",
            "zh-CN": "晚秋土旺泄火气，土晦光",
            "zh-TW": "晚秋土旺洩火氣，土晦光"
        },
        outcome={
            "ko": "甲(갑)木으로 먼저 토를 소통시키고, 壬(임)水를 다음으로",
            "en": "First Jia Wood opens Earth, then Ren Water",
            "ja": "甲木で先に土を疏通し、壬水を次に",
            "zh-CN": "先甲疏土，次用壬水",
            "zh-TW": "先甲疏土，次用壬水"
        },
        warning={
            "ko": "土가 빛을 가리면(晦光) 재능이 묻힘",
            "en": "If Earth dims light, talent is buried",
            "ja": "土が光を晦ますと才能が埋もれる",
            "zh-CN": "土晦光则才能被埋没",
            "zh-TW": "土晦光則才能被埋沒"
        },
        original="戌月：忌土晦光，先取甲疏土，次用壬水。"
    ),
    "亥": JohuEntry(
        day_master="丙", month="亥",
        primary_god="甲", secondary_god="戊",
        condition={
            "ko": "초겨울 壬(임)水가 월건(月建)을 얻어 수왕(水旺)",
            "en": "Early winter Ren Water commands the month, Water is strong",
            "ja": "初冬壬水が月建を得て水旺",
            "zh-CN": "初冬壬水秉令水旺",
            "zh-TW": "初冬壬水秉令水旺"
        },
        outcome={
            "ko": "水旺하면 甲(갑)木으로 화(化)하고, 火旺하면 壬(임)水, 木旺하면 庚(경)金",
            "en": "Water strong use Jia to transform, Fire strong use Ren, Wood strong use Geng",
            "ja": "水旺なら甲木で化し、火旺なら壬水、木旺なら庚金",
            "zh-CN": "水旺用甲化，火旺用壬，木旺宜庚",
            "zh-TW": "水旺用甲化，火旺用壬，木旺宜庚"
        },
        warning={
            "ko": "신살양왕(身殺兩旺)이면 戊(무)土로 제어",
            "en": "If both self and killing are strong, use Wu Earth to control",
            "ja": "身殺両旺なら戊土で制御",
            "zh-CN": "身杀两旺用戊制",
            "zh-TW": "身殺兩旺用戊制"
        },
        original="亥月：月垣壬水秉令，水旺用甲木化之。身殺兩旺，用戊制之。火旺用壬，木旺宜庚。"
    ),
    "子": JohuEntry(
        day_master="丙", month="子",
        primary_god="壬", secondary_god="戊",
        condition={
            "ko": "한겨울이나 기운이 이양(二陽)에 가까워 丙(병)火가 약중복강(弱中複強)",
            "en": "Midwinter but energy near second yang, Bing Fire is weak yet reviving",
            "ja": "真冬だが気が二陽に近く丙火が弱中復強",
            "zh-CN": "隆冬气近二阳，丙火弱中复强",
            "zh-TW": "隆冬氣近二陽，丙火弱中復強"
        },
        outcome={
            "ko": "壬(임)水를 쓰되 戊(무)土로 제어하면 균형",
            "en": "Use Ren Water but control with Wu Earth for balance",
            "ja": "壬水を用いるが戊土で制御すれば均衡",
            "zh-CN": "用壬水取戊制之则均衡",
            "zh-TW": "用壬水取戊制之則均衡"
        },
        warning={
            "ko": "戊(무)土 없으면 己(기)土로 대체",
            "en": "Without Wu Earth, use Ji Earth as substitute",
            "ja": "戊土なければ己土で代替",
            "zh-CN": "无戊用己",
            "zh-TW": "無戊用己"
        },
        original="子月：氣近二陽，丙火弱中複強，故用壬水，取戊制之，無戊用己。"
    ),
    "丑": JohuEntry(
        day_master="丙", month="丑",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "겨울 끝자락 한습(寒濕)한 토, 壬(임)水가 기쁨",
            "en": "Late winter cold wet Earth, Ren Water is welcome",
            "ja": "冬の終わり寒湿な土、壬水が喜び",
            "zh-CN": "冬末寒湿之土，喜壬为用",
            "zh-TW": "冬末寒濕之土，喜壬為用"
        },
        outcome={
            "ko": "壬(임)水를 쓰면 태양이 물을 비추는 격",
            "en": "Using Ren Water forms sun shining on water formation",
            "ja": "壬水を用いれば太陽が水を照らす格",
            "zh-CN": "用壬水成日照水之格",
            "zh-TW": "用壬水成日照水之格"
        },
        warning={
            "ko": "土가 많으면 甲(갑)木이 반드시 필요",
            "en": "If Earth is much, Jia Wood is absolutely needed",
            "ja": "土が多ければ甲木が必須",
            "zh-CN": "土多不可少甲",
            "zh-TW": "土多不可少甲"
        },
        original="醜月：喜壬為用，土多不可少甲。"
    ),
}


# =============================================================================
# 丁火 (정화) - 등불, 촛불
# 원문: 窮通寶鑑 673-688줄
# =============================================================================
DING_FIRE: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="丁", month="寅",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "초봄 丁(정)火가 장생(長生), 甲(갑)木으로 인화(引火) 필요",
            "en": "Early spring Ding Fire at Long Life, needs Jia Wood to draw fire",
            "ja": "初春丁火が長生、甲木で引火が必要",
            "zh-CN": "初春丁火长生，需甲木引火",
            "zh-TW": "初春丁火長生，需甲木引火"
        },
        outcome={
            "ko": "庚(경)金으로 甲(갑)木을 쪼개어(劈甲) 丁(정)火를 끌어냄(引丁)",
            "en": "Geng Metal splits Jia Wood to draw out Ding Fire",
            "ja": "庚金で甲木を劈き丁火を引き出す",
            "zh-CN": "庚金劈甲引丁",
            "zh-TW": "庚金劈甲引丁"
        },
        warning={
            "ko": "甲(갑)木 없으면 불씨가 약해 빛을 발하기 어려움",
            "en": "Without Jia Wood, flame is weak and hard to shine",
            "ja": "甲木なければ火種が弱く輝きにくい",
            "zh-CN": "无甲木则火种弱难发光",
            "zh-TW": "無甲木則火種弱難發光"
        },
        original="寅月：用庚金劈甲引丁。"
    ),
    "卯": JohuEntry(
        day_master="丁", month="卯",
        primary_god="庚", secondary_god="甲",
        condition={
            "ko": "봄 乙(을)木이 왕성, 庚(경)金으로 乙(을)木을 제거하고 甲(갑)木으로 인화",
            "en": "Spring Yi Wood is strong, Geng removes Yi, Jia draws fire",
            "ja": "春の乙木が旺盛、庚金で乙木を除き甲木で引火",
            "zh-CN": "春季乙木旺，庚去乙甲引丁",
            "zh-TW": "春季乙木旺，庚去乙甲引丁"
        },
        outcome={
            "ko": "庚(경)金이 乙(을)木을 제거하고 甲(갑)木이 丁(정)火를 끌어내면 광명",
            "en": "Geng removes Yi, Jia draws Ding for brightness",
            "ja": "庚金が乙木を除き甲木が丁火を引けば光明",
            "zh-CN": "庚去乙甲引丁则光明",
            "zh-TW": "庚去乙甲引丁則光明"
        },
        warning={
            "ko": "乙(을)木이 甲(갑)木을 가리면(遮) 丁(정)火가 빛나지 못함",
            "en": "If Yi Wood covers Jia, Ding Fire cannot shine",
            "ja": "乙木が甲木を遮ると丁火が輝けない",
            "zh-CN": "乙木遮甲则丁火难明",
            "zh-TW": "乙木遮甲則丁火難明"
        },
        original="卯月：以庚去乙，以甲引丁。"
    ),
    "辰": JohuEntry(
        day_master="丁", month="辰",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "늦봄 습토(濕土), 甲(갑)木으로 인화하고 토를 제어",
            "en": "Late spring wet Earth, Jia draws fire and controls Earth",
            "ja": "晩春の湿土、甲木で引火し土を制御",
            "zh-CN": "晚春湿土，甲木引丁制土",
            "zh-TW": "晚春濕土，甲木引丁制土"
        },
        outcome={
            "ko": "甲(갑)木이 丁(정)火를 끌어내고 土를 제어하면 발전",
            "en": "Jia draws Ding and controls Earth for development",
            "ja": "甲木が丁火を引き土を制御すれば発展",
            "zh-CN": "甲木引丁制土则发展",
            "zh-TW": "甲木引丁制土則發展"
        },
        warning={
            "ko": "木이 왕성하면 庚(경)金, 水가 왕성하면 戊(무)土",
            "en": "If Wood strong use Geng, if Water strong use Wu",
            "ja": "木旺なら庚金、水旺なら戊土",
            "zh-CN": "木盛用庚，水盛用戊",
            "zh-TW": "木盛用庚，水盛用戊"
        },
        original="辰月：以甲木引丁制土，次看庚金。木盛用庚，水盛用戊。"
    ),
    "巳": JohuEntry(
        day_master="丁", month="巳",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "초여름 丁(정)火가 녹(祿)을 얻음, 甲(갑)木으로 계속 인화",
            "en": "Early summer Ding Fire gains prosperity, continue drawing with Jia",
            "ja": "初夏丁火が禄を得る、甲木で引き続き引火",
            "zh-CN": "初夏丁火得禄，继续甲木引丁",
            "zh-TW": "初夏丁火得祿，繼續甲木引丁"
        },
        outcome={
            "ko": "甲(갑)木이 많으면 庚(경)金을 먼저 써서 균형",
            "en": "If Jia is much, use Geng first for balance",
            "ja": "甲木が多ければ庚金を先に用いて均衡",
            "zh-CN": "甲多先取庚为先",
            "zh-TW": "甲多先取庚為先"
        },
        warning={
            "ko": "甲(갑)木 없으면 화력이 약해 발전 제한",
            "en": "Without Jia Wood, fire power is weak limiting development",
            "ja": "甲木なければ火力が弱く発展制限",
            "zh-CN": "无甲木则火力弱发展受限",
            "zh-TW": "無甲木則火力弱發展受限"
        },
        original="巳月：取甲引丁，甲多又取庚為先。"
    ),
    "午": JohuEntry(
        day_master="丁", month="午",
        primary_god="庚", secondary_god="壬",
        condition={
            "ko": "한여름 화기가 극성, 庚壬(임수) 양투(兩透)가 귀격",
            "en": "Midsummer Fire extreme, both Geng and Ren appearing is noble",
            "ja": "真夏火気が極盛、庚壬両透が貴格",
            "zh-CN": "盛夏火气极盛，庚壬两透为贵",
            "zh-TW": "盛夏火氣極盛，庚壬兩透為貴"
        },
        outcome={
            "ko": "庚(경)金과 壬(임)水가 모두 있으면 재살(財殺)이 균형",
            "en": "Both Geng and Ren present balances wealth and killing",
            "ja": "庚金と壬水が共にあれば財殺が均衡",
            "zh-CN": "庚壬齐备则财杀均衡",
            "zh-TW": "庚壬齊備則財殺均衡"
        },
        warning={
            "ko": "壬(임)水 없으면 癸(계)水를 쓰되, 독살당권(獨殺當權)의 격",
            "en": "Without Ren use Gui, but forms Lone Killing Controls formation",
            "ja": "壬水なければ癸水を用いるが独殺当権の格",
            "zh-CN": "无壬用癸，为独杀当权",
            "zh-TW": "無壬用癸，為獨殺當權"
        },
        original="午月：火多以庚壬兩透為貴。無壬用癸，為獨殺當權。"
    ),
    "未": JohuEntry(
        day_master="丁", month="未",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "늦여름 토왕(土旺), 甲(갑)木으로 壬(임)水를 화(化)하고 인화",
            "en": "Late summer Earth strong, Jia transforms Ren and draws fire",
            "ja": "晩夏土旺、甲木で壬水を化し引火",
            "zh-CN": "晚夏土旺，甲木化壬引丁",
            "zh-TW": "晚夏土旺，甲木化壬引丁"
        },
        outcome={
            "ko": "甲(갑)木을 쓰되 庚(경)金이 없으면 안됨",
            "en": "Use Jia but cannot be without Geng",
            "ja": "甲木を用いるが庚金がなければならない",
            "zh-CN": "用甲不能无庚，取庚为佐",
            "zh-TW": "用甲不能無庚，取庚為佐"
        },
        warning={
            "ko": "庚(경)金 없으면 甲(갑)木이 너무 왕성해져 丁(정)火가 약해짐",
            "en": "Without Geng, Jia becomes too strong weakening Ding",
            "ja": "庚金なければ甲木が強すぎて丁火が弱まる",
            "zh-CN": "无庚则甲木过旺丁火反弱",
            "zh-TW": "無庚則甲木過旺丁火反弱"
        },
        original="未月：以甲木化壬引丁為用，用甲不能無庚，取庚為佐。"
    ),
    "申": JohuEntry(
        day_master="丁", month="申",
        primary_god="庚", secondary_god="甲",
        condition={
            "ko": "초가을 금왕(金旺), 庚(경)金으로 甲(갑)木을 쪼개어 인화",
            "en": "Early autumn Metal strong, Geng splits Jia to draw fire",
            "ja": "初秋金旺、庚金で甲木を劈き引火",
            "zh-CN": "初秋金旺，庚金劈甲引丁",
            "zh-TW": "初秋金旺，庚金劈甲引丁"
        },
        outcome={
            "ko": "甲(갑)木 없으면 乙(을)木, 丙(병)火로 금을 따뜻하게 하고 甲(갑목)을 말림",
            "en": "Without Jia use Yi, Bing warms Metal and dries Jia",
            "ja": "甲木なければ乙木、丙火で金を暖め甲を乾かす",
            "zh-CN": "无甲用乙，丙暖金晒甲",
            "zh-TW": "無甲用乙，丙暖金曬甲"
        },
        warning={
            "ko": "庚甲(갑목) 없이 乙(을목)만 있으면 고초인등(枯草引燈)의 격, 水旺하면 戊(무)土",
            "en": "Only Yi without Geng/Jia forms Dry Grass Lights Lamp, Water strong use Wu",
            "ja": "庚甲なく乙のみなら枯草引灯の格、水旺なら戊土",
            "zh-CN": "无庚甲用乙见丙为枯草引灯，水旺用戊",
            "zh-TW": "無庚甲用乙見丙為枯草引燈，水旺用戊"
        },
        original="申月：庚取劈甲，無甲用乙。用丙暖金曬甲，無庚甲而用乙者，見丙為枯草引燈。水旺用戊。"
    ),
    "酉": JohuEntry(
        day_master="丁", month="酉",
        primary_god="庚", secondary_god="甲",
        condition={
            "ko": "가을 금왕(金旺), 申(신, 가을)月과 동일한 법칙",
            "en": "Autumn Metal strong, same rules as Shen month",
            "ja": "秋の金旺、申月と同じ法則",
            "zh-CN": "秋季金旺，同申月之法",
            "zh-TW": "秋季金旺，同申月之法"
        },
        outcome={
            "ko": "庚(경)金으로 甲(갑)木을 쪼개어 丁(정)火를 끌어냄",
            "en": "Geng Metal splits Jia Wood to draw Ding Fire",
            "ja": "庚金で甲木を劈き丁火を引き出す",
            "zh-CN": "庚金劈甲引丁",
            "zh-TW": "庚金劈甲引丁"
        },
        warning={
            "ko": "甲(갑)木 없이 乙(을목)만 있고 丙(병화)을 보면 고초인등(枯草引燈)",
            "en": "Only Yi without Jia seeing Bing forms Dry Grass Lights Lamp",
            "ja": "甲木なく乙のみで丙を見れば枯草引灯",
            "zh-CN": "无甲用乙见丙为枯草引灯",
            "zh-TW": "無甲用乙見丙為枯草引燈"
        },
        original="酉月：庚取劈甲，無甲用乙。用丙暖金曬甲，無庚甲而用乙者，見丙為枯草引燈。水旺用戊。"
    ),
    "戌": JohuEntry(
        day_master="丁", month="戌",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "늦가을 토왕(土旺), 戊(무)土가 일파(一派)이면 상관진(傷官盡)",
            "en": "Late autumn Earth strong, all Wu Earth means Hurting Officer exhausted",
            "ja": "晩秋土旺、戊土が一派なら傷官尽",
            "zh-CN": "晚秋土旺，一派戊土则伤官尽",
            "zh-TW": "晚秋土旺，一派戊土則傷官盡"
        },
        outcome={
            "ko": "甲(갑)木으로 土를 제어해야 발전 가능",
            "en": "Must control Earth with Jia Wood for development",
            "ja": "甲木で土を制御すれば発展可能",
            "zh-CN": "需甲木制土方能发展",
            "zh-TW": "需甲木制土方能發展"
        },
        warning={
            "ko": "甲(갑)木 없으면 土가 丁(정)火를 설기(泄氣)하여 빛을 잃음",
            "en": "Without Jia, Earth drains Ding Fire losing its light",
            "ja": "甲木なければ土が丁火を泄気し光を失う",
            "zh-CN": "无甲则土泄丁火失光",
            "zh-TW": "無甲則土洩丁火失光"
        },
        original="戌月：一派戊土無甲，為傷官盡。"
    ),
    "亥": JohuEntry(
        day_master="丁", month="亥",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "초겨울 水旺, 庚(경)金으로 甲(갑)木을 쪼개어 인화 (劈甲引丁)",
            "en": "Early winter Water strong, Geng splits Jia to draw fire",
            "ja": "初冬水旺、庚金で甲木を劈き引火（劈甲引丁）",
            "zh-CN": "初冬水旺，庚金劈甲引丁",
            "zh-TW": "初冬水旺，庚金劈甲引丁"
        },
        outcome={
            "ko": "甲(갑)木이 으뜸이고 庚(경)金이 보조, 戊癸는 권의(權宜)로 사용",
            "en": "Jia is primary, Geng supports, Wu/Gui used as needed",
            "ja": "甲木が尊く庚金が補助、戊癸は権宜で使用",
            "zh-CN": "甲木为尊庚金为佐，戊癸权宜取用",
            "zh-TW": "甲木為尊庚金為佐，戊癸權宜取用"
        },
        warning={
            "ko": "甲(갑)木 없으면 한화(寒火)로 빛을 발하기 어려움",
            "en": "Without Jia, cold fire struggles to shine",
            "ja": "甲木なければ寒火で輝きにくい",
            "zh-CN": "无甲则寒火难明",
            "zh-TW": "無甲則寒火難明"
        },
        original="亥月：庚金劈甲引丁，甲木為尊，庚金為佐。戊癸權宜取用。"
    ),
    "子": JohuEntry(
        day_master="丁", month="子",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "한겨울 水旺하여 丁(정)火가 가장 약함, 甲(갑)木으로 인화 필수",
            "en": "Midwinter Water strong, Ding Fire at weakest, Jia must draw fire",
            "ja": "真冬水旺で丁火が最も弱い、甲木で引火必須",
            "zh-CN": "隆冬水旺丁火最弱，甲木引火必须",
            "zh-TW": "隆冬水旺丁火最弱，甲木引火必須"
        },
        outcome={
            "ko": "甲(갑)木이 으뜸, 庚(경)金이 보조, 戊癸는 상황에 따라",
            "en": "Jia is primary, Geng supports, Wu/Gui as situation requires",
            "ja": "甲木が尊、庚金が補助、戊癸は状況次第",
            "zh-CN": "甲木为尊庚金为佐，戊癸权宜",
            "zh-TW": "甲木為尊庚金為佐，戊癸權宜"
        },
        warning={
            "ko": "水가 너무 많으면 戊(무)土로 제방 필요",
            "en": "If Water too much, need Wu Earth dam",
            "ja": "水が多すぎれば戊土で堤防が必要",
            "zh-CN": "水多需戊土筑堤",
            "zh-TW": "水多需戊土築堤"
        },
        original="子月：庚金劈甲引丁，甲木為尊，庚金為佐。戊癸權宜取用。"
    ),
    "丑": JohuEntry(
        day_master="丁", month="丑",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "겨울 끝자락 한습(寒濕), 甲(갑)木으로 인화가 핵심",
            "en": "Late winter cold and wet, Jia drawing fire is key",
            "ja": "冬の終わり寒湿、甲木で引火が核心",
            "zh-CN": "冬末寒湿，甲木引丁为核心",
            "zh-TW": "冬末寒濕，甲木引丁為核心"
        },
        outcome={
            "ko": "甲(갑)木이 으뜸, 庚(경)金이 甲(갑목)을 쪼개고 戊癸는 권의로",
            "en": "Jia is primary, Geng splits Jia, Wu/Gui as needed",
            "ja": "甲木が尊、庚金が甲を劈き戊癸は権宜",
            "zh-CN": "甲木为尊庚金劈甲，戊癸权宜",
            "zh-TW": "甲木為尊庚金劈甲，戊癸權宜"
        },
        warning={
            "ko": "甲庚(경금) 모두 없으면 한화(寒火)로 발복 어려움",
            "en": "Without both Jia and Geng, cold fire struggles for fortune",
            "ja": "甲庚共になければ寒火で発福困難",
            "zh-CN": "无甲庚则寒火难发",
            "zh-TW": "無甲庚則寒火難發"
        },
        original="醜月：庚金劈甲引丁，甲木為尊，庚金為佐。戊癸權宜取用。"
    ),
}


# =============================================================================
# 戊土 (무토) - 큰 산, 제방
# 원문: 窮通寶鑑 834-851줄
# =============================================================================
WU_EARTH: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="戊", month="寅",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "초봄 한기가 남아 戊(무)土가 얼어있음, 丙(병)火로 해동 필요",
            "en": "Early spring cold remains, Wu Earth is frozen, needs Bing Fire to thaw",
            "ja": "初春の寒気が残り戊土が凍結、丙火で解凍が必要",
            "zh-CN": "初春寒气未散戊土冻结，需丙火解冻",
            "zh-TW": "初春寒氣未散戊土凍結，需丙火解凍"
        },
        outcome={
            "ko": "丙(병)火로 따뜻하게 하고, 甲(갑)木으로 토를 소통시키고, 癸(계)水로 윤택하게",
            "en": "Warm with Bing Fire, loosen with Jia Wood, moisten with Gui Water",
            "ja": "丙火で暖め、甲木で土を疎通し、癸水で潤す",
            "zh-CN": "丙火暖土，甲木疏土，癸水润土",
            "zh-TW": "丙火暖土，甲木疏土，癸水潤土"
        },
        warning={
            "ko": "丙(병)火 없으면 토가 얼어 생기 없음",
            "en": "Without Bing Fire, Earth remains frozen and lifeless",
            "ja": "丙火なければ土が凍って生気なし",
            "zh-CN": "无丙火则土冻无生气",
            "zh-TW": "無丙火則土凍無生氣"
        },
        original="寅月：先丙、次甲、次癸。"
    ),
    "卯": JohuEntry(
        day_master="戊", month="卯",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "봄 戊(무)土가 여전히 한기, 丙(병)火로 조후 필요",
            "en": "Spring Wu Earth still cold, needs Bing Fire for climate balance",
            "ja": "春の戊土がまだ寒気、丙火で調候が必要",
            "zh-CN": "春季戊土仍有寒气，需丙火调候",
            "zh-TW": "春季戊土仍有寒氣，需丙火調候"
        },
        outcome={
            "ko": "丙(병)火 먼저, 甲(갑)木으로 토를 소통, 癸(계)水로 윤택",
            "en": "Bing Fire first, Jia loosens Earth, Gui moistens",
            "ja": "丙火が先、甲木で土を疎通、癸水で潤す",
            "zh-CN": "先丙火，甲木疏土，癸水润泽",
            "zh-TW": "先丙火，甲木疏土，癸水潤澤"
        },
        warning={
            "ko": "癸(계)水가 과하면 토가 습해져 탁해짐",
            "en": "Excess Gui Water makes Earth too damp and murky",
            "ja": "癸水が過ぎると土が湿って濁る",
            "zh-CN": "癸水过多土湿而浊",
            "zh-TW": "癸水過多土濕而濁"
        },
        original="卯月：先丙、次甲、次癸。"
    ),
    "辰": JohuEntry(
        day_master="戊", month="辰",
        primary_god="甲", secondary_god="丙",
        condition={
            "ko": "늦봄 土가 왕성해져 단단해짐, 甲(갑)木으로 소통 필요",
            "en": "Late spring Earth becomes strong and compact, needs Jia to loosen",
            "ja": "晩春土が旺盛になり固くなる、甲木で疏通が必要",
            "zh-CN": "晚春土旺而坚，需甲木疏通",
            "zh-TW": "晚春土旺而堅，需甲木疏通"
        },
        outcome={
            "ko": "甲(갑)木으로 토를 파헤치고, 丙(병)火로 따뜻하게, 癸(계)水로 윤택",
            "en": "Jia digs Earth, Bing warms, Gui moistens",
            "ja": "甲木で土を掘り、丙火で暖め、癸水で潤す",
            "zh-CN": "甲木疏土，丙火暖土，癸水润土",
            "zh-TW": "甲木疏土，丙火暖土，癸水潤土"
        },
        warning={
            "ko": "土만 많고 甲(갑)木 없으면 굳어서 쓸모없음",
            "en": "Too much Earth without Jia makes it useless and rigid",
            "ja": "土ばかりで甲木なければ固まって役立たず",
            "zh-CN": "土多无甲则僵硬无用",
            "zh-TW": "土多無甲則僵硬無用"
        },
        original="辰月：先用甲疏，次丙、次癸。"
    ),
    "巳": JohuEntry(
        day_master="戊", month="巳",
        primary_god="甲", secondary_god="丙",
        condition={
            "ko": "초여름 火가 왕성, 土가 조열해짐, 甲(갑)木으로 토를 소통",
            "en": "Early summer Fire is strong, Earth becomes dry, Jia loosens",
            "ja": "初夏火が旺盛、土が燥熱、甲木で土を疏通",
            "zh-CN": "初夏火旺土燥，甲木疏土",
            "zh-TW": "初夏火旺土燥，甲木疏土"
        },
        outcome={
            "ko": "甲(갑)木으로 토를 갈아주고, 丙癸(계수)로 조후 조절",
            "en": "Jia plows Earth, Bing and Gui balance climate",
            "ja": "甲木で土を耕し、丙癸で調候調整",
            "zh-CN": "甲木疏劈，丙癸调候",
            "zh-TW": "甲木疏劈，丙癸調候"
        },
        warning={
            "ko": "火가 너무 강하면 土가 마르고 갈라짐",
            "en": "Too much Fire dries and cracks Earth",
            "ja": "火が強すぎると土が乾いて割れる",
            "zh-CN": "火过旺土干裂",
            "zh-TW": "火過旺土乾裂"
        },
        original="巳月：先用甲疏劈，次取丙癸。"
    ),
    "午": JohuEntry(
        day_master="戊", month="午",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "한여름 극렬한 火, 土가 타들어감, 壬(임)水로 조후가 급선무",
            "en": "Midsummer intense Fire, Earth burns, Ren Water for climate is urgent",
            "ja": "真夏の激しい火、土が焼ける、壬水で調候が急務",
            "zh-CN": "盛夏火烈土焦，壬水调候为急",
            "zh-TW": "盛夏火烈土焦，壬水調候為急"
        },
        outcome={
            "ko": "壬(임)水로 먼저 식히고, 甲(갑)木으로 토를 소통, 丙(병)火는 상황에 따라",
            "en": "Cool first with Ren, loosen with Jia, use Bing as needed",
            "ja": "壬水で先に冷やし、甲木で土を疏通、丙火は状況次第",
            "zh-CN": "先壬水降温，次甲木疏土，丙火酌用",
            "zh-TW": "先壬水降溫，次甲木疏土，丙火酌用"
        },
        warning={
            "ko": "壬(임)水 없으면 土가 마르고 생기 잃음",
            "en": "Without Ren Water, Earth dries and loses vitality",
            "ja": "壬水なければ土が乾いて生気を失う",
            "zh-CN": "无壬水土干枯无生气",
            "zh-TW": "無壬水土乾枯無生氣"
        },
        original="午月：先用壬水，次取甲木，丙火酌用。"
    ),
    "未": JohuEntry(
        day_master="戊", month="未",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "늦여름 土가 더욱 조열, 癸(계)水가 반드시 필요",
            "en": "Late summer Earth is more dry and hot, Gui Water is essential",
            "ja": "晩夏土がさらに燥熱、癸水が必須",
            "zh-CN": "晚夏土更燥热，癸水不可缺",
            "zh-TW": "晚夏土更燥熱，癸水不可缺"
        },
        outcome={
            "ko": "癸(계)水로 윤택하게, 丙(병)火로 조화, 土가 두꺼우면 甲(갑)木 필수",
            "en": "Moisten with Gui, balance with Bing, if Earth is thick, Jia is essential",
            "ja": "癸水で潤し、丙火で調和、土が厚ければ甲木必須",
            "zh-CN": "癸水润土，丙火调和，土重必用甲木",
            "zh-TW": "癸水潤土，丙火調和，土重必用甲木"
        },
        warning={
            "ko": "癸(계)水 없으면 土가 갈라지고 식물이 자라지 못함",
            "en": "Without Gui, Earth cracks and plants cannot grow",
            "ja": "癸水なければ土が割れて植物が育たない",
            "zh-CN": "无癸水土裂草木不生",
            "zh-TW": "無癸水土裂草木不生"
        },
        original="未月：癸不可缺，次用丙火，土重不能無甲。"
    ),
    "申": JohuEntry(
        day_master="戊", month="申",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "초가을 金이 왕성해지기 시작, 丙(병)火로 따뜻함 유지",
            "en": "Early autumn Metal starts to be strong, keep warm with Bing Fire",
            "ja": "初秋金が旺盛になり始め、丙火で温かさ維持",
            "zh-CN": "初秋金旺始盛，丙火保温",
            "zh-TW": "初秋金旺始盛，丙火保溫"
        },
        outcome={
            "ko": "丙(병)火 먼저 쓰고 癸(계)水로 윤택, 水가 많으면 甲(갑)木으로 설기",
            "en": "Use Bing first, moisten with Gui, if Water is much, use Jia to drain",
            "ja": "丙火を先に使い癸水で潤す、水が多ければ甲木で洩らす",
            "zh-CN": "先丙火后癸水，水多用甲泄",
            "zh-TW": "先丙火後癸水，水多用甲泄"
        },
        warning={
            "ko": "金이 너무 강하면 土의 기운을 빼앗아감",
            "en": "Too much Metal drains Earth's energy",
            "ja": "金が強すぎると土の気を奪う",
            "zh-CN": "金太旺泄土之气",
            "zh-TW": "金太旺泄土之氣"
        },
        original="申月：先用丙火，後用癸水，水多用甲泄。"
    ),
    "酉": JohuEntry(
        day_master="戊", month="酉",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "가을 金이 왕성, 土가 기운을 빼앗김, 丙(병)火로 따뜻하게",
            "en": "Autumn Metal is strong, Earth loses energy, warm with Bing",
            "ja": "秋の金が旺盛、土が気を奪われる、丙火で暖める",
            "zh-CN": "秋季金旺土泄，丙火照暖",
            "zh-TW": "秋季金旺土泄，丙火照暖"
        },
        outcome={
            "ko": "丙(병)火에 의지해 따뜻함 얻고, 水로 윤택함 얻음",
            "en": "Rely on Bing for warmth, Water for moisture",
            "ja": "丙火に頼って温かさを得、水で潤いを得る",
            "zh-CN": "赖丙照暖，喜水滋润",
            "zh-TW": "賴丙照暖，喜水滋潤"
        },
        warning={
            "ko": "丙(병)火 없고 水만 많으면 土가 차갑고 습해짐",
            "en": "Without Bing and with excess Water, Earth becomes cold and damp",
            "ja": "丙火なく水ばかりだと土が寒くて湿る",
            "zh-CN": "无丙多水则土寒湿",
            "zh-TW": "無丙多水則土寒濕"
        },
        original="酉月：賴丙照暖，喜水滋潤。"
    ),
    "戌": JohuEntry(
        day_master="戊", month="戌",
        primary_god="甲", secondary_god="丙",
        condition={
            "ko": "늦가을 土가 다시 왕성, 단단해져 甲(갑)木으로 소통 필요",
            "en": "Late autumn Earth is strong again, hardened, needs Jia to loosen",
            "ja": "晩秋土が再び旺盛、固くなり甲木で疏通が必要",
            "zh-CN": "晚秋土复旺而坚，需甲木疏通",
            "zh-TW": "晚秋土復旺而堅，需甲木疏通"
        },
        outcome={
            "ko": "甲(갑)木 먼저 쓰고 丙(병)火로 따뜻함, 金 보이면 癸(계)水 먼저",
            "en": "Use Jia first, warm with Bing, if Metal appears use Gui first",
            "ja": "甲木を先に使い丙火で暖める、金が見えれば癸水を先に",
            "zh-CN": "先甲木次丙火，见金先用癸水",
            "zh-TW": "先甲木次丙火，見金先用癸水"
        },
        warning={
            "ko": "甲(갑)木 없으면 土가 굳어 생기 없음",
            "en": "Without Jia, Earth hardens and loses vitality",
            "ja": "甲木なければ土が固まって生気なし",
            "zh-CN": "无甲木土僵无生气",
            "zh-TW": "無甲木土僵無生氣"
        },
        original="戌月：先用甲木，次取丙火，見金先用癸水。"
    ),
    "亥": JohuEntry(
        day_master="戊", month="亥",
        primary_god="甲", secondary_god="丙",
        condition={
            "ko": "초겨울 水가 왕성, 土가 차가워짐, 甲丙(병화) 둘 다 필수",
            "en": "Early winter Water is strong, Earth gets cold, both Jia and Bing essential",
            "ja": "初冬水が旺盛、土が冷える、甲丙両方必須",
            "zh-CN": "初冬水旺土寒，甲丙皆不可缺",
            "zh-TW": "初冬水旺土寒，甲丙皆不可缺"
        },
        outcome={
            "ko": "甲(갑)木 없으면 영험함 없고, 丙(병)火 없으면 따뜻함 없음",
            "en": "Without Jia no spirit, without Bing no warmth",
            "ja": "甲木なければ霊験なく、丙火なければ温かさなし",
            "zh-CN": "非甲不灵，非丙不暖",
            "zh-TW": "非甲不靈，非丙不暖"
        },
        warning={
            "ko": "水가 너무 강하면 土가 흩어지고 무력해짐",
            "en": "Too much Water disperses and weakens Earth",
            "ja": "水が強すぎると土が散って無力になる",
            "zh-CN": "水过旺土散无力",
            "zh-TW": "水過旺土散無力"
        },
        original="亥月：非甲不靈，非丙不暖。"
    ),
    "子": JohuEntry(
        day_master="戊", month="子",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "한겨울 水가 극왕, 土가 얼어붙음, 丙(병)火가 가장 귀함",
            "en": "Midwinter Water is at peak, Earth freezes, Bing Fire is most precious",
            "ja": "真冬水が極旺、土が凍りつく、丙火が最も貴い",
            "zh-CN": "隆冬水极旺土冻，丙火为尚",
            "zh-TW": "隆冬水極旺土凍，丙火為尚"
        },
        outcome={
            "ko": "丙(병)火로 따뜻하게 하고 甲(갑)木으로 보좌",
            "en": "Warm with Bing Fire, assist with Jia Wood",
            "ja": "丙火で暖め甲木で補佐",
            "zh-CN": "丙火为尚，甲木为佐",
            "zh-TW": "丙火為尚，甲木為佐"
        },
        warning={
            "ko": "丙(병)火 없으면 土가 얼어 생기 완전 소멸",
            "en": "Without Bing, Earth freezes and loses all vitality",
            "ja": "丙火なければ土が凍り生気が完全に消滅",
            "zh-CN": "无丙火土冻生气全消",
            "zh-TW": "無丙火土凍生氣全消"
        },
        original="子月：丙火為尚，甲木為佐。"
    ),
    "丑": JohuEntry(
        day_master="戊", month="丑",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "늦겨울 한습(寒濕)의 土, 丙(병)火로 해동 필수",
            "en": "Late winter cold and damp Earth, Bing Fire essential to thaw",
            "ja": "晩冬の寒湿な土、丙火で解凍必須",
            "zh-CN": "晚冬寒湿之土，丙火解冻必须",
            "zh-TW": "晚冬寒濕之土，丙火解凍必須"
        },
        outcome={
            "ko": "丙(병)火를 숭상하고 甲(갑)木으로 보좌",
            "en": "Revere Bing Fire, assist with Jia Wood",
            "ja": "丙火を尚び甲木で補佐",
            "zh-CN": "丙火为尚，甲木为佐",
            "zh-TW": "丙火為尚，甲木為佐"
        },
        warning={
            "ko": "土가 습하고 차가우면 만물이 자라지 못함",
            "en": "Cold damp Earth cannot nurture anything",
            "ja": "土が湿って冷たいと万物が育たない",
            "zh-CN": "土寒湿则万物不生",
            "zh-TW": "土寒濕則萬物不生"
        },
        original="丑月：丙火為尚，甲木為佐。"
    ),
}


# =============================================================================
# 己土 (기토) - 논밭, 정원
# 원문: 窮通寶鑑 927-939줄
# =============================================================================
JI_EARTH: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="己", month="寅",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "초봄 한기가 남아 己(기)土가 차가움, 丙(병)火로 한기 해소",
            "en": "Early spring cold remains, Ji Earth is cold, Bing dissolves cold",
            "ja": "初春の寒気が残り己土が冷たい、丙火で寒気解消",
            "zh-CN": "初春寒气残留己土寒，丙火解寒",
            "zh-TW": "初春寒氣殘留己土寒，丙火解寒"
        },
        outcome={
            "ko": "丙(병)火로 해한(解寒), 壬(임)水 꺼림, 水多시 土로 보좌, 土多시 甲(갑목) 사용",
            "en": "Bing dissolves cold, avoid Ren, if much Water use Earth, if much Earth use Jia",
            "ja": "丙火で解寒、壬水を忌む、水多時土で補佐、土多時甲を使う",
            "zh-CN": "丙火解寒，忌壬水，水多须土佐，土多用甲",
            "zh-TW": "丙火解寒，忌壬水，水多須土佐，土多用甲"
        },
        warning={
            "ko": "壬(임)水를 보면 土가 더 차가워져 흉함",
            "en": "Seeing Ren Water makes Earth colder, inauspicious",
            "ja": "壬水を見ると土がより寒くなり凶",
            "zh-CN": "见壬水土更寒则凶",
            "zh-TW": "見壬水土更寒則凶"
        },
        original="寅月：取丙解寒，忌見壬水，水多須土為佐，土多用甲，甲多用庚。"
    ),
    "卯": JohuEntry(
        day_master="己", month="卯",
        primary_god="甲", secondary_god="癸",
        condition={
            "ko": "봄 乙(을)木이 왕성, 甲(갑)木을 써야 하나 己(기토)와 합화(合化) 주의",
            "en": "Spring Yi Wood is strong, use Jia but beware of Ji-Jia combination",
            "ja": "春の乙木が旺盛、甲木を使うが己との合化に注意",
            "zh-CN": "春季乙木旺，用甲但忌与己合化",
            "zh-TW": "春季乙木旺，用甲但忌與己合化"
        },
        outcome={
            "ko": "甲(갑)木 쓰되 己(기)土와 합화 안 되게, 癸(계)水로 윤택하게",
            "en": "Use Jia avoiding combination with Ji, moisten with Gui",
            "ja": "甲木を使い己土との合化を避け、癸水で潤す",
            "zh-CN": "用甲忌与己合化，次用癸水润之",
            "zh-TW": "用甲忌與己合化，次用癸水潤之"
        },
        warning={
            "ko": "甲己(기토)가 합하면 토가 변질되어 본성 잃음",
            "en": "If Jia-Ji combine, Earth transforms and loses its nature",
            "ja": "甲己が合すると土が変質して本性を失う",
            "zh-CN": "甲己合则土变质失本性",
            "zh-TW": "甲己合則土變質失本性"
        },
        original="卯月：用甲忌與己土合化，次用癸水潤之。"
    ),
    "辰": JohuEntry(
        day_master="己", month="辰",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "늦봄 土가 왕성, 따뜻하고 윤택하게 해야 함",
            "en": "Late spring Earth is strong, needs warmth and moisture",
            "ja": "晩春土が旺盛、暖かく潤わせる必要あり",
            "zh-CN": "晚春土旺，需暖且润",
            "zh-TW": "晚春土旺，需暖且潤"
        },
        outcome={
            "ko": "丙(병)火 먼저 癸(계)水 다음, 土가 따뜻하고 윤택해지면 甲(갑목)으로 소통",
            "en": "Bing first then Gui, when Earth is warm and moist, use Jia to loosen",
            "ja": "丙火が先、癸水が次、土が暖かく潤えば甲で疏通",
            "zh-CN": "先丙后癸，土暖而润，随用甲疏",
            "zh-TW": "先丙後癸，土暖而潤，隨用甲疏"
        },
        warning={
            "ko": "土만 많고 조습(調濕) 없으면 딱딱해 쓸모없음",
            "en": "Too much Earth without moisture becomes hard and useless",
            "ja": "土ばかりで調湿なければ固くて役立たず",
            "zh-CN": "土多无调湿则僵硬无用",
            "zh-TW": "土多無調濕則僵硬無用"
        },
        original="辰月：先丙後癸，土暖而潤，隨用甲疏。"
    ),
    "巳": JohuEntry(
        day_master="己", month="巳",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "초여름 火가 왕성, 土가 조열해짐, 癸(계)水 조후 필수",
            "en": "Early summer Fire is strong, Earth gets dry-hot, Gui for climate essential",
            "ja": "初夏火が旺盛、土が燥熱、癸水調候必須",
            "zh-CN": "初夏火旺土燥热，癸水调候必须",
            "zh-TW": "初夏火旺土燥熱，癸水調候必須"
        },
        outcome={
            "ko": "조후(調候)에 癸(계)水 없으면 안 되고, 토를 윤택하게 丙(병)火도 필요",
            "en": "Cannot do without Gui for climate, Bing also needed to moisten Earth",
            "ja": "調候に癸水なくてはならず、土を潤すのに丙火も必要",
            "zh-CN": "调候不能无癸，土润不能无丙",
            "zh-TW": "調候不能無癸，土潤不能無丙"
        },
        warning={
            "ko": "癸(계)水 없으면 土가 마르고 갈라짐",
            "en": "Without Gui, Earth dries and cracks",
            "ja": "癸水なければ土が乾いて割れる",
            "zh-CN": "无癸水土干裂",
            "zh-TW": "無癸水土乾裂"
        },
        original="巳月：調候不能無癸，土潤不能無丙。"
    ),
    "午": JohuEntry(
        day_master="己", month="午",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "한여름 극렬한 火, 土가 타들어감, 癸(계)水 조후 급선무",
            "en": "Midsummer intense Fire, Earth burns, Gui for climate is urgent",
            "ja": "真夏の激しい火、土が焼ける、癸水調候が急務",
            "zh-CN": "盛夏火烈土焦，癸水调候为急",
            "zh-TW": "盛夏火烈土焦，癸水調候為急"
        },
        outcome={
            "ko": "조후에 癸(계)水 없으면 안 되고, 토 윤택에 丙(병)火도 필요",
            "en": "Cannot do without Gui for climate, Bing also needed for Earth moisture",
            "ja": "調候に癸水なくてはならず、土潤に丙火も必要",
            "zh-CN": "调候不能无癸，土润不能无丙",
            "zh-TW": "調候不能無癸，土潤不能無丙"
        },
        warning={
            "ko": "水 없이 火만 강하면 土가 갈라지고 황폐해짐",
            "en": "Strong Fire without Water cracks and devastates Earth",
            "ja": "水なく火だけ強いと土が割れて荒廃",
            "zh-CN": "无水火旺土裂荒废",
            "zh-TW": "無水火旺土裂荒廢"
        },
        original="午月：調候不能無癸，土潤不能無丙。"
    ),
    "未": JohuEntry(
        day_master="己", month="未",
        primary_god="癸", secondary_god="丙",
        condition={
            "ko": "늦여름 土가 가장 왕성하고 조열, 癸(계)水가 반드시 필요",
            "en": "Late summer Earth is strongest and dry-hot, Gui is essential",
            "ja": "晩夏土が最も旺盛で燥熱、癸水が必須",
            "zh-CN": "晚夏土最旺且燥热，癸水必须",
            "zh-TW": "晚夏土最旺且燥熱，癸水必須"
        },
        outcome={
            "ko": "조후에 癸(계)水, 토 윤택에 丙(병)火",
            "en": "Gui for climate, Bing for Earth moisture",
            "ja": "調候に癸水、土潤に丙火",
            "zh-CN": "调候不能无癸，土润不能无丙",
            "zh-TW": "調候不能無癸，土潤不能無丙"
        },
        warning={
            "ko": "土가 너무 두꺼우면 甲(갑)木으로 소통 필요",
            "en": "If Earth is too thick, need Jia to loosen",
            "ja": "土が厚すぎれば甲木で疏通が必要",
            "zh-CN": "土过厚需甲木疏通",
            "zh-TW": "土過厚需甲木疏通"
        },
        original="未月：調候不能無癸，土潤不能無丙。"
    ),
    "申": JohuEntry(
        day_master="己", month="申",
        primary_god="丙", secondary_god="癸",
        condition={
            "ko": "초가을 金이 왕성해지기 시작, 土가 기운을 빼앗김",
            "en": "Early autumn Metal starts strong, Earth loses energy",
            "ja": "初秋金が旺盛になり始め、土が気を奪われる",
            "zh-CN": "初秋金旺始盛，土气被泄",
            "zh-TW": "初秋金旺始盛，土氣被泄"
        },
        outcome={
            "ko": "丙(병)火로 토를 따뜻하게, 癸(계)水로 윤택하게, 丙은 金 제압, 癸는 金 설기",
            "en": "Bing warms Earth, Gui moistens, Bing controls Metal, Gui drains Metal",
            "ja": "丙火で土を暖め、癸水で潤す、丙は金制圧、癸は金洩らし",
            "zh-CN": "丙火温土，癸水润土，丙能制金，癸能泄金",
            "zh-TW": "丙火溫土，癸水潤土，丙能制金，癸能泄金"
        },
        warning={
            "ko": "金이 너무 강하면 土의 기운이 완전히 빠져나감",
            "en": "Too strong Metal completely drains Earth's energy",
            "ja": "金が強すぎると土の気が完全に抜ける",
            "zh-CN": "金太旺土气尽泄",
            "zh-TW": "金太旺土氣盡泄"
        },
        original="申月：丙火溫土，癸水潤土，丙能制金，癸能泄金。"
    ),
    "酉": JohuEntry(
        day_master="己", month="酉",
        primary_god="辛", secondary_god="癸",
        condition={
            "ko": "가을 金이 가장 왕성, 辛(신)金으로 癸(계)水 보조",
            "en": "Autumn Metal is strongest, Xin Metal assists Gui Water",
            "ja": "秋の金が最も旺盛、辛金で癸水を補助",
            "zh-CN": "秋季金最旺，辛金辅癸水",
            "zh-TW": "秋季金最旺，辛金輔癸水"
        },
        outcome={
            "ko": "辛(신)金을 취해 癸(계)水를 보조함",
            "en": "Take Xin Metal to assist Gui Water",
            "ja": "辛金を取って癸水を補助",
            "zh-CN": "取辛辅癸",
            "zh-TW": "取辛輔癸"
        },
        warning={
            "ko": "金만 강하고 水 없으면 土가 마르고 기운 빠짐",
            "en": "Strong Metal without Water dries Earth and drains energy",
            "ja": "金だけ強くて水なければ土が乾いて気が抜ける",
            "zh-CN": "金强无水土干气泄",
            "zh-TW": "金強無水土乾氣泄"
        },
        original="酉月：取辛輔癸。"
    ),
    "戌": JohuEntry(
        day_master="己", month="戌",
        primary_god="甲", secondary_god="丙",
        condition={
            "ko": "늦가을 土가 다시 왕성, 甲(갑)木으로 소통 필요",
            "en": "Late autumn Earth is strong again, needs Jia to loosen",
            "ja": "晩秋土が再び旺盛、甲木で疏通が必要",
            "zh-CN": "晚秋土复旺，需甲木疏通",
            "zh-TW": "晚秋土復旺，需甲木疏通"
        },
        outcome={
            "ko": "마땅히 甲(갑)木으로 소통하고, 다음 丙癸(계수) 사용",
            "en": "Should loosen with Jia, then use Bing and Gui",
            "ja": "甲木で疏通すべき、次に丙癸を使う",
            "zh-CN": "宜甲木疏之，次用丙癸",
            "zh-TW": "宜甲木疏之，次用丙癸"
        },
        warning={
            "ko": "土가 굳어있는데 甲(갑목) 없으면 생기 없음",
            "en": "Hardened Earth without Jia has no vitality",
            "ja": "土が固まっているのに甲なければ生気なし",
            "zh-CN": "土僵无甲则无生气",
            "zh-TW": "土僵無甲則無生氣"
        },
        original="戌月：宜甲木疏之，次用丙癸。"
    ),
    "亥": JohuEntry(
        day_master="己", month="亥",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "초겨울 水가 왕성, 土가 차가워짐, 丙(병)火 필수",
            "en": "Early winter Water is strong, Earth gets cold, Bing essential",
            "ja": "初冬水が旺盛、土が冷える、丙火必須",
            "zh-CN": "初冬水旺土寒，丙火必须",
            "zh-TW": "初冬水旺土寒，丙火必須"
        },
        outcome={
            "ko": "丙(병)火 아니면 생하지 않고, 壬旺하면 戊(무토)로 제압, 土多하면 甲(갑목)으로 소통",
            "en": "Without Bing cannot grow, if Ren is strong use Wu to control, if much Earth use Jia",
            "ja": "丙火なければ生じず、壬旺なら戊で制圧、土多なら甲で疏通",
            "zh-CN": "非丙暖不生，壬旺取戊制，土多取甲疏",
            "zh-TW": "非丙暖不生，壬旺取戊制，土多取甲疏"
        },
        warning={
            "ko": "丙(병)火 없으면 土가 얼어 아무것도 자라지 못함",
            "en": "Without Bing, Earth freezes and nothing grows",
            "ja": "丙火なければ土が凍り何も育たない",
            "zh-CN": "无丙火土冻不生",
            "zh-TW": "無丙火土凍不生"
        },
        original="亥月：非丙暖不生，壬旺取戊制，土多取甲疏。"
    ),
    "子": JohuEntry(
        day_master="己", month="子",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "한겨울 水가 극왕, 土가 얼어붙음, 丙(병)火가 가장 급함",
            "en": "Midwinter Water at peak, Earth freezes, Bing Fire is most urgent",
            "ja": "真冬水が極旺、土が凍りつく、丙火が最も急務",
            "zh-CN": "隆冬水极旺土冻，丙火最急",
            "zh-TW": "隆冬水極旺土凍，丙火最急"
        },
        outcome={
            "ko": "丙(병)火 아니면 생하지 않고, 壬太旺하면 戊(무토)로 제압, 土多하면 甲(갑목)으로 소통",
            "en": "Without Bing cannot grow, if Ren too strong use Wu, if much Earth use Jia",
            "ja": "丙火なければ生じず、壬太旺なら戊で制圧、土多なら甲で疏通",
            "zh-CN": "非丙暖不生，壬太旺取戊制，土多取甲疏",
            "zh-TW": "非丙暖不生，壬太旺取戊制，土多取甲疏"
        },
        warning={
            "ko": "水가 너무 강하면 土가 떠내려감",
            "en": "Too strong Water washes Earth away",
            "ja": "水が強すぎると土が流される",
            "zh-CN": "水太旺土被冲走",
            "zh-TW": "水太旺土被沖走"
        },
        original="子月：非丙暖不生，壬太旺取戊制，土多取甲疏。"
    ),
    "丑": JohuEntry(
        day_master="己", month="丑",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "늦겨울 한습(寒濕)의 土, 丙(병)火로 해동 필수",
            "en": "Late winter cold-damp Earth, Bing essential to thaw",
            "ja": "晩冬の寒湿な土、丙火で解凍必須",
            "zh-CN": "晚冬寒湿之土，丙火解冻必须",
            "zh-TW": "晚冬寒濕之土，丙火解凍必須"
        },
        outcome={
            "ko": "丙(병)火 아니면 생하지 않고, 壬太旺하면 戊(무토)로 제압, 土多하면 甲(갑목)으로 소통",
            "en": "Without Bing cannot grow, if Ren too strong use Wu, if much Earth use Jia",
            "ja": "丙火なければ生じず、壬太旺なら戊で制圧、土多なら甲で疏通",
            "zh-CN": "非丙暖不生，壬太旺取戊制，土多取甲疏",
            "zh-TW": "非丙暖不生，壬太旺取戊制，土多取甲疏"
        },
        warning={
            "ko": "土가 습하고 차가우면 만물이 자라지 못함",
            "en": "Cold damp Earth cannot nurture anything",
            "ja": "土が湿って冷たいと万物が育たない",
            "zh-CN": "土寒湿则万物不生",
            "zh-TW": "土寒濕則萬物不生"
        },
        original="丑月：非丙暖不生，壬太旺取戊制，土多取甲疏。"
    ),
}


# =============================================================================
# 庚金 (경금) - 쇠, 바위, 도끼
# 원문: 窮通寶鑑 1107-1123줄
# =============================================================================
GENG_METAL: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="庚", month="寅",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "초봄 庚(경)金이 차갑고 굳어있음, 丙(병)火로 따뜻하게 해야 함",
            "en": "Early spring Geng Metal is cold and rigid, needs Bing Fire to warm",
            "ja": "初春庚金が冷たく固い、丙火で暖める必要あり",
            "zh-CN": "初春庚金寒凝，需丙火暖之",
            "zh-TW": "初春庚金寒凝，需丙火暖之"
        },
        outcome={
            "ko": "丙(병)火로 庚(경금)을 따뜻하게, 土가 두꺼우면 甲(갑목)으로 설기, 火多면 土로, 支成火局이면 壬(임수) 사용",
            "en": "Warm Geng with Bing, if Earth thick use Jia to drain, if much Fire use Earth, if Fire frame use Ren",
            "ja": "丙火で庚を暖め、土が厚ければ甲で洩らし、火多なら土、支成火局なら壬を使う",
            "zh-CN": "丙暖庚性，土厚用甲疏，火多用土，支成火局用壬",
            "zh-TW": "丙暖庚性，土厚用甲疏，火多用土，支成火局用壬"
        },
        warning={
            "ko": "土가 너무 두꺼우면 金이 묻혀 빛을 발하지 못함",
            "en": "Too thick Earth buries Metal, preventing it from shining",
            "ja": "土が厚すぎると金が埋もれて輝けない",
            "zh-CN": "土厚埋金难发光",
            "zh-TW": "土厚埋金難發光"
        },
        original="寅月：用丙暖庚性，患土厚埋金須甲疏泄，火多用土，支成火局用壬。"
    ),
    "卯": JohuEntry(
        day_master="庚", month="卯",
        primary_god="丁", secondary_god="甲",
        condition={
            "ko": "봄 庚(경)金이 암강(暗強)해짐, 丁(정)火로 단련 필요",
            "en": "Spring Geng Metal becomes secretly strong, needs Ding Fire to temper",
            "ja": "春の庚金が暗強になる、丁火で鍛錬が必要",
            "zh-CN": "春季庚金暗强，需丁火锻炼",
            "zh-TW": "春季庚金暗強，需丁火鍛煉"
        },
        outcome={
            "ko": "오로지 丁(정)火 사용, 甲(갑목)으로 丁(정화)을 끌어내고(引丁), 庚(경금)으로 甲(갑목)을 쪼갬(劈甲), 丁(정화) 없으면 丙(병화) 사용",
            "en": "Use only Ding, Jia draws Ding, Geng splits Jia, without Ding use Bing",
            "ja": "專ら丁火を使い、甲で丁を引き、庚で甲を劈く、丁なければ丙を使う",
            "zh-CN": "专用丁火，借甲引丁，庚劈甲，无丁用丙",
            "zh-TW": "專用丁火，借甲引丁，庚劈甲，無丁用丙"
        },
        warning={
            "ko": "丁(정)火 없으면 金이 단련되지 않아 도구가 되지 못함",
            "en": "Without Ding, Metal cannot be tempered into a tool",
            "ja": "丁火なければ金が鍛錬されず道具になれない",
            "zh-CN": "无丁火金不成器",
            "zh-TW": "無丁火金不成器"
        },
        original="卯月：專用丁火，借甲引丁，用庚劈甲，無丁用丙。"
    ),
    "辰": JohuEntry(
        day_master="庚", month="辰",
        primary_god="丁", secondary_god="甲",
        condition={
            "ko": "늦봄 土왕절, 頑金(완금)은 丁(정)火로 단련 필요",
            "en": "Late spring Earth rules, stubborn Metal needs Ding to temper",
            "ja": "晩春土旺節、頑金は丁火で鍛錬が必要",
            "zh-CN": "晚春土旺，顽金宜丁火锻炼",
            "zh-TW": "晚春土旺，頑金宜丁火鍛煉"
        },
        outcome={
            "ko": "頑金은 丁(정화)이 마땅, 旺土는 甲(갑목) 사용, 支火는 癸(계수)로, 幹火는 壬(임수)으로",
            "en": "Stubborn Metal suits Ding, strong Earth uses Jia, branch Fire uses Gui, stem Fire uses Ren",
            "ja": "頑金は丁が適当、旺土は甲を使い、支火は癸、幹火は壬",
            "zh-CN": "顽金宜丁，旺土用甲，支火宜癸，干火宜壬",
            "zh-TW": "頑金宜丁，旺土用甲，支火宜癸，幹火宜壬"
        },
        warning={
            "ko": "土가 너무 강하면 金이 묻혀 버림",
            "en": "Too strong Earth buries Metal",
            "ja": "土が強すぎると金が埋もれる",
            "zh-CN": "土太旺则金被埋",
            "zh-TW": "土太旺則金被埋"
        },
        original="辰月：頑金宜丁，旺土用甲，支火宜癸，幹火宜壬。"
    ),
    "巳": JohuEntry(
        day_master="庚", month="巳",
        primary_god="壬", secondary_god="戊",
        condition={
            "ko": "초여름 火가 왕성, 丙(병)火가 金을 녹이려 함, 壬(임)水로 제압 필요",
            "en": "Early summer Fire is strong, Bing tries to melt Metal, need Ren to control",
            "ja": "初夏火が旺盛、丙火が金を溶かそうとする、壬水で制圧が必要",
            "zh-CN": "初夏火旺，丙火欲熔金，需壬水制之",
            "zh-TW": "初夏火旺，丙火欲熔金，需壬水制之"
        },
        outcome={
            "ko": "丙은 金을 녹이지 못하나 壬(임수)으로 제압 좋음, 戊(무)土 丙(병)火가 보조, 支成金局이면 丁(정)火 사용",
            "en": "Bing cannot melt Metal but Ren controls well, Wu and Bing assist, if Metal frame use Ding",
            "ja": "丙は金を溶かせないが壬制が良い、戊土丙火が補佐、支成金局なら丁火を使う",
            "zh-CN": "丙不熔金惟喜壬制，戊土丙火为佐，支成金局用丁火",
            "zh-TW": "丙不熔金惟喜壬制，戊土丙火為佐，支成金局用丁火"
        },
        warning={
            "ko": "壬(임)水 없이 火만 강하면 金이 손상됨",
            "en": "Strong Fire without Ren damages Metal",
            "ja": "壬水なく火だけ強いと金が損傷",
            "zh-CN": "无壬水火旺则金伤",
            "zh-TW": "無壬水火旺則金傷"
        },
        original="巳月：丙不熔金惟喜壬制，次取戊土丙火為佐，支成金局用丁火。"
    ),
    "午": JohuEntry(
        day_master="庚", month="午",
        primary_god="壬", secondary_god="癸",
        condition={
            "ko": "한여름 火가 극왕, 金이 녹을 위험, 壬(임)水 조후 급선무",
            "en": "Midsummer Fire at peak, Metal risks melting, Ren for climate is urgent",
            "ja": "真夏火が極旺、金が溶ける危険、壬水調候が急務",
            "zh-CN": "盛夏火极旺，金有熔化之险，壬水调候为急",
            "zh-TW": "盛夏火極旺，金有熔化之險，壬水調候為急"
        },
        outcome={
            "ko": "오로지 壬(임)水 사용, 癸(계수)가 차선, 支에 庚(경)辛(신) 있어야 도움, 壬(임)癸(계) 없으면 戊(무)己(기)로 火기 설기",
            "en": "Use only Ren, Gui is secondary, need Geng/Xin in branches, without Ren/Gui use Wu/Ji to drain Fire",
            "ja": "專ら壬水を使い、癸が次、支に庚辛が必要、壬癸なければ戊己で火気を洩らす",
            "zh-CN": "专用壬水，癸次之，须支见庚辛为助，无壬癸用戊己泄火",
            "zh-TW": "專用壬水，癸次之，須支見庚辛為助，無壬癸用戊己泄火"
        },
        warning={
            "ko": "水 없으면 金이 녹아 형체를 잃음",
            "en": "Without Water, Metal melts and loses form",
            "ja": "水なければ金が溶けて形を失う",
            "zh-CN": "无水则金熔失形",
            "zh-TW": "無水則金熔失形"
        },
        original="午月：專用壬水，癸次之，須支見庚辛為助，無壬癸用戊己泄火。"
    ),
    "未": JohuEntry(
        day_master="庚", month="未",
        primary_god="甲", secondary_god="丁",
        condition={
            "ko": "늦여름 土가 왕성, 支成土局이면 甲(갑목) 먼저 丁(정화) 다음",
            "en": "Late summer Earth is strong, if Earth frame use Jia first then Ding",
            "ja": "晩夏土が旺盛、支成土局なら甲が先、丁が後",
            "zh-CN": "晚夏土旺，若支成土局甲先丁后",
            "zh-TW": "晚夏土旺，若支成土局甲先丁後"
        },
        outcome={
            "ko": "支가 土局이면 甲(갑)木 먼저, 丁(정)火 다음",
            "en": "If branches form Earth frame, Jia first, Ding second",
            "ja": "支が土局なら甲木が先、丁火が後",
            "zh-CN": "若支成土局，甲先丁后",
            "zh-TW": "若支成土局，甲先丁後"
        },
        warning={
            "ko": "土가 너무 두꺼우면 金이 묻혀 버림",
            "en": "Too thick Earth buries Metal",
            "ja": "土が厚すぎると金が埋もれる",
            "zh-CN": "土太厚金被埋",
            "zh-TW": "土太厚金被埋"
        },
        original="未月：若支成土局，甲先丁後。"
    ),
    "申": JohuEntry(
        day_master="庚", month="申",
        primary_god="丁", secondary_god="甲",
        condition={
            "ko": "초가을 庚(경)金이 건록(建祿)을 얻어 강함, 丁(정)火로 단련 필요",
            "en": "Early autumn Geng Metal gains strength at Shen, needs Ding to temper",
            "ja": "初秋庚金が建禄を得て強い、丁火で鍛錬が必要",
            "zh-CN": "初秋庚金得禄而强，需丁火锻炼",
            "zh-TW": "初秋庚金得祿而強，需丁火鍛煉"
        },
        outcome={
            "ko": "오로지 丁(정)火 사용, 甲(갑목)으로 丁(정화)을 끌어냄",
            "en": "Use only Ding Fire, draw Ding with Jia",
            "ja": "專ら丁火を使い、甲で丁を引く",
            "zh-CN": "专用丁火，以甲引丁",
            "zh-TW": "專用丁火，以甲引丁"
        },
        warning={
            "ko": "丁(정)火 없으면 金이 단련되지 않아 도구가 되지 못함",
            "en": "Without Ding, Metal cannot be tempered into a tool",
            "ja": "丁火なければ金が鍛錬されず道具になれない",
            "zh-CN": "无丁火金不成器",
            "zh-TW": "無丁火金不成器"
        },
        original="申月：專用丁火，以甲引丁。"
    ),
    "酉": JohuEntry(
        day_master="庚", month="酉",
        primary_god="丁", secondary_god="丙",
        condition={
            "ko": "가을 庚(경)金이 가장 강함, 丁(정)火로 단련하고 丙(병)火로 조후",
            "en": "Autumn Geng Metal is strongest, temper with Ding, climate with Bing",
            "ja": "秋の庚金が最も強い、丁火で鍛錬し丙火で調候",
            "zh-CN": "秋季庚金最强，丁火锻炼丙火调候",
            "zh-TW": "秋季庚金最強，丁火鍛煉丙火調候"
        },
        outcome={
            "ko": "丁(정)火로 金을 단련(煆金)하고, 겸하여 丙(병)火로 조후",
            "en": "Temper Metal with Ding, also use Bing for climate",
            "ja": "丁火で金を鍛錬し、兼ねて丙火で調候",
            "zh-CN": "用丁火煆金，兼用丙火调候",
            "zh-TW": "用丁火煆金，兼用丙火調候"
        },
        warning={
            "ko": "火 없으면 金이 너무 강해 예리하지만 용도 없음",
            "en": "Without Fire, Metal is too strong, sharp but useless",
            "ja": "火なければ金が強すぎて鋭いが用途なし",
            "zh-CN": "无火则金过刚锐而无用",
            "zh-TW": "無火則金過剛銳而無用"
        },
        original="酉月：用丁火煆金，兼用丙火調候。"
    ),
    "戌": JohuEntry(
        day_master="庚", month="戌",
        primary_god="甲", secondary_god="壬",
        condition={
            "ko": "늦가을 土가 다시 왕성, 金이 묻힐 위험, 甲(갑목)으로 소통 필요",
            "en": "Late autumn Earth strong again, Metal risks being buried, need Jia to loosen",
            "ja": "晩秋土が再び旺盛、金が埋もれる危険、甲で疏通が必要",
            "zh-CN": "晚秋土复旺，金有被埋之险，需甲木疏通",
            "zh-TW": "晚秋土復旺，金有被埋之險，需甲木疏通"
        },
        outcome={
            "ko": "土가 두꺼우면 甲(갑목)으로 먼저 소통, 다음 壬(임수)으로 씻음",
            "en": "If Earth thick, first loosen with Jia, then wash with Ren",
            "ja": "土が厚ければ甲で先に疏通、次に壬で洗う",
            "zh-CN": "土厚先用甲疏，次用壬洗",
            "zh-TW": "土厚先用甲疏，次用壬洗"
        },
        warning={
            "ko": "甲(갑목) 없으면 金이 土에 묻혀 빛나지 못함",
            "en": "Without Jia, Metal buried in Earth cannot shine",
            "ja": "甲なければ金が土に埋もれて輝けない",
            "zh-CN": "无甲则金埋土中不发光",
            "zh-TW": "無甲則金埋土中不發光"
        },
        original="戌月：土厚先用甲疏，次用壬洗。"
    ),
    "亥": JohuEntry(
        day_master="庚", month="亥",
        primary_god="丙", secondary_god="丁",
        condition={
            "ko": "초겨울 水가 왕성, 金이 차가워짐, 丙(병)丁(정)으로 따뜻하게",
            "en": "Early winter Water strong, Metal gets cold, warm with Bing/Ding",
            "ja": "初冬水が旺盛、金が冷える、丙丁で暖める",
            "zh-CN": "初冬水旺金寒，需丙丁暖之",
            "zh-TW": "初冬水旺金寒，需丙丁暖之"
        },
        outcome={
            "ko": "水가 차갑고 金이 추우니 丙(병)丁(정)을 좋아함, 甲(갑)木이 丁(정화)을 도움",
            "en": "Cold Water and cold Metal love Bing/Ding, Jia assists Ding",
            "ja": "水が冷たく金が寒いので丙丁を好む、甲木が丁を助ける",
            "zh-CN": "水冷金寒爱丙丁，甲木辅丁",
            "zh-TW": "水冷金寒愛丙丁，甲木輔丁"
        },
        warning={
            "ko": "丙(병)丁(정) 없으면 金이 얼어 생기 없음",
            "en": "Without Bing/Ding, Metal freezes and loses vitality",
            "ja": "丙丁なければ金が凍って生気なし",
            "zh-CN": "无丙丁金冻无生气",
            "zh-TW": "無丙丁金凍無生氣"
        },
        original="亥月：水冷金寒愛丙丁，甲木輔丁。"
    ),
    "子": JohuEntry(
        day_master="庚", month="子",
        primary_god="丁", secondary_god="甲",
        condition={
            "ko": "한겨울 水가 극왕, 金이 더욱 차가움, 丁甲(갑목) 필요",
            "en": "Midwinter Water at peak, Metal even colder, need Ding and Jia",
            "ja": "真冬水が極旺、金がさらに寒い、丁甲が必要",
            "zh-CN": "隆冬水极旺，金更寒，需丁甲",
            "zh-TW": "隆冬水極旺，金更寒，需丁甲"
        },
        outcome={
            "ko": "여전히 丁甲(갑목)을 취하고, 다음 丙(병)火로 따뜻하게",
            "en": "Still use Ding and Jia, then Bing for warmth",
            "ja": "なお丁甲を取り、次に丙火で暖める",
            "zh-CN": "仍取丁甲，次取丙火照暖",
            "zh-TW": "仍取丁甲，次取丙火照暖"
        },
        warning={
            "ko": "金水만 있고 火 없으면 고빈(孤貧)함",
            "en": "Only Metal and Water without Fire means poverty",
            "ja": "金水だけで火なければ孤貧",
            "zh-CN": "一派金水无火则孤贫",
            "zh-TW": "一派金水無火則孤貧"
        },
        original="子月：仍取丁甲，次取丙火照暖。"
    ),
    "丑": JohuEntry(
        day_master="庚", month="丑",
        primary_god="丁", secondary_god="甲",
        condition={
            "ko": "늦겨울 한습(寒濕)의 土, 金이 여전히 차가움, 丁甲(갑목) 필요",
            "en": "Late winter cold-damp Earth, Metal still cold, need Ding and Jia",
            "ja": "晩冬の寒湿な土、金がまだ寒い、丁甲が必要",
            "zh-CN": "晚冬寒湿之土，金仍寒，需丁甲",
            "zh-TW": "晚冬寒濕之土，金仍寒，需丁甲"
        },
        outcome={
            "ko": "여전히 丁甲(갑목)이 필요하고, 다음 丙(병)火로 따뜻하게",
            "en": "Still need Ding and Jia, then Bing for warmth",
            "ja": "なお丁甲が必要、次に丙火で暖める",
            "zh-CN": "仍须丁甲，次取丙火照暖",
            "zh-TW": "仍須丁甲，次取丙火照暖"
        },
        warning={
            "ko": "丙(병)丁(정)이 寅巳午未戌에 통근해야 효력 있음",
            "en": "Bing/Ding must root in Yin/Si/Wu/Wei/Xu to be effective",
            "ja": "丙丁が寅巳午未戌に通根してこそ効力あり",
            "zh-CN": "丙丁须寅巳午未戌通根方有效",
            "zh-TW": "丙丁須寅巳午未戌通根方有效"
        },
        original="丑月：仍須丁甲，次取丙火照暖。"
    ),
}


# =============================================================================
# 辛金 (신금) - 보석, 귀금속
# 원문: 窮通寶鑑 1278-1292줄
# =============================================================================
XIN_METAL: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="辛", month="寅",
        primary_god="己", secondary_god="壬",
        condition={
            "ko": "초봄 辛(신)金이 령(令)을 잃음, 己(기)土로 생신(生身)의 근본",
            "en": "Early spring Xin Metal loses command, Ji Earth is the foundation for life",
            "ja": "初春辛金が令を失う、己土で生身の根本",
            "zh-CN": "初春辛金失令，己土为生身之本",
            "zh-TW": "初春辛金失令，己土為生身之本"
        },
        outcome={
            "ko": "己(기)土로 생신의 본, 壬(임)水의 공에 의지, 壬己(기토) 병용하고 庚(경금)이 도움",
            "en": "Ji as life foundation, rely on Ren's merit, use Ren and Ji together, Geng assists",
            "ja": "己土で生身の本、壬水の功に頼る、壬己を併用し庚が助ける",
            "zh-CN": "己土为生身之本，全赖壬水之功，壬己并用以庚为助",
            "zh-TW": "己土為生身之本，全賴壬水之功，壬己並用以庚為助"
        },
        warning={
            "ko": "己(기)土 없으면 辛(신)金이 生을 받지 못함",
            "en": "Without Ji, Xin Metal cannot receive life",
            "ja": "己土なければ辛金が生を受けられない",
            "zh-CN": "无己土辛金不得生",
            "zh-TW": "無己土辛金不得生"
        },
        original="寅月：取己土為生身之本，全賴壬水之功，壬己並用以庚為助。"
    ),
    "卯": JohuEntry(
        day_master="辛", month="卯",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "봄 乙(을)木이 왕성, 壬(임)水가 존귀함",
            "en": "Spring Yi Wood is strong, Ren Water is noble",
            "ja": "春の乙木が旺盛、壬水が尊貴",
            "zh-CN": "春季乙木旺，壬水为尊",
            "zh-TW": "春季乙木旺，壬水為尊"
        },
        outcome={
            "ko": "壬(임)水가 존귀, 戊(무)己(기) 보이면 병이 되니 甲(갑목)으로 제복",
            "en": "Ren is noble, if Wu/Ji appear they become illness, use Jia to control",
            "ja": "壬水が尊貴、戊己が見えれば病となり甲で制伏",
            "zh-CN": "壬水为尊，见戊己为病须甲制伏",
            "zh-TW": "壬水為尊，見戊己為病須甲制伏"
        },
        warning={
            "ko": "戊(무)己(기)가 壬(임)水를 막으면 辛(신)金이 빛나지 못함",
            "en": "If Wu/Ji block Ren, Xin Metal cannot shine",
            "ja": "戊己が壬水を塞ぐと辛金が輝けない",
            "zh-CN": "戊己阻壬则辛金不明",
            "zh-TW": "戊己阻壬則辛金不明"
        },
        original="卯月：壬水為尊，見戊己為病須甲制伏。"
    ),
    "辰": JohuEntry(
        day_master="辛", month="辰",
        primary_god="壬", secondary_god="癸",
        condition={
            "ko": "늦봄 土왕절, 丙(병)火가 辛(신금)과 합하면 癸(계수)로 丙(병화) 제거 필요",
            "en": "Late spring Earth rules, if Bing combines with Xin, need Gui to control Bing",
            "ja": "晩春土旺節、丙火が辛と合すれば癸で丙を制御",
            "zh-CN": "晚春土旺，若丙火合辛须癸制丙",
            "zh-TW": "晚春土旺，若丙火合辛須癸制丙"
        },
        outcome={
            "ko": "丙(병)火가 辛(신금)과 합하면 癸(계수)로 丙(병화) 제거, 支에 亥子申 보이면 귀함",
            "en": "If Bing combines with Xin, use Gui to control Bing, seeing Hai/Zi/Shen in branches is noble",
            "ja": "丙火が辛と合すれば癸で丙を制御、支に亥子申があれば貴",
            "zh-CN": "若见丙火合辛须有癸制丙，支见亥子申为贵",
            "zh-TW": "若見丙火合辛須有癸制丙，支見亥子申為貴"
        },
        warning={
            "ko": "丙辛合으로 변화하면 辛(신)金 본성 잃음",
            "en": "If Bing-Xin combine and transform, Xin loses its nature",
            "ja": "丙辛合で変化すると辛金の本性を失う",
            "zh-CN": "丙辛合化则辛金失本性",
            "zh-TW": "丙辛合化則辛金失本性"
        },
        original="辰月：若見丙火合辛須有癸制丙，支見亥子申為貴。"
    ),
    "巳": JohuEntry(
        day_master="辛", month="巳",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "초여름 火가 왕성, 壬(임)水로 도세(淘洗)하고 조후",
            "en": "Early summer Fire is strong, wash with Ren and balance climate",
            "ja": "初夏火が旺盛、壬水で淘洗し調候",
            "zh-CN": "初夏火旺，壬水淘洗兼调候",
            "zh-TW": "初夏火旺，壬水淘洗兼調候"
        },
        outcome={
            "ko": "壬(임)水로 씻고 조후도 됨, 甲(갑)木으로 戊(무토)를 제압하면 철저히 깨끗",
            "en": "Wash with Ren for climate too, Jia controlling Wu makes it perfectly clean",
            "ja": "壬水で淘洗し調候も兼ね、甲木で戊を制すれば徹底的に清い",
            "zh-CN": "壬水淘洗兼有调候，更有甲木制戊一清彻底",
            "zh-TW": "壬水淘洗兼有調候，更有甲木制戊一清徹底"
        },
        warning={
            "ko": "壬(임)水 없으면 辛(신)金이 더럽혀지고 빛나지 못함",
            "en": "Without Ren, Xin Metal becomes dirty and cannot shine",
            "ja": "壬水なければ辛金が汚れて輝けない",
            "zh-CN": "无壬水辛金污浊不明",
            "zh-TW": "無壬水辛金污濁不明"
        },
        original="巳月：壬水淘洗兼有調候，更有甲木制戊一清徹底。"
    ),
    "午": JohuEntry(
        day_master="辛", month="午",
        primary_god="壬", secondary_god="己",
        condition={
            "ko": "한여름 火가 극왕, 壬己(기토) 병용 필요",
            "en": "Midsummer Fire at peak, need Ren and Ji together",
            "ja": "真夏火が極旺、壬己の併用が必要",
            "zh-CN": "盛夏火极旺，需壬己并用",
            "zh-TW": "盛夏火極旺，需壬己並用"
        },
        outcome={
            "ko": "壬己(기토) 병용, 壬(임수) 없으면 癸(계수) 사용",
            "en": "Use Ren and Ji together, without Ren use Gui",
            "ja": "壬己を併用、壬なければ癸を使う",
            "zh-CN": "壬己并用，无壬用癸",
            "zh-TW": "壬己並用，無壬用癸"
        },
        warning={
            "ko": "壬(임수) 없으면 辛(신)金이 火에 녹을 위험",
            "en": "Without Ren, Xin Metal risks melting in Fire",
            "ja": "壬なければ辛金が火に溶ける危険",
            "zh-CN": "无壬辛金有被火熔之险",
            "zh-TW": "無壬辛金有被火熔之險"
        },
        original="午月：壬己並用，無壬用癸。"
    ),
    "未": JohuEntry(
        day_master="辛", month="未",
        primary_god="壬", secondary_god="庚",
        condition={
            "ko": "늦여름 土가 왕성, 壬(임)水 먼저 庚(경금)이 보조",
            "en": "Late summer Earth is strong, Ren first with Geng assisting",
            "ja": "晩夏土が旺盛、壬水が先、庚が補佐",
            "zh-CN": "晚夏土旺，先壬水，庚为佐",
            "zh-TW": "晚夏土旺，先壬水，庚為佐"
        },
        outcome={
            "ko": "壬(임)水 먼저, 庚(경금)을 보조로, 戊(무토) 노출 꺼리니 甲(갑목)으로 제압하면 길함",
            "en": "Ren first, Geng assists, avoid Wu showing, Jia controlling it is auspicious",
            "ja": "壬水が先、庚を補佐とし、戊の露出を忌み甲で制すれば吉",
            "zh-CN": "先用壬水，取庚为佐，忌戊出得甲制之方吉",
            "zh-TW": "先用壬水，取庚為佐，忌戊出得甲制之方吉"
        },
        warning={
            "ko": "戊(무)土가 壬(임)水를 막으면 흉함",
            "en": "If Wu Earth blocks Ren Water, inauspicious",
            "ja": "戊土が壬水を塞ぐと凶",
            "zh-CN": "戊土阻壬则凶",
            "zh-TW": "戊土阻壬則凶"
        },
        original="未月：先用壬水，取庚為佐，忌戊出得甲制之方吉。"
    ),
    "申": JohuEntry(
        day_master="辛", month="申",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "초가을 金이 건록, 壬(임)水가 존귀",
            "en": "Early autumn Metal gains strength, Ren Water is noble",
            "ja": "初秋金が建禄、壬水が尊貴",
            "zh-CN": "初秋金得禄，壬水为尊",
            "zh-TW": "初秋金得祿，壬水為尊"
        },
        outcome={
            "ko": "壬(임)水가 존귀, 甲戊(무토) 상황에 따라 사용, 癸(계)水는 불가",
            "en": "Ren is noble, use Jia/Wu as needed, Gui Water is not allowed",
            "ja": "壬水が尊貴、甲戊は状況次第、癸水は不可",
            "zh-CN": "壬水为尊，甲戊酌用，不可用癸水",
            "zh-TW": "壬水為尊，甲戊酌用，不可用癸水"
        },
        warning={
            "ko": "癸(계)水를 쓰면 辛(신)金이 탁해져 빛나지 못함",
            "en": "Using Gui makes Xin Metal murky and unable to shine",
            "ja": "癸水を使うと辛金が濁って輝けない",
            "zh-CN": "用癸水辛金浊而不明",
            "zh-TW": "用癸水辛金濁而不明"
        },
        original="申月：壬水為尊，甲戊酌用，不可用癸水。"
    ),
    "酉": JohuEntry(
        day_master="辛", month="酉",
        primary_god="壬", secondary_god="丁",
        condition={
            "ko": "가을 辛(신)金이 가장 강함, 壬(임)水로 씻음",
            "en": "Autumn Xin Metal is strongest, wash with Ren",
            "ja": "秋の辛金が最も強い、壬水で淘洗",
            "zh-CN": "秋季辛金最强，壬水淘洗",
            "zh-TW": "秋季辛金最強，壬水淘洗"
        },
        outcome={
            "ko": "壬(임)水로 씻고, 戊(무)己(기) 보이면 甲(갑목)으로 土 제압, 支成金局에 壬(임수) 없으면 丁(정)火 사용",
            "en": "Wash with Ren, if Wu/Ji appear use Jia to control, if Metal frame without Ren use Ding",
            "ja": "壬水で淘洗、戊己が見えれば甲で土を制す、支成金局で壬なければ丁火を使う",
            "zh-CN": "壬水淘洗，如见戊己须甲制土，支成金局无壬须用丁火",
            "zh-TW": "壬水淘洗，如見戊己須甲制土，支成金局無壬須用丁火"
        },
        warning={
            "ko": "金이 너무 강한데 壬(임수) 없으면 탁해져 쓸모없음",
            "en": "Too strong Metal without Ren becomes murky and useless",
            "ja": "金が強すぎて壬なければ濁って役立たず",
            "zh-CN": "金太旺无壬则浊而无用",
            "zh-TW": "金太旺無壬則濁而無用"
        },
        original="酉月：壬水淘洗，如見戊己須甲制土，支成金局無壬須用丁火。"
    ),
    "戌": JohuEntry(
        day_master="辛", month="戌",
        primary_god="壬", secondary_god="甲",
        condition={
            "ko": "늦가을 9월 辛(신)金, 火土가 병, 水木이 용",
            "en": "Late autumn 9th month Xin Metal, Fire/Earth are illness, Water/Wood are medicine",
            "ja": "晩秋9月辛金、火土が病、水木が用",
            "zh-CN": "九月辛金，火土为病，水木为用",
            "zh-TW": "九月辛金，火土為病，水木為用"
        },
        outcome={
            "ko": "火土가 병이고, 水木이 용신",
            "en": "Fire/Earth are illness, Water/Wood are the useful gods",
            "ja": "火土が病、水木が用神",
            "zh-CN": "火土为病，水木为用",
            "zh-TW": "火土為病，水木為用"
        },
        warning={
            "ko": "土가 너무 강하면 辛(신)金이 묻혀 버림",
            "en": "Too strong Earth buries Xin Metal",
            "ja": "土が強すぎると辛金が埋もれる",
            "zh-CN": "土太旺辛金被埋",
            "zh-TW": "土太旺辛金被埋"
        },
        original="戌月：火土為病，水木為用。"
    ),
    "亥": JohuEntry(
        day_master="辛", month="亥",
        primary_god="壬", secondary_god="丙",
        condition={
            "ko": "초겨울 水가 왕성, 壬(임수) 먼저 丙(병화) 다음, 금백수청(金白水清)",
            "en": "Early winter Water strong, Ren first then Bing, Metal-white Water-clear",
            "ja": "初冬水が旺盛、壬が先、丙が後、金白水清",
            "zh-CN": "初冬水旺，先壬后丙，名金白水清",
            "zh-TW": "初冬水旺，先壬後丙，名金白水清"
        },
        outcome={
            "ko": "壬(임수) 먼저 丙(병화) 다음, 이름하여 금백수청(金白水清)",
            "en": "Ren first then Bing, called Metal-white Water-clear",
            "ja": "壬が先、丙が後、名を金白水清",
            "zh-CN": "先壬后丙，名金白水清",
            "zh-TW": "先壬後丙，名金白水清"
        },
        warning={
            "ko": "丙(병화) 없으면 水가 차가워 金도 얼음",
            "en": "Without Bing, Water is cold and Metal freezes",
            "ja": "丙なければ水が冷たく金も凍る",
            "zh-CN": "无丙水寒金冻",
            "zh-TW": "無丙水寒金凍"
        },
        original="亥月：先壬後丙，名金白水清。"
    ),
    "子": JohuEntry(
        day_master="辛", month="子",
        primary_god="丙", secondary_god="壬",
        condition={
            "ko": "한겨울 水가 극왕, 丙(병)火 따뜻함이 반드시 필요",
            "en": "Midwinter Water at peak, Bing Fire warmth is essential",
            "ja": "真冬水が極旺、丙火の温かさが必須",
            "zh-CN": "隆冬水极旺，丙火温暖不可缺",
            "zh-TW": "隆冬水極旺，丙火溫暖不可缺"
        },
        outcome={
            "ko": "丙(병)火 따뜻함을 빠뜨릴 수 없음",
            "en": "Cannot do without Bing Fire warmth",
            "ja": "丙火の温かさを欠かせない",
            "zh-CN": "不能缺丙火温暖",
            "zh-TW": "不能缺丙火溫暖"
        },
        warning={
            "ko": "丙(병화) 없으면 辛(신)金이 얼어 빛나지 못함",
            "en": "Without Bing, Xin Metal freezes and cannot shine",
            "ja": "丙なければ辛金が凍って輝けない",
            "zh-CN": "无丙辛金冻不发光",
            "zh-TW": "無丙辛金凍不發光"
        },
        original="子月：不能缺丙火溫暖。"
    ),
    "丑": JohuEntry(
        day_master="辛", month="丑",
        primary_god="丙", secondary_god="壬",
        condition={
            "ko": "늦겨울 한습(寒濕)의 土, 丙(병)火가 반드시 필요",
            "en": "Late winter cold-damp Earth, Bing Fire is essential",
            "ja": "晩冬の寒湿な土、丙火が必須",
            "zh-CN": "晚冬寒湿之土，丙火不可少",
            "zh-TW": "晚冬寒濕之土，丙火不可少"
        },
        outcome={
            "ko": "丙(병화) 먼저 壬(임수) 다음, 戊(무)己(기) 그 다음, 丙(병)火는 빠질 수 없음",
            "en": "Bing first then Ren, then Wu/Ji, Bing cannot be missing",
            "ja": "丙が先、壬が後、戊己がその次、丙火は欠かせない",
            "zh-CN": "丙先壬后，戊己次之，丙火不可少",
            "zh-TW": "丙先壬後，戊己次之，丙火不可少"
        },
        warning={
            "ko": "丙(병화) 없으면 辛(신)金이 얼어 생기 없음",
            "en": "Without Bing, Xin Metal freezes and loses vitality",
            "ja": "丙なければ辛金が凍って生気なし",
            "zh-CN": "无丙辛金冻无生气",
            "zh-TW": "無丙辛金凍無生氣"
        },
        original="丑月：丙先壬後，戊己次之，丙火不可少。"
    ),
}


# =============================================================================
# 壬水 (임수) - 큰 강, 바다
# 원문: 窮通寶鑑 1450-1463줄
# =============================================================================
REN_WATER: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="壬", month="寅",
        primary_god="庚", secondary_god="丙",
        condition={
            "ko": "초봄 壬(임)水가 장생(長生)을 얻음, 비겁 없으면 戊(무토) 불필요",
            "en": "Early spring Ren Water gains Long Life, without parallels no need for Wu",
            "ja": "初春壬水が長生を得る、比劫なければ戊不要",
            "zh-CN": "初春壬水得长生，无比劫不必用戊",
            "zh-TW": "初春壬水得長生，無比劫不必用戊"
        },
        outcome={
            "ko": "비겁 없으면 戊(무토) 불필요, 오로지 庚(경)金 사용, 丙(병)火가 보조",
            "en": "Without parallels no need for Wu, use only Geng, Bing assists",
            "ja": "比劫なければ戊不要、專ら庚金を使い、丙火が補佐",
            "zh-CN": "无比劫不必用戊，专用庚金，丙火为佐",
            "zh-TW": "無比劫不必用戊，專用庚金，丙火為佐"
        },
        warning={
            "ko": "庚(경금) 없으면 水의 원천이 끊겨 말라버림",
            "en": "Without Geng, Water source is cut off and dries up",
            "ja": "庚なければ水の源が断たれ干上がる",
            "zh-CN": "无庚则水源断绝而干涸",
            "zh-TW": "無庚則水源斷絕而乾涸"
        },
        original="寅月：無比劫不必用戊，專用庚金，丙火為佐。"
    ),
    "卯": JohuEntry(
        day_master="壬", month="卯",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "삼춘(三春) 壬(임)水가 절지(絕地), 庚(경)辛(신)으로 수의 원천 필요",
            "en": "Three springs Ren Water at Death place, need Geng/Xin for water source",
            "ja": "三春壬水が絶地、庚辛で水の源が必要",
            "zh-CN": "三春壬水绝地，需庚辛发水源",
            "zh-TW": "三春壬水絕地，需庚辛發水源"
        },
        outcome={
            "ko": "庚(경)辛(신)으로 수의 원천 발동, 水가 많으면 戊(무토) 사용",
            "en": "Geng/Xin activate water source, if much Water use Wu",
            "ja": "庚辛で水の源を発動、水が多ければ戊を使う",
            "zh-CN": "取庚辛发水之源，水多用戊",
            "zh-TW": "取庚辛發水之源，水多用戊"
        },
        warning={
            "ko": "金 없으면 水의 원천 없어 고갈됨",
            "en": "Without Metal, Water has no source and dries up",
            "ja": "金なければ水の源がなく枯渇",
            "zh-CN": "无金则水无源而枯竭",
            "zh-TW": "無金則水無源而枯竭"
        },
        original="卯月：取庚辛發水之源，水多用戊。"
    ),
    "辰": JohuEntry(
        day_master="壬", month="辰",
        primary_god="甲", secondary_god="庚",
        condition={
            "ko": "늦봄 土왕절, 甲(갑목)으로 계토(季土) 소통 필요",
            "en": "Late spring Earth rules, need Jia to loosen seasonal Earth",
            "ja": "晩春土旺節、甲で季土を疏通",
            "zh-CN": "晚春土旺，需甲疏季土",
            "zh-TW": "晚春土旺，需甲疏季土"
        },
        outcome={
            "ko": "甲(갑목)으로 계토 소통, 다음 庚(경)金으로 수 원천, 金 많으면 丙(병화)으로 제압",
            "en": "Jia loosens seasonal Earth, then Geng for water source, if much Metal use Bing to control",
            "ja": "甲で季土を疏通、次に庚金で水源、金多ければ丙で制す",
            "zh-CN": "甲疏季土，次取庚金发水源，金多须丙制",
            "zh-TW": "甲疏季土，次取庚金發水源，金多須丙制"
        },
        warning={
            "ko": "甲(갑목) 없으면 土가 水를 막아 흐르지 못함",
            "en": "Without Jia, Earth blocks Water from flowing",
            "ja": "甲なければ土が水を塞ぎ流れない",
            "zh-CN": "无甲土塞水不流",
            "zh-TW": "無甲土塞水不流"
        },
        original="辰月：甲疏季土，次取庚金發水源，金多須丙制。"
    ),
    "巳": JohuEntry(
        day_master="壬", month="巳",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "초여름 壬(임)水가 약극(弱極), 庚(경)辛(신)으로 원천 필요",
            "en": "Early summer Ren Water is extremely weak, need Geng/Xin for source",
            "ja": "初夏壬水が弱極、庚辛で源が必要",
            "zh-CN": "初夏壬水弱极，需庚辛为源",
            "zh-TW": "初夏壬水弱極，需庚辛為源"
        },
        outcome={
            "ko": "庚(경)辛(신)으로 원천 삼고, 壬(임)癸(계) 비겁이 도움",
            "en": "Geng/Xin as source, Ren/Gui parallels assist",
            "ja": "庚辛で源とし、壬癸の比劫が助ける",
            "zh-CN": "取庚辛为源，壬癸比助",
            "zh-TW": "取庚辛為源，壬癸比助"
        },
        warning={
            "ko": "金 없으면 水가 완전히 마름",
            "en": "Without Metal, Water completely dries up",
            "ja": "金なければ水が完全に乾く",
            "zh-CN": "无金水完全干涸",
            "zh-TW": "無金水完全乾涸"
        },
        original="巳月：壬水弱極，取庚辛為源，壬癸比助。"
    ),
    "午": JohuEntry(
        day_master="壬", month="午",
        primary_god="庚", secondary_god="癸",
        condition={
            "ko": "한여름 火가 극왕, 庚(경금)으로 원천, 癸(계수)로 보조",
            "en": "Midsummer Fire at peak, Geng for source, Gui assists",
            "ja": "真夏火が極旺、庚で源、癸で補佐",
            "zh-CN": "盛夏火极旺，庚为源，癸为佐",
            "zh-TW": "盛夏火極旺，庚為源，癸為佐"
        },
        outcome={
            "ko": "庚(경금)으로 원천, 癸(계수)로 보조, 庚(경금) 없으면 辛(신금) 사용",
            "en": "Geng for source, Gui assists, without Geng use Xin",
            "ja": "庚で源、癸で補佐、庚なければ辛を使う",
            "zh-CN": "取庚为源，取癸为佐，无庚用辛",
            "zh-TW": "取庚為源，取癸為佐，無庚用辛"
        },
        warning={
            "ko": "金 없으면 水가 말라 형체 없음",
            "en": "Without Metal, Water dries up and loses form",
            "ja": "金なければ水が乾いて形なし",
            "zh-CN": "无金水干无形",
            "zh-TW": "無金水乾無形"
        },
        original="午月：取庚為源，取癸為佐，無庚用辛。"
    ),
    "未": JohuEntry(
        day_master="壬", month="未",
        primary_god="辛", secondary_god="甲",
        condition={
            "ko": "늦여름 土가 왕성, 辛(신)金으로 수 원천 발동",
            "en": "Late summer Earth is strong, Xin Metal activates water source",
            "ja": "晩夏土が旺盛、辛金で水源を発動",
            "zh-CN": "晚夏土旺，辛金发水源",
            "zh-TW": "晚夏土旺，辛金發水源"
        },
        outcome={
            "ko": "辛(신)金으로 수 원천 발동, 甲(갑)木으로 土 소통",
            "en": "Xin activates water source, Jia loosens Earth",
            "ja": "辛金で水源を発動、甲木で土を疏通",
            "zh-CN": "以辛金发水源，甲木疏土",
            "zh-TW": "以辛金發水源，甲木疏土"
        },
        warning={
            "ko": "土가 너무 두꺼우면 水가 막혀 흐르지 못함",
            "en": "Too thick Earth blocks Water from flowing",
            "ja": "土が厚すぎると水が塞がれ流れない",
            "zh-CN": "土太厚水被阻不流",
            "zh-TW": "土太厚水被阻不流"
        },
        original="未月：以辛金髮水源，甲木疏土。"
    ),
    "申": JohuEntry(
        day_master="壬", month="申",
        primary_god="丁", secondary_god="戊",
        condition={
            "ko": "초가을 壬(임)水가 장생, 丁(정)火로 보조하고 戊(무토)로 庚(경금) 제압",
            "en": "Early autumn Ren Water gains Long Life, Ding assists, Wu controls Geng",
            "ja": "初秋壬水が長生、丁火で補佐し戊で庚を制す",
            "zh-CN": "初秋壬水长生，丁火佐，戊制庚",
            "zh-TW": "初秋壬水長生，丁火佐，戊制庚"
        },
        outcome={
            "ko": "丁(정)火로 보조하고 戊(무토)로 庚(경금) 제압",
            "en": "Ding assists, Wu controls Geng",
            "ja": "丁火で補佐し戊で庚を制す",
            "zh-CN": "取丁火佐戊制庚",
            "zh-TW": "取丁火佐戊制庚"
        },
        warning={
            "ko": "戊(무)土가 辰戌에 통근, 丁(정)火가 午戌에 통근해야 용",
            "en": "Wu must root in Chen/Xu, Ding must root in Wu/Xu to be useful",
            "ja": "戊土が辰戌に通根、丁火が午戌に通根してこそ用",
            "zh-CN": "戊土须辰戌通根，丁火须午戌通根方用",
            "zh-TW": "戊土須辰戌通根，丁火須午戌通根方用"
        },
        original="申月：取丁火佐戊制庚。"
    ),
    "酉": JohuEntry(
        day_master="壬", month="酉",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "가을 金이 왕성, 甲(갑목) 없으면 金으로 수 원천",
            "en": "Autumn Metal is strong, without Jia use Metal for water source",
            "ja": "秋の金が旺盛、甲なければ金で水源",
            "zh-CN": "秋季金旺，无甲用金发水源",
            "zh-TW": "秋季金旺，無甲用金發水源"
        },
        outcome={
            "ko": "甲(갑목) 없으면 金으로 수 원천, 이름하여 독수범경신(獨水犯庚(경)辛(신))",
            "en": "Without Jia use Metal for source, called Lone Water facing Geng/Xin",
            "ja": "甲なければ金で水源、名を獨水犯庚辛",
            "zh-CN": "无甲用金发水源，名独水犯庚辛",
            "zh-TW": "無甲用金發水源，名獨水犯庚辛"
        },
        warning={
            "ko": "水만 있고 制 없으면 범람함",
            "en": "Only Water without control causes flooding",
            "ja": "水だけで制がなければ氾濫",
            "zh-CN": "水无制则泛滥",
            "zh-TW": "水無制則氾濫"
        },
        original="酉月：無甲用金發水源，名獨水犯庚辛。"
    ),
    "戌": JohuEntry(
        day_master="壬", month="戌",
        primary_god="甲", secondary_god="丙",
        condition={
            "ko": "늦가을 土가 다시 왕성, 甲(갑목)으로 戌중 戊(무)土 제압",
            "en": "Late autumn Earth strong again, Jia controls Wu Earth in Xu",
            "ja": "晩秋土が再び旺盛、甲で戌中の戊土を制す",
            "zh-CN": "晚秋土复旺，以甲制戌中戊土",
            "zh-TW": "晚秋土復旺，以甲制戌中戊土"
        },
        outcome={
            "ko": "甲(갑목)으로 戌중 戊(무)土 제압, 丙(병)火가 보조",
            "en": "Jia controls Wu in Xu, Bing assists",
            "ja": "甲で戌中の戊土を制す、丙火が補佐",
            "zh-CN": "以甲制戌中戊土，丙火为佐",
            "zh-TW": "以甲制戌中戊土，丙火為佐"
        },
        warning={
            "ko": "甲(갑목) 없으면 土가 水를 막음",
            "en": "Without Jia, Earth blocks Water",
            "ja": "甲なければ土が水を塞ぐ",
            "zh-CN": "无甲土阻水",
            "zh-TW": "無甲土阻水"
        },
        original="戌月：以甲制戌中戊土，丙火為佐。"
    ),
    "亥": JohuEntry(
        day_master="壬", month="亥",
        primary_god="戊", secondary_god="庚",
        condition={
            "ko": "초겨울 壬(임)水가 건록, 甲(갑목)이 나와 戊(무토)를 제압하면 庚(경금)으로 구제",
            "en": "Early winter Ren Water at strength, if Jia emerges to control Wu, use Geng to save",
            "ja": "初冬壬水が建禄、甲が出て戊を制すれば庚で救う",
            "zh-CN": "初冬壬水建禄，若甲出制戊须以庚金为救",
            "zh-TW": "初冬壬水建祿，若甲出制戊須以庚金為救"
        },
        outcome={
            "ko": "甲(갑목)이 나와 戊(무토)를 제압하면, 庚(경)金으로 구제해야 함",
            "en": "If Jia emerges to control Wu, must use Geng to save",
            "ja": "甲が出て戊を制すれば、庚金で救わなければならない",
            "zh-CN": "若甲出制戊，须以庚金为救",
            "zh-TW": "若甲出制戊，須以庚金為救"
        },
        warning={
            "ko": "水가 너무 왕성하면 범람 위험",
            "en": "Too strong Water risks flooding",
            "ja": "水が旺盛すぎると氾濫の危険",
            "zh-CN": "水太旺有泛滥之险",
            "zh-TW": "水太旺有氾濫之險"
        },
        original="亥月：若甲出制戊，須以庚金為救。"
    ),
    "子": JohuEntry(
        day_master="壬", month="子",
        primary_god="戊", secondary_god="丙",
        condition={
            "ko": "한겨울 水가 극왕, 戊(무토)로 제방, 丙(병화)으로 조후",
            "en": "Midwinter Water at peak, Wu for dam, Bing for climate",
            "ja": "真冬水が極旺、戊で堤防、丙で調候",
            "zh-CN": "隆冬水极旺，戊为堤防，丙为调候",
            "zh-TW": "隆冬水極旺，戊為堤防，丙為調候"
        },
        outcome={
            "ko": "水 왕하면 戊(무토)가 마땅, 조후에 丙(병화), 丙戊(무토) 겸용",
            "en": "If Water strong use Wu, Bing for climate, use both Bing and Wu",
            "ja": "水旺なら戊が宜しい、調候に丙、丙戊を兼用",
            "zh-CN": "水旺宜戊，调候宜丙，丙戊兼用",
            "zh-TW": "水旺宜戊，調候宜丙，丙戊兼用"
        },
        warning={
            "ko": "戊(무토) 없으면 水가 범람하고, 丙(병화) 없으면 얼어붙음",
            "en": "Without Wu Water floods, without Bing Water freezes",
            "ja": "戊なければ水が氾濫、丙なければ凍りつく",
            "zh-CN": "无戊水泛滥，无丙水冻",
            "zh-TW": "無戊水氾濫，無丙水凍"
        },
        original="子月：水旺宜戊，調候宜丙，丙戊兼用。"
    ),
    "丑": JohuEntry(
        day_master="壬", month="丑",
        primary_god="丙", secondary_god="甲",
        condition={
            "ko": "늦겨울 한습(寒濕), 丙(병)火 조후 필수",
            "en": "Late winter cold-damp, Bing Fire for climate is essential",
            "ja": "晩冬寒湿、丙火調候必須",
            "zh-CN": "晚冬寒湿，丙火调候必须",
            "zh-TW": "晚冬寒濕，丙火調候必須"
        },
        outcome={
            "ko": "상반월은 오로지 丙(병)火, 하반월은 丙(병화) 사용하되 甲(갑)木이 보조",
            "en": "First half use only Bing, second half use Bing with Jia assisting",
            "ja": "上半月は專ら丙火、下半月は丙を使い甲木が補佐",
            "zh-CN": "上半月专用丙火，下半月用丙甲木为佐",
            "zh-TW": "上半月專用丙火，下半月用丙甲木為佐"
        },
        warning={
            "ko": "丙(병화) 없으면 水가 얼어 흐르지 못함",
            "en": "Without Bing, Water freezes and cannot flow",
            "ja": "丙なければ水が凍り流れない",
            "zh-CN": "无丙水冻不流",
            "zh-TW": "無丙水凍不流"
        },
        original="丑月：上半月專用丙火，下半月用丙甲木為佐。"
    ),
}


# =============================================================================
# 癸水 (계수) - 빗물, 이슬
# 원문: 窮通寶鑑 1590-1604줄
# =============================================================================
GUI_WATER: Dict[str, JohuEntry] = {
    "寅": JohuEntry(
        day_master="癸", month="寅",
        primary_god="辛", secondary_god="丙",
        condition={
            "ko": "초봄 癸(계)水가 휴수(休囚), 辛(신금)으로 水 원천 생함",
            "en": "Early spring Gui Water is weak, Xin generates water source",
            "ja": "初春癸水が休囚、辛で水源を生む",
            "zh-CN": "初春癸水休囚，辛生水源",
            "zh-TW": "初春癸水休囚，辛生水源"
        },
        outcome={
            "ko": "辛(신금)으로 癸(계)水 원천, 辛(신금) 없으면 庚(경금), 丙(병화) 빠질 수 없음",
            "en": "Xin for Gui source, without Xin use Geng, Bing cannot be missing",
            "ja": "辛で癸水の源、辛なければ庚、丙は欠かせない",
            "zh-CN": "用辛生癸水为源，无辛用庚，丙不可少",
            "zh-TW": "用辛生癸水為源，無辛用庚，丙不可少"
        },
        warning={
            "ko": "金 없으면 水의 원천 없어 마름",
            "en": "Without Metal, Water has no source and dries up",
            "ja": "金なければ水の源がなく乾く",
            "zh-CN": "无金水无源而干",
            "zh-TW": "無金水無源而乾"
        },
        original="寅月：用辛生癸水為源，無辛用庚，丙不可少。"
    ),
    "卯": JohuEntry(
        day_master="癸", month="卯",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "봄 乙(을)木이 사령, 오로지 庚(경)金 사용",
            "en": "Spring Yi Wood commands, use only Geng Metal",
            "ja": "春の乙木が司令、專ら庚金を使う",
            "zh-CN": "春季乙木司令，专用庚金",
            "zh-TW": "春季乙木司令，專用庚金"
        },
        outcome={
            "ko": "乙(을)木이 사령, 오로지 庚(경)金, 辛(신)金이 차선",
            "en": "Yi Wood commands, use only Geng, Xin is secondary",
            "ja": "乙木が司令、專ら庚金、辛金が次",
            "zh-CN": "乙木司令，专用庚金，辛金为次",
            "zh-TW": "乙木司令，專用庚金，辛金為次"
        },
        warning={
            "ko": "庚(경금) 없으면 水의 원천 끊김",
            "en": "Without Geng, Water source is cut off",
            "ja": "庚なければ水の源が断たれる",
            "zh-CN": "无庚水源断",
            "zh-TW": "無庚水源斷"
        },
        original="卯月：乙木司令，專用庚金，辛金為次。"
    ),
    "辰": JohuEntry(
        day_master="癸", month="辰",
        primary_god="丙", secondary_god="辛",
        condition={
            "ko": "늦봄 土왕절, 상반월은 丙(병)火, 하반월은 辛甲(갑목) 보조",
            "en": "Late spring Earth rules, first half Bing, second half Xin and Jia assist",
            "ja": "晩春土旺節、上半月は丙火、下半月は辛甲が補佐",
            "zh-CN": "晚春土旺，上半月专用丙火，下半月辛甲为佐",
            "zh-TW": "晚春土旺，上半月專用丙火，下半月辛甲為佐"
        },
        outcome={
            "ko": "상반월은 오로지 丙(병)火, 하반월은 丙(병)火 쓰되 辛甲(갑목)이 보조",
            "en": "First half use only Bing, second half use Bing with Xin and Jia assisting",
            "ja": "上半月は專ら丙火、下半月は丙火を使い辛甲が補佐",
            "zh-CN": "上半月专用丙火，下半月虽用丙火辛甲为佐",
            "zh-TW": "上半月專用丙火，下半月雖用丙火辛甲為佐"
        },
        warning={
            "ko": "丙(병화) 없으면 土가 습해 생기 없음",
            "en": "Without Bing, Earth is damp and lifeless",
            "ja": "丙なければ土が湿って生気なし",
            "zh-CN": "无丙土湿无生气",
            "zh-TW": "無丙土濕無生氣"
        },
        original="辰月：上半月專用丙火，下半月雖用丙火辛甲為佐。"
    ),
    "巳": JohuEntry(
        day_master="癸", month="巳",
        primary_god="辛", secondary_god="庚",
        condition={
            "ko": "초여름 火가 왕성, 辛(신금) 없으면 庚(경금) 사용",
            "en": "Early summer Fire is strong, without Xin use Geng",
            "ja": "初夏火が旺盛、辛なければ庚を使う",
            "zh-CN": "初夏火旺，无辛用庚",
            "zh-TW": "初夏火旺，無辛用庚"
        },
        outcome={
            "ko": "辛(신금) 없으면 庚(경금), 丁破格 꺼리나 壬(임수) 있으면 면함",
            "en": "Without Xin use Geng, avoid Ding breaking pattern, Ren prevents this",
            "ja": "辛なければ庚、丁破格を忌むが壬あれば免れる",
            "zh-CN": "无辛用庚，忌丁破格有壬可免",
            "zh-TW": "無辛用庚，忌丁破格有壬可免"
        },
        warning={
            "ko": "丁(정화)이 庚(경금)을 깨면 격이 파괴됨",
            "en": "If Ding breaks Geng, the pattern is destroyed",
            "ja": "丁が庚を破れば格が壊れる",
            "zh-CN": "丁破庚则格破",
            "zh-TW": "丁破庚則格破"
        },
        original="巳月：無辛用庚，忌丁破格有壬可免。"
    ),
    "午": JohuEntry(
        day_master="癸", month="午",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "한여름 火가 극왕, 庚(경)辛(신)이 생신(生身)의 본",
            "en": "Midsummer Fire at peak, Geng/Xin are the foundation for life",
            "ja": "真夏火が極旺、庚辛が生身の本",
            "zh-CN": "盛夏火极旺，庚辛为生身之本",
            "zh-TW": "盛夏火極旺，庚辛為生身之本"
        },
        outcome={
            "ko": "庚(경)辛(신)이 생신의 본, 비겁 겸해야 庚(경)辛(신)의 용 얻음",
            "en": "Geng/Xin are life foundation, need parallels to utilize Geng/Xin",
            "ja": "庚辛が生身の本、比劫を兼ねてこそ庚辛の用を得る",
            "zh-CN": "庚辛为生身之本，宜兼有比劫方得庚辛之用",
            "zh-TW": "庚辛為生身之本，宜兼有比劫方得庚辛之用"
        },
        warning={
            "ko": "金 없으면 癸(계)水가 완전히 마름",
            "en": "Without Metal, Gui Water completely dries up",
            "ja": "金なければ癸水が完全に乾く",
            "zh-CN": "无金癸水完全干涸",
            "zh-TW": "無金癸水完全乾涸"
        },
        original="午月：庚辛為生身之本，宜兼有比劫方得庚辛之用。"
    ),
    "未": JohuEntry(
        day_master="癸", month="未",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "늦여름 土가 왕성, 상반월은 비겁 방신, 하반월은 비겁 없어도 가능",
            "en": "Late summer Earth strong, first half needs parallels, second half can do without",
            "ja": "晩夏土が旺盛、上半月は比劫幇身、下半月は比劫なくても可",
            "zh-CN": "晚夏土旺，上半月宜比劫帮身，下半月无比劫亦可",
            "zh-TW": "晚夏土旺，上半月宜比劫幫身，下半月無比劫亦可"
        },
        outcome={
            "ko": "상반월은 비겁으로 방신, 하반월은 비겁 없어도 가능",
            "en": "First half use parallels to help, second half can do without",
            "ja": "上半月は比劫で幇身、下半月は比劫なくても可",
            "zh-CN": "上半月宜比劫帮身，下半月无比劫亦可",
            "zh-TW": "上半月宜比劫幫身，下半月無比劫亦可"
        },
        warning={
            "ko": "土가 너무 강하면 水가 막힘",
            "en": "Too strong Earth blocks Water",
            "ja": "土が強すぎると水が塞がれる",
            "zh-CN": "土太旺水被阻",
            "zh-TW": "土太旺水被阻"
        },
        original="未月：上半月宜比劫幫身，下半月無比劫亦可。"
    ),
    "申": JohuEntry(
        day_master="癸", month="申",
        primary_god="丁", secondary_god="庚",
        condition={
            "ko": "초가을 庚(경)金이 득록, 반드시 丁(정)火로 金 제압",
            "en": "Early autumn Geng Metal gains strength, must use Ding to control Metal",
            "ja": "初秋庚金が得禄、必ず丁火で金を制す",
            "zh-CN": "初秋庚金得禄，必丁火制金为用",
            "zh-TW": "初秋庚金得祿，必丁火制金為用"
        },
        outcome={
            "ko": "庚(경)金 득록, 반드시 丁(정)火로 金 제압해야 용",
            "en": "Geng at strength, must use Ding to control Metal",
            "ja": "庚金得禄、必ず丁火で金を制してこそ用",
            "zh-CN": "庚金得禄，必丁火制金为用",
            "zh-TW": "庚金得祿，必丁火制金為用"
        },
        warning={
            "ko": "丁(정화)이 午戌未에 통근해야 효력",
            "en": "Ding must root in Wu/Xu/Wei to be effective",
            "ja": "丁が午戌未に通根してこそ効力",
            "zh-CN": "丁火须午戌未通根方妙",
            "zh-TW": "丁火須午戌未通根方妙"
        },
        original="申月：庚金得祿，必丁火制金為用。"
    ),
    "酉": JohuEntry(
        day_master="癸", month="酉",
        primary_god="辛", secondary_god="丙",
        condition={
            "ko": "가을 辛(신)金이 사령, 辛(신)金이 용, 丙(병)火가 보조",
            "en": "Autumn Xin Metal commands, Xin is useful, Bing assists",
            "ja": "秋の辛金が司令、辛金が用、丙火が補佐",
            "zh-CN": "秋季辛金司令，辛金为用，丙火佐之",
            "zh-TW": "秋季辛金司令，辛金為用，丙火佐之"
        },
        outcome={
            "ko": "辛(신)金이 용, 丙(병)火가 보조, 이름하여 수난금온(水暖金溫)",
            "en": "Xin is useful, Bing assists, called Water-warm Metal-warm",
            "ja": "辛金が用、丙火が補佐、名を水暖金温",
            "zh-CN": "辛金为用，丙火佐之，名水暖金温",
            "zh-TW": "辛金為用，丙火佐之，名水暖金溫"
        },
        warning={
            "ko": "丙(병화) 없으면 金이 차갑고 水도 차가움",
            "en": "Without Bing, Metal is cold and Water is cold",
            "ja": "丙なければ金が冷たく水も冷たい",
            "zh-CN": "无丙金寒水冷",
            "zh-TW": "無丙金寒水冷"
        },
        original="酉月：辛金為用，丙火佐之，名水暖金溫。"
    ),
    "戌": JohuEntry(
        day_master="癸", month="戌",
        primary_god="辛", secondary_god="甲",
        condition={
            "ko": "늦가을 土왕절, 오로지 辛(신)金 사용, 戊(무)土 꺼림",
            "en": "Late autumn Earth rules, use only Xin, avoid Wu",
            "ja": "晩秋土旺節、專ら辛金を使い、戊土を忌む",
            "zh-CN": "晚秋土旺，专用辛金，忌戊土",
            "zh-TW": "晚秋土旺，專用辛金，忌戊土"
        },
        outcome={
            "ko": "오로지 辛(신)金, 戊(무)土 꺼리니 비겁과 甲(갑목)으로 戊(무토) 제압",
            "en": "Use only Xin, avoid Wu, use parallels and Jia to control Wu",
            "ja": "專ら辛金、戊土を忌み比劫と甲で戊を制す",
            "zh-CN": "专用辛金，忌戊土要比劫兹甲制戊",
            "zh-TW": "專用辛金，忌戊土要比劫茲甲制戊"
        },
        warning={
            "ko": "戊(무토)가 강하면 癸(계수)를 막아 흐르지 못함",
            "en": "Strong Wu blocks Gui from flowing",
            "ja": "戊が強いと癸を塞ぎ流れない",
            "zh-CN": "戊强则阻癸不流",
            "zh-TW": "戊強則阻癸不流"
        },
        original="戌月：專用辛金，忌戊土要比劫茲甲制戊。"
    ),
    "亥": JohuEntry(
        day_master="癸", month="亥",
        primary_god="庚", secondary_god="辛",
        condition={
            "ko": "초겨울 亥중 甲(갑)木이 장생, 원신(元神)을 설산, 庚(경)辛(신) 사용",
            "en": "Early winter Jia in Hai at Long Life, drains essence, use Geng/Xin",
            "ja": "初冬亥中の甲木が長生、元神を洩散、庚辛を使う",
            "zh-CN": "初冬亥中甲木长生泄散元神，宜用庚辛",
            "zh-TW": "初冬亥中甲木長生泄散元神，宜用庚辛"
        },
        outcome={
            "ko": "亥중 甲(갑)木이 원신 설산, 庚(경)辛(신) 사용, 水多면 戊(무토), 金多면 丁",
            "en": "Jia in Hai drains essence, use Geng/Xin, if much Water use Wu, if much Metal use Ding",
            "ja": "亥中の甲木が元神を洩らす、庚辛を使い、水多ければ戊、金多ければ丁",
            "zh-CN": "亥中甲木长生泄散元神，宜用庚辛，水多用戊，金多用丁",
            "zh-TW": "亥中甲木長生泄散元神，宜用庚辛，水多用戊，金多用丁"
        },
        warning={
            "ko": "甲(갑목)이 水를 설기해 약해질 수 있음",
            "en": "Jia can drain and weaken Water",
            "ja": "甲が水を洩らして弱くなりうる",
            "zh-CN": "甲泄水可致弱",
            "zh-TW": "甲泄水可致弱"
        },
        original="亥月：亥中甲木長生泄散元神，宜用庚辛，水多用戊，金多用丁。"
    ),
    "子": JohuEntry(
        day_master="癸", month="子",
        primary_god="丙", secondary_god="辛",
        condition={
            "ko": "한겨울 水가 극왕, 丙(병)火로 해동(解凍)",
            "en": "Midwinter Water at peak, Bing Fire to thaw",
            "ja": "真冬水が極旺、丙火で解凍",
            "zh-CN": "隆冬水极旺，丙火解冻",
            "zh-TW": "隆冬水極旺，丙火解凍"
        },
        outcome={
            "ko": "丙(병)火로 해동, 辛(신)金으로 자부(滋扶)",
            "en": "Bing for thawing, Xin for nourishing support",
            "ja": "丙火で解凍、辛金で滋扶",
            "zh-CN": "丙火解冻，辛金滋扶",
            "zh-TW": "丙火解凍，辛金滋扶"
        },
        warning={
            "ko": "丙(병화) 없으면 癸(계)水가 얼어 흐르지 못함",
            "en": "Without Bing, Gui Water freezes and cannot flow",
            "ja": "丙なければ癸水が凍り流れない",
            "zh-CN": "无丙癸水冻不流",
            "zh-TW": "無丙癸水凍不流"
        },
        original="子月：丙火解凍，辛金滋扶。"
    ),
    "丑": JohuEntry(
        day_master="癸", month="丑",
        primary_god="丙", secondary_god="辛",
        condition={
            "ko": "늦겨울 한습(寒濕), 丙(병)火로 해동 필수",
            "en": "Late winter cold-damp, Bing Fire for thawing is essential",
            "ja": "晩冬寒湿、丙火で解凍必須",
            "zh-CN": "晚冬寒湿，丙火解冻必须",
            "zh-TW": "晚冬寒濕，丙火解凍必須"
        },
        outcome={
            "ko": "丙(병)火로 해동, 寅巳午未戌에 통근해야 묘함",
            "en": "Bing for thawing, rooting in Yin/Si/Wu/Wei/Xu is excellent",
            "ja": "丙火で解凍、寅巳午未戌に通根してこそ妙",
            "zh-CN": "丙火解冻，通根寅巳午未戌方妙",
            "zh-TW": "丙火解凍，通根寅巳午未戌方妙"
        },
        warning={
            "ko": "丙(병화)이 통근 없으면 해동력 부족",
            "en": "Without roots, Bing lacks thawing power",
            "ja": "丙が通根なければ解凍力不足",
            "zh-CN": "丙无通根则解冻力不足",
            "zh-TW": "丙無通根則解凍力不足"
        },
        original="丑月：丙火解凍，通根寅巳午未戌方妙。"
    ),
}


# =============================================================================
# 조후 매트릭스 (10일간 × 12월) - 완성
# =============================================================================
JOHU_MATRIX: Dict[str, Dict[str, JohuEntry]] = {
    "甲": JIA_WOOD,
    "乙": YI_WOOD,
    "丙": BING_FIRE,
    "丁": DING_FIRE,
    "戊": WU_EARTH,
    "己": JI_EARTH,
    "庚": GENG_METAL,
    "辛": XIN_METAL,
    "壬": REN_WATER,
    "癸": GUI_WATER,
}


# =============================================================================
# 헬퍼 함수
# =============================================================================
def get_johu_entry(day_master: str, month: str) -> Optional[JohuEntry]:
    """
    일간과 월지로 조후 용신 엔트리 조회

    Args:
        day_master: 일간 (甲~癸)
        month: 월지 (寅~丑)

    Returns:
        JohuEntry 또는 None
    """
    if day_master in JOHU_MATRIX:
        return JOHU_MATRIX[day_master].get(month)
    return None


def build_johu_prompt(entry: JohuEntry, lang: LanguageType = 'ko') -> str:
    """
    조후 엔트리를 프롬프트 텍스트로 변환

    Args:
        entry: JohuEntry 객체
        lang: 언어 코드 (ko, en, ja, zh-CN, zh-TW)

    Returns:
        포맷된 프롬프트 문자열
    """
    lines = [
        f"## {entry.day_master}일간 {entry.month}월 조후용신",
        f"",
        f"**1순위 용신**: {entry.primary_god}",
    ]

    if entry.secondary_god:
        lines.append(f"**2순위 용신**: {entry.secondary_god}")

    lines.extend([
        f"",
        f"### 조건",
        entry.condition.get(lang, entry.condition.get('ko', '')),
        f"",
        f"### 효과",
        entry.outcome.get(lang, entry.outcome.get('ko', '')),
        f"",
        f"### 주의사항",
        entry.warning.get(lang, entry.warning.get('ko', '')),
        f"",
        f"---",
        f"*원문: {entry.original}*",
    ])

    return "\n".join(lines)


# =============================================================================
# 편의 함수: 월지 순서
# =============================================================================
MONTH_ORDER = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]
DAY_MASTER_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
