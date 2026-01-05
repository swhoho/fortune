"""
섹션 재분석 서비스
비동기 백그라운드 작업으로 특정 섹션 AI 재분석 실행
"""
import asyncio
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from supabase import create_client, Client

from schemas.analysis import SectionReanalyzeRequest
from prompts.builder import PromptBuilder, PromptBuildOptions
from .gemini import get_gemini_service

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Supabase 클라이언트 생성 (Railway와 로컬 환경 모두 지원)"""
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다")
    return create_client(url, key)


class ReanalyzeService:
    """섹션 재분석 서비스"""

    def __init__(self):
        self.gemini = None  # lazy init

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

    async def start_reanalysis(self, request: SectionReanalyzeRequest):
        """
        섹션 재분석 시작 (백그라운드)

        Args:
            request: 재분석 요청
        """
        # 백그라운드에서 재분석 실행
        asyncio.create_task(self._run_reanalysis(request))

    async def _run_reanalysis(self, request: SectionReanalyzeRequest):
        """
        백그라운드 재분석 실행

        Args:
            request: 재분석 요청
        """
        supabase = get_supabase_client()

        try:
            logger.info(f"[Reanalyze:{request.reanalysis_id}] 섹션 재분석 시작: {request.section_type}")

            # 1. 단계별 프롬프트 빌드
            prompt_result = PromptBuilder.build_step(
                step=request.section_type,
                pillars=request.pillars,
                language=request.language,
                daewun=request.daewun,
                jijanggan=request.jijanggan,
                previous_results=request.existing_analysis,
            )

            # 2. Gemini 호출
            logger.info(f"[Reanalyze:{request.reanalysis_id}] Gemini 호출 시작")
            gemini = self._get_gemini()

            full_prompt = f"{prompt_result.system_prompt}\n\n{prompt_result.user_prompt}"
            result = await gemini.generate_section_analysis(
                prompt=full_prompt,
                section_type=request.section_type,
            )

            # 3. 재분석 결과에 메타데이터 추가
            section_result = {
                **result,
                'reanalyzed': True,
                'reanalyzedAt': datetime.utcnow().isoformat(),
            }

            # 4. reanalysis_logs 테이블 업데이트 (성공)
            logger.info(f"[Reanalyze:{request.reanalysis_id}] 재분석 완료")
            supabase.table('reanalysis_logs').update({
                'status': 'completed',
                'result': section_result,
            }).eq('id', request.reanalysis_id).execute()

            # 5. profile_reports 테이블의 analysis 필드 업데이트
            existing_analysis = request.existing_analysis or {}
            updated_analysis = {
                **existing_analysis,
                request.section_type: section_result,
            }

            supabase.table('profile_reports').update({
                'analysis': updated_analysis,
                'updated_at': datetime.utcnow().isoformat(),
            }).eq('id', request.report_id).execute()

            logger.info(f"[Reanalyze:{request.reanalysis_id}] 리포트 업데이트 완료")

        except Exception as e:
            logger.error(f"[Reanalyze:{request.reanalysis_id}] 재분석 실패: {e}")

            # DB 업데이트 (실패)
            supabase.table('reanalysis_logs').update({
                'status': 'failed',
                'error_message': str(e),
            }).eq('id', request.reanalysis_id).execute()

            # 크레딧 환불 (5 크레딧)
            try:
                supabase.rpc('deduct_credits', {
                    'p_user_id': request.user_id,
                    'p_amount': -5,  # 음수로 환불
                }).execute()
                logger.info(f"[Reanalyze:{request.reanalysis_id}] 크레딧 환불 완료")
            except Exception as refund_error:
                logger.error(f"[Reanalyze:{request.reanalysis_id}] 크레딧 환불 실패: {refund_error}")


# 싱글톤 인스턴스
reanalyze_service = ReanalyzeService()
