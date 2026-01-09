"""
궁합 분석 서비스
비동기 백그라운드 작업 처리 (10단계 파이프라인)

파이프라인 단계:
1-2. manseryeok_a, manseryeok_b - 만세력 계산
3-4. compatibility_score, trait_scores - Python 점수 계산
5-9. relationship_type ~ mutual_influence - Gemini 분석
10. saving - DB 저장
"""
import asyncio
import uuid
import logging
import os
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, List

from schemas.compatibility import (
    CompatibilityJobStatus,
    CompatibilityPipelineStep,
    CompatibilityAnalysisRequest,
)
from schemas.gemini_schemas import get_gemini_schema
from .gemini import get_gemini_service
from .normalizers import normalize_all_keys

logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class CompatibilityJobStore:
    """인메모리 작업 저장소"""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create(self, job_id: str, analysis_id: str, user_id: str) -> Dict[str, Any]:
        """작업 생성"""
        now = datetime.utcnow().isoformat()
        job = {
            "job_id": job_id,
            "analysis_id": analysis_id,
            "user_id": user_id,
            "status": CompatibilityJobStatus.PENDING,
            "progress_percent": 0,
            "current_step": None,
            "step_statuses": {
                "manseryeok_a": "pending",
                "manseryeok_b": "pending",
                "compatibility_score": "pending",
                "trait_scores": "pending",
                "relationship_type": "pending",
                "trait_interpretation": "pending",
                "conflict_analysis": "pending",
                "marriage_fit": "pending",
                "mutual_influence": "pending",
                "saving": "pending",
                "complete": "pending",
            },
            "failed_steps": [],
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

    def update_step_status(self, job_id: str, step: str, status: str) -> None:
        """단계 상태 업데이트"""
        job = self._jobs.get(job_id)
        if job and "step_statuses" in job:
            job["step_statuses"][step] = status
            job["updated_at"] = datetime.utcnow().isoformat()

    def add_failed_step(self, job_id: str, step: str) -> None:
        """실패한 단계 추가"""
        job = self._jobs.get(job_id)
        if job and step not in job.get("failed_steps", []):
            job["failed_steps"].append(step)

    def delete(self, job_id: str) -> bool:
        """작업 삭제"""
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False


# 글로벌 작업 저장소
compatibility_job_store = CompatibilityJobStore()


# 단계별 진행률
STEP_PROGRESS = {
    "manseryeok_a": 5,
    "manseryeok_b": 10,
    "compatibility_score": 25,
    "trait_scores": 35,
    "relationship_type": 50,
    "trait_interpretation": 60,
    "conflict_analysis": 70,
    "marriage_fit": 80,
    "mutual_influence": 90,
    "saving": 97,
    "complete": 100,
}


class CompatibilityAnalysisService:
    """궁합 분석 서비스 (10단계 파이프라인)"""

    def __init__(self):
        self.gemini = None

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

    async def start_analysis(self, request: Dict[str, Any]) -> str:
        """
        분석 작업 시작 (백그라운드)

        Args:
            request: 분석 요청 dict

        Returns:
            job_id
        """
        job_id = str(uuid.uuid4())
        analysis_id = request.get("analysis_id")
        user_id = request.get("user_id")

        # 작업 생성
        compatibility_job_store.create(job_id, analysis_id, user_id)

        # 백그라운드 실행
        asyncio.create_task(self._run_pipeline(job_id, request))

        return job_id

    def get_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 상태 조회"""
        return compatibility_job_store.get(job_id)

    async def _run_pipeline(self, job_id: str, request: Dict[str, Any]):
        """
        전체 파이프라인 실행

        1-2. 만세력 계산 (A, B)
        3-4. Python 점수 계산
        5-9. Gemini 분석
        10. DB 저장
        """
        analysis_id = request.get("analysis_id")
        language = request.get("language", "ko")

        try:
            # 상태 업데이트
            compatibility_job_store.update(
                job_id,
                status=CompatibilityJobStatus.PROCESSING
            )

            # 1. A 만세력 계산
            pillars_a, daewun_a, jijanggan_a = await self._step_manseryeok(
                job_id, "manseryeok_a", request.get("profile_a")
            )

            # 2. B 만세력 계산
            pillars_b, daewun_b, jijanggan_b = await self._step_manseryeok(
                job_id, "manseryeok_b", request.get("profile_b")
            )

            # 3. 궁합 점수 계산 (Python 엔진)
            scores_result = await self._step_compatibility_score(
                job_id, pillars_a, pillars_b, jijanggan_a, jijanggan_b
            )

            # 4. 연애 스타일 점수 (이미 scores_result에 포함)
            self._update_step(job_id, "trait_scores", "completed", 35)

            # Gemini 분석을 위한 컨텍스트 준비
            analysis_context = {
                "pillars_a": pillars_a,
                "pillars_b": pillars_b,
                "scores": scores_result.get("scores", {}),
                "trait_scores_a": scores_result.get("traitScoresA", {}),
                "trait_scores_b": scores_result.get("traitScoresB", {}),
                "interactions": scores_result.get("interactions", {}),
                "total_score": scores_result.get("totalScore", 50),
                "language": language,
            }

            # 5-9. Gemini 분석 (실패해도 계속 진행)
            gemini_results = {}

            # 5. 인연의 성격
            gemini_results["relationship_type"] = await self._step_gemini_analysis(
                job_id, "relationship_type", analysis_context
            )

            # 6. 연애 스타일 해석
            gemini_results["trait_interpretation"] = await self._step_gemini_analysis(
                job_id, "trait_interpretation", analysis_context
            )

            # 7. 갈등 포인트
            gemini_results["conflict_analysis"] = await self._step_gemini_analysis(
                job_id, "conflict_analysis", analysis_context
            )

            # 8. 결혼 적합도
            gemini_results["marriage_fit"] = await self._step_gemini_analysis(
                job_id, "marriage_fit", analysis_context
            )

            # 9. 상호 영향
            gemini_results["mutual_influence"] = await self._step_gemini_analysis(
                job_id, "mutual_influence", analysis_context
            )

            # 10. DB 저장
            await self._step_saving(
                job_id,
                analysis_id,
                pillars_a, pillars_b,
                daewun_a, daewun_b,
                scores_result,
                gemini_results
            )

            # 완료
            job = compatibility_job_store.get(job_id)
            failed_steps = job.get("failed_steps", []) if job else []

            compatibility_job_store.update(
                job_id,
                status=CompatibilityJobStatus.COMPLETED,
                progress_percent=100,
                current_step="complete"
            )
            compatibility_job_store.update_step_status(job_id, "complete", "completed")

            logger.info(f"[Compatibility] 분석 완료: {analysis_id}, 실패 단계: {failed_steps}")

        except Exception as e:
            logger.error(f"[Compatibility] 파이프라인 실패: {str(e)}")
            compatibility_job_store.update(
                job_id,
                status=CompatibilityJobStatus.FAILED,
                error=str(e)
            )

    async def _step_manseryeok(
        self,
        job_id: str,
        step_name: str,
        profile: Dict[str, Any]
    ) -> tuple:
        """만세력 계산 단계"""
        self._update_step(job_id, step_name, "in_progress", STEP_PROGRESS[step_name])

        try:
            from manseryeok.engine import ManseryeokEngine
            from schemas.saju import CalculateRequest

            engine = ManseryeokEngine()

            request = CalculateRequest(
                birth_date=profile.get("birth_date"),
                birth_time=profile.get("birth_time", "12:00"),
                timezone="Asia/Seoul",
                is_lunar=profile.get("calendar_type") == "lunar",
                gender=profile.get("gender", "male")
            )

            result = engine.calculate(request)

            pillars = result.pillars.model_dump() if hasattr(result.pillars, 'model_dump') else result.pillars
            daewun = [d.model_dump() if hasattr(d, 'model_dump') else d for d in result.daewun]
            jijanggan = result.jijanggan.model_dump() if hasattr(result.jijanggan, 'model_dump') else result.jijanggan

            self._update_step(job_id, step_name, "completed", STEP_PROGRESS[step_name])
            return pillars, daewun, jijanggan

        except Exception as e:
            logger.error(f"[Compatibility] {step_name} 실패: {str(e)}")
            compatibility_job_store.update_step_status(job_id, step_name, "failed")
            compatibility_job_store.add_failed_step(job_id, step_name)
            raise

    async def _step_compatibility_score(
        self,
        job_id: str,
        pillars_a: Dict,
        pillars_b: Dict,
        jijanggan_a: Dict = None,
        jijanggan_b: Dict = None
    ) -> Dict[str, Any]:
        """궁합 점수 계산 단계 (Python 엔진)"""
        self._update_step(job_id, "compatibility_score", "in_progress", 25)

        try:
            from manseryeok.compatibility_engine import calculate_all_scores

            result = calculate_all_scores(
                pillars_a, pillars_b,
                jijanggan_a, jijanggan_b
            )

            self._update_step(job_id, "compatibility_score", "completed", 25)
            return result

        except Exception as e:
            logger.error(f"[Compatibility] compatibility_score 실패: {str(e)}")
            compatibility_job_store.update_step_status(job_id, "compatibility_score", "failed")
            compatibility_job_store.add_failed_step(job_id, "compatibility_score")
            raise

    async def _step_gemini_analysis(
        self,
        job_id: str,
        step_name: str,
        context: Dict[str, Any],
        max_retries: int = 3
    ) -> Optional[Dict[str, Any]]:
        """Gemini 분석 단계 (재시도 + 에러 피드백)"""
        self._update_step(job_id, step_name, "in_progress", STEP_PROGRESS.get(step_name, 50))

        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                gemini = self._get_gemini()

                # 프롬프트 빌드
                prompt = self._build_gemini_prompt(step_name, context, last_error)

                # Gemini 호출
                response_schema = get_gemini_schema(step_name)
                result = await gemini.generate_with_schema(
                    prompt,
                    response_schema=response_schema
                )

                # 정규화
                normalized = normalize_all_keys(result)

                self._update_step(job_id, step_name, "completed", STEP_PROGRESS.get(step_name, 50))
                return normalized

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[Compatibility] {step_name} 시도 {attempt}/{max_retries} 실패: {last_error}")

                if attempt == max_retries:
                    logger.error(f"[Compatibility] {step_name} 최종 실패")
                    compatibility_job_store.update_step_status(job_id, step_name, "failed")
                    compatibility_job_store.add_failed_step(job_id, step_name)
                    return None

                await asyncio.sleep(1)  # 잠시 대기 후 재시도

        return None

    def _build_gemini_prompt(
        self,
        step_name: str,
        context: Dict[str, Any],
        previous_error: Optional[str] = None
    ) -> str:
        """Gemini 분석용 프롬프트 빌드"""
        language = context.get("language", "ko")

        # 기본 컨텍스트
        base_prompt = f"""당신은 30년 경력의 명리학 거장입니다. 두 사람의 사주를 분석하여 궁합을 판단해주세요.

[A의 사주]
- 연주: {context['pillars_a'].get('year', {})}
- 월주: {context['pillars_a'].get('month', {})}
- 일주: {context['pillars_a'].get('day', {})}
- 시주: {context['pillars_a'].get('hour', {})}

[B의 사주]
- 연주: {context['pillars_b'].get('year', {})}
- 월주: {context['pillars_b'].get('month', {})}
- 일주: {context['pillars_b'].get('day', {})}
- 시주: {context['pillars_b'].get('hour', {})}

[Python 엔진 계산 결과]
- 총 궁합 점수: {context['total_score']}점
- 천간 조화: {context['scores'].get('stemHarmony', {}).get('score', 0)}점
- 지지 조화: {context['scores'].get('branchHarmony', {}).get('score', 0)}점
- 오행 균형: {context['scores'].get('elementBalance', {}).get('score', 0)}점
- 십신 호환성: {context['scores'].get('tenGodCompatibility', {}).get('score', 0)}점
- 12운성 시너지: {context['scores'].get('wunsengSynergy', {}).get('score', 0)}점

[A의 연애 스타일 점수]
- 표현력: {context['trait_scores_a'].get('expression', 50)}
- 독점욕: {context['trait_scores_a'].get('possessiveness', 50)}
- 헌신도: {context['trait_scores_a'].get('devotion', 50)}
- 모험심: {context['trait_scores_a'].get('adventure', 50)}
- 안정추구: {context['trait_scores_a'].get('stability', 50)}

[B의 연애 스타일 점수]
- 표현력: {context['trait_scores_b'].get('expression', 50)}
- 독점욕: {context['trait_scores_b'].get('possessiveness', 50)}
- 헌신도: {context['trait_scores_b'].get('devotion', 50)}
- 모험심: {context['trait_scores_b'].get('adventure', 50)}
- 안정추구: {context['trait_scores_b'].get('stability', 50)}

[간지 상호작용]
{self._format_interactions(context['interactions'])}

언어: {language}
"""

        # 단계별 지시사항
        step_instructions = self._get_step_instructions(step_name, language)

        # 에러 피드백 (재시도 시)
        error_feedback = ""
        if previous_error:
            error_feedback = f"\n\n[이전 시도 오류]\n{previous_error}\n위 오류를 피해서 다시 생성해주세요."

        return base_prompt + step_instructions + error_feedback

    def _get_step_instructions(self, step_name: str, language: str) -> str:
        """단계별 지시사항"""
        instructions = {
            "relationship_type": """
[분석 요청: 인연의 성격]
두 사람이 만났을 때 형성되는 관계 유형을 분석해주세요.

응답에 포함할 내용:
1. keywords: 관계 유형 키워드 3-4개
2. firstImpression: 첫인상과 끌림의 이유 (150-200자)
3. developmentPattern: 관계 발전 패턴 (200-300자)
""",
            "trait_interpretation": """
[분석 요청: 연애 스타일 해석]
위의 연애 스타일 점수를 바탕으로 각 항목을 해석해주세요.

응답에 포함할 내용:
1. items: 5개 항목(expression, possessiveness, devotion, adventure, stability) 해석
   - 각 항목별 traitName(한글명), a_interpretation, b_interpretation, comparison
2. overall: 연애 스타일 종합 평가 (150-200자)
""",
            "conflict_analysis": """
[분석 요청: 갈등 포인트]
간지 상호작용(충/형/파/해)을 바탕으로 갈등 요소를 분석해주세요.

응답에 포함할 내용:
1. conflictPoints: 갈등 포인트 목록 (2-4개)
   - source(명리학적 원인), description(일상 표현), resolution(해결 조언)
2. avoidBehaviors: 피해야 할 행동 3-4개
3. communicationTips: 효과적인 소통 방법 (100-150자)
""",
            "marriage_fit": """
[분석 요청: 결혼 적합도]
장기 관계와 결혼 후 예측을 분석해주세요.

응답에 포함할 내용:
1. score: 결혼 적합도 점수 (0-100)
2. postMarriageChange: 결혼 후 관계 변화 (150-200자)
3. roleDistribution: 가정 내 역할 분담 (100-150자)
4. childFortune: 자녀운 시너지 (100-150자)
5. wealthSynergy: 재물운 시너지 (100-150자)
""",
            "mutual_influence": """
[분석 요청: 상호 영향]
서로에게 주는 영향을 분석해주세요.

응답에 포함할 내용:
1. aToB: A가 B에게 주는 영향
   - tenGod, meaning, positiveInfluence, caution
2. bToA: B가 A에게 주는 영향
   - tenGod, meaning, positiveInfluence, caution
3. synergy: 시너지 요약 (150-200자)
""",
        }
        return instructions.get(step_name, "")

    def _format_interactions(self, interactions: Dict) -> str:
        """간지 상호작용 포맷팅"""
        parts = []

        if interactions.get("stemCombinations"):
            stems = [f"{c.get('name', '')}" for c in interactions["stemCombinations"]]
            parts.append(f"- 천간 합: {', '.join(stems)}")

        if interactions.get("branchCombinations"):
            branches = [f"{c.get('name', '')}" for c in interactions["branchCombinations"]]
            parts.append(f"- 지지 합: {', '.join(branches)}")

        if interactions.get("branchClashes"):
            clashes = [f"{c.get('name', '')}" for c in interactions["branchClashes"]]
            parts.append(f"- 지지 충: {', '.join(clashes)}")

        if interactions.get("branchPunishments"):
            punishments = [f"{c.get('name', '')}" for c in interactions["branchPunishments"]]
            parts.append(f"- 지지 형: {', '.join(punishments)}")

        if not parts:
            return "특이 상호작용 없음"

        return "\n".join(parts)

    async def _step_saving(
        self,
        job_id: str,
        analysis_id: str,
        pillars_a: Dict, pillars_b: Dict,
        daewun_a: List, daewun_b: List,
        scores_result: Dict,
        gemini_results: Dict
    ):
        """DB 저장 단계"""
        self._update_step(job_id, "saving", "in_progress", 97)

        try:
            if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
                logger.warning("[Compatibility] Supabase 설정 없음, DB 저장 건너뜀")
                self._update_step(job_id, "saving", "completed", 97)
                return

            # 실패한 단계 수집
            job = compatibility_job_store.get(job_id)
            failed_steps = job.get("failed_steps", []) if job else []

            update_data = {
                "status": "completed",
                "progress_percent": 100,
                "pillars_a": pillars_a,
                "pillars_b": pillars_b,
                "daewun_a": daewun_a,
                "daewun_b": daewun_b,
                "total_score": scores_result.get("totalScore"),
                "scores": scores_result.get("scores"),
                "trait_scores_a": scores_result.get("traitScoresA"),
                "trait_scores_b": scores_result.get("traitScoresB"),
                "interactions": scores_result.get("interactions"),
                "relationship_type": gemini_results.get("relationship_type"),
                "trait_interpretation": gemini_results.get("trait_interpretation"),
                "conflict_analysis": gemini_results.get("conflict_analysis"),
                "marriage_fit": gemini_results.get("marriage_fit"),
                "mutual_influence": gemini_results.get("mutual_influence"),
                "failed_steps": failed_steps,
                "updated_at": datetime.utcnow().isoformat(),
            }

            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/compatibility_analyses?id=eq.{analysis_id}",
                    json=update_data,
                    headers={
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal",
                    }
                )
                response.raise_for_status()

            self._update_step(job_id, "saving", "completed", 97)

        except Exception as e:
            logger.error(f"[Compatibility] DB 저장 실패: {str(e)}")
            compatibility_job_store.update_step_status(job_id, "saving", "failed")
            compatibility_job_store.add_failed_step(job_id, "saving")
            raise

    def _update_step(self, job_id: str, step: str, status: str, progress: int):
        """단계 상태 및 진행률 업데이트"""
        compatibility_job_store.update_step_status(job_id, step, status)
        compatibility_job_store.update(
            job_id,
            current_step=step,
            progress_percent=progress
        )


# 싱글톤 서비스 인스턴스
compatibility_service = CompatibilityAnalysisService()
