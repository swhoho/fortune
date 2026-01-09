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


# ============================================================
# 조후(調候) 색채 시스템 - 궁통보감 기반
# ============================================================

# 월지별 기후 성질 (寒/暖/燥/濕)
JOHU_MAP = {
    '寅': '寒',   # 이월 - 아직 춥다
    '卯': '濕',   # 삼월 - 봄비, 습함
    '辰': '濕',   # 사월 - 청명, 습함
    '巳': '暖',   # 오월 - 따뜻해짐
    '午': '暖',   # 유월 - 가장 덥다
    '未': '燥',   # 칠월 - 불볕더위, 건조
    '申': '燥',   # 팔월 - 가을 건조
    '酉': '燥',   # 구월 - 서늘, 건조
    '戌': '燥',   # 시월 - 가을 끝, 건조
    '亥': '寒',   # 십일월 - 초겨울, 한냉
    '子': '寒',   # 십이월 - 가장 춥다
    '丑': '寒',   # 정월 - 극한
}

# 조후 성질별 분위기 키워드
JOHU_TUNE_WORDS = {
    '寒': {
        'mood': '차분하고 깊은',
        'energy': '내면 지향적',
        'need': '따뜻함과 열정',
        'color': '차가운 블루',
        'quality': '신중함, 인내심',
        'caution': '냉담해 보일 수 있음',
    },
    '暖': {
        'mood': '따뜻하고 활력있는',
        'energy': '외향적이고 적극적',
        'need': '안정과 휴식',
        'color': '따뜻한 오렌지',
        'quality': '열정, 추진력',
        'caution': '과열되기 쉬움',
    },
    '燥': {
        'mood': '날카롭고 예민한',
        'energy': '결단력 있는',
        'need': '유연함과 수분(감정)',
        'color': '선명한 레드',
        'quality': '명쾌함, 결단력',
        'caution': '갈등 유발 가능',
    },
    '濕': {
        'mood': '부드럽고 유연한',
        'energy': '수용적이고 조화로운',
        'need': '명확한 방향성',
        'color': '부드러운 그린',
        'quality': '적응력, 포용력',
        'caution': '우유부단해 보일 수 있음',
    },
}

