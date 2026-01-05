"""
명리학 고전 프롬프트 모듈
자평진전(子平真詮), 궁통보감(窮通寶鑑) 핵심 원리
"""
from .ziping import ZipingPrompt
from .qiongtong import QiongtongPrompt
from .qiongtong_matrix import (
    JOHU_MATRIX,
    JohuEntry,
    get_johu_entry,
    build_johu_prompt,
)
from .ziping_yongsin import (
    YONGSIN_MATRIX,
    YONGSIN_PRINCIPLES,
    YongsinEntry,
    get_yongsin_entry,
    build_yongsin_prompt,
    get_all_formations,
    get_yongsin_summary,
)

__all__ = [
    # 자평진전
    "ZipingPrompt",
    # 궁통보감 조후
    "QiongtongPrompt",
    "JOHU_MATRIX",
    "JohuEntry",
    "get_johu_entry",
    "build_johu_prompt",
    # 자평진전 용신 5원칙
    "YONGSIN_MATRIX",
    "YONGSIN_PRINCIPLES",
    "YongsinEntry",
    "get_yongsin_entry",
    "build_yongsin_prompt",
    "get_all_formations",
    "get_yongsin_summary",
]
