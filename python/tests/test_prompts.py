"""
다국어 프롬프트 시스템 테스트
ziping.py, qiongtong.py, builder.py 다국어 지원 검증
"""
import pytest
from prompts.classics.ziping import ZipingPrompt
from prompts.classics.qiongtong import QiongtongPrompt
from prompts.builder import PromptBuilder, PromptBuildRequest, PromptBuildOptions


class TestZipingMultilingual:
    """자평진전 다국어 테스트"""

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_ziping_build_all_languages(self, lang):
        """모든 언어에서 프롬프트 생성 성공"""
        prompt = ZipingPrompt.build(lang)
        assert len(prompt) > 1000, f"{lang} 프롬프트가 너무 짧음"
        assert isinstance(prompt, str)

    def test_ziping_korean_contains_key_terms(self):
        """한국어 프롬프트에 핵심 용어 포함"""
        prompt = ZipingPrompt.build('ko')
        assert '용신' in prompt
        assert '격국' in prompt
        assert '정관' in prompt or '식신' in prompt  # 십신 용어
        assert '자평진전' in prompt

    def test_ziping_english_contains_key_terms(self):
        """영어 프롬프트에 핵심 용어 포함"""
        prompt = ZipingPrompt.build('en')
        assert 'Useful God' in prompt or 'useful god' in prompt.lower()
        assert 'Structure' in prompt or 'structure' in prompt.lower()
        assert 'Ziping' in prompt

    def test_ziping_japanese_contains_key_terms(self):
        """일본어 프롬프트에 핵심 용어 포함"""
        prompt = ZipingPrompt.build('ja')
        assert '用神' in prompt
        assert '格局' in prompt
        assert '子平真詮' in prompt

    def test_ziping_chinese_simplified_contains_key_terms(self):
        """중국어 간체 프롬프트에 핵심 용어 포함"""
        prompt = ZipingPrompt.build('zh-CN')
        assert '用神' in prompt
        assert '格局' in prompt
        assert '子平真诠' in prompt  # 간체

    def test_ziping_chinese_traditional_contains_key_terms(self):
        """중국어 번체 프롬프트에 핵심 용어 포함"""
        prompt = ZipingPrompt.build('zh-TW')
        assert '用神' in prompt
        assert '格局' in prompt
        assert '子平真詮' in prompt  # 번체

    def test_ziping_legacy_zh_compatibility(self):
        """레거시 'zh' 코드가 zh-CN으로 처리됨"""
        prompt_zh = ZipingPrompt.build('zh')
        prompt_zh_cn = ZipingPrompt.build('zh-CN')
        assert prompt_zh == prompt_zh_cn


class TestQiongtongMultilingual:
    """궁통보감 다국어 테스트"""

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_qiongtong_build_all_languages(self, lang):
        """모든 언어에서 프롬프트 생성 성공"""
        prompt = QiongtongPrompt.build(lang)
        assert len(prompt) > 500, f"{lang} 프롬프트가 너무 짧음"
        assert isinstance(prompt, str)

    def test_qiongtong_korean_contains_key_terms(self):
        """한국어 프롬프트에 핵심 용어 포함"""
        prompt = QiongtongPrompt.build('ko')
        assert '조후' in prompt
        assert '한난조습' in prompt or '寒暖燥濕' in prompt
        assert '궁통보감' in prompt

    def test_qiongtong_english_contains_key_terms(self):
        """영어 프롬프트에 핵심 용어 포함"""
        prompt = QiongtongPrompt.build('en')
        assert 'Climate' in prompt
        assert 'Cold' in prompt or 'Warm' in prompt
        assert 'Qiong Tong' in prompt

    def test_qiongtong_japanese_contains_key_terms(self):
        """일본어 프롬프트에 핵심 용어 포함"""
        prompt = QiongtongPrompt.build('ja')
        assert '調候' in prompt
        assert '寒暖燥湿' in prompt or '寒暖燥濕' in prompt
        assert '窮通宝鑑' in prompt

    def test_qiongtong_chinese_simplified_contains_key_terms(self):
        """중국어 간체 프롬프트에 핵심 용어 포함"""
        prompt = QiongtongPrompt.build('zh-CN')
        assert '调候' in prompt
        assert '寒暖燥湿' in prompt
        assert '穷通宝鉴' in prompt  # 간체

    def test_qiongtong_chinese_traditional_contains_key_terms(self):
        """중국어 번체 프롬프트에 핵심 용어 포함"""
        prompt = QiongtongPrompt.build('zh-TW')
        assert '調候' in prompt
        assert '寒暖燥濕' in prompt
        assert '窮通寶鑑' in prompt  # 번체

    def test_qiongtong_legacy_zh_compatibility(self):
        """레거시 'zh' 코드가 zh-CN으로 처리됨"""
        prompt_zh = QiongtongPrompt.build('zh')
        prompt_zh_cn = QiongtongPrompt.build('zh-CN')
        assert prompt_zh == prompt_zh_cn


