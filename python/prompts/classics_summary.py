"""
고전 이론 프롬프트 요약 모듈 (Task 7)
멀티스텝 분석 파이프라인용 압축 버전

기존 ziping.py, qiongtong.py의 핵심만 추출하여
각 분석 단계에서 효율적으로 사용할 수 있도록 구성
"""
from typing import Dict, List, Literal

LanguageType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


# =============================================================================
# Task 7.1: 자평진전 핵심 요약 (ZIPING_SUMMARY)
# =============================================================================

ZIPING_SUMMARY: Dict[str, str] = {
    'ko': """## 자평진전(子平真詮) 핵심 원리

### 용신 5원칙
1. **억부용신(抑扶)**: 일간 강약 조절
   - 신강(身强): 식상/재성/관성으로 설기 또는 극
   - 신약(身弱): 인성/비겁으로 생조
2. **조후용신(調候)**: 한난조습 조절 (궁통보감 연계)
   - 겨울생: 火 필수 / 여름생: 水 필수
3. **통관용신(通關)**: 대립 오행 중재
   - 金木→水, 木土→火, 土水→金, 水火→木, 火金→土
4. **병약용신(病藥)**: 격국 파괴자=병, 치료자=약
5. **전왕용신(專旺)**: 극강 오행 순응 (종격/화격)

### 정격 8격
| 격국 | 성립 | 성격 조건 | 특성 |
|------|------|----------|------|
| 정관격 | 월지 정관 | 정관 하나, 상관 없음 | 명예/직위/규율 |
| 편관격 | 월지 칠살 | 식신제살 or 인성화살 | 권위/결단력/추진 |
| 정인격 | 월지 정인 | 관성 생조, 재성 극 없음 | 학문/자격증/보호 |
| 편인격 | 월지 편인 | 재성 제어, 식신 극 없음 | 특수재능/창의성 |
| 식신격 | 월지 식신 | 재성 생, 편인 극 없음 | 표현력/여유/재능 |
| 상관격 | 월지 상관 | 재성 생 or 인성 제어 | 창의력/기술/반항심 |
| 정재격 | 월지 정재 | 일간 강, 비겁 분탈 없음 | 안정/저축/근면 |
| 편재격 | 월지 편재 | 일간 강, 관성 연결 | 사교성/투기/융통성 |
""",

    'en': """## Ziping Zhenchuan (子平真詮) Core Principles

### Five Principles for Useful God
1. **Suppression-Support**: Balance Day Master strength
   - Strong: Use Output/Wealth/Officer to drain or control
   - Weak: Use Resource/Companion to support
2. **Climate-Regulating**: Balance cold/warm (with Qiongtong)
   - Winter birth: Fire essential / Summer birth: Water essential
3. **Mediating**: Bridge conflicting elements
   - Metal-Wood→Water, Wood-Earth→Fire, Earth-Water→Metal
4. **Disease-Medicine**: Destroyer=disease, Cure=medicine
5. **Dominant Flow**: Follow overwhelming element (special structures)

### Eight Structures
| Structure | Formation | Success Condition | Traits |
|-----------|-----------|------------------|--------|
| Direct Officer | Officer in month | Single Officer, no Hurting | Honor/Position |
| Seven Killings | Killings in month | Controlled by Output/Resource | Authority/Drive |
| Direct Resource | Resource in month | Officer supports, no Wealth attack | Learning/Credentials |
| Indirect Resource | Indirect in month | Wealth controls, no Output attack | Special Talents |
| Eating God | Eating in month | Produces Wealth, no Indirect attack | Expression/Ease |
| Hurting Officer | Hurting in month | Produces Wealth or Resource controls | Creativity/Skills |
| Direct Wealth | Wealth in month | Strong Day Master, no robbery | Stability/Savings |
| Indirect Wealth | Indirect in month | Strong Day Master, Officer link | Social/Speculative |
""",

    'ja': """## 子平真詮 核心原理

### 用神五原則
1. **抑扶用神**: 日干の強弱調節
   - 身強: 食傷/財星/官星で泄気または剋
   - 身弱: 印星/比劫で生助
2. **調候用神**: 寒暖燥湿の調節（窮通宝鑑と連携）
   - 冬生まれ: 火が必須 / 夏生まれ: 水が必須
3. **通関用神**: 対立五行の仲介
   - 金木→水、木土→火、土水→金、水火→木、火金→土
4. **病薬用神**: 格局破壊者=病、治療者=薬
5. **専旺用神**: 極強五行に従う（従格/化格）

### 正格八格
| 格局 | 成立 | 成格条件 | 特性 |
|------|------|---------|------|
| 正官格 | 月支正官 | 正官唯一、傷官なし | 名誉/地位/規律 |
| 偏官格 | 月支七殺 | 食神制殺 or 印星化殺 | 権威/決断力/推進 |
| 正印格 | 月支正印 | 官星生助、財星剋なし | 学問/資格/保護 |
| 偏印格 | 月支偏印 | 財星制御、食神剋なし | 特殊才能/創造性 |
| 食神格 | 月支食神 | 財星生、偏印剋なし | 表現力/余裕/才能 |
| 傷官格 | 月支傷官 | 財星生 or 印星制御 | 創造力/技術/反抗心 |
| 正財格 | 月支正財 | 日干強、比劫分奪なし | 安定/貯蓄/勤勉 |
| 偏財格 | 月支偏財 | 日干強、官星連結 | 社交性/投機/融通性 |
""",

    'zh-CN': """## 子平真诠 核心原理

### 用神五原则
1. **抑扶用神**: 调节日干强弱
   - 身强: 用食伤/财星/官星泄气或克
   - 身弱: 用印星/比劫生助
2. **调候用神**: 调节寒暖燥湿（与穷通宝鉴配合）
   - 冬生: 火必须 / 夏生: 水必须
3. **通关用神**: 调解对立五行
   - 金木→水，木土→火，土水→金，水火→木，火金→土
4. **病药用神**: 格局破坏者=病，治疗者=药
5. **专旺用神**: 顺从极强五行（从格/化格）

### 正格八格
| 格局 | 成立 | 成格条件 | 特性 |
|------|------|---------|------|
| 正官格 | 月支正官 | 正官唯一，无伤官 | 名誉/地位/规律 |
| 偏官格 | 月支七杀 | 食神制杀或印星化杀 | 权威/决断力/执行 |
| 正印格 | 月支正印 | 官星生助，无财星克 | 学问/资格/保护 |
| 偏印格 | 月支偏印 | 财星制御，无食神克 | 特殊才能/创造性 |
| 食神格 | 月支食神 | 生财星，无偏印克 | 表达力/从容/才华 |
| 伤官格 | 月支伤官 | 生财星或印星制御 | 创造力/技术/叛逆 |
| 正财格 | 月支正财 | 日干强，无比劫夺 | 稳定/储蓄/勤勉 |
| 偏财格 | 月支偏财 | 日干强，官星连结 | 社交性/投机/灵活 |
""",

    'zh-TW': """## 子平真詮 核心原理

### 用神五原則
1. **抑扶用神**: 調節日干強弱
   - 身強: 用食傷/財星/官星洩氣或剋
   - 身弱: 用印星/比劫生助
2. **調候用神**: 調節寒暖燥濕（與窮通寶鑑配合）
   - 冬生: 火必須 / 夏生: 水必須
3. **通關用神**: 調解對立五行
   - 金木→水，木土→火，土水→金，水火→木，火金→土
4. **病藥用神**: 格局破壞者=病，治療者=藥
5. **專旺用神**: 順從極強五行（從格/化格）

### 正格八格
| 格局 | 成立 | 成格條件 | 特性 |
|------|------|---------|------|
| 正官格 | 月支正官 | 正官唯一，無傷官 | 名譽/地位/規律 |
| 偏官格 | 月支七殺 | 食神制殺或印星化殺 | 權威/決斷力/執行 |
| 正印格 | 月支正印 | 官星生助，無財星剋 | 學問/資格/保護 |
| 偏印格 | 月支偏印 | 財星制御，無食神剋 | 特殊才能/創造性 |
| 食神格 | 月支食神 | 生財星，無偏印剋 | 表達力/從容/才華 |
| 傷官格 | 月支傷官 | 生財星或印星制御 | 創造力/技術/叛逆 |
| 正財格 | 月支正財 | 日干強，無比劫奪 | 穩定/儲蓄/勤勉 |
| 偏財格 | 月支偏財 | 日干強，官星連結 | 社交性/投機/靈活 |
"""
}


