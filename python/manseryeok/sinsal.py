"""
12신살(十二神煞) 분석 모듈
년지/일지 기준 신살 판별

명리학 원칙:
- 길신(吉神): 천을귀인, 문창성, 천의성 등 - 도움/행운
- 흉신(凶神): 도화살, 역마살, 공망 등 - 주의 필요
"""
from typing import List, Dict
from dataclasses import dataclass
from enum import Enum


class SinsalType(Enum):
    """신살 유형"""
    # 길신 (吉神)
    CHEON_EUL_GWIIN = "천을귀인"      # 天乙貴人 - 귀인의 도움
    CHEON_DOK_GWIIN = "천덕귀인"      # 天德貴人 - 하늘의 덕
    WOL_DOK_GWIIN = "월덕귀인"        # 月德貴人 - 달의 덕
    MUN_CHANG = "문창성"              # 文昌星 - 학문, 시험운
    CHEON_EUI = "천의성"              # 天醫星 - 의료, 치유

    # 중립/양면 (상황에 따라 길흉)
    GEUN_ROK = "건록"                 # 建祿 - 재물복
    YANGIN = "양인"                   # 羊刃 - 결단력 (凶吉 양면)

    # 흉신 (凶神) - 주의 필요
    GONG_MANG = "공망"                # 空亡 - 허무, 실패
    BAEK_HO = "백호"                  # 白虎 - 혈광, 사고
    DO_HWA = "도화"                   # 桃花 - 이성, 염문
    YEOK_MA = "역마"                  # 驛馬 - 이동, 변동
    HWA_GAE = "화개"                  # 華蓋 - 고독, 예술
    GWOE_GANG = "괴강"                # 魁罡 - 권력, 강인함


@dataclass
class Sinsal:
    """신살 정보"""
    type: SinsalType
    source: str          # 근거 (일간/년지/일지)
    position: str        # 발견 위치 (year/month/day/hour)
    weight: float        # 영향력 (0.0-1.0)
    description: str     # 해석
    is_lucky: bool       # 길신 여부


# ============================================
# 천을귀인 테이블 (일간 → 귀인 지지)
# 가장 귀한 신살, 위기 시 도움
# ============================================
CHEON_EUL_TABLE = {
    "甲": ["丑", "未"],
    "乙": ["子", "申"],
    "丙": ["酉", "亥"],
    "丁": ["酉", "亥"],
    "戊": ["丑", "未"],
    "己": ["子", "申"],
    "庚": ["丑", "未"],
    "辛": ["寅", "午"],
    "壬": ["卯", "巳"],
    "癸": ["卯", "巳"],
}

# ============================================
# 문창성 테이블 (일간 → 문창 지지)
# 학문, 시험, 자격증 운
# ============================================
MUN_CHANG_TABLE = {
    "甲": "巳",
    "乙": "午",
    "丙": "申",
    "丁": "酉",
    "戊": "申",
    "己": "酉",
    "庚": "亥",
    "辛": "子",
    "壬": "寅",
    "癸": "卯",
}

# ============================================
# 도화살 테이블 (년지/일지 → 도화 지지)
# 매력, 이성, 연예/예술 (과하면 염문)
# ============================================
DO_HWA_TABLE = {
    "寅": "卯", "午": "卯", "戌": "卯",  # 인오술 → 묘
    "申": "酉", "子": "酉", "辰": "酉",  # 신자진 → 유
    "巳": "午", "酉": "午", "丑": "午",  # 사유축 → 오
    "亥": "子", "卯": "子", "未": "子",  # 해묘미 → 자
}

# ============================================
# 역마살 테이블 (년지/일지 → 역마 지지)
# 이동, 변화, 해외, 출장
# ============================================
YEOK_MA_TABLE = {
    "寅": "申", "午": "申", "戌": "申",
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "亥": "巳", "卯": "巳", "未": "巳",
}

