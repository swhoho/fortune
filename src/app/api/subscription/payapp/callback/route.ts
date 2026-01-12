/**
 * PayApp 정기결제 콜백 API (Feedback URL)
 * POST /api/subscription/payapp/callback
 *
 * PayApp 서버에서 정기결제 상태 변경 시 호출됨
 * - pay_state=1: 결제 요청 (최초 등록)
 * - pay_state=4: 결제 완료 (매월 자동결제)
 * - pay_state=8: 해지
 *
 * 응답은 반드시 "SUCCESS" 문자열이어야 함
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addCredits } from '@/lib/credits/add';
import {
  verifyPayAppRebillFeedback,
  SUBSCRIPTION_PLAN,
  type PayAppRebillFeedbackData,
} from '@/lib/payapp';

// Service role 클라이언트 (webhook에서는 auth 세션 없음)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. FormData 파싱
    const formData = await request.formData();
    const data: PayAppRebillFeedbackData = {
      state: formData.get('state')?.toString() || '',
      rebill_no: formData.get('rebill_no')?.toString() || '',
      mul_no: formData.get('mul_no')?.toString(),
      pay_date: formData.get('pay_date')?.toString(),
      pay_state: formData.get('pay_state')?.toString() || '',
      goodname: formData.get('goodname')?.toString() || '',
      price: formData.get('price')?.toString() || '',
      recvphone: formData.get('recvphone')?.toString() || '',
      var1: formData.get('var1')?.toString(), // userId
      linkkey: formData.get('linkkey')?.toString() || '',
      linkval: formData.get('linkval')?.toString() || '',
    };

    console.log('[PayApp Rebill Callback] 수신 데이터:', {
      state: data.state,
      rebill_no: data.rebill_no,
      pay_state: data.pay_state,
      price: data.price,
      var1: data.var1,
    });

    // 2. linkkey/linkval 검증
    if (!verifyPayAppRebillFeedback(data)) {
      console.error('[PayApp Rebill Callback] 검증 실패: linkkey/linkval 불일치');
      return new Response('FAIL', { status: 400 });
    }

    // 3. 필수 데이터 확인
    const userId = data.var1;
    const rebillNo = data.rebill_no;
    const payState = data.pay_state;

    if (!userId || !rebillNo) {
      console.error('[PayApp Rebill Callback] 필수 데이터 누락:', { userId, rebillNo });
      return new Response('FAIL', { status: 400 });
    }

    // 4. 상태별 처리
    if (payState === '1') {
      // 결제 요청 (최초 등록) - 구독 레코드 생성
      await handleSubscriptionCreated(userId, rebillNo, data.recvphone);
    } else if (payState === '4') {
      // 결제 완료 (매월 자동결제) - 크레딧 지급
      await handlePaymentCompleted(userId, rebillNo, data.mul_no);
    } else if (payState === '8') {
      // 해지
      await handleSubscriptionCanceled(userId, rebillNo);
    }

    // 5. 성공 응답 (반드시 "SUCCESS" 문자열)
    return new Response('SUCCESS', { status: 200 });
  } catch (error) {
    console.error('[PayApp Rebill Callback] 처리 오류:', error);
    return new Response('FAIL', { status: 500 });
  }
}

/**
 * 구독 생성 처리 (pay_state=1)
 */
async function handleSubscriptionCreated(userId: string, rebillNo: string, recvphone: string) {
  // 기존 구독 확인
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('payapp_rebill_no', rebillNo)
    .single();

  if (existing) {
    console.log('[PayApp Rebill] 이미 존재하는 구독:', rebillNo);
    return;
  }

  // 구독 기간 계산
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // 구독 레코드 생성
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      price: SUBSCRIPTION_PLAN.price,
      payapp_rebill_no: rebillNo,
      payapp_recvphone: recvphone,
      payment_method: 'payapp',
    })
    .select('id')
    .single();

  if (subError) {
    console.error('[PayApp Rebill] 구독 생성 실패:', subError);
    return;
  }

  // users 테이블 업데이트
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_id: subscription.id,
    })
    .eq('id', userId);

  // 최초 크레딧 지급
  await addCredits({
    userId,
    amount: SUBSCRIPTION_PLAN.credits,
    type: 'subscription',
    subscriptionId: subscription.id,
    description: `${SUBSCRIPTION_PLAN.name} 최초 크레딧`,
    supabase: supabaseAdmin,
  });

  console.log('[PayApp Rebill] 구독 생성 완료:', {
    userId,
    rebillNo,
    subscriptionId: subscription.id,
  });
}

/**
 * 결제 완료 처리 (pay_state=4, 매월 자동결제)
 */
async function handlePaymentCompleted(userId: string, rebillNo: string, mulNo?: string) {
  // 구독 조회
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status')
    .eq('payapp_rebill_no', rebillNo)
    .single();

  if (!subscription) {
    console.error('[PayApp Rebill] 구독 없음:', rebillNo);
    return;
  }

  // 중복 결제 확인 (mulNo 기준)
  if (mulNo) {
    const { data: existingPayment } = await supabaseAdmin
      .from('credit_transactions')
      .select('id')
      .eq('description', `PayApp 정기결제 ${mulNo}`)
      .single();

    if (existingPayment) {
      console.log('[PayApp Rebill] 이미 처리된 결제:', mulNo);
      return;
    }
  }

  // 구독 기간 갱신
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', subscription.id);

  // 크레딧 지급
  await addCredits({
    userId,
    amount: SUBSCRIPTION_PLAN.credits,
    type: 'subscription',
    subscriptionId: subscription.id,
    description: mulNo ? `PayApp 정기결제 ${mulNo}` : `${SUBSCRIPTION_PLAN.name} 월간 크레딧`,
    supabase: supabaseAdmin,
  });

  console.log('[PayApp Rebill] 월간 결제 완료:', {
    userId,
    rebillNo,
    mulNo,
    credits: SUBSCRIPTION_PLAN.credits,
  });
}

/**
 * 구독 해지 처리 (pay_state=8)
 */
async function handleSubscriptionCanceled(userId: string, rebillNo: string) {
  // 구독 상태 업데이트
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('payapp_rebill_no', rebillNo)
    .select('id')
    .single();

  if (subscription) {
    // users 테이블 업데이트
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'canceled',
      })
      .eq('id', userId);
  }

  console.log('[PayApp Rebill] 구독 해지 완료:', { userId, rebillNo });
}

// GET 요청도 허용 (테스트용)
export async function GET() {
  return NextResponse.json({
    message: 'PayApp Rebill Callback endpoint. Use POST with feedback data.',
  });
}
