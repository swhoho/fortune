/**
 * 관리자 권한 확인 API 핸들러
 *
 * GET /api/admin/check
 * 현재 사용자의 관리자 권한 확인
 */
import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/admin/lib/auth';

export interface AdminCheckResponse {
  isAdmin: boolean;
  email?: string;
}

/**
 * 관리자 권한 확인 핸들러
 */
export async function handleAdminCheck(): Promise<NextResponse<AdminCheckResponse>> {
  const { isAdmin, user } = await checkAdminAuth();

  if (!isAdmin) {
    return NextResponse.json({ isAdmin: false }, { status: 403 });
  }

  return NextResponse.json({
    isAdmin: true,
    email: user?.email,
  });
}
