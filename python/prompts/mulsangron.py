"""
물상론(物象論) 데이터베이스
십신별 길흉 사건 매핑 및 사건 예측 템플릿

v5.0 - Task 5.2 구현
"""
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass


# ============================================
# Task 5.2.1: 십성별 길흉 사건 매핑 테이블
# ============================================

# 십신 물상 (十神物象) - 각 십신이 상징하는 사물/인물/사건
MULSANGRON: Dict[str, Dict[str, Dict[str, List[str]]]] = {
    "비견": {
        "인물": {
            "ko": ["형제", "자매", "동료", "경쟁자", "친구"],
            "en": ["siblings", "colleagues", "competitors", "friends"],
            "ja": ["兄弟姉妹", "同僚", "競争相手", "友人"],
            "zh-CN": ["兄弟", "姐妹", "同事", "竞争者", "朋友"],
            "zh-TW": ["兄弟", "姊妹", "同事", "競爭者", "朋友"],
        },
        "길": {
            "ko": ["협력 성공", "동업 번창", "형제 도움", "인맥 확대", "팀워크 발휘"],
            "en": ["successful collaboration", "thriving partnership", "sibling support", "network expansion", "great teamwork"],
            "ja": ["協力成功", "共同事業繁盛", "兄弟の助け", "人脈拡大", "チームワーク発揮"],
            "zh-CN": ["合作成功", "合伙兴隆", "兄弟相助", "人脉扩展", "团队合作"],
            "zh-TW": ["合作成功", "合夥興隆", "兄弟相助", "人脈拓展", "團隊合作"],
        },
        "흉": {
            "ko": ["경쟁 패배", "동료 배신", "형제 갈등", "재산 분쟁", "과도한 경쟁"],
            "en": ["competitive loss", "colleague betrayal", "sibling conflict", "property dispute", "excessive competition"],
            "ja": ["競争敗北", "同僚の裏切り", "兄弟葛藤", "財産紛争", "過度な競争"],
            "zh-CN": ["竞争失败", "同事背叛", "兄弟冲突", "财产纠纷", "过度竞争"],
            "zh-TW": ["競爭失敗", "同事背叛", "兄弟衝突", "財產糾紛", "過度競爭"],
        },
    },
    "겁재": {
        "인물": {
            "ko": ["형제", "자매", "경쟁자", "강탈자", "도박꾼"],
            "en": ["siblings", "competitors", "robbers", "gamblers"],
            "ja": ["兄弟姉妹", "競争相手", "強奪者", "賭博師"],
            "zh-CN": ["兄弟", "姐妹", "竞争者", "抢夺者", "赌徒"],
            "zh-TW": ["兄弟", "姊妹", "競爭者", "搶奪者", "賭徒"],
        },
        "길": {
            "ko": ["투기 성공", "대담한 투자 성공", "경쟁 승리", "결단력 발휘"],
            "en": ["successful speculation", "bold investment success", "competitive victory", "decisive action"],
            "ja": ["投機成功", "大胆な投資成功", "競争勝利", "決断力発揮"],
            "zh-CN": ["投机成功", "大胆投资成功", "竞争胜利", "果断行动"],
            "zh-TW": ["投機成功", "大膽投資成功", "競爭勝利", "果斷行動"],
        },
        "흉": {
            "ko": ["재산 손실", "도난", "사기 피해", "도박 손실", "강탈", "배신"],
            "en": ["property loss", "theft", "fraud victim", "gambling loss", "robbery", "betrayal"],
            "ja": ["財産損失", "盗難", "詐欺被害", "賭博損失", "強奪", "裏切り"],
            "zh-CN": ["财产损失", "盗窃", "诈骗受害", "赌博损失", "抢劫", "背叛"],
            "zh-TW": ["財產損失", "盜竊", "詐騙受害", "賭博損失", "搶劫", "背叛"],
        },
    },
    "식신": {
        "인물": {
            "ko": ["자녀", "제자", "후배", "손님", "창작자"],
            "en": ["children", "students", "juniors", "guests", "creators"],
            "ja": ["子供", "弟子", "後輩", "客", "創作者"],
            "zh-CN": ["子女", "弟子", "后辈", "客人", "创作者"],
            "zh-TW": ["子女", "弟子", "後輩", "客人", "創作者"],
        },
        "길": {
            "ko": ["창작 성공", "요리/예술 성취", "자녀 효도", "인기 상승", "건강 호전", "풍요"],
            "en": ["creative success", "culinary/artistic achievement", "filial children", "rising popularity", "health improvement", "abundance"],
            "ja": ["創作成功", "料理・芸術の達成", "子供の親孝行", "人気上昇", "健康回復", "豊穣"],
            "zh-CN": ["创作成功", "美食/艺术成就", "子女孝顺", "人气上升", "健康好转", "富足"],
            "zh-TW": ["創作成功", "美食/藝術成就", "子女孝順", "人氣上升", "健康好轉", "富足"],
        },
        "흉": {
            "ko": ["게으름", "소화 장애", "비만", "자녀 걱정", "낭비", "방종"],
            "en": ["laziness", "digestive issues", "obesity", "child concerns", "waste", "indulgence"],
            "ja": ["怠惰", "消化障害", "肥満", "子供の心配", "浪費", "放縦"],
            "zh-CN": ["懒惰", "消化问题", "肥胖", "子女担忧", "浪费", "放纵"],
            "zh-TW": ["懶惰", "消化問題", "肥胖", "子女擔憂", "浪費", "放縱"],
        },
    },
    "상관": {
        "인물": {
            "ko": ["자녀", "반항아", "예술가", "혁신가", "비평가"],
            "en": ["children", "rebels", "artists", "innovators", "critics"],
            "ja": ["子供", "反抗者", "芸術家", "革新者", "批評家"],
            "zh-CN": ["子女", "叛逆者", "艺术家", "创新者", "批评家"],
            "zh-TW": ["子女", "叛逆者", "藝術家", "創新者", "批評家"],
        },
        "길": {
            "ko": ["창의적 돌파", "예술적 성공", "자유로운 표현", "혁신 인정", "카리스마 발휘"],
            "en": ["creative breakthrough", "artistic success", "free expression", "innovation recognition", "charisma display"],
            "ja": ["創造的突破", "芸術的成功", "自由な表現", "革新の認知", "カリスマ発揮"],
            "zh-CN": ["创意突破", "艺术成功", "自由表达", "创新认可", "魅力展现"],
            "zh-TW": ["創意突破", "藝術成功", "自由表達", "創新認可", "魅力展現"],
        },
        "흉": {
            "ko": ["관재구설", "반항 문제", "직장 갈등", "남편 운 약화(여성)", "권위 충돌", "송사"],
            "en": ["legal troubles", "rebellion issues", "workplace conflict", "husband issues (women)", "authority clash", "lawsuits"],
            "ja": ["法的トラブル", "反抗問題", "職場紛争", "夫運低下（女性）", "権威衝突", "訴訟"],
            "zh-CN": ["法律纠纷", "叛逆问题", "职场冲突", "夫运减弱（女性）", "权威冲突", "诉讼"],
            "zh-TW": ["法律糾紛", "叛逆問題", "職場衝突", "夫運減弱（女性）", "權威衝突", "訴訟"],
        },
    },
    "정재": {
        "인물": {
            "ko": ["아버지", "아내(남성)", "직원", "고정 고객", "은행원"],
            "en": ["father", "wife (men)", "employees", "regular customers", "bankers"],
            "ja": ["父親", "妻（男性）", "従業員", "固定客", "銀行員"],
            "zh-CN": ["父亲", "妻子（男性）", "员工", "固定客户", "银行职员"],
            "zh-TW": ["父親", "妻子（男性）", "員工", "固定客戶", "銀行員"],
        },
        "길": {
            "ko": ["급여 인상", "안정적 수입", "저축 증가", "부동산 취득", "결혼(남성)", "재정 안정"],
            "en": ["salary increase", "stable income", "savings growth", "property acquisition", "marriage (men)", "financial stability"],
            "ja": ["給与増加", "安定収入", "貯蓄増加", "不動産取得", "結婚（男性）", "財政安定"],
            "zh-CN": ["工资增长", "稳定收入", "储蓄增加", "房产购置", "结婚（男性）", "财务稳定"],
            "zh-TW": ["工資增長", "穩定收入", "儲蓄增加", "房產購置", "結婚（男性）", "財務穩定"],
        },
        "흉": {
            "ko": ["재정 손실", "도난", "지출 과다", "아버지 건강", "결혼 문제(남성)", "투자 실패"],
            "en": ["financial loss", "theft", "excessive spending", "father's health", "marriage issues (men)", "investment failure"],
            "ja": ["財政損失", "盗難", "過剰支出", "父の健康", "結婚問題（男性）", "投資失敗"],
            "zh-CN": ["财务损失", "盗窃", "支出过多", "父亲健康", "婚姻问题（男性）", "投资失败"],
            "zh-TW": ["財務損失", "盜竊", "支出過多", "父親健康", "婚姻問題（男性）", "投資失敗"],
        },
    },
    "편재": {
        "인물": {
            "ko": ["아버지", "정부/애인(남성)", "투자자", "사업가", "도박꾼"],
            "en": ["father", "mistress/lover (men)", "investors", "entrepreneurs", "gamblers"],
            "ja": ["父親", "愛人（男性）", "投資家", "事業家", "賭博師"],
            "zh-CN": ["父亲", "情人（男性）", "投资者", "企业家", "赌徒"],
            "zh-TW": ["父親", "情人（男性）", "投資者", "企業家", "賭徒"],
        },
        "길": {
            "ko": ["횡재", "투자 대박", "사업 성공", "유산 상속", "예상치 못한 수입"],
            "en": ["windfall", "investment jackpot", "business success", "inheritance", "unexpected income"],
            "ja": ["横財", "投資大当たり", "事業成功", "遺産相続", "予想外の収入"],
            "zh-CN": ["横财", "投资大赚", "事业成功", "遗产继承", "意外收入"],
            "zh-TW": ["橫財", "投資大賺", "事業成功", "遺產繼承", "意外收入"],
        },
        "흉": {
            "ko": ["투기 실패", "사기 피해", "도박 손실", "여성 문제(남성)", "재산 탕진"],
            "en": ["speculation failure", "fraud victim", "gambling loss", "woman issues (men)", "fortune squandered"],
            "ja": ["投機失敗", "詐欺被害", "賭博損失", "女性問題（男性）", "財産蕩尽"],
            "zh-CN": ["投机失败", "诈骗受害", "赌博损失", "女性问题（男性）", "财产挥霍"],
            "zh-TW": ["投機失敗", "詐騙受害", "賭博損失", "女性問題（男性）", "財產揮霍"],
        },
    },
    "정관": {
        "인물": {
            "ko": ["남편(여성)", "상사", "정부 관리", "경찰", "법관"],
            "en": ["husband (women)", "boss", "government official", "police", "judge"],
            "ja": ["夫（女性）", "上司", "政府役人", "警察", "裁判官"],
            "zh-CN": ["丈夫（女性）", "上司", "政府官员", "警察", "法官"],
            "zh-TW": ["丈夫（女性）", "上司", "政府官員", "警察", "法官"],
        },
        "길": {
            "ko": ["승진", "관직 취득", "명예 획득", "결혼(여성)", "안정된 직장", "신뢰 상승"],
            "en": ["promotion", "official position", "honor acquired", "marriage (women)", "stable job", "trust increase"],
            "ja": ["昇進", "官職取得", "名誉獲得", "結婚（女性）", "安定した職場", "信頼上昇"],
            "zh-CN": ["升职", "官职取得", "名誉获得", "结婚（女性）", "稳定工作", "信任提升"],
            "zh-TW": ["升職", "官職取得", "名譽獲得", "結婚（女性）", "穩定工作", "信任提升"],
        },
        "흉": {
            "ko": ["관재", "송사", "해고", "징계", "남편 문제(여성)", "권위 실추"],
            "en": ["legal troubles", "lawsuits", "dismissal", "disciplinary action", "husband issues (women)", "loss of authority"],
            "ja": ["法的トラブル", "訴訟", "解雇", "懲戒", "夫の問題（女性）", "権威失墜"],
            "zh-CN": ["法律纠纷", "诉讼", "解雇", "处分", "丈夫问题（女性）", "权威丧失"],
            "zh-TW": ["法律糾紛", "訴訟", "解雇", "處分", "丈夫問題（女性）", "權威喪失"],
        },
    },
    "편관": {
        "인물": {
            "ko": ["애인/정부(여성)", "경쟁자", "폭력배", "군인", "외과의사"],
            "en": ["lover (women)", "competitors", "gangsters", "soldiers", "surgeons"],
            "ja": ["愛人（女性）", "競争相手", "暴力団", "軍人", "外科医"],
            "zh-CN": ["情人（女性）", "竞争者", "暴徒", "军人", "外科医生"],
            "zh-TW": ["情人（女性）", "競爭者", "暴徒", "軍人", "外科醫生"],
        },
        "길": {
            "ko": ["강력한 추진력", "권력 획득", "영웅적 행동", "위기 극복", "수술 성공"],
            "en": ["strong drive", "power acquisition", "heroic action", "crisis overcome", "successful surgery"],
            "ja": ["強力な推進力", "権力獲得", "英雄的行動", "危機克服", "手術成功"],
            "zh-CN": ["强大推动力", "权力获得", "英雄行为", "危机克服", "手术成功"],
            "zh-TW": ["強大推動力", "權力獲得", "英雄行為", "危機克服", "手術成功"],
        },
        "흉": {
            "ko": ["사고", "수술", "폭력 피해", "구속", "여성 스캔들(남성)", "압박감"],
            "en": ["accidents", "surgery", "violence victim", "detention", "woman scandal (men)", "pressure"],
            "ja": ["事故", "手術", "暴力被害", "拘束", "女性スキャンダル（男性）", "プレッシャー"],
            "zh-CN": ["事故", "手术", "暴力受害", "拘留", "女性丑闻（男性）", "压力"],
            "zh-TW": ["事故", "手術", "暴力受害", "拘留", "女性醜聞（男性）", "壓力"],
        },
    },
    "정인": {
        "인물": {
            "ko": ["어머니", "스승", "학자", "종교인", "보호자"],
            "en": ["mother", "teacher", "scholar", "religious figure", "guardian"],
            "ja": ["母親", "師匠", "学者", "宗教者", "保護者"],
            "zh-CN": ["母亲", "老师", "学者", "宗教人士", "监护人"],
            "zh-TW": ["母親", "老師", "學者", "宗教人士", "監護人"],
        },
        "길": {
            "ko": ["학업 성취", "자격증 취득", "어머니 도움", "문서 계약 성공", "명예 회복", "정신적 안정"],
            "en": ["academic achievement", "certification acquired", "mother's help", "contract success", "honor restored", "mental stability"],
            "ja": ["学業成就", "資格取得", "母の助け", "契約成功", "名誉回復", "精神的安定"],
            "zh-CN": ["学业成就", "资格证获取", "母亲帮助", "合同成功", "名誉恢复", "精神稳定"],
            "zh-TW": ["學業成就", "資格證獲取", "母親幫助", "合同成功", "名譽恢復", "精神穩定"],
        },
        "흉": {
            "ko": ["어머니 건강", "문서 사기", "과보호", "의존성", "학업 실패"],
            "en": ["mother's health", "document fraud", "overprotection", "dependency", "academic failure"],
            "ja": ["母の健康", "文書詐欺", "過保護", "依存性", "学業失敗"],
            "zh-CN": ["母亲健康", "文件欺诈", "过度保护", "依赖性", "学业失败"],
            "zh-TW": ["母親健康", "文件欺詐", "過度保護", "依賴性", "學業失敗"],
        },
    },
    "편인": {
        "인물": {
            "ko": ["계모", "양모", "스승", "특수 전문가", "점술가"],
            "en": ["stepmother", "foster mother", "mentor", "specialist", "fortune teller"],
            "ja": ["継母", "養母", "師匠", "専門家", "占い師"],
            "zh-CN": ["继母", "养母", "导师", "专家", "算命师"],
            "zh-TW": ["繼母", "養母", "導師", "專家", "算命師"],
        },
        "길": {
            "ko": ["특수 재능 발휘", "영적 통찰", "비밀 정보 획득", "연구 성과", "창의적 발상"],
            "en": ["special talent display", "spiritual insight", "secret info acquired", "research success", "creative ideas"],
            "ja": ["特殊才能発揮", "霊的洞察", "秘密情報獲得", "研究成果", "創造的発想"],
            "zh-CN": ["特殊才能发挥", "灵性洞察", "秘密信息获取", "研究成果", "创意想法"],
            "zh-TW": ["特殊才能發揮", "靈性洞察", "秘密資訊獲取", "研究成果", "創意想法"],
        },
        "흉": {
            "ko": ["도식(자녀 위험)", "고독", "비정상적 사고", "어머니 불화", "현실 도피", "의심병"],
            "en": ["child danger", "loneliness", "abnormal thinking", "mother conflict", "escapism", "paranoia"],
            "ja": ["子供の危険", "孤独", "異常な思考", "母との不和", "現実逃避", "疑心暗鬼"],
            "zh-CN": ["子女危险", "孤独", "异常思维", "母亲不和", "逃避现实", "多疑"],
            "zh-TW": ["子女危險", "孤獨", "異常思維", "母親不和", "逃避現實", "多疑"],
        },
    },
}


