"""
Gemini AI 서비스
Google Generative AI를 사용한 사주 분석

v2.7 (2026-01-07):
- response_schema 지원 추가 (JSON 형식 100% 강제)
- 에러 피드백 재시도 지원
"""
import os
import json
import re
import logging
from typing import Any, Dict, Optional, List

import google.generativeai as genai
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini AI 서비스 클래스"""

    def __init__(self):
        """Gemini 클라이언트 초기화"""
        api_key = os.getenv("GOOGLE_AI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_AI_API_KEY 환경변수가 설정되지 않았습니다")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "max_output_tokens": 8192,
            }
        )

    async def generate_yearly_analysis(
        self,
        prompt: str,
        timeout: int = 180
    ) -> Dict[str, Any]:
        """
        신년 분석 생성

        Args:
            prompt: 분석 프롬프트
            timeout: 타임아웃 (초)

        Returns:
            파싱된 분석 결과
        """
        try:
            response = await self.model.generate_content_async(prompt)
            response_text = response.text

            # JSON 파싱
            result = self._parse_json_response(response_text)
            return result

        except Exception as e:
            logger.error(f"Gemini 분석 실패: {e}")
            raise

    async def generate_report_analysis(
        self,
        prompt: str,
        timeout: int = 300
    ) -> Dict[str, Any]:
        """
        리포트 단계별 분석 생성

        Args:
            prompt: 분석 프롬프트
            timeout: 타임아웃 (초)

        Returns:
            파싱된 분석 결과
        """
        try:
            response = await self.model.generate_content_async(prompt)
            response_text = response.text

            # JSON 파싱 (필수 필드 검증 없이)
            result = self._parse_json_response_generic(response_text)
            return result

        except Exception as e:
            logger.error(f"Gemini 리포트 분석 실패: {e}")
            raise

    async def generate_with_schema(
        self,
        prompt: str,
        response_schema: Dict[str, Any],
        previous_error: Optional[str] = None,
        timeout: int = 120
    ) -> Dict[str, Any]:
        """
        response_schema를 사용한 JSON 응답 생성 (v2.7)

        JSON 형식을 100% 강제하여 파싱 실패를 방지합니다.
        이전 오류가 있으면 프롬프트에 피드백으로 추가합니다.

        Args:
            prompt: 분석 프롬프트
            response_schema: Gemini response_schema (JSON Schema 형식)
            previous_error: 이전 시도의 오류 메시지 (재시도 시)
            timeout: 타임아웃 (초)

        Returns:
            파싱된 JSON 딕셔너리
        """
        try:
            # 이전 오류가 있으면 프롬프트에 피드백 추가
            final_prompt = prompt
            if previous_error:
                final_prompt = f"""{prompt}