# =============================================================================
# Task 7.2: 궁통보감 조후론 요약 (QIONGTONG_SUMMARY)
# =============================================================================

QIONGTONG_SUMMARY: Dict[str, str] = {
    'ko': """## 궁통보감(窮通寶鑑) 조후론 핵심

### 계절별 필수 조후
| 계절 | 월지 | 기후 | 왕(旺) | 필수 조후 |
|------|------|------|--------|----------|
| 봄 | 寅卯辰 | 暖濕 | 木 | 火로 설기, 金으로 조절, 水 적량 |
| 여름 | 巳午未 | 炎燥 | 火 | **水 필수(냉각)**, 金으로 수원 확보 |
| 가을 | 申酉戌 | 凉燥 | 金 | 火로 온난, 水로 습윤 |
| 겨울 | 亥子丑 | 寒濕 | 水 | **火 필수(온난)**, 木으로 화 생조 |

### 한난조습(寒暖燥濕) 4원리
1. **寒(차가움)**: 겨울/水과다 → **丙火**로 온난 (최우선)
2. **暖(과열)**: 여름/火과다 → **壬水**로 냉각 (필수)
3. **燥(건조)**: 화토과다/戌未월 → **水**로 습윤
4. **濕(습함)**: 수과다/辰丑월 → **火**로 건조

### 일간별 핵심 조후 (대표 케이스)
| 일간 | 여름(午) | 겨울(子) | 핵심 원칙 |
|------|---------|---------|----------|
| 甲木 | 癸水 필수 (건조 방지) | 丙火 필수 (동결 방지) | 나무는 물+햇빛 |
| 乙木 | 癸水 필수 (시듦 방지) | 丙火 필수 (얼지 않게) | 풀은 이슬+온기 |
| 丙火 | 壬水 필수 (과열 방지) | 壬水 (水輝映) | 태양은 물에 비춤 |
| 丁火 | 甲木 연료 + 壬水 조절 | 甲木 연료 필수 | 촛불은 연료 필요 |
| 戊土 | 壬水 필수 (균열 방지) | 丙火 필수 (동결 방지) | 산은 물로 생기 |
| 己土 | 癸水 필수 (습윤) | 丙火 필수 (해동) | 밭은 촉촉해야 |
| 庚金 | 壬水 담금질 (淬火) | 丁火 단련 (煉金) | 쇠는 담금질+단련 |
| 辛金 | 壬水 세척 (金白水清) | 丙火 온난 | 보석은 물에 빛남 |
| 壬水 | 庚金 수원 확보 | 丙火 필수 (동결 방지) | 강물은 얼면 안됨 |
| 癸水 | 辛金 수원 확보 | 丙火 필수 (동결 방지) | 이슬도 얼면 안됨 |
""",

    'en': """## Qiongtong Baojian (窮通寶鑑) Climate Theory Summary

### Seasonal Climate Requirements
| Season | Months | Climate | Strong | Required Balance |
|--------|--------|---------|--------|-----------------|
| Spring | 寅卯辰 | Warm/Wet | Wood | Fire drains, Metal balances, Water moderate |
| Summer | 巳午未 | Hot/Dry | Fire | **Water essential (cooling)**, Metal for source |
| Autumn | 申酉戌 | Cool/Dry | Metal | Fire warms, Water moistens |
| Winter | 亥子丑 | Cold/Wet | Water | **Fire essential (warming)**, Wood supports Fire |

### Four Climate Principles (寒暖燥濕)
1. **Cold**: Winter/excess Water → **丙 Fire** to warm (priority)
2. **Hot**: Summer/excess Fire → **壬 Water** to cool (essential)
3. **Dry**: Fire-Earth excess → **Water** to moisten
4. **Damp**: Water excess → **Fire** to dry

### Day Master Key Climate (Representative Cases)
| Day Master | Summer (午) | Winter (子) | Core Principle |
|------------|------------|------------|----------------|
| 甲 Wood | 癸 Water essential | 丙 Fire essential | Tree needs water+sun |
| 乙 Wood | 癸 Water essential | 丙 Fire essential | Grass needs dew+warmth |
| 丙 Fire | 壬 Water essential | 壬 Water (reflects) | Sun shines on water |
| 丁 Fire | 甲 Wood fuel + 壬 Water | 甲 Wood fuel essential | Candle needs fuel |
| 戊 Earth | 壬 Water essential | 丙 Fire essential | Mountain needs water |
| 己 Earth | 癸 Water essential | 丙 Fire essential | Field needs moisture |
| 庚 Metal | 壬 Water quenching | 丁 Fire tempering | Steel needs tempering |
| 辛 Metal | 壬 Water cleansing | 丙 Fire warming | Jewel shines in water |
| 壬 Water | 庚 Metal as source | 丙 Fire essential | River must not freeze |
| 癸 Water | 辛 Metal as source | 丙 Fire essential | Dew must not freeze |
""",

    'ja': """## 窮通宝鑑 調候論 核心

### 季節別必須調候
| 季節 | 月支 | 気候 | 旺 | 必須調候 |
|------|------|------|-----|---------|
| 春 | 寅卯辰 | 暖湿 | 木 | 火で泄気、金で調節、水は適量 |
| 夏 | 巳午未 | 炎燥 | 火 | **水必須（冷却）**、金で水源確保 |
| 秋 | 申酉戌 | 涼燥 | 金 | 火で温暖、水で潤す |
| 冬 | 亥子丑 | 寒湿 | 水 | **火必須（温暖）**、木で火を生助 |

### 寒暖燥湿4原理
1. **寒**: 冬/水過多 → **丙火**で温める（最優先）
2. **暖**: 夏/火過多 → **壬水**で冷却（必須）
3. **燥**: 火土過多 → **水**で潤す
4. **湿**: 水過多 → **火**で乾燥

### 日干別核心調候（代表例）
| 日干 | 夏（午） | 冬（子） | 核心原則 |
|------|---------|---------|---------|
| 甲木 | 癸水必須 | 丙火必須 | 木は水+日光 |
| 乙木 | 癸水必須 | 丙火必須 | 草は露+温気 |
| 丙火 | 壬水必須 | 壬水（水輝映） | 太陽は水に映る |
| 丁火 | 甲木燃料+壬水 | 甲木燃料必須 | 蝋燭は燃料必要 |
| 戊土 | 壬水必須 | 丙火必須 | 山は水で生気 |
| 己土 | 癸水必須 | 丙火必須 | 畑は潤いが必要 |
| 庚金 | 壬水淬火 | 丁火鍛錬 | 鉄は鍛錬が必要 |
| 辛金 | 壬水洗浄 | 丙火温暖 | 宝石は水で輝く |
| 壬水 | 庚金水源 | 丙火必須 | 川は凍ってはならない |
| 癸水 | 辛金水源 | 丙火必須 | 露も凍ってはならない |
""",

    'zh-CN': """## 穷通宝鉴 调候论 核心

### 季节必须调候
| 季节 | 月支 | 气候 | 旺 | 必须调候 |
|------|------|------|-----|---------|
| 春 | 寅卯辰 | 暖湿 | 木 | 火泄气，金调节，水适量 |
| 夏 | 巳午未 | 炎燥 | 火 | **水必须（冷却）**，金为水源 |
| 秋 | 申酉戌 | 凉燥 | 金 | 火温暖，水润燥 |
| 冬 | 亥子丑 | 寒湿 | 水 | **火必须（温暖）**，木生火 |

### 寒暖燥湿四原理
1. **寒**: 冬/水过多 → **丙火**温暖（最优先）
2. **暖**: 夏/火过多 → **壬水**冷却（必须）
3. **燥**: 火土过多 → **水**润燥
4. **湿**: 水过多 → **火**干燥

### 日干核心调候（代表案例）
| 日干 | 夏（午） | 冬（子） | 核心原则 |
|------|---------|---------|---------|
| 甲木 | 癸水必须 | 丙火必须 | 树需水+阳光 |
| 乙木 | 癸水必须 | 丙火必须 | 草需露+温暖 |
| 丙火 | 壬水必须 | 壬水（水辉映） | 太阳映水中 |
| 丁火 | 甲木燃料+壬水 | 甲木燃料必须 | 蜡烛需燃料 |
| 戊土 | 壬水必须 | 丙火必须 | 山需水生气 |
| 己土 | 癸水必须 | 丙火必须 | 田需润泽 |
| 庚金 | 壬水淬火 | 丁火锻炼 | 钢需锻炼 |
| 辛金 | 壬水洗净 | 丙火温暖 | 宝石水中亮 |
| 壬水 | 庚金水源 | 丙火必须 | 江河不可冻 |
| 癸水 | 辛金水源 | 丙火必须 | 露水不可冻 |
""",

    'zh-TW': """## 窮通寶鑑 調候論 核心

### 季節必須調候
| 季節 | 月支 | 氣候 | 旺 | 必須調候 |
|------|------|------|-----|---------|
| 春 | 寅卯辰 | 暖濕 | 木 | 火洩氣，金調節，水適量 |
| 夏 | 巳午未 | 炎燥 | 火 | **水必須（冷卻）**，金為水源 |
| 秋 | 申酉戌 | 涼燥 | 金 | 火溫暖，水潤燥 |
| 冬 | 亥子丑 | 寒濕 | 水 | **火必須（溫暖）**，木生火 |

### 寒暖燥濕四原理
1. **寒**: 冬/水過多 → **丙火**溫暖（最優先）
2. **暖**: 夏/火過多 → **壬水**冷卻（必須）
3. **燥**: 火土過多 → **水**潤燥
4. **濕**: 水過多 → **火**乾燥

### 日干核心調候（代表案例）
| 日干 | 夏（午） | 冬（子） | 核心原則 |
|------|---------|---------|---------|
| 甲木 | 癸水必須 | 丙火必須 | 樹需水+陽光 |
| 乙木 | 癸水必須 | 丙火必須 | 草需露+溫暖 |
| 丙火 | 壬水必須 | 壬水（水輝映） | 太陽映水中 |
| 丁火 | 甲木燃料+壬水 | 甲木燃料必須 | 蠟燭需燃料 |
| 戊土 | 壬水必須 | 丙火必須 | 山需水生氣 |
| 己土 | 癸水必須 | 丙火必須 | 田需潤澤 |
| 庚金 | 壬水淬火 | 丁火鍛鍊 | 鋼需鍛鍊 |
| 辛金 | 壬水洗淨 | 丙火溫暖 | 寶石水中亮 |
| 壬水 | 庚金水源 | 丙火必須 | 江河不可凍 |
| 癸水 | 辛金水源 | 丙火必須 | 露水不可凍 |
"""
}


