/**
 * PortOne 결제 검증 API
 * POST /api/payment/portone/verify
 *
 * 결제 완료 후 클라이언트에서 호출하여 결제 검증 및 크레딧 지급
 * credit_transactions 테이블에 기록 (2년 만료)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPackageById, verifyPaymentWithPortOne } from '@/lib/portone';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import {
  AUTH_ERRORS,
  PAYMENT_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';
import { addCredits } from '@/lib/credits';

interface VerifyPaymentRequest {
  paymentId: string;
  packageId: string;
  expectedAmount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyPaymentRequest;
    const { paymentId, packageId, expectedAmount } = body;

    // 1. 사용자 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      const errorResponse = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
    }

    // 2. 패키지 검증
    const selectedPackage = getPackageById(packageId);
    if (!selectedPackage) {
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.INVALID_PACKAGE);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.INVALID_PACKAGE) }
      );
    }

    // 3. 금액 검증 (클라이언트 전송 금액 vs 패키지 금액)
    if (expectedAmount !== selectedPackage.price) {
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.AMOUNT_MISMATCH);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.AMOUNT_MISMATCH) }
      );
    }

    // 4. 포트원 API로 결제 정보 조회
    const payment = await verifyPaymentWithPortOne(paymentId);
    if (!payment) {
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.INFO_FETCH_FAILED);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.INFO_FETCH_FAILED) }
      );
    }

    // 5. 결제 상태 확인
    if (payment.status !== 'PAID') {
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.NOT_COMPLETED, {
        status: payment.status,
      });
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.NOT_COMPLETED) }
      );
    }

    // 6. 결제 금액 검증 (포트원 응답 금액 vs 패키지 금액)
    if (payment.amount.total !== selectedPackage.price) {
      console.error(
        `Amount mismatch: expected ${selectedPackage.price}, got ${payment.amount.total}`
      );
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.AMOUNT_MISMATCH);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.AMOUNT_MISMATCH) }
      );
    }

    const supabase = getSupabaseAdmin();

    // 7. 중복 결제 확인 (stripe_session_id 컬럼 재사용)
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', paymentId)
      .single();

    if (existingPurchase) {
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.ALREADY_PROCESSED);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.ALREADY_PROCESSED) }
      );
    }

    const creditsToAdd = selectedPackage.credits + (selectedPackage.bonus || 0);

    // 8. Purchase 레코드 생성 (stripe_session_id에 포트원 paymentId 저장)
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        amount: selectedPackage.price,
        credits: creditsToAdd,
        stripe_session_id: paymentId, // 포트원 payment_id 저장
        status: 'completed',
      })
      .select('id')
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.RECORD_CREATE_FAILED);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.RECORD_CREATE_FAILED) }
      );
    }

    // 9. credit_transactions 기록 + users.credits 동기화 (2년 만료)
    const { success: addSuccess, newBalance } = await addCredits({
      userId: user.id,
      amount: creditsToAdd,
      type: 'purchase',
      purchaseId: purchase.id,
      expiresInMonths: 24, // 2년
      description: `${packageId} 패키지 구매`,
      supabase,
    });

    if (!addSuccess) {
      console.error('Failed to add credits to credit_transactions');
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.CREDIT_UPDATE_FAILED);
      return NextResponse.json(
        { success: false, ...errorResponse },
        { status: getStatusCode(PAYMENT_ERRORS.CREDIT_UPDATE_FAILED) }
      );
    }

    console.log(
      `Successfully added ${creditsToAdd} credits to user ${user.id}. New balance: ${newBalance}`
    );

    return NextResponse.json({
      success: true,
      credits: creditsToAdd,
      newBalance,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    const errorResponse = createErrorResponse(
      PAYMENT_ERRORS.VERIFICATION_FAILED,
      undefined,
      error instanceof Error ? error.message : undefined
    );
    return NextResponse.json(
      { success: false, ...errorResponse },
      { status: getStatusCode(PAYMENT_ERRORS.VERIFICATION_FAILED) }
    );
  }
}
