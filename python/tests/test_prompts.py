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