# =============================================================================
# Task 7.3: 십신 해석 가이드 (TEN_GODS_GUIDE)
# =============================================================================

TEN_GODS_GUIDE: Dict[str, str] = {
    'ko': """## 십신(十神) 성격 해석 가이드

### 나/형제 계열 (비겁 比劫)
- **비견(比肩)**: 독립심, 자존심, 경쟁심, 형제/동료와의 관계
  - 긍정: 자립심, 리더십, 의지력
  - 부정: 고집, 타협 어려움, 독선
- **겁재(劫財)**: 추진력, 승부욕, 극단성, 경쟁/약탈
  - 긍정: 결단력, 행동력, 도전정신
  - 부정: 충동, 무모함, 재물 손실

### 표현/기술 계열 (식상 食傷)
- **식신(食神)**: 여유, 표현력, 섬세함, 재능 발휘
  - 긍정: 창의력, 낙천성, 예술적 감각
  - 부정: 게으름, 안일함, 의존성
- **상관(傷官)**: 창의력, 반항심, 언어력, 기술/예술
  - 긍정: 독창성, 언변, 전문 기술
  - 부정: 불만, 비판, 권위 충돌

### 재물 계열 (재성 財星)
- **정재(正財)**: 안정, 근면, 저축, 정당한 수입
  - 긍정: 성실함, 계획성, 꾸준함
  - 부정: 소심함, 인색함, 융통성 부족
- **편재(偏財)**: 투기, 사교, 융통성, 부정기 수입
  - 긍정: 대인관계, 사업수완, 기회포착
  - 부정: 낭비, 투기손실, 불안정

### 권위/제약 계열 (관성 官星)
- **정관(正官)**: 명예, 책임감, 직위, 규율 준수
  - 긍정: 신뢰감, 조직력, 원칙
  - 부정: 경직됨, 권위주의, 스트레스
- **편관(偏官/七殺)**: 권위, 결단력, 압박, 강한 추진
  - 긍정: 카리스마, 실행력, 돌파력
  - 부정: 공격성, 폭력성, 과로

### 지원/학문 계열 (인성 印星)
- **정인(正印)**: 학문, 자격증, 보호, 전통적 지식
  - 긍정: 학습능력, 인내심, 포용력
  - 부정: 의존성, 수동성, 현실감 부족
- **편인(偏印/梟神)**: 특수재능, 고독, 창의, 비전통 분야
  - 긍정: 직관력, 독창성, 전문성
  - 부정: 고립, 편협함, 기복이 큼
""",

    'en': """## Ten Gods (十神) Personality Guide

### Self/Sibling Category (Companions 比劫)
- **Companion (比肩)**: Independence, self-esteem, competitiveness
  - Positive: Self-reliance, leadership, willpower
  - Negative: Stubbornness, inflexibility, selfishness
- **Rob Wealth (劫財)**: Drive, competitive spirit, extremism
  - Positive: Decisiveness, action-oriented, adventurous
  - Negative: Impulsive, reckless, financial loss

### Expression/Skills Category (Output 食傷)
- **Eating God (食神)**: Ease, expressiveness, talent display
  - Positive: Creativity, optimism, artistic sense
  - Negative: Laziness, complacency, dependency
- **Hurting Officer (傷官)**: Creativity, rebelliousness, eloquence
  - Positive: Originality, persuasion, specialized skills
  - Negative: Dissatisfaction, criticism, authority conflicts

### Wealth Category (財星)
- **Direct Wealth (正財)**: Stability, diligence, savings
  - Positive: Diligent, methodical, consistent
  - Negative: Timid, stingy, inflexible
- **Indirect Wealth (偏財)**: Speculation, social skills, flexibility
  - Positive: Networking, business acumen, opportunity seizing
  - Negative: Wasteful, speculative losses, unstable

### Authority/Constraint Category (Officers 官星)
- **Direct Officer (正官)**: Honor, responsibility, discipline
  - Positive: Trustworthy, organized, principled
  - Negative: Rigid, authoritarian, stressed
- **Seven Killings (偏官/七殺)**: Authority, decisiveness, pressure
  - Positive: Charisma, execution, breakthrough
  - Negative: Aggressive, violent, overworked

### Support/Learning Category (Resources 印星)
- **Direct Resource (正印)**: Learning, credentials, protection
  - Positive: Learning ability, patience, tolerance
  - Negative: Dependent, passive, unrealistic
- **Indirect Resource (偏印/梟神)**: Special talents, solitude, creativity
  - Positive: Intuition, originality, expertise
  - Negative: Isolated, narrow-minded, volatile
""",

    'ja': """## 十神 性格解釈ガイド

### 自分/兄弟系列（比劫）
- **比肩**: 独立心、自尊心、競争心、兄弟・同僚との関係
  - 肯定: 自立心、リーダーシップ、意志力
  - 否定: 頑固、妥協困難、独善
- **劫財**: 推進力、勝負欲、極端性、競争・奪取
  - 肯定: 決断力、行動力、挑戦精神
  - 否定: 衝動、無謀、財物損失

### 表現/技術系列（食傷）
- **食神**: 余裕、表現力、繊細さ、才能発揮
  - 肯定: 創造力、楽天性、芸術的感覚
  - 否定: 怠惰、安逸、依存性
- **傷官**: 創造力、反抗心、言語力、技術/芸術
  - 肯定: 独創性、弁舌、専門技術
  - 否定: 不満、批判、権威衝突

### 財物系列（財星）
- **正財**: 安定、勤勉、貯蓄、正当な収入
  - 肯定: 誠実、計画性、着実
  - 否定: 小心、吝嗇、融通不足
- **偏財**: 投機、社交、融通性、不定期収入
  - 肯定: 対人関係、商才、機会把握
  - 否定: 浪費、投機損失、不安定

### 権威/制約系列（官星）
- **正官**: 名誉、責任感、地位、規律遵守
  - 肯定: 信頼感、組織力、原則
  - 否定: 硬直、権威主義、ストレス
- **偏官（七殺）**: 権威、決断力、圧迫、強い推進
  - 肯定: カリスマ、実行力、突破力
  - 否定: 攻撃性、暴力性、過労

### 支援/学問系列（印星）
- **正印**: 学問、資格、保護、伝統的知識
  - 肯定: 学習能力、忍耐、包容力
  - 否定: 依存性、受動性、現実感不足
- **偏印（梟神）**: 特殊才能、孤独、創意、非伝統分野
  - 肯定: 直感力、独創性、専門性
  - 否定: 孤立、偏狭、起伏大
""",

    'zh-CN': """## 十神 性格解析指南

### 自我/兄弟系列（比劫）
- **比肩**: 独立心、自尊心、竞争心、兄弟同事关系
  - 正面: 自立心、领导力、意志力
  - 负面: 固执、难以妥协、独断
- **劫财**: 推动力、胜负欲、极端性、竞争/夺取
  - 正面: 决断力、行动力、挑战精神
  - 负面: 冲动、鲁莽、财物损失

### 表达/技术系列（食伤）
- **食神**: 从容、表达力、细腻、才能发挥
  - 正面: 创造力、乐观、艺术感
  - 负面: 懒惰、安逸、依赖性
- **伤官**: 创造力、叛逆心、言语力、技术/艺术
  - 正面: 独创性、口才、专业技术
  - 负面: 不满、批评、权威冲突

### 财物系列（财星）
- **正财**: 稳定、勤勉、储蓄、正当收入
  - 正面: 踏实、有计划、稳定
  - 负面: 胆小、吝啬、不灵活
- **偏财**: 投机、社交、灵活性、不定期收入
  - 正面: 人际关系、商业头脑、抓机会
  - 负面: 浪费、投机损失、不稳定

### 权威/制约系列（官星）
- **正官**: 名誉、责任感、地位、遵守规律
  - 正面: 可信赖、组织力、有原则
  - 负面: 刻板、权威主义、压力大
- **偏官（七杀）**: 权威、决断力、压力、强力推进
  - 正面: 魅力、执行力、突破力
  - 负面: 攻击性、暴力倾向、过劳

### 支持/学问系列（印星）
- **正印**: 学问、资格证、保护、传统知识
  - 正面: 学习能力、耐心、包容力
  - 负面: 依赖性、被动、不切实际
- **偏印（枭神）**: 特殊才能、孤独、创意、非传统领域
  - 正面: 直觉力、独创性、专业性
  - 负面: 孤立、偏执、起伏大
""",

    'zh-TW': """## 十神 性格解析指南

### 自我/兄弟系列（比劫）
- **比肩**: 獨立心、自尊心、競爭心、兄弟同事關係
  - 正面: 自立心、領導力、意志力
  - 負面: 固執、難以妥協、獨斷
- **劫財**: 推動力、勝負慾、極端性、競爭/奪取
  - 正面: 決斷力、行動力、挑戰精神
  - 負面: 衝動、魯莽、財物損失

### 表達/技術系列（食傷）
- **食神**: 從容、表達力、細膩、才能發揮
  - 正面: 創造力、樂觀、藝術感
  - 負面: 懶惰、安逸、依賴性
- **傷官**: 創造力、叛逆心、言語力、技術/藝術
  - 正面: 獨創性、口才、專業技術
  - 負面: 不滿、批評、權威衝突

### 財物系列（財星）
- **正財**: 穩定、勤勉、儲蓄、正當收入
  - 正面: 踏實、有計劃、穩定
  - 負面: 膽小、吝嗇、不靈活
- **偏財**: 投機、社交、靈活性、不定期收入
  - 正面: 人際關係、商業頭腦、抓機會
  - 負面: 浪費、投機損失、不穩定

### 權威/制約系列（官星）
- **正官**: 名譽、責任感、地位、遵守規律
  - 正面: 可信賴、組織力、有原則
  - 負面: 刻板、權威主義、壓力大
- **偏官（七殺）**: 權威、決斷力、壓力、強力推進
  - 正面: 魅力、執行力、突破力
  - 負面: 攻擊性、暴力傾向、過勞

### 支持/學問系列（印星）
- **正印**: 學問、資格證、保護、傳統知識
  - 正面: 學習能力、耐心、包容力
  - 負面: 依賴性、被動、不切實際
- **偏印（梟神）**: 特殊才能、孤獨、創意、非傳統領域
  - 正面: 直覺力、獨創性、專業性
  - 負面: 孤立、偏執、起伏大
"""
}


