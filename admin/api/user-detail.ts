/**
 * 유저 상세 조회 API 핸들러
 *
 * GET /api/admin/users/[id]?tab={tab}&page={page}&limit={limit}
 * 유저 상세 정보 + 결제/크레딧/AI 사용 기록 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/admin/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { ADMIN_ERRORS, API_ERRORS } from '@/lib/errors/codes';

/** 탭 타입 */
export type AdminTab = 'purchases' | 'credits' | 'ai_usage';

/** 유저 상세 정보 */
export interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  created_at: string;
  updated_at: string | null;
  subscription_status: string | null;
  subscription_id: string | null;
  first_free_used: boolean | null;
  daily_fortune_trial_started_at: string | null;
}

/** 페이지네이션 정보 */
export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

/** 결제 기록 */
export interface PurchaseRecord {
  id: string;
  package_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_session_id: string | null;
  created_at: string;
}

/** 크레딧 기록 */
export interface CreditRecord {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  remaining: number;
  expires_at: string | null;
  service_type: string | null;
  description: string | null;
  created_at: string;
}

/** AI 사용 기록 */
export interface AIUsageRecord {
  id: string;
  feature_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number | null;
  credits_used: number;
  cost_usd: number | null;
  profile_id: string | null;
  created_at: string;
}

export interface UserDetailResponse {
  user: UserDetail;
  records: PurchaseRecord[] | CreditRecord[] | AIUsageRecord[];
  pagination: Pagination;
}

export interface UserDetailErrorResponse {
  code: string;
}

/**
 * 유저 상세 조회 핸들러
 */
export async function handleUserDetail(
  request: NextRequest,
  userId: string
): Promise<NextResponse<UserDetailResponse | UserDetailErrorResponse>> {
  // 1. 관리자 권한 확인
  const { isAdmin } = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ code: ADMIN_ERRORS.NOT_ADMIN }, { status: 403 });
  }

  // 2. 쿼리 파라미터 파싱
  const searchParams = request.nextUrl.searchParams;
  const tab = (searchParams.get('tab') || 'purchases') as AdminTab;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  try {
    // 3. 유저 기본 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ code: ADMIN_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    // 4. 탭별 데이터 조회
    let records: PurchaseRecord[] | CreditRecord[] | AIUsageRecord[] = [];
    let totalCount = 0;

    if (tab === 'purchases') {
      const { data, count, error } = await supabase
        .from('purchases')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[Admin] 결제 기록 조회 오류:', error);
      }
      records = (data as PurchaseRecord[]) || [];
      totalCount = count || 0;
    } else if (tab === 'credits') {
      const { data, count, error } = await supabase
        .from('credit_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[Admin] 크레딧 기록 조회 오류:', error);
      }
      records = (data as CreditRecord[]) || [];
      totalCount = count || 0;
    } else if (tab === 'ai_usage') {
      const { data, count, error } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[Admin] AI 사용 기록 조회 오류:', error);
      }
      records = (data as AIUsageRecord[]) || [];
      totalCount = count || 0;
    }

    return NextResponse.json({
      user: user as UserDetail,
      records,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Admin] 유저 상세 조회 예외:', error);
    return NextResponse.json({ code: API_ERRORS.SERVER_ERROR }, { status: 500 });
  }
}
