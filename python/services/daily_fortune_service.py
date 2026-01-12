"""
오늘의 운세 분석 서비스 v2.0 (고전 명리학 기반 고도화)

파이프라인 단계 (10단계):
1. day_calculation - 당일 간지 계산
2. wunseong_analysis - 12운성 분석 (Task 7)
3. timing_detection - 복음/반음 감지 (Task 8)
4. johu_analysis - 조후용신 분석 (Task 9)
5. combination_detection - 삼합/방합 감지 (Task 10)
6. useful_god_lookup - 용신 정보 조회 (Task 11)
7. fortune_analysis - Gemini 분석
8. score_adjustment - 점수 보정
9. area_adjustment - 영역별 점수 반영
10. db_save - DB 저장
"""
import asyncio
import logging
import os
import json
import httpx
from datetime import datetime, date
from typing import Dict, Any, Optional, List, Tuple

from prompts.daily_prompts import (
    DailyFortunePrompts,
    DAILY_FORTUNE_SCHEMA,
    STEM_ELEMENT,
)
from .gemini import get_gemini_service
from .normalizers import normalize_all_keys, normalize_response
from schemas.daily_fortune import validate_daily_fortune

# 점수 계산 모듈에서 기존 상수 가져오기
from scoring.calculator import (
    JIBYEON_12WUNSEONG,
    WUNSEONG_WEIGHTS,
    BRANCH_CHUNG,
    get_12wunseong,
)

# 궁합 분석 모듈에서 삼합/방합 상수 가져오기
from manseryeok.compatibility_engine import (
    SAMHAP,
    BANHAP,
    BANGHAP,
)

logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# 60갑자 테이블 (일진 계산용)
STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

# ============================================
# 12운성 설명 (다국어) - Task 7
# ============================================

WUNSEONG_DESCRIPTIONS = {
    '장생': {
        'ko': '새로운 시작의 기운입니다. 성장과 발전의 에너지가 흐릅니다.',
        'en': 'Energy of new beginnings. Growth and development flows.',
        'ja': '新しい始まりの気運です。成長と発展のエネルギーが流れます。',
        'zh-CN': '新开始的能量。成长与发展的能量流动。',
        'zh-TW': '新開始的能量。成長與發展的能量流動。',
    },
    '목욕': {
        'ko': '정화와 변화의 시기입니다. 불안정하지만 성장통입니다.',
        'en': 'Time of purification and change. Unstable but growing pains.',
        'ja': '浄化と変化の時期です。不安定ですが成長痛です。',
        'zh-CN': '净化与变化的时期。不稳定但是成长之痛。',
        'zh-TW': '淨化與變化的時期。不穩定但是成長之痛。',
    },
    '관대': {
        'ko': '준비가 완료된 상태입니다. 자신감이 넘칩니다.',
        'en': 'Preparation is complete. Confidence overflows.',
        'ja': '準備が整った状態です。自信に満ちています。',
        'zh-CN': '准备已完成的状态。信心满满。',
        'zh-TW': '準備已完成的狀態。信心滿滿。',
    },
    '건록': {
        'ko': '에너지가 가장 안정적입니다. 실력 발휘에 최적입니다.',
        'en': 'Energy is most stable. Optimal for demonstrating abilities.',
        'ja': 'エネルギーが最も安定しています。実力発揮に最適です。',
        'zh-CN': '能量最稳定。最适合发挥实力。',
        'zh-TW': '能量最穩定。最適合發揮實力。',
    },
    '제왕': {
        'ko': '최고조의 상태이나 극성이면 쇠퇴 시작점입니다.',
        'en': 'Peak state but if extreme, decline begins.',
        'ja': '最高潮の状態ですが、極まれば衰退の始点です。',
        'zh-CN': '巅峰状态，但若极端则是衰退起点。',
        'zh-TW': '巔峰狀態，但若極端則是衰退起點。',
    },
    '쇠': {
        'ko': '기운이 약해지기 시작합니다. 무리하지 마세요.',
        'en': 'Energy begins to weaken. Do not overexert.',
        'ja': '気力が弱まり始めます。無理をしないでください。',
        'zh-CN': '能量开始减弱。不要勉强。',
        'zh-TW': '能量開始減弱。不要勉強。',
    },
    '병': {
        'ko': '컨디션 저하의 시기입니다. 휴식이 필요합니다.',
        'en': 'Time of lowered condition. Rest is needed.',
        'ja': 'コンディション低下の時期です。休息が必要です。',
        'zh-CN': '状态下降的时期。需要休息。',
        'zh-TW': '狀態下降的時期。需要休息。',
    },
    '사': {
        'ko': '정체와 멈춤의 시기입니다. 내면을 돌아보세요.',
        'en': 'Time of stagnation and pause. Reflect inward.',
        'ja': '停滞と停止の時期です。内面を振り返りましょう。',
        'zh-CN': '停滞与暂停的时期。回顾内心。',
        'zh-TW': '停滯與暫停的時期。回顧內心。',
    },
    '묘': {
        'ko': '잠복기입니다. 때를 기다리는 지혜가 필요합니다.',
        'en': 'Dormant period. Wisdom to wait for the right time is needed.',
        'ja': '潜伏期です。時を待つ知恵が必要です。',
        'zh-CN': '潜伏期。需要等待时机的智慧。',
        'zh-TW': '潛伏期。需要等待時機的智慧。',
    },
    '절': {
        'ko': '완전한 단절의 시기입니다. 새로운 시작을 준비하세요.',
        'en': 'Time of complete severance. Prepare for new beginnings.',
        'ja': '完全な断絶の時期です。新しい始まりを準備しましょう。',
        'zh-CN': '完全断绝的时期。准备新的开始。',
        'zh-TW': '完全斷絕的時期。準備新的開始。',
    },
    '태': {
        'ko': '새로운 씨앗이 잉태되는 시기입니다. 희망이 싹틉니다.',
        'en': 'Time when new seeds are conceived. Hope sprouts.',
        'ja': '新しい種が宿る時期です。希望が芽生えます。',
        'zh-CN': '新种子孕育的时期。希望萌芽。',
        'zh-TW': '新種子孕育的時期。希望萌芽。',
    },
    '양': {
        'ko': '양육과 성장의 시기입니다. 서서히 힘을 기르세요.',
        'en': 'Time of nurturing and growth. Gradually build strength.',
        'ja': '養育と成長の時期です。徐々に力を養いましょう。',
        'zh-CN': '养育与成长的时期。慢慢积蓄力量。',
        'zh-TW': '養育與成長的時期。慢慢積蓄力量。',
    },
}


# ============================================
# 조후용신 (월지별 필요 천간) - Task 9
# 궁통보감 기반
# ============================================

JOHU_NEEDED_STEMS = {
    '寅': ['丙', '癸'],  # 초봄: 火로 조난, 水로 자양
    '卯': ['庚', '丁'],  # 만춘: 金으로 제목, 火로 조습
    '辰': ['甲', '壬'],  # 늦봄: 木으로 제토, 水로 조습
    '巳': ['壬', '庚'],  # 초여름: 水로 조열
    '午': ['壬', '庚'],  # 한여름: 水로 조열
    '未': ['壬', '甲'],  # 늦여름: 水로 조습
    '申': ['丁', '甲'],  # 초가을: 火로 조한
    '酉': ['丙', '壬'],  # 만추: 火로 조숙살
    '戌': ['甲', '壬'],  # 늦가을: 木으로 제토
    '亥': ['丙', '戊'],  # 초겨울: 火로 조한
    '子': ['丙', '戊'],  # 한겨울: 火로 조한
    '丑': ['丙', '甲'],  # 늦겨울: 火로 조동토
}

JOHU_SEASON_FEATURES = {
    '寅': {'ko': '초봄, 아직 한기가 남아있어 따뜻한 기운이 필요합니다.', 'en': 'Early spring, cold lingers, warm energy needed.', 'ja': '初春、まだ寒気が残り温かい気が必要です。', 'zh-CN': '初春，寒气尚存，需要温暖能量。', 'zh-TW': '初春，寒氣尚存，需要溫暖能量。'},
    '卯': {'ko': '만춘, 습기가 증가하여 조절이 필요합니다.', 'en': 'Late spring, humidity increases, regulation needed.', 'ja': '晩春、湿気が増加し調節が必要です。', 'zh-CN': '晚春，湿气增加，需要调节。', 'zh-TW': '晚春，濕氣增加，需要調節。'},
    '辰': {'ko': '늦봄, 토기가 강해 제어가 필요합니다.', 'en': 'Late spring, earth is strong, control needed.', 'ja': '晩春、土気が強く制御が必要です。', 'zh-CN': '晚春，土气旺盛，需要制衡。', 'zh-TW': '晚春，土氣旺盛，需要制衡。'},
    '巳': {'ko': '초여름, 더위가 시작되어 시원한 기운이 필요합니다.', 'en': 'Early summer, heat begins, cooling energy needed.', 'ja': '初夏、暑さが始まり涼しい気が必要です。', 'zh-CN': '初夏，暑气开始，需要清凉能量。', 'zh-TW': '初夏，暑氣開始，需要清涼能量。'},
    '午': {'ko': '한여름, 극열의 시기로 수기가 절실합니다.', 'en': 'Midsummer, extreme heat, water energy essential.', 'ja': '真夏、極熱の時期で水気が切実です。', 'zh-CN': '盛夏，酷热时期，水能量至关重要。', 'zh-TW': '盛夏，酷熱時期，水能量至關重要。'},
    '未': {'ko': '늦여름, 조열하여 수목이 필요합니다.', 'en': 'Late summer, dry heat, water and wood needed.', 'ja': '晩夏、乾燥した暑さで水木が必要です。', 'zh-CN': '晚夏，燥热，需要水木。', 'zh-TW': '晚夏，燥熱，需要水木。'},
    '申': {'ko': '초가을, 서늘해지기 시작해 화기가 필요합니다.', 'en': 'Early autumn, cooling begins, fire energy needed.', 'ja': '初秋、涼しくなり始め火気が必要です。', 'zh-CN': '初秋，开始转凉，需要火能量。', 'zh-TW': '初秋，開始轉涼，需要火能量。'},
    '酉': {'ko': '만추, 숙살의 기운이 강해 화수 조절이 필요합니다.', 'en': 'Late autumn, killing energy strong, fire-water balance needed.', 'ja': '晩秋、粛殺の気が強く火水調節が必要です。', 'zh-CN': '晚秋，肃杀之气强盛，需要火水调节。', 'zh-TW': '晚秋，肅殺之氣強盛，需要火水調節。'},
    '戌': {'ko': '늦가을, 토기가 강해 목수가 필요합니다.', 'en': 'Late autumn, earth strong, wood and water needed.', 'ja': '晩秋、土気が強く木水が必要です。', 'zh-CN': '晚秋，土气旺盛，需要木水。', 'zh-TW': '晚秋，土氣旺盛，需要木水。'},
    '亥': {'ko': '초겨울, 한기가 시작되어 화토가 필요합니다.', 'en': 'Early winter, cold begins, fire and earth needed.', 'ja': '初冬、寒気が始まり火土が必要です。', 'zh-CN': '初冬，寒气开始，需要火土。', 'zh-TW': '初冬，寒氣開始，需要火土。'},
    '子': {'ko': '한겨울, 극한의 시기로 화토가 절실합니다.', 'en': 'Midwinter, extreme cold, fire and earth essential.', 'ja': '真冬、極寒の時期で火土が切実です。', 'zh-CN': '隆冬，极寒时期，火土至关重要。', 'zh-TW': '隆冬，極寒時期，火土至關重要。'},
    '丑': {'ko': '늦겨울, 동토가 녹기 시작해 화목이 필요합니다.', 'en': 'Late winter, frozen earth thaws, fire and wood needed.', 'ja': '晩冬、凍土が溶け始め火木が必要です。', 'zh-CN': '晚冬，冻土开始融化，需要火木。', 'zh-TW': '晚冬，凍土開始融化，需要火木。'},
}


