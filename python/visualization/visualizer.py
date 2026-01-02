"""
사주 명반 시각화 클래스
- PIL을 사용하여 사주 팔자 이미지 생성
- Base64 인코딩된 PNG 이미지 반환
"""
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import base64
from typing import Optional

from schemas.saju import Pillars, Pillar
from .constants import (
    ELEMENT_COLORS,
    ELEMENT_TEXT_COLORS,
    STEM_TO_ELEMENT,
    BRANCH_TO_ELEMENT,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    BACKGROUND_COLOR,
    BOX_WIDTH,
    BOX_HEIGHT,
    BOX_MARGIN_TOP,
    find_font,
)


class SajuVisualizer:
    """
    사주 명반 이미지 생성기

    Pillars 데이터를 받아 800x400px PNG 이미지를 생성하고
    Base64 인코딩된 문자열로 반환
    """

    def __init__(self, font_path: Optional[str] = None):
        """
        초기화

        Args:
            font_path: 폰트 파일 경로 (기본값: 시스템 폰트 자동 탐색)
        """
        self.font_path = font_path or find_font()
        self._load_fonts()

    def _load_fonts(self) -> None:
        """폰트 로드 (여러 크기)"""
        try:
            if self.font_path:
                self.font_label = ImageFont.truetype(self.font_path, 22)
                self.font_stem = ImageFont.truetype(self.font_path, 52)
                self.font_branch = ImageFont.truetype(self.font_path, 52)
                self.font_element = ImageFont.truetype(self.font_path, 18)
            else:
                raise OSError("폰트를 찾을 수 없습니다")
        except OSError:
            # 폴백: 기본 폰트 사용
            self.font_label = ImageFont.load_default()
            self.font_stem = ImageFont.load_default()
            self.font_branch = ImageFont.load_default()
            self.font_element = ImageFont.load_default()

    def generate(self, pillars: Pillars) -> str:
        """
        사주 명반 이미지 생성

        Args:
            pillars: 사주 팔자 데이터 (year, month, day, hour)

        Returns:
            Base64 인코딩된 PNG 이미지 (data:image/png;base64,... 형식)
        """
        # 1. 캔버스 생성
        image = self._create_canvas()
        draw = ImageDraw.Draw(image)

        # 2. 4개 기둥 그리기 (왼쪽→오른쪽: 時→日→月→年)
        pillar_data = [
            (pillars.hour, "時柱"),
            (pillars.day, "日柱"),
            (pillars.month, "月柱"),
            (pillars.year, "年柱"),
        ]

        # X 좌표 계산 (4개 기둥 균등 배치)
        margin = 80
        total_width = IMAGE_WIDTH - margin * 2
        spacing = total_width // 4

        for i, (pillar, label) in enumerate(pillar_data):
            x = margin + spacing * i + spacing // 2
            y = BOX_MARGIN_TOP
            self._draw_pillar(draw, pillar, x, y, label)

        # 3. Base64 변환 후 반환
        return self._image_to_base64(image)

    def _create_canvas(self) -> Image.Image:
        """배경 이미지 생성 (800x400, #f8f8f8)"""
        # RGB 색상으로 변환
        bg_color = self._hex_to_rgb(BACKGROUND_COLOR)
        image = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT), bg_color)
        return image

    def _draw_pillar(
        self,
        draw: ImageDraw.ImageDraw,
        pillar: Pillar,
        x: int,
        y: int,
        label: str
    ) -> None:
        """
        단일 기둥(柱) 그리기

        Args:
            draw: ImageDraw 객체
            pillar: 기둥 데이터 (stem, branch, element)
            x: 기둥 중심 X 좌표
            y: 기둥 상단 Y 좌표
            label: 기둥 레이블 (時柱, 日柱, 月柱, 年柱)
        """
        box_width = BOX_WIDTH
        box_height = BOX_HEIGHT

        # 천간/지지의 오행 가져오기
        stem_element = STEM_TO_ELEMENT.get(pillar.stem, "土")
        branch_element = BRANCH_TO_ELEMENT.get(pillar.branch, "土")

        stem_color = self._hex_to_rgb(self._get_element_color(stem_element))
        branch_color = self._hex_to_rgb(self._get_element_color(branch_element))

        stem_text_color = self._hex_to_rgb(self._get_text_color(stem_element))
        branch_text_color = self._hex_to_rgb(self._get_text_color(branch_element))

        outline_color = self._hex_to_rgb("#333333")
        label_color = self._hex_to_rgb("#333333")
        element_text_color = self._hex_to_rgb("#555555")

        # 1. 레이블 그리기 (時柱, 日柱 등)
        label_bbox = draw.textbbox((0, 0), label, font=self.font_label)
        label_width = label_bbox[2] - label_bbox[0]
        draw.text(
            (x - label_width // 2, y - 35),
            label,
            font=self.font_label,
            fill=label_color
        )

        # 2. 천간 박스 (상단)
        stem_box = [
            x - box_width // 2,
            y,
            x + box_width // 2,
            y + box_height
        ]
        draw.rectangle(stem_box, fill=stem_color, outline=outline_color, width=2)

        # 천간 글자 (중앙 상단)
        stem_bbox = draw.textbbox((0, 0), pillar.stem, font=self.font_stem)
        stem_width = stem_bbox[2] - stem_bbox[0]
        stem_height = stem_bbox[3] - stem_bbox[1]
        draw.text(
            (x - stem_width // 2, y + 20),
            pillar.stem,
            font=self.font_stem,
            fill=stem_text_color
        )

        # 오행 표시 (천간 박스 하단)
        element_text = f"({stem_element})"
        elem_bbox = draw.textbbox((0, 0), element_text, font=self.font_element)
        elem_width = elem_bbox[2] - elem_bbox[0]
        draw.text(
            (x - elem_width // 2, y + box_height - 30),
            element_text,
            font=self.font_element,
            fill=stem_text_color
        )

        # 3. 지지 박스 (하단)
        branch_y = y + box_height + 10
        branch_box = [
            x - box_width // 2,
            branch_y,
            x + box_width // 2,
            branch_y + box_height
        ]
        draw.rectangle(branch_box, fill=branch_color, outline=outline_color, width=2)

        # 지지 글자 (중앙 상단)
        branch_bbox = draw.textbbox((0, 0), pillar.branch, font=self.font_branch)
        branch_width = branch_bbox[2] - branch_bbox[0]
        draw.text(
            (x - branch_width // 2, branch_y + 20),
            pillar.branch,
            font=self.font_branch,
            fill=branch_text_color
        )

        # 오행 표시 (지지 박스 하단)
        branch_element_text = f"({branch_element})"
        branch_elem_bbox = draw.textbbox((0, 0), branch_element_text, font=self.font_element)
        branch_elem_width = branch_elem_bbox[2] - branch_elem_bbox[0]
        draw.text(
            (x - branch_elem_width // 2, branch_y + box_height - 30),
            branch_element_text,
            font=self.font_element,
            fill=branch_text_color
        )

    def _get_element_color(self, element: str) -> str:
        """오행에 해당하는 배경 색상 반환"""
        return ELEMENT_COLORS.get(element, "#e5e7eb")

    def _get_text_color(self, element: str) -> str:
        """오행에 해당하는 텍스트 색상 반환 (가독성 고려)"""
        return ELEMENT_TEXT_COLORS.get(element, "#1a1a1a")

    def _hex_to_rgb(self, hex_color: str) -> tuple[int, int, int]:
        """HEX 색상 코드를 RGB 튜플로 변환"""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _image_to_base64(self, image: Image.Image) -> str:
        """이미지를 Base64 문자열로 변환"""
        buffer = BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)

        base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{base64_data}"
