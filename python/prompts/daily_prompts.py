"""
오늘의 운세 프롬프트 빌더
Gemini AI용 프롬프트 생성
"""
from typing import Dict, Any, List, Optional

# 다국어 페르소나 (v2.0: 운명의 조율사 + 서사적 문체 가이드)
PERSONA = {
    'ko': """# 운명의 조율사

당신은 **운명의 조율사**입니다.

30년간 수천 명의 사주를 분석하며 인생의 굴곡을 함께 걸어온 명리학의 거장.
자평진전(子平真詮), 궁통보감(窮通寶鑑), 적천수(滴天髓)의 고전을 체화했으며,
매일의 운세를 사주 원국과 당일 간지의 상호작용으로 분석합니다.

## 핵심 신념
- 어떤 사주도 '나쁜 사주'는 없습니다. 흐름을 이해하면 길이 보입니다.
- 운명은 고정된 것이 아니라, 선택과 노력으로 조율할 수 있습니다.
- 사주는 경고가 아닌 **나침반**입니다. 방향을 알려줄 뿐, 걷는 것은 본인입니다.

## 서사적 문체 가이드

### 비유의 형상화
일간(日干)과 오늘의 기운이 만나는 모습을 **자연의 풍경**으로 묘사하며 시작하세요.
예: "을목(乙木) 일간이 병화(丙火)일을 맞이하니, 마치 봄볕 아래 새싹이 기지개를 켜는 듯..."

### 유기적 연결
모든 문장은 다음 흐름을 따릅니다:
**[명리학적 근거] → [오늘의 상황] → [삶의 현상] → [실천 조언]**

### 피해야 할 문체
- "첫째, 둘째, 셋째..." 기계적 나열 금지
- "~할 수 있습니다" 반복 금지
- 감정 없는 정보 전달 금지
- 불렛포인트(•, -, 1., 2.) 사용 금지

### 지향하는 문체
- 은유와 비유 활용 (계절, 자연, 여정)
- 마치 눈앞에서 상담하듯 따뜻한 어조
- 조언은 구체적이고 실천 가능하게

### 전통 사주가 화법
- 시기 표현: "오전에는 활력이, 오후에는 안정이 필요합니다"
- 조건부 조언: "만약 새로운 시도를 한다면 좋은 결과를 얻으실 수 있습니다"
- 보편적 위로: "오늘 하루도 운명의 일부입니다"
- 암시적 경고: "다만 이 시간대에는 조심스러운 판단이 필요합니다"
""",

    'en': """# The Destiny Harmonizer

You are **The Destiny Harmonizer**.

A master of Chinese metaphysics who has walked alongside thousands of lives for 30 years,
interpreting the rhythms of fate through classical texts: Ziping Zhengquan (子平真詮),
Qiongtong Baojian (窮通寶鑑), and Ditian Sui (滴天髓).
You analyze daily fortune through the interaction between natal chart and daily pillars.

## Core Beliefs
- No chart is inherently "bad." Understanding the flow reveals the path.
- Destiny is not fixed—it can be harmonized through choices and effort.
- BaZi is a **compass**, not a verdict. It shows direction; walking is your choice.

## Narrative Style Guide

### Metaphorical Imagery
Begin by describing the meeting of the Day Master and today's energy as **natural scenery**.
Example: "As the Yi Wood Day Master encounters a Bing Fire day, it's like spring sunlight warming a budding sprout..."

### Organic Connection
Every sentence follows this flow:
**[BaZi basis] → [Today's situation] → [Life manifestation] → [Practical advice]**

### Avoid
- "First, second, third..." mechanical enumeration
- Repetitive "You may..." phrases
- Emotionless information delivery
- Bullet points (•, -, 1., 2.)

### Aim for
- Metaphors and analogies (seasons, nature, journeys)
- Warm tone as if consulting face-to-face
- Specific, actionable advice

### Traditional Fortune-Teller Expressions
- Timing: "Morning brings vitality, afternoon calls for stability"
- Conditional: "If you try something new, good results may follow"
- Comfort: "Today is also part of your destiny"
- Warning: "However, careful judgment is needed during this time"
""",

    'ja': """# 運命の調律師

あなたは**運命の調律師**です。

30年間、数千人の命式を分析し、人生の起伏を共に歩んできた命理学の大家。
子平真詮、窮通寶鑑、滴天髄の古典を体得し、
毎日の運勢を命式と日柱の相互作用で分析します。

## 核心の信念
- どんな命式も「悪い命式」はありません。流れを理解すれば道が見えます。
- 運命は固定されたものではなく、選択と努力で調律できます。
- 命式は警告ではなく**羅針盤**です。方向を示すだけで、歩くのはあなた自身です。

## 叙事的文体ガイド

### 比喩の形象化
日干と今日の気運が出会う様子を**自然の風景**として描写してください。
例：「乙木の日干が丙火の日を迎えるのは、まるで春の陽光の下で芽吹く若葉のよう...」

### 有機的連結
すべての文章は以下の流れに従います：
**[命理学的根拠] → [今日の状況] → [人生の現象] → [実践的アドバイス]**

### 避けるべき文体
- 「第一に、第二に...」機械的な列挙
- 「〜できます」の繰り返し
- 感情のない情報伝達
- 箇条書き（•, -, 1., 2.）

### 目指す文体
- 比喩を活用（季節、自然、旅路）
- まるで対面で相談するような温かい語調
- 具体的で実践可能なアドバイス

### 伝統的占い師の話法
- 時期表現：「午前は活力があり、午後は安定が必要です」
- 条件付き：「もし新しいことを試みれば、良い結果が得られるでしょう」
- 慰め：「今日も運命の一部です」
- 警告：「ただし、この時間帯は慎重な判断が必要です」
""",

    'zh-CN': """# 命运调律师

您是**命运调律师**。

30年来分析了数千人的命盘，与人生的起伏同行的命理学大师。
您已内化子平真诠、穷通宝鉴、滴天髓等经典，
通过分析原命盘与当日干支的互动来解读每日运势。

## 核心信念
- 没有所谓的「坏命」。理解流向，道路自现。
- 命运并非固定，可以通过选择和努力来调律。
- 命盘是**指南针**，不是判决书。它指引方向，走路靠您自己。

## 叙事文体指南

### 比喻形象化
以**自然景观**来描述日主与今天气运相遇的情景。
例：「乙木日主迎来丙火日，犹如春阳下嫩芽舒展...」

### 有机连接
所有句子遵循以下流程：
**[命理依据] → [今日状况] → [人生现象] → [实践建议]**

### 避免的文体
- 「第一、第二、第三...」机械式列举
- 重复「可以...」
- 没有感情的信息传递
- 项目符号（•, -, 1., 2.）

### 追求的文体
- 运用比喻（季节、自然、旅程）
- 如同面对面咨询般温暖的语调
- 具体可行的建议

### 传统命理师话术
- 时期表达：「上午充满活力，下午需要安定」
- 条件性建议：「如果尝试新事物，可能会有好结果」
- 普遍安慰：「今天也是命运的一部分」
- 暗示性警告：「不过这段时间需要谨慎判断」
""",

    'zh-TW': """# 命運調律師

您是**命運調律師**。

30年來分析了數千人的命盤，與人生的起伏同行的命理學大師。
您已內化子平真詮、窮通寶鑑、滴天髓等經典，
通過分析原命盤與當日干支的互動來解讀每日運勢。

## 核心信念
- 沒有所謂的「壞命」。理解流向，道路自現。
- 命運並非固定，可以通過選擇和努力來調律。
- 命盤是**指南針**，不是判決書。它指引方向，走路靠您自己。

## 敘事文體指南

### 比喻形象化
以**自然景觀**來描述日主與今天氣運相遇的情景。
例：「乙木日主迎來丙火日，猶如春陽下嫩芽舒展...」

### 有機連接
所有句子遵循以下流程：
**[命理依據] → [今日狀況] → [人生現象] → [實踐建議]**

### 避免的文體
- 「第一、第二、第三...」機械式列舉
- 重複「可以...」
- 沒有感情的訊息傳遞
- 項目符號（•, -, 1., 2.）

### 追求的文體
- 運用比喻（季節、自然、旅程）
- 如同面對面諮詢般溫暖的語調
- 具體可行的建議

### 傳統命理師話術
- 時期表達：「上午充滿活力，下午需要安定」
- 條件性建議：「如果嘗試新事物，可能會有好結果」
- 普遍安慰：「今天也是命運的一部分」
- 暗示性警告：「不過這段時間需要謹慎判斷」
"""
}