class TestPromptBuilder:
    """프롬프트 빌더 다국어 테스트"""

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_builder_all_languages(self, lang):
        """모든 언어에서 빌더 작동"""
        request = PromptBuildRequest(
            language=lang,
            options=PromptBuildOptions(
                include_ziping=True,
                include_qiongtong=True,
                include_western=False
            )
        )
        response = PromptBuilder.build(request)

        assert response.system_prompt is not None
        assert len(response.system_prompt) > 2000
        assert response.metadata['language'] == lang

    def test_builder_normalize_language(self):
        """언어 코드 정규화 테스트"""
        assert PromptBuilder._normalize_language('zh') == 'zh-CN'
        assert PromptBuilder._normalize_language('zh-CN') == 'zh-CN'
        assert PromptBuilder._normalize_language('zh-TW') == 'zh-TW'
        assert PromptBuilder._normalize_language('ko') == 'ko'
        assert PromptBuilder._normalize_language('en') == 'en'

    def test_builder_includes_ziping(self):
        """자평진전 포함 시 프롬프트에 반영"""
        request = PromptBuildRequest(
            language='ko',
            options=PromptBuildOptions(include_ziping=True, include_qiongtong=False)
        )
        response = PromptBuilder.build(request)
        assert '자평진전' in response.system_prompt
        assert 'ziping' in response.metadata['included_modules']

    def test_builder_includes_qiongtong(self):
        """궁통보감 포함 시 프롬프트에 반영"""
        request = PromptBuildRequest(
            language='ko',
            options=PromptBuildOptions(include_ziping=False, include_qiongtong=True)
        )
        response = PromptBuilder.build(request)
        assert '궁통보감' in response.system_prompt
        assert 'qiongtong' in response.metadata['included_modules']

    def test_builder_user_prompt_chinese_traditional(self):
        """중국어 번체 사용자 프롬프트 생성"""
        request = PromptBuildRequest(
            language='zh-TW',
            pillars={
                'year': {'stem': '甲', 'branch': '子'},
                'month': {'stem': '乙', 'branch': '丑'},
                'day': {'stem': '丙', 'branch': '寅', 'element': '火'},
                'hour': {'stem': '丁', 'branch': '卯'},
            },
            focus_area='wealth',
            question='今年換工作可以嗎？'
        )
        response = PromptBuilder.build(request)

        # 번체 문자 확인
        assert '時柱' in response.user_prompt  # 번체: 時柱 (간체는 时柱)
        assert '重點分析領域' in response.user_prompt
        assert '財運' in response.user_prompt

    def test_builder_focus_area_labels(self):
        """집중 영역 라벨이 zh-CN, zh-TW 모두 존재"""
        assert 'zh-CN' in PromptBuilder.FOCUS_AREA_LABELS
        assert 'zh-TW' in PromptBuilder.FOCUS_AREA_LABELS
        assert PromptBuilder.FOCUS_AREA_LABELS['zh-CN']['wealth'] == '财运'
        assert PromptBuilder.FOCUS_AREA_LABELS['zh-TW']['wealth'] == '財運'


