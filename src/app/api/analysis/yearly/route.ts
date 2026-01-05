/**
 * POST /api/analysis/yearly
 * 신년 사주 분석 API
 * Task 20: 특정 연도에 대한 월별 상세 운세 분석
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

import { getSupabaseAdmin } from '@/lib/supabase/client';
import { sajuAnalyzer } from '@/lib/ai';
import type { YearlyAnalysisInput, SupportedLanguage } from '@/lib/ai';
import { z } from 'zod';

/** 신년 분석 크레딧 비용 */
const YEARLY_ANALYSIS_CREDIT_COST = 30;

/**
 * 기둥 데이터 스키마
 */
const pillarSchema = z.object({
  stem: z.string().min(1, '천간이 필요합니다'),
  branch: z.string().min(1, '지지가 필요합니다'),
  element: z.string().optional(),
  stemElement: z.string().optional(),
  branchElement: z.string().optional(),
});

/**
 * 요청 검증 스키마
 */
const yearlyRequestSchema = z.object({
  // 분석 대상 연도
  targetYear: z.number().min(2000).max(2100),
  // Task 24.1: 프로필 ID (있으면 프로필에서 사주 정보 가져옴)
  profileId: z.string().uuid().optional(),
  // 생년월일 정보
  sajuInput: z
    .object({
      birthDate: z.string(),
      birthTime: z.string(),
      timezone: z.string(),
      isLunar: z.boolean(),
      gender: z.enum(['male', 'female']),
    })
    .optional(),
  // 기존 분석 ID (있으면 사주 정보 재사용) - 레거시 호환
  existingAnalysisId: z.string().uuid().optional(),
  // 사주 기둥 정보 (직접 입력 시)
  pillars: z
    .object({
      year: pillarSchema,
      month: pillarSchema,
      day: pillarSchema,
      hour: pillarSchema,
    })
    .optional(),
  // 대운 정보
  daewun: z
    .array(
      z.object({
        startAge: z.number().optional(),
        age: z.number().optional(),
        endAge: z.number().optional(),
        stem: z.string(),
        branch: z.string(),
        startYear: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  // 현재 대운
  currentDaewun: z
    .object({
      startAge: z.number().optional(),
      age: z.number().optional(),
      stem: z.string(),
      branch: z.string(),
      startYear: z.number().optional(),
    })
    .optional(),
  // 언어
  language: z.enum(['ko', 'en', 'ja', 'zh-CN', 'zh-TW']).optional().default('ko'),
});

/**
 * 에러 코드에 따른 HTTP 상태 코드 반환
 */
function getStatusCodeFromError(code?: string): number {
  switch (code) {
    case 'INVALID_INPUT':
      return 400;
    case 'INSUFFICIENT_CREDITS':
      return 402;
    case 'INVALID_API_KEY':
    case 'MODEL_NOT_FOUND':
      return 500;
    case 'RATE_LIMIT':
      return 429;
    case 'TIMEOUT':
      return 504;
    default:
      return 500;
  }
}

/**
 * POST /api/analysis/yearly
 * 신년 사주 분석 요청
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = yearlyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '요청 데이터가 올바르지 않습니다',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. 사용자 크레딧 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[API] 사용자 조회 실패:', userError);
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    if (userData.credits < YEARLY_ANALYSIS_CREDIT_COST) {
      return NextResponse.json(
        {
          error: '크레딧이 부족합니다',
          code: 'INSUFFICIENT_CREDITS',
          required: YEARLY_ANALYSIS_CREDIT_COST,
          current: userData.credits,
        },
        { status: 402 }
      );
    }

    // 4. 사주 정보 가져오기 (우선순위: profileId > existingAnalysisId > sajuInput)
    let pillars = data.pillars;
    let daewun = data.daewun;
    let gender: 'male' | 'female' = data.sajuInput?.gender || 'male';
    let birthYear: number | undefined;
    let profileId: string | undefined;

    // Task 24.1: 프로필에서 정보 가져오기
    if (data.profileId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, gender, birth_date, birth_time, calendar_type')
        .eq('id', data.profileId)
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('[API] 프로필 조회 실패:', profileError);
        return NextResponse.json({ error: '프로필 정보를 찾을 수 없습니다' }, { status: 404 });
      }

      profileId = profile.id;
      gender = profile.gender as 'male' | 'female';
      birthYear = new Date(profile.birth_date).getFullYear();

      // 프로필에서 기존 리포트 조회하여 pillars/daewun 가져오기
      const { data: existingReport } = await supabase
        .from('profile_reports')
        .select('pillars, daewun')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingReport) {
        pillars = existingReport.pillars;
        daewun = existingReport.daewun || [];
      } else {
        // 프로필에는 있지만 기존 리포트가 없는 경우 - 만세력 API 호출
        console.log('[API] 프로필에 기존 리포트 없음, 만세력 API 호출');

        // PYTHON_API_URL에 프로토콜 없으면 https:// 자동 추가
        let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
        if (!pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
          pythonApiUrl = `https://${pythonApiUrl}`;
        }

        try {
          const manseryeokRes = await fetch(`${pythonApiUrl}/api/manseryeok/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              birth_date: profile.birth_date,
              birth_time: profile.birth_time || '12:00',
              timezone: 'Asia/Seoul',
              is_lunar: profile.calendar_type === 'lunar',
              gender: profile.gender,
            }),
          });

          if (!manseryeokRes.ok) {
            throw new Error(`만세력 API 오류: ${manseryeokRes.status}`);
          }

          const manseryeokData = await manseryeokRes.json();
          pillars = manseryeokData.pillars;
          daewun = manseryeokData.daewun || [];
        } catch (manseryeokError) {
          console.error('[API] 만세력 계산 실패:', manseryeokError);
          return NextResponse.json(
            { error: '사주 정보 계산에 실패했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500 }
          );
        }
      }
    } else if (data.existingAnalysisId) {
      // 레거시: 기존 분석 ID로 정보 가져오기
      const { data: existingAnalysis, error: analysisError } = await supabase
        .from('analyses')
        .select('pillars, daewun, gender, birth_datetime')
        .eq('id', data.existingAnalysisId)
        .eq('user_id', userId)
        .single();

      if (analysisError || !existingAnalysis) {
        console.error('[API] 기존 분석 조회 실패:', analysisError);
        return NextResponse.json({ error: '기존 분석 정보를 찾을 수 없습니다' }, { status: 404 });
      }

      pillars = existingAnalysis.pillars;
      daewun = existingAnalysis.daewun || [];
      gender = existingAnalysis.gender;
      birthYear = new Date(existingAnalysis.birth_datetime).getFullYear();
    } else if (data.sajuInput) {
      birthYear = new Date(data.sajuInput.birthDate).getFullYear();
      gender = data.sajuInput.gender;
    }

    // pillars가 없으면 에러
    if (!pillars) {
      return NextResponse.json(
        { error: '사주 정보가 필요합니다. 기존 분석 ID 또는 사주 입력 정보를 제공해주세요.' },
        { status: 400 }
      );
    }

    // birthYear가 없으면 연주에서 추정
    if (!birthYear) {
      // 연주의 지지로 대략적인 생년 추정 (정확하지 않음)
      birthYear = 1990; // 기본값
    }

    // 5. 현재 대운 찾기
    let currentDaewun = data.currentDaewun;
    if (!currentDaewun && daewun.length > 0) {
      // 대운 목록에서 현재 연도에 해당하는 대운 찾기
      const currentAge = data.targetYear - birthYear;
      const found = daewun.find((d) => {
        const startAge = d.startAge ?? d.age ?? 0;
        const endAge = d.endAge ?? startAge + 9;
        return currentAge >= startAge && currentAge <= endAge;
      });
      if (found) {
        currentDaewun = {
          startAge: found.startAge ?? found.age,
          age: found.age ?? found.startAge,
          stem: found.stem,
          branch: found.branch,
          startYear: found.startYear,
        };
      }
    }

    // 6. AI 분석 실행 (60초 타임아웃 - 신년 분석은 더 오래 걸림)
    console.log('[API] /api/analysis/yearly 분석 시작', {
      userId,
      targetYear: data.targetYear,
      language: data.language,
    });

    const input: YearlyAnalysisInput = {
      year: data.targetYear,
      pillars: pillars as unknown as import('@/lib/ai/types').SajuPillarsData,
      daewun: daewun as unknown as import('@/lib/ai/types').DaewunData[],
      language: data.language as SupportedLanguage,
      // Task 5: 점수 계산을 위한 birthYear, gender 전달
      birthYear: birthYear,
      gender: gender,
    };

    const analysisResult = await sajuAnalyzer.analyzeYearly(input, {
      timeout: 60000,
      retryCount: 2,
    });

    // 7. 결과 확인
    if (!analysisResult.success) {
      console.error('[API] /api/analysis/yearly 분석 실패', analysisResult.error);

      const statusCode = getStatusCodeFromError(analysisResult.error?.code);

      return NextResponse.json(
        {
          error: analysisResult.error?.message ?? 'AI 분석에 실패했습니다',
          code: analysisResult.error?.code,
        },
        { status: statusCode }
      );
    }

    // 8. DB에 결과 저장
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('yearly_analyses')
      .insert({
        user_id: userId,
        target_year: data.targetYear,
        pillars: pillars,
        daewun: daewun,
        current_daewun: currentDaewun,
        gender: gender,
        analysis: analysisResult.data,
        language: data.language,
        credits_used: YEARLY_ANALYSIS_CREDIT_COST,
        existing_analysis_id: data.existingAnalysisId || null,
        profile_id: profileId || null, // Task 24.1: 프로필 ID 저장
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[API] 신년 분석 저장 실패:', insertError);
      // 저장 실패해도 결과는 반환
    }

    // 9. 크레딧 차감
    const newCredits = userData.credits - YEARLY_ANALYSIS_CREDIT_COST;
    const { error: creditError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (creditError) {
      console.error('[API] 크레딧 차감 실패:', creditError);
      // 크레딧 차감 실패해도 분석은 반환
    }

    // 10. 성공 응답
    console.log('[API] /api/analysis/yearly 분석 완료', {
      userId,
      analysisId: savedAnalysis?.id,
      creditsUsed: YEARLY_ANALYSIS_CREDIT_COST,
      remainingCredits: newCredits,
    });

    return NextResponse.json({
      success: true,
      analysisId: savedAnalysis?.id,
      year: data.targetYear,
      data: analysisResult.data,
      creditsUsed: YEARLY_ANALYSIS_CREDIT_COST,
      remainingCredits: newCredits,
    });
  } catch (error) {
    console.error('[API] /api/analysis/yearly 에러:', error);

    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * API 라우트 설정
 * 60초 타임아웃 (신년 분석은 12개월 분석으로 더 오래 걸림)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
