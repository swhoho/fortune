"""
십신 계산 함수 테스트
"""
import pytest
from datetime import datetime
from manseryeok.daewun import (
    get_ten_god_relation,
    get_ten_god_type,
    calculate_daewun_with_ten_god,
)


class TestTenGodRelation:
    """십신 관계 계산 테스트"""

    def test_same_element_same_polarity_is_bigyeon(self):
        """같은 오행 같은 음양 = 비견"""
        assert get_ten_god_relation("甲", "甲") == "비견"  # 목-목 양-양
        assert get_ten_god_relation("乙", "乙") == "비견"  # 목-목 음-음
        assert get_ten_god_relation("丙", "丙") == "비견"  # 화-화 양-양
        assert get_ten_god_relation("壬", "壬") == "비견"  # 수-수 양-양

    def test_same_element_diff_polarity_is_geopjae(self):
        """같은 오행 다른 음양 = 겁재"""
        assert get_ten_god_relation("甲", "乙") == "겁재"  # 목-목 양-음
        assert get_ten_god_relation("乙", "甲") == "겁재"  # 목-목 음-양
        assert get_ten_god_relation("丙", "丁") == "겁재"  # 화-화 양-음
        assert get_ten_god_relation("壬", "癸") == "겁재"  # 수-수 양-음

    def test_i_generate_same_polarity_is_siksin(self):
        """내가 생하는 오행 같은 음양 = 식신"""
        # 목생화: 甲(양목) → 丙(양화) = 식신
        assert get_ten_god_relation("甲", "丙") == "식신"
        # 화생토: 丙(양화) → 戊(양토) = 식신
        assert get_ten_god_relation("丙", "戊") == "식신"
        # 수생목: 壬(양수) → 甲(양목) = 식신
        assert get_ten_god_relation("壬", "甲") == "식신"

    def test_i_generate_diff_polarity_is_sanggwan(self):
        """내가 생하는 오행 다른 음양 = 상관"""
        # 목생화: 甲(양목) → 丁(음화) = 상관
        assert get_ten_god_relation("甲", "丁") == "상관"
        # 화생토: 丙(양화) → 己(음토) = 상관
        assert get_ten_god_relation("丙", "己") == "상관"

    def test_i_overcome_same_polarity_is_pyeonjae(self):
        """내가 극하는 오행 같은 음양 = 편재"""
        # 목극토: 甲(양목) → 戊(양토) = 편재
        assert get_ten_god_relation("甲", "戊") == "편재"
        # 화극금: 丙(양화) → 庚(양금) = 편재
        assert get_ten_god_relation("丙", "庚") == "편재"

    def test_i_overcome_diff_polarity_is_jeongjae(self):
        """내가 극하는 오행 다른 음양 = 정재"""
        # 목극토: 甲(양목) → 己(음토) = 정재
        assert get_ten_god_relation("甲", "己") == "정재"
        # 화극금: 丙(양화) → 辛(음금) = 정재
        assert get_ten_god_relation("丙", "辛") == "정재"

    def test_overcomes_me_same_polarity_is_pyeongwan(self):
        """나를 극하는 오행 같은 음양 = 편관"""
        # 금극목: 甲(양목) ← 庚(양금) = 편관
        assert get_ten_god_relation("甲", "庚") == "편관"
        # 수극화: 丙(양화) ← 壬(양수) = 편관
        assert get_ten_god_relation("丙", "壬") == "편관"

    def test_overcomes_me_diff_polarity_is_jeonggwan(self):
        """나를 극하는 오행 다른 음양 = 정관"""
        # 금극목: 甲(양목) ← 辛(음금) = 정관
        assert get_ten_god_relation("甲", "辛") == "정관"
        # 수극화: 丙(양화) ← 癸(음수) = 정관
        assert get_ten_god_relation("丙", "癸") == "정관"

    def test_generates_me_same_polarity_is_pyeonin(self):
        """나를 생하는 오행 같은 음양 = 편인"""
        # 수생목: 甲(양목) ← 壬(양수) = 편인
        assert get_ten_god_relation("甲", "壬") == "편인"
        # 목생화: 丙(양화) ← 甲(양목) = 편인
        assert get_ten_god_relation("丙", "甲") == "편인"

    def test_generates_me_diff_polarity_is_jeongin(self):
        """나를 생하는 오행 다른 음양 = 정인"""
        # 수생목: 甲(양목) ← 癸(음수) = 정인
        assert get_ten_god_relation("甲", "癸") == "정인"
        # 목생화: 丙(양화) ← 乙(음목) = 정인
        assert get_ten_god_relation("丙", "乙") == "정인"


class TestTenGodType:
    """십신 유형 테스트"""

    def test_bigyeop_type(self):
        """비겁운 유형"""
        assert get_ten_god_type("비견") == "비겁운"
        assert get_ten_god_type("겁재") == "비겁운"

    def test_siksang_type(self):
        """식상운 유형"""
        assert get_ten_god_type("식신") == "식상운"
        assert get_ten_god_type("상관") == "식상운"

    def test_jaeseong_type(self):
        """재성운 유형"""
        assert get_ten_god_type("정재") == "재성운"
        assert get_ten_god_type("편재") == "재성운"

    def test_gwanseong_type(self):
        """관성운 유형"""
        assert get_ten_god_type("정관") == "관성운"
        assert get_ten_god_type("편관") == "관성운"

    def test_inseong_type(self):
        """인성운 유형"""
        assert get_ten_god_type("정인") == "인성운"
        assert get_ten_god_type("편인") == "인성운"


class TestDaewunWithTenGod:
    """대운 계산 (십신 포함) 테스트"""

    def test_calculate_daewun_with_ten_god_basic(self):
        """대운 계산 기본 테스트"""
        # 1990년 7월 15일 오전 10시 남자 (일간: 甲 가정)
        birth_dt = datetime(1990, 7, 15, 10, 0, 0)
        day_stem = "甲"  # 일간

        result = calculate_daewun_with_ten_god(birth_dt, "male", day_stem, count=5)

        # 결과 구조 검증
        assert len(result) == 5
        for item in result:
            assert "age" in item
            assert "endAge" in item
            assert "stem" in item
            assert "branch" in item
            assert "startYear" in item
            assert "tenGod" in item
            assert "tenGodType" in item
            # endAge는 age + 9
            assert item["endAge"] == item["age"] + 9
            # tenGod이 유효한 십신인지 확인
            assert item["tenGod"] in [
                "비견", "겁재", "식신", "상관",
                "정재", "편재", "정관", "편관",
                "정인", "편인", "알수없음"
            ]
            # tenGodType이 유효한 유형인지 확인
            assert item["tenGodType"] in [
                "비겁운", "식상운", "재성운", "관성운", "인성운", "알수없음"
            ]

    def test_calculate_daewun_with_ten_god_all_stems(self):
        """모든 일간에 대해 대운 계산 테스트"""
        birth_dt = datetime(1990, 7, 15, 10, 0, 0)
        stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

        for day_stem in stems:
            result = calculate_daewun_with_ten_god(birth_dt, "male", day_stem, count=3)
            assert len(result) == 3
            for item in result:
                # 십신이 계산되었는지 확인
                assert item["tenGod"] != "알수없음"
                assert item["tenGodType"] != "알수없음"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
