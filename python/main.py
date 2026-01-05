"""
만세력 계산 API - FastAPI 엔트리포인트
사주 팔자, 대운, 지장간 계산 서비스 + AI 프롬프트 빌더
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas.saju import CalculateRequest, CalculateResponse
from schemas.visualization import VisualizationRequest, VisualizationResponse
from schemas.prompt import PromptBuildRequest, PromptBuildResponse, PromptMetadata, YearlyPromptBuildRequest, StepPromptRequest
from manseryeok.engine import ManseryeokEngine
from visualization import SajuVisualizer
from prompts.builder import (
    PromptBuilder,
    PromptBuildRequest as BuilderRequest,
    PromptBuildOptions,
    YearlyPromptBuildRequest as YearlyBuilderRequest,
)

# 시각화 인스턴스 (싱글톤)
visualizer = SajuVisualizer()

app = FastAPI(
    title="만세력 계산 API",
    description="사주 팔자, 대운, 지장간 계산 및 AI 프롬프트 빌드 서비스",
    version="1.1.0",
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


@app.post("/api/prompts/build", response_model=PromptBuildResponse)
async def build_prompt(request: PromptBuildRequest) -> PromptBuildResponse:
    """
    AI 분석용 프롬프트 빌드

    자평진전, 궁통보감, The Destiny Code 기반 다국어 프롬프트를 생성합니다.

    - **language**: 언어 (ko, en, ja, zh)
    - **pillars**: 사주 팔자 데이터
    - **daewun**: 대운 목록 (선택)
    - **focusArea**: 집중 분석 영역 (선택)
    - **question**: 사용자 질문 (선택, 500자 제한)
    - **options**: 프롬프트 빌드 옵션

    Returns:
        시스템 프롬프트, 사용자 프롬프트, 출력 스키마, 메타데이터
    """
    try:
        # 옵션 변환
        options = PromptBuildOptions(
            include_ziping=request.options.includeZiping,
            include_qiongtong=request.options.includeQiongtong,
            include_western=request.options.includeWestern
        )

        # 빌더 요청 생성
        builder_request = BuilderRequest(
            language=request.language,
            pillars=request.pillars,
            daewun=request.daewun,
            focus_area=request.focusArea,
            question=request.question,
            options=options
        )

        # 프롬프트 빌드
        result = PromptBuilder.build(builder_request)

        # 응답 반환
        return PromptBuildResponse(
            systemPrompt=result.system_prompt,
            userPrompt=result.user_prompt,
            outputSchema=result.output_schema,
            metadata=PromptMetadata(
                version=result.metadata["version"],
                language=result.metadata["language"],
                includedModules=result.metadata["included_modules"],
                generatedAt=result.metadata["generated_at"]
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"프롬프트 빌드 중 오류가 발생했습니다: {str(e)}"
        )


@app.post("/api/prompts/step", response_model=PromptBuildResponse)
async def build_step_prompt(request: StepPromptRequest) -> PromptBuildResponse:
    """
    멀티스텝 파이프라인용 단계별 프롬프트 빌드 (Task 8, v3.0)

    4단계 분석 파이프라인:
    - **basic**: 기본 분석 (일간, 격국, 용신)
    - **personality**: 성격 분석 (십신 기반)
    - **aptitude**: 적성 분석 (강점, 약점, 추천 분야)
    - **fortune**: 재물/연애 분석

    Args:
    - **step**: 분석 단계 (basic, personality, aptitude, fortune)
    - **language**: 언어 (ko, en, ja, zh-CN, zh-TW)
    - **pillars**: 사주 팔자 데이터
    - **daewun**: 대운 목록 (선택)
    - **jijanggan**: 지장간 데이터 (선택)
    - **previousResults**: 이전 단계 결과 (컨텍스트용)
    - **tenGodCounts**: v3.0 십신 분포 (선택)
    - **interactions**: v3.0 지지 상호작용 (선택)
    - **sinsals**: v3.0 신살 목록 (선택)
    - **formation**: v3.0 격국 분석 결과 (선택)
    - **currentAge**: v3.0 현재 나이 (선택)

    Returns:
        시스템 프롬프트, 사용자 프롬프트, 출력 스키마, 메타데이터
    """
    try:
        # 프롬프트 빌드 (v3.0 컨텍스트 포함)
        result = PromptBuilder.build_step(
            step=request.step,
            pillars=request.pillars,
            language=request.language,
            daewun=request.daewun,
            jijanggan=request.jijanggan,
            previous_results=request.previousResults,
            # v3.0: 분석 컨텍스트 전달
            ten_god_counts=request.tenGodCounts,
            interactions=request.interactions,
            sinsals=request.sinsals,
            formation=request.formation,
            current_age=request.currentAge,
        )

        # 메타데이터 구성
        included_modules = ["master"]
        if request.step == 'basic':
            included_modules.extend(["ziping_summary", "qiongtong_summary"])
        elif request.step == 'personality':
            included_modules.append("ten_gods_guide")
        elif request.step == 'aptitude':
            included_modules.append("ziping_summary")
        elif request.step == 'fortune':
            included_modules.extend(["ziping_summary", "qiongtong_summary"])

        # 응답 반환
        return PromptBuildResponse(
            systemPrompt=result.system_prompt,
            userPrompt=result.user_prompt,
            outputSchema=result.output_schema,
            metadata=PromptMetadata(
                version=result.metadata.get("version", "1.0.0"),
                language=result.metadata.get("language", request.language),
                includedModules=included_modules,
                generatedAt=result.metadata.get("generated_at", "")
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"단계별 프롬프트 빌드 중 오류가 발생했습니다: {str(e)}"
        )


@app.post("/api/prompts/build/yearly", response_model=PromptBuildResponse)
async def build_yearly_prompt(request: YearlyPromptBuildRequest) -> PromptBuildResponse:
    """
    신년 사주 분석용 프롬프트 빌드

    특정 연도에 대한 월별 상세 운세 분석 프롬프트를 생성합니다.

    - **language**: 언어 (ko, en, ja, zh-CN, zh-TW)
    - **targetYear**: 분석 대상 연도 (예: 2026)
    - **birthYear**: 생년 (만 나이 계산용)
    - **pillars**: 사주 팔자 데이터
    - **daewun**: 대운 목록
    - **currentDaewun**: 현재 대운 (분석 연도 기준)
    - **gender**: 성별
    - **options**: 프롬프트 빌드 옵션

    Returns:
        시스템 프롬프트, 사용자 프롬프트, 출력 스키마, 메타데이터
    """
    try:
        # 옵션 변환
        options = PromptBuildOptions(
            include_ziping=request.options.includeZiping,
            include_qiongtong=request.options.includeQiongtong,
            include_western=request.options.includeWestern
        )

        # 빌더 요청 생성
        builder_request = YearlyBuilderRequest(
            language=request.language,
            target_year=request.targetYear,
            birth_year=request.birthYear,
            pillars=request.pillars,
            daewun=request.daewun,
            current_daewun=request.currentDaewun,
            gender=request.gender,
            options=options
        )

        # 프롬프트 빌드
        result = PromptBuilder.build_yearly(builder_request)

        # 응답 반환
        return PromptBuildResponse(
            systemPrompt=result.system_prompt,
            userPrompt=result.user_prompt,
            outputSchema=result.output_schema,
            metadata=PromptMetadata(
                version=result.metadata["version"],
                language=result.metadata["language"],
                includedModules=result.metadata["included_modules"],
                generatedAt=result.metadata["generated_at"]
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"신년 분석 프롬프트 빌드 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "manseryeok-api", "version": "1.2.0"}


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
