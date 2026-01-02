"""
언어별 프롬프트 로케일
ko: 한국어, en: 영어, ja: 일본어, zh-CN: 간체중국어, zh-TW: 번체중국어
"""
from typing import Literal

from .ko import KoreanLocale
from .en import EnglishLocale
from .ja import JapaneseLocale
from .zh_cn import ChineseSimplifiedLocale
from .zh_tw import ChineseTraditionalLocale

LocaleType = Literal['ko', 'en', 'ja', 'zh-CN', 'zh-TW']

LOCALES = {
    'ko': KoreanLocale,
    'en': EnglishLocale,
    'ja': JapaneseLocale,
    'zh-CN': ChineseSimplifiedLocale,
    'zh-TW': ChineseTraditionalLocale,
    'zh': ChineseSimplifiedLocale,  # 레거시 호환: zh → zh-CN
}


def get_locale(language: str):
    """언어 코드로 로케일 클래스 반환

    Args:
        language: 언어 코드 (ko, en, ja, zh-CN, zh-TW, zh)

    Returns:
        해당 로케일 클래스. 찾지 못하면 KoreanLocale 반환.
    """
    # 레거시 호환: zh → zh-CN
    if language == 'zh':
        language = 'zh-CN'
    return LOCALES.get(language, KoreanLocale)


__all__ = [
    "KoreanLocale",
    "EnglishLocale",
    "JapaneseLocale",
    "ChineseSimplifiedLocale",
    "ChineseTraditionalLocale",
    "get_locale",
    "LocaleType",
]
