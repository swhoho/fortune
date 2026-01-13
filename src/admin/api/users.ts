/**
 * 유저 검색 API 핸들러
 *
 * GET /api/admin/users?q={검색어}
 * user_id 완전 일치 또는 email 부분 일치로 검색
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/admin/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { ADMIN_ERRORS, API_ERRORS } from '@/lib/errors/codes';

/** 검색 결과 유저 정보 */
export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  created_at: string;
  subscription_status: string | null;
}

export interface UsersSearchResponse {
  users: UserSearchResult[];
}

export interface UsersSearchErrorResponse {
  code: string;
}

/**
 * 유저 검색 핸들러
 */
export async function handleUsersSearch(
  request: NextRequest
): Promise<NextResponse<UsersSearchResponse | UsersSearchErrorResponse>> {
  // 1. 관리자 권한 확인
  const { isAdmin } = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ code: ADMIN_ERRORS.NOT_ADMIN }, { status: 403 });
  }

  // 2. 검색어 파싱
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // 3. Supabase Admin으로 검색
  const supabase = getSupabaseAdmin();

  try {
    // UUID 형식인지 확인 (user_id 검색)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

    let query = supabase
      .from('users')
      .select('id, email, name, credits, created_at, subscription_status');

    if (isUUID) {
      // UUID인 경우 id 완전 일치
      query = query.eq('id', q);
    } else {
      // 이메일 부분 일치
      query = query.ilike('email', `%${q}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('[Admin] 유저 검색 오류:', error);
      return NextResponse.json({ code: API_ERRORS.SERVER_ERROR }, { status: 500 });
    }

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error('[Admin] 유저 검색 예외:', error);
    return NextResponse.json({ code: API_ERRORS.SERVER_ERROR }, { status: 500 });
  }
}
