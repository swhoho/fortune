/**
 * POST /api/analysis/compatibility
 * 궁합 분석 시작 API (폴링 방식)
 * Python Railway 백엔드에서 분석 실행
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';
import {
  AUTH_ERRORS,
  API_ERRORS,
  CREDIT_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

/** 궁합 분석 크레딧 비용 */
const COMPATIBILITY_ANALYSIS_CREDIT_COST = 70;

/**
 * 요청 검증 스키마
 */
const compatibilityRequestSchema = z.object({
  profileIdA: z.string().min(1, '첫 번째 프로필 ID가 필요합니다'),
  profileIdB: z.string().min(1, '두 번째 프로필 ID가 필요합니다'),
  analysisType: z.enum(['romance', 'friend']).optional().default('romance'),
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
 * POST /api/analysis/compatibility
 * 궁합 분석 시작 (즉시 반환, Python 백그라운드 실행)
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
    const validationResult = compatibilityRequestSchema.safeParse(body);

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

    // 2.5 동일 프로필 체크
    if (data.profileIdA === data.profileIdB) {
      return NextResponse.json(
        createErrorResponse(
          VALIDATION_ERRORS.REQUIRED_FIELD_MISSING,
          undefined,
          '서로 다른 두 프로필을 선택해주세요'
        ),
        { status: 400 }
      );
    }

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

    if (userData.credits < COMPATIBILITY_ANALYSIS_CREDIT_COST) {
      return NextResponse.json(
        createErrorResponse(CREDIT_ERRORS.INSUFFICIENT, {
          required: COMPATIBILITY_ANALYSIS_CREDIT_COST,
          current: userData.credits,
        }),
        { status: getStatusCode(CREDIT_ERRORS.INSUFFICIENT) }
      );
    }

    // 4. 프로필 조회 (두 프로필 모두 사용자 소유인지 확인)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, gender, birth_date, birth_time, calendar_type')
      .eq('user_id', userId)
      .in('id', [data.profileIdA, data.profileIdB]);

    if (profileError || !profiles || profiles.length !== 2) {
      console.error('[API] 프로필 조회 실패:', profileError);
      return NextResponse.json(
        createErrorResponse(API_ERRORS.NOT_FOUND, undefined, '프로필을 찾을 수 없습니다'),
        { status: getStatusCode(API_ERRORS.NOT_FOUND) }
      );
    }

    const profileA = profiles.find((p) => p.id === data.profileIdA);
    const profileB = profiles.find((p) => p.id === data.profileIdB);

    if (!profileA || !profileB) {
      return NextResponse.json(
        createErrorResponse(API_ERRORS.NOT_FOUND, undefined, '프로필을 찾을 수 없습니다'),
        { status: getStatusCode(API_ERRORS.NOT_FOUND) }
      );
    }

    // 5. 기존 분석 확인 (동일 조합의 완료/진행중 분석)
    const { data: existingAnalysis } = await supabase
      .from('compatibility_analyses')
      .select('id, status')
      .eq('user_id', userId)
      .eq('profile_id_a', data.profileIdA)
      .eq('profile_id_b', data.profileIdB)
      .eq('analysis_type', data.analysisType)
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
        redirectUrl: `/compatibility/romance/${existingAnalysis.id}`,
      });
    }

    // pending/processing 상태면 중복 생성 방지
    if (existingAnalysis?.status === 'pending' || existingAnalysis?.status === 'processing') {
      return NextResponse.json({
        success: true,
        message: '이미 분석이 진행 중입니다',
        analysisId: existingAnalysis.id,
        status: existingAnalysis.status,
        pollUrl: `/api/analysis/compatibility/${existingAnalysis.id}`,
      });
    }

    // 6. 크레딧 먼저 차감
    const newCredits = userData.credits - COMPATIBILITY_ANALYSIS_CREDIT_COST;
    await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // 7. DB에 분석 레코드 먼저 생성 (pending 상태)
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('compatibility_analyses')
      .insert({
        user_id: userId,
        profile_id_a: data.profileIdA,
        profile_id_b: data.profileIdB,
        analysis_type: data.analysisType,
        language: data.language,
        credits_used: COMPATIBILITY_ANALYSIS_CREDIT_COST,
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

      return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
        status: getStatusCode(API_ERRORS.SERVER_ERROR),
      });
    }

    // 8. Python API에 분석 작업 시작 요청
    const pythonApiUrl = getPythonApiUrl();
    console.log('[API] Python 백엔드에 궁합 분석 요청');

    const pythonResponse = await fetch(`${pythonApiUrl}/api/analysis/compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: savedAnalysis.id,
        profile_id_a: data.profileIdA,
        profile_id_b: data.profileIdB,
        profile_a: {
          id: profileA.id,
          name: profileA.name,
          gender: profileA.gender,
          birth_date: profileA.birth_date,
          birth_time: profileA.birth_time,
          calendar_type: profileA.calendar_type,
        },
        profile_b: {
          id: profileB.id,
          name: profileB.name,
          gender: profileB.gender,
          birth_date: profileB.birth_date,
          birth_time: profileB.birth_time,
          calendar_type: profileB.calendar_type,
        },
        analysis_type: data.analysisType,
        language: data.language,
        user_id: userId,
      }),
    });

    if (!pythonResponse.ok) {
      // Python 호출 실패 시 크레딧 환불 및 레코드 삭제
      await supabase
        .from('users')
        .update({
          credits: userData.credits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      await supabase.from('compatibility_analyses').delete().eq('id', savedAnalysis.id);

      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error('[API] Python API 호출 실패:', errorData);
      return NextResponse.json(
        createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR, undefined, errorData.detail),
        { status: getStatusCode(API_ERRORS.EXTERNAL_SERVICE_ERROR) }
      );
    }

    const pythonResult = await pythonResponse.json();

    // 9. job_id 업데이트
    await supabase
      .from('compatibility_analyses')
      .update({
        job_id: pythonResult.job_id,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', savedAnalysis.id);

    console.log('[API] 궁합 분석 시작됨', {
      userId,
      analysisId: savedAnalysis.id,
      jobId: pythonResult.job_id,
    });

    // 10. 즉시 응답 반환
    return NextResponse.json({
      success: true,
      message: '분석이 시작되었습니다',
      analysisId: savedAnalysis.id,
      jobId: pythonResult.job_id,
      status: 'processing',
      pollUrl: `/api/analysis/compatibility/${savedAnalysis.id}`,
    });
  } catch (error) {
    console.error('[API] /api/analysis/compatibility 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/** API 라우트 설정 */
export const maxDuration = 10;
export const dynamic = 'force-dynamic';
