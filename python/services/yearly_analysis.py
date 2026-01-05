"""
신년 사주 분석 서비스
비동기 백그라운드 작업 처리
"""
import asyncio
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from schemas.yearly import (
    JobStatus,
    YearlyAnalysisRequest,
    YearlyAnalysisResult,
)
from prompts.builder import PromptBuilder, YearlyPromptBuildRequest, PromptBuildOptions
from .gemini import get_gemini_service

logger = logging.getLogger(__name__)


class JobStore:
    """인메모리 작업 저장소 (Railway에서는 충분)"""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create(self, job_id: str, user_id: str) -> Dict[str, Any]:
        """작업 생성"""
        now = datetime.utcnow().isoformat()
        job = {
            "job_id": job_id,
            "user_id": user_id,
            "status": JobStatus.PENDING,
            "progress_percent": 0,
            "current_step": None,
            "result": None,
            "error": None,
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


class YearlyAnalysisService:
    """신년 분석 서비스"""

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

        # 작업 생성
        job_store.create(job_id, request.user_id)

        # 백그라운드에서 분석 실행
        asyncio.create_task(self._run_analysis(job_id, request))

        return job_id

    async def _run_analysis(self, job_id: str, request: YearlyAnalysisRequest):
        """
        백그라운드 분석 실행

        Args:
            job_id: 작업 ID
            request: 분석 요청
        """
        try:
            # 1. 시작
            job_store.update(
                job_id,
                status=JobStatus.IN_PROGRESS,
                current_step="building_prompt",
                progress_percent=10
            )

            # 2. 프롬프트 빌드
            logger.info(f"[{job_id}] 프롬프트 빌드 시작")
            prompt = await self._build_prompt(request)

            job_store.update(
                job_id,
                current_step="ai_analysis",
                progress_percent=30
            )

            # 3. Gemini 분석
            logger.info(f"[{job_id}] Gemini 분석 시작")
            gemini = self._get_gemini()
            result = await gemini.generate_yearly_analysis(prompt)

            job_store.update(
                job_id,
                current_step="saving_result",
                progress_percent=90
            )

            # 4. 완료
            logger.info(f"[{job_id}] 분석 완료")
            job_store.update(
                job_id,
                status=JobStatus.COMPLETED,
                current_step=None,
                progress_percent=100,
                result=result
            )

        except Exception as e:
            logger.error(f"[{job_id}] 분석 실패: {e}")
            job_store.update(
                job_id,
                status=JobStatus.FAILED,
                error=str(e)
            )

    async def _build_prompt(self, request: YearlyAnalysisRequest) -> str:
        """프롬프트 빌드"""
        options = PromptBuildOptions(
            include_ziping=True,
            include_qiongtong=True,
            include_western=True
        )

        builder_request = YearlyPromptBuildRequest(
            language=request.language,
            year=request.target_year,
            pillars=request.pillars,
            daewun=request.daewun or [],
            options=options,
        )

        result = PromptBuilder.build_yearly(builder_request)
        return f"{result.system_prompt}\n\n{result.user_prompt}"

    def get_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 상태 조회"""
        return job_store.get(job_id)


# 싱글톤 인스턴스
yearly_analysis_service = YearlyAnalysisService()