# =============================================================================
# Task 7.4: 일간별 특성 매핑 테이블 (DAY_MASTER_TRAITS)
# =============================================================================

DAY_MASTER_TRAITS: Dict[str, Dict[str, any]] = {
    '甲': {
        'element': '木',
        'polarity': '陽',
        'symbol': {
            'ko': '큰 나무, 소나무, 대들보',
            'en': 'Large tree, pine, pillar',
            'ja': '大木、松、大黒柱',
            'zh-CN': '大树、松树、栋梁',
            'zh-TW': '大樹、松樹、棟樑'
        },
        'personality': {
            'ko': '우직함, 정의감, 리더십, 성장 지향, 곧은 성품',
            'en': 'Upright, just, leadership-oriented, growth-focused, straightforward',
            'ja': '愚直、正義感、リーダーシップ、成長志向、真っ直ぐな性格',
            'zh-CN': '正直、正义感、领导力、成长导向、性格耿直',
            'zh-TW': '正直、正義感、領導力、成長導向、性格耿直'
        },
        'strengths': ['추진력', '책임감', '대의명분', '인내력'],
        'weaknesses': ['융통성 부족', '고집', '변화 저항', '완고함'],
        'suitable': ['리더십', '기획', '교육', '건축', '법률', 'CEO'],
        'johu': {
            '봄': {'primary': '丙', 'secondary': '癸', 'reason': '설기+자양'},
            '여름': {'primary': '癸', 'secondary': '丁', 'reason': '건조방지'},
            '가을': {'primary': '丁', 'secondary': '庚', 'reason': '금극극복'},
            '겨울': {'primary': '丙', 'secondary': '庚', 'reason': '동결방지'}
        }
    },
    '乙': {
        'element': '木',
        'polarity': '陰',
        'symbol': {
            'ko': '풀, 꽃, 덩굴, 화초',
            'en': 'Grass, flower, vine, plant',
            'ja': '草、花、蔓、草花',
            'zh-CN': '草、花、藤、花草',
            'zh-TW': '草、花、藤、花草'
        },
        'personality': {
            'ko': '유연함, 적응력, 섬세함, 협조적, 부드러움',
            'en': 'Flexible, adaptive, delicate, cooperative, gentle',
            'ja': '柔軟、適応力、繊細、協調的、柔らかさ',
            'zh-CN': '柔韧、适应力、细腻、协调、温柔',
            'zh-TW': '柔韌、適應力、細膩、協調、溫柔'
        },
        'strengths': ['협상력', '인내심', '섬세함', '적응력'],
        'weaknesses': ['우유부단', '의존성', '소심함', '결단력 부족'],
        'suitable': ['상담', '디자인', '서비스', '예술', '외교', '비서'],
        'johu': {
            '봄': {'primary': '丙', 'secondary': '癸', 'reason': '햇빛+이슬'},
            '여름': {'primary': '癸', 'secondary': '-', 'reason': '시듦방지'},
            '가을': {'primary': '丙', 'secondary': '癸', 'reason': '금극보호'},
            '겨울': {'primary': '丙', 'secondary': '-', 'reason': '동결방지'}
        }
    },
    '丙': {
        'element': '火',
        'polarity': '陽',
        'symbol': {
            'ko': '태양, 큰 불, 용광로',
            'en': 'Sun, great fire, furnace',
            'ja': '太陽、大火、溶鉱炉',
            'zh-CN': '太阳、大火、熔炉',
            'zh-TW': '太陽、大火、熔爐'
        },
        'personality': {
            'ko': '열정, 명랑함, 화려함, 공명정대, 빛나는 존재감',
            'en': 'Passionate, cheerful, flamboyant, fair, radiant presence',
            'ja': '情熱、明朗、華麗、公明正大、輝く存在感',
            'zh-CN': '热情、开朗、华丽、光明正大、闪耀存在感',
            'zh-TW': '熱情、開朗、華麗、光明正大、閃耀存在感'
        },
        'strengths': ['열정', '낙관성', '영향력', '솔직함'],
        'weaknesses': ['급함', '과시욕', '지구력 부족', '감정기복'],
        'suitable': ['방송', '연예', '정치', '홍보', 'CEO', '강연'],
        'johu': {
            '봄': {'primary': '壬', 'secondary': '庚', 'reason': '과열방지'},
            '여름': {'primary': '壬', 'secondary': '庚', 'reason': '소진방지'},
            '가을': {'primary': '甲', 'secondary': '壬', 'reason': '연료확보'},
            '겨울': {'primary': '壬', 'secondary': '甲', 'reason': '수휘영'}
        }
    },
    '丁': {
        'element': '火',
        'polarity': '陰',
        'symbol': {
            'ko': '촛불, 등불, 별빛',
            'en': 'Candle, lamp, starlight',
            'ja': '蝋燭、灯、星明かり',
            'zh-CN': '蜡烛、灯火、星光',
            'zh-TW': '蠟燭、燈火、星光'
        },
        'personality': {
            'ko': '섬세함, 예술성, 집중력, 내면의 열정, 따뜻함',
            'en': 'Delicate, artistic, focused, inner passion, warmth',
            'ja': '繊細、芸術性、集中力、内面の情熱、温かさ',
            'zh-CN': '细腻、艺术性、专注力、内心热情、温暖',
            'zh-TW': '細膩、藝術性、專注力、內心熱情、溫暖'
        },
        'strengths': ['집중력', '예술성', '섬세함', '통찰력'],
        'weaknesses': ['불안정', '신경질', '소심함', '의심'],
        'suitable': ['예술', '연구', '상담', '글쓰기', '조명', '보석'],
        'johu': {
            '봄': {'primary': '甲', 'secondary': '庚', 'reason': '연료'},
            '여름': {'primary': '甲', 'secondary': '壬', 'reason': '연료+조절'},
            '가을': {'primary': '甲', 'secondary': '庚', 'reason': '연료확보'},
            '겨울': {'primary': '甲', 'secondary': '庚', 'reason': '연료필수'}
        }
    },
    '戊': {
        'element': '土',
        'polarity': '陽',
        'symbol': {
            'ko': '산, 언덕, 제방',
            'en': 'Mountain, hill, embankment',
            'ja': '山、丘、堤防',
            'zh-CN': '山、丘陵、堤坝',
            'zh-TW': '山、丘陵、堤壩'
        },
        'personality': {
            'ko': '믿음직함, 포용력, 안정감, 중후함, 신뢰성',
            'en': 'Reliable, tolerant, stable, dignified, trustworthy',
            'ja': '頼もしい、包容力、安定感、重厚、信頼性',
            'zh-CN': '可靠、包容、稳定、稳重、值得信赖',
            'zh-TW': '可靠、包容、穩定、穩重、值得信賴'
        },
        'strengths': ['신뢰감', '포용력', '안정감', '중재력'],
        'weaknesses': ['고집', '둔함', '변화 저항', '무거움'],
        'suitable': ['부동산', '건설', '농업', '금융', '중재', '관리'],
        'johu': {
            '봄': {'primary': '丙', 'secondary': '甲', 'reason': '통관'},
            '여름': {'primary': '壬', 'secondary': '甲', 'reason': '균열방지'},
            '가을': {'primary': '丙', 'secondary': '癸', 'reason': '온난+습윤'},
            '겨울': {'primary': '丙', 'secondary': '甲', 'reason': '동결방지'}
        }
    },
    '己': {
        'element': '土',
        'polarity': '陰',
        'symbol': {
            'ko': '밭, 정원, 흙',
            'en': 'Field, garden, soil',
            'ja': '田畑、庭園、土',
            'zh-CN': '田地、花园、土壤',
            'zh-TW': '田地、花園、土壤'
        },
        'personality': {
            'ko': '온화함, 수용성, 실속, 현실적, 양육적',
            'en': 'Gentle, receptive, practical, realistic, nurturing',
            'ja': '穏やか、受容性、実利、現実的、養育的',
            'zh-CN': '温和、接受性、实在、现实、养育性',
            'zh-TW': '溫和、接受性、實在、現實、養育性'
        },
        'strengths': ['포용력', '실속', '적응력', '세심함'],
        'weaknesses': ['소심함', '의존성', '우유부단', '걱정'],
        'suitable': ['농업', '요리', '교육', '보육', '서비스', '부동산'],
        'johu': {
            '봄': {'primary': '丙', 'secondary': '甲', 'reason': '온난+소통'},
            '여름': {'primary': '癸', 'secondary': '丙', 'reason': '습윤'},
            '가을': {'primary': '丙', 'secondary': '癸', 'reason': '온난'},
            '겨울': {'primary': '丙', 'secondary': '甲', 'reason': '해동'}
        }
    },
    '庚': {
        'element': '金',
        'polarity': '陽',
        'symbol': {
            'ko': '도끼, 검, 원석, 철광석',
            'en': 'Axe, sword, raw ore, iron',
            'ja': '斧、剣、原石、鉄鉱石',
            'zh-CN': '斧头、剑、矿石、铁矿',
            'zh-TW': '斧頭、劍、礦石、鐵礦'
        },
        'personality': {
            'ko': '결단력, 정의감, 강직함, 의리, 단호함',
            'en': 'Decisive, just, upright, loyal, firm',
            'ja': '決断力、正義感、剛直、義理、断固',
            'zh-CN': '决断力、正义感、刚直、义气、果断',
            'zh-TW': '決斷力、正義感、剛直、義氣、果斷'
        },
        'strengths': ['결단력', '의리', '추진력', '정의감'],
        'weaknesses': ['독선', '냉정함', '융통성 부족', '공격성'],
        'suitable': ['군인', '경찰', '외과의사', '금융', '기계', '무역'],
        'johu': {
            '봄': {'primary': '丁', 'secondary': '甲', 'reason': '연금'},
            '여름': {'primary': '壬', 'secondary': '戊', 'reason': '담금질'},
            '가을': {'primary': '丁', 'secondary': '甲', 'reason': '단련'},
            '겨울': {'primary': '丁', 'secondary': '甲', 'reason': '온난단련'}
        }
    },
    '辛': {
        'element': '金',
        'polarity': '陰',
        'symbol': {
            'ko': '보석, 금은, 바늘',
            'en': 'Jewel, gold/silver, needle',
            'ja': '宝石、金銀、針',
            'zh-CN': '宝石、金银、针',
            'zh-TW': '寶石、金銀、針'
        },
        'personality': {
            'ko': '섬세함, 예민함, 완벽주의, 고상함, 까다로움',
            'en': 'Delicate, sensitive, perfectionist, refined, discerning',
            'ja': '繊細、敏感、完璧主義、高尚、気難しさ',
            'zh-CN': '细腻、敏感、完美主义、高雅、挑剔',
            'zh-TW': '細膩、敏感、完美主義、高雅、挑剔'
        },
        'strengths': ['섬세함', '심미안', '분석력', '순수함'],
        'weaknesses': ['예민함', '까다로움', '신경질', '완고함'],
        'suitable': ['보석', '미용', '금융', '법률', '예술', '감정사'],
        'johu': {
            '봄': {'primary': '壬', 'secondary': '甲', 'reason': '금백수청'},
            '여름': {'primary': '壬', 'secondary': '己癸', 'reason': '세척'},
            '가을': {'primary': '壬', 'secondary': '丁', 'reason': '세척'},
            '겨울': {'primary': '丙', 'secondary': '壬', 'reason': '온난'}
        }
    },
    '壬': {
        'element': '水',
        'polarity': '陽',
        'symbol': {
            'ko': '바다, 강, 큰 물',
            'en': 'Ocean, river, great water',
            'ja': '海、川、大水',
            'zh-CN': '海洋、江河、大水',
            'zh-TW': '海洋、江河、大水'
        },
        'personality': {
            'ko': '지혜, 유연함, 포용력, 흐름을 따름, 적응력',
            'en': 'Wise, flexible, tolerant, goes with flow, adaptable',
            'ja': '知恵、柔軟、包容力、流れに従う、適応力',
            'zh-CN': '智慧、灵活、包容、顺势而为、适应力',
            'zh-TW': '智慧、靈活、包容、順勢而為、適應力'
        },
        'strengths': ['지혜', '유연함', '적응력', '통찰력'],
        'weaknesses': ['변덕', '우유부단', '방향성 부족', '감정적'],
        'suitable': ['무역', '물류', '여행', '컨설팅', '철학', '연구'],
        'johu': {
            '봄': {'primary': '庚', 'secondary': '丙', 'reason': '수원+온난'},
            '여름': {'primary': '庚', 'secondary': '辛', 'reason': '수원확보'},
            '가을': {'primary': '甲', 'secondary': '丙', 'reason': '설기+온난'},
            '겨울': {'primary': '丙', 'secondary': '甲', 'reason': '동결방지'}
        }
    },
    '癸': {
        'element': '水',
        'polarity': '陰',
        'symbol': {
            'ko': '이슬, 비, 샘물, 안개',
            'en': 'Dew, rain, spring water, mist',
            'ja': '露、雨、湧き水、霧',
            'zh-CN': '露水、雨水、泉水、雾',
            'zh-TW': '露水、雨水、泉水、霧'
        },
        'personality': {
            'ko': '섬세함, 직관력, 영성, 부드러움, 내면의 깊이',
            'en': 'Delicate, intuitive, spiritual, gentle, inner depth',
            'ja': '繊細、直感力、霊性、柔らかさ、内面の深さ',
            'zh-CN': '细腻、直觉力、灵性、温柔、内心深度',
            'zh-TW': '細膩、直覺力、靈性、溫柔、內心深度'
        },
        'strengths': ['직관력', '섬세함', '영성', '공감력'],
        'weaknesses': ['불안정', '우울', '소심함', '의존성'],
        'suitable': ['점술', '상담', '예술', '의료', '종교', '심리학'],
        'johu': {
            '봄': {'primary': '辛', 'secondary': '丙', 'reason': '수원+온난'},
            '여름': {'primary': '辛', 'secondary': '庚', 'reason': '수원확보'},
            '가을': {'primary': '辛', 'secondary': '丙', 'reason': '수원+온난'},
            '겨울': {'primary': '丙', 'secondary': '辛', 'reason': '동결방지'}
        }
    }
}


