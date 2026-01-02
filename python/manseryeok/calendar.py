"""
음력/양력 변환 및 시간대 처리
lunar-python 라이브러리 래퍼
"""
from datetime import datetime
from lunar_python import Solar, Lunar


def lunar_to_solar(
    year: int,
    month: int,
    day: int,
    is_leap_month: bool = False
) -> datetime:
    """
    음력 날짜를 양력으로 변환

    Args:
        year: 음력 연도
        month: 음력 월
        day: 음력 일
        is_leap_month: 윤달 여부

    Returns:
        양력 datetime 객체
    """
    if is_leap_month:
        # 윤달인 경우 음수 월로 표시
        lunar = Lunar.fromYmd(year, -month, day)
    else:
        lunar = Lunar.fromYmd(year, month, day)

    solar = lunar.getSolar()
    return datetime(solar.getYear(), solar.getMonth(), solar.getDay())


def get_solar_from_lunar_datetime(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    second: int = 0,
    is_leap_month: bool = False
) -> datetime:
    """
    음력 날짜시간을 양력으로 변환

    Args:
        year: 음력 연도
        month: 음력 월
        day: 음력 일
        hour: 시
        minute: 분
        second: 초
        is_leap_month: 윤달 여부

    Returns:
        양력 datetime 객체 (시분초 포함)
    """
    base_date = lunar_to_solar(year, month, day, is_leap_month)
    return datetime(
        base_date.year, base_date.month, base_date.day,
        hour, minute, second
    )


def parse_gmt_offset(timezone: str) -> int:
    """
    GMT 오프셋 문자열을 시간 단위로 파싱

    Args:
        timezone: "GMT+9", "GMT-5" 등

    Returns:
        UTC 대비 시간 단위 오프셋

    Examples:
        >>> parse_gmt_offset("GMT+9")
        9
        >>> parse_gmt_offset("GMT-5")
        -5
    """
    if not timezone.startswith("GMT"):
        return 9  # 기본값: 한국 시간

    offset_str = timezone[3:]
    if not offset_str:
        return 0

    try:
        if offset_str.startswith("+"):
            return int(offset_str[1:])
        elif offset_str.startswith("-"):
            return -int(offset_str[1:])
        else:
            return int(offset_str)
    except ValueError:
        return 9  # 파싱 실패 시 기본값


def get_solar_object(dt: datetime) -> Solar:
    """
    datetime에서 lunar-python Solar 객체 생성

    Args:
        dt: 양력 datetime

    Returns:
        Solar 객체
    """
    return Solar.fromYmdHms(
        dt.year, dt.month, dt.day,
        dt.hour, dt.minute, dt.second
    )