class TestSeasonalElements:
    """계절별 오행 다국어 테스트"""

    def test_seasonal_analysis_korean(self):
        """한국어 계절 분석"""
        prompt = QiongtongPrompt.get_seasonal_analysis('ko')
        assert '봄' in prompt
        assert '여름' in prompt
        assert '가을' in prompt
        assert '겨울' in prompt

    def test_seasonal_analysis_english(self):
        """영어 계절 분석"""
        prompt = QiongtongPrompt.get_seasonal_analysis('en')
        assert 'Spring' in prompt
        assert 'Summer' in prompt
        assert 'Autumn' in prompt
        assert 'Winter' in prompt

    def test_seasonal_analysis_japanese(self):
        """일본어 계절 분석"""
        prompt = QiongtongPrompt.get_seasonal_analysis('ja')
        assert '春' in prompt
        assert '夏' in prompt
        assert '秋' in prompt
        assert '冬' in prompt


class TestJohuPrinciples:
    """조후 4원리 다국어 테스트"""

    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_johu_principles_all_languages(self, lang):
        """모든 언어에서 조후 원리 생성"""
        prompt = QiongtongPrompt.get_johu_principles_text(lang)
        assert len(prompt) > 200
        # 4가지 원리가 모두 포함되어야 함
        if lang == 'ko':
            assert '한' in prompt and '난' in prompt
        elif lang == 'en':
            assert 'Cold' in prompt and 'Warm' in prompt


# ============================================
# Task 9~11: 멀티스텝 프롬프트 테스트
# ============================================

class TestMultistepPrompts:
    """멀티스텝 파이프라인용 단계별 프롬프트 테스트"""

    # 테스트용 사주 데이터
    SAMPLE_PILLARS = {
        'year': {'stem': '甲', 'branch': '子', 'element': '木'},
        'month': {'stem': '乙', 'branch': '丑', 'element': '木'},
        'day': {'stem': '丙', 'branch': '寅', 'element': '火', 'stemElement': '火'},
        'hour': {'stem': '丁', 'branch': '卯', 'element': '火'},
    }

    @pytest.mark.parametrize("step", ['basic', 'personality', 'aptitude', 'fortune'])
    @pytest.mark.parametrize("lang", ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'])
    def test_build_step_all_languages(self, step, lang):
        """모든 단계/언어에서 프롬프트 생성 성공"""
        response = PromptBuilder.build_step(
            step=step,
            pillars=self.SAMPLE_PILLARS,
            language=lang
        )

        assert response.system_prompt is not None
        assert len(response.system_prompt) > 500
        assert response.metadata['step'] == step
        assert response.metadata['language'] == lang
        assert response.output_schema is not None

    def test_build_step_metadata(self):
        """빌드 응답 메타데이터 확인"""
        response = PromptBuilder.build_step(
            step='basic',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )

        assert 'version' in response.metadata
        assert response.metadata['type'] == 'step'
        assert 'generated_at' in response.metadata


class TestPersonalityPrompt:
    """Task 9: 성격 분석 프롬프트 테스트"""

    SAMPLE_PILLARS = TestMultistepPrompts.SAMPLE_PILLARS

    def test_personality_korean_key_terms(self):
        """한국어 성격 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='personality',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 십신 관련 용어
        assert '비견' in prompt or '겁재' in prompt
        assert '식상' in prompt or '재성' in prompt or '관성' in prompt
        # 분석 항목
        assert '의지력' in prompt
        assert '겉성격' in prompt
        assert '속성격' in prompt
        assert '대인관계' in prompt

    def test_personality_english_key_terms(self):
        """영어 성격 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='personality',
            pillars=self.SAMPLE_PILLARS,
            language='en'
        )
        prompt = response.system_prompt

        assert 'Willpower' in prompt
        assert 'Outer Personality' in prompt or 'outer personality' in prompt.lower()
        assert 'Inner Personality' in prompt or 'inner personality' in prompt.lower()
        assert 'Social' in prompt

    def test_personality_japanese_key_terms(self):
        """일본어 성격 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='personality',
            pillars=self.SAMPLE_PILLARS,
            language='ja'
        )
        prompt = response.system_prompt

        assert '意志力' in prompt
        assert '外面' in prompt or '内面' in prompt
        assert '対人関係' in prompt

    def test_personality_chinese_simplified_key_terms(self):
        """중국어 간체 성격 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='personality',
            pillars=self.SAMPLE_PILLARS,
            language='zh-CN'
        )
        prompt = response.system_prompt

        assert '意志力' in prompt
        assert '外在性格' in prompt or '内在性格' in prompt
        assert '人际关系' in prompt

    def test_personality_chinese_traditional_key_terms(self):
        """중국어 번체 성격 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='personality',
            pillars=self.SAMPLE_PILLARS,
            language='zh-TW'
        )
        prompt = response.system_prompt

        assert '意志力' in prompt
        assert '外在性格' in prompt or '內在性格' in prompt
        assert '人際關係' in prompt


class TestAptitudePrompt:
    """Task 10: 적성 분석 프롬프트 테스트"""

    SAMPLE_PILLARS = TestMultistepPrompts.SAMPLE_PILLARS

    def test_aptitude_korean_key_terms(self):
        """한국어 적성 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='aptitude',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 분석 원칙
        assert '식신' in prompt or '상관' in prompt
        assert '재성' in prompt or '정재' in prompt or '편재' in prompt
        # 분석 항목
        assert '핵심 키워드' in prompt or '키워드' in prompt
        assert '재능' in prompt
        assert '추천 분야' in prompt
        assert '피해야 할 분야' in prompt

    def test_aptitude_english_key_terms(self):
        """영어 적성 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='aptitude',
            pillars=self.SAMPLE_PILLARS,
            language='en'
        )
        prompt = response.system_prompt

        assert 'Keywords' in prompt or 'keywords' in prompt.lower()
        assert 'Talent' in prompt or 'talent' in prompt.lower()
        assert 'Recommended' in prompt
        assert 'Avoid' in prompt

    def test_aptitude_japanese_key_terms(self):
        """일본어 적성 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='aptitude',
            pillars=self.SAMPLE_PILLARS,
            language='ja'
        )
        prompt = response.system_prompt

        assert 'キーワード' in prompt
        assert '才能' in prompt
        assert '推奨分野' in prompt
        assert '避けるべき' in prompt

    def test_aptitude_chinese_simplified_key_terms(self):
        """중국어 간체 적성 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='aptitude',
            pillars=self.SAMPLE_PILLARS,
            language='zh-CN'
        )
        prompt = response.system_prompt

        assert '关键词' in prompt
        assert '才能' in prompt or '天赋' in prompt
        assert '推荐领域' in prompt
        assert '避免' in prompt

    def test_aptitude_chinese_traditional_key_terms(self):
        """중국어 번체 적성 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='aptitude',
            pillars=self.SAMPLE_PILLARS,
            language='zh-TW'
        )
        prompt = response.system_prompt

        assert '關鍵詞' in prompt
        assert '才能' in prompt or '天賦' in prompt
        assert '推薦領域' in prompt
        assert '避免' in prompt


