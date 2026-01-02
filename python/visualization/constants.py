"""
시각화 관련 상수 정의
- 이미지 크기, 배경색, 오행 색상, 폰트 경로 등
"""
import os

# 이미지 크기
IMAGE_WIDTH = 800
IMAGE_HEIGHT = 400

# 배경색
BACKGROUND_COLOR = "#f8f8f8"

# 오행 색상 매핑
ELEMENT_COLORS = {
    "木": "#4ade80",  # Green
    "火": "#ef4444",  # Red
    "土": "#f59e0b",  # Amber
    "金": "#e5e7eb",  # Gray
    "水": "#1e3a8a",  # Blue
}

# 오행별 텍스트 색상 (가독성을 위해 밝은 배경에는 어두운 텍스트)
ELEMENT_TEXT_COLORS = {
    "木": "#1a1a1a",  # 어두운 텍스트
    "火": "#ffffff",  # 밝은 텍스트
    "土": "#1a1a1a",  # 어두운 텍스트
    "金": "#1a1a1a",  # 어두운 텍스트
    "水": "#ffffff",  # 밝은 텍스트
}

# 천간 → 오행 매핑
STEM_TO_ELEMENT = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水",
}

# 지지 → 오행 매핑
BRANCH_TO_ELEMENT = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木",
    "辰": "土", "巳": "火", "午": "火", "未": "土",
    "申": "金", "酉": "金", "戌": "土", "亥": "水",
}

# 기둥 레이블
PILLAR_LABELS = {
    "year": "年柱",
    "month": "月柱",
    "day": "日柱",
    "hour": "時柱",
}

# 폰트 경로 우선순위 (첫 번째로 발견되는 폰트 사용)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FONT_PATHS = [
    # 1. 프로젝트 번들 폰트
    os.path.join(BASE_DIR, "fonts", "NotoSerifCJKkr-Regular.otf"),
    # 2. macOS 시스템 폰트 (Arial Unicode - 한자 지원)
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    # 3. macOS 한글 폰트
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    # 4. Linux 시스템 폰트
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
]

# 박스 스타일
BOX_WIDTH = 120
BOX_HEIGHT = 130
BOX_SPACING = 20
BOX_MARGIN_TOP = 80


def find_font() -> str | None:
    """사용 가능한 폰트 경로 반환"""
    for path in FONT_PATHS:
        if os.path.exists(path):
            return path
    return None
