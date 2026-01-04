/**
 * GET /api/user/credits/check
 * 사용자 크레딧 확인 API
 * Task 23: 크레딧 연동
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';

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
 * - sufficient: 크레딧 충분 여부
 * - current: 현재 보유 크레딧
 * - required: 필요 크레딧 (요청 시)
 * - remaining: 사용 후 남는 크레딧
 * - shortfall: 부족한 크레딧 (부족 시)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = getSupabaseAdmin();

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const queryResult = querySchema.safeParse({
      required: searchParams.get('required'),
    });

    const requiredCredits = queryResult.success ? queryResult.data.required : undefined;

    // 3. 사용자 크레딧 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[API] 사용자 조회 실패:', userError);
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const currentCredits = user.credits ?? 0;

    // 4. 필요 크레딧이 지정된 경우 충분 여부 계산
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
      });
    }

    // 5. 필요 크레딧 미지정 시 현재 잔액만 반환
    return NextResponse.json({
      current: currentCredits,
    });
  } catch (error) {
    console.error('[API] /api/user/credits/check 에러:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
