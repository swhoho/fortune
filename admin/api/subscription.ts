/**
 * 구독 부여 API 핸들러
 *
 * POST /api/admin/subscription
 * 특정 유저에게 구독 권한 부여 (1~12개월 선택 가능)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAdminAuth } from '@/admin/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { ADMIN_ERRORS, VALIDATION_ERRORS } from '@/lib/errors/codes';

/** 구독 부여 요청 스키마 */
const grantSubscriptionSchema = z.object({
  userId: z.string().min(1, '유저 ID 필수'),
  months: z.number().min(1, '최소 1개월').max(12, '최대 12개월'),
  description: z.string().max(200).optional(),
});

export type GrantSubscriptionRequest = z.infer<typeof grantSubscriptionSchema>;

export interface GrantSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    periodStart: string;
    periodEnd: string;
  };
  grantedTo: string;
  months: number;
}

export interface GrantSubscriptionErrorResponse {
  code: string;
  details?: string;
}

/**
 * 구독 부여 핸들러
 */
export async function handleGrantSubscription(
  request: NextRequest
): Promise<NextResponse<GrantSubscriptionResponse | GrantSubscriptionErrorResponse>> {
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

  const result = grantSubscriptionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        code: VALIDATION_ERRORS.INVALID_INPUT,
        details: result.error.issues[0]?.message,
      },
      { status: 400 }
    );
  }

  const { userId, months, description } = result.data;

  const supabase = getSupabaseAdmin();

  try {
    // 3. 대상 유저 존재 확인
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_status, subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ code: ADMIN_ERRORS.USER_NOT_FOUND }, { status: 404 });
    }

    // 4. 기존 활성 구독 확인 및 기간 연장
    const now = new Date();
    let periodStart = now;
    let periodEnd = new Date(now);

    // 기존 활성 구독이 있으면 기간 연장
    if (targetUser.subscription_id) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id, status, current_period_end')
        .eq('id', targetUser.subscription_id)
        .eq('status', 'active')
        .single();

      if (existingSub && existingSub.current_period_end) {
        const existingEnd = new Date(existingSub.current_period_end);
        if (existingEnd > now) {
          // 기존 만료일부터 연장
          periodStart = existingEnd;
          periodEnd = new Date(existingEnd);
        }
      }
    }

    // 개월 수 추가
    periodEnd.setMonth(periodEnd.getMonth() + months);

    // 5. 구독 레코드 생성/업데이트
    let subscriptionId: string;

    if (targetUser.subscription_id) {
      // 기존 구독 업데이트
      const { data: updatedSub, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', targetUser.subscription_id)
        .select()
        .single();

      if (updateError || !updatedSub) {
        console.error('[Admin] 구독 업데이트 실패:', updateError);
        return NextResponse.json({ code: ADMIN_ERRORS.CREDIT_GRANT_FAILED }, { status: 500 });
      }
      subscriptionId = updatedSub.id;
    } else {
      // 새 구독 생성
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          price: 0, // 관리자 부여
        })
        .select()
        .single();

      if (createError || !newSub) {
        console.error('[Admin] 구독 생성 실패:', createError);
        return NextResponse.json({ code: ADMIN_ERRORS.CREDIT_GRANT_FAILED }, { status: 500 });
      }
      subscriptionId = newSub.id;
    }

    // 6. users 테이블 구독 상태 업데이트
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_id: subscriptionId,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    // 7. 로그 기록
    console.log(
      `[Admin] Subscription grant: ${adminUser?.email} -> ${targetUser.email} +${months}M`
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        status: 'active',
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
      grantedTo: targetUser.email,
      months,
    });
  } catch (error) {
    console.error('[Admin] 구독 부여 예외:', error);
    return NextResponse.json({ code: ADMIN_ERRORS.CREDIT_GRANT_FAILED }, { status: 500 });
  }
}
