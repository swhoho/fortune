"""
지장간(支藏干) 추출
각 지지에 숨어있는 천간들
"""
from .constants import JIJANGGAN_TABLE


def extract_jijanggan(pillars: dict) -> dict:
    """
    사주 팔자에서 지장간 추출

    Args:
        pillars: 사주 팔자 데이터
            {
                "year": {"stem": "庚", "branch": "午", "element": "金"},
                "month": {"stem": "辛", "branch": "巳", "element": "金"},
                "day": {"stem": "甲", "branch": "子", "element": "木"},
                "hour": {"stem": "辛", "branch": "未", "element": "金"}
            }

    Returns:
        {
            "year": ["己", "丁"],
            "month": ["戊", "庚", "丙"],
            "day": ["癸"],
            "hour": ["丁", "乙", "己"]
        }
    """
    return {
        "year": get_jijanggan(pillars["year"]["branch"]),
        "month": get_jijanggan(pillars["month"]["branch"]),
        "day": get_jijanggan(pillars["day"]["branch"]),
        "hour": get_jijanggan(pillars["hour"]["branch"]),
    }


def get_jijanggan(branch: str) -> list[str]:
    """
    지지에서 지장간 추출

    Args:
        branch: 지지 (한자)

    Returns:
        지장간 리스트 (여기/중기/정기 순서)

    Examples:
        >>> get_jijanggan("子")
        ["癸"]
        >>> get_jijanggan("丑")
        ["癸", "辛", "己"]
    """
    return JIJANGGAN_TABLE.get(branch, [])
