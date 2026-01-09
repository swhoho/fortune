/**
 * GET /api/analysis/compatibility/check
 * 기존 궁합 분석 존재 여부 확인 API
 * 프로필 선택 페이지에서 크레딧 차감 여부 표시용
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { AUTH_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

/**
 * GET /api/analysis/compatibility/check?profileIdA=xxx&profileIdB=yyy&analysisType=romance
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

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const profileIdA = searchParams.get('profileIdA');
    const profileIdB = searchParams.get('profileIdB');
    const analysisType = searchParams.get('analysisType') || 'romance';

    if (!profileIdA || !profileIdB) {
      return NextResponse.json({
        exists: false,
        message: '프로필 ID가 필요합니다',
      });
    }

    // 3. 기존 분석 확인 (동일 조합)
    const { data: existingAnalysis } = await supabase
      .from('compatibility_analyses')
      .select('id, status, credits_used, created_at')
      .eq('user_id', userId)
      .eq('profile_id_a', profileIdA)
      .eq('profile_id_b', profileIdB)
      .eq('analysis_type', analysisType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. 분석 없음
    if (!existingAnalysis) {
      return NextResponse.json({
        exists: false,
        isFreeRetry: false,
        status: null,
        analysisId: null,
      });
    }

    // 5. 완료된 분석
    if (existingAnalysis.status === 'completed') {
      return NextResponse.json({
        exists: true,
        isFreeRetry: false,
        isCompleted: true,
        status: 'completed',
        analysisId: existingAnalysis.id,
        message: '이미 완료된 분석이 있습니다',
      });
    }

    // 6. 진행 중인 분석
    if (existingAnalysis.status === 'pending' || existingAnalysis.status === 'processing') {
      return NextResponse.json({
        exists: true,
        isFreeRetry: false,
        isProcessing: true,
        status: existingAnalysis.status,
        analysisId: existingAnalysis.id,
        message: '이미 분석이 진행 중입니다',
      });
    }

    // 7. 실패한 분석 (크레딧 사용한 경우 무료 재시도)
    if (existingAnalysis.status === 'failed') {
      const isFreeRetry = existingAnalysis.credits_used > 0;
      return NextResponse.json({
        exists: true,
        isFreeRetry,
        status: 'failed',
        analysisId: existingAnalysis.id,
        message: isFreeRetry ? '무료로 재시도할 수 있습니다' : null,
      });
    }

    // 8. 기타 상태
    return NextResponse.json({
      exists: true,
      isFreeRetry: false,
      status: existingAnalysis.status,
      analysisId: existingAnalysis.id,
    });
  } catch (error) {
    console.error('[API] /api/analysis/compatibility/check 에러:', error);
    return NextResponse.json({
      exists: false,
      isFreeRetry: false,
      error: '확인 중 오류가 발생했습니다',
    });
  }
}

export const dynamic = 'force-dynamic';
