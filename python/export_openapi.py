#!/usr/bin/env python3
"""
OpenAPI 스키마 내보내기 스크립트
FastAPI 앱에서 OpenAPI JSON을 생성합니다.
"""
import json
import sys
from pathlib import Path

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent))

from main import app


def export_openapi():
    """OpenAPI 스키마를 JSON 파일로 내보내기"""
    openapi_schema = app.openapi()

    # 버전 정보 추가
    openapi_schema["info"]["version"] = "2.1.0"
    openapi_schema["info"]["description"] = (
        "만세력 계산 API - 사주 팔자, 대운, 지장간 계산 및 AI 프롬프트 빌드 서비스\n\n"
        "**Source of Truth**: Python Pydantic 모델\n"
        "**TypeScript 타입 자동 생성**: `npm run generate:types`"
    )

    # 출력 경로
    output_path = Path(__file__).parent.parent / "src" / "types" / "openapi.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

    print(f"OpenAPI 스키마 내보내기 완료: {output_path}")
    return str(output_path)


if __name__ == "__main__":
    export_openapi()
