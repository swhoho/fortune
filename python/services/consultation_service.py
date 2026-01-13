"""
상담 메시지 AI 응답 생성 서비스
v2.0: 다회 명확화 + 최근 상담 연동 + 가정의 법칙
"""
import asyncio
import os
import logging
import json
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime

from supabase import create_client, Client

from .gemini import get_gemini_service
from prompts.consultation import build_assessment_prompt, build_answer_prompt

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Supabase 클라이언트 생성"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다")
    return create_client(url, key)


# 일간 비유 매핑
STEM_METAPHORS = {
    '甲': '甲木(큰 나무)', '乙': '乙木(풀/덩굴)',
    '丙': '丙火(태양)', '丁': '丁火(촛불)',
    '戊': '戊土(산/대지)', '己': '己土(논밭)',
    '庚': '庚金(바위/쇠)', '辛': '辛金(보석/칼날)',
    '壬': '壬水(바다/큰물)', '癸': '癸水(이슬/샘물)'
}


class ConsultationService:
    """상담 AI 응답 생성 서비스 v2.0"""

    MAX_RETRIES = 3
    MAX_CLARIFICATIONS = 3

    async def start_generate(self, request: dict):
        """
        백그라운드에서 AI 응답 생성 시작

        Args:
            request: 요청 데이터
              - message_id: AI 메시지 ID
              - session_id: 세션 ID
              - profile_id: 프로필 ID
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

                # 2. 최근 상담 기록 조회 (최대 5개)
                profile_id = request.get('profile_id') or report.get('profile_id')
                recent_consultations = self._get_recent_consultations(supabase, profile_id)

                # 3. 현재 세션 히스토리 조회
                history = self._get_session_history(supabase, request['session_id'], message_id)

                # 4. AI 응답 생성
                ai_content, final_type, clarification_round = await self._call_gemini(
                    request, report, history, recent_consultations,
                    previous_error=last_error if attempt > 1 else None
                )

                # 5. DB 업데이트 (성공) - generating 상태인 경우만 업데이트
                result = supabase.table('consultation_messages').update({
                    'content': ai_content,
                    'message_type': final_type,
                    'status': 'completed',
                    'clarification_round': clarification_round,
                }).eq('id', message_id).eq('status', 'generating').execute()

                # 이미 처리된 경우 (중복 요청) 조기 종료
                if not result.data:
                    logger.warning(f"[Consultation:{message_id}] 이미 처리됨 (중복 요청)")
                    return

                # 6. 세션 업데이트
                if final_type == 'ai_answer':
                    self._update_session(
                        supabase,
                        request['session_id'],
                        request.get('user_content', ''),
                        increment_question=True
                    )
                elif final_type == 'ai_clarification':
                    self._update_session(
                        supabase,
                        request['session_id'],
                        request.get('user_content', ''),
                        increment_clarification=True,
                        clarification_round=clarification_round
                    )

                logger.info(f"[Consultation:{message_id}] 생성 완료 - type: {final_type}")
                success = True
                break

            except Exception as e:
                last_error = str(e)
                logger.warning(f"[Consultation:{message_id}] 실패 ({attempt}/{self.MAX_RETRIES}): {e}")
                await asyncio.sleep(1 * attempt)

        if not success:
            logger.error(f"[Consultation:{message_id}] 최종 실패: {last_error}")
            supabase.table('consultation_messages').update({
                'status': 'failed',
                'error_message': last_error or 'AI 응답 생성에 실패했습니다',
            }).eq('id', message_id).eq('status', 'generating').execute()

    def _get_report_data(self, supabase: Client, report_id: str) -> dict:
        """리포트 데이터 조회 (신년분석 요약 포함)"""
        result = supabase.table('profile_reports').select(
            'profile_id, pillars, daewun, analysis'
        ).eq('id', report_id).single().execute()

        if not result.data:
            raise ValueError("사주 분석 데이터를 불러올 수 없습니다")

        report_data = result.data

        # 신년분석 요약 조회
        profile_id = report_data.get('profile_id')
        if profile_id:
            yearly_result = supabase.table('yearly_analyses').select(
                'target_year, overview'
            ).eq('profile_id', profile_id).eq(
                'status', 'completed'
            ).order('target_year', desc=True).limit(1).execute()

            if yearly_result.data:
                yearly = yearly_result.data[0]
                overview = yearly.get('overview') or {}
                if overview.get('summary'):
                    report_data['yearly_summary'] = {
                        'year': yearly.get('target_year'),
                        'summary': overview.get('summary')
                    }

        return report_data

    def _get_recent_consultations(
        self,
        supabase: Client,
        profile_id: str,
        limit: int = 5
    ) -> List[dict]:
        """최근 완료된 상담 기록 조회 (최대 5개)"""
        if not profile_id:
            return []

        result = supabase.table('consultation_sessions').select(
            'id, title, created_at'
        ).eq('profile_id', profile_id).eq(
            'status', 'completed'
        ).order('created_at', desc=True).limit(limit).execute()

        consultations = []
        for session in result.data or []:
            # 각 세션의 마지막 AI 답변 조회
            messages = supabase.table('consultation_messages').select(
                'content'
            ).eq('session_id', session['id']).eq(
                'message_type', 'ai_answer'
            ).eq('status', 'completed').order('created_at', desc=True).limit(1).execute()

            if messages.data and messages.data[0].get('content'):
                content = messages.data[0]['content']
                # 요약 생성 (처음 200자)
                summary = content[:200].replace('\n', ' ')
                if len(content) > 200:
                    summary += '...'

                consultations.append({
                    'date': session['created_at'][:10],
                    'question': session.get('title') or '(제목 없음)',
                    'summary': summary
                })

        return consultations

    def _get_session_history(
        self,
        supabase: Client,
        session_id: str,
        exclude_message_id: str
    ) -> List[dict]:
        """현재 세션의 메시지 히스토리 조회"""
        result = supabase.table('consultation_messages').select(
            'id, message_type, content, question_round, clarification_round, status'
        ).eq('session_id', session_id).neq(
            'id', exclude_message_id
        ).order('created_at', desc=False).execute()

        return result.data or []

    def _build_pillars_summary(self, pillars: dict, analysis: dict) -> str:
        """사주 요약 문자열 생성"""
        day_stem = pillars.get('day', {}).get('stem', '')
        day_stem_desc = STEM_METAPHORS.get(day_stem, day_stem)

        # 용신 추출
        yongsin = ''
        if analysis:
            yongsin_data = analysis.get('yongsin') or analysis.get('용신') or {}
            if isinstance(yongsin_data, dict):
                yongsin = yongsin_data.get('primary') or yongsin_data.get('주용신') or ''
            elif isinstance(yongsin_data, str):
                yongsin = yongsin_data

        # 격국 추출
        geukguk = ''
        if analysis:
            geukguk = analysis.get('geukguk') or analysis.get('격국') or ''

        return f"일간: {day_stem_desc}, 용신: {yongsin}, 격국: {geukguk}"

    def _extract_clarification_history(self, history: List[dict]) -> List[Dict[str, str]]:
        """히스토리에서 명확화 Q&A 쌍 추출"""
        clarifications = []
        current_ai_question = None
        current_round = 0

        for msg in history:
            msg_type = msg.get('message_type')
            status = msg.get('status')

            if msg_type == 'ai_clarification' and status == 'completed':
                current_ai_question = msg.get('content', '')
                current_round = msg.get('clarification_round', 0)

            elif msg_type == 'user_clarification' and current_ai_question:
                clarifications.append({
                    'round': current_round,
                    'ai_question': current_ai_question,
                    'user_answer': msg.get('content', '')
                })
                current_ai_question = None

        return clarifications

    def _update_session(
        self,
        supabase: Client,
        session_id: str,
        user_content: str,
        increment_question: bool = False,
        increment_clarification: bool = False,
        clarification_round: int = 0
    ):
        """세션 업데이트"""
        session_result = supabase.table('consultation_sessions').select(
            'question_count, clarification_count, title'
        ).eq('id', session_id).single().execute()

        if not session_result.data:
            return

        session = session_result.data
        update_data = {
            'updated_at': datetime.utcnow().isoformat(),
        }

        if increment_question:
            new_count = session['question_count'] + 1
            update_data['question_count'] = new_count
            update_data['status'] = 'completed' if new_count >= 2 else 'active'

        if increment_clarification:
            update_data['clarification_count'] = clarification_round

        # 첫 답변이면 제목 업데이트
        current_title = session.get('title', '')
        if session['question_count'] == 0 and (not current_title or current_title == '새 상담'):
            update_data['title'] = user_content[:30] + ('...' if len(user_content) > 30 else '')

        supabase.table('consultation_sessions').update(
            update_data
        ).eq('id', session_id).execute()

    async def _call_gemini(
        self,
        request: dict,
        report: dict,
        history: List[dict],
        recent_consultations: List[dict],
        previous_error: str = None
    ) -> Tuple[str, str, int]:
        """
        Gemini 호출 (평가 → 명확화 or 답변)

        Returns:
            (ai_content, message_type, clarification_round)
        """
        gemini = get_gemini_service()
        language = request.get('language', 'ko')
        user_content = request['user_content']
        message_type = request['message_type']
        skip_clarification = request.get('skip_clarification', False)

        pillars = report.get('pillars', {})
        daewun = report.get('daewun', [])
        analysis = report.get('analysis', {})

        # 명확화 히스토리 추출
        clarification_history = self._extract_clarification_history(history)
        current_clarification_round = len(clarification_history)

        # 사주 요약 생성
        pillars_summary = self._build_pillars_summary(pillars, analysis)

        # 최대 명확화 횟수 도달 또는 건너뛰기 → 바로 답변
        if current_clarification_round >= self.MAX_CLARIFICATIONS or skip_clarification:
            logger.info(f"[Consultation] 바로 답변 생성 (round={current_clarification_round}, skip={skip_clarification})")
            return await self._generate_final_answer(
                gemini, request, report, clarification_history,
                recent_consultations, 100, previous_error
            )

        # user_clarification인 경우 → 정보 평가 후 다음 결정
        # user_question인 경우 → 정보 평가
        if message_type in ['user_question', 'user_clarification']:
            # 정보 평가 (프롬프트 1)
            assessment_prompt = build_assessment_prompt(
                question=user_content,
                pillars_summary=pillars_summary,
                history=clarification_history,
                recent_consultations=recent_consultations,
                language=language
            )

            try:
                assessment = await gemini.generate_json(assessment_prompt)
                logger.info(f"[Consultation] 평가 결과: {assessment}")

                # 유효하지 않은 질문
                if not assessment.get('isValid', True):
                    invalid_reason = assessment.get('invalidReason') or '사주 상담과 관련된 질문을 부탁드립니다.'
                    return invalid_reason, 'ai_answer', 0

                # 정보 충분 → 답변 생성
                is_sufficient = assessment.get('isInfoSufficient', False)
                confidence = assessment.get('confidenceLevel', 0)

                if is_sufficient or confidence >= 80:
                    logger.info(f"[Consultation] 정보 충분 (confidence={confidence}%) → 답변 생성")
                    return await self._generate_final_answer(
                        gemini, request, report, clarification_history,
                        recent_consultations, confidence, previous_error
                    )

                # 정보 부족 → 추가 질문
                next_questions = assessment.get('nextQuestions', [])
                if next_questions:
                    new_round = current_clarification_round + 1
                    logger.info(f"[Consultation] 추가 질문 필요 (round={new_round})")

                    # 질문 포맷
                    ai_content = self._format_clarification_questions(next_questions, language)
                    return ai_content, 'ai_clarification', new_round

                # nextQuestions가 없으면 답변 생성
                logger.info("[Consultation] nextQuestions 없음 → 답변 생성")
                return await self._generate_final_answer(
                    gemini, request, report, clarification_history,
                    recent_consultations, confidence, previous_error
                )

            except Exception as e:
                logger.warning(f"[Consultation] 평가 실패, 바로 답변 시도: {e}")
                return await self._generate_final_answer(
                    gemini, request, report, clarification_history,
                    recent_consultations, 50, previous_error
                )

        # 기타 경우 → 답변 생성
        return await self._generate_final_answer(
            gemini, request, report, clarification_history,
            recent_consultations, 100, previous_error
        )

    def _format_clarification_questions(
        self,
        questions: List[str],
        language: str
    ) -> str:
        """명확화 질문 포맷"""
        intro_messages = {
            'ko': '더 정확한 상담을 위해 몇 가지 여쭤볼게요:\n\n',
            'en': 'For a more accurate consultation, I have a few questions:\n\n',
            'ja': 'より正確な相談のために、いくつかお聞きします：\n\n',
            'zh-CN': '为了更准确的咨询，我有几个问题：\n\n',
            'zh-TW': '為了更準確的諮詢，我有幾個問題：\n\n'
        }

        intro = intro_messages.get(language, intro_messages['ko'])
        formatted_questions = '\n'.join(f"{i+1}. {q}" for i, q in enumerate(questions[:2]))

        return intro + formatted_questions

    async def _generate_final_answer(
        self,
        gemini,
        request: dict,
        report: dict,
        clarification_history: List[Dict[str, str]],
        recent_consultations: List[dict],
        confidence_level: int,
        previous_error: str = None
    ) -> Tuple[str, str, int]:
        """최종 답변 생성"""
        language = request.get('language', 'ko')
        user_content = request['user_content']
        message_type = request['message_type']

        pillars = report.get('pillars', {})
        daewun = report.get('daewun', [])
        analysis = report.get('analysis', {})
        yearly_summary = report.get('yearly_summary')

        # user_clarification인 경우 원래 질문 찾기
        original_question = user_content
        if message_type == 'user_clarification':
            # 히스토리에서 원래 user_question 찾기
            for msg in self._get_session_history(
                get_supabase_client(),
                request['session_id'],
                request['message_id']
            ):
                if msg.get('message_type') == 'user_question':
                    original_question = msg.get('content', user_content)
                    break

            # 현재 응답도 clarification_history에 추가
            # (아직 DB에 저장 안 됨)
            clarification_history = clarification_history.copy()
            # 마지막 ai_clarification 찾기
            last_ai_q = None
            for msg in self._get_session_history(
                get_supabase_client(),
                request['session_id'],
                request['message_id']
            ):
                if msg.get('message_type') == 'ai_clarification' and msg.get('status') == 'completed':
                    last_ai_q = msg.get('content', '')

            if last_ai_q:
                clarification_history.append({
                    'round': len(clarification_history) + 1,
                    'ai_question': last_ai_q,
                    'user_answer': user_content
                })

        # 답변 프롬프트 생성
        answer_prompt = build_answer_prompt(
            question=original_question,
            pillars=pillars,
            daewun=daewun,
            clarification_responses=clarification_history,
            today=datetime.now().strftime('%Y-%m-%d'),
            analysis_summary=analysis.get('summary') if analysis else None,
            yearly_summary=yearly_summary,
            recent_consultations=recent_consultations,
            confidence_level=confidence_level,
            language=language
        )

        # 에러 피드백 추가 (재시도 시)
        if previous_error:
            answer_prompt += f"""

[이전 시도 실패 - 반드시 수정 필요]
오류: {previous_error}
위 오류를 해결하여 올바르게 응답하세요."""

        answer = await gemini.generate_text(answer_prompt)
        return answer, 'ai_answer', len(clarification_history)


# 싱글톤 인스턴스
consultation_service = ConsultationService()
