/**
 * PortOne 결제 검증 API
 * POST /api/payment/portone/verify
 *
 * 결제 완료 후 클라이언트에서 호출하여 결제 검증 및 크레딧 지급
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPackageById, verifyPaymentWithPortOne } from '@/lib/portone';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getAuthenticatedUser } from '@/lib/supabase/server';

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
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 2. 패키지 검증
    const selectedPackage = getPackageById(packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 패키지입니다' },
        { status: 400 }
      );
    }

    // 3. 금액 검증 (클라이언트 전송 금액 vs 패키지 금액)
    if (expectedAmount !== selectedPackage.price) {
      return NextResponse.json(
        { success: false, error: '금액이 일치하지 않습니다' },
        { status: 400 }
      );
    }

    // 4. 포트원 API로 결제 정보 조회
    const payment = await verifyPaymentWithPortOne(paymentId);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 조회할 수 없습니다' },
        { status: 400 }
      );
    }

    // 5. 결제 상태 확인
    if (payment.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: `결제가 완료되지 않았습니다 (상태: ${payment.status})` },
        { status: 400 }
      );
    }

    // 6. 결제 금액 검증 (포트원 응답 금액 vs 패키지 금액)
    if (payment.amount.total !== selectedPackage.price) {
      console.error(
        `Amount mismatch: expected ${selectedPackage.price}, got ${payment.amount.total}`
      );
      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다' },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, error: '이미 처리된 결제입니다' },
        { status: 400 }
      );
    }

    const creditsToAdd = selectedPackage.credits + (selectedPackage.bonus || 0);

    // 8. Purchase 레코드 생성 (stripe_session_id에 포트원 paymentId 저장)
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: user.id,
      amount: selectedPackage.price,
      credits: creditsToAdd,
      stripe_session_id: paymentId, // 포트원 payment_id 저장
      status: 'completed',
    });

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      return NextResponse.json(
        { success: false, error: '결제 기록 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 9. 사용자 크레딧 업데이트
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (getUserError) {
      console.error('Failed to get user:', getUserError);
      return NextResponse.json(
        { success: false, error: '사용자 정보 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    const newCredits = (userData?.credits || 0) + creditsToAdd;

    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user credits:', updateError);
      return NextResponse.json(
        { success: false, error: '크레딧 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    console.log(
      `Successfully added ${creditsToAdd} credits to user ${user.id}. New balance: ${newCredits}`
    );

    return NextResponse.json({
      success: true,
      credits: creditsToAdd,
      newBalance: newCredits,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '결제 검증에 실패했습니다',
      },
      { status: 500 }
    );
  }
}
