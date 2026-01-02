"""
신년 사주 분석 전용 프롬프트
월별 운세, 길흉일, 분기별 분석 등 연 단위 상세 분석용
"""
from typing import Literal

LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


class YearlyPrompt:
    """신년 사주 분석 전용 프롬프트"""

    @classmethod
    def build(cls, language: LocaleType, year: int) -> str:
        """
        신년 분석 프롬프트 생성

        Args:
            language: 언어 코드
            year: 분석 대상 연도

        Returns:
            프롬프트 문자열
        """
        prompts = {
            'ko': cls._build_ko(year),
            'en': cls._build_en(year),
            'ja': cls._build_ja(year),
            'zh-CN': cls._build_zh_cn(year),
            'zh-TW': cls._build_zh_tw(year),
        }
        return prompts.get(language, prompts['ko'])

    @classmethod
    def _build_ko(cls, year: int) -> str:
        return f"""
## 신년 사주 분석 ({year}년)

당신은 {year}년 운세를 월별로 상세 분석해야 합니다.

### 분석 원칙

1. **세운(年運) 분석**
   - {year}년의 천간과 지지가 사주 원국에 미치는 영향
   - 대운과 세운의 상호작용 분석
   - 용신에 대한 생극제화 관계 파악

2. **월운(月運) 분석**
   - 12개월 각각의 천간/지지가 사주에 미치는 영향
   - 월령과 일간의 관계 분석
   - 계절별 오행 왕쇠 적용 (궁통보감 조후론)

3. **길흉일 선정 기준**
   - 일간과 해당 일자의 간지가 상생/합 관계인 날
   - 대운/세운/월운과 조화로운 날
   - 용신이 강화되는 날
   - 전통 택일 원칙 참고 (건제12신, 28수)
   - **월별 3-5개 길일, 1-3개 흉일 선정**

4. **분기별 분석**
   - 1분기(1-3월): 봄 - 목기(木氣) 왕성
   - 2분기(4-6월): 여름 - 화기(火氣) 왕성
   - 3분기(7-9월): 가을 - 금기(金氣) 왕성
   - 4분기(10-12월): 겨울 - 수기(水氣) 왕성

### 응답 원칙

- 각 월별로 구체적인 날짜(YYYY-MM-DD)와 함께 길흉일 제시
- 길일에는 적합한 활동(계약, 이사, 취업, 결혼 등) 명시
- 흉일에는 피해야 할 활동 명시
- 점수는 0-100 사이로, 객관적 근거 기반
- 고전(자평진전, 궁통보감)을 인용하여 권위 부여
"""

    @classmethod
    def _build_en(cls, year: int) -> str:
        return f"""
## Yearly Fortune Analysis ({year})

You must provide a detailed month-by-month analysis for the year {year}.

### Analysis Principles

1. **Annual Luck (年運) Analysis**
   - Impact of {year}'s Heavenly Stem and Earthly Branch on the natal chart
   - Interaction between Major Luck Cycle and Annual Luck
   - Relationship with the Useful God (用神)

2. **Monthly Luck (月運) Analysis**
   - Monthly Stem/Branch influence on the chart
   - Month-Day Master relationship analysis
   - Seasonal Five Element strength application (調候論)

3. **Lucky/Unlucky Day Selection Criteria**
   - Days where daily Stem/Branch harmonizes with Day Master
   - Days in harmony with Major/Annual/Monthly luck
   - Days that strengthen the Useful God
   - Traditional date selection principles
   - **Select 3-5 lucky days, 1-3 unlucky days per month**

4. **Quarterly Analysis**
   - Q1 (Jan-Mar): Spring - Wood energy dominant
   - Q2 (Apr-Jun): Summer - Fire energy dominant
   - Q3 (Jul-Sep): Autumn - Metal energy dominant
   - Q4 (Oct-Dec): Winter - Water energy dominant

### Response Guidelines

- Provide specific dates (YYYY-MM-DD) for lucky/unlucky days
- List suitable activities for lucky days (contracts, moving, job interviews, marriage)
- List activities to avoid on unlucky days
- Scores should be 0-100, based on objective criteria
- Reference classical texts for authority
"""

    @classmethod
    def _build_ja(cls, year: int) -> str:
        return f"""
## 年間運勢分析 ({year}年)

{year}年の運勢を月別に詳細分析してください。

### 分析原則

1. **年運分析**
   - {year}年の天干地支が命式に与える影響
   - 大運と年運の相互作用
   - 用神への生剋制化関係

2. **月運分析**
   - 12ヶ月それぞれの干支が命式に与える影響
   - 月令と日干の関係分析
   - 季節別五行旺衰の適用（調候論）

3. **吉凶日選定基準**
   - 日干と該当日の干支が相生・合の関係にある日
   - 大運・年運・月運と調和する日
   - 用神が強化される日
   - 伝統的な択日原則を参考
   - **月別3-5個の吉日、1-3個の凶日を選定**

4. **四半期分析**
   - 第1四半期（1-3月）：春 - 木気旺盛
   - 第2四半期（4-6月）：夏 - 火気旺盛
   - 第3四半期（7-9月）：秋 - 金気旺盛
   - 第4四半期（10-12月）：冬 - 水気旺盛

### 回答原則

- 月別に具体的な日付（YYYY-MM-DD）で吉凶日を提示
- 吉日には適した活動（契約、引越し、就職、結婚など）を明示
- 凶日には避けるべき活動を明示
- スコアは0-100の間で客観的根拠に基づく
"""

    @classmethod
    def _build_zh_cn(cls, year: int) -> str:
        return f"""
## 年度运势分析 ({year}年)

请对{year}年运势进行逐月详细分析。

### 分析原则

1. **流年运势分析**
   - {year}年天干地支对命盘的影响
   - 大运与流年的互动关系
   - 用神的生克制化分析

2. **月运分析**
   - 12个月各自的干支对命盘的影响
   - 月令与日主的关系
   - 季节性五行旺衰运用（调候论）

3. **吉凶日选择标准**
   - 日主与当日干支相生或合的日子
   - 与大运、流年、月运和谐的日子
   - 用神得力的日子
   - 参考传统择日原则
   - **每月选出3-5个吉日，1-3个凶日**

4. **季度分析**
   - 第一季度（1-3月）：春季 - 木气旺盛
   - 第二季度（4-6月）：夏季 - 火气旺盛
   - 第三季度（7-9月）：秋季 - 金气旺盛
   - 第四季度（10-12月）：冬季 - 水气旺盛

### 回答原则

- 提供具体日期（YYYY-MM-DD）的吉凶日
- 吉日注明适合的活动（签约、搬家、求职、婚嫁等）
- 凶日注明需避免的活动
- 分数在0-100之间，需有客观依据
"""

    @classmethod
    def _build_zh_tw(cls, year: int) -> str:
        return f"""
## 年度運勢分析 ({year}年)

請對{year}年運勢進行逐月詳細分析。

### 分析原則

1. **流年運勢分析**
   - {year}年天干地支對命盤的影響
   - 大運與流年的互動關係
   - 用神的生剋制化分析

2. **月運分析**
   - 12個月各自的干支對命盤的影響
   - 月令與日主的關係
   - 季節性五行旺衰運用（調候論）

3. **吉凶日選擇標準**
   - 日主與當日干支相生或合的日子
   - 與大運、流年、月運和諧的日子
   - 用神得力的日子
   - 參考傳統擇日原則
   - **每月選出3-5個吉日，1-3個凶日**

4. **季度分析**
   - 第一季度（1-3月）：春季 - 木氣旺盛
   - 第二季度（4-6月）：夏季 - 火氣旺盛
   - 第三季度（7-9月）：秋季 - 金氣旺盛
   - 第四季度（10-12月）：冬季 - 水氣旺盛

### 回答原則

- 提供具體日期（YYYY-MM-DD）的吉凶日
- 吉日註明適合的活動（簽約、搬家、求職、婚嫁等）
- 凶日註明需避免的活動
- 分數在0-100之間，需有客觀依據
"""