# ============================================
# 화개살 테이블 (년지/일지 → 화개 지지)
# 종교, 철학, 예술, 고독
# ============================================
HWA_GAE_TABLE = {
    "寅": "戌", "午": "戌", "戌": "戌",
    "申": "辰", "子": "辰", "辰": "辰",
    "巳": "丑", "酉": "丑", "丑": "丑",
    "亥": "未", "卯": "未", "未": "未",
}

# ============================================
# 괴강 테이블 (일주 → 괴강 여부)
# 庚辰, 庚戌, 壬辰, 壬戌
# 권력, 결단력, 카리스마 (과하면 고집/독선)
# ============================================
GWOE_GANG_DAYS = ["庚辰", "庚戌", "壬辰", "壬戌"]

# ============================================
# 양인 테이블 (일간 → 양인 지지)
# 결단력, 추진력 (과하면 공격적/손재)
# ============================================
YANGIN_TABLE = {
    "甲": "卯",
    "丙": "午",
    "戊": "午",
    "庚": "酉",
    "壬": "子",
}

# ============================================
# 건록 테이블 (일간 → 건록 지지)
# 안정적 재물, 직업운
# ============================================
GEUN_ROK_TABLE = {
    "甲": "寅",
    "乙": "卯",
    "丙": "巳",
    "丁": "午",
    "戊": "巳",
    "己": "午",
    "庚": "申",
    "辛": "酉",
    "壬": "亥",
    "癸": "子",
}

# ============================================
# 공망 테이블 (일주 갑자순 → 공망 지지)
# 10일 순(旬)에서 빠진 2개의 지지
# ============================================
GONG_MANG_TABLE = {
    # 甲子旬 → 戌亥 공망
    "甲子": ["戌", "亥"], "乙丑": ["戌", "亥"], "丙寅": ["戌", "亥"],
    "丁卯": ["戌", "亥"], "戊辰": ["戌", "亥"], "己巳": ["戌", "亥"],
    "庚午": ["戌", "亥"], "辛未": ["戌", "亥"], "壬申": ["戌", "亥"],
    "癸酉": ["戌", "亥"],
    # 甲戌旬 → 申酉 공망
    "甲戌": ["申", "酉"], "乙亥": ["申", "酉"], "丙子": ["申", "酉"],
    "丁丑": ["申", "酉"], "戊寅": ["申", "酉"], "己卯": ["申", "酉"],
    "庚辰": ["申", "酉"], "辛巳": ["申", "酉"], "壬午": ["申", "酉"],
    "癸未": ["申", "酉"],
    # 甲申旬 → 午未 공망
    "甲申": ["午", "未"], "乙酉": ["午", "未"], "丙戌": ["午", "未"],
    "丁亥": ["午", "未"], "戊子": ["午", "未"], "己丑": ["午", "未"],
    "庚寅": ["午", "未"], "辛卯": ["午", "未"], "壬辰": ["午", "未"],
    "癸巳": ["午", "未"],
    # 甲午旬 → 辰巳 공망
    "甲午": ["辰", "巳"], "乙未": ["辰", "巳"], "丙申": ["辰", "巳"],
    "丁酉": ["辰", "巳"], "戊戌": ["辰", "巳"], "己亥": ["辰", "巳"],
    "庚子": ["辰", "巳"], "辛丑": ["辰", "巳"], "壬寅": ["辰", "巳"],
    "癸卯": ["辰", "巳"],
    # 甲辰旬 → 寅卯 공망
    "甲辰": ["寅", "卯"], "乙巳": ["寅", "卯"], "丙午": ["寅", "卯"],
    "丁未": ["寅", "卯"], "戊申": ["寅", "卯"], "己酉": ["寅", "卯"],
    "庚戌": ["寅", "卯"], "辛亥": ["寅", "卯"], "壬子": ["寅", "卯"],
    "癸丑": ["寅", "卯"],
    # 甲寅旬 → 子丑 공망
    "甲寅": ["子", "丑"], "乙卯": ["子", "丑"], "丙辰": ["子", "丑"],
    "丁巳": ["子", "丑"], "戊午": ["子", "丑"], "己未": ["子", "丑"],
    "庚申": ["子", "丑"], "辛酉": ["子", "丑"], "壬戌": ["子", "丑"],
    "癸亥": ["子", "丑"],
}