# =============================================================================
# 헬퍼 함수
# =============================================================================

def get_ziping_summary(language: LanguageType = 'ko') -> str:
    """자평진전 핵심 요약 반환"""
    if language == 'zh':
        language = 'zh-CN'
    return ZIPING_SUMMARY.get(language, ZIPING_SUMMARY['ko'])


def get_qiongtong_summary(language: LanguageType = 'ko') -> str:
    """궁통보감 조후론 요약 반환"""
    if language == 'zh':
        language = 'zh-CN'
    return QIONGTONG_SUMMARY.get(language, QIONGTONG_SUMMARY['ko'])


def get_ten_gods_guide(language: LanguageType = 'ko') -> str:
    """십신 해석 가이드 반환"""
    if language == 'zh':
        language = 'zh-CN'
    return TEN_GODS_GUIDE.get(language, TEN_GODS_GUIDE['ko'])


def get_day_master_traits(day_master: str) -> Dict:
    """특정 일간의 특성 반환"""
    return DAY_MASTER_TRAITS.get(day_master, {})


def get_day_master_johu(day_master: str, season: str) -> Dict:
    """특정 일간의 계절별 조후 반환"""
    traits = DAY_MASTER_TRAITS.get(day_master, {})
    johu = traits.get('johu', {})
    return johu.get(season, {})


