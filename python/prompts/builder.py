"""
프롬프트 빌더
모든 프롬프트 조각을 조합하여 최종 프롬프트 생성

v2.1: locale_strings 모듈로 다국어 문자열 중앙집중화
"""
from typing import Literal, Optional, Dict, List, Any, TypedDict
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
# Task 8: 멀티스텝용 압축 요약 모듈
from .classics_summary import (
    get_ziping_summary,
    get_qiongtong_summary,
    get_ten_gods_guide,
    DAY_MASTER_TRAITS,  # Task 2.2: 일간별 특성
)
# Task 2.1: 조후 매트릭스
from .classics.qiongtong_matrix import (
    JohuEntry,
    get_johu_entry,
    build_johu_prompt,
)
# v2.1: 로케일 문자열 중앙집중화
from .locale_strings import (
    get_locale_string,
    get_step_label,
    format_pillars_table,
    format_daewun_list,
    format_jijanggan,
    # v3.0: 분석 컨텍스트 포맷팅
    format_ten_gods_context,
    format_interactions_context,
    format_sinsal_context,
    format_formation_context,
    format_daewun_with_relation,
)
# Task 5: 점수 계산 및 물상론 통합
from .mulsangron import generate_event_prediction_template


LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']


# ============================================
# 단계별 JSON 스키마 예시 (영문 키 강제)
# 모든 언어에서 동일한 영문 키 사용
# ============================================

STEP_JSON_SCHEMA_EXAMPLES = {
    'basic': '''
```json
{
  "dayMaster": {
    "stem": "癸",
    "element": "水",
    "yinYang": "陰",
    "characteristics": ["..."]
  },
  "structure": {
    "type": "正官格",
    "quality": "上",
    "description": "..."
  },
  "usefulGod": {
    "primary": "火",
    "secondary": "木",
    "harmful": "金",
    "reasoning": "..."
  },
  "summary": "..."
}
```''',
    'personality': '''
```json
{
  "willpower": {
    "score": 75,
    "description": "..."
  },
  "outerPersonality": "...",
  "innerPersonality": "...",
  "socialStyle": {
    "type": "...",
    "strengths": ["...", "...", "..."],
    "weaknesses": ["...", "...", "..."]
  }
}
```''',
    'aptitude': '''
```json
{
  "keywords": ["...", "...", "..."],
  "talents": ["...", "...", "..."],
  "recommendedFields": ["...", "...", "..."],
  "avoidFields": ["...", "..."]
}
```''',
    'fortune': '''
```json
{
  "wealth": {
    "pattern": "...",
    "strengths": ["...", "...", "..."],
    "risks": ["...", "...", "..."],
    "advice": "..."
  },
  "love": {
    "style": "...",
    "idealPartner": ["...", "...", "..."],
    "compatibilityPoints": ["...", "..."],
    "warnings": ["...", "...", "..."]
  }
}
```'''
}