# 위치 라벨
POSITION_LABELS = {
    "year": "년지",
    "month": "월지",
    "day": "일지",
    "hour": "시지",
}


def analyze_sinsal(pillars: dict) -> List[Sinsal]:
    """
    사주 팔자에서 신살 분석

    Args:
        pillars: 사주 팔자 데이터
            {
                "year": {"stem": "庚", "branch": "午", ...},
                "month": {"stem": "辛", "branch": "巳", ...},
                "day": {"stem": "甲", "branch": "子", ...},
                "hour": {"stem": "辛", "branch": "未", ...},
            }

    Returns:
        발견된 신살 목록
    """
    sinsals = []

    day_master = pillars["day"]["stem"]
    day_ganzhi = day_master + pillars["day"]["branch"]
    year_branch = pillars["year"]["branch"]
    day_branch = pillars["day"]["branch"]

    all_branches = {
        "year": pillars["year"]["branch"],
        "month": pillars["month"]["branch"],
        "day": pillars["day"]["branch"],
        "hour": pillars["hour"]["branch"],
    }

    # 1. 천을귀인 확인 (일간 기준)
    gwiin_branches = CHEON_EUL_TABLE.get(day_master, [])
    for pos, branch in all_branches.items():
        if branch in gwiin_branches:
            sinsals.append(Sinsal(
                type=SinsalType.CHEON_EUL_GWIIN,
                source=f"일간 {day_master}",
                position=pos,
                weight=0.9,
                description=f"{POSITION_LABELS[pos]} {branch}에 천을귀인 - 귀인의 도움을 받음",
                is_lucky=True
            ))

    # 2. 문창성 확인 (일간 기준)
    mun_chang = MUN_CHANG_TABLE.get(day_master)
    if mun_chang:
        for pos, branch in all_branches.items():
            if branch == mun_chang:
                sinsals.append(Sinsal(
                    type=SinsalType.MUN_CHANG,
                    source=f"일간 {day_master}",
                    position=pos,
                    weight=0.7,
                    description=f"{POSITION_LABELS[pos]} {branch}에 문창성 - 학문/시험 유리",
                    is_lucky=True
                ))

    # 3. 도화살 확인 (년지/일지 기준)
    for base_key in ["year", "day"]:
        base_branch = all_branches[base_key]
        do_hwa = DO_HWA_TABLE.get(base_branch)
        if do_hwa:
            for pos, branch in all_branches.items():
                if branch == do_hwa:
                    sinsals.append(Sinsal(
                        type=SinsalType.DO_HWA,
                        source=f"{POSITION_LABELS[base_key]} {base_branch}",
                        position=pos,
                        weight=0.7,
                        description=f"{POSITION_LABELS[pos]} {branch}에 도화 - 매력적이나 이성 문제 주의",
                        is_lucky=False
                    ))
                    break  # 중복 방지

    # 4. 역마살 확인 (년지/일지 기준)
    for base_key in ["year", "day"]:
        base_branch = all_branches[base_key]
        yeok_ma = YEOK_MA_TABLE.get(base_branch)
        if yeok_ma:
            for pos, branch in all_branches.items():
                if branch == yeok_ma:
                    sinsals.append(Sinsal(
                        type=SinsalType.YEOK_MA,
                        source=f"{POSITION_LABELS[base_key]} {base_branch}",
                        position=pos,
                        weight=0.6,
                        description=f"{POSITION_LABELS[pos]} {branch}에 역마 - 이동/변화가 많음",
                        is_lucky=False
                    ))
                    break

    # 5. 화개살 확인 (년지/일지 기준)
    for base_key in ["year", "day"]:
        base_branch = all_branches[base_key]
        hwa_gae = HWA_GAE_TABLE.get(base_branch)
        if hwa_gae:
            for pos, branch in all_branches.items():
                if branch == hwa_gae:
                    sinsals.append(Sinsal(
                        type=SinsalType.HWA_GAE,
                        source=f"{POSITION_LABELS[base_key]} {base_branch}",
                        position=pos,
                        weight=0.5,
                        description=f"{POSITION_LABELS[pos]} {branch}에 화개 - 예술적 재능, 종교/철학 관심",
                        is_lucky=False
                    ))
                    break

    # 6. 공망 확인 (일주 기준)
    gong_mang = GONG_MANG_TABLE.get(day_ganzhi, [])
    for pos, branch in all_branches.items():
        if branch in gong_mang:
            sinsals.append(Sinsal(
                type=SinsalType.GONG_MANG,
                source=f"일주 {day_ganzhi}",
                position=pos,
                weight=0.6,
                description=f"{POSITION_LABELS[pos]} {branch}이 공망 - 해당 기둥 작용 약화",
                is_lucky=False
            ))

    # 7. 괴강 확인 (일주)
    if day_ganzhi in GWOE_GANG_DAYS:
        sinsals.append(Sinsal(
            type=SinsalType.GWOE_GANG,
            source=f"일주 {day_ganzhi}",
            position="day",
            weight=0.8,
            description="일주가 괴강 - 권력/결단력, 과하면 독선",
            is_lucky=True  # 양면성 있지만 기본적으로 길신
        ))

    # 8. 양인 확인 (일간 기준)
    yangin = YANGIN_TABLE.get(day_master)
    if yangin:
        for pos, branch in all_branches.items():
            if branch == yangin:
                sinsals.append(Sinsal(
                    type=SinsalType.YANGIN,
                    source=f"일간 {day_master}",
                    position=pos,
                    weight=0.7,
                    description=f"{POSITION_LABELS[pos]} {branch}에 양인 - 결단력, 과하면 손재",
                    is_lucky=False
                ))

    # 9. 건록 확인 (일간 기준)
    geun_rok = GEUN_ROK_TABLE.get(day_master)
    if geun_rok:
        for pos, branch in all_branches.items():
            if branch == geun_rok:
                sinsals.append(Sinsal(
                    type=SinsalType.GEUN_ROK,
                    source=f"일간 {day_master}",
                    position=pos,
                    weight=0.8,
                    description=f"{POSITION_LABELS[pos]} {branch}에 건록 - 안정적 재물/직업운",
                    is_lucky=True
                ))

    return sinsals


