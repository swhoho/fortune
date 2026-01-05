"""
Gemini AI 서비스
Google Generative AI를 사용한 사주 분석
"""
import os
import json
import re
import logging
from typing import Any, Dict, Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini AI 서비스 클래스"""

    def __init__(self):
        """Gemini 클라이언트 초기화"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY 환경변수가 설정되지 않았습니다")

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
