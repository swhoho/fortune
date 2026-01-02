"""
사주 팔자 계산 (연주/월주/일주/시주)
lunar-python의 Exact 메서드 활용 (입춘/절입 기준)
"""
from datetime import datetime
from lunar_python import Solar

from .constants import STEM_TO_ELEMENT


def calculate_pillars(dt: datetime) -> dict:
    """
    사주 팔자 계산 (입춘/절입 기준)

    Args:
        dt: 양력 생년월일시

    Returns:
        {
            "year": {"stem": "庚", "branch": "午", "element": "金"},
            "month": {"stem": "辛", "branch": "巳", "element": "金"},
            "day": {"stem": "甲", "branch": "子", "element": "木"},
            "hour": {"stem": "辛", "branch": "未", "element": "金"}
        }
    """
    # Solar 객체 생성
    solar = Solar.fromYmdHms(
        dt.year, dt.month, dt.day,
        dt.hour, dt.minute, dt.second
    )
    lunar = solar.getLunar()

    # 연주: 입춘(立春) 기준 - getYearInGanZhiExact() 사용
    # 입춘 전이면 전년도 간지 반환
    year_ganzhi = lunar.getYearInGanZhiExact()
    year_stem = year_ganzhi[0]
    year_branch = year_ganzhi[1]

    # 월주: 절입 시각 기준 - getMonthInGanZhiExact() 사용
    # 24절기 절입 시각에 따라 월주 결정
    month_ganzhi = lunar.getMonthInGanZhiExact()
    month_stem = month_ganzhi[0]
    month_branch = month_ganzhi[1]

    # 일주: 자시(23:00) 기준 - getDayInGanZhiExact() 사용
    # 23:00 이후면 다음날 일주로 계산
    day_ganzhi = lunar.getDayInGanZhiExact()
    day_stem = day_ganzhi[0]
    day_branch = day_ganzhi[1]

    # 시주: 12시진 매핑
    time_ganzhi = lunar.getTimeInGanZhi()
    hour_stem = time_ganzhi[0]
    hour_branch = time_ganzhi[1]

    return {
        "year": _make_pillar(year_stem, year_branch),
        "month": _make_pillar(month_stem, month_branch),
        "day": _make_pillar(day_stem, day_branch),
        "hour": _make_pillar(hour_stem, hour_branch),
    }


def _make_pillar(stem: str, branch: str) -> dict:
    """
    기둥 데이터 생성

    Args:
        stem: 천간 (한자)
        branch: 지지 (한자)

    Returns:
        {"stem": "甲", "branch": "子", "element": "木"}
    """
    return {
        "stem": stem,
        "branch": branch,
        "element": STEM_TO_ELEMENT.get(stem, ""),  # 천간 기준 오행
    }


def get_year_stem(dt: datetime) -> str:
    """
    입춘 기준 연간(年干) 반환

    Args:
        dt: 양력 datetime

    Returns:
        연간 천간 (한자)
    """
    solar = Solar.fromYmdHms(
        dt.year, dt.month, dt.day,
        dt.hour, dt.minute, dt.second
    )
    lunar = solar.getLunar()
    year_ganzhi = lunar.getYearInGanZhiExact()
    return year_ganzhi[0]


def get_month_ganzhi(dt: datetime) -> tuple[str, str]:
    """
    절입 기준 월주 반환

    Args:
        dt: 양력 datetime

    Returns:
        (월간, 월지) 튜플
    """
    solar = Solar.fromYmdHms(
        dt.year, dt.month, dt.day,
        dt.hour, dt.minute, dt.second
    )
    lunar = solar.getLunar()
    month_ganzhi = lunar.getMonthInGanZhiExact()
    return month_ganzhi[0], month_ganzhi[1]
