/**
 * 사용자 프로필 조회 API
 * GET /api/user/profile
 *
 * 인증된 사용자의 프로필 정보를 반환합니다.
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
      .from('users')
      .select('id, email, name, credits, created_at')
      .eq('id', session.user.id)
      .single();

    if (error || !data) {
      console.error('사용자 조회 실패:', error);
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      credits: data.credits,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
