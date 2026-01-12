/**
 * GET /api/user/credits/check
 * 사용자 크레딧 확인 API
 * Task 23: 크레딧 연동
 * v2.0: 만료 정보 추가 (credit_transactions 기반)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';
import { getExpiringCredits, getNearestExpiringCredits } from '@/lib/credits';

/**
 * 쿼리 파라미터 스키마
 */
const querySchema = z.object({
  required: z.coerce.number().min(0).optional(),
});

/**
 * GET /api/user/credits/check
 * 크레딧 잔액 확인 및 필요량 비교
 *
 * Query Params:
 * - required: 필요한 크레딧 양 (optional)
 *
 * Response:
 * - sufficient: 크레딧 충분 여부 (required 지정 시)
 * - current: 현재 보유 크레딧
 * - required: 필요 크레딧 (요청 시)
 * - remaining: 사용 후 남는 크레딧
 * - shortfall: 부족한 크레딧 (부족 시)
 * - expiringSoon: 30일 이내 만료 예정 크레딧 (v2.0)
 * - nearestExpiry: 가장 가까운 만료일 ISO 문자열 (v2.0)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      const error = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(error, { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) });
    }

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const queryResult = querySchema.safeParse({
      required: searchParams.get('required'),
    });

    const requiredCredits = queryResult.success ? queryResult.data.required : undefined;

    // 3. 사용자 크레딧 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[API] 사용자 조회 실패:', userError);
      const error = createErrorResponse(PROFILE_ERRORS.NOT_FOUND);
      return NextResponse.json(error, { status: getStatusCode(PROFILE_ERRORS.NOT_FOUND) });
    }

    const currentCredits = userData.credits ?? 0;

    // 4. 만료 예정 크레딧 조회 (30일 이내)
    const expiringInfo = await getExpiringCredits(userId, 30, supabase);

    // 5. 가장 가까운 만료 크레딧 조회 (기간 제한 없음)
    const nearestExpiring = await getNearestExpiringCredits(userId, supabase);

    // 6. 필요 크레딧이 지정된 경우 충분 여부 계산
    if (requiredCredits !== undefined) {
      const sufficient = currentCredits >= requiredCredits;
      const remaining = currentCredits - requiredCredits;
      const shortfall = sufficient ? 0 : requiredCredits - currentCredits;

      return NextResponse.json({
        sufficient,
        current: currentCredits,
        required: requiredCredits,
        remaining: sufficient ? remaining : 0,
        shortfall,
        expiringSoon: expiringInfo.total,
        nearestExpiry: nearestExpiring.expiresAt,
        nearestExpiryAmount: nearestExpiring.amount,
      });
    }

    // 7. 필요 크레딧 미지정 시 현재 잔액 + 만료 정보 반환
    return NextResponse.json({
      current: currentCredits,
      expiringSoon: expiringInfo.total,
      nearestExpiry: nearestExpiring.expiresAt,
      nearestExpiryAmount: nearestExpiring.amount,
    });
  } catch (error) {
    console.error('[API] /api/user/credits/check 에러:', error);
    const errorResponse = createErrorResponse(API_ERRORS.SERVER_ERROR);
    return NextResponse.json(errorResponse, { status: getStatusCode(API_ERRORS.SERVER_ERROR) });
  }
}

export const dynamic = 'force-dynamic';