[이전 시도 실패 - 반드시 수정 필요]
오류: {previous_error}
위 오류를 해결하여 올바른 JSON 형식으로 응답하세요.
모든 필드를 빠짐없이 포함하고, 타입을 정확히 맞추세요."""

            # response_schema로 JSON 형식 강제 + safety_settings (사주 분석 false positive 방지)
            response = await self.model.generate_content_async(
                final_prompt,
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.7,
                    top_p=0.95,
                    max_output_tokens=8192,
                ),
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )

            # Safety block 체크
            if not response.parts:
                if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                    raise ValueError(f"Gemini Safety Block: {response.prompt_feedback}")
                raise ValueError("Gemini가 빈 응답을 반환했습니다")

            response_text = response.text
            if not response_text or not response_text.strip():
                raise ValueError("빈 응답")

            # JSON 문자열 정리 (Markdown 코드블록 제거)
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            return json.loads(text)

        except Exception as e:
            logger.error(f"Schema 기반 생성 실패: {e}")
            raise

    async def generate_yearly_step(
        self,
        prompt: str,
        step: str,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """
        신년 분석 단계별 호출 (순차 파이프라인용)

        Args:
            prompt: 단계별 프롬프트
            step: 단계 이름 (yearly_overview, monthly_1_3, ...)
            timeout: 타임아웃 (초) - 단계별로 60초

        Returns:
            파싱된 분석 결과

        Raises:
            ValueError: 빈 응답이거나 JSON 파싱 실패 시
        """
        try:
            logger.info(f"[Gemini] 신년 분석 단계 시작: {step}")

            response = await self.model.generate_content_async(prompt)
            response_text = response.text

            # 빈 응답 검증 (핵심!)
            if not response_text or not response_text.strip():
                logger.error(f"[Gemini] 빈 응답 (step={step})")
                raise ValueError(f"빈 응답 (step={step})")

            # JSON 파싱
            result = self._parse_json_response_generic(response_text)

            # 결과 검증 - 빈 딕셔너리도 실패 처리
            if not result or len(result) == 0:
                logger.error(f"[Gemini] 빈 결과 (step={step})")
                raise ValueError(f"빈 결과 (step={step})")

            logger.info(f"[Gemini] 신년 분석 단계 완료: {step}")
            return result

        except Exception as e:
            logger.error(f"[Gemini] 신년 분석 단계 실패 ({step}): {e}")
            raise

    def _parse_json_response_generic(self, response_text: str) -> Dict[str, Any]:
        """
        Gemini 응답에서 JSON 파싱 (필수 필드 검증 없음)

        Args:
            response_text: Gemini 응답 텍스트

        Returns:
            파싱된 JSON 딕셔너리
        """
        try:
            json_string = response_text.strip()

            # ```json ... ``` 형태 처리
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', json_string)
            if json_match:
                json_string = json_match.group(1).strip()

            return json.loads(json_string)

        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {e}")
            raise ValueError(f"JSON 파싱 실패: {e}")

    async def generate_followup_answer(
        self,
        prompt: str,
        timeout: int = 60
    ) -> str:
        """
        후속 질문에 대한 답변 생성

        Args:
            prompt: 질문 프롬프트
            timeout: 타임아웃 (초)

        Returns:
            답변 텍스트
        """
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"후속 질문 답변 생성 실패: {e}")
            raise

    async def generate_text(
        self,
        prompt: str,
        timeout: int = 60
    ) -> str:
        """
        텍스트 응답 생성 (상담 답변용)

        Args:
            prompt: 프롬프트
            timeout: 타임아웃 (초)

        Returns:
            응답 텍스트
        """
        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text.strip()
            if not text:
                raise ValueError("AI 응답이 비어있습니다")
            return text
        except Exception as e:
            logger.error(f"텍스트 생성 실패: {e}")
            raise

    async def generate_json(
        self,
        prompt: str,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """
        JSON 응답 생성 (상담 clarification용)

        Args:
            prompt: JSON 응답을 요청하는 프롬프트
            timeout: 타임아웃 (초)

        Returns:
            파싱된 JSON 딕셔너리
        """
        try:
            response = await self.model.generate_content_async(prompt)
            response_text = response.text

            if not response_text or not response_text.strip():
                raise ValueError("빈 응답")

            return self._parse_json_response_generic(response_text)
        except Exception as e:
            logger.error(f"JSON 생성 실패: {e}")
            raise

    async def generate_section_analysis(
        self,
        prompt: str,
        section_type: str,
        timeout: int = 90
    ) -> Dict[str, Any]:
        """
        섹션 재분석 결과 생성

        Args:
            prompt: 분석 프롬프트
            section_type: 섹션 타입 (personality, aptitude, fortune)
            timeout: 타임아웃 (초)

        Returns:
            파싱된 분석 결과
        """
        try:
            response = await self.model.generate_content_async(prompt)
            response_text = response.text

            # JSON 파싱
            result = self._parse_json_response_generic(response_text)
            return result

        except Exception as e:
            logger.error(f"섹션 재분석 실패 ({section_type}): {e}")
            raise

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Gemini 응답에서 JSON 파싱

        Args:
            response_text: Gemini 응답 텍스트

        Returns:
            파싱된 JSON 딕셔너리
        """
        try:
            json_string = response_text.strip()

            # ```json ... ``` 형태 처리
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', json_string)
            if json_match:
                json_string = json_match.group(1).strip()

            parsed = json.loads(json_string)

            # 필수 필드 검증
            required_fields = [
                'year', 'summary', 'yearlyTheme', 'overallScore',
                'monthlyFortunes', 'quarterlyHighlights', 'keyDates',
                'yearlyAdvice', 'classicalReferences'
            ]

            for field in required_fields:
                if field not in parsed:
                    raise ValueError(f"필수 필드 누락: {field}")

            # monthlyFortunes가 12개인지 확인
            if not isinstance(parsed.get('monthlyFortunes'), list) or len(parsed['monthlyFortunes']) != 12:
                raise ValueError("monthlyFortunes는 12개월 모두 필요합니다")

            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 실패: {e}")
            raise ValueError(f"JSON 파싱 실패: {e}")


# 싱글톤 인스턴스
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Gemini 서비스 인스턴스 반환"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
