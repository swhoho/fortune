"""
신년 사주 분석 서비스
비동기 백그라운드 작업 처리 (8단계 순차 파이프라인)

파이프라인 단계:
1. yearly_overview - 기본 정보 (year, summary, theme, score)
2-5. monthly_1_3, monthly_4_6, monthly_7_9, monthly_10_12 - 월별 운세
6. yearly_advice - 6섹션 연간 조언
7. key_dates - 핵심 길흉일
8. classical_refs - 고전 인용
"""
import asyncio
import uuid
import logging
import os
import json
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, List

from schemas.yearly import (
    JobStatus,
    YearlyAnalysisRequest,
    YearlyAnalysisResult,
)
from prompts.yearly_steps import YearlyStepPrompts
from .gemini import get_gemini_service
from .normalizers import normalize_all_keys

logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class JobStore:
    """인메모리 작업 저장소 (Railway에서는 충분)"""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create(self, job_id: str, user_id: str, analysis_id: str = None) -> Dict[str, Any]:
        """작업 생성"""
        now = datetime.utcnow().isoformat()
        job = {
            "job_id": job_id,
            "user_id": user_id,
            "analysis_id": analysis_id,
            "status": JobStatus.PENDING,
            "progress_percent": 0,
            "current_step": None,
            "step_statuses": {
                "yearly_overview": "pending",
                "monthly_1_3": "pending",
                "monthly_4_6": "pending",
                "monthly_7_9": "pending",
                "monthly_10_12": "pending",
                "yearly_advice": "pending",
                "key_dates": "pending",
                "classical_refs": "pending",
                "complete": "pending",
            },
            "result": None,
            "error": None,
            "error_step": None,
            "created_at": now,
            "updated_at": now,
        }
        self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 조회"""
        return self._jobs.get(job_id)

    def update(self, job_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        """작업 업데이트"""
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.update(kwargs)
        job["updated_at"] = datetime.utcnow().isoformat()
        return job

    def update_step_status(self, job_id: str, step: str, status: str) -> None:
        """단계 상태 업데이트"""
        job = self._jobs.get(job_id)
        if job and "step_statuses" in job:
            job["step_statuses"][step] = status
            job["updated_at"] = datetime.utcnow().isoformat()

    def delete(self, job_id: str) -> bool:
        """작업 삭제"""
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False

    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """오래된 작업 정리"""
        now = datetime.utcnow()
        to_delete = []

        for job_id, job in self._jobs.items():
            created = datetime.fromisoformat(job["created_at"])
            age = (now - created).total_seconds() / 3600
            if age > max_age_hours:
                to_delete.append(job_id)

        for job_id in to_delete:
            del self._jobs[job_id]


# 글로벌 작업 저장소
job_store = JobStore()


# 단계별 진행률
STEP_PROGRESS = {
    "yearly_overview": 10,
    "monthly_1_3": 22,
    "monthly_4_6": 34,
    "monthly_7_9": 46,
    "monthly_10_12": 58,
    "yearly_advice": 75,
    "key_dates": 85,
    "classical_refs": 95,
    "complete": 100,
}


class YearlyAnalysisService:
    """신년 분석 서비스 (8단계 순차 파이프라인)"""

    def __init__(self):
        self.gemini = None  # lazy init

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

    async def start_analysis(self, request: YearlyAnalysisRequest) -> str:
        """
        분석 작업 시작 (백그라운드)

        Args:
            request: 분석 요청

        Returns:
            작업 ID
        """
        # 작업 ID 생성
        job_id = str(uuid.uuid4())

        # 작업 생성 (analysis_id 포함)
        analysis_id = getattr(request, 'analysis_id', None)
        job_store.create(job_id, request.user_id, analysis_id)

        # 백그라운드에서 분석 실행
        asyncio.create_task(self._run_analysis(job_id, request))

        return job_id

    async def _run_analysis(self, job_id: str, request: YearlyAnalysisRequest):
        """
        백그라운드 분석 실행 (8단계 순차 파이프라인)

        Args:
            job_id: 작업 ID
            request: 분석 요청
        """
        analysis_id = getattr(request, 'analysis_id', None)

        try:
            logger.info(f"[{job_id}] 신년 분석 시작: year={request.target_year}")

            # 결과 저장용 딕셔너리
            result = {}

            # 1. yearly_overview
            overview = await self._step_yearly_overview(job_id, request)
            if overview:
                result.update(overview)

            # 2-5. monthly_1_3 → monthly_4_6 → monthly_7_9 → monthly_10_12 (순차)
            result["monthlyFortunes"] = []

            monthly_1_3 = await self._step_monthly(job_id, request, [1, 2, 3], result)
            if monthly_1_3:
                result["monthlyFortunes"].extend(monthly_1_3.get("monthlyFortunes", []))

            monthly_4_6 = await self._step_monthly(job_id, request, [4, 5, 6], result)
            if monthly_4_6:
                result["monthlyFortunes"].extend(monthly_4_6.get("monthlyFortunes", []))

            monthly_7_9 = await self._step_monthly(job_id, request, [7, 8, 9], result)
            if monthly_7_9:
                result["monthlyFortunes"].extend(monthly_7_9.get("monthlyFortunes", []))

            monthly_10_12 = await self._step_monthly(job_id, request, [10, 11, 12], result)
            if monthly_10_12:
                result["monthlyFortunes"].extend(monthly_10_12.get("monthlyFortunes", []))

            # 6. yearly_advice
            advice = await self._step_yearly_advice(job_id, request, result)
            if advice:
                result["yearlyAdvice"] = advice.get("yearlyAdvice", {})

            # 7. key_dates
            key_dates = await self._step_key_dates(job_id, request, result)
            if key_dates:
                result["keyDates"] = key_dates.get("keyDates", [])

            # 8. classical_refs
            refs = await self._step_classical_refs(job_id, request, result)
            if refs:
                result["classicalReferences"] = refs.get("classicalReferences", [])

            # quarterlyHighlights 빈 배열로 추가 (호환성)
            result["quarterlyHighlights"] = []

            # 9. 완료 - DB 최종 저장
            job_store.update_step_status(job_id, "complete", "completed")
            job_store.update(
                job_id,
                status=JobStatus.COMPLETED,
                current_step=None,
                progress_percent=100,
                result=result
            )

            # Supabase에 최종 결과 저장
            if analysis_id:
                await self._update_db_analysis(analysis_id, result, "completed")

            logger.info(f"[{job_id}] 신년 분석 완료")

        except Exception as e:
            logger.error(f"[{job_id}] 신년 분석 실패: {e}")
            job = job_store.get(job_id)
            current_step = job.get("current_step") if job else "unknown"

            job_store.update(
                job_id,
                status=JobStatus.FAILED,
                error=str(e),
                error_step=current_step
            )

            # DB에 실패 상태 저장
            if analysis_id:
                await self._update_db_status(analysis_id, "failed", str(e))

    async def _step_yearly_overview(
        self,
        job_id: str,
        request: YearlyAnalysisRequest
    ) -> Optional[Dict[str, Any]]:
        """Step 1: 연간 기본 정보 (3회 재시도)"""
        step_name = "yearly_overview"
        max_retries = 3

        job_store.update(
            job_id,
            status=JobStatus.IN_PROGRESS,
            current_step=step_name,
            progress_percent=STEP_PROGRESS[step_name]
        )
        job_store.update_step_status(job_id, step_name, "in_progress")

        analysis_id = getattr(request, 'analysis_id', None)
        success = False
        last_error = None
        result = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[{job_id}] {step_name} 시도 {attempt}/{max_retries}")

                # 프롬프트 빌드
                prompt = YearlyStepPrompts.build_overview(
                    language=request.language,
                    year=request.target_year,
                    pillars=request.pillars,
                    daewun=request.daewun
                )

                # Gemini 호출
                result = await self._call_gemini(prompt, step_name)

                # 빈 응답 검증
                if not result or not result.get("year"):
                    raise ValueError("빈 응답 또는 year 필드 없음")

                # 성공
                logger.info(f"[{job_id}] {step_name} 성공: {json.dumps(result, ensure_ascii=False)[:200]}")
                job_store.update_step_status(job_id, step_name, "completed")

                # DB 중간 저장
                if analysis_id:
                    await self._update_db_analysis(analysis_id, result, "in_progress")

                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[{job_id}] {step_name} 실패 ({attempt}/{max_retries}): {e}")

        if not success:
            logger.error(f"[{job_id}] {step_name} 최종 실패: {last_error}")
            job_store.update_step_status(job_id, step_name, "failed")
            return None

        return result

    async def _step_monthly(
        self,
        job_id: str,
        request: YearlyAnalysisRequest,
        months: List[int],
        previous_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Steps 2-5: 월별 운세 (3회 재시도)"""
        step_name = f"monthly_{months[0]}_{months[-1]}"
        max_retries = 3

        job_store.update(
            job_id,
            current_step=step_name,
            progress_percent=STEP_PROGRESS[step_name]
        )
        job_store.update_step_status(job_id, step_name, "in_progress")

        analysis_id = getattr(request, 'analysis_id', None)
        success = False
        last_error = None
        result = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[{job_id}] {step_name} 시도 {attempt}/{max_retries}")

                # 이전 결과에서 overview 정보 추출
                overview_result = {
                    "yearlyTheme": previous_result.get("yearlyTheme", ""),
                    "overallScore": previous_result.get("overallScore", 50)
                }

                # 프롬프트 빌드
                prompt = YearlyStepPrompts.build_monthly(
                    language=request.language,
                    year=request.target_year,
                    months=months,
                    pillars=request.pillars,
                    daewun=request.daewun,
                    overview_result=overview_result
                )

                # Gemini 호출
                result = await self._call_gemini(prompt, step_name)

                # 빈 응답 검증
                monthly_data = result.get("monthlyFortunes", [])
                if not result or not monthly_data or len(monthly_data) != len(months):
                    raise ValueError(f"monthlyFortunes 누락 또는 개수 불일치 (expected={len(months)}, got={len(monthly_data)})")

                # 성공
                logger.info(f"[{job_id}] {step_name} 성공: {len(monthly_data)}개월 데이터")
                job_store.update_step_status(job_id, step_name, "completed")

                # DB 중간 저장
                if analysis_id:
                    partial_result = dict(previous_result)
                    if "monthlyFortunes" not in partial_result:
                        partial_result["monthlyFortunes"] = []
                    partial_result["monthlyFortunes"].extend(monthly_data)
                    await self._update_db_analysis(analysis_id, partial_result, "in_progress")

                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[{job_id}] {step_name} 실패 ({attempt}/{max_retries}): {e}")

        if not success:
            logger.error(f"[{job_id}] {step_name} 최종 실패: {last_error}")
            job_store.update_step_status(job_id, step_name, "failed")
            return None

        return result

    async def _step_yearly_advice(
        self,
        job_id: str,
        request: YearlyAnalysisRequest,
        previous_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Step 6: 연간 조언 6섹션 (3회 재시도)"""
        step_name = "yearly_advice"
        max_retries = 3

        job_store.update(
            job_id,
            current_step=step_name,
            progress_percent=STEP_PROGRESS[step_name]
        )
        job_store.update_step_status(job_id, step_name, "in_progress")

        analysis_id = getattr(request, 'analysis_id', None)
        success = False
        last_error = None
        result = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[{job_id}] {step_name} 시도 {attempt}/{max_retries}")

                # 이전 결과에서 overview 정보 추출
                overview_result = {
                    "yearlyTheme": previous_result.get("yearlyTheme", ""),
                    "overallScore": previous_result.get("overallScore", 50)
                }

                # 프롬프트 빌드
                prompt = YearlyStepPrompts.build_yearly_advice(
                    language=request.language,
                    year=request.target_year,
                    pillars=request.pillars,
                    daewun=request.daewun,
                    overview_result=overview_result
                )

                # Gemini 호출
                result = await self._call_gemini(prompt, step_name)

                # 빈 응답 검증
                advice = result.get("yearlyAdvice", {})
                if not result or not advice:
                    raise ValueError("yearlyAdvice 필드 누락")

                # 6개 섹션 확인
                required_sections = [
                    "nature_and_soul", "wealth_and_success", "career_and_honor",
                    "document_and_wisdom", "relationship_and_love", "health_and_movement"
                ]
                missing = [s for s in required_sections if s not in advice]
                if missing:
                    raise ValueError(f"누락된 섹션: {missing}")

                # 성공
                logger.info(f"[{job_id}] {step_name} 성공: {len(advice)}개 섹션")
                job_store.update_step_status(job_id, step_name, "completed")

                # DB 중간 저장
                if analysis_id:
                    partial_result = dict(previous_result)
                    partial_result["yearlyAdvice"] = advice
                    await self._update_db_analysis(analysis_id, partial_result, "in_progress")

                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[{job_id}] {step_name} 실패 ({attempt}/{max_retries}): {e}")

        if not success:
            logger.error(f"[{job_id}] {step_name} 최종 실패: {last_error}")
            job_store.update_step_status(job_id, step_name, "failed")
            return None

        return result

    async def _step_key_dates(
        self,
        job_id: str,
        request: YearlyAnalysisRequest,
        previous_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Step 7: 핵심 길흉일 (3회 재시도)"""
        step_name = "key_dates"
        max_retries = 3

        job_store.update(
            job_id,
            current_step=step_name,
            progress_percent=STEP_PROGRESS[step_name]
        )
        job_store.update_step_status(job_id, step_name, "in_progress")

        analysis_id = getattr(request, 'analysis_id', None)
        success = False
        last_error = None
        result = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[{job_id}] {step_name} 시도 {attempt}/{max_retries}")

                # 프롬프트 빌드
                prompt = YearlyStepPrompts.build_key_dates(
                    language=request.language,
                    year=request.target_year,
                    pillars=request.pillars,
                    monthly_fortunes=previous_result.get("monthlyFortunes", [])
                )

                # Gemini 호출
                result = await self._call_gemini(prompt, step_name)

                # 빈 응답 검증
                key_dates = result.get("keyDates", [])
                if not result or not key_dates:
                    raise ValueError("keyDates 필드 누락 또는 빈 배열")

                # 최소 5개 이상 확인
                if len(key_dates) < 5:
                    raise ValueError(f"keyDates 개수 부족 (min=5, got={len(key_dates)})")

                # 성공
                logger.info(f"[{job_id}] {step_name} 성공: {len(key_dates)}개 날짜")
                job_store.update_step_status(job_id, step_name, "completed")

                # DB 중간 저장
                if analysis_id:
                    partial_result = dict(previous_result)
                    partial_result["keyDates"] = key_dates
                    await self._update_db_analysis(analysis_id, partial_result, "in_progress")

                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[{job_id}] {step_name} 실패 ({attempt}/{max_retries}): {e}")

        if not success:
            logger.error(f"[{job_id}] {step_name} 최종 실패: {last_error}")
            job_store.update_step_status(job_id, step_name, "failed")
            return None

        return result

    async def _step_classical_refs(
        self,
        job_id: str,
        request: YearlyAnalysisRequest,
        previous_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Step 8: 고전 인용 (3회 재시도)"""
        step_name = "classical_refs"
        max_retries = 3

        job_store.update(
            job_id,
            current_step=step_name,
            progress_percent=STEP_PROGRESS[step_name]
        )
        job_store.update_step_status(job_id, step_name, "in_progress")

        analysis_id = getattr(request, 'analysis_id', None)
        success = False
        last_error = None
        result = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[{job_id}] {step_name} 시도 {attempt}/{max_retries}")

                # 이전 결과에서 overview 정보 추출
                overview_result = {
                    "yearlyTheme": previous_result.get("yearlyTheme", ""),
                    "overallScore": previous_result.get("overallScore", 50)
                }

                # 프롬프트 빌드
                prompt = YearlyStepPrompts.build_classical_refs(
                    language=request.language,
                    year=request.target_year,
                    pillars=request.pillars,
                    overview_result=overview_result
                )

                # Gemini 호출
                result = await self._call_gemini(prompt, step_name)

                # 빈 응답 검증
                refs = result.get("classicalReferences", [])
                if not result or not refs:
                    raise ValueError("classicalReferences 필드 누락 또는 빈 배열")

                # 최소 2개 이상 확인
                if len(refs) < 2:
                    raise ValueError(f"classicalReferences 개수 부족 (min=2, got={len(refs)})")

                # 성공
                logger.info(f"[{job_id}] {step_name} 성공: {len(refs)}개 인용")
                job_store.update_step_status(job_id, step_name, "completed")

                # DB 중간 저장
                if analysis_id:
                    partial_result = dict(previous_result)
                    partial_result["classicalReferences"] = refs
                    await self._update_db_analysis(analysis_id, partial_result, "in_progress")

                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[{job_id}] {step_name} 실패 ({attempt}/{max_retries}): {e}")

        if not success:
            logger.error(f"[{job_id}] {step_name} 최종 실패: {last_error}")
            job_store.update_step_status(job_id, step_name, "failed")
            return None

        return result

    async def _call_gemini(self, prompt: str, step: str) -> Dict[str, Any]:
        """Gemini API 호출 (단계별 전용 메서드 사용, 결과 키 정규화)"""
        gemini = self._get_gemini()
        result = await gemini.generate_yearly_step(prompt, step)
        # DB 저장 전 camelCase 정규화
        return normalize_all_keys(result)

    async def _update_db_analysis(
        self,
        analysis_id: str,
        analysis: Dict[str, Any],
        status: str = "in_progress"
    ):
        """Supabase yearly_analyses 테이블 업데이트"""
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Supabase 설정이 없어 DB 업데이트 스킵")
            return

        update_data = {
            "analysis": analysis,
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/yearly_analyses?id=eq.{analysis_id}",
                    json=update_data,
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                logger.info(f"DB 분석 업데이트 완료: analysis_id={analysis_id}, status={status}")
        except Exception as e:
            logger.error(f"DB 분석 업데이트 실패: {e}")

    async def _update_db_status(
        self,
        analysis_id: str,
        status: str,
        error: str = None
    ):
        """Supabase yearly_analyses 상태만 업데이트"""
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Supabase 설정이 없어 DB 업데이트 스킵")
            return

        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }
        if error:
            update_data["error"] = error

        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/yearly_analyses?id=eq.{analysis_id}",
                    json=update_data,
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                logger.info(f"DB 상태 업데이트 완료: analysis_id={analysis_id}, status={status}")
        except Exception as e:
            logger.error(f"DB 상태 업데이트 실패: {e}")

    def get_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 상태 조회"""
        return job_store.get(job_id)


# 싱글톤 인스턴스
yearly_analysis_service = YearlyAnalysisService()
