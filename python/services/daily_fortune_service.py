"""
오늘의 운세 분석 서비스
간소화된 3단계 파이프라인 (신년분석 7단계 대비)

파이프라인 단계:
1. day_calculation - 당일 간지 계산 (만세력 엔진)
2. fortune_analysis - Gemini 6개 영역 분석
3. db_save - DB 저장
"""
import asyncio
import logging
import os
import json
import httpx
from datetime import datetime, date
from typing import Dict, Any, Optional

from prompts.daily_prompts import (
    DailyFortunePrompts,
    DAILY_FORTUNE_SCHEMA,
    STEM_ELEMENT,
)
from .gemini import get_gemini_service

logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# 60갑자 테이블 (일진 계산용)
STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']


class DailyFortuneService:
    """오늘의 운세 분석 서비스 (3단계 간소화 파이프라인)"""

    def __init__(self):
        self.gemini = None  # lazy init

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

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
        오늘의 운세 생성 (3단계 파이프라인)

        Args:
            user_id: 사용자 ID
            profile_id: 프로필 ID
            target_date: 대상 날짜 (YYYY-MM-DD)
            pillars: 사주 팔자
            daewun: 대운 목록 (선택)
            language: 언어

        Returns:
            오늘의 운세 결과
        """
        logger.info(f"[DailyFortune] 시작: user={user_id}, date={target_date}")

        try:
            # Step 1: 당일 간지 계산
            day_pillars = self.calculate_day_pillars(target_date)
            logger.info(f"[DailyFortune] Step 1 완료: {day_pillars}")

            # Step 2: Gemini 분석
            fortune_result = await self._analyze_fortune(
                pillars=pillars,
                day_stem=day_pillars["stem"],
                day_branch=day_pillars["branch"],
                target_date=target_date,
                language=language
            )
            logger.info(f"[DailyFortune] Step 2 완료: score={fortune_result.get('overallScore')}")

            # Step 3: DB 저장 및 결과 구성
            result = {
                "fortune_date": target_date,
                "day_stem": day_pillars["stem"],
                "day_branch": day_pillars["branch"],
                "day_element": day_pillars["element"],
                "overall_score": fortune_result.get("overallScore", 50),
                "summary": fortune_result.get("summary", ""),
                "lucky_color": fortune_result.get("luckyColor"),
                "lucky_number": fortune_result.get("luckyNumber"),
                "lucky_direction": fortune_result.get("luckyDirection"),
                "career_fortune": fortune_result.get("careerFortune", {}),
                "wealth_fortune": fortune_result.get("wealthFortune", {}),
                "love_fortune": fortune_result.get("loveFortune", {}),
                "health_fortune": fortune_result.get("healthFortune", {}),
                "relationship_fortune": fortune_result.get("relationshipFortune", {}),
                "advice": fortune_result.get("advice", ""),
                "language": language,
            }

            # DB 저장
            saved = await self._save_to_db(user_id, profile_id, result)
            if saved:
                result["id"] = saved.get("id")

            logger.info(f"[DailyFortune] 완료: user={user_id}, date={target_date}")
            return result

        except Exception as e:
            logger.error(f"[DailyFortune] 실패: {e}")
            raise

    async def _analyze_fortune(
        self,
        pillars: Dict[str, Any],
        day_stem: str,
        day_branch: str,
        target_date: str,
        language: str
    ) -> Dict[str, Any]:
        """
        Gemini로 오늘의 운세 분석

        Args:
            pillars: 사주 팔자
            day_stem: 당일 천간
            day_branch: 당일 지지
            target_date: 대상 날짜
            language: 언어

        Returns:
            분석 결과 JSON
        """
        gemini = self._get_gemini()

        # 프롬프트 생성
        prompt = DailyFortunePrompts.build_fortune_prompt(
            language=language,
            pillars=pillars,
            day_stem=day_stem,
            day_branch=day_branch,
            target_date=target_date
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

                # 필수 필드 검증
                required = ["overallScore", "summary", "careerFortune", "wealthFortune",
                           "loveFortune", "healthFortune", "relationshipFortune", "advice"]
                missing = [f for f in required if f not in result]
                if missing:
                    raise ValueError(f"필수 필드 누락: {missing}")

                return result

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[DailyFortune] Gemini 호출 실패 ({attempt}/{max_retries}): {e}")

        raise ValueError(f"Gemini 분석 최종 실패: {last_error}")

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
                # UPSERT (profile_id, fortune_date 기준)
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
