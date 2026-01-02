/**
 * 분석 기록 조회 API
 * GET /api/analysis/list
 *
 * 인증된 사용자의 분석 기록을 날짜 내림차순으로 반환합니다.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('analyses')
      .select('id, type, focus_area, created_at, credits_used')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('분석 기록 조회 실패:', error);
      return NextResponse.json({ error: '분석 기록을 불러올 수 없습니다' }, { status: 500 });
    }

    return NextResponse.json({
      analyses: (data || []).map((a) => ({
        id: a.id,
        type: a.type,
        focusArea: a.focus_area,
        createdAt: a.created_at,
        creditsUsed: a.credits_used,
      })),
    });
  } catch (error) {
    console.error('분석 기록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