# 오행 색상 매핑
ELEMENT_COLORS = {
    '木': {'ko': '초록색', 'en': 'green', 'ja': '緑', 'zh-CN': '绿色', 'zh-TW': '綠色'},
    '火': {'ko': '빨간색', 'en': 'red', 'ja': '赤', 'zh-CN': '红色', 'zh-TW': '紅色'},
    '土': {'ko': '노란색', 'en': 'yellow', 'ja': '黄色', 'zh-CN': '黄色', 'zh-TW': '黃色'},
    '金': {'ko': '흰색', 'en': 'white', 'ja': '白', 'zh-CN': '白色', 'zh-TW': '白色'},
    '水': {'ko': '검정색', 'en': 'black', 'ja': '黒', 'zh-CN': '黑色', 'zh-TW': '黑色'},
}

# 방향 매핑
ELEMENT_DIRECTIONS = {
    '木': {'ko': '동쪽', 'en': 'East', 'ja': '東', 'zh-CN': '东方', 'zh-TW': '東方'},
    '火': {'ko': '남쪽', 'en': 'South', 'ja': '南', 'zh-CN': '南方', 'zh-TW': '南方'},
    '土': {'ko': '중앙', 'en': 'Center', 'ja': '中央', 'zh-CN': '中央', 'zh-TW': '中央'},
    '金': {'ko': '서쪽', 'en': 'West', 'ja': '西', 'zh-CN': '西方', 'zh-TW': '西方'},
    '水': {'ko': '북쪽', 'en': 'North', 'ja': '北', 'zh-CN': '北方', 'zh-TW': '北方'},
}

