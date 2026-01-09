"""
궁합 분석 점수 엔진 v2.0
두 사람의 사주를 비교하여 6개 항목의 점수 계산

점수 항목 및 가중치 (v2.0):
- 천간 조화 (24%): 5합 성립률
- 지지 조화 (24%): 6합 - 충/형/파/해/원진
- 오행 균형 (19%): 오행 분포 보완/과다
- 십신 호환성 (19%): 상호 십신 관계
- 12운성 시너지 (9%): 12운성 조합
- 삼합/방합 시너지 (5%): 국(局) 형성

추가 분석 (v2.0):
- 원진(元辰): 심리적 불화 감점 (지지 조화에 포함)
- 삼합/방합: 3개 지지 완성 시 가점
- 도화살: 연애 매력도 보너스

PRD 기준 구현 (docs/chemistry_prd2.md)
"""
from typing import Dict, List, Any, Optional, Tuple
from .constants import (
    HEAVENLY_STEMS, EARTHLY_BRANCHES,
    STEM_TO_ELEMENT, BRANCH_TO_ELEMENT,
    YANG_STEMS, YIN_STEMS,
    JIJANGGAN_TABLE,
)
from .interactions import (
    BRANCH_COMBINATIONS, BRANCH_CLASHES,
    BRANCH_PUNISHMENTS, BRANCH_HARMS, BRANCH_DESTRUCTIONS,
)
from .ten_gods import determine_ten_god, TEN_GOD_NAMES
from scoring.calculator import (
    JIBYEON_12WUNSEONG, WUNSEONG_WEIGHTS,
    INTERACTION_WEIGHTS,
)


# ============================================
# 원진 (元辰) - 심리적 불화, 속마음 갈등
# 사주분석마스터.txt 기반
# ============================================

WONJIN = {
    '子': '酉', '丑': '午', '寅': '未', '卯': '申',
    '辰': '亥', '巳': '戌', '午': '丑', '未': '寅',
    '申': '卯', '酉': '子', '戌': '巳', '亥': '辰',
}

# 원진 감점 배수 (사주분석마스터 v8.0 기준)
WONJIN_WEIGHT = 0.8


# ============================================
# 삼합 (三合) - 3개 완성 시 국(局) 형성
# ============================================

SAMHAP = {
    ('寅', '午', '戌'): ('火局', '인오술 화국'),
    ('申', '子', '辰'): ('水局', '신자진 수국'),
    ('巳', '酉', '丑'): ('金局', '사유축 금국'),
    ('亥', '卯', '未'): ('木局', '해묘미 목국'),
}

# 반합 (2개 조합) - 삼합의 부분
BANHAP = {
    # 인오술 화국
    ('寅', '午'): ('火局', '인오 반합'),
    ('午', '戌'): ('火局', '오술 반합'),
    ('寅', '戌'): ('火局', '인술 반합'),
    # 신자진 수국
    ('申', '子'): ('水局', '신자 반합'),
    ('子', '辰'): ('水局', '자진 반합'),
    ('申', '辰'): ('水局', '신진 반합'),
    # 사유축 금국
    ('巳', '酉'): ('金局', '사유 반합'),
    ('酉', '丑'): ('金局', '유축 반합'),
    ('巳', '丑'): ('金局', '사축 반합'),
    # 해묘미 목국
    ('亥', '卯'): ('木局', '해묘 반합'),
    ('卯', '未'): ('木局', '묘미 반합'),
    ('亥', '未'): ('木局', '해미 반합'),
}


# ============================================
# 방합 (方合) - 같은 방향 3개
# ============================================

BANGHAP = {
    ('寅', '卯', '辰'): ('東方木', '동방목'),
    ('巳', '午', '未'): ('南方火', '남방화'),
    ('申', '酉', '戌'): ('西方金', '서방금'),
    ('亥', '子', '丑'): ('北方水', '북방수'),
}


# ============================================
# 도화살 (桃花殺) - 연지/일지 기준
# Destiny Code 기반
# ============================================

DOHWA = {
    # 인오술 삼합 기준 → 卯
    '寅': '卯', '午': '卯', '戌': '卯',
    # 신자진 삼합 기준 → 酉
    '申': '酉', '子': '酉', '辰': '酉',
    # 사유축 삼합 기준 → 午
    '巳': '午', '酉': '午', '丑': '午',
    # 해묘미 삼합 기준 → 子
    '亥': '子', '卯': '子', '未': '子',
}


# ============================================
# 천간 5합 상수 (天干五合)
# ============================================

STEM_COMBINATIONS = {
    # (천간A, 천간B): (합화 결과 오행, 합화 조건 지지들, 합 이름)
    ('甲', '己'): ('土', ['辰', '戌', '丑', '未'], '갑기합토'),
    ('己', '甲'): ('土', ['辰', '戌', '丑', '未'], '갑기합토'),
    ('乙', '庚'): ('金', ['申', '酉'], '을경합금'),
    ('庚', '乙'): ('金', ['申', '酉'], '을경합금'),
    ('丙', '辛'): ('水', ['亥', '子'], '병신합수'),
    ('辛', '丙'): ('水', ['亥', '子'], '병신합수'),
    ('丁', '壬'): ('木', ['寅', '卯'], '정임합목'),
    ('壬', '丁'): ('木', ['寅', '卯'], '정임합목'),
    ('戊', '癸'): ('火', ['巳', '午'], '무계합화'),
    ('癸', '戊'): ('火', ['巳', '午'], '무계합화'),
}


