'use client';

/**
 * 분석 진행 중 페이지
 * PRD 섹션 5.7 기반
 *
 * API 호출 순서:
 * 1. POST /api/manseryeok/calculate (Python)
 * 2. POST /api/analysis/gemini (Next.js)
 * 3. POST /api/visualization/pillar (Python)
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProcessingScreen } from '@/components/analysis';
import { useAnalysisStore } from '@/stores/analysis';
import type { LoadingStep } from '@/types/saju';

/** Python API URL */
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

/** 단계 사이 딜레이 (ms) */
const STEP_DELAY = 500;

/**
 * 딜레이 유틸리티
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * SajuInput을 Python API 형식으로 변환
 */
function formatBirthDatetime(birthDate: Date, birthTime: string): string {
  const year = birthDate.getFullYear();
  const month = String(birthDate.getMonth() + 1).padStart(2, '0');
  const day = String(birthDate.getDate()).padStart(2, '0');
  const time = birthTime.padStart(5, '0'); // HH:mm
  return `${year}-${month}-${day}T${time}:00`;
}

/**
 * Pillars를 Gemini API 형식으로 변환
 */
function convertToGeminiFormat(pillars: {
  year: { stem: string; branch: string; element: string };
  month: { stem: string; branch: string; element: string };
  day: { stem: string; branch: string; element: string };
  hour: { stem: string; branch: string; element: string };
}) {
  return {
    year: {
      stem: pillars.year.stem,
      branch: pillars.year.branch,
      element: pillars.year.element,
      stemElement: pillars.year.element, // Python API에서 동일하게 제공
      branchElement: pillars.year.element,
    },
    month: {
      stem: pillars.month.stem,
      branch: pillars.month.branch,
      element: pillars.month.element,
      stemElement: pillars.month.element,
      branchElement: pillars.month.element,
    },
    day: {
      stem: pillars.day.stem,
      branch: pillars.day.branch,
      element: pillars.day.element,
      stemElement: pillars.day.element,
      branchElement: pillars.day.element,
    },
    hour: {
      stem: pillars.hour.stem,
      branch: pillars.hour.branch,
      element: pillars.hour.element,
      stemElement: pillars.hour.element,
      branchElement: pillars.hour.element,
    },
  };
}

export default function ProcessingPage() {
  const router = useRouter();
  const isRunning = useRef(false);

  const {
    sajuInput,
    focusArea,
    question,
    loadingStep,
    error,
    setLoading,
    setAnalysisResult,
    setPillarImage,
    setPillarsData,
    setError,
    setStep,
  } = useAnalysisStore();

  /**
   * 분석 파이프라인 실행
   */
  const runAnalysisPipeline = useCallback(async () => {
    // 중복 실행 방지
    if (isRunning.current) return;
    isRunning.current = true;

    // 입력 데이터 확인
    if (!sajuInput) {
      setError('생년월일 정보가 없습니다. 처음부터 다시 시작해주세요.');
      return;
    }

    try {
      // ============================================
      // Step 1: 만세력 계산 (Python API)
      // ============================================
      setLoading(true, 'manseryeok');

      const birthDatetime = formatBirthDatetime(sajuInput.birthDate, sajuInput.birthTime);

      const manseryeokResponse = await fetch(`${PYTHON_API_URL}/api/manseryeok/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDatetime,
          timezone: sajuInput.timezone,
          isLunar: sajuInput.isLunar,
          gender: sajuInput.gender,
        }),
      });

      if (!manseryeokResponse.ok) {
        throw new Error('만세력 계산에 실패했습니다.');
      }

      const manseryeokData = await manseryeokResponse.json();
      const { pillars, daewun, jijanggan } = manseryeokData;

      setPillarsData(pillars, daewun, jijanggan);
      await delay(STEP_DELAY);

      // ============================================
      // Step 2: 지장간 추출 (이미 Step 1에서 완료)
      // ============================================
      setLoading(true, 'jijanggan');
      await delay(STEP_DELAY);

      // ============================================
      // Step 3: AI 분석 (Gemini API)
      // ============================================
      setLoading(true, 'ai_analysis');

      const geminiPayload = {
        pillars: convertToGeminiFormat(pillars),
        daewun: daewun.slice(0, 5), // 상위 5개 대운만
        focusArea: focusArea || 'overall',
        question: question || undefined,
      };

      const analysisResponse = await fetch('/api/analysis/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || 'AI 분석에 실패했습니다.');
      }

      const analysisData = await analysisResponse.json();
      if (!analysisData.success || !analysisData.data) {
        throw new Error('AI 분석 결과를 받지 못했습니다.');
      }

      setAnalysisResult(analysisData.data);
      await delay(STEP_DELAY);

      // ============================================
      // Step 4: 시각화 생성 (Python API)
      // ============================================
      setLoading(true, 'visualization');

      const vizResponse = await fetch(`${PYTHON_API_URL}/api/visualization/pillar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillars }),
      });

      if (!vizResponse.ok) {
        throw new Error('시각화 생성에 실패했습니다.');
      }

      const vizData = await vizResponse.json();
      setPillarImage(vizData.imageBase64);
      await delay(STEP_DELAY);

      // ============================================
      // Step 5: 보고서 작성 (상태 저장)
      // ============================================
      setLoading(true, 'report');
      await delay(STEP_DELAY);

      // ============================================
      // Step 6: DB 저장 (Task 16 추가)
      // ============================================
      let analysisId = 'temp';

      try {
        const saveResponse = await fetch('/api/analysis/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sajuInput: {
              birthDate: sajuInput.birthDate.toISOString(),
              birthTime: sajuInput.birthTime,
              timezone: sajuInput.timezone,
              isLunar: sajuInput.isLunar,
              gender: sajuInput.gender,
            },
            pillars,
            daewun,
            jijanggan,
            analysis: analysisData.data,
            pillarImage: vizData.imageBase64,
            focusArea: focusArea || 'overall',
            question: question || undefined,
          }),
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          analysisId = saveData.analysisId;
          console.log('[Processing] 분석 결과 DB 저장 완료:', analysisId);
        } else {
          // DB 저장 실패해도 결과는 표시 (스토어에 저장됨)
          console.warn('[Processing] DB 저장 실패, 스토어 데이터 사용');
        }
      } catch (saveError) {
        console.warn('[Processing] DB 저장 중 오류:', saveError);
      }

      // ============================================
      // 완료
      // ============================================
      setLoading(false, 'complete');
      setStep('result');

      // 결과 페이지로 이동 (실제 ID 사용)
      router.push(`/analysis/result/${analysisId}`);
    } catch (err) {
      console.error('Analysis pipeline error:', err);
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      isRunning.current = false;
    }
  }, [
    sajuInput,
    focusArea,
    question,
    setLoading,
    setAnalysisResult,
    setPillarImage,
    setPillarsData,
    setError,
    setStep,
    router,
  ]);

  /**
   * 재시도 핸들러
   */
  const handleRetry = useCallback(() => {
    setError(null);
    isRunning.current = false;
    runAnalysisPipeline();
  }, [setError, runAnalysisPipeline]);

  // 컴포넌트 마운트 시 파이프라인 실행
  useEffect(() => {
    runAnalysisPipeline();
  }, [runAnalysisPipeline]);

  return (
    <ProcessingScreen
      currentStep={loadingStep as LoadingStep | null}
      error={error}
      onRetry={handleRetry}
    />
  );
}