def build_multistep_prompt(
    step: str,
    language: LanguageType = 'ko',
    day_master: str = None,
    season: str = None
) -> str:
    """
    멀티스텝 분석 단계별 프롬프트 조합

    Args:
        step: 분석 단계 ('basic', 'personality', 'aptitude', 'wealth_love')
        language: 언어 코드
        day_master: 일간 (예: '甲')
        season: 계절 (예: '봄', '여름', '가을', '겨울')

    Returns:
        해당 단계에 필요한 프롬프트 조각
    """
    if language == 'zh':
        language = 'zh-CN'

    parts = []

    if step == 'basic':
        # Step 2: 기본 분석 - 자평진전 + 궁통보감 + 일간 특성
        parts.append(ZIPING_SUMMARY.get(language, ZIPING_SUMMARY['ko']))
        parts.append(QIONGTONG_SUMMARY.get(language, QIONGTONG_SUMMARY['ko']))
        if day_master:
            traits = get_day_master_traits(day_master)
            if traits:
                parts.append(f"\n## 일간 특성: {day_master}")
                parts.append(f"- 오행: {traits.get('element', '')} ({traits.get('polarity', '')})")
                symbol = traits.get('symbol', {})
                parts.append(f"- 상징: {symbol.get(language, symbol.get('ko', ''))}")
                personality = traits.get('personality', {})
                parts.append(f"- 성격: {personality.get(language, personality.get('ko', ''))}")

    elif step == 'personality':
        # Step 3: 성격 분석 - 십신 가이드
        parts.append(TEN_GODS_GUIDE.get(language, TEN_GODS_GUIDE['ko']))

    elif step == 'aptitude':
        # Step 4: 적성 분석 - 일간 특성 (suitable 필드)
        if day_master:
            traits = get_day_master_traits(day_master)
            if traits:
                parts.append(f"## {day_master} 일간 적성 분야")
                parts.append(f"- 추천 분야: {', '.join(traits.get('suitable', []))}")
                parts.append(f"- 강점: {', '.join(traits.get('strengths', []))}")
                parts.append(f"- 약점: {', '.join(traits.get('weaknesses', []))}")

    elif step == 'wealth_love':
        # Step 5: 재물/연애 - 십신 중 재성/관성 부분
        parts.append("## 재물운/연애운 분석 지침")
        parts.append("- 재성(정재/편재): 재물 획득 방식, 금전 감각")
        parts.append("- 관성(정관/편관): 직장운, 남성에게 자녀/여성에게 배우자")
        parts.append("- 식상(식신/상관): 여성에게 자녀, 표현력")

    return "\n".join(parts)


# =============================================================================
# 모듈 정보
# =============================================================================

__version__ = "1.0.0"
__all__ = [
    'ZIPING_SUMMARY',
    'QIONGTONG_SUMMARY',
    'TEN_GODS_GUIDE',
    'DAY_MASTER_TRAITS',
    'get_ziping_summary',
    'get_qiongtong_summary',
    'get_ten_gods_guide',
    'get_day_master_traits',
    'get_day_master_johu',
    'build_multistep_prompt'
]