# ============================================
# 십신 궁합 호환성 매트릭스
# (A→B 십신, B→A 십신): 점수
# ============================================

TEN_GOD_COMPATIBILITY = {
    # 이상적 배우자 관계 (높은 점수)
    ('정재', '정관'): 95, ('정관', '정재'): 95,
    ('정재', '정인'): 90, ('정인', '정재'): 90,
    ('편재', '편관'): 85, ('편관', '편재'): 85,
    ('정관', '정인'): 88, ('정인', '정관'): 88,

    # 좋은 관계 (중상위 점수)
    ('식신', '정재'): 82, ('정재', '식신'): 82,
    ('식신', '정관'): 78, ('정관', '식신'): 78,
    ('상관', '편재'): 75, ('편재', '상관'): 75,
    ('정인', '식신'): 80, ('식신', '정인'): 80,
    ('편인', '편재'): 72, ('편재', '편인'): 72,

    # 친구 같은 관계 (중간 점수)
    ('비견', '비견'): 55,
    ('겁재', '겁재'): 50,
    ('비견', '겁재'): 52, ('겁재', '비견'): 52,
    ('식신', '식신'): 60,
    ('상관', '상관'): 45,

    # 갈등 가능성 (낮은 점수)
    ('상관', '정관'): 35, ('정관', '상관'): 35,
    ('상관', '편관'): 38, ('편관', '상관'): 38,
    ('겁재', '정재'): 40, ('정재', '겁재'): 40,
    ('편관', '편관'): 42,
    ('겁재', '편재'): 45, ('편재', '겁재'): 45,
}


# ============================================
# 12운성 시너지 매트릭스
# (A의 12운성, B의 12운성): 점수
# ============================================

WUNSEONG_SYNERGY = {
    # 둘 다 강한 상태 (좋은 시너지)
    ('건록', '건록'): 85,
    ('제왕', '제왕'): 80,  # 경쟁 가능
    ('건록', '제왕'): 92, ('제왕', '건록'): 92,
    ('관대', '관대'): 82,
    ('건록', '관대'): 88, ('관대', '건록'): 88,
    ('제왕', '관대'): 85, ('관대', '제왕'): 85,

    # 보완 관계 (한 명이 약할 때)
    ('건록', '장생'): 78, ('장생', '건록'): 78,
    ('제왕', '양'): 75, ('양', '제왕'): 75,
    ('관대', '목욕'): 70, ('목욕', '관대'): 70,

    # 둘 다 약한 상태 (어려움)
    ('묘', '묘'): 35,
    ('절', '절'): 30,
    ('사', '사'): 40,
    ('묘', '절'): 32, ('절', '묘'): 32,
    ('사', '절'): 38, ('절', '사'): 38,

    # 재생 가능 (한 명이 시작 단계)
    ('장생', '장생'): 72,
    ('양', '양'): 68,
    ('태', '태'): 60,
    ('묘', '장생'): 55, ('장생', '묘'): 55,
    ('절', '양'): 50, ('양', '절'): 50,
}


# ============================================
# 연애 스타일 십신 매핑
# ============================================

ROMANCE_TRAIT_MAPPING = {
    # 표현력: 식신/상관이 강하면 높음
    'expression': {'식신': 1.5, '상관': 1.3, '편재': 0.5, '정재': 0.3},
    # 독점욕: 편관/겁재가 강하면 높음
    'possessiveness': {'편관': 1.5, '겁재': 1.3, '비견': 0.7, '정관': 0.5},
    # 헌신도: 정인/정재가 강하면 높음
    'devotion': {'정인': 1.5, '정재': 1.3, '식신': 0.7, '편인': 0.5},
    # 모험심: 편재/상관이 강하면 높음
    'adventure': {'편재': 1.5, '상관': 1.3, '겁재': 0.7, '편관': 0.5},
    # 안정추구: 정관/정인이 강하면 높음
    'stability': {'정관': 1.5, '정인': 1.3, '정재': 0.7, '비견': 0.3},
}


# ============================================
# 메인 함수들
# ============================================

