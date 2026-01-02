"""
대운 계산
- 양남음녀: 순행 (월주 다음 간지)
- 음남양녀: 역행 (월주 이전 간지)
"""
from datetime import datetime
from lunar_python import Solar

from .constants import HEAVENLY_STEMS, EARTHLY_BRANCHES, YANG_STEMS


def calculate_daewun(
    birth_dt: datetime,
    gender: str,
    count: int = 10
) -> list[dict]:
    """
    대운 계산

    Args:
        birth_dt: 양력 생년월일시
        gender: "male" 또는 "female"
        count: 대운 개수 (기본 10개 = 100년)

    Returns:
        [
            {"age": 1, "stem": "壬", "branch": "午", "startYear": 1991},
            {"age": 11, "stem": "癸", "branch": "未", "startYear": 2001},
            ...
        ]
    """
    solar = Solar.fromYmdHms(
        birth_dt.year, birth_dt.month, birth_dt.day,
        birth_dt.hour, birth_dt.minute, birth_dt.second
    )
    lunar = solar.getLunar()

    # 연간 확인 (양간/음간)
    year_ganzhi = lunar.getYearInGanZhiExact()
    year_stem = year_ganzhi[0]
    is_yang_year = year_stem in YANG_STEMS

    # 순역 판단
    # 양남음녀 → 순행 (direction = 1)
    # 음남양녀 → 역행 (direction = -1)
    if (gender == "male" and is_yang_year) or (gender == "female" and not is_yang_year):
        direction = 1  # 순행
    else:
        direction = -1  # 역행

    # 월주 가져오기 (절입 기준)
    month_ganzhi = lunar.getMonthInGanZhiExact()
    month_stem = month_ganzhi[0]
    month_branch = month_ganzhi[1]

    stem_index = HEAVENLY_STEMS.index(month_stem)
    branch_index = EARTHLY_BRANCHES.index(month_branch)

    # 대운 시작 나이 계산
    # 간략화: Phase 1에서는 1세 시작 (정밀 계산은 Phase 2)
    # 실제로는 절입까지 남은 일수/3으로 계산
    start_age = _calculate_start_age(lunar, direction)

    daewun_list = []
    for i in range(count):
        # 순/역행에 따라 간지 이동
        new_stem_idx = (stem_index + direction * (i + 1)) % 10
        new_branch_idx = (branch_index + direction * (i + 1)) % 12

        age = start_age + (i * 10)

        daewun_list.append({
            "age": age,
            "stem": HEAVENLY_STEMS[new_stem_idx],
            "branch": EARTHLY_BRANCHES[new_branch_idx],
            "startYear": birth_dt.year + age - 1,
        })

    return daewun_list


def _calculate_start_age(lunar, direction: int) -> int:
    """
    대운 시작 나이 계산 (간략화 버전)

    Phase 1: 고정값 반환 (1세)
    Phase 2: 절입까지 남은 일수/3으로 정밀 계산

    Args:
        lunar: Lunar 객체
        direction: 순행(1) 또는 역행(-1)

    Returns:
        대운 시작 나이
    """
    # Phase 1: 간략화 - 고정값 반환
    # 실제로는 절입까지 남은 일수를 계산하여 3으로 나눔
    return 1


def get_daewun_direction(year_stem: str, gender: str) -> str:
    """
    대운 방향 반환 (순행/역행)

    Args:
        year_stem: 연간 천간
        gender: "male" 또는 "female"

    Returns:
        "forward" (순행) 또는 "backward" (역행)
    """
    is_yang_year = year_stem in YANG_STEMS

    if (gender == "male" and is_yang_year) or (gender == "female" and not is_yang_year):
        return "forward"  # 순행
    else:
        return "backward"  # 역행
