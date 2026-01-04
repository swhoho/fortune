"""
Task 8: 기본 분석 프롬프트 테스트
멀티스텝 파이프라인용 Step 2 (basic analysis) 프롬프트 검증
"""
import pytest
from prompts.builder import PromptBuilder
from prompts.classics_summary import (
    get_ziping_summary,
    get_qiongtong_summary,
    get_ten_gods_guide,
    DAY_MASTER_TRAITS
)


# 테스트 픽스처: 샘플 사주 데이터
SAMPLE_PILLARS = {
    'year': {'stem': '庚', 'branch': '午', 'element': '金'},
    'month': {'stem': '乙', 'branch': '丑', 'element': '木'},
    'day': {'stem': '甲', 'branch': '子', 'element': '木'},
    'hour': {'stem': '丁', 'branch': '卯', 'element': '火'},
}

SAMPLE_DAEWUN = [
    {'age': 1, 'stem': '壬', 'branch': '午', 'startYear': 1991},
    {'age': 11, 'stem': '癸', 'branch': '未', 'startYear': 2001},
    {'age': 21, 'stem': '甲', 'branch': '申', 'startYear': 2011},
]

SAMPLE_JIJANGGAN = {
    'year': ['己', '丁'],
    'month': ['癸', '辛', '己'],
    'day': ['癸'],
    'hour': ['乙'],
}


class TestBasicAnalysisPrompt:
    """기본 분석 프롬프트 테스트"""

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_build_step_basic_all_languages(self, lang):
        """모든 언어에서 기본 분석 프롬프트 생성"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language=lang
        )

        assert result.system_prompt is not None
        assert len(result.system_prompt) > 1000, f"{lang} 시스템 프롬프트가 너무 짧음"
        assert result.user_prompt is not None
        assert result.output_schema is not None
        assert result.metadata.get('step') == 'basic'

    def test_basic_prompt_contains_ziping_summary(self):
        """기본 분석에 자평진전 요약 포함"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        # 자평진전 핵심 용어 확인
        assert '용신' in result.system_prompt
        assert '격국' in result.system_prompt or '정격' in result.system_prompt

    def test_basic_prompt_contains_qiongtong_summary(self):
        """기본 분석에 궁통보감 요약 포함"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        # 궁통보감 핵심 용어 확인
        assert '조후' in result.system_prompt or '한난조습' in result.system_prompt

    def test_basic_prompt_contains_day_master_instructions(self):
        """기본 분석에 일간 분석 지시 포함"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        assert '일간' in result.system_prompt
        assert '격국' in result.system_prompt
        assert '용신' in result.system_prompt

    def test_user_prompt_contains_pillars(self):
        """사용자 프롬프트에 사주 정보 포함"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        # 사주 천간/지지 포함 확인
        assert '甲' in result.user_prompt  # 일간
        assert '子' in result.user_prompt  # 일지
        assert '庚' in result.user_prompt  # 연간

    def test_output_schema_has_required_fields(self):
        """출력 스키마에 필수 필드 존재"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        schema = result.output_schema
        properties = schema.get('properties', {})

        assert 'dayMaster' in properties, "dayMaster 필드 누락"
        assert 'structure' in properties, "structure 필드 누락"
        assert 'usefulGod' in properties, "usefulGod 필드 누락"
        assert 'summary' in properties, "summary 필드 누락"

    def test_build_step_with_daewun(self):
        """대운 데이터 포함 시 프롬프트 생성"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko',
            daewun=SAMPLE_DAEWUN
        )

        assert result.system_prompt is not None
        # 대운 정보가 사용자 프롬프트에 포함되어야 함
        assert '대운' in result.user_prompt or '壬' in result.user_prompt

    def test_build_step_with_jijanggan(self):
        """지장간 데이터 포함 시 프롬프트 생성"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko',
            jijanggan=SAMPLE_JIJANGGAN
        )

        assert result.system_prompt is not None
        # 지장간 정보가 포함되어야 함
        assert '지장간' in result.user_prompt or '藏干' in result.user_prompt


