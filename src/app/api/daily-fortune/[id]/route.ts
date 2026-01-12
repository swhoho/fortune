/**
 * GET /api/daily-fortune/[id]
 * 오늘의 운세 상세 조회 (공유 URL용 - 인증 불필요)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // fortuneId로 운세 조회 (프로필 정보 포함)
    const { data: fortune, error } = await supabase
      .from('daily_fortunes')
      .select(
        `
        *,
        profiles (
          id,
          name,
          gender,
          birth_date
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !fortune) {
      console.error('[DailyFortune] 조회 오류:', error);
      return NextResponse.json({ error: '운세를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: fortune,
      profile: fortune.profiles,
    });
  } catch (error) {
    console.error('[DailyFortune] GET 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
