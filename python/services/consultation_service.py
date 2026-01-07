"""
상담 메시지 AI 응답 생성 서비스
report_analysis.py + question_service.py 패턴 적용
"""
import asyncio
import os
import logging
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime

from supabase import create_client, Client

from .gemini import get_gemini_service
from prompts.consultation import build_clarification_prompt, build_answer_prompt

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Supabase 클라이언트 생성"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다")
    return create_client(url, key)


class ConsultationService:
    """상담 AI 응답 생성 서비스"""

    MAX_RETRIES = 3

    async def start_generate(self, request: dict):
        """
        백그라운드에서 AI 응답 생성 시작

        Args:
            request: 요청 데이터
              - message_id: AI 메시지 ID
              - session_id: 세션 ID
              - profile_report_id: 리포트 ID
              - user_content: 사용자 질문
              - message_type: 'user_question' | 'user_clarification'
              - skip_clarification: bool
              - question_round: int
              - language: 언어 코드 (ko, en, ja, zh-CN, zh-TW)
        """
        asyncio.create_task(self._generate_response(request))

    async def _generate_response(self, request: dict):
        """
        AI 응답 생성 (3회 재시도, 중복 요청 방지)
        """
        supabase = get_supabase_client()
        message_id = request['message_id']

        # 처리 시작 전 상태 확인 (중복 요청 방지)
        status_check = supabase.table('consultation_messages').select(
            'status'
        ).eq('id', message_id).single().execute()

        if not status_check.data or status_check.data.get('status') != 'generating':
            logger.warning(f"[Consultation:{message_id}] 이미 처리 중이거나 완료됨 - 스킵")
            return

        success = False
        last_error = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(f"[Consultation:{message_id}] 시도 {attempt}/{self.MAX_RETRIES}")

                # 1. 리포트 데이터 조회
                report = self._get_report_data(supabase, request['profile_report_id'])

                # 2. 이전 메시지 조회
                history = self._get_session_history(supabase, request['session_id'], message_id)

                # 3. AI 응답 생성 (clarification vs answer 분기)
                ai_content, final_type = await self._call_gemini(request, report, history)

                # 4. DB 업데이트 (성공) - generating 상태인 경우만 업데이트
                result = supabase.table('consultation_messages').update({
                    'content': ai_content,
                    'message_type': final_type,
                    'status': 'completed',
                }).eq('id', message_id).eq('status', 'generating').execute()

                # 이미 처리된 경우 (중복 요청) 조기 종료
                if not result.data:
                    logger.warning(f"[Consultation:{message_id}] 이미 처리됨 (중복 요청)")
                    return

                # 5. 세션 업데이트 (최종 답변인 경우)
                if final_type == 'ai_answer':
                    self._update_session(
                        supabase,
                        request['session_id'],
                        request.get('user_content', '')
                    )

                logger.info(f"[Consultation:{message_id}] 생성 완료")
                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[Consultation:{message_id}] 실패 ({attempt}/{self.MAX_RETRIES}): {e}")
                await asyncio.sleep(1 * attempt)  # 지수 백오프

        if not success:
            logger.error(f"[Consultation:{message_id}] 최종 실패: {last_error}")
            # generating 상태인 경우만 실패로 업데이트 (중복 방지)
            supabase.table('consultation_messages').update({
                'status': 'failed',
                'error_message': last_error or 'AI 응답 생성에 실패했습니다',
            }).eq('id', message_id).eq('status', 'generating').execute()

    def _get_report_data(self, supabase: Client, report_id: str) -> dict:
        """리포트 데이터 조회"""
        result = supabase.table('profile_reports').select(
            'pillars, daewun, analysis'
        ).eq('id', report_id).single().execute()

        if not result.data:
            raise ValueError("사주 분석 데이터를 불러올 수 없습니다")

        return result.data

    def _get_session_history(
        self,
        supabase: Client,
        session_id: str,
        exclude_message_id: str
    ) -> List[dict]:
        """이전 메시지 조회"""
        result = supabase.table('consultation_messages').select(
            'id, message_type, content, question_round, status'
        ).eq('session_id', session_id).neq(
            'id', exclude_message_id
        ).order('created_at', desc=False).execute()

        return result.data or []

    def _update_session(
        self,
        supabase: Client,
        session_id: str,
        user_content: str
    ):
        """세션 업데이트 (질문 수 증가, 제목 업데이트)"""
        # 현재 세션 조회
        session_result = supabase.table('consultation_sessions').select(
            'question_count, title'
        ).eq('id', session_id).single().execute()

        if not session_result.data:
            return

        session = session_result.data
        new_count = session['question_count'] + 1

        update_data = {
            'question_count': new_count,
            'status': 'completed' if new_count >= 5 else 'active',
            'updated_at': datetime.utcnow().isoformat(),
        }

        # 첫 답변이면 제목 업데이트
        current_title = session.get('title', '')
        if session['question_count'] == 0 and (not current_title or '상담' not in current_title):
            update_data['title'] = user_content[:30] + ('...' if len(user_content) > 30 else '')

        supabase.table('consultation_sessions').update(
            update_data
        ).eq('id', session_id).execute()

    async def _call_gemini(
        self,
        request: dict,
        report: dict,
        history: List[dict]
    ) -> Tuple[str, str]:
        """
        Gemini 호출 (clarification vs answer 분기)

        Returns:
            (ai_content, message_type)
        """
        gemini = get_gemini_service()
        language = request.get('language', 'ko')
        user_content = request['user_content']
        message_type = request['message_type']
        skip_clarification = request.get('skip_clarification', False)

        pillars = report.get('pillars', {})
        daewun = report.get('daewun', [])
        analysis = report.get('analysis', {})

        # user_question + 첫 질문 + 건너뛰기 아님 → clarification 시도
        is_user_question = message_type == 'user_question'
        has_no_prev_clarification = not any(
            h.get('message_type') == 'ai_clarification' for h in history
        )

        if is_user_question and not skip_clarification and has_no_prev_clarification:
            # 추가 정보 요청 시도
            try:
                clarification_prompt = build_clarification_prompt(user_content, language)
                clarification_result = await gemini.generate_json(clarification_prompt)

                if (clarification_result.get('needsClarification') and
                    clarification_result.get('clarificationQuestions')):
                    questions = clarification_result['clarificationQuestions']
                    ai_content = "더 정확한 상담을 위해 몇 가지 여쭤볼게요:\n\n"
                    ai_content += "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
                    return ai_content, 'ai_clarification'

                if not clarification_result.get('isValidQuestion'):
                    invalid_reason = clarification_result.get(
                        'invalidReason',
                        '사주 상담과 관련된 질문을 부탁드립니다.'
                    )
                    return invalid_reason, 'ai_answer'

            except Exception as e:
                logger.warning(f"Clarification 생성 실패, 바로 답변 시도: {e}")

        # 최종 답변 생성
        session_history = self._build_session_history(history)

        clarification_response = None
        if message_type == 'user_clarification':
            clarification_response = user_content
            # user_clarification인 경우 원래 질문 찾기
            original_question = self._find_original_question(
                history,
                request.get('question_round', 1)
            )
            if original_question:
                user_content = original_question

        answer_prompt = build_answer_prompt(
            question=user_content,
            pillars=pillars,
            daewun=daewun,
            analysis_summary=analysis.get('summary'),
            session_history=session_history,
            clarification_response=clarification_response,
            language=language,
            today=datetime.now().strftime('%Y-%m-%d'),
        )

        answer = await gemini.generate_text(answer_prompt)
        return answer, 'ai_answer'

    def _build_session_history(self, history: List[dict]) -> List[Dict[str, str]]:
        """세션 히스토리를 Q&A 쌍으로 변환"""
        result = []
        current_question = None

        for msg in history:
            msg_type = msg.get('message_type')
            if msg_type == 'user_question':
                current_question = msg.get('content', '')
            elif msg_type == 'ai_answer' and msg.get('status') == 'completed' and current_question:
                result.append({
                    'question': current_question,
                    'answer': msg.get('content', '')
                })
                current_question = None

        return result

    def _find_original_question(
        self,
        history: List[dict],
        question_round: int
    ) -> Optional[str]:
        """현재 라운드의 원래 질문 찾기"""
        for msg in history:
            if (msg.get('message_type') == 'user_question' and
                msg.get('question_round') == question_round):
                return msg.get('content')
        return None


# 싱글톤 인스턴스
consultation_service = ConsultationService()