def calculate_all_scores(
    pillars_a: Dict[str, Any],
    pillars_b: Dict[str, Any],
    jijanggan_a: Optional[Dict[str, List]] = None,
    jijanggan_b: Optional[Dict[str, List]] = None,
) -> Dict[str, Any]:
    """
    두 사람의 궁합 점수 전체 계산

    Args:
        pillars_a: A의 사주 팔자
        pillars_b: B의 사주 팔자
        jijanggan_a: A의 지장간 (옵션)
        jijanggan_b: B의 지장간 (옵션)

    Returns:
        {
            "totalScore": int,
            "scores": {...},  # 5개 항목 상세
            "traitScoresA": {...},  # A 연애 스타일
            "traitScoresB": {...},  # B 연애 스타일
            "interactions": {...},  # 간지 상호작용 상세
        }
    """
    # 입력 유효성 검사
    if not pillars_a or not pillars_b:
        return {
            'totalScore': 50,
            'scores': {
                'stemHarmony': {'score': 50, 'combinations': [], 'clashes': []},
                'branchHarmony': {'score': 50, 'combinations': [], 'clashes': [], 'punishments': [], 'harms': []},
                'elementBalance': {'score': 50, 'a_elements': {}, 'b_elements': {}, 'complementary': [], 'excessive': [], 'balance_details': []},
                'tenGodCompatibility': {'score': 50, 'a_to_b': {}, 'b_to_a': {}, 'relationship_type': ''},
                'wunsengSynergy': {'score': 50, 'a_wunseong': '', 'b_wunseong': '', 'synergy_type': ''},
            },
            'traitScoresA': {'expression': 50, 'possessiveness': 50, 'devotion': 50, 'adventure': 50, 'stability': 50},
            'traitScoresB': {'expression': 50, 'possessiveness': 50, 'devotion': 50, 'adventure': 50, 'stability': 50},
            'interactions': {},
            'error': 'Invalid input: pillars data is missing',
        }

    # 6개 항목 점수 계산 (v2.0 확장)
    stem_harmony = calculate_stem_harmony(pillars_a, pillars_b)
    branch_harmony = calculate_branch_harmony(pillars_a, pillars_b)
    element_balance = calculate_element_balance(pillars_a, pillars_b)
    ten_god_compat = calculate_ten_god_compatibility(pillars_a, pillars_b)
    wunseong_synergy = calculate_wunseong_synergy(pillars_a, pillars_b)
    combination_synergy = calculate_combination_synergy(pillars_a, pillars_b)

    # 도화살 분석
    peach_blossom = analyze_peach_blossom(pillars_a, pillars_b)

    # 가중치 적용 총점 계산 (v2.0: 6개 항목)
    # 삼합/방합 5% 추가, 기존 항목 비율 조정
    total_score = int(
        stem_harmony['score'] * 0.24 +
        branch_harmony['score'] * 0.24 +
        element_balance['score'] * 0.19 +
        ten_god_compat['score'] * 0.19 +
        wunseong_synergy['score'] * 0.09 +
        combination_synergy['score'] * 0.05
    )

    # 도화살 보너스 추가 (최대 +10점)
    attraction_bonus = min(10, peach_blossom.get('attractionBonus', 0) // 2)
    total_score += attraction_bonus

    # 0-100 범위로 클램프
    total_score = max(0, min(100, total_score))

    # 연애 스타일 점수 계산
    trait_scores_a = calculate_romance_traits(pillars_a, jijanggan_a)
    trait_scores_b = calculate_romance_traits(pillars_b, jijanggan_b)

    # 간지 상호작용 상세 정보 (v2.0: 원진 추가, 도화살 포함)
    interactions = {
        'stemCombinations': stem_harmony.get('combinations', []),
        'branchCombinations': branch_harmony.get('combinations', []),
        'branchClashes': branch_harmony.get('clashes', []),
        'branchPunishments': branch_harmony.get('punishments', []),
        'branchHarms': branch_harmony.get('harms', []),
        'branchDestructions': branch_harmony.get('destructions', []),
        'branchWonjin': branch_harmony.get('wonjin', []),
        'samhapFormed': combination_synergy.get('samhapFormed', []),
        'banhapFormed': combination_synergy.get('banhapFormed', []),
        'banghapFormed': combination_synergy.get('banghapFormed', []),
        'peachBlossom': peach_blossom,  # 도화살 정보 추가
    }

    return {
        'totalScore': total_score,
        'scores': {
            'stemHarmony': stem_harmony,
            'branchHarmony': branch_harmony,
            'elementBalance': element_balance,
            'tenGodCompatibility': ten_god_compat,
            'wunsengSynergy': wunseong_synergy,
            'combinationSynergy': combination_synergy,
        },
        'traitScoresA': trait_scores_a,
        'traitScoresB': trait_scores_b,
        'interactions': interactions,
        'peachBlossom': peach_blossom,
    }


def calculate_stem_harmony(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    천간 조화 점수 계산 (25% 가중치)

    두 사람의 천간 간 5합 성립 여부와 합화 성립률 계산
    """
    combinations = []
    base_score = 50

    # 모든 천간 쌍 비교 (A의 4천간 × B의 4천간)
    pillar_names = ['year', 'month', 'day', 'hour']

    for pa_name in pillar_names:
        stem_a = pillars_a.get(pa_name, {}).get('stem', '')
        if not stem_a:
            continue

        for pb_name in pillar_names:
            stem_b = pillars_b.get(pb_name, {}).get('stem', '')
            if not stem_b:
                continue

            # 5합 체크
            key = (stem_a, stem_b)
            if key in STEM_COMBINATIONS:
                result_element, condition_branches, name = STEM_COMBINATIONS[key]

                # 합화 성립률 계산 (월지 조건)
                month_branch_a = pillars_a.get('month', {}).get('branch', '')
                month_branch_b = pillars_b.get('month', {}).get('branch', '')

                probability = 0.5  # 기본 50%
                if month_branch_a in condition_branches:
                    probability += 0.2
                if month_branch_b in condition_branches:
                    probability += 0.2

                # 일간 합은 더 중요
                if pa_name == 'day' or pb_name == 'day':
                    probability += 0.1

                probability = min(1.0, probability)

                combinations.append({
                    'stems': [stem_a, stem_b],
                    'result': result_element,
                    'name': name,
                    'probability': round(probability, 2),
                    'positions': [f'A.{pa_name}.stem', f'B.{pb_name}.stem'],
                })

                # 점수 가산 (합 1개당 +15점, 확률 가중)
                base_score += int(15 * probability)

    # 점수 클램프
    score = max(0, min(100, base_score))

    return {
        'score': score,
        'combinations': combinations,
        'clashes': [],  # 천간 충은 중요도 낮음
    }


def calculate_wonjin_penalty(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    원진(元辰) 관계 분석 - 심리적 불화 감점 요소

    Returns:
        {
            'count': int,
            'pairs': List[Dict],  # 발견된 원진 쌍
            'penalty': int,       # 총 감점 (음수)
            'details': str
        }
    """
    pairs = []
    total_penalty = 0

    pillar_names = ['year', 'month', 'day', 'hour']

    for pa_name in pillar_names:
        branch_a = pillars_a.get(pa_name, {}).get('branch', '')
        if not branch_a:
            continue

        for pb_name in pillar_names:
            branch_b = pillars_b.get(pb_name, {}).get('branch', '')
            if not branch_b:
                continue

            # 원진 체크 (양방향)
            if WONJIN.get(branch_a) == branch_b or WONJIN.get(branch_b) == branch_a:
                # 일지-일지 원진이 가장 치명적
                if pa_name == 'day' and pb_name == 'day':
                    penalty = int(-15 * WONJIN_WEIGHT)
                    severity = 'high'
                # 월지-일지 원진
                elif (pa_name == 'month' and pb_name == 'day') or (pa_name == 'day' and pb_name == 'month'):
                    penalty = int(-10 * WONJIN_WEIGHT)
                    severity = 'medium'
                # 기타 원진
                else:
                    penalty = int(-5 * WONJIN_WEIGHT)
                    severity = 'low'

                pairs.append({
                    'branches': [branch_a, branch_b],
                    'positions': [f'A.{pa_name}.branch', f'B.{pb_name}.branch'],
                    'penalty': penalty,
                    'severity': severity,
                })
                total_penalty += penalty

    details = ''
    if pairs:
        details = f"원진 {len(pairs)}쌍 발견: 심리적 갈등 가능성"

    return {
        'count': len(pairs),
        'pairs': pairs,
        'penalty': total_penalty,
        'details': details,
    }


def calculate_combination_synergy(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    삼합/방합 국(局) 형성 분석

    두 사람의 지지를 합쳐서 삼합/방합 완성 여부 확인

    Returns:
        {
            'score': int,           # 0-100
            'samhapFormed': List,   # 형성된 삼합 목록
            'banhapFormed': List,   # 형성된 반합 목록
            'banghapFormed': List,  # 형성된 방합 목록
            'details': str
        }
    """
    # 두 사람의 모든 지지 수집
    branches_a = set()
    branches_b = set()

    for pillar_name in ['year', 'month', 'day', 'hour']:
        branch_a = pillars_a.get(pillar_name, {}).get('branch', '')
        branch_b = pillars_b.get(pillar_name, {}).get('branch', '')
        if branch_a:
            branches_a.add(branch_a)
        if branch_b:
            branches_b.add(branch_b)

    all_branches = branches_a | branches_b
    base_score = 50

    samhap_formed = []
    banhap_formed = []
    banghap_formed = []

    # 삼합 체크 (3개 완성)
    for branches_tuple, (result, name) in SAMHAP.items():
        branches_set = set(branches_tuple)
        if branches_set.issubset(all_branches):
            # 두 사람이 각각 기여했는지 확인
            a_contrib = branches_a & branches_set
            b_contrib = branches_b & branches_set
            if a_contrib and b_contrib:  # 둘 다 기여해야 함
                samhap_formed.append({
                    'branches': list(branches_tuple),
                    'result': result,
                    'name': name,
                    'a_contribution': list(a_contrib),
                    'b_contribution': list(b_contrib),
                })
                base_score += 20

    # 반합 체크 (2개 조합) - 삼합이 이미 형성된 경우 제외
    for branches_tuple, (result, name) in BANHAP.items():
        branches_set = set(branches_tuple)
        if branches_set.issubset(all_branches):
            # 이미 삼합에 포함된 경우 스킵
            already_in_samhap = any(
                branches_set.issubset(set(s['branches']))
                for s in samhap_formed
            )
            if not already_in_samhap:
                a_contrib = branches_a & branches_set
                b_contrib = branches_b & branches_set
                if a_contrib and b_contrib:
                    banhap_formed.append({
                        'branches': list(branches_tuple),
                        'result': result,
                        'name': name,
                    })
                    base_score += 8

    # 방합 체크 (3개 완성)
    for branches_tuple, (result, name) in BANGHAP.items():
        branches_set = set(branches_tuple)
        if branches_set.issubset(all_branches):
            a_contrib = branches_a & branches_set
            b_contrib = branches_b & branches_set
            if a_contrib and b_contrib:
                banghap_formed.append({
                    'branches': list(branches_tuple),
                    'result': result,
                    'name': name,
                })
                base_score += 15

    score = max(0, min(100, base_score))

    details = ''
    if samhap_formed:
        details += f"삼합 {len(samhap_formed)}개 형성. "
    if banhap_formed:
        details += f"반합 {len(banhap_formed)}개 형성. "
    if banghap_formed:
        details += f"방합 {len(banghap_formed)}개 형성. "

    return {
        'score': score,
        'samhapFormed': samhap_formed,
        'banhapFormed': banhap_formed,
        'banghapFormed': banghap_formed,
        'details': details.strip(),
    }


def analyze_peach_blossom(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    도화살(桃花殺) 분석 - 연애 매력도

    Returns:
        {
            'aHasDohwa': bool,
            'bHasDohwa': bool,
            'aDowhaBranch': str,      # A의 도화 지지
            'bDohwaBranch': str,      # B의 도화 지지
            'mutualAttraction': int,  # 상호 끌림 점수 (0-100)
            'attractionBonus': int,   # 가산 점수
            'description': str
        }
    """
    # A의 연지/일지 기준 도화
    year_branch_a = pillars_a.get('year', {}).get('branch', '')
    day_branch_a = pillars_a.get('day', {}).get('branch', '')
    a_dohwa_from_year = DOHWA.get(year_branch_a, '')
    a_dohwa_from_day = DOHWA.get(day_branch_a, '')

    # B의 연지/일지 기준 도화
    year_branch_b = pillars_b.get('year', {}).get('branch', '')
    day_branch_b = pillars_b.get('day', {}).get('branch', '')
    b_dohwa_from_year = DOHWA.get(year_branch_b, '')
    b_dohwa_from_day = DOHWA.get(day_branch_b, '')

    # A가 도화를 가지고 있는지 (사주 내에 도화 지지가 있는지)
    a_branches = {
        pillars_a.get(p, {}).get('branch', '')
        for p in ['year', 'month', 'day', 'hour']
    }
    a_has_dohwa = a_dohwa_from_year in a_branches or a_dohwa_from_day in a_branches
    a_dohwa_branch = a_dohwa_from_year or a_dohwa_from_day

    # B가 도화를 가지고 있는지
    b_branches = {
        pillars_b.get(p, {}).get('branch', '')
        for p in ['year', 'month', 'day', 'hour']
    }
    b_has_dohwa = b_dohwa_from_year in b_branches or b_dohwa_from_day in b_branches
    b_dohwa_branch = b_dohwa_from_year or b_dohwa_from_day

    # 상호 끌림 점수 계산
    attraction_bonus = 0
    mutual_attraction = 50  # 기본 점수

    # 쌍방 도화
    if a_has_dohwa and b_has_dohwa:
        attraction_bonus = 15
        mutual_attraction = 85
        description = "쌍방 도화: 서로에게 강한 매력을 느끼는 관계"
    # 일방 도화
    elif a_has_dohwa or b_has_dohwa:
        attraction_bonus = 8
        mutual_attraction = 70
        if a_has_dohwa:
            description = "A의 도화: A가 B에게 강한 매력을 발산"
        else:
            description = "B의 도화: B가 A에게 강한 매력을 발산"
    else:
        description = "도화 없음: 안정적인 끌림"

    # A의 도화가 B의 일지에 해당하면 추가 끌림
    if a_dohwa_branch and a_dohwa_branch == day_branch_b:
        attraction_bonus += 10
        mutual_attraction = min(100, mutual_attraction + 10)
        description += " (A→B 특별 끌림)"

    # B의 도화가 A의 일지에 해당하면 추가 끌림
    if b_dohwa_branch and b_dohwa_branch == day_branch_a:
        attraction_bonus += 10
        mutual_attraction = min(100, mutual_attraction + 10)
        description += " (B→A 특별 끌림)"

    return {
        'aHasDohwa': a_has_dohwa,
        'bHasDohwa': b_has_dohwa,
        'aDohwaBranch': a_dohwa_branch,
        'bDohwaBranch': b_dohwa_branch,
        'mutualAttraction': mutual_attraction,
        'attractionBonus': attraction_bonus,
        'description': description,
    }


def calculate_branch_harmony(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    지지 조화 점수 계산 (25% 가중치)

    두 사람의 지지 간 6합/충/형/파/해/원진 관계 분석
    """
    combinations = []
    clashes = []
    punishments = []
    harms = []        # 해(害) 관계
    destructions = [] # 파(破) 관계
    wonjin_list = []  # 원진(元辰) 관계
    base_score = 50

    pillar_names = ['year', 'month', 'day', 'hour']

    for pa_name in pillar_names:
        branch_a = pillars_a.get(pa_name, {}).get('branch', '')
        if not branch_a:
            continue

        for pb_name in pillar_names:
            branch_b = pillars_b.get(pb_name, {}).get('branch', '')
            if not branch_b:
                continue

            positions = [f'A.{pa_name}.branch', f'B.{pb_name}.branch']

            # 6합 체크
            key = (branch_a, branch_b)
            if key in BRANCH_COMBINATIONS:
                element, weight, name = BRANCH_COMBINATIONS[key]
                combinations.append({
                    'branches': [branch_a, branch_b],
                    'type': '합',
                    'result': element,
                    'name': name,
                    'positions': positions,
                })
                base_score += int(20 * weight)

            # 충 체크
            if key in BRANCH_CLASHES:
                weight, name = BRANCH_CLASHES[key]
                clashes.append({
                    'branches': [branch_a, branch_b],
                    'type': '충',
                    'name': name,
                    'severity': 'high' if weight >= 1.0 else 'medium',
                    'positions': positions,
                })
                # 충은 감점 (가중치 1.4 적용)
                base_score -= int(25 * weight * INTERACTION_WEIGHTS.get('충', 1.4))

            # 형 체크
            if key in BRANCH_PUNISHMENTS:
                weight, name = BRANCH_PUNISHMENTS[key]
                punishments.append({
                    'branches': [branch_a, branch_b],
                    'type': '형',
                    'name': name,
                    'severity': 'high' if weight >= 0.7 else 'medium',
                    'positions': positions,
                })
                # 형은 감점 (가중치 1.5 적용)
                base_score -= int(20 * weight * INTERACTION_WEIGHTS.get('형', 1.5))

            # 해 체크
            if key in BRANCH_HARMS:
                weight, name = BRANCH_HARMS[key]
                harms.append({
                    'branches': [branch_a, branch_b],
                    'type': '해',
                    'name': name,
                    'positions': positions,
                })
                base_score -= int(10 * weight)

            # 파 체크
            if key in BRANCH_DESTRUCTIONS:
                weight, name = BRANCH_DESTRUCTIONS[key]
                destructions.append({
                    'branches': [branch_a, branch_b],
                    'type': '파',
                    'name': name,
                    'positions': positions,
                })
                base_score -= int(10 * weight)

            # 원진 체크
            if WONJIN.get(branch_a) == branch_b or WONJIN.get(branch_b) == branch_a:
                # 일지-일지 원진이 가장 치명적
                if pa_name == 'day' and pb_name == 'day':
                    penalty = int(15 * WONJIN_WEIGHT)
                    severity = 'high'
                # 월지-일지 원진
                elif (pa_name == 'month' and pb_name == 'day') or (pa_name == 'day' and pb_name == 'month'):
                    penalty = int(10 * WONJIN_WEIGHT)
                    severity = 'medium'
                # 기타 원진
                else:
                    penalty = int(5 * WONJIN_WEIGHT)
                    severity = 'low'

                wonjin_list.append({
                    'branches': [branch_a, branch_b],
                    'type': '원진',
                    'positions': positions,
                    'severity': severity,
                })
                base_score -= penalty

    # 점수 클램프
    score = max(0, min(100, base_score))

    return {
        'score': score,
        'combinations': combinations,
        'clashes': clashes,
        'punishments': punishments,
        'harms': harms,
        'destructions': destructions,
        'wonjin': wonjin_list,
    }


def calculate_element_balance(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    오행 균형 점수 계산 (20% 가중치)

    두 사람의 오행 분포를 비교하여 보완/과다 오행 판정
    """
    # 각자의 오행 강도 계산
    elements_a = calculate_element_strength(pillars_a)
    elements_b = calculate_element_strength(pillars_b)

    # 보완 오행 찾기 (A에게 부족한데 B가 보충)
    complementary = []
    excessive = []
    balance_details = []

    for element in ['木', '火', '土', '金', '水']:
        strength_a = elements_a.get(element, 0)
        strength_b = elements_b.get(element, 0)

        balance_details.append({
            'element': element,
            'a_strength': round(strength_a, 2),
            'b_strength': round(strength_b, 2),
        })

        # A에게 부족(< 1.5)하고 B가 충분(> 2.0)하면 보완
        if strength_a < 1.5 and strength_b > 2.0:
            complementary.append(element)
        # 둘 다 과다(> 3.0)하면 과다
        elif strength_a > 3.0 and strength_b > 3.0:
            excessive.append(element)

    # 점수 계산
    base_score = 50
    base_score += len(complementary) * 12  # 보완 오행당 +12점
    base_score -= len(excessive) * 8       # 과다 오행당 -8점

    # 전체 오행 분포 균형도 체크
    total_diff = 0
    for element in ['木', '火', '土', '金', '水']:
        diff = abs(elements_a.get(element, 0) - elements_b.get(element, 0))
        total_diff += diff

    # 차이가 적을수록 좋음
    if total_diff < 5:
        base_score += 10
    elif total_diff > 10:
        base_score -= 10

    score = max(0, min(100, base_score))

    return {
        'score': score,
        'a_elements': {k: round(v, 2) for k, v in elements_a.items()},
        'b_elements': {k: round(v, 2) for k, v in elements_b.items()},
        'complementary': complementary,
        'excessive': excessive,
        'balance_details': balance_details,
    }


def calculate_element_strength(pillars: Dict) -> Dict[str, float]:
    """
    사주의 오행별 강도 계산

    - 천간: 1.0
    - 지지 본기: 1.0
    - 지장간 정기: 0.5
    """
    strengths = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}

    for pillar_name in ['year', 'month', 'day', 'hour']:
        pillar = pillars.get(pillar_name, {})

        # 천간 오행
        stem = pillar.get('stem', '')
        if stem and stem in STEM_TO_ELEMENT:
            element = STEM_TO_ELEMENT[stem]
            strengths[element] += 1.0

        # 지지 오행
        branch = pillar.get('branch', '')
        if branch and branch in BRANCH_TO_ELEMENT:
            element = BRANCH_TO_ELEMENT[branch]
            strengths[element] += 1.0

        # 지장간 정기 (마지막 원소)
        if branch and branch in JIJANGGAN_TABLE:
            jj_stems = JIJANGGAN_TABLE[branch]
            if jj_stems:
                main_jj = jj_stems[-1]  # 정기
                if main_jj in STEM_TO_ELEMENT:
                    element = STEM_TO_ELEMENT[main_jj]
                    strengths[element] += 0.5

    return strengths


def calculate_ten_god_compatibility(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    십신 호환성 점수 계산 (20% 가중치)

    A의 일간이 B에게 어떤 십신인지, B의 일간이 A에게 어떤 십신인지 분석
    """
    day_stem_a = pillars_a.get('day', {}).get('stem', '')
    day_stem_b = pillars_b.get('day', {}).get('stem', '')

    if not day_stem_a or not day_stem_b:
        return {
            'score': 50,
            'a_to_b': {'tenGod': '알수없음', 'meaning': ''},
            'b_to_a': {'tenGod': '알수없음', 'meaning': ''},
            'relationship_type': '',
        }

    # A가 B에게 어떤 존재인지 (B 기준 A의 십신)
    a_to_b = determine_ten_god(day_stem_b, day_stem_a)
    # B가 A에게 어떤 존재인지 (A 기준 B의 십신)
    b_to_a = determine_ten_god(day_stem_a, day_stem_b)

    # 십신별 의미
    ten_god_meanings = {
        '정재': '안정적 사랑과 헌신의 대상',
        '편재': '열정적 끌림과 변화의 대상',
        '정관': '존경과 신뢰의 대상',
        '편관': '강렬한 자극과 도전의 대상',
        '정인': '보호하고 싶은 대상',
        '편인': '신비롭고 특별한 대상',
        '식신': '편안하고 행복한 대상',
        '상관': '자극적이고 창의적인 대상',
        '비견': '친구 같은 동료',
        '겁재': '경쟁하며 성장하는 관계',
    }

    # 호환성 점수 조회
    key = (a_to_b, b_to_a)
    base_score = TEN_GOD_COMPATIBILITY.get(key, 55)  # 기본 55점

    # 역방향도 체크
    if key not in TEN_GOD_COMPATIBILITY:
        reverse_key = (b_to_a, a_to_b)
        base_score = TEN_GOD_COMPATIBILITY.get(reverse_key, 55)

    # 관계 유형 설명
    relationship_type = _get_relationship_type(a_to_b, b_to_a)

    return {
        'score': base_score,
        'a_to_b': {
            'tenGod': a_to_b,
            'meaning': ten_god_meanings.get(a_to_b, ''),
        },
        'b_to_a': {
            'tenGod': b_to_a,
            'meaning': ten_god_meanings.get(b_to_a, ''),
        },
        'relationship_type': relationship_type,
    }


def _get_relationship_type(a_to_b: str, b_to_a: str) -> str:
    """십신 조합에 따른 관계 유형 반환"""
    if {a_to_b, b_to_a} == {'정재', '정관'}:
        return '이상적 배우자 관계'
    elif {a_to_b, b_to_a} == {'정재', '정인'}:
        return '보호-피보호 관계'
    elif {a_to_b, b_to_a} == {'편재', '편관'}:
        return '열정적 관계'
    elif a_to_b == '비견' and b_to_a == '비견':
        return '친구 같은 관계'
    elif '상관' in {a_to_b, b_to_a} and ('정관' in {a_to_b, b_to_a} or '편관' in {a_to_b, b_to_a}):
        return '갈등 가능성이 있는 관계'
    elif '식신' in {a_to_b, b_to_a}:
        return '편안하고 조화로운 관계'
    elif '겁재' in {a_to_b, b_to_a}:
        return '경쟁하며 성장하는 관계'
    else:
        return '독특한 케미의 관계'


def calculate_wunseong_synergy(pillars_a: Dict, pillars_b: Dict) -> Dict:
    """
    12운성 에너지 시너지 점수 계산 (10% 가중치)

    각자의 일간이 상대의 일지에서 어떤 12운성 상태인지 분석
    - A의 일간 → B의 일지에서 12운성
    - B의 일간 → A의 일지에서 12운성
    """
    day_stem_a = pillars_a.get('day', {}).get('stem', '')
    day_branch_a = pillars_a.get('day', {}).get('branch', '')
    day_stem_b = pillars_b.get('day', {}).get('stem', '')
    day_branch_b = pillars_b.get('day', {}).get('branch', '')

    if not all([day_stem_a, day_branch_a, day_stem_b, day_branch_b]):
        return {
            'score': 50,
            'a_wunseong': '알수없음',
            'b_wunseong': '알수없음',
            'synergy_type': '',
        }

    # A의 일간이 B의 일지에서 얻는 12운성 (상대방 기준)
    wunseong_a = JIBYEON_12WUNSEONG.get(day_stem_a, {}).get(day_branch_b, '알수없음')
    # B의 일간이 A의 일지에서 얻는 12운성 (상대방 기준)
    wunseong_b = JIBYEON_12WUNSEONG.get(day_stem_b, {}).get(day_branch_a, '알수없음')

    # 시너지 점수 조회
    key = (wunseong_a, wunseong_b)
    base_score = WUNSEONG_SYNERGY.get(key, 60)  # 기본 60점

    # 역방향도 체크
    if key not in WUNSEONG_SYNERGY:
        reverse_key = (wunseong_b, wunseong_a)
        base_score = WUNSEONG_SYNERGY.get(reverse_key, 60)

    # 시너지 유형 설명
    synergy_type = _get_synergy_type(wunseong_a, wunseong_b)

    return {
        'score': base_score,
        'a_wunseong': wunseong_a,
        'b_wunseong': wunseong_b,
        'synergy_type': synergy_type,
    }


def _get_synergy_type(wunseong_a: str, wunseong_b: str) -> str:
    """12운성 조합에 따른 시너지 유형 반환"""
    strong_states = ['건록', '제왕', '관대']
    weak_states = ['묘', '절', '사', '병']
    starting_states = ['장생', '양', '태', '목욕']

    a_is_strong = wunseong_a in strong_states
    b_is_strong = wunseong_b in strong_states
    a_is_weak = wunseong_a in weak_states
    b_is_weak = wunseong_b in weak_states

    if a_is_strong and b_is_strong:
        return '활발-활발 시너지'
    elif a_is_strong and not b_is_weak:
        return '활발-성숙 조합'
    elif not a_is_weak and b_is_strong:
        return '성숙-활발 조합'
    elif a_is_weak and b_is_weak:
        return '서로 지지가 필요한 관계'
    elif wunseong_a in starting_states or wunseong_b in starting_states:
        return '성장하며 발전하는 관계'
    else:
        return '안정적인 조합'


def calculate_romance_traits(
    pillars: Dict[str, Any],
    jijanggan: Optional[Dict] = None
) -> Dict[str, int]:
    """
    개인의 연애 스타일 점수 계산 (십신 기반)

    - expression: 표현력 (식신/상관 강도)
    - possessiveness: 독점욕 (편관/겁재 강도)
    - devotion: 헌신도 (정인/정재 강도)
    - adventure: 모험심 (편재/상관 강도)
    - stability: 안정추구 (정관/정인 강도)
    """
    # 십신 카운트 추출
    ten_god_counts = extract_ten_god_counts(pillars, jijanggan)

    scores = {}

    for trait, mapping in ROMANCE_TRAIT_MAPPING.items():
        trait_score = 50  # 기본 50점

        for god, weight in mapping.items():
            count = ten_god_counts.get(god, 0)
            trait_score += int(count * weight * 10)

        # 0-100 클램프
        scores[trait] = max(0, min(100, trait_score))

    return scores


def extract_ten_god_counts(
    pillars: Dict[str, Any],
    jijanggan: Optional[Dict] = None
) -> Dict[str, float]:
    """
    사주에서 십신 카운트 추출

    - 천간: 1.0
    - 지장간 정기: 0.5
    """
    counts = {name: 0.0 for name in TEN_GOD_NAMES}
    day_stem = pillars.get('day', {}).get('stem', '')

    if not day_stem:
        return counts

    # 천간 십신 (연/월/시)
    for pillar_name in ['year', 'month', 'hour']:
        pillar = pillars.get(pillar_name, {})
        stem = pillar.get('stem', '')
        if stem:
            ten_god = determine_ten_god(day_stem, stem)
            counts[ten_god] += 1.0

    # 지장간 십신
    if jijanggan:
        for pillar_name, jj_list in jijanggan.items():
            if isinstance(jj_list, list):
                for jj in jj_list:
                    if isinstance(jj, dict):
                        jj_stem = jj.get('stem', '')
                        if jj_stem:
                            ten_god = determine_ten_god(day_stem, jj_stem)
                            counts[ten_god] += 0.3
                    elif isinstance(jj, str):
                        ten_god = determine_ten_god(day_stem, jj)
                        counts[ten_god] += 0.3
    else:
        # jijanggan이 없으면 지지에서 직접 계산
        for pillar_name in ['year', 'month', 'day', 'hour']:
            branch = pillars.get(pillar_name, {}).get('branch', '')
            if branch and branch in JIJANGGAN_TABLE:
                for jj_stem in JIJANGGAN_TABLE[branch]:
                    ten_god = determine_ten_god(day_stem, jj_stem)
                    counts[ten_god] += 0.3

    return counts