class TestFortunePrompt:
    """Task 11: 재물/연애 분석 프롬프트 테스트"""

    SAMPLE_PILLARS = TestMultistepPrompts.SAMPLE_PILLARS

    def test_fortune_korean_key_terms(self):
        """한국어 재물/연애 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 재물운
        assert '재물운' in prompt
        assert '정재' in prompt or '편재' in prompt
        assert '축재형' in prompt or '패턴' in prompt
        # 연애운
        assert '연애운' in prompt or '연애' in prompt
        assert '결혼' in prompt

    def test_fortune_english_key_terms(self):
        """영어 재물/연애 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='en'
        )
        prompt = response.system_prompt

        # Wealth
        assert 'Wealth' in prompt or 'wealth' in prompt.lower()
        assert 'Direct Wealth' in prompt or 'Indirect Wealth' in prompt
        # Love
        assert 'Love' in prompt or 'love' in prompt.lower()
        assert 'Marriage' in prompt or 'marriage' in prompt.lower()

    def test_fortune_japanese_key_terms(self):
        """일본어 재물/연애 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='ja'
        )
        prompt = response.system_prompt

        assert '財運' in prompt
        assert '正財' in prompt or '偏財' in prompt
        assert '恋愛' in prompt
        assert '結婚' in prompt

    def test_fortune_chinese_simplified_key_terms(self):
        """중국어 간체 재물/연애 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='zh-CN'
        )
        prompt = response.system_prompt

        assert '财运' in prompt
        assert '正财' in prompt or '偏财' in prompt
        assert '恋爱' in prompt
        assert '婚姻' in prompt

    def test_fortune_chinese_traditional_key_terms(self):
        """중국어 번체 재물/연애 프롬프트에 핵심 용어 포함"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='zh-TW'
        )
        prompt = response.system_prompt

        assert '財運' in prompt
        assert '正財' in prompt or '偏財' in prompt
        assert '戀愛' in prompt
        assert '婚姻' in prompt

    def test_fortune_sanitization_guidance(self):
        """순화 가이드라인이 프롬프트에 포함되어 있는지 확인"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 순화 지침 확인
        assert '부정적' in prompt or '순화' in prompt or '완곡' in prompt

    def test_fortune_sanitization_guidance_english(self):
        """영어 프롬프트에 순화 가이드라인 포함"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='en'
        )
        prompt = response.system_prompt

        # 순화 지침 확인 (Express negative content gently)
        assert 'negative' in prompt.lower() or 'gently' in prompt.lower()


class TestOutputSchemas:
    """단계별 출력 스키마 테스트"""

    @pytest.mark.parametrize("step", ['basic', 'personality', 'aptitude', 'fortune'])
    def test_output_schema_structure(self, step):
        """각 단계의 출력 스키마가 올바른 구조를 가지는지 확인"""
        schema = PromptBuilder._get_step_output_schema(step)

        assert schema is not None
        assert 'type' in schema
        assert schema['type'] == 'object'
        assert 'properties' in schema
        assert 'required' in schema

    def test_personality_schema_fields(self):
        """성격 스키마에 필수 필드가 있는지 확인"""
        schema = PromptBuilder._get_step_output_schema('personality')

        assert 'willpower' in schema['properties']
        assert 'outerPersonality' in schema['properties']
        assert 'innerPersonality' in schema['properties']
        assert 'socialStyle' in schema['properties']

    def test_aptitude_schema_fields(self):
        """적성 스키마에 필수 필드가 있는지 확인"""
        schema = PromptBuilder._get_step_output_schema('aptitude')

        assert 'keywords' in schema['properties']
        assert 'talents' in schema['properties']
        assert 'recommendedFields' in schema['properties']
        assert 'avoidFields' in schema['properties']

    def test_fortune_schema_fields(self):
        """재물/연애 스키마에 필수 필드가 있는지 확인"""
        schema = PromptBuilder._get_step_output_schema('fortune')

        assert 'wealth' in schema['properties']
        assert 'love' in schema['properties']

        # 중첩 구조 확인
        wealth = schema['properties']['wealth']
        assert 'properties' in wealth
        assert 'pattern' in wealth['properties']

        love = schema['properties']['love']
        assert 'properties' in love
        assert 'style' in love['properties']


class TestClassicsSummaryIntegration:
    """classics_summary 모듈 통합 테스트"""

    SAMPLE_PILLARS = TestMultistepPrompts.SAMPLE_PILLARS

    def test_personality_includes_ten_gods_guide(self):
        """성격 분석에 십신 가이드가 포함되는지 확인"""
        response = PromptBuilder.build_step(
            step='personality',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 십신 가이드 내용이 포함되어야 함
        assert '십신' in prompt or '十神' in prompt
        assert '비견' in prompt or '겁재' in prompt

    def test_aptitude_includes_ziping_summary(self):
        """적성 분석에 자평진전 요약이 포함되는지 확인"""
        response = PromptBuilder.build_step(
            step='aptitude',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 자평진전 핵심 내용 포함 확인
        assert '용신' in prompt or '격국' in prompt

    def test_fortune_includes_both_summaries(self):
        """재물/연애 분석에 자평진전+궁통보감 요약이 포함되는지 확인"""
        response = PromptBuilder.build_step(
            step='fortune',
            pillars=self.SAMPLE_PILLARS,
            language='ko'
        )
        prompt = response.system_prompt

        # 자평진전 + 궁통보감 핵심 내용 포함 확인
        assert '용신' in prompt or '격국' in prompt
        assert '조후' in prompt or '한난' in prompt or '寒暖' in prompt
