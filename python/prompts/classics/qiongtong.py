"""
궁통보감(窮通寶鑑) 조후론 - 다국어 지원
명대 여춘태(余春台) 편집 - 조후용신의 정수

지원 언어: ko, en, ja, zh-CN, zh-TW
"""
from dataclasses import dataclass, field
from typing import List, Dict, Literal

LanguageType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


@dataclass
class SeasonalElement:
    """계절별 오행 특성 (다국어)"""
    season: Dict[str, str]      # 계절명 (언어별)
    chinese: str                # 한자 (공통)
    months: List[str]           # 해당 월지 (공통)
    strong: Dict[str, str]      # 왕성한 오행
    emerging: Dict[str, str]    # 상생하는 오행
    resting: Dict[str, str]     # 휴식하는 오행
    confined: Dict[str, str]    # 갇힌 오행
    dead: Dict[str, str]        # 죽은 오행
    climate: Dict[str, str]     # 기후 특성
    needed: Dict[str, str]      # 필요한 조후


@dataclass
class DayMasterMonth:
    """일간별 월령 조후 용신 (다국어)"""
    day_master: str             # 일간 (한자)
    month: str                  # 월지 (한자)
    primary: str                # 1순위 용신 (한자)
    secondary: str              # 2순위 용신 (한자)
    reason: Dict[str, str]      # 이유 (언어별)
    avoid: Dict[str, str]       # 피해야 할 것 (언어별)


