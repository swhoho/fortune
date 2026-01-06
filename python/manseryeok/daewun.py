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
    대운 시작 나이 정밀 계산 (절입 기반)

    명리학 원칙:
    - 순행(양남/음녀): 다음 절입까지 남은 일수 / 3 = 대운 시작 나이
    - 역행(음남/양녀): 이전 절입부터 경과한 일수 / 3 = 대운 시작 나이
    - 3일 = 1년 (1개월 = 10년 대운)

    Args:
        lunar: Lunar 객체
        direction: 순행(1) 또는 역행(-1)

    Returns:
        대운 시작 나이 (1~10 사이)
    """
    birth_solar = lunar.getSolar()

    if direction == 1:  # 순행: 다음 절입까지 남은 일수
        next_jie = lunar.getNextJie()
        target_solar = next_jie.getSolar()
    else:  # 역행: 이전 절입부터 경과한 일수
        prev_jie = lunar.getPrevJie()
        target_solar = prev_jie.getSolar()

    # Julian Day를 이용한 정확한 일수 차이 계산
    days_diff = abs(target_solar.getJulianDay() - birth_solar.getJulianDay())

    # 3일 = 1년, 반올림
    start_age = round(days_diff / 3)

    # 최소 1세, 최대 10세로 제한
    return max(1, min(10, start_age))


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


# ============================================
# 십신 계산 (일간 기준)
# ============================================

# 오행 상생 관계: 나를 생하는 오행 (인성)
ELEMENT_GENERATES_ME = {
    "木": "水",  # 수생목
    "火": "木",  # 목생화
    "土": "火",  # 화생토
    "金": "土",  # 토생금
    "水": "金",  # 금생수
}

# 오행 상생 관계: 내가 생하는 오행 (식상)
I_GENERATE_ELEMENT = {
    "木": "火",  # 목생화
    "火": "土",  # 화생토
    "土": "金",  # 토생금
    "金": "水",  # 금생수
    "水": "木",  # 수생목
}

# 오행 상극 관계: 내가 극하는 오행 (재성)
I_OVERCOME_ELEMENT = {
    "木": "土",  # 목극토
    "火": "金",  # 화극금
    "土": "水",  # 토극수
    "金": "木",  # 금극목
    "水": "火",  # 수극화
}

# 오행 상극 관계: 나를 극하는 오행 (관성)
ELEMENT_OVERCOMES_ME = {
    "木": "金",  # 금극목
    "火": "水",  # 수극화
    "土": "木",  # 목극토
    "金": "火",  # 화극금
    "水": "土",  # 토극수
}

# 천간 → 오행 매핑
STEM_TO_ELEMENT = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水",
}

# 십신 유형 매핑
TEN_GOD_TYPE_MAP = {
    "비견": "비겁운",
    "겁재": "비겁운",
    "식신": "식상운",
    "상관": "식상운",
    "정재": "재성운",
    "편재": "재성운",
    "정관": "관성운",
    "편관": "관성운",
    "정인": "인성운",
    "편인": "인성운",
}


def get_ten_god_relation(day_stem: str, target_stem: str) -> str:
    """
    일간과 대상 천간 사이의 십신 관계를 계산

    십신 계산 로직:
    - 같은 오행 같은 음양 = 비견, 같은 오행 다른 음양 = 겁재
    - 내가 생하는 오행 같은 음양 = 식신, 다른 음양 = 상관
    - 내가 극하는 오행 같은 음양 = 편재, 다른 음양 = 정재
    - 나를 극하는 오행 같은 음양 = 편관, 다른 음양 = 정관
    - 나를 생하는 오행 같은 음양 = 편인, 다른 음양 = 정인

    Args:
        day_stem: 일간 (甲~癸)
        target_stem: 대상 천간 (甲~癸)

    Returns:
        십신 (비견, 겁재, 식신, 상관, 정재, 편재, 정관, 편관, 정인, 편인)
    """
    if day_stem not in STEM_TO_ELEMENT or target_stem not in STEM_TO_ELEMENT:
        return "알수없음"

    day_element = STEM_TO_ELEMENT[day_stem]
    target_element = STEM_TO_ELEMENT[target_stem]

    # 음양 판별 (양간: 甲丙戊庚壬)
    is_day_yang = day_stem in YANG_STEMS
    is_target_yang = target_stem in YANG_STEMS
    same_polarity = is_day_yang == is_target_yang

    # 1. 같은 오행 (비겁)
    if day_element == target_element:
        return "비견" if same_polarity else "겁재"

    # 2. 내가 생하는 오행 (식상)
    if I_GENERATE_ELEMENT[day_element] == target_element:
        return "식신" if same_polarity else "상관"

    # 3. 내가 극하는 오행 (재성)
    if I_OVERCOME_ELEMENT[day_element] == target_element:
        return "편재" if same_polarity else "정재"

    # 4. 나를 극하는 오행 (관성)
    if ELEMENT_OVERCOMES_ME[day_element] == target_element:
        return "편관" if same_polarity else "정관"

    # 5. 나를 생하는 오행 (인성)
    if ELEMENT_GENERATES_ME[day_element] == target_element:
        return "편인" if same_polarity else "정인"

    return "알수없음"


def get_ten_god_type(ten_god: str) -> str:
    """
    십신에서 십신 유형(운) 반환

    Args:
        ten_god: 십신 (비견, 겁재, 식신, 상관, 정재, 편재, 정관, 편관, 정인, 편인)

    Returns:
        십신 유형 (비겁운, 식상운, 재성운, 관성운, 인성운)
    """
    return TEN_GOD_TYPE_MAP.get(ten_god, "알수없음")


def calculate_daewun_with_ten_god(
    birth_dt: datetime,
    gender: str,
    day_stem: str,
    count: int = 10
) -> list[dict]:
    """
    대운 계산 (십신 + favorablePercent 포함)

    Args:
        birth_dt: 양력 생년월일시
        gender: "male" 또는 "female"
        day_stem: 일간 (甲~癸)
        count: 대운 개수 (기본 10개 = 100년)

    Returns:
        [
            {
                "age": 7,
                "endAge": 16,
                "stem": "壬",
                "branch": "午",
                "startYear": 1997,
                "startDate": "1997-07-26",
                "tenGod": "편인",
                "tenGodType": "인성운",
                "favorablePercent": 55,
                "unfavorablePercent": 45
            },
            ...
        ]
    """
    # 기본 대운 계산
    basic_daewun = calculate_daewun(birth_dt, gender, count)

    # 십신 정보 + favorablePercent 추가
    result = []
    for dw in basic_daewun:
        ten_god = get_ten_god_relation(day_stem, dw["stem"])
        ten_god_type = get_ten_god_type(ten_god)

        # favorablePercent 계산
        favorable = _calculate_favorable_percent(ten_god, dw["branch"])

        result.append({
            "age": dw["age"],
            "endAge": dw["age"] + 9,
            "stem": dw["stem"],
            "branch": dw["branch"],
            "startYear": dw["startYear"],
            "startDate": f"{dw['startYear']}-01-01",  # TODO: 정확한 절입일 계산
            "tenGod": ten_god,
            "tenGodType": ten_god_type,
            "favorablePercent": favorable,
            "unfavorablePercent": 100 - favorable,
        })

    return result


# ============================================
# 대운 순풍운 비율 계산 (favorablePercent)
# ============================================

# 십신별 기본 순풍운 비율
# 정통 명리학에서 십신의 길흉 해석 기반
TEN_GOD_BASE_FAVORABLE = {
    # 인성 (나를 생함) - 보호, 학습, 안정
    "정인": 68,  # 바른 보호와 학습운
    "편인": 52,  # 독특한 기술, 단 도식(倒食) 주의

    # 비겁 (동류) - 자립, 경쟁
    "비견": 55,  # 동료, 경쟁자
    "겁재": 42,  # 재물 손실 주의, 경쟁 심화

    # 식상 (내가 생함) - 표현, 창조
    "식신": 70,  # 복록, 재능 발휘
    "상관": 45,  # 창의적이나 관성 충돌 주의

    # 재성 (내가 극함) - 재물, 부친
    "정재": 65,  # 안정적 재물
    "편재": 58,  # 투자 기회, 변동성

    # 관성 (나를 극함) - 명예, 직장
    "정관": 72,  # 승진, 안정, 명예
    "편관": 40,  # 도전과 압박, 칠살(七殺) 주의
}

# 지지별 보정값 (대운 지지의 영향)
BRANCH_FAVORABLE_MODIFIER = {
    # 사계절 중심 지지
    "子": 0,   # 수기(水氣) 중심
    "午": 2,   # 화기(火氣) 양명
    "卯": 3,   # 목기(木氣) 생장
    "酉": 1,   # 금기(金氣) 수렴

    # 계절 전환 지지 (고지)
    "丑": -2,  # 습토, 차가움
    "辰": 1,   # 양토, 봄기운
    "未": 3,   # 양토, 여름 열기
    "戌": 0,   # 양토, 가을 수렴

    # 생지
    "寅": 5,   # 삼양(三陽) 시작, 활력
    "巳": 2,   # 화기 강해짐
    "申": 1,   # 금기, 변화
    "亥": -1,  # 수기, 저장
}


def _calculate_favorable_percent(ten_god: str, branch: str) -> int:
    """
    대운의 순풍운 비율(favorablePercent) 계산

    계산 공식:
    favorablePercent = 십신기본점수 + 지지보정값

    Args:
        ten_god: 대운 천간의 십신
        branch: 대운 지지

    Returns:
        순풍운 비율 (20~85 범위)
    """
    # 기본 점수
    base = TEN_GOD_BASE_FAVORABLE.get(ten_god, 50)

    # 지지 보정
    modifier = BRANCH_FAVORABLE_MODIFIER.get(branch, 0)

    # 최종 점수 (20~85 범위로 클램프)
    favorable = base + modifier
    return max(20, min(85, favorable))