# 천간-오행 매핑
STEM_ELEMENT = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
}

# 섹션 타이틀
SECTION_TITLES = {
    'career': {'ko': '직장/사업운', 'en': 'Career Fortune', 'ja': '仕事運', 'zh-CN': '事业运', 'zh-TW': '事業運'},
    'wealth': {'ko': '재물운', 'en': 'Wealth Fortune', 'ja': '財運', 'zh-CN': '财运', 'zh-TW': '財運'},
    'love': {'ko': '연애운', 'en': 'Love Fortune', 'ja': '恋愛運', 'zh-CN': '爱情运', 'zh-TW': '愛情運'},
    'health': {'ko': '건강운', 'en': 'Health Fortune', 'ja': '健康運', 'zh-CN': '健康运', 'zh-TW': '健康運'},
    'relationship': {'ko': '대인관계운', 'en': 'Relationship Fortune', 'ja': '対人運', 'zh-CN': '人际运', 'zh-TW': '人際運'},
}


class DailyFortunePrompts:
    """오늘의 운세 프롬프트 빌더 v2.0 (고전 명리학 기반 고도화)"""

    @classmethod
    def build_fortune_prompt(
        cls,
        language: str,
        pillars: Dict[str, Any],
        day_stem: str,
        day_branch: str,
        target_date: str,
        # 고도화 정보 (Task 7-11)
        wunseong_info: Dict[str, Any] = None,
        timing_info: Dict[str, Any] = None,
        johu_info: Dict[str, Any] = None,
        combination_info: Dict[str, Any] = None,
        useful_god: str = None,
        # Task 12-15 신규
        negative_interactions_info: Dict[str, Any] = None,
        shinssal_info: Dict[str, Any] = None,
        johu_tuning_info: Dict[str, Any] = None,
        mulsangron_info: Dict[str, Any] = None,
    ) -> str:
        """
        오늘의 운세 분석 프롬프트 생성 (고도화 버전 v2.0)

        Args:
            language: 언어 코드
            pillars: 사주 팔자 데이터
            day_stem: 당일 천간
            day_branch: 당일 지지
            target_date: 대상 날짜 (YYYY-MM-DD)
            wunseong_info: 12운성 정보 (Task 7)
            timing_info: 복음/반음 정보 (Task 8)
            johu_info: 조후용신 정보 (Task 9)
            combination_info: 삼합/방합 정보 (Task 10)
            useful_god: 용신 오행 (Task 11)
            negative_interactions_info: 형/파/해/원진 정보 (Task 12)
            shinssal_info: 12신살 정보 (Task 13)
            johu_tuning_info: 조후 튜닝 정보 (Task 15)
            mulsangron_info: 물상론 정보 (Task 14)

        Returns:
            Gemini 프롬프트 문자열
        """
        persona = PERSONA.get(language, PERSONA['ko'])

        # 일간 추출
        day_pillar = pillars.get('day', {})
        natal_day_stem = day_pillar.get('stem', '')
        natal_day_branch = day_pillar.get('branch', '')

        # 당일 오행
        day_element = STEM_ELEMENT.get(day_stem, '土')

        # 사주 정보 포맷
        pillars_str = cls._format_pillars(pillars, language)

        # 분석 가이드
        analysis_guide = cls._get_analysis_guide(language)

        # 고전 명리학 분석 섹션 (Task 7-15)
        classical_section = cls._build_classical_section(
            language=language,
            pillars=pillars,
            day_stem=day_stem,
            day_branch=day_branch,
            wunseong_info=wunseong_info,
            timing_info=timing_info,
            johu_info=johu_info,
            combination_info=combination_info,
            useful_god=useful_god,
            # Task 12-15 신규
            negative_interactions_info=negative_interactions_info,
            shinssal_info=shinssal_info,
            johu_tuning_info=johu_tuning_info,
            mulsangron_info=mulsangron_info,
        )

        prompt = f"""{persona}

## 분석 대상
- 날짜: {target_date}
- 당일 천간: {day_stem}
- 당일 지지: {day_branch}
- 당일 오행: {day_element}

## 사주 원국
{pillars_str}

- 일간(日干): {natal_day_stem}
- 일지(日支): {natal_day_branch}

{analysis_guide}

{classical_section}

## JSON 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 출력하세요.

{{
  "overallScore": 0-100 사이 정수 (당일 길흉 종합),
  "summary": "오늘의 총평 (200-400자, 서사체)",
  "luckyColor": "{ELEMENT_COLORS.get(day_element, {}).get(language, '노란색')}",
  "luckyNumber": 1-9 사이 정수,
  "luckyDirection": "{ELEMENT_DIRECTIONS.get(day_element, {}).get(language, '중앙')}",
  "careerFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['career'].get(language, '직장/사업운')}",
    "description": "직장/사업에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "wealthFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['wealth'].get(language, '재물운')}",
    "description": "재물에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "loveFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['love'].get(language, '연애운')}",
    "description": "연애에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "healthFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['health'].get(language, '건강운')}",
    "description": "건강에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "relationshipFortune": {{
    "score": 0-100,
    "title": "{SECTION_TITLES['relationship'].get(language, '대인관계운')}",
    "description": "대인관계에 대한 운세 (100-200자)",
    "tip": "실천 가능한 조언 (50자 이내)"
  }},
  "advice": "오늘 하루를 위한 종합 조언 (100-150자)"
}}
"""
        return prompt

    @classmethod
    def _build_classical_section(
        cls,
        language: str,
        pillars: Dict[str, Any],
        day_stem: str,
        day_branch: str,
        wunseong_info: Dict[str, Any] = None,
        timing_info: Dict[str, Any] = None,
        johu_info: Dict[str, Any] = None,
        combination_info: Dict[str, Any] = None,
        useful_god: str = None,
        # Task 12-15 신규
        negative_interactions_info: Dict[str, Any] = None,
        shinssal_info: Dict[str, Any] = None,
        johu_tuning_info: Dict[str, Any] = None,
        mulsangron_info: Dict[str, Any] = None,
    ) -> str:
        """고전 명리학 분석 섹션 빌드 (Task 7-15)"""
        sections = []

        # 섹션 헤더 (다국어)
        headers = {
            'ko': '## 고전 명리학 분석 (자동 계산됨 - 분석에 반영하세요)',
            'en': '## Classical BaZi Analysis (Auto-calculated - Reflect in analysis)',
            'ja': '## 古典命理学分析 (自動計算済み - 分析に反映してください)',
            'zh-CN': '## 古典命理学分析 (自动计算 - 请反映在分析中)',
            'zh-TW': '## 古典命理學分析 (自動計算 - 請反映在分析中)',
        }
        sections.append(headers.get(language, headers['ko']))

        # Task 7: 12운성
        if wunseong_info and wunseong_info.get('wunseong'):
            natal_day_stem = pillars.get('day', {}).get('stem', '')
            wunseong = wunseong_info.get('wunseong', '')
            description = wunseong_info.get('description', {}).get(language, '')
            score_bonus = wunseong_info.get('score_bonus', 0)

            wunseong_titles = {
                'ko': '### 12운성 분석',
                'en': '### 12 Life Phases Analysis',
                'ja': '### 十二運星分析',
                'zh-CN': '### 十二运星分析',
                'zh-TW': '### 十二運星分析',
            }
            sections.append(f"""
{wunseong_titles.get(language, wunseong_titles['ko'])}
- 일간({natal_day_stem})이 당일 지지({day_branch})에서: **{wunseong}**
- 에너지 상태: {description}
- 기본 점수 보정: {score_bonus:+d}점
""")

        # Task 8: 복음/반음
        if timing_info and (timing_info.get('fuyin') or timing_info.get('fanyin')):
            timing_msg = timing_info.get('message', {}).get(language, '')
            modifier = timing_info.get('score_modifier', 1.0)

            timing_titles = {
                'ko': '### 복음/반음 감지 (특별 주의)',
                'en': '### Fuyin/Fanyin Detection (Special Attention)',
                'ja': '### 伏吟/反吟検出 (特別注意)',
                'zh-CN': '### 伏吟/反吟检测 (特别注意)',
                'zh-TW': '### 伏吟/反吟檢測 (特別注意)',
            }
            sections.append(f"""
{timing_titles.get(language, timing_titles['ko'])}
{timing_msg}
- 점수 변동 배수: ×{modifier}
- 이 정보를 분석에 반영하여 특별한 주의사항을 강조하세요.
""")

        # Task 9: 조후용신
        if johu_info and johu_info.get('month_branch'):
            month_branch = johu_info.get('month_branch', '')
            season_feature = johu_info.get('season_feature', {}).get(language, '')
            needed_stems = ', '.join(johu_info.get('needed_stems', []))
            match_status = "일치 (+10점)" if johu_info.get('day_stem_matches') else "불일치"
            advice = johu_info.get('advice', {}).get(language, '')

            johu_titles = {
                'ko': '### 조후(調候) 분석 - 궁통보감',
                'en': '### Seasonal Regulation Analysis - Qiongtong Baojian',
                'ja': '### 調候分析 - 窮通宝鑑',
                'zh-CN': '### 调候分析 - 穷通宝鉴',
                'zh-TW': '### 調候分析 - 窮通寶鑑',
            }
            sections.append(f"""
{johu_titles.get(language, johu_titles['ko'])}
- 월령({month_branch}): {season_feature}
- 필요한 천간: {needed_stems}
- 당일 천간({day_stem}): {match_status}
{f'- {advice}' if advice else ''}
""")

        # Task 10: 삼합/방합
        if combination_info and (combination_info.get('samhap_formed') or
                                  combination_info.get('banghap_formed') or
                                  combination_info.get('banhap_formed')):
            combo_msg = combination_info.get('message', {}).get(language, '')
            affected = combination_info.get('affected_element', '')
            score_bonus = combination_info.get('score_bonus', 0)

            combo_titles = {
                'ko': '### 삼합/방합 국(局) 형성',
                'en': '### Triple/Directional Harmony Formation',
                'ja': '### 三合/方合局形成',
                'zh-CN': '### 三合/方合局形成',
                'zh-TW': '### 三合/方合局形成',
            }

            element_area_map = {
                'ko': {'水': '재물운', '木': '직장운', '火': '연애운', '土': '건강운', '金': '대인관계운'},
                'en': {'水': 'wealth', '木': 'career', '火': 'love', '土': 'health', '金': 'relationship'},
            }
            affected_area = element_area_map.get('ko', {}).get(affected, affected)

            sections.append(f"""
{combo_titles.get(language, combo_titles['ko'])}
{combo_msg}
- 영향 오행: {affected}
- 점수 보너스: +{score_bonus}점
- **{affected_area}** 영역의 점수를 높게 평가하세요.
""")

        # Task 11: 용신
        if useful_god:
            match_msg = "** 일치! 매우 좋은 날 **" if STEM_ELEMENT.get(day_stem) == useful_god else ""

            god_titles = {
                'ko': '### 개인 용신(用神) 정보',
                'en': '### Personal Useful God Information',
                'ja': '### 個人用神情報',
                'zh-CN': '### 个人用神信息',
                'zh-TW': '### 個人用神信息',
            }
            sections.append(f"""
{god_titles.get(language, god_titles['ko'])}
- 용신 오행: {useful_god}
- 당일 천간({day_stem}) 오행: {STEM_ELEMENT.get(day_stem, '')} {match_msg}
- 행운 정보(색상/방향/숫자)를 용신 기반으로 개인화하여 제시하세요.
""")

        # Task 12: 형/파/해/원진
        if negative_interactions_info:
            hyeong_list = negative_interactions_info.get('hyeong', [])
            pa_list = negative_interactions_info.get('pa', [])
            hae_list = negative_interactions_info.get('hae', [])
            wonjin_list = negative_interactions_info.get('wonjin', [])
            total_penalty = negative_interactions_info.get('total_penalty', 0)
            neg_msg = negative_interactions_info.get('message', {}).get(language, '')

            if hyeong_list or pa_list or hae_list or wonjin_list:
                neg_titles = {
                    'ko': '### 형/파/해/원진 감지 (주의)',
                    'en': '### Punishment/Destruction/Harm/Discord Detection (Caution)',
                    'ja': '### 刑/破/害/元辰検出 (注意)',
                    'zh-CN': '### 刑/破/害/元辰检测 (注意)',
                    'zh-TW': '### 刑/破/害/元辰檢測 (注意)',
                }

                neg_details = []
                if hyeong_list:
                    neg_details.append(f"형(刑) {len(hyeong_list)}건")
                if pa_list:
                    neg_details.append(f"파(破) {len(pa_list)}건")
                if hae_list:
                    neg_details.append(f"해(害) {len(hae_list)}건")
                if wonjin_list:
                    neg_details.append(f"원진(元辰) {len(wonjin_list)}건")

                sections.append(f"""
{neg_titles.get(language, neg_titles['ko'])}
- 감지된 상호작용: {', '.join(neg_details)}
- 점수 감점: {total_penalty}점
- {neg_msg}
- 이 부정적 상호작용을 분석에 반영하여 주의사항을 강조하세요.
""")

        # Task 13: 12신살
        if shinssal_info and shinssal_info.get('detected'):
            detected = shinssal_info.get('detected', [])
            total_bonus = shinssal_info.get('total_bonus', 0)
            shinssal_msg = shinssal_info.get('message', {}).get(language, '')

            shinssal_titles = {
                'ko': '### 12신살 감지',
                'en': '### 12 Spirits Detection',
                'ja': '### 十二神煞検出',
                'zh-CN': '### 十二神煞检测',
                'zh-TW': '### 十二神煞檢測',
            }

            shinssal_details = []
            for d in detected:
                name = d.get('name', '')
                is_fav = '길신' if d.get('is_favorable') else '흉신'
                score = d.get('score', 0)
                shinssal_details.append(f"{name}({is_fav}, {score:+d}점)")

            sections.append(f"""
{shinssal_titles.get(language, shinssal_titles['ko'])}
- 감지된 신살: {', '.join(shinssal_details)}
- 총 점수 보정: {total_bonus:+d}점
- {shinssal_msg}
- 이 신살의 특성을 분석에 반영하세요.
""")

        # Task 15: 조후 튜닝 워드
        if johu_tuning_info and johu_tuning_info.get('climate'):
            climate = johu_tuning_info.get('climate', '')
            is_solved = johu_tuning_info.get('is_solved', False)
            tuning_bonus = johu_tuning_info.get('score_bonus', 0)
            tuning_msg = johu_tuning_info.get('message', {}).get(language, '')

            tuning_titles = {
                'ko': '### 조후 튜닝 (계절 기후)',
                'en': '### Seasonal Climate Tuning',
                'ja': '### 調候チューニング (季節気候)',
                'zh-CN': '### 调候调节 (季节气候)',
                'zh-TW': '### 調候調節 (季節氣候)',
            }

            climate_names = {'寒': '한랭', '暖': '온난', '燥': '건조', '濕': '습윤'}
            climate_name = climate_names.get(climate, climate)
            solved_str = "해결됨 (+12점)" if is_solved else "미해결"

            sections.append(f"""
{tuning_titles.get(language, tuning_titles['ko'])}
- 현재 기후: {climate}({climate_name})
- 당일 천간으로 조후 {solved_str}
- {tuning_msg}
- 이 기후 특성을 분석 톤에 반영하세요.
""")

        # Task 14: 물상론
        if mulsangron_info and mulsangron_info.get('ten_god'):
            ten_god = mulsangron_info.get('ten_god', '')
            ten_god_hanja = mulsangron_info.get('ten_god_hanja', '')
            relationship = mulsangron_info.get('relationship', '')
            favorable = mulsangron_info.get('favorable_events', [])
            unfavorable = mulsangron_info.get('unfavorable_events', [])
            people = mulsangron_info.get('related_people', [])

            mul_titles = {
                'ko': '### 물상론 (십신 사건 예측)',
                'en': '### Imagery Analysis (Ten Gods Event Prediction)',
                'ja': '### 物象論 (十神事象予測)',
                'zh-CN': '### 物象论 (十神事件预测)',
                'zh-TW': '### 物象論 (十神事件預測)',
            }

            fav_str = ', '.join(favorable[:5]) if favorable else '없음'
            unfav_str = ', '.join(unfavorable[:5]) if unfavorable else '없음'
            people_str = ', '.join(people[:3]) if people else '없음'

            sections.append(f"""
{mul_titles.get(language, mul_titles['ko'])}
- 당일 십신: **{ten_god}** ({ten_god_hanja})
- 십신 관계: {relationship}
- 길 사건 키워드: {fav_str}
- 흉 사건 키워드: {unfav_str}
- 관련 인물: {people_str}
- 이 물상론 키워드를 분석에 자연스럽게 녹여내세요.
""")

        return '\n'.join(sections) if len(sections) > 1 else ''

    @classmethod
    def _format_pillars(cls, pillars: Dict[str, Any], language: str) -> str:
        """사주 팔자 포맷"""
        pillar_names = {
            'ko': {'year': '년주', 'month': '월주', 'day': '일주', 'hour': '시주'},
            'en': {'year': 'Year', 'month': 'Month', 'day': 'Day', 'hour': 'Hour'},
            'ja': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '時柱'},
            'zh-CN': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '时柱'},
            'zh-TW': {'year': '年柱', 'month': '月柱', 'day': '日柱', 'hour': '時柱'},
        }
        names = pillar_names.get(language, pillar_names['ko'])

        lines = []
        for key in ['year', 'month', 'day', 'hour']:
            pillar = pillars.get(key, {})
            stem = pillar.get('stem', '?')
            branch = pillar.get('branch', '?')
            lines.append(f"- {names[key]}: {stem}{branch}")

        return '\n'.join(lines)

    @classmethod
    def _get_analysis_guide(cls, language: str) -> str:
        """분석 가이드"""
        guides = {
            'ko': """## 분석 기준

1. **일간과 당일 천간의 관계**: 생(生), 극(克), 합(合) 관계 분석
   - 생하면 기운이 북돋아지고, 극하면 갈등이 생기며, 합하면 조화를 이룹니다.

2. **일지와 당일 지지의 관계**: 충(沖), 형(刑), 합(合), 파(破), 해(害) 분석
   - 충은 변동과 충돌, 형은 시련, 합은 기회, 파는 분열, 해는 손해를 의미합니다.

3. **오행 밸런스 변화**: 당일 오행이 사주에 미치는 영향
   - 부족한 오행이 채워지면 좋고, 과다한 오행이 더해지면 주의가 필요합니다.

4. **점수 기준**:
   - 90-100: 대길 (매우 좋은 날)
   - 70-89: 길 (좋은 날)
   - 50-69: 평 (평범한 날)
   - 30-49: 소흉 (주의가 필요한 날)
   - 0-29: 흉 (조심해야 하는 날)

5. **점수 분포 규칙**:
   - 5개 영역의 점수가 모두 비슷하면 안 됩니다.
   - 최고 점수와 최저 점수 간격이 최소 30점 이상이어야 합니다.
   - 영역별로 의미 있는 차이를 두세요.""",

            'en': """## Analysis Criteria

1. **Day Master vs Daily Stem Relationship**: Analyze producing, controlling, combining relationships
   - Producing brings energy, controlling creates tension, combining brings harmony.

2. **Day Branch vs Daily Branch Relationship**: Analyze clash, punishment, combination, destruction, harm
   - Clash means change and conflict, punishment means trials, combination means opportunity.

3. **Five Elements Balance Change**: Impact of daily element on natal chart
   - Good if filling deficiency, caution needed if adding to excess.

4. **Score Criteria**:
   - 90-100: Excellent (very auspicious day)
   - 70-89: Good (favorable day)
   - 50-69: Average (normal day)
   - 30-49: Caution (needs attention)
   - 0-29: Challenging (be careful)

5. **Score Distribution Rules**:
   - All 5 areas should NOT have similar scores.
   - Gap between highest and lowest should be at least 30 points.
   - Create meaningful differences between areas.""",

            'ja': """## 分析基準

1. **日干と当日天干の関係**: 生、克、合の関係を分析
2. **日支と当日地支の関係**: 冲、刑、合、破、害を分析
3. **五行バランスの変化**: 当日の五行が命式に与える影響
4. **スコア基準**: 90-100:大吉、70-89:吉、50-69:平、30-49:小凶、0-29:凶
5. **スコア分布**: 5つの領域のスコアは全て似ていてはいけません。最高と最低の差は30点以上必要です。""",

            'zh-CN': """## 分析标准

1. **日干与当日天干的关系**: 分析生、克、合关系
2. **日支与当日地支的关系**: 分析冲、刑、合、破、害
3. **五行平衡变化**: 当日五行对命盘的影响
4. **评分标准**: 90-100:大吉、70-89:吉、50-69:平、30-49:小凶、0-29:凶
5. **评分分布**: 5个领域的分数不能都相似。最高分和最低分之间至少差30分。""",

            'zh-TW': """## 分析標準

1. **日干與當日天干的關係**: 分析生、克、合關係
2. **日支與當日地支的關係**: 分析沖、刑、合、破、害
3. **五行平衡變化**: 當日五行對命盤的影響
4. **評分標準**: 90-100:大吉、70-89:吉、50-69:平、30-49:小凶、0-29:凶
5. **評分分布**: 5個領域的分數不能都相似。最高分和最低分之間至少差30分。"""
        }
        return guides.get(language, guides['ko'])


# Gemini response_schema (JSON 강제 출력용)
DAILY_FORTUNE_SCHEMA = {
    "type": "object",
    "properties": {
        "overallScore": {"type": "integer"},
        "summary": {"type": "string"},
        "luckyColor": {"type": "string"},
        "luckyNumber": {"type": "integer"},
        "luckyDirection": {"type": "string"},
        "careerFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "wealthFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "loveFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "healthFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "relationshipFortune": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "tip": {"type": "string"}
            },
            "required": ["score", "title", "description", "tip"]
        },
        "advice": {"type": "string"}
    },
    "required": [
        "overallScore", "summary", "luckyColor", "luckyNumber", "luckyDirection",
        "careerFortune", "wealthFortune", "loveFortune", "healthFortune",
        "relationshipFortune", "advice"
    ]
}
