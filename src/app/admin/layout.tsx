/**
 * 관리자 레이아웃
 * 서버 컴포넌트에서 권한 체크 후 비관리자는 홈으로 리다이렉트
 */
import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/admin/lib/auth';

/** 항상 동적 렌더링 */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;

  try {
    const result = await checkAdminAuth();
    isAdmin = result.isAdmin;
  } catch (error) {
    console.error('[Admin] Auth check error:', error);
  }

  if (!isAdmin) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 관리자 배너 */}
      <div className="border-b border-[#333] bg-[#111]">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <p className="text-center text-xs text-orange-400">
            ⚠️ 관리자 전용 페이지입니다. 모든 작업이 기록됩니다.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
