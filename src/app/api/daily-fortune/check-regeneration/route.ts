/**
 * GET /api/daily-fortune/check-regeneration
 * 오늘의 운세 재생성 가능 여부 확인 API
 * 대표 프로필 변경 전 확인용
 */
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 오늘 날짜 운세 확인
    const today = new Date().toISOString().split('T')[0];
    const { data: fortune } = await supabase
      .from('daily_fortunes')
      .select('id, profile_id, regenerated_at')
      .eq('user_id', user.id)
      .eq('fortune_date', today)
      .single();

    // 3. 운세가 없으면 재생성 체크 불필요
    if (!fortune) {
      return NextResponse.json({
        hasTodayFortune: false,
        canRegenerate: false,
        fortuneProfileId: null,
      });
    }

    // 4. 재생성 가능 여부 확인
    const canRegenerate = fortune.regenerated_at === null;

    return NextResponse.json({
      hasTodayFortune: true,
      canRegenerate,
      fortuneProfileId: fortune.profile_id,
    });
  } catch (error) {
    console.error('[CheckRegeneration] 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
