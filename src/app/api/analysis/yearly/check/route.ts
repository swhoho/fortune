/**
 * GET /api/analysis/yearly/check
 * 프로필+연도 조합의 기존 신년 분석 존재 여부 확인 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  AUTH_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

// 쿠키 사용으로 인해 동적 렌더링 강제
export const dynamic = 'force-dynamic';

/**
 * 기존 분석 조회 응답 타입
 */
interface CheckResponse {
  exists: boolean;
  analysisId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * GET /api/analysis/yearly/check?profileId=xxx&year=2026
 * 기존 신년 분석 존재 여부 확인
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    // 2. Query 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const yearParam = searchParams.get('year');

    // 3. 검증
    if (!profileId) {
      return NextResponse.json(
        createErrorResponse(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING, { field: 'profileId' }),
        { status: getStatusCode(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING) }
      );
    }

    if (!yearParam) {
      return NextResponse.json(
        createErrorResponse(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING, { field: 'year' }),
        { status: getStatusCode(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING) }
      );
    }

    const year = parseInt(yearParam, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        createErrorResponse(VALIDATION_ERRORS.OUT_OF_RANGE, { field: 'year' }),
        { status: getStatusCode(VALIDATION_ERRORS.OUT_OF_RANGE) }
      );
    }

    // 4. DB 조회 (가장 최근 분석 1개)
    const supabase = getSupabaseAdmin();
    const { data: existingAnalysis, error: queryError } = await supabase
      .from('yearly_analyses')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .eq('target_year', year)
      .in('status', ['pending', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('[yearly/check] DB 조회 오류:', queryError);
      return NextResponse.json({ exists: false } as CheckResponse, { status: 200 });
    }

    // 5. 응답 반환
    if (existingAnalysis) {
      return NextResponse.json({
        exists: true,
        analysisId: existingAnalysis.id,
        status: existingAnalysis.status,
      } as CheckResponse);
    }

    return NextResponse.json({ exists: false } as CheckResponse);
  } catch (error) {
    console.error('[yearly/check] 예외 발생:', error);
    return NextResponse.json({ exists: false } as CheckResponse, { status: 200 });
  }
}