# ============================================
# Task 5.2.2: 충/형/합별 물상 정의
# ============================================

INTERACTION_MULSANG: Dict[str, Dict[str, Dict[str, List[str]]]] = {
    "합": {
        "description": {
            "ko": "조화와 결합의 기운. 협력, 연대, 인연이 맺어짐",
            "en": "Energy of harmony and union. Cooperation, solidarity, connections formed",
            "ja": "調和と結合の気運。協力、連帯、縁が結ばれる",
            "zh-CN": "和谐结合的能量。合作、团结、缘分形成",
            "zh-TW": "和諧結合的能量。合作、團結、緣分形成",
        },
        "events": {
            "ko": ["결혼", "계약 성사", "동업", "화해", "합격", "취업", "협력 성공"],
            "en": ["marriage", "contract signed", "partnership", "reconciliation", "passing exams", "employment", "successful cooperation"],
            "ja": ["結婚", "契約成立", "共同事業", "和解", "合格", "就職", "協力成功"],
            "zh-CN": ["结婚", "合同签订", "合伙", "和解", "考试通过", "就业", "合作成功"],
            "zh-TW": ["結婚", "合同簽訂", "合夥", "和解", "考試通過", "就業", "合作成功"],
        },
        "caution": {
            "ko": ["지나친 의존", "자아 상실", "관계에 얽매임"],
            "en": ["excessive dependence", "loss of self", "being bound by relationships"],
            "ja": ["過度の依存", "自我喪失", "関係に縛られる"],
            "zh-CN": ["过度依赖", "自我丧失", "被关系束缚"],
            "zh-TW": ["過度依賴", "自我喪失", "被關係束縛"],
        },
    },
    "충": {
        "description": {
            "ko": "충돌과 변화의 기운. 급격한 변화, 이동, 분리",
            "en": "Energy of clash and change. Sudden change, movement, separation",
            "ja": "衝突と変化の気運。急激な変化、移動、分離",
            "zh-CN": "冲突变化的能量。剧变、移动、分离",
            "zh-TW": "衝突變化的能量。劇變、移動、分離",
        },
        "events": {
            "ko": ["이사", "이직", "이별", "사고", "분쟁", "갈등", "급변"],
            "en": ["moving", "job change", "breakup", "accident", "dispute", "conflict", "sudden change"],
            "ja": ["引越し", "転職", "別れ", "事故", "紛争", "葛藤", "急変"],
            "zh-CN": ["搬家", "换工作", "分手", "事故", "纠纷", "冲突", "剧变"],
            "zh-TW": ["搬家", "換工作", "分手", "事故", "糾紛", "衝突", "劇變"],
        },
        "caution": {
            "ko": ["안정 파괴", "건강 사고", "인간관계 단절", "재산 손실"],
            "en": ["stability destroyed", "health accident", "relationship severance", "property loss"],
            "ja": ["安定破壊", "健康事故", "人間関係断絶", "財産損失"],
            "zh-CN": ["稳定破坏", "健康事故", "人际断绝", "财产损失"],
            "zh-TW": ["穩定破壞", "健康事故", "人際斷絕", "財產損失"],
        },
    },
    "형": {
        "description": {
            "ko": "형벌과 고난의 기운. 법적 문제, 건강 문제, 정신적 고통",
            "en": "Energy of punishment and hardship. Legal issues, health issues, mental suffering",
            "ja": "刑罰と苦難の気運。法的問題、健康問題、精神的苦痛",
            "zh-CN": "刑罚苦难的能量。法律问题、健康问题、精神痛苦",
            "zh-TW": "刑罰苦難的能量。法律問題、健康問題、精神痛苦",
        },
        "events": {
            "ko": ["소송", "수술", "질병", "사고", "징계", "배신", "정신적 스트레스"],
            "en": ["lawsuit", "surgery", "illness", "accident", "discipline", "betrayal", "mental stress"],
            "ja": ["訴訟", "手術", "病気", "事故", "懲戒", "裏切り", "精神的ストレス"],
            "zh-CN": ["诉讼", "手术", "疾病", "事故", "处分", "背叛", "精神压力"],
            "zh-TW": ["訴訟", "手術", "疾病", "事故", "處分", "背叛", "精神壓力"],
        },
        "caution": {
            "ko": ["법적 위험", "건강 악화", "인간관계 파탄", "자해 위험"],
            "en": ["legal risk", "health deterioration", "relationship breakdown", "self-harm risk"],
            "ja": ["法的リスク", "健康悪化", "人間関係破綻", "自傷リスク"],
            "zh-CN": ["法律风险", "健康恶化", "人际破裂", "自伤风险"],
            "zh-TW": ["法律風險", "健康惡化", "人際破裂", "自傷風險"],
        },
    },
    "해": {
        "description": {
            "ko": "해침과 손상의 기운. 은밀한 피해, 소소한 갈등",
            "en": "Energy of harm and damage. Hidden damage, minor conflicts",
            "ja": "害と損傷の気運。密かな被害、些細な葛藤",
            "zh-CN": "损害的能量。隐性伤害、小冲突",
            "zh-TW": "損害的能量。隱性傷害、小衝突",
        },
        "events": {
            "ko": ["소소한 다툼", "뒷담화", "은밀한 배신", "건강 저하", "불안", "의심"],
            "en": ["minor quarrels", "gossip", "secret betrayal", "health decline", "anxiety", "suspicion"],
            "ja": ["些細な争い", "陰口", "密かな裏切り", "健康低下", "不安", "疑念"],
            "zh-CN": ["小争吵", "背后议论", "秘密背叛", "健康下降", "焦虑", "怀疑"],
            "zh-TW": ["小爭吵", "背後議論", "秘密背叛", "健康下降", "焦慮", "懷疑"],
        },
        "caution": {
            "ko": ["누적된 스트레스", "신뢰 저하", "만성 건강 문제"],
            "en": ["accumulated stress", "trust decline", "chronic health issues"],
            "ja": ["蓄積されたストレス", "信頼低下", "慢性的な健康問題"],
            "zh-CN": ["累积压力", "信任下降", "慢性健康问题"],
            "zh-TW": ["累積壓力", "信任下降", "慢性健康問題"],
        },
    },
    "파": {
        "description": {
            "ko": "파괴와 해체의 기운. 약한 손상, 계획 틀어짐",
            "en": "Energy of destruction and dissolution. Minor damage, plans gone awry",
            "ja": "破壊と解体の気運。軽微な損傷、計画の狂い",
            "zh-CN": "破坏解体的能量。轻微损伤、计划失误",
            "zh-TW": "破壞解體的能量。輕微損傷、計劃失誤",
        },
        "events": {
            "ko": ["계획 실패", "약속 파기", "물건 파손", "관계 소원", "기회 놓침"],
            "en": ["plan failure", "broken promise", "item damage", "estranged relationship", "missed opportunity"],
            "ja": ["計画失敗", "約束破棄", "物品破損", "関係疎遠", "機会逃す"],
            "zh-CN": ["计划失败", "违约", "物品损坏", "关系疏远", "错失机会"],
            "zh-TW": ["計劃失敗", "違約", "物品損壞", "關係疏遠", "錯失機會"],
        },
        "caution": {
            "ko": ["완성 직전 실패", "약간의 재정 손실"],
            "en": ["failure just before completion", "slight financial loss"],
            "ja": ["完成直前の失敗", "若干の財政損失"],
            "zh-CN": ["即将完成时失败", "轻微财务损失"],
            "zh-TW": ["即將完成時失敗", "輕微財務損失"],
        },
    },
}