class TestOtherStepsPrompt:
    """다른 단계 프롬프트 테스트"""

    def test_personality_step_contains_ten_gods(self):
        """성격 분석 단계에 십신 가이드 포함"""
        result = PromptBuilder.build_step(
            step='personality',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        # 십신 관련 용어 확인
        assert '비견' in result.system_prompt or '식신' in result.system_prompt or '십신' in result.system_prompt

    def test_aptitude_step_contains_ziping_summary(self):
        """적성 분석 단계에 자평진전 요약 포함"""
        result = PromptBuilder.build_step(
            step='aptitude',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        assert '용신' in result.system_prompt or '격국' in result.system_prompt

    def test_fortune_step_contains_both_summaries(self):
        """재물/연애 분석 단계에 양대 고전 요약 포함"""
        result = PromptBuilder.build_step(
            step='fortune',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        # 자평진전 + 궁통보감 핵심
        has_ziping = '용신' in result.system_prompt or '격국' in result.system_prompt
        has_qiongtong = '조후' in result.system_prompt or '한난조습' in result.system_prompt

        assert has_ziping, "자평진전 요약 누락"
        assert has_qiongtong, "궁통보감 요약 누락"


class TestClassicsSummary:
    """classics_summary 모듈 테스트"""

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_ziping_summary_all_languages(self, lang):
        """모든 언어에서 자평진전 요약 반환"""
        summary = get_ziping_summary(lang)

        assert summary is not None
        assert len(summary) > 500, f"{lang} 자평진전 요약이 너무 짧음"

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_qiongtong_summary_all_languages(self, lang):
        """모든 언어에서 궁통보감 요약 반환"""
        summary = get_qiongtong_summary(lang)

        assert summary is not None
        assert len(summary) > 300, f"{lang} 궁통보감 요약이 너무 짧음"

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_ten_gods_guide_all_languages(self, lang):
        """모든 언어에서 십신 가이드 반환"""
        guide = get_ten_gods_guide(lang)

        assert guide is not None
        assert len(guide) > 200, f"{lang} 십신 가이드가 너무 짧음"

    def test_ziping_summary_korean_content(self):
        """한국어 자평진전 요약 내용 검증"""
        summary = get_ziping_summary('ko')

        assert '용신 5원칙' in summary or '용신' in summary
        assert '억부' in summary or '억부용신' in summary
        assert '조후' in summary or '조후용신' in summary

    def test_qiongtong_summary_korean_content(self):
        """한국어 궁통보감 요약 내용 검증"""
        summary = get_qiongtong_summary('ko')

        assert '궁통보감' in summary
        assert '조후' in summary


class TestDayMasterTraits:
    """일간별 특성 테스트"""

    @pytest.mark.parametrize("stem", ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'])
    def test_all_day_masters_have_traits(self, stem):
        """모든 10개 일간에 특성 정의됨"""
        traits = DAY_MASTER_TRAITS.get(stem)

        assert traits is not None, f"{stem} 일간 특성 누락"
        assert 'element' in traits
        assert 'polarity' in traits
        assert 'symbol' in traits
        assert 'personality' in traits

    def test_jiap_wood_traits(self):
        """甲木 특성 정확성"""
        traits = DAY_MASTER_TRAITS.get('甲')

        assert traits['element'] == '木'
        assert traits['polarity'] == '陽'
        assert 'ko' in traits['symbol']
        assert 'ko' in traits['personality']


class TestPromptEfficiency:
    """프롬프트 효율성 테스트 (Task 8 목표: 토큰 절감)"""

    def test_basic_prompt_size_is_reasonable(self):
        """기본 분석 프롬프트 크기가 합리적임 (압축 효과 확인)"""
        result = PromptBuilder.build_step(
            step='basic',
            pillars=SAMPLE_PILLARS,
            language='ko'
        )

        system_size = len(result.system_prompt)
        user_size = len(result.user_prompt)
        total_size = system_size + user_size

        # 목표: 압축 버전으로 전체 15KB 이하
        assert total_size < 15000, f"프롬프트가 너무 큼: {total_size} chars"

        # 기존 대비 확실히 작아야 함 (기존 70KB+)
        assert system_size < 10000, f"시스템 프롬프트가 너무 큼: {system_size} chars"
