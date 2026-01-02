"""
사주 명반 시각화 테스트
- SajuVisualizer 클래스 단위 테스트
- API 엔드포인트 통합 테스트
"""
import pytest
import base64
from io import BytesIO
from PIL import Image

from visualization import SajuVisualizer
from visualization.constants import ELEMENT_COLORS
from schemas.saju import Pillars, Pillar


@pytest.fixture
def visualizer():
    """SajuVisualizer 인스턴스"""
    return SajuVisualizer()


@pytest.fixture
def sample_pillars():
    """샘플 사주 데이터"""
    return Pillars(
        year=Pillar(stem="庚", branch="午", element="金"),
        month=Pillar(stem="辛", branch="巳", element="金"),
        day=Pillar(stem="甲", branch="子", element="木"),
        hour=Pillar(stem="辛", branch="未", element="金"),
    )


class TestSajuVisualizer:
    """사주 명반 시각화 테스트"""

    def test_generate_returns_base64(self, visualizer, sample_pillars):
        """Base64 형식으로 반환하는지 확인"""
        result = visualizer.generate(sample_pillars)

        assert result.startswith("data:image/png;base64,")

    def test_generate_valid_png(self, visualizer, sample_pillars):
        """유효한 PNG 이미지인지 확인"""
        result = visualizer.generate(sample_pillars)

        # Base64 디코딩
        base64_data = result.replace("data:image/png;base64,", "")
        image_bytes = base64.b64decode(base64_data)

        # PIL로 열어서 검증
        image = Image.open(BytesIO(image_bytes))

        assert image.format == "PNG"
        assert image.size == (800, 400)

    def test_generate_correct_dimensions(self, visualizer, sample_pillars):
        """이미지 크기가 800x400인지 확인"""
        result = visualizer.generate(sample_pillars)

        base64_data = result.replace("data:image/png;base64,", "")
        image_bytes = base64.b64decode(base64_data)
        image = Image.open(BytesIO(image_bytes))

        assert image.width == 800
        assert image.height == 400

    def test_element_color_mapping(self, visualizer):
        """오행 색상 매핑 테스트"""
        assert visualizer._get_element_color("木") == "#4ade80"
        assert visualizer._get_element_color("火") == "#ef4444"
        assert visualizer._get_element_color("土") == "#f59e0b"
        assert visualizer._get_element_color("金") == "#e5e7eb"
        assert visualizer._get_element_color("水") == "#1e3a8a"

    def test_hex_to_rgb_conversion(self, visualizer):
        """HEX to RGB 변환 테스트"""
        assert visualizer._hex_to_rgb("#ffffff") == (255, 255, 255)
        assert visualizer._hex_to_rgb("#000000") == (0, 0, 0)
        assert visualizer._hex_to_rgb("#4ade80") == (74, 222, 128)

    def test_all_stems_render(self, visualizer):
        """모든 천간이 렌더링되는지 확인"""
        stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

        for stem in stems:
            pillars = Pillars(
                year=Pillar(stem=stem, branch="子", element="木"),
                month=Pillar(stem=stem, branch="丑", element="土"),
                day=Pillar(stem=stem, branch="寅", element="木"),
                hour=Pillar(stem=stem, branch="卯", element="木"),
            )
            result = visualizer.generate(pillars)
            assert result.startswith("data:image/png;base64,")

    def test_all_branches_render(self, visualizer):
        """모든 지지가 렌더링되는지 확인"""
        branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

        for branch in branches:
            pillars = Pillars(
                year=Pillar(stem="甲", branch=branch, element="木"),
                month=Pillar(stem="乙", branch=branch, element="木"),
                day=Pillar(stem="丙", branch=branch, element="火"),
                hour=Pillar(stem="丁", branch=branch, element="火"),
            )
            result = visualizer.generate(pillars)
            assert result.startswith("data:image/png;base64,")


class TestVisualizationAPI:
    """API 엔드포인트 테스트"""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_pillar_endpoint_success(self, client):
        """정상 요청 테스트"""
        response = client.post("/api/visualization/pillar", json={
            "pillars": {
                "year": {"stem": "庚", "branch": "午", "element": "金"},
                "month": {"stem": "辛", "branch": "巳", "element": "金"},
                "day": {"stem": "甲", "branch": "子", "element": "木"},
                "hour": {"stem": "辛", "branch": "未", "element": "金"}
            }
        })

        assert response.status_code == 200
        data = response.json()
        assert "imageBase64" in data
        assert data["imageBase64"].startswith("data:image/png;base64,")

    def test_pillar_endpoint_invalid_request(self, client):
        """잘못된 요청 테스트"""
        response = client.post("/api/visualization/pillar", json={
            "pillars": {
                "year": {"stem": "庚"}  # branch, element 누락
            }
        })

        assert response.status_code == 422  # Validation Error

    def test_pillar_endpoint_empty_body(self, client):
        """빈 요청 본문 테스트"""
        response = client.post("/api/visualization/pillar", json={})

        assert response.status_code == 422  # Validation Error

    def test_pillar_endpoint_with_all_elements(self, client):
        """모든 오행 조합 테스트"""
        response = client.post("/api/visualization/pillar", json={
            "pillars": {
                "year": {"stem": "甲", "branch": "子", "element": "木"},  # 木, 水
                "month": {"stem": "丙", "branch": "巳", "element": "火"},  # 火, 火
                "day": {"stem": "戊", "branch": "丑", "element": "土"},   # 土, 土
                "hour": {"stem": "庚", "branch": "申", "element": "金"}   # 金, 金
            }
        })

        assert response.status_code == 200
        data = response.json()
        assert data["imageBase64"].startswith("data:image/png;base64,")
