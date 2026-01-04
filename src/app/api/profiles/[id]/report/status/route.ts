/**
 * GET /api/profiles/[id]/report/status
 * Task 22: 리포트 생성 상태 폴링 API
 *
 * 5초마다 클라이언트에서 호출하여 진행 상황 확인
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/profiles/[id]/report/status
 * 현재 리포트 생성 상태 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const userId = session.user.id;
    const supabase = getSupabaseAdmin();

    // 1. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 2. 가장 최근 리포트 상태 조회
    const { data: report, error: reportError } = await supabase
      .from('profile_reports')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError) {
      console.error('[API] 리포트 상태 조회 실패:', reportError);
      return NextResponse.json({ error: '상태 조회에 실패했습니다' }, { status: 500 });
    }

    // 리포트가 없는 경우
    if (!report) {
      return NextResponse.json({ error: '진행 중인 리포트가 없습니다' }, { status: 404 });
    }

    // 3. 상태 응답
    return NextResponse.json({
      status: report.status,
      currentStep: report.current_step,
      progressPercent: report.progress_percent || 0,
      stepStatuses: report.step_statuses || {},
      estimatedTimeRemaining: report.estimated_time_remaining || 0,
      error: report.error || null,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/[id]/report/status 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