# ============================================
# 오행별 행운 정보 - Task 11
# ============================================

ELEMENT_LUCKY_INFO = {
    '木': {
        'color': {'ko': '초록색', 'en': 'green', 'ja': '緑', 'zh-CN': '绿色', 'zh-TW': '綠色'},
        'direction': {'ko': '동쪽', 'en': 'East', 'ja': '東', 'zh-CN': '东方', 'zh-TW': '東方'},
        'numbers': [3, 8],
    },
    '火': {
        'color': {'ko': '빨간색', 'en': 'red', 'ja': '赤', 'zh-CN': '红色', 'zh-TW': '紅色'},
        'direction': {'ko': '남쪽', 'en': 'South', 'ja': '南', 'zh-CN': '南方', 'zh-TW': '南方'},
        'numbers': [2, 7],
    },
    '土': {
        'color': {'ko': '노란색', 'en': 'yellow', 'ja': '黄色', 'zh-CN': '黄色', 'zh-TW': '黃色'},
        'direction': {'ko': '중앙', 'en': 'Center', 'ja': '中央', 'zh-CN': '中央', 'zh-TW': '中央'},
        'numbers': [5, 10],
    },
    '金': {
        'color': {'ko': '흰색', 'en': 'white', 'ja': '白', 'zh-CN': '白色', 'zh-TW': '白色'},
        'direction': {'ko': '서쪽', 'en': 'West', 'ja': '西', 'zh-CN': '西方', 'zh-TW': '西方'},
        'numbers': [4, 9],
    },
    '水': {
        'color': {'ko': '검정색', 'en': 'black', 'ja': '黒', 'zh-CN': '黑色', 'zh-TW': '黑色'},
        'direction': {'ko': '북쪽', 'en': 'North', 'ja': '北', 'zh-CN': '北方', 'zh-TW': '北方'},
        'numbers': [1, 6],
    },
}


# ============================================
# 국(局)별 영역 매핑 - Task 10
# ============================================

ELEMENT_TO_FORTUNE_AREA = {
    '水': 'wealth_fortune',       # 재물운
    '木': 'career_fortune',       # 직장운 (성장)
    '火': 'love_fortune',         # 연애운 (열정)
    '土': 'health_fortune',       # 건강운 (안정)
    '金': 'relationship_fortune', # 대인관계 (결단)
}


# ============================================
# Task 12: 형(刑)/파(破)/해(害)/원진(元辰) 상수
# ============================================

# 형(刑) - 3종류 + 자형
JICHE_HYEONG = {
    '무은지형': frozenset(['寅', '巳', '申']),  # 은혜 없는 형벌 (3형)
    '지세지형': frozenset(['丑', '戌', '未']),  # 권세에 기댄 형벌 (3형)
    '무례지형': frozenset(['子', '卯']),        # 예의 없는 형벌 (2형)
}
JICHE_JAHYEONG = frozenset(['辰', '午', '酉', '亥'])  # 자형: 같은 지지끼리

# 파(破) - 6조합 (양방향)
JICHE_PA = frozenset([
    frozenset(['子', '酉']), frozenset(['丑', '辰']), frozenset(['寅', '亥']),
    frozenset(['卯', '午']), frozenset(['巳', '申']), frozenset(['未', '戌']),
])

# 해(害) - 6조합 (양방향)
JICHE_HAE = frozenset([
    frozenset(['子', '未']), frozenset(['丑', '午']), frozenset(['寅', '巳']),
    frozenset(['卯', '辰']), frozenset(['申', '亥']), frozenset(['酉', '戌']),
])

# 원진(元辰) - 심리적 갈등 (단방향 매핑)
JICHE_WONJIN = {
    '子': '未', '丑': '午', '寅': '巳', '卯': '辰',
    '辰': '卯', '巳': '寅', '午': '丑', '未': '子',
    '申': '亥', '酉': '戌', '戌': '酉', '亥': '申',
}

# 부정 상호작용 점수 감점
NEGATIVE_INTERACTION_SCORES = {
    '형': -15,      # 형(刑)
    '파': -10,      # 파(破)
    '해': -10,      # 해(害)
    '원진': -7,     # 원진(元辰)
}

# 부정 상호작용 메시지 (다국어)
NEGATIVE_INTERACTION_MESSAGES = {
    '형': {
        'ko': '충돌과 갈등이 예상되는 날입니다. 신중하게 행동하세요.',
        'en': 'A day of potential clashes and conflicts. Act carefully.',
        'ja': '衝突と葛藤が予想される日です。慎重に行動してください。',
        'zh-CN': '预计会有冲突和矛盾的一天。请谨慎行事。',
        'zh-TW': '預計會有衝突和矛盾的一天。請謹慎行事。',
    },
    '파': {
        'ko': '계획이 틀어질 수 있으니 유연하게 대처하세요.',
        'en': 'Plans may go awry. Stay flexible.',
        'ja': '計画が狂う可能性があります。柔軟に対応してください。',
        'zh-CN': '计划可能会出差错。保持灵活。',
        'zh-TW': '計劃可能會出差錯。保持靈活。',
    },
    '해': {
        'ko': '예상치 못한 방해가 있을 수 있습니다.',
        'en': 'Unexpected obstacles may arise.',
        'ja': '予想外の妨害があるかもしれません。',
        'zh-CN': '可能会有意想不到的阻碍。',
        'zh-TW': '可能會有意想不到的阻礙。',
    },
    '원진': {
        'ko': '심리적 불편함이 느껴질 수 있는 날입니다.',
        'en': 'You may feel psychological discomfort today.',
        'ja': '心理的な不快感を感じる可能性のある日です。',
        'zh-CN': '今天可能会感到心理不适。',
        'zh-TW': '今天可能會感到心理不適。',
    },
}


# ============================================
# Task 13: 12신살 상수
# ============================================

# 12신살 테이블 (연지 기준 → 당일 지지에 해당 신살 적용)
SHINSSAL_TABLE = {
    '역마살': {  # 驛馬 - 이동, 변동
        frozenset(['申', '子', '辰']): '寅',
        frozenset(['寅', '午', '戌']): '申',
        frozenset(['巳', '酉', '丑']): '亥',
        frozenset(['亥', '卯', '未']): '巳',
    },
    '장성살': {  # 將星 - 리더십, 권위
        frozenset(['申', '子', '辰']): '子',
        frozenset(['寅', '午', '戌']): '午',
        frozenset(['巳', '酉', '丑']): '酉',
        frozenset(['亥', '卯', '未']): '卯',
    },
    '화개살': {  # 華蓋 - 학문, 예술, 영성
        frozenset(['申', '子', '辰']): '辰',
        frozenset(['寅', '午', '戌']): '戌',
        frozenset(['巳', '酉', '丑']): '丑',
        frozenset(['亥', '卯', '未']): '未',
    },
    '겁살': {  # 劫殺 - 갑작스러운 변화, 주의 필요
        frozenset(['申', '子', '辰']): '巳',
        frozenset(['寅', '午', '戌']): '亥',
        frozenset(['巳', '酉', '丑']): '寅',
        frozenset(['亥', '卯', '未']): '申',
    },
    '재살': {  # 災殺 - 재난 위험
        frozenset(['申', '子', '辰']): '午',
        frozenset(['寅', '午', '戌']): '子',
        frozenset(['巳', '酉', '丑']): '卯',
        frozenset(['亥', '卯', '未']): '酉',
    },
    '천살': {  # 天殺 - 하늘의 재앙
        frozenset(['申', '子', '辰']): '未',
        frozenset(['寅', '午', '戌']): '丑',
        frozenset(['巳', '酉', '丑']): '辰',
        frozenset(['亥', '卯', '未']): '戌',
    },
}

# 12신살 점수 및 유형
SHINSSAL_SCORES = {
    '역마살': {'score': 10, 'favorable': True},
    '장성살': {'score': 12, 'favorable': True},
    '화개살': {'score': 8, 'favorable': True},
    '겁살': {'score': -12, 'favorable': False},
    '재살': {'score': -15, 'favorable': False},
    '천살': {'score': -10, 'favorable': False},
}

# 12신살 메시지 (다국어)
SHINSSAL_MESSAGES = {
    '역마살': {
        'ko': '이동과 변화에 유리한 날입니다.',
        'en': 'A favorable day for movement and change.',
        'ja': '移動と変化に有利な日です。',
        'zh-CN': '适合移动和变化的一天。',
        'zh-TW': '適合移動和變化的一天。',
    },
    '장성살': {
        'ko': '리더십을 발휘하기 좋은 날입니다.',
        'en': 'A great day to demonstrate leadership.',
        'ja': 'リーダーシップを発揮するのに良い日です。',
        'zh-CN': '展示领导力的好日子。',
        'zh-TW': '展示領導力的好日子。',
    },
    '화개살': {
        'ko': '학문과 예술 활동에 좋은 날입니다.',
        'en': 'A good day for academic and artistic activities.',
        'ja': '学問と芸術活動に良い日です。',
        'zh-CN': '适合学术和艺术活动的一天。',
        'zh-TW': '適合學術和藝術活動的一天。',
    },
    '겁살': {
        'ko': '갑작스러운 변화에 주의하세요.',
        'en': 'Be cautious of sudden changes.',
        'ja': '急な変化に注意してください。',
        'zh-CN': '注意突然的变化。',
        'zh-TW': '注意突然的變化。',
    },
    '재살': {
        'ko': '안전에 각별히 주의하세요.',
        'en': 'Pay special attention to safety.',
        'ja': '安全に特に注意してください。',
        'zh-CN': '特别注意安全。',
        'zh-TW': '特別注意安全。',
    },
    '천살': {
        'ko': '무리한 일정은 피하세요.',
        'en': 'Avoid overloaded schedules.',
        'ja': '無理なスケジュールは避けてください。',
        'zh-CN': '避免过于繁重的日程。',
        'zh-TW': '避免過於繁重的日程。',
    },
}


# ============================================
# Task 15: 조후 튜닝 워드 상수
# ============================================