# ============================================
# Task 5.2.3: 사건 예측 템플릿 생성 함수
# ============================================

@dataclass
class EventPrediction:
    """사건 예측 결과"""
    ten_god: str                    # 십신
    is_favorable: bool              # 길/흉 여부
    people: List[str]               # 관련 인물
    events: List[str]               # 예상 사건
    advice: str                     # 조언


def get_ten_god_events(
    ten_god: str,
    is_favorable: bool,
    language: str = "ko"
) -> Dict[str, List[str]]:
    """
    십신에 해당하는 사건 목록 반환

    Args:
        ten_god: 십신 (예: "정관", "정재")
        is_favorable: True=길, False=흉
        language: 언어 코드

    Returns:
        {"people": [...], "events": [...]}
    """
    god_data = MULSANGRON.get(ten_god)
    if not god_data:
        return {"people": [], "events": []}

    event_type = "길" if is_favorable else "흉"
    people = god_data.get("인물", {}).get(language, god_data.get("인물", {}).get("ko", []))
    events = god_data.get(event_type, {}).get(language, god_data.get(event_type, {}).get("ko", []))

    return {"people": people, "events": events}


def get_interaction_events(
    interaction_type: Literal["합", "충", "형", "해", "파"],
    language: str = "ko"
) -> Dict[str, List[str]]:
    """
    상호작용 유형에 해당하는 사건 목록 반환

    Args:
        interaction_type: 합/충/형/해/파
        language: 언어 코드

    Returns:
        {"description": "...", "events": [...], "caution": [...]}
    """
    data = INTERACTION_MULSANG.get(interaction_type)
    if not data:
        return {"description": "", "events": [], "caution": []}

    return {
        "description": data.get("description", {}).get(language, data.get("description", {}).get("ko", "")),
        "events": data.get("events", {}).get(language, data.get("events", {}).get("ko", [])),
        "caution": data.get("caution", {}).get(language, data.get("caution", {}).get("ko", [])),
    }