# 언어별 JSON 키 사용 안내 메시지
JSON_KEY_NOTICE = {
    'ko': '\n\n**중요**: 응답은 반드시 아래 JSON 형식으로 작성하세요. JSON 키는 반드시 영문을 사용하고, 값(내용)만 한국어로 작성하세요.',
    'en': '\n\n**Important**: Respond in the JSON format below. Use English keys exactly as shown.',
    'ja': '\n\n**重要**: 以下のJSON形式で回答してください。JSONキーは必ず英語を使用し、値（内容）のみ日本語で記述してください。',
    'zh-CN': '\n\n**重要**: 请按以下JSON格式回答。JSON键必须使用英文，仅值（内容）用中文书写。',
    'zh-TW': '\n\n**重要**: 請按以下JSON格式回答。JSON鍵必須使用英文，僅值（內容）用中文書寫。'
}


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
    # Task 5: 점수 컨텍스트 (선택사항)
    score_context: Optional[str] = None              # format_score_context() 결과
    event_prediction_context: Optional[str] = None   # generate_event_prediction_template() 결과


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
        """사용자 프롬프트 (사주 정보 + 질문) - v2.1 리팩토링"""
        parts = []
        current_year = datetime.now().year

        # 사주 팔자 정보
        if pillars:
            parts.append(cls._format_pillars(pillars, language))

        # 대운 정보
        if daewun:
            parts.append(cls._format_daewun(daewun, language))

        # 집중 영역 (locale_strings 사용)
        if focus_area:
            lang_key = 'zh-CN' if language == 'zh' else language
            focus_label = cls.FOCUS_AREA_LABELS.get(lang_key, cls.FOCUS_AREA_LABELS['ko']).get(focus_area, focus_area)
            parts.append(get_locale_string('focus_area_header', language, label=focus_label))
            parts.append(get_locale_string('focus_area_instruction', language))

        # 사용자 질문 (locale_strings 사용)
        if question:
            parts.append(get_locale_string('user_question_header', language, question=question))
            parts.append(get_locale_string('user_question_instruction', language))

        # 분석 요청 (locale_strings 사용)
        parts.append(get_locale_string('analysis_request_header', language))
        parts.append(get_locale_string('analysis_request_instruction', language))
        parts.append(get_locale_string('yearly_flow_instruction', language, year=current_year))

        return "\n".join(parts)

    @classmethod
    def _format_pillars(cls, pillars: Dict[str, Any], language: LocaleType) -> str:
        """사주 팔자 포맷팅 - v2.1 리팩토링 (locale_strings 사용)"""
        return format_pillars_table(
            hour=pillars.get('hour', {}),
            day=pillars.get('day', {}),
            month=pillars.get('month', {}),
            year=pillars.get('year', {}),
            language=language
        )

    @classmethod
    def _format_daewun(cls, daewun: List[Dict[str, Any]], language: LocaleType) -> str:
        """대운 포맷팅 - v2.1 리팩토링 (locale_strings 사용)"""
        if not daewun:
            return ""
        return format_daewun_list(daewun, language, limit=8)

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

        # 사용자 프롬프트 빌드 (Task 5: 점수 컨텍스트 포함)
        user_prompt = cls._build_yearly_user_prompt(
            pillars=request.pillars,
            daewun=request.daewun,
            year=year,
            language=language,
            score_context=request.score_context,
            event_prediction_context=request.event_prediction_context
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
        language: LocaleType,
        # Task 5: 점수 컨텍스트
        score_context: Optional[str] = None,
        event_prediction_context: Optional[str] = None
    ) -> str:
        """신년 분석 사용자 프롬프트 - v2.1 리팩토링 (locale_strings 사용)"""
        parts = []

        # 사주 팔자 정보
        if pillars:
            parts.append(cls._format_pillars(pillars, language))

        # 대운 정보
        if daewun:
            parts.append(cls._format_daewun(daewun, language))

        # Task 5: 점수 컨텍스트 삽입
        if score_context:
            parts.append("\n---\n")
            parts.append(score_context)

        # Task 5: 사건 예측 컨텍스트 삽입
        if event_prediction_context:
            parts.append("\n---\n")
            parts.append(event_prediction_context)

        # 신년 분석 요청 (locale_strings 사용)
        parts.append(get_locale_string('yearly_analysis_header', language, year=year))
        parts.append(get_locale_string('yearly_analysis_instruction1', language, year=year))
        parts.append(get_locale_string('yearly_analysis_instruction2', language))
        parts.append(get_locale_string('yearly_analysis_instruction3', language))

        return "\n".join(parts)

    # ============================================
    # Task 6: 멀티스텝 파이프라인용 단계별 프롬프트
    # ============================================

    @classmethod
    def build_step(
        cls,
        step: Literal['basic', 'personality', 'aptitude', 'fortune'],
        pillars: Dict[str, Any],
        language: LocaleType = 'ko',
        daewun: Optional[List[Dict[str, Any]]] = None,
        jijanggan: Optional[Dict[str, List[str]]] = None,
        previous_results: Optional[Dict[str, Any]] = None,
        # v3.0: 분석 컨텍스트 추가
        ten_god_counts: Optional[Dict[str, float]] = None,
        interactions: Optional[List[Dict[str, Any]]] = None,
        sinsals: Optional[List[Dict[str, Any]]] = None,
        formation: Optional[Dict[str, Any]] = None,
        current_age: Optional[int] = None,
    ) -> PromptBuildResponse:
        """
        멀티스텝 파이프라인용 단계별 프롬프트 빌드

        Args:
            step: 분석 단계 ('basic', 'personality', 'aptitude', 'fortune')
            pillars: 사주 팔자 데이터
            language: 언어 코드
            daewun: 대운 데이터 (선택)
            jijanggan: 지장간 데이터 (선택)
            previous_results: 이전 단계 결과 (컨텍스트용)
            ten_god_counts: v3.0 십신 분포 (extract_ten_gods 결과)
            interactions: v3.0 지지 상호작용 (analyze_pillar_interactions 결과)
            sinsals: v3.0 신살 (analyze_sinsal 결과)
            formation: v3.0 격국 (determine_formation 결과 → dict)
            current_age: v3.0 현재 나이 (대운 하이라이트용)

        Returns:
            PromptBuildResponse: 단계별 프롬프트
        """
        # 시스템 프롬프트 빌드
        system_prompt = cls._build_step_system_prompt(step, language)

        # 사용자 프롬프트 빌드
        user_prompt = cls._build_step_user_prompt(
            step=step,
            pillars=pillars,
            daewun=daewun,
            jijanggan=jijanggan,
            previous_results=previous_results,
            language=language,
            # v3.0
            ten_god_counts=ten_god_counts,
            interactions=interactions,
            sinsals=sinsals,
            formation=formation,
            current_age=current_age,
        )

        # 단계별 출력 스키마
        output_schema = cls._get_step_output_schema(step)

        return PromptBuildResponse(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=output_schema,
            metadata={
                "version": cls.VERSION,
                "type": "step",
                "step": step,
                "language": language,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
        )

    @classmethod
    def _build_step_system_prompt(
        cls,
        step: Literal['basic', 'personality', 'aptitude', 'fortune'],
        language: LocaleType
    ) -> str:
        """
        단계별 시스템 프롬프트

        Task 8: classics_summary 압축 버전 사용
        - 기존: ZipingPrompt.build() + QiongtongPrompt.build() (70KB+)
        - 변경: get_ziping_summary() + get_qiongtong_summary() (약 5KB)
        """
        parts = []

        # 마스터 프롬프트 (공통)
        parts.append(MasterPrompt.build(language))

        # 언어 정규화
        normalized_lang = cls._normalize_language(language)

        # 단계별 고전 참조 (Task 8: 압축 버전 사용)
        if step == 'basic':
            # 기본 분석: 자평진전 핵심 (용신 5원칙 + 8격) + 궁통보감 핵심 (조후론)
            parts.append("\n\n---\n")
            parts.append(get_ziping_summary(normalized_lang))
            parts.append("\n\n---\n")
            parts.append(get_qiongtong_summary(normalized_lang))
        elif step == 'personality':
            # 성격 분석: 십신 해석 가이드
            parts.append("\n\n---\n")
            parts.append(get_ten_gods_guide(normalized_lang))
        elif step == 'aptitude':
            # 적성 분석: 자평진전 핵심 (격국/십신 기반)
            parts.append("\n\n---\n")
            parts.append(get_ziping_summary(normalized_lang))
        elif step == 'fortune':
            # 재물/연애 분석: 자평진전 + 궁통보감 핵심
            parts.append("\n\n---\n")
            parts.append(get_ziping_summary(normalized_lang))
            parts.append("\n\n---\n")
            parts.append(get_qiongtong_summary(normalized_lang))

        # 단계별 전문 지시
        parts.append("\n\n---\n")
        parts.append(cls._get_step_instructions(step, language))

        return "".join(parts)

    @classmethod
    def _get_step_instructions(
        cls,
        step: Literal['basic', 'personality', 'aptitude', 'fortune'],
        language: LocaleType
    ) -> str:
        """단계별 전문 지시사항"""
        instructions = {
            'basic': {
                'ko': """## 기본 분석 전문가 역할

당신은 사주명리학의 기본 분석 전문가입니다.
다음 항목들을 정확하게 분석해주세요:

### 1. 일간(日干) 분석
- 일간의 오행과 음양
- 일간의 기본 특성
- 일간의 강약 판단 (신강/신약)

### 2. 격국(格局) 분석
- 격국의 종류 판별 (정관격, 편관격, 정인격 등)
- 격국의 품질 (상/중/하)
- 격국의 특징 설명

### 3. 용신(用神) 분석
- 용신 (가장 필요한 오행)
- 희신 (도움이 되는 오행)
- 기신 (해로운 오행)
- 용신 선정 이유

응답은 반드시 JSON 스키마에 맞게 작성하세요.""",
                'en': """## Basic Analysis Expert Role

You are a BaZi basic analysis expert.
Please analyze the following items accurately:

### 1. Day Master Analysis
- Five elements and Yin/Yang of Day Master
- Basic characteristics
- Strength determination (strong/weak)

### 2. Structure (格局) Analysis
- Structure type (Direct Officer, Indirect Officer, Direct Resource, etc.)
- Structure quality (high/medium/low)
- Structure characteristics

### 3. Useful God (用神) Analysis
- Useful God (most needed element)
- Helpful God (supportive element)
- Harmful God (detrimental element)
- Reasoning for selection

Please respond according to the JSON schema."""
            },
            'personality': {
                'ko': """## 성격 분석 전문가 역할

당신은 30년 경력의 사주 기반 성격 분석 전문가입니다.
이전 기본 분석 결과와 위의 십신(十神) 해석 가이드를 참고하여 다음을 분석해주세요.

### 분석 원칙
- 비견/겁재(比劫)가 많으면 의지력과 독립심이 강함
- 식상(食傷)이 많으면 표현력과 창의성이 뛰어남
- 재성(財星)이 많으면 현실감각과 사교성이 좋음
- 관성(官星)이 많으면 책임감과 규율을 중시
- 인성(印星)이 많으면 학습능력과 보호본능이 강함

### 1. 의지력 분석 (비견/겁재 기반)
- 의지력 점수 (0-100): 비견/겁재 개수와 강도에 따라 산정
- 의지력 특성: 구체적 상황별 발현 방식
- 근거: 어떤 십신이 의지력에 영향을 주는지 명시

### 2. 겉성격 (시주 + 일간 조합)
- 첫인상: 타인에게 보이는 모습
- 사회적 페르소나: 직장, 모임에서의 행동 패턴
- 시주의 십신이 어떻게 영향을 미치는지 설명

### 3. 속성격 (월주 + 일간 조합)
- 진정한 내면: 혼자 있을 때의 모습
- 감정 처리 방식: 스트레스, 기쁨을 다루는 방법
- 월주의 십신이 어떻게 영향을 미치는지 설명

### 4. 대인관계 스타일 (식상/재성/관성 비중)
- 관계 유형: 주도형/협조형/관망형
- 강점: 대인관계에서의 장점 3가지
- 약점: 주의해야 할 패턴 3가지

응답은 반드시 JSON 스키마에 맞게 작성하세요.""",

                'en': """## Personality Analysis Expert Role

You are a BaZi-based personality analysis expert with 30 years of experience.
Based on the previous basic analysis and the Ten Gods (十神) interpretation guide above, please analyze:

### Analysis Principles
- Strong Companion/Rob Wealth (比劫): High willpower and independence
- Strong Eating/Hurting (食傷): Strong expression and creativity
- Strong Wealth Stars (財星): Good practical sense and social skills
- Strong Officer Stars (官星): Values responsibility and discipline
- Strong Resource Stars (印星): Strong learning ability and protective instincts

### 1. Willpower Analysis (Based on Companion/Rob Wealth)
- Willpower score (0-100): Calculated based on count and strength of 比劫
- Willpower characteristics: How it manifests in specific situations
- Basis: Which Ten Gods influence willpower

### 2. Outer Personality (Hour Pillar + Day Master)
- First impression: How others perceive you
- Social persona: Behavior patterns at work and social gatherings
- Explain how Hour Pillar's Ten Gods influence this

### 3. Inner Personality (Month Pillar + Day Master)
- True inner self: How you are when alone
- Emotional processing: How you handle stress and joy
- Explain how Month Pillar's Ten Gods influence this

### 4. Social Style (Based on Eating/Wealth/Officer ratio)
- Relationship type: Leader/Cooperator/Observer
- Strengths: 3 advantages in relationships
- Weaknesses: 3 patterns to be aware of

Please respond according to the JSON schema.""",

                'ja': """## 性格分析専門家の役割

あなたは30年の経験を持つ四柱推命に基づく性格分析の専門家です。
前の基本分析結果と上記の十神解釈ガイドを参考に、以下を分析してください。

### 分析原則
- 比劫が多い：意志力と独立心が強い
- 食傷が多い：表現力と創造性に優れる
- 財星が多い：現実感覚と社交性が良い
- 官星が多い：責任感と規律を重視
- 印星が多い：学習能力と保護本能が強い

### 1. 意志力分析（比劫基準）
- 意志力スコア (0-100)：比劫の数と強度で算定
- 意志力の特徴：具体的な状況別の発現方法
- 根拠：どの十神が意志力に影響するか明示

### 2. 外面の性格（時柱 + 日干の組み合わせ）
- 第一印象：他人に見せる姿
- 社会的ペルソナ：職場や集まりでの行動パターン
- 時柱の十神がどう影響するか説明

### 3. 内面の性格（月柱 + 日干の組み合わせ）
- 真の内面：一人でいる時の姿
- 感情処理方法：ストレスや喜びの扱い方
- 月柱の十神がどう影響するか説明

### 4. 対人関係スタイル（食傷/財星/官星の比重）
- 関係タイプ：主導型/協調型/傍観型
- 強み：対人関係での長所3つ
- 弱み：注意すべきパターン3つ

必ずJSONスキーマに従って回答してください。""",

                'zh-CN': """## 性格分析专家角色

您是拥有30年经验的基于八字的性格分析专家。
请参考之前的基本分析结果和上述十神解读指南，分析以下内容：

### 分析原则
- 比劫多：意志力和独立心强
- 食伤多：表达力和创造力出色
- 财星多：现实感和社交能力好
- 官星多：重视责任感和纪律
- 印星多：学习能力和保护本能强

### 1. 意志力分析（基于比劫）
- 意志力分数 (0-100)：根据比劫的数量和强度计算
- 意志力特征：具体情境下的表现方式
- 依据：明确哪些十神影响意志力

### 2. 外在性格（时柱 + 日干组合）
- 第一印象：他人眼中的形象
- 社会人格：职场和社交场合的行为模式
- 说明时柱的十神如何产生影响

### 3. 内在性格（月柱 + 日干组合）
- 真实内心：独处时的样子
- 情绪处理方式：如何应对压力和喜悦
- 说明月柱的十神如何产生影响

### 4. 人际关系风格（食伤/财星/官星比重）
- 关系类型：主导型/协作型/旁观型
- 优势：人际关系中的3个长处
- 劣势：需要注意的3个模式

请务必按照JSON格式回答。""",

                'zh-TW': """## 性格分析專家角色

您是擁有30年經驗的基於八字的性格分析專家。
請參考之前的基本分析結果和上述十神解讀指南，分析以下內容：

### 分析原則
- 比劫多：意志力和獨立心強
- 食傷多：表達力和創造力出色
- 財星多：現實感和社交能力好
- 官星多：重視責任感和紀律
- 印星多：學習能力和保護本能強

### 1. 意志力分析（基於比劫）
- 意志力分數 (0-100)：根據比劫的數量和強度計算
- 意志力特徵：具體情境下的表現方式
- 依據：明確哪些十神影響意志力

### 2. 外在性格（時柱 + 日干組合）
- 第一印象：他人眼中的形象
- 社會人格：職場和社交場合的行為模式
- 說明時柱的十神如何產生影響

### 3. 內在性格（月柱 + 日干組合）
- 真實內心：獨處時的樣子
- 情緒處理方式：如何應對壓力和喜悅
- 說明月柱的十神如何產生影響

### 4. 人際關係風格（食傷/財星/官星比重）
- 關係類型：主導型/協作型/旁觀型
- 優勢：人際關係中的3個長處
- 劣勢：需要注意的3個模式

請務必按照JSON格式回答。"""
            },
            'aptitude': {
                'ko': """## 적성 분석 전문가 역할

당신은 30년 경력의 사주 기반 적성 및 재능 분석 전문가입니다.
이전 분석 결과들과 위의 자평진전 핵심 원리를 참고하여 다음을 분석해주세요.

### 분석 원칙
- 식신/상관(食傷)이 강하면: 창의력, 예술, 표현 분야 적성
- 정재/편재(財星)가 강하면: 사업, 금융, 영업 분야 적성
- 정관/편관(官星)이 강하면: 공직, 관리, 법률 분야 적성
- 정인/편인(印星)이 강하면: 학문, 연구, 교육 분야 적성
- 비견/겁재(比劫)가 강하면: 독립사업, 경쟁 분야 적성

### 1. 핵심 키워드 (3-5개)
- 이 사람을 한 마디로 표현하는 단어들
- 일간 특성 + 격국 + 용신을 종합하여 도출

### 2. 타고난 재능
- 재능명, 수준(0-100), 상세 설명 포함
- 최소 3가지 이상 분석
- 어떤 십신/오행이 이 재능의 근거인지 명시

### 3. 추천 분야
- 분야명, 적합도(0-100), 추천 이유 포함
- 구체적인 직업/업종 예시 제시
- 최소 5가지 이상 분석

### 4. 피해야 할 분야
- 기신(忌神) 오행과 관련된 분야
- 피해야 하는 구체적 이유 명시

### 5. 재능 활용 상태
- 현재 발휘 수준 (0-100)
- 잠재력 (0-100)
- 개발을 위한 조언

응답은 반드시 JSON 스키마에 맞게 작성하세요.""",

                'en': """## Aptitude Analysis Expert Role

You are a BaZi-based aptitude and talent analysis expert with 30 years of experience.
Based on the previous analyses and the Ziping core principles above, please analyze:

### Analysis Principles
- Strong Eating/Hurting (食傷): Aptitude for creativity, arts, expression
- Strong Wealth Stars (財星): Aptitude for business, finance, sales
- Strong Officer Stars (官星): Aptitude for government, management, law
- Strong Resource Stars (印星): Aptitude for academics, research, education
- Strong Companion/Rob (比劫): Aptitude for independent business, competition

### 1. Core Keywords (3-5)
- Words that summarize this person
- Derived from Day Master + Structure + Useful God

### 2. Natural Talents
- Include: talent name, level (0-100), detailed description
- Analyze at least 3 talents
- Specify which Ten Gods/Elements are the basis

### 3. Recommended Fields
- Include: field name, suitability (0-100), reason
- Provide specific job/industry examples
- Analyze at least 5 fields

### 4. Fields to Avoid
- Fields related to Harmful God (忌神) elements
- Specify reasons to avoid

### 5. Talent Utilization Status
- Current utilization level (0-100)
- Potential (0-100)
- Advice for development

Please respond according to the JSON schema.""",

                'ja': """## 適性分析専門家の役割

あなたは30年の経験を持つ四柱推命に基づく適性・才能分析の専門家です。
前の分析結果と上記の子平核心原理を参考に、以下を分析してください。

### 分析原則
- 食傷が強い：創造力、芸術、表現分野に適性
- 財星が強い：ビジネス、金融、営業分野に適性
- 官星が強い：公務員、管理、法律分野に適性
- 印星が強い：学問、研究、教育分野に適性
- 比劫が強い：独立事業、競争分野に適性

### 1. コアキーワード（3-5個）
- この人を一言で表す言葉
- 日干特性 + 格局 + 用神を総合して導出

### 2. 生まれ持った才能
- 才能名、レベル（0-100）、詳細説明を含む
- 最低3つ以上分析
- どの十神/五行が根拠か明示

### 3. 推奨分野
- 分野名、適合度（0-100）、推奨理由を含む
- 具体的な職業/業種例を提示
- 最低5つ以上分析

### 4. 避けるべき分野
- 忌神五行に関連する分野
- 避けるべき具体的理由を明示

### 5. 才能活用状況
- 現在の発揮レベル（0-100）
- 潜在力（0-100）
- 開発のためのアドバイス

必ずJSONスキーマに従って回答してください。""",

                'zh-CN': """## 适性分析专家角色

您是拥有30年经验的基于八字的适性与才能分析专家。
请参考之前的分析结果和上述子平核心原理，分析以下内容：

### 分析原则
- 食伤强：创意、艺术、表达领域适性
- 财星强：商业、金融、销售领域适性
- 官星强：公务员、管理、法律领域适性
- 印星强：学术、研究、教育领域适性
- 比劫强：独立创业、竞争领域适性

### 1. 核心关键词（3-5个）
- 一句话概括这个人的词语
- 综合日干特性 + 格局 + 用神得出

### 2. 天赋才能
- 包含：才能名称、水平（0-100）、详细说明
- 至少分析3项才能
- 明确哪些十神/五行是依据

### 3. 推荐领域
- 包含：领域名称、适合度（0-100）、推荐理由
- 提供具体职业/行业示例
- 至少分析5个领域

### 4. 应避免的领域
- 与忌神五行相关的领域
- 明确说明应避免的理由

### 5. 才能发挥状态
- 当前发挥水平（0-100）
- 潜力（0-100）
- 发展建议

请务必按照JSON格式回答。""",

                'zh-TW': """## 適性分析專家角色

您是擁有30年經驗的基於八字的適性與才能分析專家。
請參考之前的分析結果和上述子平核心原理，分析以下內容：

### 分析原則
- 食傷強：創意、藝術、表達領域適性
- 財星強：商業、金融、銷售領域適性
- 官星強：公務員、管理、法律領域適性
- 印星強：學術、研究、教育領域適性
- 比劫強：獨立創業、競爭領域適性

### 1. 核心關鍵詞（3-5個）
- 一句話概括這個人的詞語
- 綜合日干特性 + 格局 + 用神得出

### 2. 天賦才能
- 包含：才能名稱、水平（0-100）、詳細說明
- 至少分析3項才能
- 明確哪些十神/五行是依據

### 3. 推薦領域
- 包含：領域名稱、適合度（0-100）、推薦理由
- 提供具體職業/行業示例
- 至少分析5個領域

### 4. 應避免的領域
- 與忌神五行相關的領域
- 明確說明應避免的理由

### 5. 才能發揮狀態
- 當前發揮水平（0-100）
- 潛力（0-100）
- 發展建議

請務必按照JSON格式回答。"""
            },
            'fortune': {
                'ko': """## 재물/연애 분석 전문가 역할

당신은 30년 경력의 사주 기반 재물운과 연애운 분석 전문가입니다.
위의 자평진전과 궁통보감 핵심 원리를 참고하여 다음을 분석해주세요.

### 재성(財星) 해석 기준
- 정재(正財): 안정적 수입, 저축, 근면, 계획적 재테크
- 편재(偏財): 투기적 수입, 사교력, 융통성, 기회 포착

### 관성/식상 해석 기준 (연애)
- 남성: 정재=아내, 편재=연인
- 여성: 정관=남편, 편관=연인
- 식상: 표현력, 매력, 자녀운

### 1. 재물운 분석
- 패턴 유형: 축재형/소비형/투자형/안정형 중 선택
- 패턴 상세 설명
- 재물운 강점 3가지 (구체적 상황 포함)
- 재물운 리스크 3가지 (주의 상황 포함)
- 재물 점수 (0-100)
- 구체적이고 실천 가능한 조언

### 2. 연애운 분석
- 스타일 유형: 적극형/수동형/감성형/이성형 중 선택
- 연애 스타일 상세 설명
- 이상형 특성 (외모, 성격, 직업 등)
- 결혼관 (결혼에 대한 태도, 적합한 결혼 시기)
- 궁합 점수 (0-100)
- 주의사항 3가지 (피해야 할 패턴)
- 연애 조언

**중요**: 부정적 내용은 완곡하게 표현하세요. '이혼' 대신 '결혼 생활의 도전', '파산' 대신 '재정적 어려움'으로 순화.

응답은 반드시 JSON 스키마에 맞게 작성하세요.""",

                'en': """## Wealth & Love Analysis Expert Role

You are a BaZi-based wealth and love analysis expert with 30 years of experience.
Based on the Ziping and Qiongtong principles above, please analyze:

### Wealth Stars (財星) Interpretation
- Direct Wealth (正財): Stable income, savings, diligence, planned investment
- Indirect Wealth (偏財): Speculative income, social skills, flexibility, opportunity seizing

### Officer/Output Stars Interpretation (Love)
- For men: Direct Wealth=wife, Indirect Wealth=lover
- For women: Direct Officer=husband, Indirect Officer=lover
- Output Stars: Expression, charm, children fortune

### 1. Wealth Analysis
- Pattern type: Saver/Spender/Investor/Stable
- Detailed pattern description
- 3 wealth strengths (with specific situations)
- 3 wealth risks (with caution situations)
- Wealth score (0-100)
- Specific, actionable advice

### 2. Love Analysis
- Style type: Active/Passive/Emotional/Rational
- Detailed love style description
- Ideal partner traits (appearance, personality, occupation)
- Marriage view (attitude toward marriage, suitable timing)
- Compatibility score (0-100)
- 3 warnings (patterns to avoid)
- Love advice

**Important**: Express negative content gently. Use 'marriage challenges' instead of 'divorce', 'financial difficulties' instead of 'bankruptcy'.

Please respond according to the JSON schema.""",

                'ja': """## 財運・恋愛運分析専門家の役割

あなたは30年の経験を持つ四柱推命に基づく財運・恋愛運分析の専門家です。
上記の子平と窮通の核心原理を参考に、以下を分析してください。

### 財星の解釈基準
- 正財：安定収入、貯蓄、勤勉、計画的投資
- 偏財：投機的収入、社交力、融通性、機会把握

### 官星/食傷の解釈基準（恋愛）
- 男性：正財=妻、偏財=恋人
- 女性：正官=夫、偏官=恋人
- 食傷：表現力、魅力、子供運

### 1. 財運分析
- パターンタイプ：貯蓄型/消費型/投資型/安定型から選択
- パターンの詳細説明
- 財運の強み3つ（具体的状況を含む）
- 財運のリスク3つ（注意状況を含む）
- 財運スコア（0-100）
- 具体的で実行可能なアドバイス

### 2. 恋愛運分析
- スタイルタイプ：積極型/受動型/感情型/理性型から選択
- 恋愛スタイルの詳細説明
- 理想の相手の特徴（外見、性格、職業など）
- 結婚観（結婚への態度、適切な時期）
- 相性スコア（0-100）
- 注意事項3つ（避けるべきパターン）
- 恋愛アドバイス

**重要**：ネガティブな内容は婉曲に表現してください。「離婚」→「結婚生活の課題」、「破産」→「財政的困難」。

必ずJSONスキーマに従って回答してください。""",

                'zh-CN': """## 财运/恋爱运分析专家角色

您是拥有30年经验的基于八字的财运与恋爱运分析专家。
请参考上述子平和穷通的核心原理，分析以下内容：

### 财星解读标准
- 正财：稳定收入、储蓄、勤勉、计划性投资
- 偏财：投机性收入、社交能力、灵活性、把握机会

### 官星/食伤解读标准（恋爱）
- 男性：正财=妻子、偏财=恋人
- 女性：正官=丈夫、偏官=恋人
- 食伤：表达力、魅力、子女运

### 1. 财运分析
- 模式类型：储蓄型/消费型/投资型/稳定型 选择
- 模式详细说明
- 财运优势3条（含具体情境）
- 财运风险3条（含注意情境）
- 财运分数（0-100）
- 具体可行的建议

### 2. 恋爱运分析
- 风格类型：主动型/被动型/感性型/理性型 选择
- 恋爱风格详细说明
- 理想对象特征（外貌、性格、职业等）
- 婚姻观（对婚姻的态度、合适时机）
- 缘分分数（0-100）
- 注意事项3条（应避免的模式）
- 恋爱建议

**重要**：负面内容请委婉表达。用"婚姻挑战"替代"离婚"，用"财务困难"替代"破产"。

请务必按照JSON格式回答。""",

                'zh-TW': """## 財運/戀愛運分析專家角色

您是擁有30年經驗的基於八字的財運與戀愛運分析專家。
請參考上述子平和窮通的核心原理，分析以下內容：

### 財星解讀標準
- 正財：穩定收入、儲蓄、勤勉、計劃性投資
- 偏財：投機性收入、社交能力、靈活性、把握機會

### 官星/食傷解讀標準（戀愛）
- 男性：正財=妻子、偏財=戀人
- 女性：正官=丈夫、偏官=戀人
- 食傷：表達力、魅力、子女運

### 1. 財運分析
- 模式類型：儲蓄型/消費型/投資型/穩定型 選擇
- 模式詳細說明
- 財運優勢3條（含具體情境）
- 財運風險3條（含注意情境）
- 財運分數（0-100）
- 具體可行的建議

### 2. 戀愛運分析
- 風格類型：主動型/被動型/感性型/理性型 選擇
- 戀愛風格詳細說明
- 理想對象特徵（外貌、性格、職業等）
- 婚姻觀（對婚姻的態度、合適時機）
- 緣分分數（0-100）
- 注意事項3條（應避免的模式）
- 戀愛建議

**重要**：負面內容請委婉表達。用「婚姻挑戰」替代「離婚」，用「財務困難」替代「破產」。

請務必按照JSON格式回答。"""
            }
        }

        # 5개 언어 지원 - 지원되는 언어면 해당 언어, 아니면 ko로 폴백
        supported_langs = ('ko', 'en', 'ja', 'zh-CN', 'zh-TW')
        lang = language if language in supported_langs else 'ko'

        # 기본 지시사항
        base_instruction = instructions.get(step, {}).get(lang, instructions.get(step, {}).get('ko', ''))

        # JSON 스키마 예시 추가 (영문 키 강제)
        json_notice = JSON_KEY_NOTICE.get(lang, JSON_KEY_NOTICE['ko'])
        json_example = STEP_JSON_SCHEMA_EXAMPLES.get(step, '')

        return base_instruction + json_notice + json_example

    @classmethod
    def _build_step_user_prompt(
        cls,
        step: Literal['basic', 'personality', 'aptitude', 'fortune'],
        pillars: Dict[str, Any],
        daewun: Optional[List[Dict[str, Any]]],
        jijanggan: Optional[Dict[str, List[str]]],
        previous_results: Optional[Dict[str, Any]],
        language: LocaleType,
        # v3.0: 분석 컨텍스트 추가
        ten_god_counts: Optional[Dict[str, float]] = None,
        interactions: Optional[List[Dict[str, Any]]] = None,
        sinsals: Optional[List[Dict[str, Any]]] = None,
        formation: Optional[Dict[str, Any]] = None,
        current_age: Optional[int] = None,
    ) -> str:
        """
        단계별 사용자 프롬프트 - v3.0 분석 컨텍스트 통합

        v3.0 업데이트:
        - personality/aptitude/fortune 단계에서 십신/상호작용/신살/격국 컨텍스트 삽입
        - 대운에 십신 관계 표시 + 현재/다음 대운 하이라이트
        """
        parts = []

        # 사주 정보
        parts.append(cls._format_pillars(pillars, language))

        # v3.0: 대운 정보 (십신 관계 포함, 성격/적성/재물 단계에서)
        if daewun:
            if step in ('personality', 'aptitude', 'fortune') and current_age is not None:
                day_master = pillars.get('day', {}).get('stem', '?')
                parts.append(format_daewun_with_relation(
                    daewun, day_master, current_age, language
                ))
            else:
                parts.append(cls._format_daewun(daewun, language))

        # 지장간 정보 (있으면)
        if jijanggan:
            parts.append(cls._format_jijanggan(jijanggan, language))

        # v3.0: 분석 컨텍스트 삽입 (성격/적성/재물 단계)
        if step in ('personality', 'aptitude', 'fortune'):
            # 격국 정보
            if formation:
                parts.append(format_formation_context(formation, language))

            # 십신 분포
            if ten_god_counts:
                parts.append(format_ten_gods_context(ten_god_counts, language))

            # 지지 상호작용
            if interactions:
                parts.append(format_interactions_context(interactions, language))

            # 신살
            if sinsals:
                parts.append(format_sinsal_context(sinsals, language))

        # 이전 단계 결과 (컨텍스트)
        if previous_results:
            parts.append(cls._format_previous_results(previous_results, step, language))

        # 분석 요청 (locale_strings 사용)
        label = get_step_label(step, language)
        parts.append(get_locale_string('step_request_header', language, label=label))
        parts.append(get_locale_string('step_request_instruction', language, label=label))

        return "\n".join(parts)

    @classmethod
    def _format_jijanggan(cls, jijanggan: Dict[str, List[str]], language: LocaleType) -> str:
        """지장간 포맷팅 - v2.1 리팩토링 (locale_strings 사용)"""
        return format_jijanggan(jijanggan, language)

    @classmethod
    def _format_previous_results(
        cls,
        previous_results: Dict[str, Any],
        current_step: str,
        language: LocaleType
    ) -> str:
        """이전 단계 결과 포맷팅 - v2.1 리팩토링 (locale_strings 사용)"""
        parts = []

        parts.append(get_locale_string('previous_results_header', language))

        # 기본 분석 결과
        if 'basicAnalysis' in previous_results:
            basic = previous_results['basicAnalysis']
            parts.append(get_locale_string('basic_analysis_header', language))
            parts.append(get_locale_string('day_master_item', language,
                value=basic.get('dayMaster', {}).get('stem', '?')))
            parts.append(get_locale_string('structure_item', language,
                value=basic.get('structure', {}).get('type', '?')))
            parts.append(get_locale_string('useful_god_item', language,
                value=basic.get('usefulGod', {}).get('primary', '?')))

        return "\n".join(parts)

    @classmethod
    def _get_step_output_schema(cls, step: Literal['basic', 'personality', 'aptitude', 'fortune']) -> Dict:
        """단계별 출력 스키마"""
        schemas = {
            'basic': {
                "type": "object",
                "properties": {
                    "dayMaster": {
                        "type": "object",
                        "properties": {
                            "stem": {"type": "string"},
                            "element": {"type": "string"},
                            "yinYang": {"type": "string"},
                            "characteristics": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["stem", "element", "yinYang", "characteristics"]
                    },
                    "structure": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "quality": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "required": ["type", "quality", "description"]
                    },
                    "usefulGod": {
                        "type": "object",
                        "properties": {
                            "primary": {"type": "string"},
                            "secondary": {"type": "string"},
                            "harmful": {"type": "string"},
                            "reasoning": {"type": "string"}
                        },
                        "required": ["primary", "secondary", "harmful", "reasoning"]
                    },
                    "summary": {"type": "string"}
                },
                "required": ["dayMaster", "structure", "usefulGod", "summary"]
            },
            'personality': {
                "type": "object",
                "properties": {
                    "willpower": {
                        "type": "object",
                        "properties": {
                            "score": {"type": "number", "minimum": 0, "maximum": 100},
                            "description": {"type": "string"}
                        },
                        "required": ["score", "description"]
                    },
                    "outerPersonality": {"type": "string"},
                    "innerPersonality": {"type": "string"},
                    "socialStyle": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "strengths": {"type": "array", "items": {"type": "string"}},
                            "weaknesses": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["type", "strengths", "weaknesses"]
                    }
                },
                "required": ["willpower", "outerPersonality", "innerPersonality", "socialStyle"]
            },
            'aptitude': {
                "type": "object",
                "properties": {
                    "keywords": {"type": "array", "items": {"type": "string"}},
                    "talents": {"type": "array", "items": {"type": "string"}},
                    "recommendedFields": {"type": "array", "items": {"type": "string"}},
                    "avoidFields": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["keywords", "talents", "recommendedFields", "avoidFields"]
            },
            'fortune': {
                "type": "object",
                "properties": {
                    "wealth": {
                        "type": "object",
                        "properties": {
                            "pattern": {"type": "string"},
                            "strengths": {"type": "array", "items": {"type": "string"}},
                            "risks": {"type": "array", "items": {"type": "string"}},
                            "advice": {"type": "string"}
                        },
                        "required": ["pattern", "strengths", "risks", "advice"]
                    },
                    "love": {
                        "type": "object",
                        "properties": {
                            "style": {"type": "string"},
                            "idealPartner": {"type": "array", "items": {"type": "string"}},
                            "compatibilityPoints": {"type": "array", "items": {"type": "string"}},
                            "warnings": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["style", "idealPartner", "compatibilityPoints", "warnings"]
                    }
                },
                "required": ["wealth", "love"]
            }
        }
        return schemas.get(step, {})


# =============================================================================
# Task 2: 프롬프트 최적화
# =============================================================================

# =============================================================================
# Task 2.1: 동적 고전 선택 시스템
# =============================================================================

# 2.1.1: 분석 유형별 필요 고전 매핑 테이블
STEP_CLASSIC_MAP: Dict[str, List[str]] = {
    'basic': ['ziping_core', 'qiongtong_johu'],      # 격국/용신 + 조후론
    'personality': ['ten_gods_guide'],               # 십신 해석 가이드
    'aptitude': ['ziping_core'],                     # 격국/십신 기반 적성
    'fortune': ['ziping_core', 'qiongtong_johu']     # 재물/연애 = 용신 + 조후
}


# 2.1.3: 일간별 조후 필터링 함수
def build_filtered_johu_prompt(
    johu_entry: JohuEntry,
    language: str
) -> str:
    """
    일간+월령에 해당하는 조후 정보만 추출하여 프롬프트 생성
    (전체 120개 조합 대신 1개만)

    Args:
        johu_entry: JohuEntry 객체
        language: 언어 코드

    Returns:
        필터링된 조후 프롬프트 문자열
    """
    return build_johu_prompt(johu_entry, language)


# 2.1.2: 동적 시스템 프롬프트 빌드 함수
def build_system_prompt_v3(
    step: Literal['basic', 'personality', 'aptitude', 'fortune'],
    language: str,
    day_master: str,
    month_branch: str
) -> str:
    """
    단계별 동적 고전 선택 시스템 프롬프트 빌드

    Args:
        step: 분석 단계
        language: 언어 코드 (ko, en, ja, zh-CN, zh-TW)
        day_master: 일간 (甲~癸)
        month_branch: 월지 (寅~丑)

    Returns:
        최적화된 시스템 프롬프트
    """
    parts = []

    # 1. 마스터 프롬프트 (공통)
    parts.append(MasterPrompt.build(language))

    # 언어 정규화
    normalized_lang = language if language != 'zh' else 'zh-CN'

    # 2. 단계별 필요 고전만 선택
    required_classics = STEP_CLASSIC_MAP.get(step, [])

    for classic in required_classics:
        if classic == 'ziping_core':
            parts.append("\n\n---\n")
            parts.append(get_ziping_summary(normalized_lang))
        elif classic == 'qiongtong_johu':
            # 일간별 조후 필터링 (해당 월령만)
            johu_entry = get_johu_entry(day_master, month_branch)
            if johu_entry:
                parts.append("\n\n---\n")
                parts.append(build_filtered_johu_prompt(johu_entry, normalized_lang))
            else:
                # 조후 정보가 없으면 일반 요약 사용
                parts.append("\n\n---\n")
                parts.append(get_qiongtong_summary(normalized_lang))
        elif classic == 'ten_gods_guide':
            parts.append("\n\n---\n")
            parts.append(get_ten_gods_guide(normalized_lang))

    # 3. 단계별 전문 지시
    parts.append("\n\n---\n")
    parts.append(PromptBuilder._get_step_instructions(step, language))

    return "".join(parts)


# =============================================================================
# Task 2.2: 사주 정보 구조화
# =============================================================================

# 2.2.1: JSON 기반 사주 데이터 포맷 정의
class DayMasterInfo(TypedDict):
    """일간 정보"""
    stem: str           # 甲~癸
    element: str        # 木火土金水
    strength: Literal["strong", "weak", "balanced"]
    symbol: str         # 일간 상징 (예: "큰 나무", "용광로")


class TenGodInfo(TypedDict):
    """십신 정보"""
    god: str            # 십신 (比肩, 正官 등)
    meaning: str        # 의미 (예: "특수재능", "책임감")
    strength: float     # 강도 (0.0 ~ 1.0)


class StructuredPillarsData(TypedDict):
    """구조화된 사주 데이터"""
    day_master: DayMasterInfo
    ten_gods: Dict[str, TenGodInfo]  # month, hour 기준
    formation: Optional[str]          # 격국 후보
    useful_god: Optional[str]         # 용신 후보


# 2.2.2: 일간 심볼 다국어 매핑
DAY_MASTER_SYMBOLS: Dict[str, Dict[str, str]] = {
    '甲': {'ko': '큰 나무', 'en': 'Large Tree', 'ja': '大きな木', 'zh-CN': '大树', 'zh-TW': '大樹'},
    '乙': {'ko': '꽃과 덩굴', 'en': 'Flower and Vine', 'ja': '花と蔓', 'zh-CN': '花草', 'zh-TW': '花草'},
    '丙': {'ko': '태양', 'en': 'The Sun', 'ja': '太陽', 'zh-CN': '太阳', 'zh-TW': '太陽'},
    '丁': {'ko': '촛불', 'en': 'Candlelight', 'ja': '蝋燭', 'zh-CN': '蜡烛', 'zh-TW': '蠟燭'},
    '戊': {'ko': '큰 산', 'en': 'Mountain', 'ja': '大山', 'zh-CN': '大山', 'zh-TW': '大山'},
    '己': {'ko': '농토', 'en': 'Farmland', 'ja': '田畑', 'zh-CN': '田地', 'zh-TW': '田地'},
    '庚': {'ko': '쇠칼', 'en': 'Sword', 'ja': '剣', 'zh-CN': '钢刀', 'zh-TW': '鋼刀'},
    '辛': {'ko': '보석', 'en': 'Jewel', 'ja': '宝石', 'zh-CN': '宝石', 'zh-TW': '寶石'},
    '壬': {'ko': '큰 바다', 'en': 'Ocean', 'ja': '大海', 'zh-CN': '大海', 'zh-TW': '大海'},
    '癸': {'ko': '이슬비', 'en': 'Dew', 'ja': '露', 'zh-CN': '露水', 'zh-TW': '露水'}
}

# 십신 의미 다국어 매핑
TEN_GOD_MEANINGS: Dict[str, Dict[str, str]] = {
    '比肩': {'ko': '자립심, 경쟁심', 'en': 'Independence, Competition', 'ja': '自立心、競争心', 'zh-CN': '自立心、竞争心', 'zh-TW': '自立心、競爭心'},
    '劫財': {'ko': '추진력, 결단력', 'en': 'Drive, Decisiveness', 'ja': '推進力、決断力', 'zh-CN': '推动力、决断力', 'zh-TW': '推動力、決斷力'},
    '食神': {'ko': '창의력, 여유', 'en': 'Creativity, Ease', 'ja': '創造力、余裕', 'zh-CN': '创造力、从容', 'zh-TW': '創造力、從容'},
    '傷官': {'ko': '표현력, 재능', 'en': 'Expression, Talent', 'ja': '表現力、才能', 'zh-CN': '表达力、才华', 'zh-TW': '表達力、才華'},
    '正財': {'ko': '안정, 근면', 'en': 'Stability, Diligence', 'ja': '安定、勤勉', 'zh-CN': '稳定、勤勉', 'zh-TW': '穩定、勤勉'},
    '偏財': {'ko': '사업수완, 융통성', 'en': 'Business Acumen, Flexibility', 'ja': '商才、融通性', 'zh-CN': '商才、灵活性', 'zh-TW': '商才、靈活性'},
    '正官': {'ko': '책임감, 명예', 'en': 'Responsibility, Honor', 'ja': '責任感、名誉', 'zh-CN': '责任感、名誉', 'zh-TW': '責任感、名譽'},
    '偏官': {'ko': '권위, 결단', 'en': 'Authority, Decision', 'ja': '権威、決断', 'zh-CN': '权威、决断', 'zh-TW': '權威、決斷'},
    '正印': {'ko': '학문, 보호', 'en': 'Learning, Protection', 'ja': '学問、保護', 'zh-CN': '学问、保护', 'zh-TW': '學問、保護'},
    '偏印': {'ko': '특수재능, 독창성', 'en': 'Special Talent, Originality', 'ja': '特殊才能、独創性', 'zh-CN': '特殊才能、独创性', 'zh-TW': '特殊才能、獨創性'},
}

# 오행 매핑
STEM_TO_ELEMENT: Dict[str, str] = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
}


def structure_pillars_data(
    pillars: Dict[str, Any],
    ten_god_counts: Dict[str, float],
    formation: Optional[Dict[str, Any]],
    language: str
) -> StructuredPillarsData:
    """
    사주 원시 데이터를 구조화된 JSON 형태로 변환

    Args:
        pillars: 기존 사주 데이터
        ten_god_counts: 십신 분포
        formation: 격국 정보 (Task 3.2)
        language: 언어 코드

    Returns:
        StructuredPillarsData
    """
    # 언어 정규화
    lang = language if language != 'zh' else 'zh-CN'

    # 일간 정보 추출
    day_stem = pillars.get('day', {}).get('stem', '?')
    element = STEM_TO_ELEMENT.get(day_stem, '?')

    # 일간 강약 판단 (십신 분포 기반)
    supporting = ten_god_counts.get('比肩', 0) + ten_god_counts.get('劫財', 0) + \
                 ten_god_counts.get('正印', 0) + ten_god_counts.get('偏印', 0)
    draining = ten_god_counts.get('食神', 0) + ten_god_counts.get('傷官', 0) + \
               ten_god_counts.get('正財', 0) + ten_god_counts.get('偏財', 0) + \
               ten_god_counts.get('正官', 0) + ten_god_counts.get('偏官', 0)

    if supporting > draining + 1.5:
        strength = "strong"
    elif draining > supporting + 1.5:
        strength = "weak"
    else:
        strength = "balanced"

    # 일간 심볼
    symbol = DAY_MASTER_SYMBOLS.get(day_stem, {}).get(lang, day_stem)

    day_master_info: DayMasterInfo = {
        'stem': day_stem,
        'element': element,
        'strength': strength,
        'symbol': symbol
    }

    # 십신 정보 (월간/시간 기준)
    ten_gods_info: Dict[str, TenGodInfo] = {}

    # 가장 강한 십신들 추출
    sorted_gods = sorted(ten_god_counts.items(), key=lambda x: x[1], reverse=True)
    for i, (god, count) in enumerate(sorted_gods[:3]):  # 상위 3개
        meaning = TEN_GOD_MEANINGS.get(god, {}).get(lang, god)
        ten_gods_info[f"top_{i+1}"] = {
            'god': god,
            'meaning': meaning,
            'strength': min(count / 3.0, 1.0)  # 정규화
        }

    # 격국 정보
    formation_type = None
    useful_god = None
    if formation:
        formation_type = formation.get('formation_type')
        # 용신은 별도 로직 필요 (여기선 기본값)

    return {
        'day_master': day_master_info,
        'ten_gods': ten_gods_info,
        'formation': formation_type,
        'useful_god': useful_god
    }


# 2.2.3: 격국 후보 자동 추출 로직
def extract_formation_candidates(
    pillars: Dict[str, Any],
    ten_god_counts: Dict[str, float]
) -> List[str]:
    """
    십신 분포 기반 격국 후보 추출

    Args:
        pillars: 사주 데이터
        ten_god_counts: 십신 분포

    Returns:
        격국 후보 리스트 (예: ['정관격', '편인격'])
    """
    candidates = []

    # 십신별 격국 매핑
    god_to_formation = {
        '正官': '정관격',
        '偏官': '편관격',
        '正印': '정인격',
        '偏印': '편인격',
        '食神': '식신격',
        '傷官': '상관격',
        '正財': '정재격',
        '偏財': '편재격',
        '比肩': '건록격',
        '劫財': '양인격',
    }

    # 강한 십신 순으로 격국 후보 추출
    sorted_gods = sorted(ten_god_counts.items(), key=lambda x: x[1], reverse=True)

    for god, count in sorted_gods:
        if count >= 1.0:  # 충분히 강한 십신만
            formation = god_to_formation.get(god)
            if formation and formation not in candidates:
                candidates.append(formation)
                if len(candidates) >= 3:  # 최대 3개
                    break

    return candidates


# =============================================================================
# Task 2.3: 조후 가능성 분석
# =============================================================================

@dataclass
class JohuFeasibility:
    """조후 가능성 분석 결과"""
    required_element: str       # 필요 오행 (예: "癸水")
    available: bool             # 사주 내 존재 여부
    strength_level: int         # 강도 (1-10)
    positions: List[str]        # 위치 (예: ["月", "寅宮"])
    urgency: Literal["high", "medium", "low"]  # 긴급도
    daewun_supplement: Optional[str]  # 대운에서 보충 가능성


# 오행 이름 매핑
ELEMENT_NAMES: Dict[str, str] = {
    '木': '木', '火': '火', '土': '土', '金': '金', '水': '水'
}


def get_element(stem: str) -> str:
    """천간에서 오행 추출"""
    return STEM_TO_ELEMENT.get(stem, '')


def get_element_name(element: str) -> str:
    """오행 이름 반환"""
    return ELEMENT_NAMES.get(element, element)


# 2.3.1: 조후 가능성 분석 함수
def analyze_johu_feasibility(
    pillars: Dict[str, Any],
    daewun: List[Dict[str, Any]],
    day_master: str,
    month_branch: str,
    current_age: int
) -> JohuFeasibility:
    """
    조후 필요 오행의 사주 내 존재 여부 및 보충 가능성 분석

    Args:
        pillars: 사주 팔자
        daewun: 대운 리스트
        day_master: 일간
        month_branch: 월지
        current_age: 현재 나이

    Returns:
        JohuFeasibility 객체
    """
    # 1. 궁통보감에서 조후 필요 오행 조회
    johu_entry = get_johu_entry(day_master, month_branch)

    if not johu_entry:
        # 조후 정보가 없는 경우 기본값 반환
        return JohuFeasibility(
            required_element="정보없음",
            available=False,
            strength_level=0,
            positions=[],
            urgency="low",
            daewun_supplement=None
        )

    required = johu_entry.primary_god  # 예: '丙'
    required_element = get_element(required)

    # 2.3.2: 필요 오행의 유무/강도/위치 계산
    positions = []
    strength = 0

    pillar_names = {
        'year': {'ko': '年', 'en': 'Year'},
        'month': {'ko': '月', 'en': 'Month'},
        'day': {'ko': '日', 'en': 'Day'},
        'hour': {'ko': '時', 'en': 'Hour'},
    }

    for pillar_name, pillar in pillars.items():
        if not isinstance(pillar, dict):
            continue

        stem = pillar.get('stem', '')
        branch = pillar.get('branch', '')
        name_ko = pillar_names.get(pillar_name, {}).get('ko', pillar_name)

        # 천간에서 필요 오행 확인
        if get_element(stem) == required_element:
            positions.append(f"{name_ko}干")
            strength += 3  # 천간은 강도 3
            if stem == required:
                strength += 1  # 정확히 일치하면 추가 점수

        # 지지에서 필요 오행 확인 (지장간 고려)
        branch_element = _get_branch_main_element(branch)
        if branch_element == required_element:
            positions.append(f"{name_ko}支")
            strength += 2  # 지지는 강도 2

    # 강도 제한 (1-10)
    strength = max(1, min(strength, 10))

    # 2.3.3: 대운에서 조후 보충 가능성 분석
    daewun_supplement = None
    for dw in daewun or []:
        start_age = dw.get('start_age', 0)
        if start_age <= current_age + 10:  # 향후 10년 내
            dw_stem = dw.get('stem', '')
            dw_branch = dw.get('branch', '')
            if get_element(dw_stem) == required_element:
                daewun_supplement = f"{dw_stem}{dw_branch} (나이 {start_age}세)"
                break

    # 긴급도 결정
    if strength < 3:
        urgency = "high"
    elif strength < 6:
        urgency = "medium"
    else:
        urgency = "low"

    return JohuFeasibility(
        required_element=f"{required}{required_element}",
        available=len(positions) > 0,
        strength_level=strength,
        positions=positions,
        urgency=urgency,
        daewun_supplement=daewun_supplement
    )


def _get_branch_main_element(branch: str) -> str:
    """지지의 주요 오행 반환 (정기 기준)"""
    branch_elements = {
        '寅': '木', '卯': '木',
        '巳': '火', '午': '火',
        '辰': '土', '戌': '土', '丑': '土', '未': '土',
        '申': '金', '酉': '金',
        '亥': '水', '子': '水',
    }
    return branch_elements.get(branch, '')


# 조후 분석 결과를 프롬프트로 포맷팅
def format_johu_feasibility(
    feasibility: JohuFeasibility,
    language: str = 'ko'
) -> str:
    """
    조후 가능성 분석 결과를 프롬프트용 문자열로 포맷팅

    Args:
        feasibility: JohuFeasibility 객체
        language: 언어 코드

    Returns:
        포맷팅된 문자열
    """
    if language == 'en':
        urgency_map = {'high': 'High', 'medium': 'Medium', 'low': 'Low'}
        available_str = "Yes" if feasibility.available else "No"
        lines = [
            "## Climate Balance Analysis (調候)",
            f"- Required Element: {feasibility.required_element}",
            f"- Available in Chart: {available_str}",
            f"- Strength Level: {feasibility.strength_level}/10",
            f"- Positions: {', '.join(feasibility.positions) if feasibility.positions else 'None'}",
            f"- Urgency: {urgency_map.get(feasibility.urgency, feasibility.urgency)}",
        ]
        if feasibility.daewun_supplement:
            lines.append(f"- Luck Cycle Support: {feasibility.daewun_supplement}")
    else:
        urgency_map = {'high': '높음', 'medium': '보통', 'low': '낮음'}
        available_str = "있음" if feasibility.available else "없음"
        lines = [
            "## 조후(調候) 분석",
            f"- 필요 오행: {feasibility.required_element}",
            f"- 사주 내 존재: {available_str}",
            f"- 강도: {feasibility.strength_level}/10",
            f"- 위치: {', '.join(feasibility.positions) if feasibility.positions else '없음'}",
            f"- 긴급도: {urgency_map.get(feasibility.urgency, feasibility.urgency)}",
        ]
        if feasibility.daewun_supplement:
            lines.append(f"- 대운 보충: {feasibility.daewun_supplement}")

    return "\n".join(lines)
