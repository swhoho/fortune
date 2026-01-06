"""
리포트 분석 서비스
비동기 백그라운드 작업으로 파이프라인 실행
"""
import asyncio
import uuid
import logging
import os
import json
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, List

from schemas.report import (
    JobStatus,
    ReportAnalysisRequest,
    PipelineStep,
)
from prompts.builder import PromptBuilder, PromptBuildOptions
from .gemini import get_gemini_service
from manseryeok.engine import ManseryeokEngine
from manseryeok.constants import JIJANGGAN_TABLE
from schemas.saju import CalculateRequest, Pillars, Pillar
from visualization import SajuVisualizer
from services.normalizers import normalize_response, normalize_all_keys

logger = logging.getLogger(__name__)

# 시각화 인스턴스
visualizer = SajuVisualizer()

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class JobStore:
    """인메모리 작업 저장소"""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create(self, job_id: str, report_id: str, user_id: str) -> Dict[str, Any]:
        """작업 생성"""
        now = datetime.utcnow().isoformat()
        job = {
            "job_id": job_id,
            "report_id": report_id,
            "user_id": user_id,
            "status": JobStatus.PENDING,
            "progress_percent": 0,
            "current_step": None,
            "step_statuses": {
                "manseryeok": "pending",
                "jijanggan": "pending",
                "basic_analysis": "pending",
                "personality": "pending",
                "aptitude": "pending",
                "fortune": "pending",
                "daewun_analysis": "pending",
                "scoring": "pending",
                "visualization": "pending",
                "saving": "pending",
                "complete": "pending",
            },
            "pillars": None,
            "daewun": None,
            "jijanggan": None,
            "analysis": None,
            "scores": None,
            "visualization_url": None,
            "error": None,
            "error_step": None,
            "retryable": True,
            "created_at": now,
            "updated_at": now,
        }
        self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 조회"""
        return self._jobs.get(job_id)

    def get_by_report_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """리포트 ID로 작업 조회"""
        for job in self._jobs.values():
            if job["report_id"] == report_id:
                return job
        return None

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
    "manseryeok": 10,
    "jijanggan": 15,
    "basic_analysis": 30,
    "personality": 45,
    "aptitude": 55,
    "fortune": 65,
    "daewun_analysis": 75,
    "scoring": 85,
    "visualization": 92,
    "saving": 97,
    "complete": 100,
}


class ReportAnalysisService:
    """리포트 분석 서비스"""

    def __init__(self):
        self.gemini = None
        self.engine = ManseryeokEngine()

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

    async def start_analysis(self, request: ReportAnalysisRequest) -> str:
        """
        분석 작업 시작 (백그라운드)

        Args:
            request: 분석 요청

        Returns:
            작업 ID
        """
        job_id = str(uuid.uuid4())

        # 작업 생성
        job_store.create(job_id, request.report_id, request.user_id)

        # 백그라운드에서 분석 실행
        asyncio.create_task(self._run_analysis(job_id, request))

        return job_id

    async def _run_analysis(self, job_id: str, request: ReportAnalysisRequest):
        """백그라운드 분석 실행"""
        try:
            logger.info(f"[{job_id}] 리포트 분석 시작: report_id={request.report_id}")

            # 1. 만세력 계산
            await self._step_manseryeok(job_id, request)

            # 2. 지장간 추출
            await self._step_jijanggan(job_id)

            # 3. 기본 분석 (Gemini)
            await self._step_basic_analysis(job_id, request.language)

            # 4-6. 순차 분석 (Gemini) - 각 단계별 3회 재시도 + DB 중간 저장
            await self._step_sequential_analysis(job_id, request.report_id, request.language)

            # 7. 대운 분석 (Gemini) - 8개 대운 상세 분석
            await self._step_daewun_analysis(job_id, request.report_id, request.language)

            # 8. 점수 계산
            await self._step_scoring(job_id)

            # 9. 시각화 생성
            await self._step_visualization(job_id)

            # 10. DB 저장
            await self._step_saving(job_id, request.report_id)

            # 11. 완료
            job_store.update_step_status(job_id, "complete", "completed")
            job_store.update(
                job_id,
                status=JobStatus.COMPLETED,
                current_step=None,
                progress_percent=100
            )

            logger.info(f"[{job_id}] 리포트 분석 완료")

        except Exception as e:
            logger.error(f"[{job_id}] 리포트 분석 실패: {e}")
            job = job_store.get(job_id)
            current_step = job.get("current_step") if job else "unknown"

            job_store.update(
                job_id,
                status=JobStatus.FAILED,
                error=str(e),
                error_step=current_step,
                retryable=True
            )

            # DB에 실패 상태 저장
            await self._update_db_status(
                request.report_id,
                status="failed",
                error={
                    "step": current_step,
                    "message": str(e),
                    "retryable": True
                }
            )

    async def _step_manseryeok(self, job_id: str, request: ReportAnalysisRequest):
        """만세력 계산 단계"""
        job_store.update(
            job_id,
            status=JobStatus.IN_PROGRESS,
            current_step="manseryeok",
            progress_percent=STEP_PROGRESS["manseryeok"]
        )
        job_store.update_step_status(job_id, "manseryeok", "in_progress")

        # 기존 데이터 있으면 재사용
        if request.existing_pillars and request.retry_from_step != "manseryeok":
            logger.info(f"[{job_id}] 기존 만세력 데이터 재사용")
            job_store.update(
                job_id,
                pillars=request.existing_pillars,
                daewun=request.existing_daewun or []
            )
        else:
            # 만세력 계산
            logger.info(f"[{job_id}] 만세력 계산 시작")
            birth_datetime = f"{request.birth_date}T{request.birth_time or '12:00'}:00"

            calc_request = CalculateRequest(
                birthDatetime=birth_datetime,
                timezone="GMT+9",
                isLunar=request.calendar_type == "lunar",
                gender=request.gender
            )

            result = self.engine.calculate(calc_request)

            job_store.update(
                job_id,
                pillars=result.pillars.model_dump() if hasattr(result.pillars, 'model_dump') else result.pillars,
                daewun=[d.model_dump() if hasattr(d, 'model_dump') else d for d in result.daewun]
            )

        job_store.update_step_status(job_id, "manseryeok", "completed")
        logger.info(f"[{job_id}] 만세력 계산 완료")

    async def _step_jijanggan(self, job_id: str):
        """지장간 추출 단계"""
        job_store.update(
            job_id,
            current_step="jijanggan",
            progress_percent=STEP_PROGRESS["jijanggan"]
        )
        job_store.update_step_status(job_id, "jijanggan", "in_progress")

        job = job_store.get(job_id)
        pillars = job.get("pillars", {})

        jijanggan = {}
        for pillar_name in ["year", "month", "day", "hour"]:
            pillar = pillars.get(pillar_name, {})
            branch = pillar.get("branch", "")
            if branch and branch in JIJANGGAN_TABLE:
                jijanggan[pillar_name] = JIJANGGAN_TABLE[branch]
            else:
                jijanggan[pillar_name] = []

        job_store.update(job_id, jijanggan=jijanggan)
        job_store.update_step_status(job_id, "jijanggan", "completed")
        logger.info(f"[{job_id}] 지장간 추출 완료")

    async def _step_basic_analysis(self, job_id: str, language: str):
        """기본 분석 단계 (Gemini)"""
        job_store.update(
            job_id,
            current_step="basic_analysis",
            progress_percent=STEP_PROGRESS["basic_analysis"]
        )
        job_store.update_step_status(job_id, "basic_analysis", "in_progress")

        job = job_store.get(job_id)
        pillars = job.get("pillars", {})
        daewun = job.get("daewun", [])
        jijanggan = job.get("jijanggan", {})

        prompt = await self._build_step_prompt("basic", language, pillars, daewun, jijanggan)
        result = await self._call_gemini(prompt)

        # analysis에 저장
        analysis = job.get("analysis") or {}
        analysis["basicAnalysis"] = result
        job_store.update(job_id, analysis=analysis)
        job_store.update_step_status(job_id, "basic_analysis", "completed")
        logger.info(f"[{job_id}] 기본 분석 완료")

    async def _step_sequential_analysis(self, job_id: str, report_id: str, language: str):
        """순차 분석 단계 (personality → aptitude → fortune) - 각 단계 성공 시 DB 중간 저장"""
        job = job_store.get(job_id)
        pillars = job.get("pillars", {})
        daewun = job.get("daewun", [])
        jijanggan = job.get("jijanggan", {})
        analysis = job.get("analysis") or {}

        steps = ["personality", "aptitude", "fortune"]
        max_retries = 3

        for step_name in steps:
            job_store.update_step_status(job_id, step_name, "in_progress")
            job_store.update(
                job_id,
                current_step=step_name,
                progress_percent=STEP_PROGRESS[step_name]
            )

            success = False
            last_error = None

            for attempt in range(1, max_retries + 1):
                try:
                    logger.info(f"[{job_id}] {step_name} 분석 시도 {attempt}/{max_retries}")

                    prompt = await self._build_step_prompt(
                        step_name, language, pillars, daewun, jijanggan, analysis
                    )
                    result = await self._call_gemini(prompt)

                    # 응답 검증
                    if not result or (isinstance(result, dict) and len(result) == 0):
                        raise ValueError("빈 응답")

                    # 성공 - DB 저장 전 키 정규화 (단계별 + 전역 camelCase)
                    normalized_result = normalize_all_keys(normalize_response(step_name, result))
                    logger.info(f"[{job_id}] {step_name} 성공 (정규화됨): {json.dumps(normalized_result, ensure_ascii=False)[:300]}")
                    analysis[step_name] = normalized_result
                    job_store.update(job_id, analysis=analysis)
                    job_store.update_step_status(job_id, step_name, "completed")

                    # Supabase 중간 저장 (크래시 복구용)
                    await self._update_db_status(
                        report_id,
                        status="in_progress",
                        analysis=analysis,
                        step_statuses=job_store.get(job_id).get("step_statuses"),
                        progress_percent=STEP_PROGRESS[step_name]
                    )
                    logger.info(f"[{job_id}] {step_name} DB 중간 저장 완료")

                    success = True
                    break

                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"[{job_id}] {step_name} 실패 ({attempt}/{max_retries}): {e}")

            if not success:
                logger.error(f"[{job_id}] {step_name} 최종 실패 (3회 재시도 후): {last_error}")
                job_store.update_step_status(job_id, step_name, "failed")
                # 실패해도 다음 단계로 진행 (analysis에 해당 필드 없음)

        # 최종 상태 저장
        job_store.update(job_id, analysis=analysis)

        # 모두 실패했는지 확인
        success_count = sum(1 for s in steps if s in analysis)
        logger.info(f"[{job_id}] 순차 분석 완료 ({success_count}/{len(steps)} 성공)")

        if success_count == 0:
            raise Exception("모든 분석 실패 (personality, aptitude, fortune)")

    async def _step_daewun_analysis(self, job_id: str, report_id: str, language: str):
        """대운 분석 단계 - 8개 대운 각각에 대해 AI 상세 분석 생성"""
        from prompts.daewun_analysis import build_daewun_analysis_prompt
        from datetime import date

        job_store.update(
            job_id,
            current_step="daewun_analysis",
            progress_percent=STEP_PROGRESS["daewun_analysis"]
        )
        job_store.update_step_status(job_id, "daewun_analysis", "in_progress")

        job = job_store.get(job_id)
        pillars = job.get("pillars", {})
        daewun = job.get("daewun", [])
        analysis = job.get("analysis", {})

        # 기본 분석에서 용신/기신 정보 추출
        basic_analysis = analysis.get("basicAnalysis", {})
        useful_god_data = basic_analysis.get("usefulGod", {})

        day_pillar = pillars.get("day", {})
        day_master = day_pillar.get("stem", "")
        day_master_element = day_pillar.get("element", "")

        # 용신/기신 추출
        useful_god = useful_god_data.get("primary", "")
        harmful_god = useful_god_data.get("harmful", "")

        # 현재 나이 계산 (대략적)
        birth_year = pillars.get("year", {}).get("yearNum", date.today().year - 30)
        current_age = date.today().year - birth_year

        max_retries = 3
        success = False
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[{job_id}] 대운 분석 시도 {attempt}/{max_retries}")

                # 대운 분석 프롬프트 빌드
                prompt = build_daewun_analysis_prompt(
                    day_master=day_master,
                    day_master_element=day_master_element,
                    useful_god=useful_god,
                    harmful_god=harmful_god,
                    current_age=current_age,
                    daewun_list=daewun,
                    language=language
                )

                result = await self._call_gemini(prompt)

                # 응답 검증
                if not result or not isinstance(result, dict):
                    raise ValueError("빈 응답 또는 잘못된 형식")

                daewun_analysis = result.get("daewunAnalysis", [])
                if not daewun_analysis:
                    raise ValueError("daewunAnalysis 필드 없음")

                # 대운 데이터에 AI 분석 결과 병합
                for i, dw in enumerate(daewun):
                    if i < len(daewun_analysis):
                        ai_result = daewun_analysis[i]
                        dw["scoreReasoning"] = ai_result.get("scoreReasoning", "")
                        dw["summary"] = ai_result.get("summary", "")
                        dw["favorablePercent"] = ai_result.get("favorablePercent", 50)
                        dw["unfavorablePercent"] = ai_result.get("unfavorablePercent", 50)

                        # 300자 미만이면 경고 로그
                        summary = dw.get("summary", "")
                        if summary and len(summary) < 300:
                            logger.warning(f"[{job_id}] 대운 {i} summary 길이 부족: {len(summary)}자")

                # 성공 - 인메모리 저장
                job_store.update(job_id, daewun=daewun)
                job_store.update_step_status(job_id, "daewun_analysis", "completed")

                # Supabase 중간 저장
                await self._update_db_status(
                    report_id,
                    status="in_progress",
                    daewun=daewun,
                    step_statuses=job_store.get(job_id).get("step_statuses"),
                    progress_percent=STEP_PROGRESS["daewun_analysis"]
                )

                logger.info(f"[{job_id}] 대운 분석 완료: {len(daewun_analysis)}개 대운 분석됨")
                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[{job_id}] 대운 분석 실패 ({attempt}/{max_retries}): {e}")

        if not success:
            logger.error(f"[{job_id}] 대운 분석 최종 실패 (3회 재시도 후): {last_error}")
            job_store.update_step_status(job_id, "daewun_analysis", "failed")
            # 대운 분석 실패해도 다음 단계로 진행 (기존 대운 데이터 유지)

    async def _step_scoring(self, job_id: str):
        """점수 계산 단계"""
        job_store.update(
            job_id,
            current_step="scoring",
            progress_percent=STEP_PROGRESS["scoring"]
        )
        job_store.update_step_status(job_id, "scoring", "in_progress")

        job = job_store.get(job_id)
        pillars = job.get("pillars", {})
        jijanggan = job.get("jijanggan", {})

        # 점수 계산 (scoring 모듈 사용)
        try:
            from scoring import calculate_scores
            scores = calculate_scores(pillars, jijanggan)
            logger.info(f"[{job_id}] 점수 계산 성공: {list(scores.keys())}")
        except Exception as e:
            # 모든 예외 처리 (ImportError, KeyError, TypeError 등)
            logger.error(f"[{job_id}] 점수 계산 실패: {type(e).__name__}: {e}")
            # 기본 점수
            scores = {
                "work": {"planning": 50, "drive": 50, "execution": 50, "completion": 50, "management": 50},
                "love": {"consideration": 50, "humor": 50, "emotion": 50, "sincerity": 50},
                "aptitude": {"artistry": 50, "business": 50},
                "wealth": {"stability": 50, "growth": 50},
            }

        job_store.update(job_id, scores=scores)
        job_store.update_step_status(job_id, "scoring", "completed")
        logger.info(f"[{job_id}] 점수 계산 완료: {scores}")

    async def _step_visualization(self, job_id: str):
        """시각화 생성 단계"""
        job_store.update(
            job_id,
            current_step="visualization",
            progress_percent=STEP_PROGRESS["visualization"]
        )
        job_store.update_step_status(job_id, "visualization", "in_progress")

        job = job_store.get(job_id)
        pillars_dict = job.get("pillars", {})

        try:
            # dict를 Pillars 모델로 변환
            pillars = Pillars(
                year=Pillar(**pillars_dict.get("year", {})),
                month=Pillar(**pillars_dict.get("month", {})),
                day=Pillar(**pillars_dict.get("day", {})),
                hour=Pillar(**pillars_dict.get("hour", {})),
            )
            # 시각화 생성
            image_base64 = visualizer.generate(pillars)
            job_store.update(job_id, visualization_url=image_base64)
        except Exception as e:
            logger.warning(f"[{job_id}] 시각화 생성 실패 (스킵): {e}")
            job_store.update(job_id, visualization_url="")

        job_store.update_step_status(job_id, "visualization", "completed")
        logger.info(f"[{job_id}] 시각화 생성 완료")

    async def _step_saving(self, job_id: str, report_id: str):
        """DB 저장 단계"""
        job_store.update(
            job_id,
            current_step="saving",
            progress_percent=STEP_PROGRESS["saving"]
        )
        job_store.update_step_status(job_id, "saving", "in_progress")

        job = job_store.get(job_id)

        # Supabase에 결과 저장
        await self._update_db_status(
            report_id,
            status="completed",
            pillars=job.get("pillars"),
            daewun=job.get("daewun"),
            jijanggan=job.get("jijanggan"),
            analysis=job.get("analysis"),
            scores=job.get("scores"),
            visualization_url=job.get("visualization_url"),
            step_statuses=job.get("step_statuses"),
            progress_percent=100
        )

        job_store.update_step_status(job_id, "saving", "completed")
        logger.info(f"[{job_id}] DB 저장 완료")

    async def _build_step_prompt(
        self,
        step: str,
        language: str,
        pillars: Dict[str, Any],
        daewun: List[Dict[str, Any]],
        jijanggan: Dict[str, Any],
        previous_results: Dict[str, Any] = None
    ) -> str:
        """단계별 프롬프트 빌드"""
        from prompts.builder import PromptBuilder

        result = PromptBuilder.build_step(
            step=step,
            pillars=pillars,
            language=language,
            daewun=daewun,
            jijanggan=jijanggan,
            previous_results=previous_results
        )

        return f"{result.system_prompt}\n\n{result.user_prompt}"

    async def _call_gemini(self, prompt: str) -> Dict[str, Any]:
        """Gemini API 호출"""
        gemini = self._get_gemini()
        # generate_content 사용 (yearly_analysis와 다른 형식)
        return await gemini.generate_report_analysis(prompt)

    async def _update_db_status(self, report_id: str, **kwargs):
        """Supabase DB 상태 업데이트"""
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("Supabase 설정이 없어 DB 업데이트 스킵")
            return

        update_data = {
            "updated_at": datetime.utcnow().isoformat(),
        }

        if "status" in kwargs:
            update_data["status"] = kwargs["status"]
        if "progress_percent" in kwargs:
            update_data["progress_percent"] = kwargs["progress_percent"]
        if "pillars" in kwargs:
            update_data["pillars"] = kwargs["pillars"]
        if "daewun" in kwargs:
            update_data["daewun"] = kwargs["daewun"]
        if "jijanggan" in kwargs:
            update_data["jijanggan"] = kwargs["jijanggan"]
        if "analysis" in kwargs:
            update_data["analysis"] = kwargs["analysis"]
        if "scores" in kwargs:
            update_data["scores"] = kwargs["scores"]
        if "visualization_url" in kwargs:
            update_data["visualization_url"] = kwargs["visualization_url"]
        if "error" in kwargs:
            update_data["error"] = kwargs["error"]
        if "step_statuses" in kwargs:
            update_data["step_statuses"] = kwargs["step_statuses"]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/profile_reports?id=eq.{report_id}",
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
                logger.info(f"DB 상태 업데이트 완료: report_id={report_id}")
        except Exception as e:
            logger.error(f"DB 업데이트 실패: {e}")

    def get_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 상태 조회"""
        return job_store.get(job_id)

    def get_status_by_report_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """리포트 ID로 작업 상태 조회"""
        return job_store.get_by_report_id(report_id)


# 싱글톤 인스턴스
report_analysis_service = ReportAnalysisService()
