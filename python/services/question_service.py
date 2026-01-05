"""
후속 질문 처리 서비스
비동기 백그라운드 작업으로 Gemini AI 질문 응답 생성
"""
import asyncio
import os
import logging
from typing import Dict, Any, List

from supabase import create_client, Client

from schemas.analysis import (
    FollowUpQuestionRequest,
    QuestionHistoryItem,
)
from prompts.builder import PromptBuilder
from .gemini import get_gemini_service

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Supabase 클라이언트 생성"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다")
    return create_client(url, key)


class QuestionService:
    """후속 질문 처리 서비스"""

    def __init__(self):
        self.gemini = None  # lazy init

    def _get_gemini(self):
        """Gemini 서비스 지연 로딩"""
        if self.gemini is None:
            self.gemini = get_gemini_service()
        return self.gemini

    async def start_question_processing(self, request: FollowUpQuestionRequest):
        """
        후속 질문 처리 시작 (백그라운드)

        Args:
            request: 질문 처리 요청
        """
        # 백그라운드에서 질문 처리 실행
        asyncio.create_task(self._process_question(request))

    async def _process_question(self, request: FollowUpQuestionRequest):
        """
        백그라운드 질문 처리

        Args:
            request: 질문 처리 요청
        """
        supabase = get_supabase_client()

        try:
            logger.info(f"[Question:{request.question_id}] 질문 처리 시작")

            # 1. 프롬프트 빌드
            prompt = self._build_followup_prompt(request)

            # 2. Gemini 호출
            logger.info(f"[Question:{request.question_id}] Gemini 호출 시작")
            gemini = self._get_gemini()
            answer = await gemini.generate_followup_answer(prompt)

            # 3. DB 업데이트 (성공)
            logger.info(f"[Question:{request.question_id}] 질문 처리 완료")
            supabase.table('report_questions').update({
                'answer': answer,
                'status': 'completed',
            }).eq('id', request.question_id).execute()

        except Exception as e:
            logger.error(f"[Question:{request.question_id}] 질문 처리 실패: {e}")

            # DB 업데이트 (실패)
            supabase.table('report_questions').update({
                'status': 'failed',
                'error_message': str(e),
            }).eq('id', request.question_id).execute()

            # 크레딧 환불 (10 크레딧)
            try:
                supabase.rpc('deduct_credits', {
                    'p_user_id': request.user_id,
                    'p_amount': -10,  # 음수로 환불
                }).execute()
                logger.info(f"[Question:{request.question_id}] 크레딧 환불 완료")
            except Exception as refund_error:
                logger.error(f"[Question:{request.question_id}] 크레딧 환불 실패: {refund_error}")

    def _build_followup_prompt(self, request: FollowUpQuestionRequest) -> str:
        """후속 질문용 프롬프트 빌드"""
        # 사주 정보 요약
        pillars = request.pillars
        day_stem = pillars.get('day', {}).get('stem', '')
        day_branch = pillars.get('day', {}).get('branch', '')

        # 이전 대화 컨텍스트
        history_text = ""
        if request.question_history:
            history_items = []
            for h in request.question_history:
                history_items.append(f"Q: {h.question}\nA: {h.answer}")
            history_text = "\n\n".join(history_items)

        # 기존 분석 요약
        analysis = request.previous_analysis
        basic = analysis.get('basicAnalysis', {})
        personality = analysis.get('personality', {})

        prompt = f"""당신은 30년 경력의 명리학 전문가입니다.

## 사용자 사주 정보
- 일주: {day_stem}{day_branch}
- 격국: {basic.get('formation', '미상')}
- 용신: {basic.get('yongShin', '미상')}
- 희신: {basic.get('heeShin', '미상')}

## 기존 분석 요약
{basic.get('summary', '')}

## 성격 분석 요약
{personality.get('summary', '')}

## 이전 대화 기록
{history_text if history_text else '(첫 질문입니다)'}

## 현재 질문
{request.question}

## 답변 지침
1. 사주 명리학 관점에서 구체적으로 답변하세요
2. 필요시 십신, 오행, 대운 등을 참조하세요
3. 답변은 한국어로, 500~800자 내외로 작성하세요
4. 실용적이고 행동 가능한 조언을 포함하세요
5. JSON 형식이 아닌 자연스러운 텍스트로 답변하세요

답변:"""

        return prompt


# 싱글톤 인스턴스
question_service = QuestionService()
