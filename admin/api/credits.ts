/**
 * 크레딧 보상 지급 API 핸들러
 *
 * POST /api/admin/credits
 * 특정 유저에게 보너스 크레딧 지급 (만료일 설정 가능)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAdminAuth } from '@/admin/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { addCredits } from '@/lib/credits/add';
import { ADMIN_ERRORS, VALIDATION_ERRORS } from '@/lib/errors/codes';

/** 크레딧 지급 요청 스키마 */
const grantCreditsSchema = z.object({
  userId: z.string().min(1, '유저 ID 필수'),
  amount: z.number().min(1, '최소 1 크레딧').max(10000, '최대 10000 크레딧'),
  expiresInMonths: z.number().min(1).max(36).optional().default(24),
  description: z.string().max(200).optional(),
});

export type GrantCreditsRequest = z.infer<typeof grantCreditsSchema>;

export interface GrantCreditsResponse {
  success: boolean;
  newBalance: number;
  grantedTo: string;
  amount: number;
  expiresInMonths: number;
}

export interface GrantCreditsErrorResponse {
  code: string;
  details?: string;
}

/**
 * 크레딧 보상 지급 핸들러
 */
export async function handleGrantCredits(
  request: NextRequest
): Promise<NextResponse<GrantCreditsResponse | GrantCreditsErrorResponse>> {
  // 1. 관리자 권한 확인
  const { isAdmin, user: adminUser } = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ code: ADMIN_ERRORS.NOT_ADMIN }, { status: 403 });
  }

  // 2. 요청 바디 파싱 및 검증
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: VALIDATION_ERRORS.INVALID_INPUT, details: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const result = grantCreditsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        code: VALIDATION_ERRORS.INVALID_INPUT,
        details: result.error.issues[0]?.message,
      },
      { status: 400 }
    );
  }

  const { userId, amount, expiresInMonths, description } = result.data;

  const supabase = getSupabaseAdmin();

  try {
    // 3. 대상 유저 존재 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ code: ADMIN_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    // 4. 크레딧 지급
    const addResult = await addCredits({
      userId,
      amount,
      type: 'bonus',
      expiresInMonths,
      description: description || `관리자 보상 (by ${adminUser?.email})`,
      supabase,
    });

    if (!addResult.success) {
      console.error('[Admin] 크레딧 지급 실패:', userId, amount);
      return NextResponse.json({ code: ADMIN_ERRORS.CREDIT_GRANT_FAILED }, { status: 500 });
    }

    // 5. 로그 기록
    console.log(
      `[Admin] Credit bonus: ${adminUser?.email} -> ${targetUser.email} +${amount}C (expires: ${expiresInMonths}M)`
    );

    return NextResponse.json({
      success: true,
      newBalance: addResult.newBalance,
      grantedTo: targetUser.email,
      amount,
      expiresInMonths,
    });
  } catch (error) {
    console.error('[Admin] 크레딧 지급 예외:', error);
    return NextResponse.json({ code: ADMIN_ERRORS.CREDIT_GRANT_FAILED }, { status: 500 });
  }
}