# 월지별 기후 특성
MONTH_CLIMATE = {
    '寅': '寒', '卯': '濕', '辰': '濕',  # 봄
    '巳': '暖', '午': '暖', '未': '燥',  # 여름
    '申': '燥', '酉': '燥', '戌': '燥',  # 가을
    '亥': '寒', '子': '寒', '丑': '寒',  # 겨울
}

# 조후 튜닝 워드 (기후별 특성 및 해결책)
JOHU_TUNING_WORDS = {
    '寒': {
        'feeling': {
            'ko': '활동력 저하, 움츠림',
            'en': 'reduced activity, withdrawal',
            'ja': '活動力低下、縮こまり',
            'zh-CN': '活动力下降，收缩',
            'zh-TW': '活動力下降，收縮',
        },
        'solution_stems': ['丙', '丁'],  # 火로 해결
        'message_lack': {
            'ko': '활력이 떨어지기 쉬운 날입니다. 따뜻한 환경을 유지하세요.',
            'en': 'Energy may be low today. Keep warm environments.',
            'ja': '活力が落ちやすい日です。暖かい環境を維持してください。',
            'zh-CN': '今天容易精力不足。保持温暖的环境。',
            'zh-TW': '今天容易精力不足。保持溫暖的環境。',
        },
        'message_solve': {
            'ko': '오늘은 활력을 되찾기 좋은 날입니다!',
            'en': 'Today is a great day to regain vitality!',
            'ja': '今日は活力を取り戻すのに良い日です！',
            'zh-CN': '今天是恢复活力的好日子！',
            'zh-TW': '今天是恢復活力的好日子！',
        },
    },
    '暖': {
        'feeling': {
            'ko': '과잉 활동, 소진',
            'en': 'overactivity, exhaustion',
            'ja': '過剰活動、消耗',
            'zh-CN': '过度活动，消耗',
            'zh-TW': '過度活動，消耗',
        },
        'solution_stems': ['壬', '癸'],  # 水로 해결
        'message_lack': {
            'ko': '무리하면 지치기 쉽습니다. 휴식을 취하세요.',
            'en': 'Overexertion leads to fatigue. Take rest.',
            'ja': '無理をすると疲れやすいです。休息を取ってください。',
            'zh-CN': '过度劳累容易疲惫。请休息。',
            'zh-TW': '過度勞累容易疲憊。請休息。',
        },
        'message_solve': {
            'ko': '시원한 기운이 들어와 균형을 맞춰줍니다.',
            'en': 'Cool energy comes in to balance you.',
            'ja': '涼しい気が入ってバランスを取ってくれます。',
            'zh-CN': '清凉的能量进来帮您平衡。',
            'zh-TW': '清涼的能量進來幫您平衡。',
        },
    },
    '燥': {
        'feeling': {
            'ko': '날카로움, 긴장',
            'en': 'sharpness, tension',
            'ja': '鋭さ、緊張',
            'zh-CN': '尖锐，紧张',
            'zh-TW': '尖銳，緊張',
        },
        'solution_stems': ['壬', '癸'],  # 水로 해결
        'message_lack': {
            'ko': '예민해지기 쉬우니 여유를 가지세요.',
            'en': 'You may become sensitive. Take it easy.',
            'ja': '敏感になりやすいので余裕を持ってください。',
            'zh-CN': '容易变得敏感。请放轻松。',
            'zh-TW': '容易變得敏感。請放輕鬆。',
        },
        'message_solve': {
            'ko': '부드러운 기운이 긴장을 풀어줍니다.',
            'en': 'Gentle energy relieves your tension.',
            'ja': '柔らかい気が緊張を解いてくれます。',
            'zh-CN': '柔和的能量帮您放松紧张。',
            'zh-TW': '柔和的能量幫您放鬆緊張。',
        },
    },
    '濕': {
        'feeling': {
            'ko': '무거움, 정체',
            'en': 'heaviness, stagnation',
            'ja': '重さ、停滞',
            'zh-CN': '沉重，停滞',
            'zh-TW': '沉重，停滯',
        },
        'solution_stems': ['甲', '丙'],  # 木(뚫는힘) 또는 火(건조)로 해결
        'message_lack': {
            'ko': '무겁고 답답한 느낌이 들 수 있습니다.',
            'en': 'You may feel heavy and stuffy.',
            'ja': '重くて息苦しく感じるかもしれません。',
            'zh-CN': '可能会感到沉重和闷。',
            'zh-TW': '可能會感到沉重和悶。',
        },
        'message_solve': {
            'ko': '막힌 기운을 뚫어주는 날입니다!',
            'en': 'A day to break through stagnation!',
            'ja': '詰まった気を突き破る日です！',
            'zh-CN': '打破停滞的一天！',
            'zh-TW': '打破停滯的一天！',
        },
    },
}


# ============================================
# 진행률 매핑 - v4.0 (Task 12-15 확장)
# ============================================

DAILY_FORTUNE_PROGRESS = {
    "day_calculation": 5,        # Step 1
    "wunseong": 10,              # Step 2 (Task 7)
    "timing": 15,                # Step 3 (Task 8)
    "negative_interactions": 20, # Step 4 (Task 12) ← 신규
    "shinssal": 25,              # Step 5 (Task 13) ← 신규
    "johu": 30,                  # Step 6 (Task 9)
    "johu_tuning": 35,           # Step 7 (Task 15) ← 신규
    "combination": 40,           # Step 8 (Task 10)
    "useful_god": 45,            # Step 9 (Task 11)
    "mulsangron": 50,            # Step 10 (Task 14) ← 신규
    "gemini_analysis": 75,       # Step 11 (가장 오래 걸림)
    "score_adjustment": 85,      # Step 12
    "area_adjustment": 90,       # Step 13
    "complete": 100,             # Step 14
}

# 초기 step_statuses 생성 헬퍼
def _init_step_statuses() -> Dict[str, str]:
    return {step: "pending" for step in DAILY_FORTUNE_PROGRESS.keys()}


# ============================================
# Fallback 메시지 (Gemini 실패 시) - v3.0
# ============================================

FALLBACK_MESSAGES = {
    'ko': {
        'summary': '오늘은 평온한 하루가 예상됩니다. 무리하지 않고 안정적으로 하루를 보내세요.',
        'career': '업무에서 큰 변화 없이 안정적인 흐름이 이어집니다.',
        'wealth': '재정적으로 평온한 하루입니다. 큰 지출은 피하세요.',
        'love': '연애운은 평이합니다. 자연스러운 만남을 기대하세요.',
        'health': '건강은 무난합니다. 충분한 휴식을 취하세요.',
        'relationship': '대인관계는 원만합니다. 기존 관계를 유지하세요.',
        'advice': '오늘은 특별한 일보다 일상의 소중함을 느끼는 하루로 보내세요.',
    },
    'en': {
        'summary': 'A peaceful day is expected. Take it easy and stay stable.',
        'career': 'Work flows steadily without major changes.',
        'wealth': 'Financially calm day. Avoid large expenditures.',
        'love': 'Love fortune is average. Expect natural encounters.',
        'health': 'Health is fine. Get enough rest.',
        'relationship': 'Relationships are smooth. Maintain existing connections.',
        'advice': 'Focus on appreciating everyday moments rather than seeking something special.',
    },
    'ja': {
        'summary': '穏やかな一日が予想されます。無理せず安定した一日をお過ごしください。',
        'career': '仕事は大きな変化なく安定した流れが続きます。',
        'wealth': '財政的に穏やかな一日です。大きな出費は控えましょう。',
        'love': '恋愛運は平均的です。自然な出会いを期待しましょう。',
        'health': '健康は問題ありません。十分な休息を取りましょう。',
        'relationship': '対人関係は円満です。既存の関係を維持しましょう。',
        'advice': '今日は特別なことより日常の大切さを感じる一日にしましょう。',
    },
    'zh-CN': {
        'summary': '今天预计是平静的一天。不要勉强，稳定地度过这一天。',
        'career': '工作没有大的变化，保持稳定的节奏。',
        'wealth': '财务上平静的一天。避免大额支出。',
        'love': '爱情运势一般。期待自然的相遇。',
        'health': '健康状况良好。请充分休息。',
        'relationship': '人际关系顺利。维持现有关系。',
        'advice': '今天不要追求特别的事情，感受日常的珍贵。',
    },
    'zh-TW': {
        'summary': '今天預計是平靜的一天。不要勉強，穩定地度過這一天。',
        'career': '工作沒有大的變化，保持穩定的節奏。',
        'wealth': '財務上平靜的一天。避免大額支出。',
        'love': '愛情運勢一般。期待自然的相遇。',
        'health': '健康狀況良好。請充分休息。',
        'relationship': '人際關係順利。維持現有關係。',
        'advice': '今天不要追求特別的事情，感受日常的珍貴。',
    },
}


