/**
 * PayApp 결제 완료 콜백 API (Feedback URL)
 * POST /api/payment/payapp/callback
 *
 * PayApp 서버에서 결제 완료 시 호출됨
 * 응답은 반드시 "SUCCESS" 문자열이어야 함
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPackageById } from '@/lib/portone';
import { addCredits } from '@/lib/credits/add';
import { verifyPayAppFeedback, type PayAppFeedbackData } from '@/lib/payapp';

// Service role 클라이언트 (webhook에서는 auth 세션 없음)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. FormData 파싱
    const formData = await request.formData();
    const data: PayAppFeedbackData = {
      state: formData.get('state')?.toString() || '',
      mul_no: formData.get('mul_no')?.toString() || '',
      pay_date: formData.get('pay_date')?.toString() || '',
      pay_type: formData.get('pay_type')?.toString() || '',
      pay_state: formData.get('pay_state')?.toString() || '',
      goodname: formData.get('goodname')?.toString() || '',
      price: formData.get('price')?.toString() || '',
      recvphone: formData.get('recvphone')?.toString() || '',
      var1: formData.get('var1')?.toString(), // userId
      var2: formData.get('var2')?.toString(), // packageId
      linkkey: formData.get('linkkey')?.toString() || '',
      linkval: formData.get('linkval')?.toString() || '',
    };

    console.log('[PayApp Callback] 수신 데이터:', {
      state: data.state,
      pay_state: data.pay_state,
      mul_no: data.mul_no,
      pay_type: data.pay_type,
      price: data.price,
      var1: data.var1,
      var2: data.var2,
    });

    // 2. 결제 성공 여부 확인 (pay_state=4: 결제완료)
    // pay_state 코드: 1=요청, 4=결제완료, 8/32=요청취소, 9/64=승인취소, 10=결제대기
    if (data.pay_state !== '4') {
      console.log('[PayApp Callback] 결제 미완료 또는 취소:', data.pay_state);
      return new Response('SUCCESS', { status: 200 });
    }

    // 3. linkkey/linkval 검증
    if (!verifyPayAppFeedback(data)) {
      console.error('[PayApp Callback] 검증 실패: linkkey/linkval 불일치');
      return new Response('FAIL', { status: 400 });
    }

    // 3-1. userid 검증
    const expectedUserId = process.env.PAYAPP_USER_ID;
    const receivedUserId = formData.get('userid')?.toString();
    if (expectedUserId && receivedUserId !== expectedUserId) {
      console.error('[PayApp Callback] 검증 실패: userid 불일치', {
        expected: expectedUserId,
        received: receivedUserId,
      });
      return new Response('FAIL', { status: 400 });
    }

    // 4. 필수 데이터 확인
    const userId = data.var1;
    const packageId = data.var2;
    const mulNo = data.mul_no;
    const price = parseInt(data.price, 10);

    if (!userId || !packageId || !mulNo) {
      console.error('[PayApp Callback] 필수 데이터 누락:', { userId, packageId, mulNo });
      return new Response('FAIL', { status: 400 });
    }

    // 5. 패키지 검증
    const pkg = getPackageById(packageId);
    if (!pkg) {
      console.error('[PayApp Callback] 유효하지 않은 패키지:', packageId);
      return new Response('FAIL', { status: 400 });
    }

    // 6. 금액 검증
    if (price !== pkg.price) {
      console.error('[PayApp Callback] 금액 불일치:', { expected: pkg.price, received: price });
      return new Response('FAIL', { status: 400 });
    }

    // 7. 중복 결제 확인
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', `payapp_${mulNo}`)
      .single();

    if (existingPurchase) {
      console.log('[PayApp Callback] 이미 처리된 결제:', mulNo);
      return new Response('SUCCESS', { status: 200 });
    }

    // 8. 구매 레코드 생성
    const totalCredits = pkg.credits + (pkg.bonus || 0);
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: userId,
        amount: price,
        credits: totalCredits,
        stripe_session_id: `payapp_${mulNo}`, // PayApp 결제번호 저장
        status: 'completed',
        payment_method: 'payapp',
      })
      .select('id')
      .single();

    if (purchaseError) {
      console.error('[PayApp Callback] 구매 레코드 생성 실패:', purchaseError);
      return new Response('FAIL', { status: 500 });
    }

    // 9. 크레딧 지급
    const creditResult = await addCredits({
      userId,
      amount: totalCredits,
      type: 'purchase',
      purchaseId: purchase.id,
      description: `PayApp ${pkg.credits}C 패키지 구매`,
      supabase: supabaseAdmin,
    });

    if (!creditResult.success) {
      console.error('[PayApp Callback] 크레딧 지급 실패');
      return new Response('FAIL', { status: 500 });
    }

    console.log('[PayApp Callback] 결제 완료:', {
      userId,
      mulNo,
      credits: totalCredits,
      newBalance: creditResult.newBalance,
    });

    // 10. 성공 응답 (반드시 "SUCCESS" 문자열)
    return new Response('SUCCESS', { status: 200 });
  } catch (error) {
    console.error('[PayApp Callback] 처리 오류:', error);
    return new Response('FAIL', { status: 500 });
  }
}

// GET 요청도 허용 (테스트용)
export async function GET() {
  return NextResponse.json({
    message: 'PayApp Callback endpoint. Use POST with feedback data.',
  });
}
