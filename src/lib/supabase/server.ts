import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Component용 Supabase 클라이언트 생성
 * 쿠키를 사용하여 세션을 관리하며, 서버 컴포넌트에서 데이터 페칭 등에 사용됩니다.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component에서는 쿠키를 설정할 수 없습니다.
            // 미들웨어에서 쿠키 리프레시를 처리하므로 여기서는 무시해도 됩니다.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component에서는 쿠키를 삭제할 수 없습니다.
          }
        },
      },
    }
  );
}
