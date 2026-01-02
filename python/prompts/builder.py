"""
프롬프트 빌더
모든 프롬프트 조각을 조합하여 최종 프롬프트 생성
"""
from typing import Literal, Optional, Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime

from .master_prompt import MasterPrompt
from .classics.ziping import ZipingPrompt
from .classics.qiongtong import QiongtongPrompt
from .western.destiny_code import DestinyCodePrompt
from .yearly_prompt import YearlyPrompt
from .locales import get_locale
from .schemas import (
    OUTPUT_JSON_SCHEMA,
    get_output_schema_description,
    YEARLY_OUTPUT_JSON_SCHEMA,
    get_yearly_output_schema_description
)


LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


@dataclass
class PromptBuildOptions:
    """프롬프트 빌드 옵션"""
    include_ziping: bool = True       # 자평진전 포함
    include_qiongtong: bool = True    # 궁통보감 포함
    include_western: bool = True      # 서구권 프레임워크 (모든 언어에 적용)


@dataclass
class PromptBuildRequest:
    """프롬프트 빌드 요청"""
    language: LocaleType = 'ko'
    pillars: Optional[Dict[str, Any]] = None   # 사주 팔자
    daewun: Optional[List[Dict[str, Any]]] = None  # 대운
    focus_area: Optional[str] = None           # 집중 영역
    question: Optional[str] = None             # 사용자 질문
    options: PromptBuildOptions = field(default_factory=PromptBuildOptions)


@dataclass
class PromptBuildResponse:
    """프롬프트 빌드 응답"""
    system_prompt: str      # 시스템 프롬프트 (역할 + 원칙 + 고전)
    user_prompt: str        # 사용자 프롬프트 (사주 정보 + 질문)
    output_schema: Dict     # JSON 출력 스키마
    metadata: Dict          # 사용된 프롬프트 버전 등


# ============================================
# Task 20: 신년 분석용 요청/응답
# ============================================

@dataclass
class YearlyPromptBuildRequest:
    """신년 분석 프롬프트 빌드 요청"""
    year: int                                        # 분석 대상 연도
    language: LocaleType = 'ko'
    pillars: Optional[Dict[str, Any]] = None         # 사주 팔자
    daewun: Optional[List[Dict[str, Any]]] = None    # 대운
    options: PromptBuildOptions = field(default_factory=PromptBuildOptions)


