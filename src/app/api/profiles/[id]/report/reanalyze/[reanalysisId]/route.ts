/**
 * GET /api/profiles/:id/report/reanalyze/:reanalysisId
 * 섹션 재분석 상태 폴링 엔드포인트
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/profiles/:id/report/reanalyze/:reanalysisId
 * 특정 재분석 작업의 상태 및 결과 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reanalysisId: string }> }
) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: profileId, reanalysisId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 3. 재분석 로그 조회
    const { data: reanalysis, error: reanalysisError } = await supabase
      .from('reanalysis_logs')
      .select('id, section_type, status, result, error_message, created_at')
      .eq('id', reanalysisId)
      .eq('profile_id', profileId)
      .single();

    if (reanalysisError || !reanalysis) {
      return NextResponse.json(
        { error: '재분석 작업을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. 완료 시 리포트에서 최신 섹션 데이터 가져오기
    let sectionResult = null;
    if (reanalysis.status === 'completed') {
      // 재분석 결과가 있으면 사용, 없으면 리포트에서 조회
      if (reanalysis.result) {
        sectionResult = reanalysis.result;
      } else {
        const { data: report } = await supabase
          .from('profile_reports')
          .select('analysis')
          .eq('profile_id', profileId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (report?.analysis) {
          const analysis = report.analysis as Record<string, unknown>;
          sectionResult = analysis[reanalysis.section_type] || null;
        }
      }
    }

    // 5. 상태에 따른 응답
    return NextResponse.json({
      success: true,
      data: {
        reanalysisId: reanalysis.id,
        sectionType: reanalysis.section_type,
        status: reanalysis.status, // processing | completed | failed
        result: reanalysis.status === 'completed' ? sectionResult : null,
        error: reanalysis.status === 'failed' ? reanalysis.error_message : null,
        createdAt: reanalysis.created_at,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/:id/report/reanalyze/:reanalysisId 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