class QiongtongPrompt:
    """궁통보감 조후론 프롬프트 생성 (다국어 지원)"""

    # 섹션 제목 (다국어)
    HEADERS: Dict[str, Dict[str, str]] = {
        "title": {
            "ko": "# 궁통보감(窮通寶鑑) 조후론\n",
            "en": "# Qiong Tong Bao Jian (窮通寶鑑) - Climate Balancing Theory\n",
            "ja": "# 窮通宝鑑（きゅうつうほうかん）調候論\n",
            "zh-CN": "# 穷通宝鉴 调候论\n",
            "zh-TW": "# 窮通寶鑑 調候論\n"
        },
        "subtitle": {
            "ko": "명대 여춘태(余春台) 편집의 조후 중심 분석법입니다.\n조후(調候)란 사주의 한난조습(寒暖燥濕)을 조절하는 것입니다.\n",
            "en": "A climate-focused analysis method compiled by Yu Chuntai (余春台) in the Ming Dynasty.\nClimate Balancing (調候) refers to regulating the Cold-Warm-Dry-Wet aspects of a chart.\n",
            "ja": "明代の余春台（よしゅんたい）編集の調候中心の分析法です。\n調候（ちょうこう）とは四柱の寒暖燥湿を調節することです。\n",
            "zh-CN": "明代余春台编辑的调候中心分析法。\n调候是指调节四柱的寒暖燥湿。\n",
            "zh-TW": "明代余春台編輯的調候中心分析法。\n調候是指調節四柱的寒暖燥濕。\n"
        },
        "seasonal": {
            "ko": "## 계절별 오행 왕쇠(旺衰)\n\n출생 월에 따라 오행의 강약이 달라집니다.\n",
            "en": "## Seasonal Five Element Strength (旺衰)\n\nThe strength of Five Elements varies by birth month.\n",
            "ja": "## 季節別五行旺衰（おうすい）\n\n出生月によって五行の強弱が変わります。\n",
            "zh-CN": "## 季节五行旺衰\n\n出生月份决定五行的强弱。\n",
            "zh-TW": "## 季節五行旺衰\n\n出生月份決定五行的強弱。\n"
        },
        "johu": {
            "ko": "## 조후(調候) 4원리 - 한난조습(寒暖燥濕)\n\n사주의 기후적 균형을 맞추는 것이 조후입니다.\n",
            "en": "## Four Principles of Climate Balancing - Cold, Warm, Dry, Wet\n\nClimate balancing ensures harmony in the chart's elemental temperature.\n",
            "ja": "## 調候４原理 - 寒暖燥湿\n\n四柱の気候的バランスを整えるのが調候です。\n",
            "zh-CN": "## 调候四原理 - 寒暖燥湿\n\n调候是平衡四柱的气候。\n",
            "zh-TW": "## 調候四原理 - 寒暖燥濕\n\n調候是平衡四柱的氣候。\n"
        },
        "monthly": {
            "ko": "## 일간별 월령 조후 용신표\n\n일간과 출생월에 따른 조후 용신입니다.\n",
            "en": "## Day Master Monthly Climate God Table\n\nClimate gods based on Day Master and birth month.\n",
            "ja": "## 日干別月令調候用神表\n\n日干と出生月による調候用神です。\n",
            "zh-CN": "## 日干月令调候用神表\n\n根据日干和出生月的调候用神。\n",
            "zh-TW": "## 日干月令調候用神表\n\n根據日干和出生月的調候用神。\n"
        }
    }

    # 레이블 (다국어)
    LABELS: Dict[str, Dict[str, str]] = {
        "months": {
            "ko": "해당 월지",
            "en": "Months",
            "ja": "該当月支",
            "zh-CN": "相关月支",
            "zh-TW": "相關月支"
        },
        "strong": {
            "ko": "旺(왕성)",
            "en": "Strong (旺)",
            "ja": "旺（旺盛）",
            "zh-CN": "旺（旺盛）",
            "zh-TW": "旺（旺盛）"
        },
        "emerging": {
            "ko": "相(생조)",
            "en": "Emerging (相)",
            "ja": "相（生助）",
            "zh-CN": "相（生助）",
            "zh-TW": "相（生助）"
        },
        "resting": {
            "ko": "休(휴식)",
            "en": "Resting (休)",
            "ja": "休（休息）",
            "zh-CN": "休（休息）",
            "zh-TW": "休（休息）"
        },
        "confined": {
            "ko": "囚(갇힘)",
            "en": "Confined (囚)",
            "ja": "囚（囚われ）",
            "zh-CN": "囚（被困）",
            "zh-TW": "囚（被困）"
        },
        "dead": {
            "ko": "死(쇠약)",
            "en": "Weak (死)",
            "ja": "死（衰弱）",
            "zh-CN": "死（衰弱）",
            "zh-TW": "死（衰弱）"
        },
        "climate": {
            "ko": "기후",
            "en": "Climate",
            "ja": "気候",
            "zh-CN": "气候",
            "zh-TW": "氣候"
        },
        "needed": {
            "ko": "조후 필요",
            "en": "Climate Need",
            "ja": "調候の必要",
            "zh-CN": "调候需要",
            "zh-TW": "調候需要"
        },
        "condition": {
            "ko": "조건",
            "en": "Condition",
            "ja": "条件",
            "zh-CN": "条件",
            "zh-TW": "條件"
        },
        "solution": {
            "ko": "해결",
            "en": "Solution",
            "ja": "解決",
            "zh-CN": "解决",
            "zh-TW": "解決"
        },
        "effect": {
            "ko": "효과",
            "en": "Effect",
            "ja": "効果",
            "zh-CN": "效果",
            "zh-TW": "效果"
        },
        "avoid": {
            "ko": "피할 것",
            "en": "Avoid",
            "ja": "避けるべき",
            "zh-CN": "避免",
            "zh-TW": "避免"
        },
        "day_master": {
            "ko": "일간",
            "en": "Day Master",
            "ja": "日干",
            "zh-CN": "日干",
            "zh-TW": "日干"
        },
        "month_label": {
            "ko": "월",
            "en": "month",
            "ja": "月",
            "zh-CN": "月",
            "zh-TW": "月"
        }
    }

    # 계절별 오행 왕쇠(旺衰) (다국어)
    SEASONAL_ELEMENTS: List[SeasonalElement] = [
        SeasonalElement(
            season={
                "ko": "봄",
                "en": "Spring",
                "ja": "春",
                "zh-CN": "春",
                "zh-TW": "春"
            },
            chinese="春 (寅卯辰月)",
            months=["寅", "卯", "辰"],
            strong={
                "ko": "木 (旺)",
                "en": "Wood (Strong)",
                "ja": "木（旺）",
                "zh-CN": "木（旺）",
                "zh-TW": "木（旺）"
            },
            emerging={
                "ko": "火 (相)",
                "en": "Fire (Emerging)",
                "ja": "火（相）",
                "zh-CN": "火（相）",
                "zh-TW": "火（相）"
            },
            resting={
                "ko": "水 (休)",
                "en": "Water (Resting)",
                "ja": "水（休）",
                "zh-CN": "水（休）",
                "zh-TW": "水（休）"
            },
            confined={
                "ko": "金 (囚)",
                "en": "Metal (Confined)",
                "ja": "金（囚）",
                "zh-CN": "金（囚）",
                "zh-TW": "金（囚）"
            },
            dead={
                "ko": "土 (死)",
                "en": "Earth (Weak)",
                "ja": "土（死）",
                "zh-CN": "土（死）",
                "zh-TW": "土（死）"
            },
            climate={
                "ko": "따뜻하고 습함 (暖濕)",
                "en": "Warm and Humid (暖濕)",
                "ja": "暖かく湿る（暖湿）",
                "zh-CN": "温暖湿润（暖湿）",
                "zh-TW": "溫暖濕潤（暖濕）"
            },
            needed={
                "ko": "火로 따뜻하게, 金으로 조절, 水 적당히",
                "en": "Fire for warmth, Metal for balance, Water in moderation",
                "ja": "火で暖め、金で調節、水は適度に",
                "zh-CN": "火暖身，金调节，水适量",
                "zh-TW": "火暖身，金調節，水適量"
            }
        ),
        SeasonalElement(
            season={
                "ko": "여름",
                "en": "Summer",
                "ja": "夏",
                "zh-CN": "夏",
                "zh-TW": "夏"
            },
            chinese="夏 (巳午未月)",
            months=["巳", "午", "未"],
            strong={
                "ko": "火 (旺)",
                "en": "Fire (Strong)",
                "ja": "火（旺）",
                "zh-CN": "火（旺）",
                "zh-TW": "火（旺）"
            },
            emerging={
                "ko": "土 (相)",
                "en": "Earth (Emerging)",
                "ja": "土（相）",
                "zh-CN": "土（相）",
                "zh-TW": "土（相）"
            },
            resting={
                "ko": "木 (休)",
                "en": "Wood (Resting)",
                "ja": "木（休）",
                "zh-CN": "木（休）",
                "zh-TW": "木（休）"
            },
            confined={
                "ko": "水 (囚)",
                "en": "Water (Confined)",
                "ja": "水（囚）",
                "zh-CN": "水（囚）",
                "zh-TW": "水（囚）"
            },
            dead={
                "ko": "金 (死)",
                "en": "Metal (Weak)",
                "ja": "金（死）",
                "zh-CN": "金（死）",
                "zh-TW": "金（死）"
            },
            climate={
                "ko": "덥고 건조함 (炎燥)",
                "en": "Hot and Dry (炎燥)",
                "ja": "暑く乾燥（炎燥）",
                "zh-CN": "炎热干燥（炎燥）",
                "zh-TW": "炎熱乾燥（炎燥）"
            },
            needed={
                "ko": "水로 시원하게 (필수), 金으로 水 생조",
                "en": "Water for cooling (essential), Metal to support Water",
                "ja": "水で涼しく（必須）、金で水を生助",
                "zh-CN": "水降温（必须），金生水",
                "zh-TW": "水降溫（必須），金生水"
            }
        ),
        SeasonalElement(
            season={
                "ko": "가을",
                "en": "Autumn",
                "ja": "秋",
                "zh-CN": "秋",
                "zh-TW": "秋"
            },
            chinese="秋 (申酉戌月)",
            months=["申", "酉", "戌"],
            strong={
                "ko": "金 (旺)",
                "en": "Metal (Strong)",
                "ja": "金（旺）",
                "zh-CN": "金（旺）",
                "zh-TW": "金（旺）"
            },
            emerging={
                "ko": "水 (相)",
                "en": "Water (Emerging)",
                "ja": "水（相）",
                "zh-CN": "水（相）",
                "zh-TW": "水（相）"
            },
            resting={
                "ko": "土 (休)",
                "en": "Earth (Resting)",
                "ja": "土（休）",
                "zh-CN": "土（休）",
                "zh-TW": "土（休）"
            },
            confined={
                "ko": "火 (囚)",
                "en": "Fire (Confined)",
                "ja": "火（囚）",
                "zh-CN": "火（囚）",
                "zh-TW": "火（囚）"
            },
            dead={
                "ko": "木 (死)",
                "en": "Wood (Weak)",
                "ja": "木（死）",
                "zh-CN": "木（死）",
                "zh-TW": "木（死）"
            },
            climate={
                "ko": "서늘하고 건조함 (凉燥)",
                "en": "Cool and Dry (凉燥)",
                "ja": "涼しく乾燥（涼燥）",
                "zh-CN": "凉爽干燥（凉燥）",
                "zh-TW": "涼爽乾燥（涼燥）"
            },
            needed={
                "ko": "火로 따뜻하게, 水로 습윤하게",
                "en": "Fire for warmth, Water for moisture",
                "ja": "火で暖め、水で潤す",
                "zh-CN": "火暖身，水润燥",
                "zh-TW": "火暖身，水潤燥"
            }
        ),
        SeasonalElement(
            season={
                "ko": "겨울",
                "en": "Winter",
                "ja": "冬",
                "zh-CN": "冬",
                "zh-TW": "冬"
            },
            chinese="冬 (亥子丑月)",
            months=["亥", "子", "丑"],
            strong={
                "ko": "水 (旺)",
                "en": "Water (Strong)",
                "ja": "水（旺）",
                "zh-CN": "水（旺）",
                "zh-TW": "水（旺）"
            },
            emerging={
                "ko": "木 (相)",
                "en": "Wood (Emerging)",
                "ja": "木（相）",
                "zh-CN": "木（相）",
                "zh-TW": "木（相）"
            },
            resting={
                "ko": "金 (休)",
                "en": "Metal (Resting)",
                "ja": "金（休）",
                "zh-CN": "金（休）",
                "zh-TW": "金（休）"
            },
            confined={
                "ko": "土 (囚)",
                "en": "Earth (Confined)",
                "ja": "土（囚）",
                "zh-CN": "土（囚）",
                "zh-TW": "土（囚）"
            },
            dead={
                "ko": "火 (死)",
                "en": "Fire (Weak)",
                "ja": "火（死）",
                "zh-CN": "火（死）",
                "zh-TW": "火（死）"
            },
            climate={
                "ko": "춥고 습함 (寒濕)",
                "en": "Cold and Humid (寒濕)",
                "ja": "寒く湿る（寒湿）",
                "zh-CN": "寒冷湿润（寒湿）",
                "zh-TW": "寒冷濕潤（寒濕）"
            },
            needed={
                "ko": "火로 따뜻하게 (필수), 木으로 火 생조",
                "en": "Fire for warmth (essential), Wood to support Fire",
                "ja": "火で暖め（必須）、木で火を生助",
                "zh-CN": "火暖身（必须），木生火",
                "zh-TW": "火暖身（必須），木生火"
            }
        )
    ]

    # 조후(調候) 4원리 (다국어)
    JOHU_PRINCIPLES: Dict[str, Dict[str, Dict[str, str]]] = {
        "han": {
            "name": {
                "ko": "한 寒 (차가움)",
                "en": "Cold (寒)",
                "ja": "寒（冷たさ）",
                "zh-CN": "寒（寒冷）",
                "zh-TW": "寒（寒冷）"
            },
            "condition": {
                "ko": "겨울(亥子丑월) 출생, 水가 많은 사주 - 기운이 얼어붙어 활력이 부족할 수 있음",
                "en": "Born in winter (亥子丑 months), chart with excess Water - energy may freeze, lacking vitality",
                "ja": "冬（亥子丑月）生まれ、水が多い四柱 - 気が凍り活力が不足しがち",
                "zh-CN": "冬季（亥子丑月）出生，水多的四柱 - 气被冻住，活力不足",
                "zh-TW": "冬季（亥子丑月）出生，水多的四柱 - 氣被凍住，活力不足"
            },
            "solution": {
                "ko": "火로 따뜻하게 (丙火 최우선, 丁火 차선) - 태양의 온기가 얼어붙은 기운을 녹여줌",
                "en": "Warm with Fire (丙 Fire is best, 丁 Fire secondary) - Sun's warmth melts frozen energy",
                "ja": "火で暖める（丙火が最優先、丁火が次善）- 太陽の温かさが凍った気を溶かす",
                "zh-CN": "用火暖身（丙火最优先，丁火次之）- 太阳的温暖融化冻结的气",
                "zh-TW": "用火暖身（丙火最優先，丁火次之）- 太陽的溫暖融化凍結的氣"
            },
            "effect": {
                "ko": "火가 없으면 기운이 얼어붙어 발전이 어려움",
                "en": "Without Fire, energy remains frozen, hindering progress",
                "ja": "火がなければ気が凍り発展が難しい",
                "zh-CN": "没有火，气冻住，难以发展",
                "zh-TW": "沒有火，氣凍住，難以發展"
            }
        },
        "nan": {
            "name": {
                "ko": "난 暖 (따뜻함 과다)",
                "en": "Warm Excess (暖)",
                "ja": "暖（暖かさ過多）",
                "zh-CN": "暖（过暖）",
                "zh-TW": "暖（過暖）"
            },
            "condition": {
                "ko": "여름(巳午未월) 출생, 火가 많은 사주 - 기운이 과열되어 소진되기 쉬움",
                "en": "Born in summer (巳午未 months), chart with excess Fire - energy may overheat and exhaust",
                "ja": "夏（巳午未月）生まれ、火が多い四柱 - 気が過熱し消耗しやすい",
                "zh-CN": "夏季（巳午未月）出生，火多的四柱 - 气过热易消耗",
                "zh-TW": "夏季（巳午未月）出生，火多的四柱 - 氣過熱易消耗"
            },
            "solution": {
                "ko": "水로 시원하게 (壬水 최우선, 癸水 차선) - 시원한 물이 타오르는 기운을 진정시킴",
                "en": "Cool with Water (壬 Water is best, 癸 Water secondary) - Cool water calms burning energy",
                "ja": "水で涼しく（壬水が最優先、癸水が次善）- 涼しい水が燃える気を鎮める",
                "zh-CN": "用水降温（壬水最优先，癸水次之）- 凉水平息燃烧的气",
                "zh-TW": "用水降溫（壬水最優先，癸水次之）- 涼水平息燃燒的氣"
            },
            "effect": {
                "ko": "水가 없으면 기운이 타올라 고갈됨",
                "en": "Without Water, energy burns out and depletes",
                "ja": "水がなければ気が燃え尽き枯渇する",
                "zh-CN": "没有水，气燃烧耗尽",
                "zh-TW": "沒有水，氣燃燒耗盡"
            }
        },
        "jo": {
            "name": {
                "ko": "조 燥 (건조함)",
                "en": "Dry (燥)",
                "ja": "燥（乾燥）",
                "zh-CN": "燥（干燥）",
                "zh-TW": "燥（乾燥）"
            },
            "condition": {
                "ko": "火土가 많거나, 戌未월 출생 - 수분이 부족하여 유연성이 떨어질 수 있음",
                "en": "Excess Fire/Earth, or born in 戌未 months - lacks moisture, may be inflexible",
                "ja": "火土が多い、または戌未月生まれ - 水分不足で柔軟性が欠ける",
                "zh-CN": "火土多或戌未月出生 - 缺水分，可能不够灵活",
                "zh-TW": "火土多或戌未月出生 - 缺水分，可能不夠靈活"
            },
            "solution": {
                "ko": "水로 습윤하게, 金으로 水 생조 - 적절한 수분 공급으로 생기를 불어넣음",
                "en": "Moisten with Water, Metal supports Water - proper hydration restores vitality",
                "ja": "水で潤し、金で水を生助 - 適切な水分補給で生気を吹き込む",
                "zh-CN": "用水润燥，金生水 - 适当补水恢复生气",
                "zh-TW": "用水潤燥，金生水 - 適當補水恢復生氣"
            },
            "effect": {
                "ko": "水가 없으면 만물이 시들어 생기가 없음",
                "en": "Without Water, all withers and loses vitality",
                "ja": "水がなければ万物が枯れ生気がない",
                "zh-CN": "没有水，万物枯萎无生气",
                "zh-TW": "沒有水，萬物枯萎無生氣"
            }
        },
        "seup": {
            "name": {
                "ko": "습 濕 (습함)",
                "en": "Humid (濕)",
                "ja": "湿（湿気）",
                "zh-CN": "湿（潮湿）",
                "zh-TW": "濕（潮濕）"
            },
            "condition": {
                "ko": "水가 많거나, 辰丑월 출생 - 과다한 습기로 무거워질 수 있음",
                "en": "Excess Water, or born in 辰丑 months - too much moisture may cause heaviness",
                "ja": "水が多い、または辰丑月生まれ - 過度な湿気で重くなりがち",
                "zh-CN": "水多或辰丑月出生 - 湿气过重可能沉重",
                "zh-TW": "水多或辰丑月出生 - 濕氣過重可能沉重"
            },
            "solution": {
                "ko": "火로 건조하게, 木으로 水 설기 - 따뜻한 기운으로 습기를 말려줌",
                "en": "Dry with Fire, Wood releases Water - warmth dries excess moisture",
                "ja": "火で乾かし、木で水を泄す - 暖かい気で湿気を乾かす",
                "zh-CN": "用火干燥，木泄水 - 温暖的气蒸发湿气",
                "zh-TW": "用火乾燥，木洩水 - 溫暖的氣蒸發濕氣"
            },
            "effect": {
                "ko": "火가 없으면 음습하여 병이 생기기 쉬움",
                "en": "Without Fire, dampness may cause health issues",
                "ja": "火がなければ陰湿で病気になりやすい",
                "zh-CN": "没有火，阴湿容易生病",
                "zh-TW": "沒有火，陰濕容易生病"
            }
        }
    }

    # 일간별 월령 조후 용신표 (핵심 케이스) - 다국어
    MONTHLY_YONGSHIN: Dict[str, List[DayMasterMonth]] = {
        "甲": [
            DayMasterMonth("甲", "寅", "丙", "癸",
                          reason={
                              "ko": "봄 甲木은 火로 설기하되, 癸水로 뿌리 보호",
                              "en": "Spring 甲 Wood: Fire releases energy, 癸 Water protects roots",
                              "ja": "春の甲木は火で泄気し、癸水で根を保護",
                              "zh-CN": "春季甲木用火泄气，癸水护根",
                              "zh-TW": "春季甲木用火洩氣，癸水護根"
                          },
                          avoid={
                              "ko": "庚金 과다 - 새싹을 베는 것과 같음",
                              "en": "Excess 庚 Metal - like cutting new sprouts",
                              "ja": "庚金過多 - 新芽を切るようなもの",
                              "zh-CN": "庚金过多 - 如砍新芽",
                              "zh-TW": "庚金過多 - 如砍新芽"
                          }),
            DayMasterMonth("甲", "卯", "丙", "癸",
                          reason={
                              "ko": "왕성한 봄 木은 火로 재능 발휘, 水로 자양",
                              "en": "Strong spring Wood: Fire expresses talent, Water nourishes",
                              "ja": "旺盛な春の木は火で才能発揮、水で滋養",
                              "zh-CN": "旺盛春木用火发挥才能，水滋养",
                              "zh-TW": "旺盛春木用火發揮才能，水滋養"
                          },
                          avoid={
                              "ko": "金 충극 - 성장을 방해함",
                              "en": "Metal clash - obstructs growth",
                              "ja": "金の衝剋 - 成長を妨げる",
                              "zh-CN": "金冲克 - 阻碍成长",
                              "zh-TW": "金沖剋 - 阻礙成長"
                          }),
            DayMasterMonth("甲", "辰", "庚", "丙",
                          reason={
                              "ko": "봄 끝자락 木은 金으로 다듬고 火로 따뜻하게",
                              "en": "Late spring Wood: Metal refines, Fire warms",
                              "ja": "晩春の木は金で整え火で暖める",
                              "zh-CN": "晚春木用金修剪，火温暖",
                              "zh-TW": "晚春木用金修剪，火溫暖"
                          },
                          avoid={
                              "ko": "土 과다 - 습토가 뿌리를 썩게 함",
                              "en": "Excess Earth - wet soil rots roots",
                              "ja": "土過多 - 湿土が根を腐らせる",
                              "zh-CN": "土过多 - 湿土烂根",
                              "zh-TW": "土過多 - 濕土爛根"
                          }),
            DayMasterMonth("甲", "巳", "癸", "丁",
                          reason={
                              "ko": "여름 甲木은 水가 필수, 작은 火로 조절",
                              "en": "Summer 甲 Wood: Water essential, small Fire for balance",
                              "ja": "夏の甲木は水が必須、小さな火で調節",
                              "zh-CN": "夏季甲木水必须，小火调节",
                              "zh-TW": "夏季甲木水必須，小火調節"
                          },
                          avoid={
                              "ko": "火 과다 - 나무가 말라버림",
                              "en": "Excess Fire - Wood dries out",
                              "ja": "火過多 - 木が枯れる",
                              "zh-CN": "火过多 - 木干枯",
                              "zh-TW": "火過多 - 木乾枯"
                          }),
            DayMasterMonth("甲", "午", "癸", "丁",
                          reason={
                              "ko": "한여름 甲木은 물이 마르니 癸水 필수",
                              "en": "Midsummer 甲 Wood: Water dries up, 癸 Water essential",
                              "ja": "真夏の甲木は水が干上がるので癸水が必須",
                              "zh-CN": "盛夏甲木水干涸，癸水必须",
                              "zh-TW": "盛夏甲木水乾涸，癸水必須"
                          },
                          avoid={
                              "ko": "丙火 과다 - 완전히 타버릴 수 있음",
                              "en": "Excess 丙 Fire - may burn completely",
                              "ja": "丙火過多 - 完全に燃え尽きる恐れ",
                              "zh-CN": "丙火过多 - 可能完全烧毁",
                              "zh-TW": "丙火過多 - 可能完全燒毀"
                          }),
            DayMasterMonth("甲", "未", "癸", "丁",
                          reason={
                              "ko": "늦여름 甲木은 뿌리 보호 위해 水 필수",
                              "en": "Late summer 甲 Wood: Water essential for root protection",
                              "ja": "晩夏の甲木は根の保護のため水が必須",
                              "zh-CN": "晚夏甲木护根需水",
                              "zh-TW": "晚夏甲木護根需水"
                          },
                          avoid={
                              "ko": "燥土 - 건조한 흙이 수분을 빼앗음",
                              "en": "Dry Earth - absorbs moisture",
                              "ja": "燥土 - 乾いた土が水分を奪う",
                              "zh-CN": "燥土 - 干土吸水",
                              "zh-TW": "燥土 - 乾土吸水"
                          }),
            DayMasterMonth("甲", "申", "丁", "庚",
                          reason={
                              "ko": "가을 甲木은 金 극복 위해 火로 제련",
                              "en": "Autumn 甲 Wood: Fire smelts Metal to overcome",
                              "ja": "秋の甲木は金を克服するため火で制錬",
                              "zh-CN": "秋季甲木用火制金",
                              "zh-TW": "秋季甲木用火制金"
                          },
                          avoid={
                              "ko": "水 부족 - 金이 木을 직접 공격함",
                              "en": "Water shortage - Metal attacks Wood directly",
                              "ja": "水不足 - 金が木を直接攻撃",
                              "zh-CN": "水不足 - 金直接克木",
                              "zh-TW": "水不足 - 金直接剋木"
                          }),
            DayMasterMonth("甲", "酉", "丁", "庚",
                          reason={
                              "ko": "金旺절 甲木은 丁火로 금극 극복",
                              "en": "Metal-strong season: 丁 Fire overcomes Metal",
                              "ja": "金旺節の甲木は丁火で金克を克服",
                              "zh-CN": "金旺月甲木用丁火制金",
                              "zh-TW": "金旺月甲木用丁火制金"
                          },
                          avoid={
                              "ko": "庚金 직극 - 도끼로 베이는 것과 같음",
                              "en": "Direct 庚 Metal - like being cut by an axe",
                              "ja": "庚金の直剋 - 斧で切られるようなもの",
                              "zh-CN": "庚金直克 - 如被斧砍",
                              "zh-TW": "庚金直剋 - 如被斧砍"
                          }),
            DayMasterMonth("甲", "戌", "庚", "丁",
                          reason={
                              "ko": "늦가을 甲木은 金으로 다듬고 火로 온난",
                              "en": "Late autumn 甲 Wood: Metal refines, Fire warms",
                              "ja": "晩秋の甲木は金で整え火で温暖に",
                              "zh-CN": "晚秋甲木金修剪，火温暖",
                              "zh-TW": "晚秋甲木金修剪，火溫暖"
                          },
                          avoid={
                              "ko": "燥土 - 수분이 말라 뿌리가 약해짐",
                              "en": "Dry Earth - moisture dries, roots weaken",
                              "ja": "燥土 - 水分が枯れ根が弱る",
                              "zh-CN": "燥土 - 干燥伤根",
                              "zh-TW": "燥土 - 乾燥傷根"
                          }),
            DayMasterMonth("甲", "亥", "庚", "丙",
                          reason={
                              "ko": "겨울 시작 甲木은 뿌리 강화, 火로 따뜻하게",
                              "en": "Early winter 甲 Wood: strengthen roots, Fire for warmth",
                              "ja": "初冬の甲木は根を強化し、火で暖める",
                              "zh-CN": "初冬甲木强根，火暖身",
                              "zh-TW": "初冬甲木強根，火暖身"
                          },
                          avoid={
                              "ko": "水 과다 - 뿌리가 물에 잠김",
                              "en": "Excess Water - roots submerged",
                              "ja": "水過多 - 根が水に浸かる",
                              "zh-CN": "水过多 - 根被淹",
                              "zh-TW": "水過多 - 根被淹"
                          }),
            DayMasterMonth("甲", "子", "丙", "庚",
                          reason={
                              "ko": "한겨울 甲木은 丙火로 따뜻함 필수",
                              "en": "Midwinter 甲 Wood: 丙 Fire warmth essential",
                              "ja": "真冬の甲木は丙火の暖かさが必須",
                              "zh-CN": "严冬甲木丙火温暖必须",
                              "zh-TW": "嚴冬甲木丙火溫暖必須"
                          },
                          avoid={
                              "ko": "凍水 - 물이 얼어 흡수 불가",
                              "en": "Frozen Water - cannot absorb frozen water",
                              "ja": "凍水 - 水が凍って吸収できない",
                              "zh-CN": "冻水 - 水冻结无法吸收",
                              "zh-TW": "凍水 - 水凍結無法吸收"
                          }),
            DayMasterMonth("甲", "丑", "丙", "庚",
                          reason={
                              "ko": "겨울 끝 甲木은 해동 위해 丙火 필수",
                              "en": "Late winter 甲 Wood: 丙 Fire essential for thawing",
                              "ja": "冬の終わりの甲木は解凍のため丙火が必須",
                              "zh-CN": "冬末甲木丙火解冻必须",
                              "zh-TW": "冬末甲木丙火解凍必須"
                          },
                          avoid={
                              "ko": "寒土 - 차가운 흙이 뿌리를 얼림",
                              "en": "Cold Earth - freezes roots",
                              "ja": "寒土 - 冷たい土が根を凍らせる",
                              "zh-CN": "寒土 - 冷土冻根",
                              "zh-TW": "寒土 - 冷土凍根"
                          })
        ],
        "乙": [
            DayMasterMonth("乙", "寅", "丙", "癸",
                          reason={
                              "ko": "봄 乙木은 따뜻한 햇살(丙)과 이슬(癸)",
                              "en": "Spring 乙 Wood: warm sunshine (丙) and dew (癸)",
                              "ja": "春の乙木は暖かい日差し（丙）と露（癸）",
                              "zh-CN": "春季乙木需温暖阳光（丙）和露水（癸）",
                              "zh-TW": "春季乙木需溫暖陽光（丙）和露水（癸）"
                          },
                          avoid={
                              "ko": "金 과다 - 연약한 풀을 베어버림",
                              "en": "Excess Metal - cuts tender grass",
                              "ja": "金過多 - 柔らかい草を刈ってしまう",
                              "zh-CN": "金过多 - 割断嫩草",
                              "zh-TW": "金過多 - 割斷嫩草"
                          }),
            DayMasterMonth("乙", "午", "癸", "丙",
                          reason={
                              "ko": "한여름 乙木은 癸水 없으면 시듦",
                              "en": "Midsummer 乙 Wood: withers without 癸 Water",
                              "ja": "真夏の乙木は癸水がなければ枯れる",
                              "zh-CN": "盛夏乙木无癸水会枯萎",
                              "zh-TW": "盛夏乙木無癸水會枯萎"
                          },
                          avoid={
                              "ko": "火 과다 - 풀이 타버림",
                              "en": "Excess Fire - grass burns",
                              "ja": "火過多 - 草が燃える",
                              "zh-CN": "火过多 - 草被烧",
                              "zh-TW": "火過多 - 草被燒"
                          }),
            DayMasterMonth("乙", "子", "丙", "戊",
                          reason={
                              "ko": "한겨울 乙木은 얼지 않게 丙火 필수",
                              "en": "Midwinter 乙 Wood: 丙 Fire essential to prevent freezing",
                              "ja": "真冬の乙木は凍らないよう丙火が必須",
                              "zh-CN": "严冬乙木丙火防冻必须",
                              "zh-TW": "嚴冬乙木丙火防凍必須"
                          },
                          avoid={
                              "ko": "凍水 - 뿌리가 얼어붙음",
                              "en": "Frozen Water - roots freeze",
                              "ja": "凍水 - 根が凍る",
                              "zh-CN": "冻水 - 根被冻",
                              "zh-TW": "凍水 - 根被凍"
                          })
        ],
        "丙": [
            DayMasterMonth("丙", "寅", "壬", "庚",
                          reason={
                              "ko": "봄 丙火는 왕성하니 壬水로 제어",
                              "en": "Spring 丙 Fire: strong, control with 壬 Water",
                              "ja": "春の丙火は旺盛なので壬水で制御",
                              "zh-CN": "春季丙火旺盛，壬水制衡",
                              "zh-TW": "春季丙火旺盛，壬水制衡"
                          },
                          avoid={
                              "ko": "木 과다 - 불이 너무 커짐",
                              "en": "Excess Wood - Fire grows too large",
                              "ja": "木過多 - 火が大きくなりすぎる",
                              "zh-CN": "木过多 - 火势过旺",
                              "zh-TW": "木過多 - 火勢過旺"
                          }),
            DayMasterMonth("丙", "午", "壬", "庚",
                          reason={
                              "ko": "한여름 丙火는 壬水 없으면 타오름",
                              "en": "Midsummer 丙 Fire: burns out without 壬 Water",
                              "ja": "真夏の丙火は壬水がなければ燃え尽きる",
                              "zh-CN": "盛夏丙火无壬水会燃尽",
                              "zh-TW": "盛夏丙火無壬水會燃盡"
                          },
                          avoid={
                              "ko": "火 과다 - 스스로 소진됨",
                              "en": "Excess Fire - burns itself out",
                              "ja": "火過多 - 自ら消耗する",
                              "zh-CN": "火过多 - 自我消耗",
                              "zh-TW": "火過多 - 自我消耗"
                          }),
            DayMasterMonth("丙", "子", "壬", "甲",
                          reason={
                              "ko": "겨울 丙火는 壬水 있어야 빛남(水輝映)",
                              "en": "Winter 丙 Fire: shines with 壬 Water (Water reflects light)",
                              "ja": "冬の丙火は壬水があってこそ輝く（水輝映）",
                              "zh-CN": "冬季丙火有壬水才能辉映（水辉映）",
                              "zh-TW": "冬季丙火有壬水才能輝映（水輝映）"
                          },
                          avoid={
                              "ko": "土 과다 - 빛을 가려버림",
                              "en": "Excess Earth - blocks light",
                              "ja": "土過多 - 光を遮る",
                              "zh-CN": "土过多 - 遮挡光芒",
                              "zh-TW": "土過多 - 遮擋光芒"
                          })
        ],
        "丁": [
            DayMasterMonth("丁", "寅", "甲", "庚",
                          reason={
                              "ko": "봄 丁火는 甲木이 연료, 庚으로 조절",
                              "en": "Spring 丁 Fire: 甲 Wood as fuel, 庚 for control",
                              "ja": "春の丁火は甲木が燃料、庚で調節",
                              "zh-CN": "春季丁火甲木为燃料，庚调节",
                              "zh-TW": "春季丁火甲木為燃料，庚調節"
                          },
                          avoid={
                              "ko": "水 과다 - 불이 꺼짐",
                              "en": "Excess Water - Fire extinguishes",
                              "ja": "水過多 - 火が消える",
                              "zh-CN": "水过多 - 火被灭",
                              "zh-TW": "水過多 - 火被滅"
                          }),
            DayMasterMonth("丁", "午", "甲", "庚壬",
                          reason={
                              "ko": "여름 丁火는 甲木 연료와 水로 조절",
                              "en": "Summer 丁 Fire: 甲 Wood fuel and Water for control",
                              "ja": "夏の丁火は甲木燃料と水で調節",
                              "zh-CN": "夏季丁火甲木燃料，水调节",
                              "zh-TW": "夏季丁火甲木燃料，水調節"
                          },
                          avoid={
                              "ko": "火 과다 - 연료가 빨리 소진됨",
                              "en": "Excess Fire - fuel depletes quickly",
                              "ja": "火過多 - 燃料が早く消耗",
                              "zh-CN": "火过多 - 燃料快速消耗",
                              "zh-TW": "火過多 - 燃料快速消耗"
                          }),
            DayMasterMonth("丁", "子", "甲", "庚",
                          reason={
                              "ko": "겨울 丁火는 甲木 연료 필수",
                              "en": "Winter 丁 Fire: 甲 Wood fuel essential",
                              "ja": "冬の丁火は甲木の燃料が必須",
                              "zh-CN": "冬季丁火甲木燃料必须",
                              "zh-TW": "冬季丁火甲木燃料必須"
                          },
                          avoid={
                              "ko": "水 과다 - 작은 불이 쉽게 꺼짐",
                              "en": "Excess Water - small Fire easily extinguishes",
                              "ja": "水過多 - 小さな火は簡単に消える",
                              "zh-CN": "水过多 - 小火易灭",
                              "zh-TW": "水過多 - 小火易滅"
                          })
        ],
        "戊": [
            DayMasterMonth("戊", "寅", "丙", "甲",
                          reason={
                              "ko": "봄 戊土는 木극 받으니 丙火로 통관",
                              "en": "Spring 戊 Earth: receives Wood control, 丙 Fire mediates",
                              "ja": "春の戊土は木に剋されるので丙火で通関",
                              "zh-CN": "春季戊土受木克，丙火通关",
                              "zh-TW": "春季戊土受木剋，丙火通關"
                          },
                          avoid={
                              "ko": "水 과다 - 흙이 유실됨",
                              "en": "Excess Water - Earth erodes",
                              "ja": "水過多 - 土が流失する",
                              "zh-CN": "水过多 - 土被冲",
                              "zh-TW": "水過多 - 土被沖"
                          }),
            DayMasterMonth("戊", "午", "壬", "甲",
                          reason={
                              "ko": "여름 戊土는 건조하니 壬水 필수",
                              "en": "Summer 戊 Earth: dry, 壬 Water essential",
                              "ja": "夏の戊土は乾燥するので壬水が必須",
                              "zh-CN": "夏季戊土干燥，壬水必须",
                              "zh-TW": "夏季戊土乾燥，壬水必須"
                          },
                          avoid={
                              "ko": "火 과다 - 흙이 바싹 마름",
                              "en": "Excess Fire - Earth dries completely",
                              "ja": "火過多 - 土がカラカラに乾く",
                              "zh-CN": "火过多 - 土完全干裂",
                              "zh-TW": "火過多 - 土完全乾裂"
                          }),
            DayMasterMonth("戊", "子", "丙", "甲",
                          reason={
                              "ko": "겨울 戊土는 얼지 않게 丙火 필수",
                              "en": "Winter 戊 Earth: 丙 Fire essential to prevent freezing",
                              "ja": "冬の戊土は凍らないよう丙火が必須",
                              "zh-CN": "冬季戊土丙火防冻必须",
                              "zh-TW": "冬季戊土丙火防凍必須"
                          },
                          avoid={
                              "ko": "水 과다 - 흙이 진흙탕이 됨",
                              "en": "Excess Water - Earth becomes mud",
                              "ja": "水過多 - 土が泥になる",
                              "zh-CN": "水过多 - 土成泥",
                              "zh-TW": "水過多 - 土成泥"
                          })
        ],
        "己": [
            DayMasterMonth("己", "寅", "丙", "甲",
                          reason={
                              "ko": "봄 己土는 丙火로 따뜻하게, 甲으로 소통",
                              "en": "Spring 己 Earth: 丙 Fire warms, 甲 for communication",
                              "ja": "春の己土は丙火で暖め、甲で疎通",
                              "zh-CN": "春季己土丙火温暖，甲疏通",
                              "zh-TW": "春季己土丙火溫暖，甲疏通"
                          },
                          avoid={
                              "ko": "水 과다 - 부드러운 흙이 유실됨",
                              "en": "Excess Water - soft Earth erodes",
                              "ja": "水過多 - 柔らかい土が流失",
                              "zh-CN": "水过多 - 软土流失",
                              "zh-TW": "水過多 - 軟土流失"
                          }),
            DayMasterMonth("己", "午", "癸", "丙",
                          reason={
                              "ko": "여름 己土는 癸水로 습윤하게",
                              "en": "Summer 己 Earth: 癸 Water for moisture",
                              "ja": "夏の己土は癸水で潤す",
                              "zh-CN": "夏季己土癸水润泽",
                              "zh-TW": "夏季己土癸水潤澤"
                          },
                          avoid={
                              "ko": "火燥 과다 - 흙이 갈라짐",
                              "en": "Excess Fire/Dryness - Earth cracks",
                              "ja": "火燥過多 - 土がひび割れる",
                              "zh-CN": "火燥过多 - 土开裂",
                              "zh-TW": "火燥過多 - 土開裂"
                          }),
            DayMasterMonth("己", "子", "丙", "甲",
                          reason={
                              "ko": "겨울 己土는 丙火로 해동 필수",
                              "en": "Winter 己 Earth: 丙 Fire essential for thawing",
                              "ja": "冬の己土は丙火で解凍が必須",
                              "zh-CN": "冬季己土丙火解冻必须",
                              "zh-TW": "冬季己土丙火解凍必須"
                          },
                          avoid={
                              "ko": "水 과다 - 질퍽해져 쓸모없어짐",
                              "en": "Excess Water - becomes useless mud",
                              "ja": "水過多 - 泥濘になり使えなくなる",
                              "zh-CN": "水过多 - 成泥无用",
                              "zh-TW": "水過多 - 成泥無用"
                          })
        ],
        "庚": [
            DayMasterMonth("庚", "寅", "丁", "甲",
                          reason={
                              "ko": "봄 庚金은 丁火로 단련(煉金) - 제련해야 쓸모 있음",
                              "en": "Spring 庚 Metal: 丁 Fire tempers (煉金) - must smelt to be useful",
                              "ja": "春の庚金は丁火で鍛錬（煉金）- 精錬してこそ使える",
                              "zh-CN": "春季庚金丁火锻炼（炼金）- 需冶炼才有用",
                              "zh-TW": "春季庚金丁火鍛鍊（煉金）- 需冶煉才有用"
                          },
                          avoid={
                              "ko": "木 과다 - 금이 무뎌짐",
                              "en": "Excess Wood - Metal dulls",
                              "ja": "木過多 - 金が鈍る",
                              "zh-CN": "木过多 - 金钝化",
                              "zh-TW": "木過多 - 金鈍化"
                          }),
            DayMasterMonth("庚", "午", "壬", "戊",
                          reason={
                              "ko": "여름 庚金은 壬水로 淬火, 戊로 보호 - 담금질이 필요함",
                              "en": "Summer 庚 Metal: 壬 Water for quenching, 戊 for protection - needs tempering",
                              "ja": "夏の庚金は壬水で淬火、戊で保護 - 焼き入れが必要",
                              "zh-CN": "夏季庚金壬水淬火，戊保护 - 需淬火",
                              "zh-TW": "夏季庚金壬水淬火，戊保護 - 需淬火"
                          },
                          avoid={
                              "ko": "火 과다 - 금이 녹아버림",
                              "en": "Excess Fire - Metal melts",
                              "ja": "火過多 - 金が溶ける",
                              "zh-CN": "火过多 - 金熔化",
                              "zh-TW": "火過多 - 金熔化"
                          }),
            DayMasterMonth("庚", "子", "丁", "甲",
                          reason={
                              "ko": "겨울 庚金은 丁火로 따뜻하게 단련",
                              "en": "Winter 庚 Metal: 丁 Fire for warm tempering",
                              "ja": "冬の庚金は丁火で暖かく鍛錬",
                              "zh-CN": "冬季庚金丁火温暖锻炼",
                              "zh-TW": "冬季庚金丁火溫暖鍛鍊"
                          },
                          avoid={
                              "ko": "水 과다 - 금이 녹슬고 차가워짐",
                              "en": "Excess Water - Metal rusts and chills",
                              "ja": "水過多 - 金が錆び冷える",
                              "zh-CN": "水过多 - 金生锈变冷",
                              "zh-TW": "水過多 - 金生鏽變冷"
                          })
        ],
        "辛": [
            DayMasterMonth("辛", "寅", "壬", "甲",
                          reason={
                              "ko": "봄 辛金은 壬水로 씻어 빛남(金白水清) - 물에 씻어야 보석이 빛남",
                              "en": "Spring 辛 Metal: 壬 Water washes to shine (金白水清) - washed jewel shines",
                              "ja": "春の辛金は壬水で洗って輝く（金白水清）- 洗ってこそ宝石が輝く",
                              "zh-CN": "春季辛金壬水洗净发光（金白水清）- 水洗宝石才亮",
                              "zh-TW": "春季辛金壬水洗淨發光（金白水清）- 水洗寶石才亮"
                          },
                          avoid={
                              "ko": "火 과다 - 섬세한 금이 녹음",
                              "en": "Excess Fire - delicate Metal melts",
                              "ja": "火過多 - 繊細な金が溶ける",
                              "zh-CN": "火过多 - 精致的金熔化",
                              "zh-TW": "火過多 - 精緻的金熔化"
                          }),
            DayMasterMonth("辛", "午", "壬", "己癸",
                          reason={
                              "ko": "여름 辛金은 壬癸水로 세척 필수",
                              "en": "Summer 辛 Metal: 壬癸 Water cleansing essential",
                              "ja": "夏の辛金は壬癸水での洗浄が必須",
                              "zh-CN": "夏季辛金壬癸水清洗必须",
                              "zh-TW": "夏季辛金壬癸水清洗必須"
                          },
                          avoid={
                              "ko": "火 과다 - 녹아서 형체를 잃음",
                              "en": "Excess Fire - melts and loses form",
                              "ja": "火過多 - 溶けて形を失う",
                              "zh-CN": "火过多 - 熔化失形",
                              "zh-TW": "火過多 - 熔化失形"
                          }),
            DayMasterMonth("辛", "子", "丙", "壬",
                          reason={
                              "ko": "겨울 辛金은 丙火로 따뜻하게",
                              "en": "Winter 辛 Metal: 丙 Fire for warmth",
                              "ja": "冬の辛金は丙火で暖める",
                              "zh-CN": "冬季辛金丙火温暖",
                              "zh-TW": "冬季辛金丙火溫暖"
                          },
                          avoid={
                              "ko": "水 과다 - 금이 물에 잠겨 빛을 잃음",
                              "en": "Excess Water - Metal submerged, loses shine",
                              "ja": "水過多 - 金が水に沈み輝きを失う",
                              "zh-CN": "水过多 - 金沉水中失光",
                              "zh-TW": "水過多 - 金沉水中失光"
                          })
        ],
        "壬": [
            DayMasterMonth("壬", "寅", "庚", "丙",
                          reason={
                              "ko": "봄 壬水는 庚金 수원, 丙火로 따뜻하게 - 금에서 물이 나옴",
                              "en": "Spring 壬 Water: 庚 Metal as source, 丙 Fire for warmth - Water springs from Metal",
                              "ja": "春の壬水は庚金が水源、丙火で暖める - 金から水が出る",
                              "zh-CN": "春季壬水庚金为源，丙火温暖 - 金生水",
                              "zh-TW": "春季壬水庚金為源，丙火溫暖 - 金生水"
                          },
                          avoid={
                              "ko": "土 과다 - 물길이 막힘",
                              "en": "Excess Earth - blocks Water flow",
                              "ja": "土過多 - 水の流れが塞がれる",
                              "zh-CN": "土过多 - 水道被堵",
                              "zh-TW": "土過多 - 水道被堵"
                          }),
            DayMasterMonth("壬", "午", "庚", "辛",
                          reason={
                              "ko": "여름 壬水는 庚辛金으로 수원 확보 필수 - 증발 방지",
                              "en": "Summer 壬 Water: 庚辛 Metal essential for water source - prevents evaporation",
                              "ja": "夏の壬水は庚辛金で水源確保が必須 - 蒸発防止",
                              "zh-CN": "夏季壬水庚辛金确保水源必须 - 防蒸发",
                              "zh-TW": "夏季壬水庚辛金確保水源必須 - 防蒸發"
                          },
                          avoid={
                              "ko": "火 과다 - 물이 증발해버림",
                              "en": "Excess Fire - Water evaporates",
                              "ja": "火過多 - 水が蒸発してしまう",
                              "zh-CN": "火过多 - 水蒸发",
                              "zh-TW": "火過多 - 水蒸發"
                          }),
            DayMasterMonth("壬", "子", "丙", "甲",
                          reason={
                              "ko": "겨울 壬水는 丙火로 얼지 않게 필수 - 언 물은 흐르지 못함",
                              "en": "Winter 壬 Water: 丙 Fire essential to prevent freezing - frozen Water cannot flow",
                              "ja": "冬の壬水は丙火で凍らないよう必須 - 凍った水は流れない",
                              "zh-CN": "冬季壬水丙火防冻必须 - 冻水不流",
                              "zh-TW": "冬季壬水丙火防凍必須 - 凍水不流"
                          },
                          avoid={
                              "ko": "土 과다 - 댐처럼 막혀버림",
                              "en": "Excess Earth - blocked like a dam",
                              "ja": "土過多 - ダムのように塞がれる",
                              "zh-CN": "土过多 - 如堤坝阻塞",
                              "zh-TW": "土過多 - 如堤壩阻塞"
                          })
        ],
        "癸": [
            DayMasterMonth("癸", "寅", "辛", "丙",
                          reason={
                              "ko": "봄 癸水는 辛金 수원, 丙火로 따뜻하게 - 이슬이 빛나려면 햇살 필요",
                              "en": "Spring 癸 Water: 辛 Metal as source, 丙 Fire for warmth - dew needs sunlight to shine",
                              "ja": "春の癸水は辛金が水源、丙火で暖める - 露が輝くには日差しが必要",
                              "zh-CN": "春季癸水辛金为源，丙火温暖 - 露水需阳光才亮",
                              "zh-TW": "春季癸水辛金為源，丙火溫暖 - 露水需陽光才亮"
                          },
                          avoid={
                              "ko": "土 과다 - 작은 물이 흡수되어 버림",
                              "en": "Excess Earth - small Water absorbed",
                              "ja": "土過多 - 小さな水が吸収されてしまう",
                              "zh-CN": "土过多 - 小水被吸收",
                              "zh-TW": "土過多 - 小水被吸收"
                          }),
            DayMasterMonth("癸", "午", "辛", "庚",
                          reason={
                              "ko": "여름 癸水는 辛庚金으로 수원 필수 - 작은 물은 쉽게 마름",
                              "en": "Summer 癸 Water: 辛庚 Metal essential for source - small Water dries easily",
                              "ja": "夏の癸水は辛庚金で水源が必須 - 小さな水は乾きやすい",
                              "zh-CN": "夏季癸水辛庚金为源必须 - 小水易干",
                              "zh-TW": "夏季癸水辛庚金為源必須 - 小水易乾"
                          },
                          avoid={
                              "ko": "火燥 - 완전히 증발해버림",
                              "en": "Fire/Dryness - evaporates completely",
                              "ja": "火燥 - 完全に蒸発してしまう",
                              "zh-CN": "火燥 - 完全蒸发",
                              "zh-TW": "火燥 - 完全蒸發"
                          }),
            DayMasterMonth("癸", "子", "丙", "辛",
                          reason={
                              "ko": "겨울 癸水는 丙火로 따뜻하게 필수 - 이슬이 얼면 생명력 상실",
                              "en": "Winter 癸 Water: 丙 Fire essential for warmth - frozen dew loses vitality",
                              "ja": "冬の癸水は丙火で暖める必須 - 露が凍ると生命力を失う",
                              "zh-CN": "冬季癸水丙火温暖必须 - 露水冻结失生机",
                              "zh-TW": "冬季癸水丙火溫暖必須 - 露水凍結失生機"
                          },
                          avoid={
                              "ko": "土 과다 - 작은 물이 막혀버림",
                              "en": "Excess Earth - small Water blocked",
                              "ja": "土過多 - 小さな水が塞がれてしまう",
                              "zh-CN": "土过多 - 小水被堵",
                              "zh-TW": "土過多 - 小水被堵"
                          })
        ]
    }

    # 실전 적용 가이드 (다국어)
    PRACTICAL_GUIDE: Dict[str, str] = {
        "ko": """
## 조후 실전 적용

### 1. 조후 용신 판단 순서
1. 출생월(月支)로 계절 파악 - 봄/여름/가을/겨울
2. 해당 계절의 기후 특성 확인 (한/난/조/습)
3. 일간에 맞는 조후 용신 선정 - 위 표 참조
4. 사주 내 조후 용신 유무 확인
5. 대운/세운에서 조후 용신 도래 시기 파악

### 2. 조후가 갖춰진 사주 (균형 잡힌 상태)
- 건강하고 활력이 있음 - 체력적으로 안정
- 일이 순조롭게 풀림 - 자연스러운 흐름
- 재물과 명예를 얻기 쉬움 - 노력의 결실
- 인간관계가 원만함 - 조화로운 소통

### 3. 조후가 결핍된 사주 (불균형 상태)
- 건강 문제 발생 가능 - 면역력 저하
- 일이 지지부진함 - 막힘이 많음
- 노력해도 성과가 더딤 - 타이밍 불일치
- 관계에서 갈등 발생 - 소통의 어려움

### 4. 대운에서 조후 용신이 오면
- 기존 문제가 해결됨 - 자연스러운 전환
- 건강이 회복됨 - 활력 증가
- 사업/직장에서 발전 - 성과 가시화
- 좋은 인연을 만남 - 관계 개선

### 5. 주의사항
- 조후 용신도 과하면 역효과 - 균형이 핵심
- 억부용신과 조후용신이 충돌할 수 있음
- 이 경우 조후용신을 우선시 (생명 에너지와 직결)
""",
        "en": """
## Practical Climate Balancing Application

### 1. Steps to Determine Climate God
1. Identify season from birth month (月支) - Spring/Summer/Autumn/Winter
2. Check climate characteristics (Cold/Warm/Dry/Wet)
3. Select appropriate Climate God for Day Master - refer to table above
4. Check if Climate God exists in the chart
5. Find when Climate God arrives in Major/Annual Luck

### 2. Charts with Proper Climate Balance
- Healthy and vital - physically stable
- Affairs progress smoothly - natural flow
- Easier to gain wealth and honor - fruits of effort
- Harmonious relationships - balanced communication

### 3. Charts with Climate Deficiency
- Health issues may arise - weakened immunity
- Affairs stagnate - many obstacles
- Slow results despite effort - timing mismatch
- Relationship conflicts - communication difficulties

### 4. When Climate God Arrives in Luck Cycle
- Existing problems resolve - natural transition
- Health recovers - increased vitality
- Career/business advancement - visible results
- Meeting good connections - improved relationships

### 5. Important Notes
- Too much Climate God also has adverse effects - balance is key
- Strength God and Climate God may conflict
- In such cases, prioritize Climate God (directly linked to life energy)
""",
        "ja": """
## 調候の実践的応用

### 1. 調候用神の判断手順
1. 出生月（月支）で季節を把握 - 春/夏/秋/冬
2. 該当季節の気候特性を確認（寒/暖/燥/湿）
3. 日干に合った調候用神を選定 - 上の表を参照
4. 四柱内の調候用神の有無を確認
5. 大運/歳運で調候用神が来る時期を把握

### 2. 調候が整った四柱（バランスの取れた状態）
- 健康で活力がある - 体力的に安定
- 物事がスムーズに進む - 自然な流れ
- 財物と名誉を得やすい - 努力の成果
- 人間関係が円満 - 調和のとれたコミュニケーション

### 3. 調候が欠けた四柱（不均衡な状態）
- 健康問題が発生しやすい - 免疫力低下
- 物事が停滞する - 障害が多い
- 努力しても成果が出にくい - タイミングの不一致
- 人間関係でトラブル - コミュニケーションの困難

### 4. 大運で調候用神が来ると
- 既存の問題が解決する - 自然な転換
- 健康が回復する - 活力増加
- 仕事/事業が発展する - 成果が見える
- 良いご縁に出会う - 関係改善

### 5. 注意点
- 調候用神も過剰だと逆効果 - バランスが重要
- 抑扶用神と調候用神が衝突することがある
- その場合、調候用神を優先（生命エネルギーに直結）
""",
        "zh-CN": """
## 调候实战应用

### 1. 调候用神判断步骤
1. 根据出生月（月支）判断季节 - 春/夏/秋/冬
2. 确认该季节的气候特性（寒/暖/燥/湿）
3. 选择适合日干的调候用神 - 参照上表
4. 确认四柱中是否有调候用神
5. 把握大运/流年中调候用神到来的时期

### 2. 调候齐全的四柱（平衡状态）
- 健康有活力 - 体力稳定
- 事情顺利进行 - 自然流畅
- 容易获得财富和名誉 - 努力有成果
- 人际关系和谐 - 沟通顺畅

### 3. 调候欠缺的四柱（失衡状态）
- 可能出现健康问题 - 免疫力下降
- 事情停滞不前 - 阻碍较多
- 努力却成果缓慢 - 时机不对
- 人际关系冲突 - 沟通困难

### 4. 大运中调候用神到来时
- 原有问题得到解决 - 自然转变
- 健康恢复 - 活力增加
- 事业/工作发展 - 成果显现
- 遇到好缘分 - 关系改善

### 5. 注意事项
- 调候用神过多也有反效果 - 平衡是关键
- 抑扶用神和调候用神可能冲突
- 这种情况下优先调候用神（与生命能量直接相关）
""",
        "zh-TW": """
## 調候實戰應用

### 1. 調候用神判斷步驟
1. 根據出生月（月支）判斷季節 - 春/夏/秋/冬
2. 確認該季節的氣候特性（寒/暖/燥/濕）
3. 選擇適合日干的調候用神 - 參照上表
4. 確認四柱中是否有調候用神
5. 把握大運/流年中調候用神到來的時期

### 2. 調候齊全的四柱（平衡狀態）
- 健康有活力 - 體力穩定
- 事情順利進行 - 自然流暢
- 容易獲得財富和名譽 - 努力有成果
- 人際關係和諧 - 溝通順暢

### 3. 調候欠缺的四柱（失衡狀態）
- 可能出現健康問題 - 免疫力下降
- 事情停滯不前 - 阻礙較多
- 努力卻成果緩慢 - 時機不對
- 人際關係衝突 - 溝通困難

### 4. 大運中調候用神到來時
- 原有問題得到解決 - 自然轉變
- 健康恢復 - 活力增加
- 事業/工作發展 - 成果顯現
- 遇到好緣分 - 關係改善

### 5. 注意事項
- 調候用神過多也有反效果 - 平衡是關鍵
- 抑扶用神和調候用神可能衝突
- 這種情況下優先調候用神（與生命能量直接相關）
"""
    }

    @classmethod
    def get_seasonal_analysis(cls, language: LanguageType = 'ko') -> str:
        """계절별 오행 왕쇠 분석 (다국어)"""
        lines = [cls.HEADERS["seasonal"][language]]

        for s in cls.SEASONAL_ELEMENTS:
            lines.append(f"### {s.season[language]} {s.chinese}")
            lines.append(f"- **{cls.LABELS['months'][language]}**: {', '.join(s.months)}")
            lines.append(f"- **{cls.LABELS['strong'][language]}**: {s.strong[language]}")
            lines.append(f"- **{cls.LABELS['emerging'][language]}**: {s.emerging[language]}")
            lines.append(f"- **{cls.LABELS['resting'][language]}**: {s.resting[language]}")
            lines.append(f"- **{cls.LABELS['confined'][language]}**: {s.confined[language]}")
            lines.append(f"- **{cls.LABELS['dead'][language]}**: {s.dead[language]}")
            lines.append(f"- **{cls.LABELS['climate'][language]}**: {s.climate[language]}")
            lines.append(f"- **{cls.LABELS['needed'][language]}**: {s.needed[language]}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_johu_principles_text(cls, language: LanguageType = 'ko') -> str:
        """한난조습(寒暖燥濕) 조후 원리 (다국어)"""
        lines = [cls.HEADERS["johu"][language]]

        for key, val in cls.JOHU_PRINCIPLES.items():
            lines.append(f"### {val['name'][language]}")
            lines.append(f"- **{cls.LABELS['condition'][language]}**: {val['condition'][language]}")
            lines.append(f"- **{cls.LABELS['solution'][language]}**: {val['solution'][language]}")
            lines.append(f"- **{cls.LABELS['effect'][language]}**: {val['effect'][language]}")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_monthly_yongshin_guide(cls, language: LanguageType = 'ko') -> str:
        """일간별 월령 조후 용신 가이드 (다국어)"""
        lines = [cls.HEADERS["monthly"][language]]

        for day_master, cases in cls.MONTHLY_YONGSHIN.items():
            lines.append(f"### {day_master}{cls.LABELS['day_master'][language]}")
            for case in cases:
                secondary = f", {case.secondary}" if case.secondary != "-" else ""
                lines.append(
                    f"- **{case.month}{cls.LABELS['month_label'][language]}**: "
                    f"{case.primary}{secondary} / {case.reason[language]} / "
                    f"{cls.LABELS['avoid'][language]}: {case.avoid[language]}"
                )
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def get_practical_application(cls, language: LanguageType = 'ko') -> str:
        """조후 실전 적용 가이드 (다국어)"""
        return cls.PRACTICAL_GUIDE[language]

    @classmethod
    def build(cls, language: LanguageType = 'ko') -> str:
        """
        궁통보감 전체 프롬프트 조각 (다국어)

        Args:
            language: 언어 코드 ('ko', 'en', 'ja', 'zh-CN', 'zh-TW')

        Returns:
            해당 언어로 된 궁통보감 조후론 프롬프트
        """
        # 레거시 호환: 'zh' → 'zh-CN'
        if language == 'zh':
            language = 'zh-CN'

        parts = [
            cls.HEADERS["title"][language],
            cls.HEADERS["subtitle"][language],
            cls.get_seasonal_analysis(language),
            cls.get_johu_principles_text(language),
            cls.get_monthly_yongshin_guide(language),
            cls.get_practical_application(language)
        ]

        return "\n".join(parts)
