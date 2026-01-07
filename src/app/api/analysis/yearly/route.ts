/**
 * POST /api/analysis/yearly
 * 신년 사주 분석 API (폴링 방식)
 * Python Railway 백엔드에서 Gemini 분석 실행
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';
import {
  AUTH_ERRORS,
  API_ERRORS,
  ANALYSIS_ERRORS,
  CREDIT_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

/** 신년 분석 크레딧 비용 */
const YEARLY_ANALYSIS_CREDIT_COST = 50;

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
  targetYear: z.number().min(2000).max(2100),
  profileId: z.string().uuid().optional(),
  sajuInput: z
    .object({
      birthDate: z.string(),
      birthTime: z.string(),
      timezone: z.string(),
      isLunar: z.boolean(),
      gender: z.enum(['male', 'female']),
    })
    .optional(),
  existingAnalysisId: z.string().uuid().optional(),
  pillars: z
    .object({
      year: pillarSchema,
      month: pillarSchema,
      day: pillarSchema,
      hour: pillarSchema,
    })
    .optional(),
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
  currentDaewun: z
    .object({
      startAge: z.number().optional(),
      age: z.number().optional(),
      stem: z.string(),
      branch: z.string(),
      startYear: z.number().optional(),
    })
    .optional(),
  language: z.enum(['ko', 'en', 'ja', 'zh-CN', 'zh-TW']).optional().default('ko'),
});

/**
 * Python API URL 가져오기
 */
function getPythonApiUrl(): string {
  let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  if (!pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
    pythonApiUrl = `https://${pythonApiUrl}`;
  }
  return pythonApiUrl;
}