class DailyFortuneService:
    """오늘의 운세 분석 서비스 v3.0 (중간 저장 + Fallback + 진행률 추적)"""

    def __init__(self):
        self.gemini = None  # lazy init

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

    # ============================================
    # v3.0: 중간 저장 패턴 (Report Analysis 참고)
    # ============================================

    async def _update_fortune_status(
        self,
        user_id: str,
        profile_id: str,
        fortune_date: str,
        status: str,
        progress_percent: int,
        step_statuses: Dict[str, str],
        partial_result: Dict[str, Any] = None,
        error: Dict[str, Any] = None
    ) -> bool:
        """
        운세 분석 중간 상태 저장 (UPSERT)

        Args:
            user_id: 사용자 ID
            profile_id: 프로필 ID
            fortune_date: 운세 날짜
            status: 상태 (pending, in_progress, completed, failed)
            progress_percent: 진행률 (0-100)
            step_statuses: 단계별 상태
            partial_result: 부분 결과 (선택)
            error: 에러 정보 (선택)

        Returns:
            성공 여부
        """
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            return False

        update_data = {
            "user_id": user_id,
            "profile_id": profile_id,
            "fortune_date": fortune_date,
            "status": status,
            "progress_percent": progress_percent,
            "step_statuses": step_statuses,
        }

        if partial_result:
            update_data.update(partial_result)
        if error:
            update_data["error"] = error

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/daily_fortunes",
                    json=update_data,
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal,resolution=merge-duplicates"
                    },
                    timeout=10.0
                )
                return response.status_code in [200, 201]
        except Exception as e:
            logger.warning(f"[DailyFortune] 중간 저장 실패: {e}")
            return False

    def _get_fallback_fortune(self, language: str) -> Dict[str, Any]:
        """
        Gemini 3회 실패 시 기본 운세 응답 생성

        Args:
            language: 언어 코드

        Returns:
            기본 운세 응답
        """
        msgs = FALLBACK_MESSAGES.get(language, FALLBACK_MESSAGES['ko'])

        return {
            "overallScore": 50,
            "summary": msgs['summary'],
            "careerFortune": {
                "score": 50,
                "description": msgs['career'],
            },
            "wealthFortune": {
                "score": 50,
                "description": msgs['wealth'],
            },
            "loveFortune": {
                "score": 50,
                "description": msgs['love'],
            },
            "healthFortune": {
                "score": 50,
                "description": msgs['health'],
            },
            "relationshipFortune": {
                "score": 50,
                "description": msgs['relationship'],
            },
            "advice": msgs['advice'],
            "_fallback": True,  # Fallback 응답 표시
        }

    # ============================================
    # Task 7: 12운성 점수 분석
    # ============================================

    def calculate_12wunseong_score(self, pillars: Dict[str, Any], day_branch: str) -> Dict[str, Any]:
        """
        일간과 당일 지지의 12운성 계산

        Args:
            pillars: 사주 팔자 (일간 추출용)
            day_branch: 당일 지지

        Returns:
            {
                "wunseong": "건록",
                "weight": 0.6,
                "score_bonus": 6,
                "description": {...}
            }
        """
        day_stem = pillars.get('day', {}).get('stem', '')
        if not day_stem:
            return {"wunseong": "알수없음", "weight": 0.0, "score_bonus": 0, "description": {}}

        wunseong = get_12wunseong(day_stem, day_branch)
        weight = WUNSEONG_WEIGHTS.get(wunseong, 0.0)
        score_bonus = int(weight * 10)  # -4 ~ +6 범위

        return {
            "wunseong": wunseong,
            "weight": weight,
            "score_bonus": score_bonus,
            "description": WUNSEONG_DESCRIPTIONS.get(wunseong, {})
        }

    # ============================================
    # Task 8: 복음/반음 감지
    # ============================================

    def detect_timing_patterns(self, pillars: Dict[str, Any], day_stem: str, day_branch: str) -> Dict[str, Any]:
        """
        복음(伏吟)/반음(反吟) 감지

        - 복음: 당일 간지 = 원국 간지 → 사건 반복/고착
        - 반음: 당일 지지가 원국 지지와 충(沖) → 급변/충돌

        Returns:
            {
                "fuyin": [{position, ganji, type}],
                "fanyin": [{position, branches}],
                "score_modifier": float (1.0 ~ 1.7),
                "message": {...}
            }
        """
        fuyin_list = []
        fanyin_list = []

        for pillar_name in ['year', 'month', 'day', 'hour']:
            pillar = pillars.get(pillar_name, {})
            natal_stem = pillar.get('stem', '')
            natal_branch = pillar.get('branch', '')

            # 복음: 천간+지지 모두 동일
            if natal_stem == day_stem and natal_branch == day_branch:
                fuyin_list.append({
                    'position': pillar_name,
                    'ganji': f'{natal_stem}{natal_branch}',
                    'type': 'full'
                })
            # 지지만 동일 (부분 복음)
            elif natal_branch == day_branch:
                fuyin_list.append({
                    'position': pillar_name,
                    'ganji': f'{natal_stem}{natal_branch}',
                    'type': 'branch_only'
                })

            # 반음: 지지 충
            if natal_branch and BRANCH_CHUNG.get(natal_branch) == day_branch:
                fanyin_list.append({
                    'position': pillar_name,
                    'branches': [natal_branch, day_branch],
                })

        # 점수 배수 계산
        score_modifier = 1.0
        full_fuyin_count = len([f for f in fuyin_list if f['type'] == 'full'])
        branch_fuyin_count = len([f for f in fuyin_list if f['type'] == 'branch_only'])
        fanyin_count = len(fanyin_list)

        # 복음: ×1.4 (사건 반복 강도), 반음: ×1.7 (급변 강도)
        if full_fuyin_count > 0:
            score_modifier += 0.4 * full_fuyin_count
        if branch_fuyin_count > 0:
            score_modifier += 0.2 * branch_fuyin_count
        if fanyin_count > 0:
            score_modifier += 0.7 * fanyin_count

        # 상한선 설정
        score_modifier = min(score_modifier, 2.5)

        return {
            'fuyin': fuyin_list,
            'fanyin': fanyin_list,
            'score_modifier': round(score_modifier, 2),
            'message': self._build_timing_message(fuyin_list, fanyin_list)
        }

    def _build_timing_message(self, fuyin: list, fanyin: list) -> Dict[str, str]:
        """복음/반음 다국어 메시지 생성"""
        if not fuyin and not fanyin:
            return {}

        messages = {'ko': '', 'en': '', 'ja': '', 'zh-CN': '', 'zh-TW': ''}

        if fuyin:
            has_full = any(f['type'] == 'full' for f in fuyin)
            if has_full:
                messages['ko'] += '오늘은 과거 패턴이 강하게 반복될 수 있습니다. '
                messages['en'] += 'Past patterns may strongly repeat today. '
                messages['ja'] += '今日は過去のパターンが強く繰り返される可能性があります。'
                messages['zh-CN'] += '今天过去的模式可能会强烈重复。'
                messages['zh-TW'] += '今天過去的模式可能會強烈重複。'
            else:
                messages['ko'] += '익숙한 상황이 재현될 수 있습니다. '
                messages['en'] += 'Familiar situations may recur. '
                messages['ja'] += '慣れた状況が再現される可能性があります。'
                messages['zh-CN'] += '熟悉的情况可能会再现。'
                messages['zh-TW'] += '熟悉的情況可能會再現。'

        if fanyin:
            messages['ko'] += '급격한 변화나 충돌이 예상됩니다. 신중하게 행동하세요.'
            messages['en'] += 'Sudden changes or conflicts expected. Act carefully.'
            messages['ja'] += '急激な変化や衝突が予想されます。慎重に行動してください。'
            messages['zh-CN'] += '预计会有突然的变化或冲突。请谨慎行事。'
            messages['zh-TW'] += '預計會有突然的變化或衝突。請謹慎行事。'

        return messages

    # ============================================
    # Task 12: 형(刑)/파(破)/해(害)/원진(元辰) 분석
    # ============================================

    def detect_negative_interactions(self, pillars: Dict[str, Any], day_branch: str) -> Dict[str, Any]:
        """
        형(刑)/파(破)/해(害)/원진(元辰) 감지

        당일 지지와 원국 지지 간 부정적 상호작용 분석

        Returns:
            {
                "hyeong": [{type, branches, score_penalty}],
                "pa": [{branches, score_penalty}],
                "hae": [{branches, score_penalty}],
                "wonjin": [{branches, score_penalty}],
                "total_penalty": int,
                "message": {...}
            }
        """
        # 원국의 모든 지지 수집
        natal_branches = []
        for pillar_name in ['year', 'month', 'day', 'hour']:
            branch = pillars.get(pillar_name, {}).get('branch', '')
            if branch:
                natal_branches.append(branch)

        hyeong_list = []
        pa_list = []
        hae_list = []
        wonjin_list = []

        # 형(刑) 감지
        all_branches = set(natal_branches) | {day_branch}

        # 3형 (무은지형, 지세지형)
        for hyeong_name, hyeong_set in JICHE_HYEONG.items():
            if hyeong_set.issubset(all_branches):
                # 당일 지지가 형 완성에 기여했는지 확인
                natal_set = set(natal_branches)
                if day_branch in hyeong_set and len(natal_set & hyeong_set) >= len(hyeong_set) - 1:
                    hyeong_list.append({
                        'type': hyeong_name,
                        'branches': list(hyeong_set),
                        'score_penalty': NEGATIVE_INTERACTION_SCORES['형'],
                    })

        # 자형 (같은 지지)
        if day_branch in JICHE_JAHYEONG and day_branch in natal_branches:
            hyeong_list.append({
                'type': '자형',
                'branches': [day_branch, day_branch],
                'score_penalty': NEGATIVE_INTERACTION_SCORES['형'],
            })

        # 파(破) 감지
        for natal_branch in natal_branches:
            pair = frozenset([natal_branch, day_branch])
            if pair in JICHE_PA:
                pa_list.append({
                    'branches': [natal_branch, day_branch],
                    'score_penalty': NEGATIVE_INTERACTION_SCORES['파'],
                })

        # 해(害) 감지
        for natal_branch in natal_branches:
            pair = frozenset([natal_branch, day_branch])
            if pair in JICHE_HAE:
                hae_list.append({
                    'branches': [natal_branch, day_branch],
                    'score_penalty': NEGATIVE_INTERACTION_SCORES['해'],
                })

        # 원진(元辰) 감지
        for natal_branch in natal_branches:
            if JICHE_WONJIN.get(natal_branch) == day_branch:
                wonjin_list.append({
                    'branches': [natal_branch, day_branch],
                    'score_penalty': NEGATIVE_INTERACTION_SCORES['원진'],
                })

        # 총 감점 계산
        total_penalty = sum(h['score_penalty'] for h in hyeong_list)
        total_penalty += sum(p['score_penalty'] for p in pa_list)
        total_penalty += sum(h['score_penalty'] for h in hae_list)
        total_penalty += sum(w['score_penalty'] for w in wonjin_list)

        return {
            'hyeong': hyeong_list,
            'pa': pa_list,
            'hae': hae_list,
            'wonjin': wonjin_list,
            'total_penalty': total_penalty,
            'message': self._build_negative_interaction_message(hyeong_list, pa_list, hae_list, wonjin_list)
        }

    def _build_negative_interaction_message(
        self,
        hyeong: list,
        pa: list,
        hae: list,
        wonjin: list
    ) -> Dict[str, str]:
        """부정적 상호작용 다국어 메시지 생성"""
        if not hyeong and not pa and not hae and not wonjin:
            return {}

        messages = {'ko': '', 'en': '', 'ja': '', 'zh-CN': '', 'zh-TW': ''}

        # 가장 심각한 것부터 메시지 추가
        if hyeong:
            for lang, msg in NEGATIVE_INTERACTION_MESSAGES['형'].items():
                messages[lang] += msg + ' '

        if pa:
            for lang, msg in NEGATIVE_INTERACTION_MESSAGES['파'].items():
                messages[lang] += msg + ' '

        if hae:
            for lang, msg in NEGATIVE_INTERACTION_MESSAGES['해'].items():
                messages[lang] += msg + ' '

        if wonjin:
            for lang, msg in NEGATIVE_INTERACTION_MESSAGES['원진'].items():
                messages[lang] += msg + ' '

        # 공백 트림
        return {k: v.strip() for k, v in messages.items()}

    # ============================================
    # Task 13: 12신살 분석
    # ============================================

    def detect_12shinssal(self, year_branch: str, day_branch: str) -> Dict[str, Any]:
        """
        12신살 감지

        연지(年支) 기준으로 당일 지지에 해당하는 신살 판단

        Args:
            year_branch: 연지 (원국 년주 지지)
            day_branch: 당일 지지

        Returns:
            {
                "detected": [{"name": "역마살", "is_favorable": True, "score": 10, "message": {...}}],
                "total_bonus": int,
                "message": {...}
            }
        """
        detected = []

        for shinssal_name, group_mapping in SHINSSAL_TABLE.items():
            for group_set, target_branch in group_mapping.items():
                if year_branch in group_set and day_branch == target_branch:
                    score_info = SHINSSAL_SCORES.get(shinssal_name, {'score': 0, 'favorable': True})
                    detected.append({
                        'name': shinssal_name,
                        'is_favorable': score_info['favorable'],
                        'score': score_info['score'],
                        'message': SHINSSAL_MESSAGES.get(shinssal_name, {}),
                    })

        # 총 보너스 계산
        total_bonus = sum(d['score'] for d in detected)

        return {
            'detected': detected,
            'total_bonus': total_bonus,
            'message': self._build_shinssal_message(detected)
        }

    def _build_shinssal_message(self, detected: list) -> Dict[str, str]:
        """12신살 다국어 메시지 생성"""
        if not detected:
            return {}

        messages = {'ko': '', 'en': '', 'ja': '', 'zh-CN': '', 'zh-TW': ''}

        for shinssal in detected:
            msg = shinssal.get('message', {})
            for lang in messages:
                if msg.get(lang):
                    messages[lang] += msg[lang] + ' '

        return {k: v.strip() for k, v in messages.items()}

    # ============================================
    # Task 9: 조후용신 분석
    # ============================================

    def analyze_johu(self, pillars: Dict[str, Any], day_stem: str, target_date: str) -> Dict[str, Any]:
        """
        조후용신 분석 (궁통보감 기반)

        월령에 따른 조후 필요 오행 판단

        Returns:
            {
                "month_branch": "子",
                "season_feature": {...},
                "needed_stems": ["丙", "戊"],
                "day_stem_matches": bool,
                "score_bonus": int,
                "advice": {...}
            }
        """
        # 월지 추출 (원국 기준)
        month_branch = pillars.get('month', {}).get('branch', '')

        if not month_branch:
            return {
                'month_branch': '',
                'season_feature': {},
                'needed_stems': [],
                'day_stem_matches': False,
                'score_bonus': 0,
                'advice': {}
            }

        needed = JOHU_NEEDED_STEMS.get(month_branch, [])
        matches = day_stem in needed
        score_bonus = 10 if matches else 0

        return {
            'month_branch': month_branch,
            'season_feature': JOHU_SEASON_FEATURES.get(month_branch, {}),
            'needed_stems': needed,
            'day_stem_matches': matches,
            'score_bonus': score_bonus,
            'advice': self._build_johu_advice(month_branch, day_stem, matches)
        }

    def _build_johu_advice(self, month_branch: str, day_stem: str, matches: bool) -> Dict[str, str]:
        """조후 기반 조언 생성"""
        if not matches:
            return {}

        day_element = STEM_ELEMENT.get(day_stem, '')

        # 겨울철 (亥子丑)
        if month_branch in ['亥', '子', '丑'] and day_element == '火':
            return {
                'ko': '추운 계절에 따뜻한 기운이 들어옵니다. 활동적인 하루가 될 것입니다.',
                'en': 'Warm energy enters during cold season. An active day ahead.',
                'ja': '寒い季節に暖かい気が入ります。活動的な一日になるでしょう。',
                'zh-CN': '寒冷季节中温暖的能量进入。将是充满活力的一天。',
                'zh-TW': '寒冷季節中溫暖的能量進入。將是充滿活力的一天。',
            }
        # 여름철 (巳午未)
        elif month_branch in ['巳', '午', '未'] and day_element == '水':
            return {
                'ko': '무더운 계절에 시원한 기운이 찾아옵니다. 머리가 맑아지는 하루입니다.',
                'en': 'Cool energy arrives in hot season. A day of clear thinking.',
                'ja': '暑い季節に涼しい気が訪れます。頭がすっきりする一日です。',
                'zh-CN': '炎热季节中清凉的能量到来。头脑清醒的一天。',
                'zh-TW': '炎熱季節中清涼的能量到來。頭腦清醒的一天。',
            }
        # 봄철 (寅卯辰)
        elif month_branch in ['寅', '卯', '辰']:
            return {
                'ko': '봄의 기운과 조화를 이루는 날입니다. 새로운 시작에 좋습니다.',
                'en': 'A day in harmony with spring energy. Good for new beginnings.',
                'ja': '春の気と調和する日です。新しい始まりに良いです。',
                'zh-CN': '与春天能量和谐的一天。适合新的开始。',
                'zh-TW': '與春天能量和諧的一天。適合新的開始。',
            }
        # 가을철 (申酉戌)
        elif month_branch in ['申', '酉', '戌']:
            return {
                'ko': '가을의 숙살지기를 순화하는 기운입니다. 결실을 맺기 좋습니다.',
                'en': 'Energy that softens autumn\'s sharp energy. Good for harvesting.',
                'ja': '秋の粛殺の気を和らげるエネルギーです。実りを得るのに良いです。',
                'zh-CN': '缓和秋天肃杀之气的能量。适合收获成果。',
                'zh-TW': '緩和秋天肅殺之氣的能量。適合收穫成果。',
            }

        return {
            'ko': '계절에 필요한 기운이 오늘 들어옵니다.',
            'en': 'The energy needed for this season enters today.',
            'ja': '季節に必要な気が今日入ります。',
            'zh-CN': '这个季节需要的能量今天进入。',
            'zh-TW': '這個季節需要的能量今天進入。',
        }

    # ============================================
    # Task 15: 조후 튜닝 워드 적용
    # ============================================

    def apply_johu_tuning(self, month_branch: str, day_stem: str) -> Dict[str, Any]:
        """
        조후 튜닝 워드 적용 (寒/暖/燥/濕)

        계절별 기후 특성에 따른 메시지 및 점수 조정

        Args:
            month_branch: 월지 (원국 월주 지지)
            day_stem: 당일 천간

        Returns:
            {
                "climate": "寒",
                "climate_feeling": {...},
                "is_solved": bool,
                "score_bonus": int,
                "message": {...}
            }
        """
        climate = MONTH_CLIMATE.get(month_branch)
        if not climate:
            return {
                'climate': None,
                'climate_feeling': {},
                'is_solved': False,
                'score_bonus': 0,
                'message': {}
            }

        tuning = JOHU_TUNING_WORDS.get(climate, {})
        solution_stems = tuning.get('solution_stems', [])
        is_solved = day_stem in solution_stems

        return {
            'climate': climate,
            'climate_feeling': tuning.get('feeling', {}),
            'is_solved': is_solved,
            'score_bonus': 12 if is_solved else 0,
            'message': tuning.get('message_solve' if is_solved else 'message_lack', {}),
        }

    # ============================================
    # Task 10: 삼합/방합 국(局) 형성 감지
    # ============================================

    def detect_combination_formation(self, pillars: Dict[str, Any], day_branch: str) -> Dict[str, Any]:
        """
        당일 지지가 원국 지지와 삼합/방합 형성 여부 확인

        Returns:
            {
                "samhap_formed": [{branches, result, name, day_contribution}],
                "banhap_formed": [{branches, result, name}],
                "banghap_formed": [{branches, result, name}],
                "affected_element": str,
                "score_bonus": int,
                "message": {...}
            }
        """
        # 원국의 모든 지지 수집
        natal_branches = set()
        for pillar_name in ['year', 'month', 'day', 'hour']:
            branch = pillars.get(pillar_name, {}).get('branch', '')
            if branch:
                natal_branches.add(branch)

        # 당일 지지 추가
        all_branches = natal_branches | {day_branch}

        samhap_formed = []
        banhap_formed = []
        banghap_formed = []

        # 삼합 체크 (3개 완성)
        for branches_tuple, (result, name) in SAMHAP.items():
            branches_set = set(branches_tuple)
            if branches_set.issubset(all_branches):
                # 당일 지지가 삼합 완성에 기여했는지 확인
                if day_branch in branches_set:
                    natal_contrib = natal_branches & branches_set
                    if len(natal_contrib) >= 2:  # 원국에 최소 2개 있어야 함
                        samhap_formed.append({
                            'branches': list(branches_tuple),
                            'result': result,
                            'name': name,
                            'day_contribution': day_branch,
                        })

        # 반합 체크 (2개 조합) - 삼합이 형성되지 않은 경우만
        if not samhap_formed:
            for branches_tuple, (result, name) in BANHAP.items():
                branches_set = set(branches_tuple)
                if branches_set.issubset(all_branches):
                    if day_branch in branches_set:
                        other = branches_set - {day_branch}
                        if other.issubset(natal_branches):
                            banhap_formed.append({
                                'branches': list(branches_tuple),
                                'result': result,
                                'name': name,
                            })

        # 방합 체크 (3개 완성)
        for branches_tuple, (result, name) in BANGHAP.items():
            branches_set = set(branches_tuple)
            if branches_set.issubset(all_branches):
                if day_branch in branches_set:
                    natal_contrib = natal_branches & branches_set
                    if len(natal_contrib) >= 2:
                        banghap_formed.append({
                            'branches': list(branches_tuple),
                            'result': result,
                            'name': name,
                        })

        # 점수 보너스 계산
        score_bonus = 0
        affected_element = None

        if samhap_formed:
            score_bonus = 15  # 삼합 완성 시 +15점
            # 결과에서 오행 추출 (예: '火局' → '火')
            affected_element = samhap_formed[0]['result'].replace('局', '')
        elif banghap_formed:
            score_bonus = 12  # 방합 완성 시 +12점
            # 결과에서 오행 추출 (예: '東方木' → '木')
            result = banghap_formed[0]['result']
            affected_element = result[-1] if result else None
        elif banhap_formed:
            score_bonus = 8   # 반합 시 +8점
            affected_element = banhap_formed[0]['result'].replace('局', '')

        return {
            'samhap_formed': samhap_formed,
            'banhap_formed': banhap_formed,
            'banghap_formed': banghap_formed,
            'affected_element': affected_element,
            'score_bonus': score_bonus,
            'message': self._build_combination_message(
                samhap_formed, banhap_formed, banghap_formed, affected_element
            )
        }

    def _build_combination_message(
        self,
        samhap: list,
        banhap: list,
        banghap: list,
        element: str
    ) -> Dict[str, str]:
        """삼합/방합 메시지 생성"""
        if not samhap and not banhap and not banghap:
            return {}

        element_names = {
            '木': {'ko': '목', 'en': 'Wood', 'ja': '木', 'zh-CN': '木', 'zh-TW': '木'},
            '火': {'ko': '화', 'en': 'Fire', 'ja': '火', 'zh-CN': '火', 'zh-TW': '火'},
            '土': {'ko': '토', 'en': 'Earth', 'ja': '土', 'zh-CN': '土', 'zh-TW': '土'},
            '金': {'ko': '금', 'en': 'Metal', 'ja': '金', 'zh-CN': '金', 'zh-TW': '金'},
            '水': {'ko': '수', 'en': 'Water', 'ja': '水', 'zh-CN': '水', 'zh-TW': '水'},
        }

        elem_name = element_names.get(element, {})

        if samhap:
            return {
                'ko': f"삼합 {elem_name.get('ko', element)}국이 완성됩니다! 큰 변화의 기운이 모입니다.",
                'en': f"Triple Harmony {elem_name.get('en', element)} formation complete! Great change energy gathers.",
                'ja': f"三合{elem_name.get('ja', element)}局が完成します！大きな変化の気運が集まります。",
                'zh-CN': f"三合{elem_name.get('zh-CN', element)}局形成！巨大变化的能量汇聚。",
                'zh-TW': f"三合{elem_name.get('zh-TW', element)}局形成！巨大變化的能量匯聚。",
            }
        elif banghap:
            return {
                'ko': f"방합 {elem_name.get('ko', element)}국이 완성됩니다! 해당 방위의 기운이 강해집니다.",
                'en': f"Directional {elem_name.get('en', element)} formation complete! That direction's energy strengthens.",
                'ja': f"方合{elem_name.get('ja', element)}局が完成します！その方位の気運が強まります。",
                'zh-CN': f"方合{elem_name.get('zh-CN', element)}局形成！该方位能量增强。",
                'zh-TW': f"方合{elem_name.get('zh-TW', element)}局形成！該方位能量增強。",
            }
        elif banhap:
            return {
                'ko': f"반합 {elem_name.get('ko', element)}의 기운이 형성됩니다. 해당 오행 관련 운이 상승합니다.",
                'en': f"Half-harmony {elem_name.get('en', element)} energy forms. Related fortunes rise.",
                'ja': f"半合{elem_name.get('ja', element)}の気が形成されます。関連運勢が上昇します。",
                'zh-CN': f"半合{elem_name.get('zh-CN', element)}能量形成。相关运势上升。",
                'zh-TW': f"半合{elem_name.get('zh-TW', element)}能量形成。相關運勢上升。",
            }

        return {}

    def apply_combination_to_areas(self, fortune_result: Dict[str, Any], combination_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        국(局) 형성 시 해당 오행 영역 점수 상승 반영
        """
        affected = combination_info.get('affected_element')
        if not affected:
            return fortune_result

        target_area = ELEMENT_TO_FORTUNE_AREA.get(affected)
        if not target_area:
            return fortune_result

        # camelCase로 변환하여 찾기
        camel_area = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(target_area.split('_')))

        # 결과에서 해당 영역 찾기 (camelCase 또는 snake_case)
        area_data = fortune_result.get(camel_area) or fortune_result.get(target_area)

        if isinstance(area_data, dict) and 'score' in area_data:
            # 해당 영역 점수 +20점 보너스
            area_data['score'] = min(100, area_data['score'] + 20)
            area_data['bonus_reason'] = combination_info.get('message', {}).get('ko', '')

        return fortune_result

    # ============================================
    # Task 11: 용신 기반 행운 정보
    # ============================================

    async def get_useful_god_from_report(self, profile_id: str) -> Optional[str]:
        """
        profile_reports에서 용신 정보 조회

        Returns:
            용신 오행 (木, 火, 土, 金, 水) 또는 None
        """
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/profile_reports",
                    params={
                        'select': 'basic_analysis',
                        'profile_id': f'eq.{profile_id}',
                        'status': 'eq.completed',
                        'order': 'created_at.desc',
                        'limit': '1'
                    },
                    headers={
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        basic = data[0].get('basic_analysis', {})
                        if isinstance(basic, str):
                            try:
                                basic = json.loads(basic)
                            except:
                                return None

                        # usefulGod 또는 useful_god 필드에서 추출
                        useful_god = basic.get('usefulGod') or basic.get('useful_god', {})
                        if isinstance(useful_god, dict):
                            element = useful_god.get('element', '')
                            if element and element in ['木', '火', '土', '金', '水']:
                                return element
                        elif isinstance(useful_god, str) and len(useful_god) > 0:
                            # '木 (갑목)' 형태에서 첫 글자만 추출
                            if useful_god[0] in ['木', '火', '土', '金', '水']:
                                return useful_god[0]
                return None
        except Exception as e:
            logger.warning(f"용신 조회 실패: {e}")
            return None

    def get_personalized_lucky_info(self, useful_god: Optional[str], day_element: str, language: str) -> Dict[str, Any]:
        """
        용신 기반 개인화된 행운 정보 생성

        Args:
            useful_god: 개인 용신 오행 (없으면 None)
            day_element: 당일 천간의 오행
            language: 언어 코드

        Returns:
            {
                "luckyColor": str,
                "luckyDirection": str,
                "luckyNumber": int,
                "personalized": bool,
                "reason": str
            }
        """
        # 항상 당일 오행 기반 (매일 변경되도록)
        target_element = day_element
        info = ELEMENT_LUCKY_INFO.get(target_element, ELEMENT_LUCKY_INFO['土'])

        return {
            'luckyColor': info['color'].get(language, info['color']['ko']),
            'luckyDirection': info['direction'].get(language, info['direction']['ko']),
            'luckyNumber': info['numbers'][0],
            'personalized': False,  # 항상 당일 오행 기반
            'reason': f"당일 오행({day_element}) 기반"
        }

    def check_useful_god_match(self, useful_god: Optional[str], day_stem: str) -> Dict[str, Any]:
        """
        당일 천간이 용신과 일치하는지 확인

        Returns:
            {
                "matches": bool,
                "score_bonus": int,
                "message": {...}
            }
        """
        if not useful_god:
            return {'matches': False, 'score_bonus': 0, 'message': {}}

        day_element = STEM_ELEMENT.get(day_stem, '')
        matches = (day_element == useful_god)

        if matches:
            return {
                'matches': True,
                'score_bonus': 15,
                'message': {
                    'ko': f'오늘은 용신({useful_god})의 기운이 들어오는 특별한 날입니다!',
                    'en': f'Today the energy of your Useful God ({useful_god}) enters - a special day!',
                    'ja': f'今日は用神（{useful_god}）の気が入る特別な日です！',
                    'zh-CN': f'今天用神（{useful_god}）的能量进入，是个特别的日子！',
                    'zh-TW': f'今天用神（{useful_god}）的能量進入，是個特別的日子！',
                }
            }

        return {'matches': False, 'score_bonus': 0, 'message': {}}

    # ============================================
    # Task 14: 물상론 DB 적용
    # ============================================

    def get_mulsangron_info(self, day_stem: str, natal_day_stem: str, language: str = 'ko') -> Dict[str, Any]:
        """
        당일 천간과 일간의 십신 관계를 계산하고 물상론 정보 반환

        Args:
            day_stem: 당일 천간
            natal_day_stem: 일간 (원국 일주 천간)
            language: 언어 코드

        Returns:
            {
                "ten_god": "정관",
                "ten_god_hanja": "正官",
                "relationship": "당일 천간이 일간을 극함",
                "favorable_events": ["승진", "명예 획득", ...],
                "unfavorable_events": ["관재", "송사", ...],
                "related_people": ["상사", "정부 관리", ...],
            }
        """
        from prompts.mulsangron import MULSANGRON

        ten_god = self._calculate_ten_god(day_stem, natal_day_stem)
        if not ten_god:
            return {
                'ten_god': None,
                'ten_god_hanja': None,
                'relationship': None,
                'favorable_events': [],
                'unfavorable_events': [],
                'related_people': [],
            }

        god_data = MULSANGRON.get(ten_god, {})

        return {
            'ten_god': ten_god,
            'ten_god_hanja': self._get_ten_god_hanja(ten_god),
            'relationship': self._get_ten_god_relationship(ten_god, language),
            'favorable_events': god_data.get('길', {}).get(language, god_data.get('길', {}).get('ko', [])),
            'unfavorable_events': god_data.get('흉', {}).get(language, god_data.get('흉', {}).get('ko', [])),
            'related_people': god_data.get('인물', {}).get(language, god_data.get('인물', {}).get('ko', [])),
        }

    def _calculate_ten_god(self, day_stem: str, natal_day_stem: str) -> Optional[str]:
        """
        당일 천간과 일간의 십신 관계 계산

        십신 관계:
        - 비견: 같은 오행, 같은 음양
        - 겁재: 같은 오행, 다른 음양
        - 식신: 일간이 생하는 오행, 같은 음양
        - 상관: 일간이 생하는 오행, 다른 음양
        - 정재: 일간이 극하는 오행, 다른 음양
        - 편재: 일간이 극하는 오행, 같은 음양
        - 정관: 일간을 극하는 오행, 다른 음양
        - 편관: 일간을 극하는 오행, 같은 음양
        - 정인: 일간을 생하는 오행, 다른 음양
        - 편인: 일간을 생하는 오행, 같은 음양
        """
        if not day_stem or not natal_day_stem:
            return None

        # 천간 -> 오행 매핑
        STEM_ELEMENT_MAP = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水',
        }

        # 천간 -> 음양 매핑 (양=True, 음=False)
        STEM_POLARITY = {
            '甲': True, '乙': False,
            '丙': True, '丁': False,
            '戊': True, '己': False,
            '庚': True, '辛': False,
            '壬': True, '癸': False,
        }

        # 오행 상생/상극 관계
        GENERATES = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}  # 목→화→토→금→수→목
        CONTROLS = {'木': '土', '土': '水', '水': '火', '火': '金', '金': '木'}   # 목극토, 토극수, 수극화, 화극금, 금극목

        day_element = STEM_ELEMENT_MAP.get(day_stem)
        natal_element = STEM_ELEMENT_MAP.get(natal_day_stem)
        day_polarity = STEM_POLARITY.get(day_stem)
        natal_polarity = STEM_POLARITY.get(natal_day_stem)

        if not day_element or not natal_element:
            return None

        same_polarity = (day_polarity == natal_polarity)

        # 같은 오행
        if day_element == natal_element:
            return '비견' if same_polarity else '겁재'

        # 일간이 생하는 오행
        if GENERATES.get(natal_element) == day_element:
            return '식신' if same_polarity else '상관'

        # 일간이 극하는 오행
        if CONTROLS.get(natal_element) == day_element:
            return '편재' if same_polarity else '정재'

        # 일간을 극하는 오행
        if CONTROLS.get(day_element) == natal_element:
            return '편관' if same_polarity else '정관'

        # 일간을 생하는 오행
        if GENERATES.get(day_element) == natal_element:
            return '편인' if same_polarity else '정인'

        return None

    def _get_ten_god_hanja(self, ten_god: str) -> str:
        """십신 한자 반환"""
        hanja_map = {
            '비견': '比肩', '겁재': '劫財',
            '식신': '食神', '상관': '傷官',
            '정재': '正財', '편재': '偏財',
            '정관': '正官', '편관': '偏官',
            '정인': '正印', '편인': '偏印',
        }
        return hanja_map.get(ten_god, '')

    def _get_ten_god_relationship(self, ten_god: str, language: str) -> str:
        """십신 관계 설명 반환"""
        relationships = {
            '비견': {
                'ko': '당일 천간이 일간과 같은 오행',
                'en': 'Daily stem is same element as Day Master',
                'ja': '当日天干が日干と同じ五行',
                'zh-CN': '当日天干与日主同五行',
                'zh-TW': '當日天干與日主同五行',
            },
            '겁재': {
                'ko': '당일 천간이 일간과 같은 오행 (다른 음양)',
                'en': 'Daily stem is same element (different polarity)',
                'ja': '当日天干が日干と同じ五行（異なる陰陽）',
                'zh-CN': '当日天干与日主同五行（不同阴阳）',
                'zh-TW': '當日天干與日主同五行（不同陰陽）',
            },
            '식신': {
                'ko': '일간이 생하는 오행',
                'en': 'Day Master produces this element',
                'ja': '日干が生じる五行',
                'zh-CN': '日主生的五行',
                'zh-TW': '日主生的五行',
            },
            '상관': {
                'ko': '일간이 생하는 오행 (다른 음양)',
                'en': 'Day Master produces (different polarity)',
                'ja': '日干が生じる五行（異なる陰陽）',
                'zh-CN': '日主生的五行（不同阴阳）',
                'zh-TW': '日主生的五行（不同陰陽）',
            },
            '정재': {
                'ko': '일간이 극하는 오행',
                'en': 'Day Master controls this element',
                'ja': '日干が剋する五行',
                'zh-CN': '日主克的五行',
                'zh-TW': '日主克的五行',
            },
            '편재': {
                'ko': '일간이 극하는 오행 (같은 음양)',
                'en': 'Day Master controls (same polarity)',
                'ja': '日干が剋する五行（同じ陰陽）',
                'zh-CN': '日主克的五行（同阴阳）',
                'zh-TW': '日主克的五行（同陰陽）',
            },
            '정관': {
                'ko': '당일 천간이 일간을 극함',
                'en': 'Daily stem controls Day Master',
                'ja': '当日天干が日干を剋する',
                'zh-CN': '当日天干克日主',
                'zh-TW': '當日天干克日主',
            },
            '편관': {
                'ko': '당일 천간이 일간을 극함 (같은 음양)',
                'en': 'Daily stem controls Day Master (same polarity)',
                'ja': '当日天干が日干を剋する（同じ陰陽）',
                'zh-CN': '当日天干克日主（同阴阳）',
                'zh-TW': '當日天干克日主（同陰陽）',
            },
            '정인': {
                'ko': '당일 천간이 일간을 생함',
                'en': 'Daily stem produces Day Master',
                'ja': '当日天干が日干を生じる',
                'zh-CN': '当日天干生日主',
                'zh-TW': '當日天干生日主',
            },
            '편인': {
                'ko': '당일 천간이 일간을 생함 (같은 음양)',
                'en': 'Daily stem produces Day Master (same polarity)',
                'ja': '当日天干が日干を生じる（同じ陰陽）',
                'zh-CN': '当日天干生日主（同阴阳）',
                'zh-TW': '當日天干生日主（同陰陽）',
            },
        }
        return relationships.get(ten_god, {}).get(language, relationships.get(ten_god, {}).get('ko', ''))

    # ============================================
    # 종합 조언 빌더
    # ============================================

    def _build_combined_advice(
        self,
        base_advice: str,
        timing_info: Dict,
        useful_god_match: Dict,
        combination_info: Dict,
        language: str
    ) -> str:
        """특별 메시지를 포함한 종합 조언 생성"""
        parts = [base_advice] if base_advice else []

        # 복음/반음 메시지
        timing_msg = timing_info.get('message', {}).get(language, '')
        if timing_msg:
            parts.append(timing_msg)

        # 용신 일치 메시지
        god_msg = useful_god_match.get('message', {}).get(language, '')
        if god_msg:
            parts.append(god_msg)

        # 삼합/방합 메시지
        combo_msg = combination_info.get('message', {}).get(language, '')
        if combo_msg:
            parts.append(combo_msg)

        return ' '.join(parts) if parts else base_advice

    def calculate_day_pillars(self, target_date: str) -> Dict[str, str]:
        """
        당일 천간/지지 계산 (간단한 일진 계산)

        Args:
            target_date: 대상 날짜 (YYYY-MM-DD)

        Returns:
            {"stem": "甲", "branch": "子", "element": "木"}
        """
        # 기준일: 1900-01-01 = 甲子일
        base_date = date(1900, 1, 1)
        target = datetime.strptime(target_date, "%Y-%m-%d").date()

        # 일수 차이 계산
        days_diff = (target - base_date).days

        # 60갑자 인덱스 계산
        stem_idx = days_diff % 10
        branch_idx = days_diff % 12

        stem = STEMS[stem_idx]
        branch = BRANCHES[branch_idx]
        element = STEM_ELEMENT.get(stem, '土')

        return {
            "stem": stem,
            "branch": branch,
            "element": element
        }

    async def generate_fortune(
        self,
        user_id: str,
        profile_id: str,
        target_date: str,
        pillars: Dict[str, Any],
        daewun: list = None,
        language: str = 'ko'
    ) -> Dict[str, Any]:
        """
        오늘의 운세 생성 (v4.0: Task 12-15 고도화 + 14단계 파이프라인)

        단계:
        1. 당일 간지 계산
        2. 12운성 분석 (Task 7)
        3. 복음/반음 감지 (Task 8)
        4. 형/파/해/원진 감지 (Task 12) ← 신규
        5. 12신살 감지 (Task 13) ← 신규
        6. 조후용신 분석 (Task 9)
        7. 조후 튜닝 워드 (Task 15) ← 신규
        8. 삼합/방합 감지 (Task 10)
        9. 용신 정보 조회 (Task 11)
        10. 물상론 정보 (Task 14) ← 신규
        11. Gemini 분석 (3회 재시도 + Fallback)
        12. 점수 보정 및 결과 구성
        13. 영역별 점수 반영
        14. DB 저장

        Args:
            user_id: 사용자 ID
            profile_id: 프로필 ID
            target_date: 대상 날짜 (YYYY-MM-DD)
            pillars: 사주 팔자
            daewun: 대운 목록 (선택)
            language: 언어

        Returns:
            오늘의 운세 결과 (고도화된 분석 메타 정보 포함)
        """
        logger.info(f"[DailyFortune] 시작: user={user_id}, date={target_date}")

        # v3.0: 진행 상태 초기화
        step_statuses = _init_step_statuses()
        current_step = "day_calculation"
        is_fallback = False

        try:
            # 초기 상태 저장 (pending → in_progress)
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=0,
                step_statuses=step_statuses
            )

            # Step 1: 당일 간지 계산
            current_step = "day_calculation"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            day_pillars = self.calculate_day_pillars(target_date)
            day_stem = day_pillars["stem"]
            day_branch = day_pillars["branch"]
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 1 완료: {day_stem}{day_branch}")

            # Step 2: 12운성 분석 (Task 7)
            current_step = "wunseong"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            wunseong_info = self.calculate_12wunseong_score(pillars, day_branch)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 2 완료: 12운성={wunseong_info['wunseong']}, 보너스={wunseong_info['score_bonus']}")

            # Step 3: 복음/반음 감지 (Task 8)
            current_step = "timing"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            timing_info = self.detect_timing_patterns(pillars, day_stem, day_branch)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 3 완료: 복음={len(timing_info['fuyin'])}, 반음={len(timing_info['fanyin'])}")

            # Step 4: 형/파/해/원진 감지 (Task 12)
            current_step = "negative_interactions"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            negative_interactions_info = self.detect_negative_interactions(pillars, day_branch)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 4 완료: 형={len(negative_interactions_info['hyeong'])}, 파={len(negative_interactions_info['pa'])}, 해={len(negative_interactions_info['hae'])}, 원진={len(negative_interactions_info['wonjin'])}")

            # Step 5: 12신살 감지 (Task 13)
            current_step = "shinssal"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            year_branch = pillars.get('year', {}).get('branch', '')
            shinssal_info = self.detect_12shinssal(year_branch, day_branch)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 5 완료: 신살={[d['name'] for d in shinssal_info['detected']]}")

            # Step 6: 조후용신 분석 (Task 9)
            current_step = "johu"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            johu_info = self.analyze_johu(pillars, day_stem, target_date)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 6 완료: 조후 일치={johu_info['day_stem_matches']}")

            # Step 7: 조후 튜닝 워드 (Task 15)
            current_step = "johu_tuning"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            month_branch = pillars.get('month', {}).get('branch', '')
            johu_tuning_info = self.apply_johu_tuning(month_branch, day_stem)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 7 완료: 기후={johu_tuning_info['climate']}, 해결={johu_tuning_info['is_solved']}")

            # Step 8: 삼합/방합 감지 (Task 10)
            current_step = "combination"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            combination_info = self.detect_combination_formation(pillars, day_branch)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 8 완료: 삼합={len(combination_info['samhap_formed'])}, 방합={len(combination_info['banghap_formed'])}")

            # Step 9: 용신 정보 조회 (Task 11)
            current_step = "useful_god"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            useful_god = await self.get_useful_god_from_report(profile_id)
            useful_god_match = self.check_useful_god_match(useful_god, day_stem)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 9 완료: 용신={useful_god}, 일치={useful_god_match['matches']}")

            # Step 10: 물상론 정보 (Task 14)
            current_step = "mulsangron"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            natal_day_stem = pillars.get('day', {}).get('stem', '')
            mulsangron_info = self.get_mulsangron_info(day_stem, natal_day_stem, language)
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 10 완료: 십신={mulsangron_info.get('ten_god', 'N/A')}")

            # Step 11: Gemini 분석 (3회 재시도 + Fallback)
            current_step = "gemini_analysis"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            fortune_result = await self._analyze_fortune(
                pillars=pillars,
                day_stem=day_stem,
                day_branch=day_branch,
                target_date=target_date,
                language=language,
                # 고도화 정보 전달 (Task 7-15)
                wunseong_info=wunseong_info,
                timing_info=timing_info,
                johu_info=johu_info,
                combination_info=combination_info,
                useful_god=useful_god,
                # Task 12-15 신규
                negative_interactions_info=negative_interactions_info,
                shinssal_info=shinssal_info,
                johu_tuning_info=johu_tuning_info,
                mulsangron_info=mulsangron_info,
            )
            is_fallback = fortune_result.get("_fallback", False)
            step_statuses[current_step] = "completed"
            base_score = fortune_result.get("overallScore", 50)
            logger.info(f"[DailyFortune] Step 11 완료: Gemini base_score={base_score}, fallback={is_fallback}")

            # Step 12-13: 점수 보정 및 영역별 반영
            current_step = "score_adjustment"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )

            # 각 모듈별 점수 보정 합산 (Task 7-15)
            # 긍정적 보너스
            total_bonus = (
                wunseong_info.get('score_bonus', 0) +
                johu_info.get('score_bonus', 0) +
                combination_info.get('score_bonus', 0) +
                useful_god_match.get('score_bonus', 0) +
                shinssal_info.get('total_bonus', 0) +           # Task 13
                johu_tuning_info.get('score_bonus', 0)          # Task 15
            )

            # 부정적 패널티 (Task 12: 형/파/해/원진)
            total_penalty = negative_interactions_info.get('total_penalty', 0)

            # 복음/반음 배수 적용 (편차 증폭)
            timing_modifier = timing_info.get('score_modifier', 1.0)
            # 편차를 증폭: (base + bonus + penalty - 50) * modifier + 50
            adjusted_score = int((base_score + total_bonus + total_penalty - 50) * timing_modifier + 50)
            overall_score = max(0, min(100, adjusted_score))
            logger.info(f"[DailyFortune] Step 12 완료: 최종 점수={overall_score} (base={base_score}, bonus={total_bonus}, penalty={total_penalty}, modifier={timing_modifier})")

            # Step 13: 영역별 점수 반영 (국 형성 시)
            current_step = "area_adjustment"
            step_statuses[current_step] = "in_progress"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="in_progress",
                progress_percent=DAILY_FORTUNE_PROGRESS[current_step],
                step_statuses=step_statuses
            )
            fortune_result = self.apply_combination_to_areas(fortune_result, combination_info)
            step_statuses["score_adjustment"] = "completed"
            step_statuses[current_step] = "completed"
            logger.info(f"[DailyFortune] Step 13 완료: 영역별 점수 반영")

            # 개인화된 행운 정보 (Task 11)
            lucky_info = self.get_personalized_lucky_info(
                useful_god, day_pillars["element"], language
            )

            # 결과 구성
            result = {
                "fortune_date": target_date,
                "day_stem": day_stem,
                "day_branch": day_branch,
                "day_element": day_pillars["element"],
                "overall_score": overall_score,
                "summary": fortune_result.get("summary", ""),

                # 개인화된 행운 정보 (Task 11)
                "lucky_color": lucky_info["luckyColor"],
                "lucky_number": lucky_info["luckyNumber"],
                "lucky_direction": lucky_info["luckyDirection"],

                # 영역별 운세
                "career_fortune": fortune_result.get("careerFortune", {}),
                "wealth_fortune": fortune_result.get("wealthFortune", {}),
                "love_fortune": fortune_result.get("loveFortune", {}),
                "health_fortune": fortune_result.get("healthFortune", {}),
                "relationship_fortune": fortune_result.get("relationshipFortune", {}),

                # 종합 조언 (특별 메시지 포함)
                "advice": self._build_combined_advice(
                    fortune_result.get("advice", ""),
                    timing_info,
                    useful_god_match,
                    combination_info,
                    language
                ),

                "language": language,

                # 분석 메타 정보 (디버깅/분석용)
                "_analysis_meta": {
                    # Task 7: 12운성
                    "wunseong": wunseong_info.get("wunseong"),
                    "wunseong_description": wunseong_info.get("description", {}).get(language, ""),
                    # Task 8: 복음/반음
                    "fuyin_count": len(timing_info.get("fuyin", [])),
                    "fanyin_count": len(timing_info.get("fanyin", [])),
                    # Task 9: 조후용신
                    "johu_matched": johu_info.get("day_stem_matches"),
                    "johu_advice": johu_info.get("advice", {}).get(language, ""),
                    # Task 10: 삼합/방합
                    "combination_formed": bool(
                        combination_info.get("samhap_formed") or
                        combination_info.get("banghap_formed") or
                        combination_info.get("banhap_formed")
                    ),
                    "combination_type": (
                        "삼합" if combination_info.get("samhap_formed") else
                        "방합" if combination_info.get("banghap_formed") else
                        "반합" if combination_info.get("banhap_formed") else None
                    ),
                    "affected_element": combination_info.get("affected_element"),
                    # Task 11: 용신
                    "useful_god": useful_god,
                    "useful_god_matched": useful_god_match.get("matches"),
                    "personalized_lucky": lucky_info.get("personalized", False),
                    # Task 12: 형/파/해/원진
                    "negative_interactions": {
                        "hyeong_count": len(negative_interactions_info.get("hyeong", [])),
                        "pa_count": len(negative_interactions_info.get("pa", [])),
                        "hae_count": len(negative_interactions_info.get("hae", [])),
                        "wonjin_count": len(negative_interactions_info.get("wonjin", [])),
                        "total_penalty": negative_interactions_info.get("total_penalty", 0),
                    },
                    # Task 13: 12신살
                    "shinssal_detected": [d["name"] for d in shinssal_info.get("detected", [])],
                    "shinssal_bonus": shinssal_info.get("total_bonus", 0),
                    # Task 14: 물상론
                    "mulsangron": {
                        "ten_god": mulsangron_info.get("ten_god"),
                        "ten_god_hanja": mulsangron_info.get("ten_god_hanja"),
                        "relationship": mulsangron_info.get("relationship"),
                    } if mulsangron_info.get("ten_god") else None,
                    # Task 15: 조후 튜닝
                    "johu_tuning": {
                        "climate": johu_tuning_info.get("climate"),
                        "is_solved": johu_tuning_info.get("is_solved"),
                        "bonus": johu_tuning_info.get("score_bonus", 0),
                    },
                    # v3.0: Fallback 여부
                    "is_fallback": is_fallback,
                    # 점수 상세 분석
                    "score_breakdown": {
                        "base": base_score,
                        "wunseong_bonus": wunseong_info.get("score_bonus", 0),
                        "johu_bonus": johu_info.get("score_bonus", 0),
                        "combination_bonus": combination_info.get("score_bonus", 0),
                        "useful_god_bonus": useful_god_match.get("score_bonus", 0),
                        "shinssal_bonus": shinssal_info.get("total_bonus", 0),      # Task 13
                        "johu_tuning_bonus": johu_tuning_info.get("score_bonus", 0), # Task 15
                        "negative_penalty": total_penalty,                           # Task 12
                        "timing_modifier": timing_modifier,
                        "final": overall_score,
                    }
                }
            }

            # Step 14: DB 저장 (최종 완료)
            current_step = "complete"
            step_statuses[current_step] = "in_progress"

            saved = await self._save_to_db(user_id, profile_id, result)
            if saved:
                result["id"] = saved.get("id")

            # 완료 상태 업데이트
            step_statuses[current_step] = "completed"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="completed",
                progress_percent=100,
                step_statuses=step_statuses
            )

            logger.info(f"[DailyFortune] 완료: user={user_id}, score={overall_score}, fallback={is_fallback}")
            return result

        except Exception as e:
            logger.error(f"[DailyFortune] 실패 (step={current_step}): {e}")
            # v3.0: 실패 상태 저장
            step_statuses[current_step] = "failed"
            await self._update_fortune_status(
                user_id, profile_id, target_date,
                status="failed",
                progress_percent=DAILY_FORTUNE_PROGRESS.get(current_step, 0),
                step_statuses=step_statuses,
                error={"step": current_step, "message": str(e)}
            )
            raise

    async def _analyze_fortune(
        self,
        pillars: Dict[str, Any],
        day_stem: str,
        day_branch: str,
        target_date: str,
        language: str,
        # 고도화 정보 (Task 7-11)
        wunseong_info: Dict[str, Any] = None,
        timing_info: Dict[str, Any] = None,
        johu_info: Dict[str, Any] = None,
        combination_info: Dict[str, Any] = None,
        useful_god: str = None,
        # Task 12-15 신규
        negative_interactions_info: Dict[str, Any] = None,
        shinssal_info: Dict[str, Any] = None,
        johu_tuning_info: Dict[str, Any] = None,
        mulsangron_info: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Gemini로 오늘의 운세 분석 (고도화된 프롬프트)

        Args:
            pillars: 사주 팔자
            day_stem: 당일 천간
            day_branch: 당일 지지
            target_date: 대상 날짜
            language: 언어
            wunseong_info: 12운성 정보 (Task 7)
            timing_info: 복음/반음 정보 (Task 8)
            johu_info: 조후용신 정보 (Task 9)
            combination_info: 삼합/방합 정보 (Task 10)
            useful_god: 용신 오행 (Task 11)
            negative_interactions_info: 형/파/해/원진 정보 (Task 12)
            shinssal_info: 12신살 정보 (Task 13)
            johu_tuning_info: 조후 튜닝 정보 (Task 15)
            mulsangron_info: 물상론 정보 (Task 14)

        Returns:
            분석 결과 JSON
        """
        gemini = self._get_gemini()

        # 프롬프트 생성 (고도화 정보 전달)
        prompt = DailyFortunePrompts.build_fortune_prompt(
            language=language,
            pillars=pillars,
            day_stem=day_stem,
            day_branch=day_branch,
            target_date=target_date,
            wunseong_info=wunseong_info,
            timing_info=timing_info,
            johu_info=johu_info,
            combination_info=combination_info,
            useful_god=useful_god,
            # Task 12-15 신규
            negative_interactions_info=negative_interactions_info,
            shinssal_info=shinssal_info,
            johu_tuning_info=johu_tuning_info,
            mulsangron_info=mulsangron_info,
        )

        # 3회 재시도
        max_retries = 3
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[DailyFortune] Gemini 호출 시도 {attempt}/{max_retries}")

                # response_schema가 있으면 스키마 기반 생성
                result = await gemini.generate_with_schema(
                    prompt,
                    response_schema=DAILY_FORTUNE_SCHEMA,
                    previous_error=last_error if attempt > 1 else None
                )

                # v4.0: 정규화 + Pydantic 검증
                normalized = normalize_all_keys(normalize_response("daily_fortune", result))
                validated = validate_daily_fortune(normalized, raise_on_error=True)

                logger.info("[DailyFortune] 정규화 + 검증 완료")
                return validated

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[DailyFortune] Gemini 호출 실패 ({attempt}/{max_retries}): {e}")

        # v3.0: 3회 실패 시 Fallback 응답 반환 (기존: raise)
        logger.error(f"[DailyFortune] Gemini 최종 실패, Fallback 적용: {last_error}")
        return self._get_fallback_fortune(language)

    async def _save_to_db(
        self,
        user_id: str,
        profile_id: str,
        result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        DB에 운세 저장 (UPSERT)

        Args:
            user_id: 사용자 ID
            profile_id: 프로필 ID
            result: 운세 결과

        Returns:
            저장된 레코드
        """
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Supabase 설정이 없어 DB 저장 스킵")
            return None

        insert_data = {
            "user_id": user_id,
            "profile_id": profile_id,
            "fortune_date": result["fortune_date"],
            "day_stem": result["day_stem"],
            "day_branch": result["day_branch"],
            "day_element": result["day_element"],
            "overall_score": result["overall_score"],
            "summary": result["summary"],
            "lucky_color": result.get("lucky_color"),
            "lucky_number": result.get("lucky_number"),
            "lucky_direction": result.get("lucky_direction"),
            "career_fortune": result.get("career_fortune"),
            "wealth_fortune": result.get("wealth_fortune"),
            "love_fortune": result.get("love_fortune"),
            "health_fortune": result.get("health_fortune"),
            "relationship_fortune": result.get("relationship_fortune"),
            "advice": result.get("advice"),
            "language": result.get("language", "ko"),
        }

        try:
            async with httpx.AsyncClient() as client:
                # UPSERT (user_id, fortune_date 기준 - DB UNIQUE 제약)
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/daily_fortunes",
                    json=insert_data,
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation,resolution=merge-duplicates"
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                logger.info(f"[DailyFortune] DB 저장 완료: profile={profile_id}, date={result['fortune_date']}")
                return data[0] if data else None

        except Exception as e:
            logger.error(f"[DailyFortune] DB 저장 실패: {e}")
            return None


# 싱글톤 인스턴스
daily_fortune_service = DailyFortuneService()