def generate_event_prediction_template(
    ten_gods: List[Dict[str, any]],
    interactions: Dict[str, List[any]],
    score: float,
    language: str = "ko"
) -> str:
    """
    AI 프롬프트용 사건 예측 템플릿 생성

    Args:
        ten_gods: 십신 분석 결과 [{"name": "정관", "count": 2, ...}, ...]
        interactions: 상호작용 분석 {"combinations": [...], "clashes": [...], ...}
        score: 종합 점수 (-100 ~ +100)
        language: 언어 코드

    Returns:
        AI 프롬프트에 삽입할 템플릿 문자열
    """
    lines = []

    # 헤더
    if language == "en":
        lines.append("## Event Prediction Reference (Mulsangron)")
        lines.append("")
        is_favorable_overall = score >= 0
        lines.append(f"**Overall Trend**: {'Favorable' if is_favorable_overall else 'Challenging'} (Score: {score:+.1f})")
        lines.append("")
    else:
        lines.append("## 사건 예측 참조 (물상론)")
        lines.append("")
        is_favorable_overall = score >= 0
        lines.append(f"**전반적 흐름**: {'길' if is_favorable_overall else '흉'} (점수: {score:+.1f})")
        lines.append("")

    # 주요 십신별 사건
    if language == "en":
        lines.append("### Ten Gods Events")
    else:
        lines.append("### 십신별 예상 사건")

    for god in ten_gods[:3]:  # 상위 3개만
        god_name = god.get("name", "")
        if not god_name:
            continue

        events_data = get_ten_god_events(god_name, is_favorable_overall, language)
        if events_data["events"]:
            events_str = ", ".join(events_data["events"][:3])
            people_str = ", ".join(events_data["people"][:2]) if events_data["people"] else ""

            if language == "en":
                lines.append(f"- **{god_name}**: {events_str}")
                if people_str:
                    lines.append(f"  - Related people: {people_str}")
            else:
                lines.append(f"- **{god_name}**: {events_str}")
                if people_str:
                    lines.append(f"  - 관련 인물: {people_str}")

    lines.append("")

    # 상호작용별 사건
    if language == "en":
        lines.append("### Interaction Events")
    else:
        lines.append("### 상호작용별 예상 사건")

    interaction_types = [
        ("combinations", "합"),
        ("clashes", "충"),
        ("punishments", "형"),
        ("harms", "해"),
        ("destructions", "파"),
    ]

    for key, type_name in interaction_types:
        items = interactions.get(key, [])
        if items:
            inter_data = get_interaction_events(type_name, language)
            events_str = ", ".join(inter_data["events"][:3])
            lines.append(f"- **{type_name}** ({len(items)}건): {events_str}")

    lines.append("")

    # 안내 문구
    if language == "en":
        lines.append("*Use the above as reference material for narrative generation. Do not list events mechanically.*")
    else:
        lines.append("*위 내용을 참고하여 서술적으로 분석해 주세요. 기계적 나열은 지양합니다.*")

    return "\n".join(lines)


# ============================================
# 모듈 초기화
# ============================================

__all__ = [
    "MULSANGRON",
    "INTERACTION_MULSANG",
    "EventPrediction",
    "get_ten_god_events",
    "get_interaction_events",
    "generate_event_prediction_template",
]