def format_sinsal_summary(sinsals: List[Sinsal], language: str = 'ko') -> str:
    """
    신살 요약 문자열 생성 (프롬프트용)

    Args:
        sinsals: 신살 목록
        language: 언어 코드

    Returns:
        요약 문자열
    """
    if not sinsals:
        return "특이 신살 없음"

    lucky = [s for s in sinsals if s.is_lucky]
    unlucky = [s for s in sinsals if not s.is_lucky]

    parts = []
    if lucky:
        items = [s.type.value for s in lucky]
        parts.append("길신: " + ", ".join(items))
    if unlucky:
        items = [s.type.value for s in unlucky]
        parts.append("흉신/중립: " + ", ".join(items))

    return " | ".join(parts)


def sinsal_to_dict(sinsal: Sinsal) -> dict:
    """Sinsal을 dict로 변환 (JSON 직렬화용)"""
    return {
        "type": sinsal.type.value,
        "source": sinsal.source,
        "position": sinsal.position,
        "weight": sinsal.weight,
        "description": sinsal.description,
        "is_lucky": sinsal.is_lucky,
    }


def sinsals_to_dict(sinsals: List[Sinsal]) -> dict:
    """신살 분석 결과를 dict로 변환"""
    lucky = [sinsal_to_dict(s) for s in sinsals if s.is_lucky]
    unlucky = [sinsal_to_dict(s) for s in sinsals if not s.is_lucky]

    return {
        "lucky": lucky,
        "unlucky": unlucky,
        "summary": format_sinsal_summary(sinsals),
        "count": len(sinsals),
    }