# 조후 조합 궁합 (두 조후가 만났을 때)
JOHU_COMPATIBILITY = {
    ('寒', '暖'): {
        'synergy': '상호 보완',
        'description': '차가운 기운과 따뜻한 기운이 만나 균형을 이룸. 서로에게 필요한 것을 채워줌.',
        'score_modifier': +5,
    },
    ('暖', '寒'): {
        'synergy': '상호 보완',
        'description': '따뜻한 기운이 차가운 기운을 녹이고, 차가운 기운이 과열을 식혀줌.',
        'score_modifier': +5,
    },
    ('燥', '濕'): {
        'synergy': '완벽한 조화',
        'description': '건조한 기운과 습한 기운이 만나 최적의 균형을 형성. 이상적인 조합.',
        'score_modifier': +8,
    },
    ('濕', '燥'): {
        'synergy': '완벽한 조화',
        'description': '습한 기운이 건조함을 촉촉하게, 건조한 기운이 과습을 조절.',
        'score_modifier': +8,
    },
    ('寒', '寒'): {
        'synergy': '동질 심화',
        'description': '둘 다 차분하여 안정적이지만, 때로 관계에 열정이 부족할 수 있음.',
        'score_modifier': -3,
    },
    ('暖', '暖'): {
        'synergy': '열정 과잉',
        'description': '둘 다 열정적이라 활기차지만, 충돌 시 격해질 수 있음.',
        'score_modifier': -2,
    },
    ('燥', '燥'): {
        'synergy': '마찰 우려',
        'description': '둘 다 예민하여 충돌 가능성. 서로 양보하는 지혜 필요.',
        'score_modifier': -5,
    },
    ('濕', '濕'): {
        'synergy': '답답함 우려',
        'description': '둘 다 유순하여 결정이 느림. 누군가 주도권을 잡아야 함.',
        'score_modifier': -3,
    },
    ('寒', '燥'): {
        'synergy': '긴장 관계',
        'description': '차갑고 건조한 조합은 삭막할 수 있음. 따뜻한 소통 필요.',
        'score_modifier': -2,
    },
    ('燥', '寒'): {
        'synergy': '긴장 관계',
        'description': '건조한 예민함과 차가운 신중함이 만나면 냉랭해지기 쉬움.',
        'score_modifier': -2,
    },
    ('暖', '濕'): {
        'synergy': '조화로움',
        'description': '따뜻함과 부드러움이 만나 포근한 관계. 다소 느긋할 수 있음.',
        'score_modifier': +3,
    },
    ('濕', '暖'): {
        'synergy': '조화로움',
        'description': '부드러운 수용과 따뜻한 열정이 어우러져 편안한 관계 형성.',
        'score_modifier': +3,
    },
    ('寒', '濕'): {
        'synergy': '침체 우려',
        'description': '차갑고 습한 조합은 무기력해지기 쉬움. 활력 주입 필요.',
        'score_modifier': -4,
    },
    ('濕', '寒'): {
        'synergy': '침체 우려',
        'description': '습하고 차가우면 정체될 수 있음. 서로를 자극하는 노력 필요.',
        'score_modifier': -4,
    },
    ('暖', '燥'): {
        'synergy': '과열 주의',
        'description': '둘 다 뜨겁고 건조하면 충돌 시 불이 크게 번짐. 차분함 필요.',
        'score_modifier': -3,
    },
    ('燥', '暖'): {
        'synergy': '과열 주의',
        'description': '건조한 예민함에 열정이 더해지면 폭발적. 쿨다운 타임 필요.',
        'score_modifier': -3,
    },
}


def determine_johu_tendency(pillars: Dict[str, Any]) -> Dict[str, Any]:
    """
    사주의 조후(調候) 성향 판단

    Args:
        pillars: 사주 정보 (year, month, day, hour)

    Returns:
        조후 분석 결과 {
            'month_branch': 월지,
            'johu_type': 寒/暖/燥/濕,
            'tune_words': 분위기 키워드,
            'needs_balance': 필요한 균형
        }
    """
    month_branch = pillars.get('month', {}).get('branch', '')
    johu_type = JOHU_MAP.get(month_branch, '暖')  # 기본값 暖
    tune_words = JOHU_TUNE_WORDS.get(johu_type, JOHU_TUNE_WORDS['暖'])

    return {
        'month_branch': month_branch,
        'johu_type': johu_type,
        'tune_words': tune_words,
        'needs_balance': tune_words.get('need', ''),
    }