class PromptBuilder:
    """프롬프트 빌더 클래스"""

    VERSION = "1.0.0"

    # 집중 영역 라벨 (언어별)
    FOCUS_AREA_LABELS = {
        'ko': {
            'wealth': '재물운',
            'love': '연애운',
            'career': '직장운',
            'health': '건강운',
            'overall': '종합운',
        },
        'en': {
            'wealth': 'Wealth & Finance',
            'love': 'Love & Relationships',
            'career': 'Career & Success',
            'health': 'Health & Wellness',
            'overall': 'Comprehensive Analysis',
        },
        'ja': {
            'wealth': '金運',
            'love': '恋愛運',
            'career': '仕事運',
            'health': '健康運',
            'overall': '総合運',
        },
        'zh-CN': {
            'wealth': '财运',
            'love': '感情运',
            'career': '事业运',
            'health': '健康运',
            'overall': '综合运势',
        },
        'zh-TW': {
            'wealth': '財運',
            'love': '感情運',
            'career': '事業運',
            'health': '健康運',
            'overall': '綜合運勢',
        },
    }

    @classmethod
    def _normalize_language(cls, language: str) -> str:
        """
        언어 코드 정규화 (레거시 호환)

        Args:
            language: 언어 코드 (ko, en, ja, zh, zh-CN, zh-TW)

        Returns:
            정규화된 언어 코드 (ko, en, ja, zh-CN, zh-TW)
        """
        # 레거시 'zh' → 'zh-CN' 변환
        if language == 'zh':
            return 'zh-CN'
        return language

    @classmethod
    def build(cls, request: PromptBuildRequest) -> PromptBuildResponse:
        """
        최종 프롬프트 빌드

        조합 순서:
        1. 마스터 프롬프트 (페르소나 + 원칙)
        2. 자평진전 (용신/격국/십신)
        3. 궁통보감 (조후론) - 계절/월령 기반
        4. 서구권 프레임워크 (모든 언어에 적용)
        5. 로케일별 스타일 가이드
        6. 출력 스키마
        """
        language = request.language
        options = request.options

        # 시스템 프롬프트 빌드
        system_prompt = cls._build_system_prompt(
            language=language,
            include_ziping=options.include_ziping,
            include_qiongtong=options.include_qiongtong,
            include_western=options.include_western
        )

        # 사용자 프롬프트 빌드
        user_prompt = cls._build_user_prompt(
            pillars=request.pillars,
            daewun=request.daewun,
            focus_area=request.focus_area,
            question=request.question,
            language=language
        )

        # 포함된 모듈 목록
        included_modules = ["master"]
        if options.include_ziping:
            included_modules.append("ziping")
        if options.include_qiongtong:
            included_modules.append("qiongtong")
        if options.include_western:
            included_modules.append("western")

        return PromptBuildResponse(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=OUTPUT_JSON_SCHEMA,
            metadata={
                "version": cls.VERSION,
                "language": language,
                "included_modules": included_modules,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
        )

    @classmethod
    def _build_system_prompt(
        cls,
        language: LocaleType,
        include_ziping: bool,
        include_qiongtong: bool,
        include_western: bool
    ) -> str:
        """시스템 프롬프트 조합"""
        parts = []

        # 1. 마스터 프롬프트 (페르소나 + 원칙 + 응답 규칙)
        parts.append(MasterPrompt.build(language))

        # 언어 정규화 (레거시 호환)
        normalized_lang = cls._normalize_language(language)

        # 2. 자평진전 (용신/격국/십신/합충) - 다국어 지원
        if include_ziping:
            parts.append("\n\n---\n")
            parts.append(ZipingPrompt.build(normalized_lang))

        # 3. 궁통보감 (조후론) - 다국어 지원
        if include_qiongtong:
            parts.append("\n\n---\n")
            parts.append(QiongtongPrompt.build(normalized_lang))

        # 4. 서구권 프레임워크 (모든 언어에 적용)
        if include_western:
            parts.append("\n\n---\n")
            parts.append(DestinyCodePrompt.build(language))

        # 5. 로케일별 스타일 가이드
        locale = get_locale(language)
        parts.append("\n\n---\n")
        parts.append(locale.build())

        # 6. 출력 스키마 설명
        parts.append("\n\n---\n")
        parts.append(get_output_schema_description(language))

        return "".join(parts)

    @classmethod
    def _build_user_prompt(
        cls,
        pillars: Optional[Dict[str, Any]],
        daewun: Optional[List[Dict[str, Any]]],
        focus_area: Optional[str],
        question: Optional[str],
        language: LocaleType
    ) -> str:
        """사용자 프롬프트 (사주 정보 + 질문)"""
        parts = []
        current_year = datetime.now().year

        # 사주 팔자 정보
        if pillars:
            parts.append(cls._format_pillars(pillars, language))

        # 대운 정보
        if daewun:
            parts.append(cls._format_daewun(daewun, language))

        # 집중 영역
        if focus_area:
            # 레거시 'zh' 호환
            lang_key = 'zh-CN' if language == 'zh' else language
            focus_label = cls.FOCUS_AREA_LABELS.get(lang_key, cls.FOCUS_AREA_LABELS['ko']).get(focus_area, focus_area)
            if language == 'ko':
                parts.append(f"\n## 집중 분석 영역: {focus_label}")
                parts.append("이 영역을 특히 상세하게 분석해주세요.")
            elif language == 'en':
                parts.append(f"\n## Focus Area: {focus_label}")
                parts.append("Please provide detailed analysis on this area.")
            elif language == 'ja':
                parts.append(f"\n## 重点分析領域：{focus_label}")
                parts.append("この領域を特に詳しく分析してください。")
            elif language in ('zh', 'zh-CN'):
                parts.append(f"\n## 重点分析领域：{focus_label}")
                parts.append("请对该领域进行详细分析。")
            elif language == 'zh-TW':
                parts.append(f"\n## 重點分析領域：{focus_label}")
                parts.append("請對該領域進行詳細分析。")

        # 사용자 질문
        if question:
            if language == 'ko':
                parts.append(f"\n## 사용자 질문\n{question}")
                parts.append("이 질문에 대한 답변을 분석에 포함해주세요.")
            elif language == 'en':
                parts.append(f"\n## User Question\n{question}")
                parts.append("Please include the answer to this question in your analysis.")
            elif language == 'ja':
                parts.append(f"\n## ご質問\n{question}")
                parts.append("この質問への回答を分析に含めてください。")
            elif language in ('zh', 'zh-CN'):
                parts.append(f"\n## 用户提问\n{question}")
                parts.append("请在分析中回答此问题。")
            elif language == 'zh-TW':
                parts.append(f"\n## 用戶提問\n{question}")
                parts.append("請在分析中回答此問題。")

        # 분석 요청
        if language == 'ko':
            parts.append(f"\n## 분석 요청")
            parts.append("위 사주를 분석하여 지정된 JSON 스키마에 맞게 응답해주세요.")
            parts.append(f"yearly_flow는 {current_year}년부터 5년간의 운세를 포함해주세요.")
        elif language == 'en':
            parts.append(f"\n## Analysis Request")
            parts.append("Please analyze the above chart and respond according to the specified JSON schema.")
            parts.append(f"Include yearly_flow for 5 years starting from {current_year}.")
        elif language == 'ja':
            parts.append(f"\n## 分析リクエスト")
            parts.append("上記の命式を分析し、指定されたJSONスキーマに従って回答してください。")
            parts.append(f"yearly_flowには{current_year}年から5年間の運勢を含めてください。")
        elif language in ('zh', 'zh-CN'):
            parts.append(f"\n## 分析请求")
            parts.append("请分析以上命盘，并按指定的JSON格式回答。")
            parts.append(f"yearly_flow请包含从{current_year}年起5年的运势。")
        elif language == 'zh-TW':
            parts.append(f"\n## 分析請求")
            parts.append("請分析以上命盤，並按指定的JSON格式回答。")
            parts.append(f"yearly_flow請包含從{current_year}年起5年的運勢。")

        return "\n".join(parts)

    @classmethod
    def _format_pillars(cls, pillars: Dict[str, Any], language: LocaleType) -> str:
        """사주 팔자 포맷팅"""
        year = pillars.get('year', {})
        month = pillars.get('month', {})
        day = pillars.get('day', {})
        hour = pillars.get('hour', {})

        if language == 'ko':
            lines = [
                "## 사주 팔자 (四柱八字)\n",
                "| 시주(時柱) | 일주(日柱) | 월주(月柱) | 연주(年柱) |",
                "|:----------:|:----------:|:----------:|:----------:|",
                f"| {hour.get('stem', '?')} | **{day.get('stem', '?')}** ★ | {month.get('stem', '?')} | {year.get('stem', '?')} |",
                f"| {hour.get('branch', '?')} | {day.get('branch', '?')} | {month.get('branch', '?')} | {year.get('branch', '?')} |",
                f"\n★ 일간(日干): **{day.get('stem', '?')}** ({day.get('stemElement', day.get('element', '?'))}) - 나 자신",
            ]
        elif language == 'en':
            lines = [
                "## Four Pillars Chart (BaZi)\n",
                "| Hour | Day | Month | Year |",
                "|:----:|:---:|:-----:|:----:|",
                f"| {hour.get('stem', '?')} | **{day.get('stem', '?')}** ★ | {month.get('stem', '?')} | {year.get('stem', '?')} |",
                f"| {hour.get('branch', '?')} | {day.get('branch', '?')} | {month.get('branch', '?')} | {year.get('branch', '?')} |",
                f"\n★ Day Master: **{day.get('stem', '?')}** ({day.get('stemElement', day.get('element', '?'))}) - represents YOU",
            ]
        elif language == 'ja':
            lines = [
                "## 四柱八字\n",
                "| 時柱 | 日柱 | 月柱 | 年柱 |",
                "|:----:|:----:|:----:|:----:|",
                f"| {hour.get('stem', '?')} | **{day.get('stem', '?')}** ★ | {month.get('stem', '?')} | {year.get('stem', '?')} |",
                f"| {hour.get('branch', '?')} | {day.get('branch', '?')} | {month.get('branch', '?')} | {year.get('branch', '?')} |",
                f"\n★ 日干：**{day.get('stem', '?')}** ({day.get('stemElement', day.get('element', '?'))}) - 命主本人",
            ]
        elif language in ('zh', 'zh-CN'):
            lines = [
                "## 四柱八字\n",
                "| 时柱 | 日柱 | 月柱 | 年柱 |",
                "|:----:|:----:|:----:|:----:|",
                f"| {hour.get('stem', '?')} | **{day.get('stem', '?')}** ★ | {month.get('stem', '?')} | {year.get('stem', '?')} |",
                f"| {hour.get('branch', '?')} | {day.get('branch', '?')} | {month.get('branch', '?')} | {year.get('branch', '?')} |",
                f"\n★ 日干：**{day.get('stem', '?')}** ({day.get('stemElement', day.get('element', '?'))}) - 命主本人",
            ]
        elif language == 'zh-TW':
            lines = [
                "## 四柱八字\n",
                "| 時柱 | 日柱 | 月柱 | 年柱 |",
                "|:----:|:----:|:----:|:----:|",
                f"| {hour.get('stem', '?')} | **{day.get('stem', '?')}** ★ | {month.get('stem', '?')} | {year.get('stem', '?')} |",
                f"| {hour.get('branch', '?')} | {day.get('branch', '?')} | {month.get('branch', '?')} | {year.get('branch', '?')} |",
                f"\n★ 日干：**{day.get('stem', '?')}** ({day.get('stemElement', day.get('element', '?'))}) - 命主本人",
            ]
        else:
            lines = []

        return "\n".join(lines)

    @classmethod
    def _format_daewun(cls, daewun: List[Dict[str, Any]], language: LocaleType) -> str:
        """대운 포맷팅"""
        if not daewun:
            return ""

        if language == 'ko':
            lines = ["\n## 대운 흐름 (大運)"]
            for d in daewun[:8]:  # 최대 8개
                start = d.get('startAge', d.get('age', '?'))
                end = start + 9 if isinstance(start, int) else '?'
                lines.append(f"- {start}~{end}세: {d.get('stem', '?')}{d.get('branch', '?')}")
        elif language == 'en':
            lines = ["\n## Luck Pillars (大運)"]
            for d in daewun[:8]:
                start = d.get('startAge', d.get('age', '?'))
                end = start + 9 if isinstance(start, int) else '?'
                lines.append(f"- Age {start}-{end}: {d.get('stem', '?')}{d.get('branch', '?')}")
        elif language == 'ja':
            lines = ["\n## 大運の流れ"]
            for d in daewun[:8]:
                start = d.get('startAge', d.get('age', '?'))
                end = start + 9 if isinstance(start, int) else '?'
                lines.append(f"- {start}〜{end}歳: {d.get('stem', '?')}{d.get('branch', '?')}")
        elif language in ('zh', 'zh-CN'):
            lines = ["\n## 大运流程"]
            for d in daewun[:8]:
                start = d.get('startAge', d.get('age', '?'))
                end = start + 9 if isinstance(start, int) else '?'
                lines.append(f"- {start}-{end}岁: {d.get('stem', '?')}{d.get('branch', '?')}")
        elif language == 'zh-TW':
            lines = ["\n## 大運流程"]
            for d in daewun[:8]:
                start = d.get('startAge', d.get('age', '?'))
                end = start + 9 if isinstance(start, int) else '?'
                lines.append(f"- {start}-{end}歲: {d.get('stem', '?')}{d.get('branch', '?')}")
        else:
            lines = []

        return "\n".join(lines)

    # ============================================
    # Task 20: 신년 분석 프롬프트 빌드
    # ============================================

    @classmethod
    def build_yearly(cls, request: YearlyPromptBuildRequest) -> PromptBuildResponse:
        """
        신년 분석 프롬프트 빌드

        조합 순서:
        1. 마스터 프롬프트 (페르소나 + 원칙)
        2. 자평진전 (용신/격국/십신)
        3. 궁통보감 (조후론) - 계절/월령 기반
        4. 서구권 프레임워크 (모든 언어에 적용)
        5. 신년 분석 전용 프롬프트
        6. 로케일별 스타일 가이드
        7. 신년 분석 출력 스키마
        """
        language = request.language
        year = request.year
        options = request.options

        # 시스템 프롬프트 빌드
        system_prompt = cls._build_yearly_system_prompt(
            language=language,
            year=year,
            include_ziping=options.include_ziping,
            include_qiongtong=options.include_qiongtong,
            include_western=options.include_western
        )

        # 사용자 프롬프트 빌드
        user_prompt = cls._build_yearly_user_prompt(
            pillars=request.pillars,
            daewun=request.daewun,
            year=year,
            language=language
        )

        # 포함된 모듈 목록
        included_modules = ["master", "yearly"]
        if options.include_ziping:
            included_modules.append("ziping")
        if options.include_qiongtong:
            included_modules.append("qiongtong")
        if options.include_western:
            included_modules.append("western")

        return PromptBuildResponse(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=YEARLY_OUTPUT_JSON_SCHEMA,
            metadata={
                "version": cls.VERSION,
                "type": "yearly",
                "year": year,
                "language": language,
                "included_modules": included_modules,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
        )

    @classmethod
    def _build_yearly_system_prompt(
        cls,
        language: LocaleType,
        year: int,
        include_ziping: bool,
        include_qiongtong: bool,
        include_western: bool
    ) -> str:
        """신년 분석 시스템 프롬프트 조합"""
        parts = []

        # 1. 마스터 프롬프트 (페르소나 + 원칙 + 응답 규칙)
        parts.append(MasterPrompt.build(language))

        # 언어 정규화 (레거시 호환)
        normalized_lang = cls._normalize_language(language)

        # 2. 자평진전 (용신/격국/십신/합충)
        if include_ziping:
            parts.append("\n\n---\n")
            parts.append(ZipingPrompt.build(normalized_lang))

        # 3. 궁통보감 (조후론)
        if include_qiongtong:
            parts.append("\n\n---\n")
            parts.append(QiongtongPrompt.build(normalized_lang))

        # 4. 서구권 프레임워크
        if include_western:
            parts.append("\n\n---\n")
            parts.append(DestinyCodePrompt.build(language))

        # 5. 신년 분석 전용 프롬프트
        parts.append("\n\n---\n")
        parts.append(YearlyPrompt.build(language, year))

        # 6. 로케일별 스타일 가이드
        locale = get_locale(language)
        parts.append("\n\n---\n")
        parts.append(locale.build())

        # 7. 신년 분석 출력 스키마 설명
        parts.append("\n\n---\n")
        parts.append(get_yearly_output_schema_description(language, year))

        return "".join(parts)

    @classmethod
    def _build_yearly_user_prompt(
        cls,
        pillars: Optional[Dict[str, Any]],
        daewun: Optional[List[Dict[str, Any]]],
        year: int,
        language: LocaleType
    ) -> str:
        """신년 분석 사용자 프롬프트"""
        parts = []

        # 사주 팔자 정보
        if pillars:
            parts.append(cls._format_pillars(pillars, language))

        # 대운 정보
        if daewun:
            parts.append(cls._format_daewun(daewun, language))

        # 신년 분석 요청
        if language == 'ko':
            parts.append(f"\n## {year}년 신년 분석 요청")
            parts.append(f"위 사주를 바탕으로 {year}년 전체 운세를 분석해주세요.")
            parts.append("12개월 각각의 상세 분석과 길흉일을 포함해주세요.")
            parts.append("지정된 JSON 스키마에 맞게 응답해주세요.")
        elif language == 'en':
            parts.append(f"\n## {year} Yearly Analysis Request")
            parts.append(f"Based on the above chart, please analyze the fortune for the entire year of {year}.")
            parts.append("Include detailed analysis for each of the 12 months with lucky and unlucky days.")
            parts.append("Please respond according to the specified JSON schema.")
        elif language == 'ja':
            parts.append(f"\n## {year}年 年間分析リクエスト")
            parts.append(f"上記の命式を基に、{year}年の運勢を詳細に分析してください。")
            parts.append("12ヶ月それぞれの詳細分析と吉凶日を含めてください。")
            parts.append("指定されたJSONスキーマに従って回答してください。")
        elif language in ('zh', 'zh-CN'):
            parts.append(f"\n## {year}年 年度分析请求")
            parts.append(f"请根据以上命盘，详细分析{year}年的整体运势。")
            parts.append("请包含12个月各自的详细分析和吉凶日。")
            parts.append("请按指定的JSON格式回答。")
        elif language == 'zh-TW':
            parts.append(f"\n## {year}年 年度分析請求")
            parts.append(f"請根據以上命盤，詳細分析{year}年的整體運勢。")
            parts.append("請包含12個月各自的詳細分析和吉凶日。")
            parts.append("請按指定的JSON格式回答。")

        return "\n".join(parts)
