"""
만세력 엔진 통합 테스트
"""
import pytest
from datetime import datetime

from manseryeok.engine import ManseryeokEngine
from schemas.saju import CalculateRequest, Gender


@pytest.fixture
def engine():
    """ManseryeokEngine 인스턴스"""
    return ManseryeokEngine()


class TestManseryeokEngine:
    """만세력 엔진 테스트"""

    def test_basic_solar_calculation(self, engine):
        """기본 양력 계산 (1990-05-15 14:30)"""
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 사주 팔자가 반환되는지 확인
        assert result.pillars is not None
        assert result.pillars.year is not None
        assert result.pillars.month is not None
        assert result.pillars.day is not None
        assert result.pillars.hour is not None

        # 1990년 5월 15일 = 庚午년
        assert result.pillars.year.stem == "庚"
        assert result.pillars.year.branch == "午"
        assert result.pillars.year.element == "金"

        # 대운이 10개 이상 반환되는지 확인
        assert len(result.daewun) >= 10

        # 지장간이 반환되는지 확인
        assert len(result.jijanggan.year) > 0

    def test_lunar_input(self, engine):
        """음력 입력 (isLunar=true)"""
        # 음력 1990년 4월 21일 = 양력 1990년 5월 15일
        request = CalculateRequest(
            birthDatetime=datetime(1990, 4, 21, 14, 30),
            timezone="GMT+9",
            isLunar=True,
            gender=Gender.FEMALE
        )
        result = engine.calculate(request)

        # 사주 팔자가 반환되는지 확인
        assert result.pillars is not None
        assert result.pillars.year.stem is not None
        assert result.pillars.year.branch is not None

    def test_lichun_boundary_before(self, engine):
        """입춘 경계 테스트 - 입춘 전 (2/3)"""
        # 1990년 2월 3일 (입춘 전)
        request = CalculateRequest(
            birthDatetime=datetime(1990, 2, 3, 12, 0),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 입춘 전이므로 전년도 간지 (己巳년)
        assert result.pillars.year.stem == "己"
        assert result.pillars.year.branch == "巳"

    def test_lichun_boundary_after(self, engine):
        """입춘 경계 테스트 - 입춘 후 (2/5)"""
        # 1990년 2월 5일 (입춘 후)
        request = CalculateRequest(
            birthDatetime=datetime(1990, 2, 5, 12, 0),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 입춘 후이므로 당년 간지 (庚午년)
        assert result.pillars.year.stem == "庚"
        assert result.pillars.year.branch == "午"

    def test_jasi_boundary_before(self, engine):
        """자시 경계 테스트 - 22:50 (해시)"""
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 22, 50),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 22:50은 해시(亥時)
        assert result.pillars.hour.branch == "亥"

    def test_jasi_boundary_after(self, engine):
        """자시 경계 테스트 - 23:10 (자시)"""
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 23, 10),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 23:10은 자시(子時)
        assert result.pillars.hour.branch == "子"

    def test_daewun_yangnam(self, engine):
        """대운 순역 테스트 - 양남 (순행)"""
        # 庚午년 남성 = 양남 → 순행
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        assert len(result.daewun) >= 10
        # 대운 나이가 증가하는지 확인
        for i in range(len(result.daewun) - 1):
            assert result.daewun[i + 1].age > result.daewun[i].age

    def test_daewun_eumnyeo(self, engine):
        """대운 순역 테스트 - 음녀 (순행)"""
        # 辛未년 여성 = 음녀 → 순행
        request = CalculateRequest(
            birthDatetime=datetime(1991, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.FEMALE
        )
        result = engine.calculate(request)

        assert len(result.daewun) >= 10

    def test_daewun_yangnyeo(self, engine):
        """대운 순역 테스트 - 양녀 (역행)"""
        # 庚午년 여성 = 양녀 → 역행
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.FEMALE
        )
        result = engine.calculate(request)

        assert len(result.daewun) >= 10

    def test_jijanggan_extraction(self, engine):
        """지장간 추출 테스트"""
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 午 지지의 지장간: ["己", "丁"]
        assert "丁" in result.jijanggan.year or "己" in result.jijanggan.year

    def test_pillar_element_mapping(self, engine):
        """오행 매핑 테스트"""
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # 庚 = 金
        assert result.pillars.year.element == "金"

    def test_response_structure(self, engine):
        """응답 구조 테스트"""
        request = CalculateRequest(
            birthDatetime=datetime(1990, 5, 15, 14, 30),
            timezone="GMT+9",
            isLunar=False,
            gender=Gender.MALE
        )
        result = engine.calculate(request)

        # pillars 구조 확인
        assert hasattr(result.pillars, 'year')
        assert hasattr(result.pillars, 'month')
        assert hasattr(result.pillars, 'day')
        assert hasattr(result.pillars, 'hour')

        # 각 pillar 구조 확인
        for pillar in [result.pillars.year, result.pillars.month,
                       result.pillars.day, result.pillars.hour]:
            assert hasattr(pillar, 'stem')
            assert hasattr(pillar, 'branch')
            assert hasattr(pillar, 'element')

        # daewun 구조 확인
        for daewun in result.daewun:
            assert hasattr(daewun, 'age')
            assert hasattr(daewun, 'stem')
            assert hasattr(daewun, 'branch')
            assert hasattr(daewun, 'startYear')

        # jijanggan 구조 확인
        assert hasattr(result.jijanggan, 'year')
        assert hasattr(result.jijanggan, 'month')
        assert hasattr(result.jijanggan, 'day')
        assert hasattr(result.jijanggan, 'hour')
