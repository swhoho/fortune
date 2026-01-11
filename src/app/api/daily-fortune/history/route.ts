/**
 * GET /api/daily-fortune/history
 * 오늘의 운세 히스토리 조회 API (최대 1년)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/daily-fortune/history
 * 운세 히스토리 조회 (최대 1년, limit/offset 지원)
 *
 * Query params:
 * - limit: number (default: 30, max: 365)
 * - offset: number (default: 0)
 * - month: string (optional, YYYY-MM 형식으로 특정 월 조회)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 365);
    const offset = parseInt(searchParams.get('offset') || '0');
    const month = searchParams.get('month'); // YYYY-MM 형식

    // 3. 대표 프로필 조회
    const { data: primaryProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    if (!primaryProfile) {
      return NextResponse.json({
        success: false,
        error: 'NO_PRIMARY_PROFILE',
        message: '대표 프로필이 없습니다.',
      }, { status: 400 });
    }

    // 4. 1년 전 날짜 계산
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    // 5. 히스토리 조회
    let query = supabase
      .from('daily_fortunes')
      .select('*', { count: 'exact' })
      .eq('profile_id', primaryProfile.id)
      .gte('fortune_date', oneYearAgoStr)
      .order('fortune_date', { ascending: false });

    // 특정 월 필터
    if (month) {
      const parts = month.split('-');
      const year = parts[0] || '';
      const monthNum = parts[1] || '';
      if (year && monthNum) {
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
          .toISOString()
          .split('T')[0];
        query = query.gte('fortune_date', startDate).lte('fortune_date', endDate);
      }
    }

    const { data: fortunes, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[DailyFortune] 히스토리 조회 오류:', error);
      return NextResponse.json({ error: '히스토리 조회에 실패했습니다' }, { status: 500 });
    }

    // 6. 통계 계산
    const stats = {
      totalCount: count || 0,
      averageScore:
        fortunes && fortunes.length > 0
          ? Math.round(
              fortunes.reduce((sum, f) => sum + (f.overall_score || 0), 0) / fortunes.length
            )
          : 0,
      highestScore: fortunes && fortunes.length > 0 ? Math.max(...fortunes.map((f) => f.overall_score || 0)) : 0,
      lowestScore: fortunes && fortunes.length > 0 ? Math.min(...fortunes.map((f) => f.overall_score || 0)) : 0,
    };

    return NextResponse.json({
      success: true,
      data: fortunes || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      stats,
    });
  } catch (error) {
    console.error('[DailyFortune] History GET 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
