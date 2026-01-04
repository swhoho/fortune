"""
로케일 문자열 관리 모듈

모든 다국어 문자열을 중앙집중화하여 관리
- 한국어 조사(은/는, 이/가) 자동 처리 포함
- 개발 모드에서 누락 번역 경고
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ============================================
# 로케일 문자열 정의
# ============================================

LOCALE_STRINGS = {
    # 섹션 헤더
    'focus_area_header': {
        'ko': '## 집중 분석 영역: {label}',
        'en': '## Focus Area: {label}',
        'ja': '## 重点分析領域：{label}',
        'zh-CN': '## 重点分析领域：{label}',
        'zh-TW': '## 重點分析領域：{label}',
    },
    'focus_area_instruction': {
        'ko': '이 영역을 특히 상세하게 분석해주세요.',
        'en': 'Please provide detailed analysis on this area.',
        'ja': 'この領域を特に詳しく分析してください。',
        'zh-CN': '请对该领域进行详细分析。',
        'zh-TW': '請對該領域進行詳細分析。',
    },
    'user_question_header': {
        'ko': '## 사용자 질문\n{question}',
        'en': '## User Question\n{question}',
        'ja': '## ご質問\n{question}',
        'zh-CN': '## 用户提问\n{question}',
        'zh-TW': '## 用戶提問\n{question}',
    },
    'user_question_instruction': {
        'ko': '이 질문에 대한 답변을 분석에 포함해주세요.',
        'en': 'Please include the answer to this question in your analysis.',
        'ja': 'この質問への回答を分析に含めてください。',
        'zh-CN': '请在分析中回答此问题。',
        'zh-TW': '請在分析中回答此問題。',
    },
    'analysis_request_header': {
        'ko': '## 분석 요청',
        'en': '## Analysis Request',
        'ja': '## 分析リクエスト',
        'zh-CN': '## 分析请求',
        'zh-TW': '## 分析請求',
    },
    'analysis_request_instruction': {
        'ko': '위 사주를 분석하여 지정된 JSON 스키마에 맞게 응답해주세요.',
        'en': 'Please analyze the above chart and respond according to the specified JSON schema.',
        'ja': '上記の命式を分析し、指定されたJSONスキーマに従って回答してください。',
        'zh-CN': '请分析以上命盘，并按指定的JSON格式回答。',
        'zh-TW': '請分析以上命盤，並按指定的JSON格式回答。',
    },
    'yearly_flow_instruction': {
        'ko': 'yearly_flow는 {year}년부터 5년간의 운세를 포함해주세요.',
        'en': 'Include yearly_flow for 5 years starting from {year}.',
        'ja': 'yearly_flowには{year}年から5年間の運勢を含めてください。',
        'zh-CN': 'yearly_flow请包含从{year}年起5年的运势。',
        'zh-TW': 'yearly_flow請包含從{year}年起5年的運勢。',
    },

    # 사주 팔자 포맷팅
    'pillars_header': {
        'ko': '## 사주 팔자 (四柱八字)\n',
        'en': '## Four Pillars Chart (BaZi)\n',
        'ja': '## 四柱八字\n',
        'zh-CN': '## 四柱八字\n',
        'zh-TW': '## 四柱八字\n',
    },
    'pillars_table_header': {
        'ko': '| 시주(時柱) | 일주(日柱) | 월주(月柱) | 연주(年柱) |',
        'en': '| Hour | Day | Month | Year |',
        'ja': '| 時柱 | 日柱 | 月柱 | 年柱 |',
        'zh-CN': '| 时柱 | 日柱 | 月柱 | 年柱 |',
        'zh-TW': '| 時柱 | 日柱 | 月柱 | 年柱 |',
    },
    'pillars_table_separator': {
        'ko': '|:----------:|:----------:|:----------:|:----------:|',
        'en': '|:----:|:---:|:-----:|:----:|',
        'ja': '|:----:|:----:|:----:|:----:|',
        'zh-CN': '|:----:|:----:|:----:|:----:|',
        'zh-TW': '|:----:|:----:|:----:|:----:|',
    },
    'day_master_label': {
        'ko': '\n★ 일간(日干): **{stem}** ({element}) - 나 자신',
        'en': '\n★ Day Master: **{stem}** ({element}) - represents YOU',
        'ja': '\n★ 日干：**{stem}** ({element}) - 命主本人',
        'zh-CN': '\n★ 日干：**{stem}** ({element}) - 命主本人',
        'zh-TW': '\n★ 日干：**{stem}** ({element}) - 命主本人',
    },

    # 대운 포맷팅
    'daewun_header': {
        'ko': '\n## 대운 흐름 (大運)',
        'en': '\n## Luck Pillars (大運)',
        'ja': '\n## 大運の流れ',
        'zh-CN': '\n## 大运流程',
        'zh-TW': '\n## 大運流程',
    },
    'daewun_item': {
        'ko': '- {start}~{end}세: {stem}{branch}',
        'en': '- Age {start}-{end}: {stem}{branch}',
        'ja': '- {start}〜{end}歳: {stem}{branch}',
        'zh-CN': '- {start}-{end}岁: {stem}{branch}',
        'zh-TW': '- {start}-{end}歲: {stem}{branch}',
    },

    # 신년 분석
    'yearly_analysis_header': {
        'ko': '## {year}년 신년 분석 요청',
        'en': '## {year} Yearly Analysis Request',
        'ja': '## {year}年 年間分析リクエスト',
        'zh-CN': '## {year}年 年度分析请求',
        'zh-TW': '## {year}年 年度分析請求',
    },
    'yearly_analysis_instruction1': {
        'ko': '위 사주를 바탕으로 {year}년 전체 운세를 분석해주세요.',
        'en': 'Based on the above chart, please analyze the fortune for the entire year of {year}.',
        'ja': '上記の命式を基に、{year}年の運勢を詳細に分析してください。',
        'zh-CN': '请根据以上命盘，详细分析{year}年的整体运势。',
        'zh-TW': '請根據以上命盤，詳細分析{year}年的整體運勢。',
    },
    'yearly_analysis_instruction2': {
        'ko': '12개월 각각의 상세 분석과 길흉일을 포함해주세요.',
        'en': 'Include detailed analysis for each of the 12 months with lucky and unlucky days.',
        'ja': '12ヶ月それぞれの詳細分析と吉凶日を含めてください。',
        'zh-CN': '请包含12个月各自的详细分析和吉凶日。',
        'zh-TW': '請包含12個月各自的詳細分析和吉凶日。',
    },
    'yearly_analysis_instruction3': {
        'ko': '지정된 JSON 스키마에 맞게 응답해주세요.',
        'en': 'Please respond according to the specified JSON schema.',
        'ja': '指定されたJSONスキーマに従って回答してください。',
        'zh-CN': '请按指定的JSON格式回答。',
        'zh-TW': '請按指定的JSON格式回答。',
    },

    # 지장간 포맷팅
    'jijanggan_header': {
        'ko': '\n## 지장간 (支藏干)',
        'en': '\n## Hidden Stems (支藏干)',
        'ja': '\n## 蔵干 (支藏干)',
        'zh-CN': '\n## 藏干 (支藏干)',
        'zh-TW': '\n## 藏干 (支藏干)',
    },
    'jijanggan_year': {
        'ko': '- 연지: {stems}',
        'en': '- Year: {stems}',
        'ja': '- 年支: {stems}',
        'zh-CN': '- 年支: {stems}',
        'zh-TW': '- 年支: {stems}',
    },
    'jijanggan_month': {
        'ko': '- 월지: {stems}',
        'en': '- Month: {stems}',
        'ja': '- 月支: {stems}',
        'zh-CN': '- 月支: {stems}',
        'zh-TW': '- 月支: {stems}',
    },
    'jijanggan_day': {
        'ko': '- 일지: {stems}',
        'en': '- Day: {stems}',
        'ja': '- 日支: {stems}',
        'zh-CN': '- 日支: {stems}',
        'zh-TW': '- 日支: {stems}',
    },
    'jijanggan_hour': {
        'ko': '- 시지: {stems}',
        'en': '- Hour: {stems}',
        'ja': '- 時支: {stems}',
        'zh-CN': '- 时支: {stems}',
        'zh-TW': '- 時支: {stems}',
    },

    # 이전 분석 결과
    'previous_results_header': {
        'ko': '\n## 이전 분석 결과 (참고용)',
        'en': '\n## Previous Analysis Results (For Reference)',
        'ja': '\n## 前の分析結果（参考用）',
        'zh-CN': '\n## 之前的分析结果（参考用）',
        'zh-TW': '\n## 之前的分析結果（參考用）',
    },
    'basic_analysis_header': {
        'ko': '\n### 기본 분석',
        'en': '\n### Basic Analysis',
        'ja': '\n### 基本分析',
        'zh-CN': '\n### 基本分析',
        'zh-TW': '\n### 基本分析',
    },
    'day_master_item': {
        'ko': '- 일간: {value}',
        'en': '- Day Master: {value}',
        'ja': '- 日干: {value}',
        'zh-CN': '- 日干: {value}',
        'zh-TW': '- 日干: {value}',
    },
    'structure_item': {
        'ko': '- 격국: {value}',
        'en': '- Structure: {value}',
        'ja': '- 格局: {value}',
        'zh-CN': '- 格局: {value}',
        'zh-TW': '- 格局: {value}',
    },
    'useful_god_item': {
        'ko': '- 용신: {value}',
        'en': '- Useful God: {value}',
        'ja': '- 用神: {value}',
        'zh-CN': '- 用神: {value}',
        'zh-TW': '- 用神: {value}',
    },

    # 단계별 분석 요청
    'step_request_header': {
        'ko': '\n## {label} 요청',
        'en': '\n## {label} Request',
        'ja': '\n## {label}リクエスト',
        'zh-CN': '\n## {label}请求',
        'zh-TW': '\n## {label}請求',
    },
    'step_request_instruction': {
        'ko': '위 사주를 분석하여 {label} 결과를 JSON 스키마에 맞게 응답해주세요.',
        'en': 'Please analyze the above chart and respond with {label} results according to the JSON schema.',
        'ja': '上記の命式を分析し、{label}結果をJSONスキーマに従って回答してください。',
        'zh-CN': '请分析以上命盘，并按JSON格式回答{label}结果。',
        'zh-TW': '請分析以上命盤，並按JSON格式回答{label}結果。',
    },
}

# 단계별 라벨
STEP_LABELS = {
    'basic': {
        'ko': '기본 분석',
        'en': 'Basic Analysis',
        'ja': '基本分析',
        'zh-CN': '基本分析',
        'zh-TW': '基本分析',
    },
    'personality': {
        'ko': '성격 분석',
        'en': 'Personality Analysis',
        'ja': '性格分析',
        'zh-CN': '性格分析',
        'zh-TW': '性格分析',
    },
    'aptitude': {
        'ko': '적성 분석',
        'en': 'Aptitude Analysis',
        'ja': '適性分析',
        'zh-CN': '适性分析',
        'zh-TW': '適性分析',
    },
    'fortune': {
        'ko': '재물/연애 분석',
        'en': 'Wealth & Love Analysis',
        'ja': '財運・恋愛分析',
        'zh-CN': '财运/恋爱分析',
        'zh-TW': '財運/戀愛分析',
    },
}


# ============================================
# 한국어 조사 처리
# ============================================

# 받침 있는 글자 확인용 (유니코드 한글 범위)
def has_batchim(char: str) -> bool:
    """한글 문자의 받침 유무 확인"""
    if not char:
        return False
    code = ord(char[-1])
    # 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
    if 0xAC00 <= code <= 0xD7A3:
        # (code - 0xAC00) % 28 이 0이면 받침 없음
        return (code - 0xAC00) % 28 != 0
    return False


def apply_korean_particles(text: str, particle_type: str = 'topic') -> str:
    """
    한국어 조사 자동 적용

    Args:
        text: 조사를 붙일 단어
        particle_type: 조사 유형
            - 'topic': 은/는 (주제)
            - 'subject': 이/가 (주격)
            - 'object': 을/를 (목적격)
            - 'with': 과/와 (공동)

    Returns:
        조사가 붙은 문자열
    """
    if not text:
        return text

    has_final = has_batchim(text[-1])

    particles = {
        'topic': ('은', '는'),      # 받침 있으면 '은', 없으면 '는'
        'subject': ('이', '가'),
        'object': ('을', '를'),
        'with': ('과', '와'),
    }

    if particle_type not in particles:
        return text

    with_batchim, without_batchim = particles[particle_type]
    particle = with_batchim if has_final else without_batchim

    return f"{text}{particle}"


# ============================================
# 메인 함수
# ============================================

def get_locale_string(
    key: str,
    language: str,
    warn_on_missing: bool = True,
    **kwargs
) -> str:
    """
    로케일 문자열 가져오기

    Args:
        key: 문자열 키 (예: 'focus_area_header')
        language: 언어 코드 (ko, en, ja, zh-CN, zh-TW)
        warn_on_missing: 누락 시 경고 로그 출력 여부
        **kwargs: 포맷팅에 사용할 변수들

    Returns:
        포맷팅된 문자열

    Example:
        get_locale_string('focus_area_header', 'ko', label='재물운')
        # "## 집중 분석 영역: 재물운"
    """
    # 레거시 'zh' → 'zh-CN' 변환
    if language == 'zh':
        language = 'zh-CN'

    # 키 조회
    strings = LOCALE_STRINGS.get(key)
    if strings is None:
        if warn_on_missing:
            logger.warning(f"[LocaleStrings] Missing key: {key}")
        return f"[MISSING: {key}]"

    # 언어 조회 (없으면 영어 폴백)
    template = strings.get(language)
    if template is None:
        template = strings.get('en', f"[MISSING: {key}.{language}]")
        if warn_on_missing and language not in ('ko', 'en', 'ja', 'zh-CN', 'zh-TW'):
            logger.warning(f"[LocaleStrings] Unsupported language: {language}, falling back to 'en'")

    # 포맷팅
    try:
        return template.format(**kwargs)
    except KeyError as e:
        logger.error(f"[LocaleStrings] Missing format key {e} for {key}")
        return template


def get_step_label(step: str, language: str) -> str:
    """단계 라벨 가져오기"""
    if language == 'zh':
        language = 'zh-CN'
    return STEP_LABELS.get(step, {}).get(language, STEP_LABELS.get(step, {}).get('ko', step))


# ============================================
# 편의 함수들
# ============================================

def format_pillars_table(
    hour: dict,
    day: dict,
    month: dict,
    year: dict,
    language: str
) -> str:
    """사주 팔자 테이블 포맷팅"""
    lines = [
        get_locale_string('pillars_header', language),
        get_locale_string('pillars_table_header', language),
        get_locale_string('pillars_table_separator', language),
        f"| {hour.get('stem', '?')} | **{day.get('stem', '?')}** ★ | {month.get('stem', '?')} | {year.get('stem', '?')} |",
        f"| {hour.get('branch', '?')} | {day.get('branch', '?')} | {month.get('branch', '?')} | {year.get('branch', '?')} |",
        get_locale_string('day_master_label', language,
            stem=day.get('stem', '?'),
            element=day.get('stemElement', day.get('element', '?'))
        ),
    ]
    return "\n".join(lines)


def format_daewun_list(daewun: list, language: str, limit: int = 8) -> str:
    """대운 목록 포맷팅"""
    lines = [get_locale_string('daewun_header', language)]
    for d in daewun[:limit]:
        start = d.get('startAge', d.get('age', '?'))
        end = start + 9 if isinstance(start, int) else '?'
        lines.append(get_locale_string('daewun_item', language,
            start=start,
            end=end,
            stem=d.get('stem', '?'),
            branch=d.get('branch', '?')
        ))
    return "\n".join(lines)


def format_jijanggan(jijanggan: dict, language: str) -> str:
    """지장간 포맷팅"""
    lines = [
        get_locale_string('jijanggan_header', language),
        get_locale_string('jijanggan_year', language, stems=', '.join(jijanggan.get('year', []))),
        get_locale_string('jijanggan_month', language, stems=', '.join(jijanggan.get('month', []))),
        get_locale_string('jijanggan_day', language, stems=', '.join(jijanggan.get('day', []))),
        get_locale_string('jijanggan_hour', language, stems=', '.join(jijanggan.get('hour', []))),
    ]
    return "\n".join(lines)
