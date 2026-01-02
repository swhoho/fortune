/**
 * Supabase 클라이언트 설정
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 클라이언트 사이드 Supabase 클라이언트
 * 브라우저에서 사용 (anon key 사용)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 서버 사이드 Supabase Admin 클라이언트
 * API 라우트, 서버 컴포넌트에서 사용 (RLS 우회)
 */
export const getSupabaseAdmin = () => {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
};