def analyze_johu_compatibility(pillars_a: Dict, pillars_b: Dict) -> Dict[str, Any]:
    """
    두 사주의 조후 궁합 분석

    Args:
        pillars_a, pillars_b: 각각의 사주 정보

    Returns:
        조후 궁합 분석 결과
    """
    johu_a = determine_johu_tendency(pillars_a)
    johu_b = determine_johu_tendency(pillars_b)

    johu_pair = (johu_a['johu_type'], johu_b['johu_type'])
    compatibility = JOHU_COMPATIBILITY.get(johu_pair, {
        'synergy': '중립',
        'description': '특별한 조후 상호작용 없음.',
        'score_modifier': 0,
    })

    return {
        'johu_a': johu_a,
        'johu_b': johu_b,
        'synergy': compatibility['synergy'],
        'description': compatibility['description'],
        'score_modifier': compatibility['score_modifier'],
    }

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

        각 단계 완료 시 DB 중간 저장 (Report 패턴)
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
                job_id, "manseryeok_a", request.get("profile_a"), analysis_id
            )

            # 2. B 만세력 계산
            pillars_b, daewun_b, jijanggan_b = await self._step_manseryeok(
                job_id, "manseryeok_b", request.get("profile_b"), analysis_id
            )

            # 3. 궁합 점수 계산 (Python 엔진)
            scores_result = await self._step_compatibility_score(
                job_id, pillars_a, pillars_b, jijanggan_a, jijanggan_b, analysis_id
            )

            # 4. 연애 스타일 점수 (이미 scores_result에 포함)
            self._update_step(job_id, "trait_scores", "completed", 35)

            # trait_scores 중간 저장
            if analysis_id:
                job = compatibility_job_store.get(job_id)
                await self._update_db_status(
                    analysis_id,
                    status="processing",
                    step_statuses=job.get("step_statuses") if job else None,
                    progress_percent=35,
                    current_step="trait_scores"
                )

            # 조후(調候) 분석 추가
            johu_analysis = analyze_johu_compatibility(pillars_a, pillars_b)

            # Gemini 분석을 위한 컨텍스트 준비
            analysis_context = {
                "pillars_a": pillars_a,
                "pillars_b": pillars_b,
                "scores": scores_result.get("scores", {}),
                "trait_scores_a": scores_result.get("traitScoresA", {}),
                "trait_scores_b": scores_result.get("traitScoresB", {}),
                "interactions": scores_result.get("interactions", {}),
                "total_score": scores_result.get("totalScore", 50),
                "johu_analysis": johu_analysis,  # 조후 분석 추가
                "language": language,
            }

            # 5-9. Gemini 분석 (실패해도 계속 진행)
            gemini_results = {}

            # 5. 인연의 성격
            gemini_results["relationship_type"] = await self._step_gemini_analysis(
                job_id, "relationship_type", analysis_context, analysis_id
            )

            # 6. 연애 스타일 해석
            gemini_results["trait_interpretation"] = await self._step_gemini_analysis(
                job_id, "trait_interpretation", analysis_context, analysis_id
            )

            # 7. 갈등 포인트
            gemini_results["conflict_analysis"] = await self._step_gemini_analysis(
                job_id, "conflict_analysis", analysis_context, analysis_id
            )

            # 8. 결혼 적합도
            gemini_results["marriage_fit"] = await self._step_gemini_analysis(
                job_id, "marriage_fit", analysis_context, analysis_id
            )

            # 9. 상호 영향
            gemini_results["mutual_influence"] = await self._step_gemini_analysis(
                job_id, "mutual_influence", analysis_context, analysis_id
            )

            # 10. DB 저장 (최종)
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
            # 전체 실패 시 DB에도 기록
            if analysis_id:
                job = compatibility_job_store.get(job_id)
                await self._update_db_status(
                    analysis_id,
                    status="failed",
                    step_statuses=job.get("step_statuses") if job else None,
                    failed_steps=job.get("failed_steps") if job else [],
                    error=str(e),
                    current_step=job.get("current_step") if job else None
                )

    async def _step_manseryeok(
        self,
        job_id: str,
        step_name: str,
        profile: Dict[str, Any],
        analysis_id: str = None
    ) -> tuple:
        """만세력 계산 단계"""
        self._update_step(job_id, step_name, "in_progress", STEP_PROGRESS[step_name])

        try:
            from manseryeok.engine import ManseryeokEngine
            from schemas.saju import CalculateRequest

            engine = ManseryeokEngine()

            # birth_date와 birth_time을 합쳐서 ISO 8601 datetime 형식으로 변환
            birth_date = profile.get("birth_date", "1990-01-01")
            birth_time = profile.get("birth_time", "12:00")
            birth_datetime_str = f"{birth_date}T{birth_time}:00"

            request = CalculateRequest(
                birthDatetime=birth_datetime_str,
                timezone="GMT+9",
                isLunar=profile.get("calendar_type") == "lunar",
                gender=profile.get("gender", "male")
            )

            result = engine.calculate(request)

            pillars = result.pillars.model_dump() if hasattr(result.pillars, 'model_dump') else result.pillars
            daewun = [d.model_dump() if hasattr(d, 'model_dump') else d for d in result.daewun]
            jijanggan = result.jijanggan.model_dump() if hasattr(result.jijanggan, 'model_dump') else result.jijanggan

            self._update_step(job_id, step_name, "completed", STEP_PROGRESS[step_name])

            # DB 중간 저장 (Report 패턴)
            if analysis_id:
                job = compatibility_job_store.get(job_id)
                pillar_key = "pillars_a" if step_name == "manseryeok_a" else "pillars_b"
                daewun_key = "daewun_a" if step_name == "manseryeok_a" else "daewun_b"

                await self._update_db_status(
                    analysis_id,
                    status="processing",
                    **{pillar_key: pillars, daewun_key: daewun},
                    step_statuses=job.get("step_statuses") if job else None,
                    progress_percent=STEP_PROGRESS[step_name],
                    current_step=step_name
                )

            return pillars, daewun, jijanggan

        except Exception as e:
            logger.error(f"[Compatibility] {step_name} 실패: {str(e)}")
            compatibility_job_store.update_step_status(job_id, step_name, "failed")
            compatibility_job_store.add_failed_step(job_id, step_name)
            # 실패 시 DB에도 기록
            if analysis_id:
                job = compatibility_job_store.get(job_id)
                await self._update_db_status(
                    analysis_id,
                    status="failed",
                    step_statuses=job.get("step_statuses") if job else None,
                    failed_steps=job.get("failed_steps") if job else [step_name],
                    error=str(e),
                    current_step=step_name
                )
            raise

    async def _step_compatibility_score(
        self,
        job_id: str,
        pillars_a: Dict,
        pillars_b: Dict,
        jijanggan_a: Dict = None,
        jijanggan_b: Dict = None,
        analysis_id: str = None
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

            # DB 중간 저장 (Report 패턴)
            if analysis_id:
                job = compatibility_job_store.get(job_id)
                await self._update_db_status(
                    analysis_id,
                    status="processing",
                    total_score=result.get("totalScore"),
                    scores=result.get("scores"),
                    trait_scores_a=result.get("traitScoresA"),
                    trait_scores_b=result.get("traitScoresB"),
                    interactions=result.get("interactions"),
                    step_statuses=job.get("step_statuses") if job else None,
                    progress_percent=25,
                    current_step="compatibility_score"
                )

            return result

        except Exception as e:
            logger.error(f"[Compatibility] compatibility_score 실패: {str(e)}")
            compatibility_job_store.update_step_status(job_id, "compatibility_score", "failed")
            compatibility_job_store.add_failed_step(job_id, "compatibility_score")
            # 실패 시 DB에도 기록
            if analysis_id:
                job = compatibility_job_store.get(job_id)
                await self._update_db_status(
                    analysis_id,
                    status="failed",
                    step_statuses=job.get("step_statuses") if job else None,
                    failed_steps=job.get("failed_steps") if job else ["compatibility_score"],
                    error=str(e),
                    current_step="compatibility_score"
                )
            raise

    async def _step_gemini_analysis(
        self,
        job_id: str,
        step_name: str,
        context: Dict[str, Any],
        analysis_id: str = None,
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

                # DB 중간 저장 (Report 패턴)
                if analysis_id:
                    job = compatibility_job_store.get(job_id)
                    await self._update_db_status(
                        analysis_id,
                        status="processing",
                        **{step_name: normalized},
                        step_statuses=job.get("step_statuses") if job else None,
                        progress_percent=STEP_PROGRESS.get(step_name, 50),
                        current_step=step_name
                    )

                return normalized

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[Compatibility] {step_name} 시도 {attempt}/{max_retries} 실패: {last_error}")

                if attempt == max_retries:
                    logger.error(f"[Compatibility] {step_name} 최종 실패")
                    compatibility_job_store.update_step_status(job_id, step_name, "failed")
                    compatibility_job_store.add_failed_step(job_id, step_name)

                    # 실패 시에도 DB에 상태 기록 (파이프라인은 계속)
                    if analysis_id:
                        job = compatibility_job_store.get(job_id)
                        await self._update_db_status(
                            analysis_id,
                            status="processing",  # Gemini 실패해도 파이프라인 계속
                            step_statuses=job.get("step_statuses") if job else None,
                            failed_steps=job.get("failed_steps") if job else [],
                            progress_percent=STEP_PROGRESS.get(step_name, 50),
                            current_step=step_name
                        )

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
        johu = context.get("johu_analysis", {})

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
- 삼합/방합 시너지: {context['scores'].get('combinationSynergy', {}).get('score', 0)}점

[조후(調候) 분석 - 궁통보감 기반]
{self._format_johu_context(johu)}

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

**중요**: 위의 조후(調候) 분석을 적극 반영하세요!
- 조후의 '분위기'와 '에너지'가 두 사람의 첫인상에 어떻게 영향을 미치는지
- 조후 궁합(상호 보완/동질 심화/긴장 관계 등)이 관계 발전에 미치는 영향
- 각자에게 '필요한 것'을 상대방이 채워줄 수 있는지

응답에 포함할 내용:
1. keywords: 관계 유형 키워드 3-4개 (조후 특성 반영)
2. firstImpression: 첫인상과 끌림의 이유 (150-200자, 조후 분위기 반영)
3. developmentPattern: 관계 발전 패턴 (200-300자, 조후 궁합 반영)
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
간지 상호작용(충/형/파/해/원진)을 바탕으로 갈등 요소를 분석해주세요.

**6충(六冲) 물상 참고** (해당되는 경우 반드시 반영):
- 子午冲: 감정 vs 이성 충돌, 집안일 vs 사회활동 갈등
- 丑未冲: 고집 대 고집, 재산/부동산 관련 분쟁
- 寅申冲: 목표/방향성 다툼, 커리어 의견 충돌
- 卯酉冲: 소통 단절, 말투로 인한 상처, 오해 축적
- 辰戌冲: 가치관/신념 충돌, 가정문화 차이
- 巳亥冲: 이상과 현실 괴리, 종교/신념 문제

**원진(元辰)이 있는 경우**:
- 원진은 겉으로는 괜찮아 보이지만 내면의 심리적 갈등을 유발
- 일지-일지 원진은 결혼 후 권태기로 발전할 수 있음

응답에 포함할 내용:
1. conflictPoints: 갈등 포인트 목록 (2-4개)
   - source(명리학적 원인, 예: "卯酉冲"), description(구체적 일상 상황), resolution(해결 조언)
2. avoidBehaviors: 피해야 할 행동 3-4개 (구체적으로)
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
서로에게 주는 영향을 십신 관계로 분석해주세요.

**십신별 물상(구체적 사건) 참고**:
- 비견: 동지이자 경쟁자, 함께하면 강해지지만 이익 앞에서 갈라질 수 있음
- 겁재: 열정과 추진력, 하지만 충동적 결정으로 손해 볼 수 있음
- 식신: 함께 있으면 즐겁고 편안, 하지만 나태해질 수 있음
- 상관: 창의적 영감을 주지만, 직설적 표현으로 상처줄 수 있음
- 편재: 재물 기회를 주지만, 투기 실패 위험도 있음
- 정재: 안정적 동반자, 하지만 융통성이 부족할 수 있음
- 편관: 강력한 버팀목이지만, 통제적이 될 수 있음
- 정관: 존중과 신뢰의 관계, 하지만 격식에 얽매일 수 있음
- 편인: 독특한 영감을 주지만, 현실과 동떨어질 수 있음
- 정인: 성장시키는 관계, 하지만 의존하게 될 수 있음

응답에 포함할 내용:
1. aToB: A가 B에게 주는 영향
   - tenGod(십신), meaning(의미), positiveInfluence(긍정적 영향 + 구체적 예시), caution(주의점)
2. bToA: B가 A에게 주는 영향
   - tenGod, meaning, positiveInfluence, caution
3. synergy: 시너지 요약 (150-200자, 두 십신 조합의 역학 설명)
""",
        }
        return instructions.get(step_name, "")

    def _format_johu_context(self, johu: Dict) -> str:
        """조후 분석 컨텍스트 포맷팅"""
        if not johu:
            return "조후 정보 없음"

        johu_a = johu.get('johu_a', {})
        johu_b = johu.get('johu_b', {})
        tune_a = johu_a.get('tune_words', {})
        tune_b = johu_b.get('tune_words', {})

        return f"""- A의 조후: {johu_a.get('johu_type', '불명')} (월지: {johu_a.get('month_branch', '')})
  - 분위기: {tune_a.get('mood', '')}
  - 에너지: {tune_a.get('energy', '')}
  - 필요한 것: {tune_a.get('need', '')}
  - 장점: {tune_a.get('quality', '')}
  - 주의점: {tune_a.get('caution', '')}

- B의 조후: {johu_b.get('johu_type', '불명')} (월지: {johu_b.get('month_branch', '')})
  - 분위기: {tune_b.get('mood', '')}
  - 에너지: {tune_b.get('energy', '')}
  - 필요한 것: {tune_b.get('need', '')}
  - 장점: {tune_b.get('quality', '')}
  - 주의점: {tune_b.get('caution', '')}

- 조후 궁합: {johu.get('synergy', '중립')}
  - {johu.get('description', '')}"""

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

        # 원진 추가
        if interactions.get("branchWonjin"):
            wonjins = [f"{w.get('name', '')}" for w in interactions["branchWonjin"]]
            parts.append(f"- 지지 원진: {', '.join(wonjins)}")

        # 삼합/방합 추가
        if interactions.get("samhapFormed"):
            samhaps = [f"{s.get('name', '')}" for s in interactions["samhapFormed"]]
            parts.append(f"- 삼합 형성: {', '.join(samhaps)}")

        if interactions.get("banghapFormed"):
            banghaps = [f"{b.get('name', '')}" for b in interactions["banghapFormed"]]
            parts.append(f"- 방합 형성: {', '.join(banghaps)}")

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

    async def _update_db_status(self, analysis_id: str, **kwargs):
        """
        Supabase DB 상태 업데이트 (Report 패턴)
        각 단계 완료 시 호출하여 크래시 복구 가능하게 함
        """
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("[Compatibility] Supabase 설정 없음, DB 중간 저장 건너뜀")
            return

        update_data = {"updated_at": datetime.utcnow().isoformat()}

        # 필드 매핑 (kwargs → DB 컬럼)
        field_mapping = {
            "status": "status",
            "progress_percent": "progress_percent",
            "current_step": "current_step",
            "step_statuses": "step_statuses",
            "pillars_a": "pillars_a",
            "pillars_b": "pillars_b",
            "daewun_a": "daewun_a",
            "daewun_b": "daewun_b",
            "total_score": "total_score",
            "scores": "scores",
            "trait_scores_a": "trait_scores_a",
            "trait_scores_b": "trait_scores_b",
            "interactions": "interactions",
            "relationship_type": "relationship_type",
            "trait_interpretation": "trait_interpretation",
            "conflict_analysis": "conflict_analysis",
            "marriage_fit": "marriage_fit",
            "mutual_influence": "mutual_influence",
            "failed_steps": "failed_steps",
            "error": "error",
        }

        for kwarg_key, db_key in field_mapping.items():
            if kwarg_key in kwargs and kwargs[kwarg_key] is not None:
                update_data[db_key] = kwargs[kwarg_key]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/compatibility_analyses?id=eq.{analysis_id}",
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
                logger.info(f"[Compatibility] DB 중간 저장: {analysis_id}, step={kwargs.get('current_step')}")
        except Exception as e:
            logger.error(f"[Compatibility] DB 중간 저장 실패: {e}")
            # 중간 저장 실패해도 파이프라인은 계속 진행


# 싱글톤 서비스 인스턴스
compatibility_service = CompatibilityAnalysisService()
