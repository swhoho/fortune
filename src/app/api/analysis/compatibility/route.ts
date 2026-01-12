/**
 * POST /api/analysis/compatibility
 * 궁합 분석 시작 API (폴링 방식)
 * Python Railway 백엔드에서 분석 실행
 * 크레딧 FIFO 차감
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
import { deductCredits, refundCredits } from '@/lib/credits';
import { isValidPillars } from '@/lib/validation/pillars';

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

    // 3. 프로필 조회 (두 프로필 모두 사용자 소유인지 확인)
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

    // 3.5 각 프로필의 기존 리포트(만세력) 확인
    const { data: reportA } = await supabase
      .from('profile_reports')
      .select('pillars')
      .eq('profile_id', profileA.id)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    const { data: reportB } = await supabase
      .from('profile_reports')
      .select('pillars')
      .eq('profile_id', profileB.id)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    // 만세력 데이터 유효성 검사 (구조 검증 강화)
    const missingReports: string[] = [];
    if (!isValidPillars(reportA?.pillars)) missingReports.push(profileA.name);
    if (!isValidPillars(reportB?.pillars)) missingReports.push(profileB.name);

    if (missingReports.length > 0) {
      console.log('[API] SAJU_REQUIRED:', {
        profileA: profileA.name,
        profileB: profileB.name,
        pillarsA: !!reportA?.pillars,
        pillarsB: !!reportB?.pillars,
        validA: isValidPillars(reportA?.pillars),
        validB: isValidPillars(reportB?.pillars),
      });
      return NextResponse.json(
        {
          success: false,
          error: `${missingReports.join(', ')}의 기본 사주 분석을 먼저 완료해주세요.`,
          errorCode: 'SAJU_REQUIRED',
          missingProfiles: missingReports,
        },
        { status: 400 }
      );
    }

    // 4. 기존 분석 확인 (동일 조합의 완료/진행중/실패 분석)
    const { data: existingAnalysis } = await supabase
      .from('compatibility_analyses')
      .select('id, status, credits_used')
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

    // 5. 크레딧 무료 재시도 조건 확인
    // 이미 크레딧을 사용한 failed 분석은 무료로 재시도
    const isRetryWithCredits =
      existingAnalysis && existingAnalysis.credits_used > 0 && existingAnalysis.status === 'failed';

    const shouldDeductCredits = !isRetryWithCredits;

    // 6. 사용자 크레딧 확인
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

    // 7. 크레딧 차감 (신규 생성인 경우에만, FIFO)
    let creditsDeducted = false;
    if (shouldDeductCredits) {
      const deductResult = await deductCredits({
        userId,
        amount: COMPATIBILITY_ANALYSIS_CREDIT_COST,
        serviceType: 'compatibility',
        description: '궁합 분석',
        supabase,
      });

      if (!deductResult.success) {
        if (deductResult.error === 'INSUFFICIENT_CREDITS') {
          return NextResponse.json(
            createErrorResponse(CREDIT_ERRORS.INSUFFICIENT, {
              required: COMPATIBILITY_ANALYSIS_CREDIT_COST,
              current: deductResult.newCredits,
            }),
            { status: getStatusCode(CREDIT_ERRORS.INSUFFICIENT) }
          );
        }
        return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
          status: getStatusCode(API_ERRORS.SERVER_ERROR),
        });
      }
      creditsDeducted = true;

      // 크레딧 사용 기록 (ai_usage_logs) - 레거시 호환
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        feature_type: 'compatibility_analysis',
        credits_used: COMPATIBILITY_ANALYSIS_CREDIT_COST,
        profile_id: data.profileIdA, // 첫 번째 프로필 기준
        input_tokens: 0,
        output_tokens: 0,
        metadata: {
          profile_id_b: data.profileIdB,
          analysis_type: data.analysisType,
        },
      });
    } else {
      console.log(`[API] 궁합 분석 무료 재시도: ${existingAnalysis?.id}`);
    }

    // 8. DB에 분석 레코드 생성 또는 업데이트
    let analysisId: string;

    if (existingAnalysis && existingAnalysis.status === 'failed') {
      // 재시도: 기존 레코드 상태 업데이트
      analysisId = existingAnalysis.id;
      await supabase
        .from('compatibility_analyses')
        .update({
          status: 'pending',
          progress_percent: 0,
          failed_steps: [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      console.log(`[API] 궁합 분석 재시도 (무료): ${analysisId}`);
    } else {
      // 신규 생성
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
        if (creditsDeducted) {
          await refundCredits({
            userId,
            amount: COMPATIBILITY_ANALYSIS_CREDIT_COST,
            serviceType: 'compatibility',
            description: '분석 레코드 생성 실패 환불',
            supabase,
          });
        }

        return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
          status: getStatusCode(API_ERRORS.SERVER_ERROR),
        });
      }

      analysisId = savedAnalysis.id;
    }

    // 9. Python API에 분석 작업 시작 요청
    const pythonApiUrl = getPythonApiUrl();
    console.log('[API] Python 백엔드에 궁합 분석 요청');

    const pythonResponse = await fetch(`${pythonApiUrl}/api/analysis/compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
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
      // Python 호출 실패 시 크레딧 환불 (신규 생성인 경우만) 및 상태 업데이트
      if (creditsDeducted) {
        await refundCredits({
          userId,
          amount: COMPATIBILITY_ANALYSIS_CREDIT_COST,
          serviceType: 'compatibility',
          description: 'Python API 호출 실패 환불',
          supabase,
        });
      }

      // 레코드 삭제 대신 failed 상태로 업데이트 (재시도 가능하도록)
      await supabase
        .from('compatibility_analyses')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error('[API] Python API 호출 실패:', errorData);
      return NextResponse.json(
        createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR, undefined, errorData.detail),
        { status: getStatusCode(API_ERRORS.EXTERNAL_SERVICE_ERROR) }
      );
    }

    const pythonResult = await pythonResponse.json();

    // 10. job_id 업데이트
    await supabase
      .from('compatibility_analyses')
      .update({
        job_id: pythonResult.job_id,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId);

    console.log('[API] 궁합 분석 시작됨', {
      userId,
      analysisId,
      jobId: pythonResult.job_id,
    });

    // 11. 즉시 응답 반환
    return NextResponse.json({
      success: true,
      message: '분석이 시작되었습니다',
      analysisId,
      jobId: pythonResult.job_id,
      status: 'processing',
      pollUrl: `/api/analysis/compatibility/${analysisId}`,
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
