"""
만세력 계산 엔진 - 통합 클래스
사주 팔자, 대운, 지장간을 계산하여 반환
"""
from datetime import datetime

from schemas.saju import (
    CalculateRequest,
    CalculateResponse,
    Pillars,
    Pillar,
    DaewunItem,
    Jijanggan,
)
from .calendar import get_solar_from_lunar_datetime
from .pillars import calculate_pillars
from .daewun import calculate_daewun, calculate_daewun_with_ten_god
from .jijanggan import extract_jijanggan


class ManseryeokEngine:
    """만세력 계산 엔진"""

    def calculate(self, request: CalculateRequest) -> CalculateResponse:
        """
        사주 팔자, 대운, 지장간 계산

        Args:
            request: 계산 요청 데이터
                - birthDatetime: 생년월일시
                - timezone: 시간대
                - isLunar: 음력 여부
                - gender: 성별

        Returns:
            계산 결과 응답
                - pillars: 사주 팔자 (연/월/일/시주)
                - daewun: 대운 목록 (10개)
                - jijanggan: 지장간
        """
        # 1. 날짜시간 처리 (음력인 경우 양력으로 변환)
        birth_dt = self._process_datetime(request)

        # 2. 사주 팔자 계산 (입춘/절입 기준)
        pillars_data = calculate_pillars(birth_dt)

        # 3. 일간 추출 (십신 계산용)
        day_stem = pillars_data["day"]["stem"]

        # 4. 대운 계산 (십신 정보 포함)
        daewun_data = calculate_daewun_with_ten_god(
            birth_dt, request.gender.value, day_stem
        )

        # 5. 지장간 추출
        jijanggan_data = extract_jijanggan(pillars_data)

        # 5. 응답 모델 생성
        return CalculateResponse(
            pillars=Pillars(
                year=Pillar(**pillars_data["year"]),
                month=Pillar(**pillars_data["month"]),
                day=Pillar(**pillars_data["day"]),
                hour=Pillar(**pillars_data["hour"]),
            ),
            daewun=[DaewunItem(**d) for d in daewun_data],
            jijanggan=Jijanggan(**jijanggan_data),
        )

    def _process_datetime(self, request: CalculateRequest) -> datetime:
        """
        요청 데이터에서 양력 datetime 추출
        음력인 경우 양력으로 변환

        Args:
            request: 계산 요청 데이터

        Returns:
            양력 datetime 객체
        """
        dt = request.birthDatetime

        if request.isLunar:
            # 음력 → 양력 변환
            return get_solar_from_lunar_datetime(
                dt.year, dt.month, dt.day,
                dt.hour, dt.minute, dt.second
            )

        # 양력은 그대로 사용
        return dt
