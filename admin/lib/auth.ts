/**
 * 관리자 권한 인증 유틸리티
 *
 * 환경변수 ADMIN_EMAILS에 등록된 이메일만 관리자 권한 부여
 * 예: ADMIN_EMAILS=swhoho@gmail.com,admin2@example.com
 */
import { getAuthenticatedUser } from '@/lib/supabase/server';

/** 관리자 이메일 목록 (환경변수에서 로드) */
const getAdminEmails = (): string[] => {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

/** 관리자 인증 결과 */
interface AdminAuthResult {
  /** 관리자 여부 */
  isAdmin: boolean;
  /** 인증된 사용자 정보 */
  user: {
    id: string;
    email: string;
  } | null;
}

/**
 * 현재 사용자의 관리자 권한 확인
 *
 * @example
 * const { isAdmin, user } = await checkAdminAuth();
 * if (!isAdmin) {
 *   return NextResponse.json({ code: 'ADMIN_NOT_ADMIN' }, { status: 403 });
 * }
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  const user = await getAuthenticatedUser();

  if (!user || !user.email) {
    return { isAdmin: false, user: null };
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(user.email.toLowerCase());

  return {
    isAdmin,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

/**
 * 이메일이 관리자 목록에 있는지 확인 (동기)
 *
 * @param email - 확인할 이메일
 * @returns 관리자 여부
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}