/**
 * POST /api/analysis/yearly
 * 신년 사주 분석 시작 (즉시 반환, Python 백그라운드 실행)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = yearlyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          VALIDATION_ERRORS.REQUIRED_FIELD_MISSING,
          undefined,
          JSON.stringify(validationResult.error.flatten())
        ),
        { status: getStatusCode(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING) }
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
      return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
        status: getStatusCode(API_ERRORS.NOT_FOUND),
      });
    }

    if (userData.credits < YEARLY_ANALYSIS_CREDIT_COST) {
      return NextResponse.json(
        createErrorResponse(CREDIT_ERRORS.INSUFFICIENT, {
          required: YEARLY_ANALYSIS_CREDIT_COST,
          current: userData.credits,
        }),
        { status: getStatusCode(CREDIT_ERRORS.INSUFFICIENT) }
      );
    }

    // 3.5 기존 분석 확인 (completed, pending, in_progress)
    // profileId가 있으면 프로필 단위로, 없으면 사용자 단위로 체크
    let existingAnalysisQuery = supabase
      .from('yearly_analyses')
      .select('id, status')
      .eq('user_id', userId)
      .eq('target_year', data.targetYear);

    // 프로필 기반 분석이면 profile_id도 체크
    if (data.profileId) {
      existingAnalysisQuery = existingAnalysisQuery.eq('profile_id', data.profileId);
    } else {
      // 프로필 없이 온보딩 기반이면 profile_id가 null인 것만
      existingAnalysisQuery = existingAnalysisQuery.is('profile_id', null);
    }

    const { data: existingAnalysis } = await existingAnalysisQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 이미 완료된 분석이 있으면 결과 페이지로 안내
    if (existingAnalysis?.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: '이미 완료된 분석이 있습니다',
        analysisId: existingAnalysis.id,
        status: 'completed',
        redirectUrl: `/analysis/yearly/result/${existingAnalysis.id}`,
      });
    }

    // pending/in_progress 상태면 중복 생성 방지
    if (existingAnalysis?.status === 'pending' || existingAnalysis?.status === 'in_progress') {
      return NextResponse.json({
        success: true,
        message: '이미 분석이 진행 중입니다',
        analysisId: existingAnalysis.id,
        status: existingAnalysis.status,
        pollUrl: `/api/analysis/yearly/${existingAnalysis.id}`,
      });
    }

    // 4. 사주 정보 가져오기
    let pillars = data.pillars;
    let daewun = data.daewun;
    let gender: 'male' | 'female' = data.sajuInput?.gender || 'male';
    let birthYear: number | undefined;
    let profileId: string | undefined;
    const pythonApiUrl = getPythonApiUrl();

    // 프로필에서 정보 가져오기
    if (data.profileId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, gender, birth_date, birth_time, calendar_type')
        .eq('id', data.profileId)
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('[API] 프로필 조회 실패:', profileError);
        return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
          status: getStatusCode(API_ERRORS.NOT_FOUND),
        });
      }

      profileId = profile.id;
      gender = profile.gender as 'male' | 'female';
      birthYear = new Date(profile.birth_date).getFullYear();

      // 프로필에서 기존 리포트 조회
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
        // 만세력 API 호출
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

          // 422 에러: 사주 분석이 안 된 경우
          if (manseryeokRes.status === 422) {
            console.error('[API] 만세력 422 에러 - 사주 분석 필요');
            return NextResponse.json(
              {
                success: false,
                error: '기본 사주 분석 이후에 이용할 수 있는 서비스입니다.',
                errorCode: 'SAJU_REQUIRED',
              },
              { status: 400 }
            );
          }

          if (!manseryeokRes.ok) {
            throw new Error(`만세력 API 오류: ${manseryeokRes.status}`);
          }

          const manseryeokData = await manseryeokRes.json();
          pillars = manseryeokData.pillars;
          daewun = manseryeokData.daewun || [];
        } catch (manseryeokError) {
          console.error('[API] 만세력 계산 실패:', manseryeokError);
          return NextResponse.json(createErrorResponse(ANALYSIS_ERRORS.MANSERYEOK_ERROR), {
            status: getStatusCode(API_ERRORS.SERVER_ERROR),
          });
        }
      }
    } else if (data.existingAnalysisId) {
      const { data: existingAnalysis, error: analysisError } = await supabase
        .from('analyses')
        .select('pillars, daewun, gender, birth_datetime')
        .eq('id', data.existingAnalysisId)
        .eq('user_id', userId)
        .single();

      if (analysisError || !existingAnalysis) {
        return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
          status: getStatusCode(API_ERRORS.NOT_FOUND),
        });
      }

      pillars = existingAnalysis.pillars;
      daewun = existingAnalysis.daewun || [];
      gender = existingAnalysis.gender;
      birthYear = new Date(existingAnalysis.birth_datetime).getFullYear();
    } else if (data.sajuInput) {
      birthYear = new Date(data.sajuInput.birthDate).getFullYear();
      gender = data.sajuInput.gender;
    }

    if (!pillars) {
      return NextResponse.json(createErrorResponse(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING), {
        status: getStatusCode(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING),
      });
    }

    if (!birthYear) {
      birthYear = 1990;
    }

    // 5. 크레딧 먼저 차감 (실패 시 환불 가능)
    const newCredits = userData.credits - YEARLY_ANALYSIS_CREDIT_COST;
    await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // 6. Python API에 분석 작업 시작 요청
    console.log('[API] Python 백엔드에 신년 분석 요청');

    const pythonResponse = await fetch(`${pythonApiUrl}/api/analysis/yearly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_year: data.targetYear,
        language: data.language,
        pillars: pillars,
        daewun: daewun,
        birth_year: birthYear,
        gender: gender,
        user_id: userId,
        profile_id: profileId || null,
      }),
    });

    if (!pythonResponse.ok) {
      // 실패 시 크레딧 환불
      await supabase
        .from('users')
        .update({
          credits: userData.credits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error('[API] Python API 호출 실패:', errorData);
      return NextResponse.json(
        createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR, undefined, errorData.detail),
        { status: getStatusCode(API_ERRORS.EXTERNAL_SERVICE_ERROR) }
      );
    }

    const pythonResult = await pythonResponse.json();

    // 7. DB에 진행 중인 분석 레코드 생성
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('yearly_analyses')
      .insert({
        user_id: userId,
        target_year: data.targetYear,
        pillars: pillars,
        daewun: daewun,
        gender: gender,
        language: data.language,
        credits_used: YEARLY_ANALYSIS_CREDIT_COST,
        profile_id: profileId || null,
        job_id: pythonResult.job_id, // Python 작업 ID 저장
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !savedAnalysis) {
      console.error('[API] 분석 레코드 생성 실패:', insertError);
      // 크레딧 환불
      await supabase
        .from('users')
        .update({
          credits: userData.credits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return NextResponse.json(createErrorResponse(ANALYSIS_ERRORS.SAVE_FAILED), {
        status: getStatusCode(API_ERRORS.SERVER_ERROR),
      });
    }

    console.log('[API] 신년 분석 시작됨', {
      userId,
      analysisId: savedAnalysis.id,
      jobId: pythonResult.job_id,
    });

    // 8. 즉시 응답 반환 (폴링용 정보 포함)
    return NextResponse.json({
      success: true,
      message: '분석이 시작되었습니다',
      analysisId: savedAnalysis.id,
      jobId: pythonResult.job_id,
      status: 'pending',
      pollUrl: `/api/analysis/yearly/${savedAnalysis.id}`,
    });
  } catch (error) {
    console.error('[API] /api/analysis/yearly 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/**
 * API 라우트 설정
 * 10초면 충분 (Python 백엔드에 작업 위임 후 즉시 반환)
 */
export const maxDuration = 10;
export const dynamic = 'force-dynamic';
