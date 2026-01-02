"""
만세력 계산 API - FastAPI 엔트리포인트
사주 팔자, 대운, 지장간 계산 서비스
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas.saju import CalculateRequest, CalculateResponse
from schemas.visualization import VisualizationRequest, VisualizationResponse
from manseryeok.engine import ManseryeokEngine
from visualization import SajuVisualizer

# 시각화 인스턴스 (싱글톤)
visualizer = SajuVisualizer()

app = FastAPI(
    title="만세력 계산 API",
    description="사주 팔자, 대운, 지장간 계산 서비스",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/manseryeok/calculate", response_model=CalculateResponse)
async def calculate_saju(request: CalculateRequest) -> CalculateResponse:
    """
    사주 팔자, 대운, 지장간 계산

    - **birthDatetime**: 생년월일시 (ISO 8601 형식)
    - **timezone**: 시간대 (예: GMT+9)
    - **isLunar**: 음력 여부
    - **gender**: 성별 (대운 방향 결정)
    """
    try:
        engine = ManseryeokEngine()
        return engine.calculate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="만세력 계산 중 오류가 발생했습니다")


@app.post("/api/visualization/pillar", response_model=VisualizationResponse)
async def generate_pillar_image(request: VisualizationRequest) -> VisualizationResponse:
    """
    사주 명반 이미지 생성

    - **pillars**: 사주 팔자 데이터 (year, month, day, hour)

    Returns:
        Base64 인코딩된 PNG 이미지
    """
    try:
        image_base64 = visualizer.generate(request.pillars)
        return VisualizationResponse(imageBase64=image_base64)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"명반 이미지 생성 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "manseryeok-api"}


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """입력값 오류 처리 (한국어)"""
    return JSONResponse(
        status_code=400,
        content={"error": "입력값 오류", "detail": str(exc)}
    )


@app.exception_handler(Exception)
async def general_error_handler(request, exc):
    """일반 오류 처리 (한국어)"""
    return JSONResponse(
        status_code=500,
        content={"error": "서버 오류", "detail": "만세력 계산 중 오류가 발생했습니다"}
    )
