/**
 * PayApp 결제 요청 생성 API
 * POST /api/payment/payapp/create
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPackageById } from '@/lib/portone';
import { createPayAppPayment, generatePayAppOrderId } from '@/lib/payapp';

export async function POST(request: Request) {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: '패키지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. 패키지 검증
    const pkg = getPackageById(packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 패키지입니다.' },
        { status: 400 }
      );
    }

    // 4. PayApp 결제 요청 생성
    const paymentId = generatePayAppOrderId();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const result = await createPayAppPayment({
      goodname: `${pkg.credits}C 크레딧${pkg.bonus ? ` (+${pkg.bonus}C 보너스)` : ''}`,
      price: pkg.price,
      recvphone: '01000000000', // SMS 미사용 (smsuse='n')으로 플레이스홀더 사용
      feedbackurl: `${appUrl}/api/payment/payapp/callback`,
      returnurl: `${appUrl}/ko/payment/success?paymentId=${paymentId}&packageId=${packageId}`,
      userId: user.id,
      packageId: packageId,
    });

    // 5. 응답 확인
    if (result.state !== '1' || !result.payurl) {
      console.error('PayApp payment request failed:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || '결제 요청 생성에 실패했습니다.',
          errno: result.errno,
        },
        { status: 500 }
      );
    }

    // 6. 결제 대기 레코드 생성 (선택적)
    // 콜백에서 처리하므로 여기서는 생략 가능

    return NextResponse.json({
      success: true,
      payUrl: result.payurl,
      paymentId,
      mulNo: result.mul_no,
    });
  } catch (error) {
    console.error('PayApp create payment error:', error);
    return NextResponse.json(
      { success: false, error: '결제 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
