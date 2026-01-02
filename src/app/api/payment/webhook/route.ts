/**
 * Stripe Webhook 처리 API
 * POST /api/payment/webhook
 *
 * 처리 이벤트:
 * - checkout.session.completed: 결제 완료 시 크레딧 충전
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeServer();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // 이벤트 타입별 처리
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * 결제 완료 처리
 * - 사용자 크레딧 충전
 * - Purchase 레코드 생성
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin();

  const { userId, credits } = session.metadata || {};

  if (!userId || !credits) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const creditsToAdd = parseInt(credits, 10);
  const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

  try {
    // 1. Purchase 레코드 생성
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: userId,
      amount: amountPaid,
      credits: creditsToAdd,
      stripe_session_id: session.id,
      status: 'completed',
    });

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      throw purchaseError;
    }

    // 2. 사용자 크레딧 업데이트
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (getUserError) {
      console.error('Failed to get user:', getUserError);
      throw getUserError;
    }

    const newCredits = (user?.credits || 0) + creditsToAdd;

    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user credits:', updateError);
      throw updateError;
    }

    console.log(
      `Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newCredits}`
    );
  } catch (error) {
    console.error('Error processing checkout completion:', error);
    // 에러가 발생해도 Stripe에는 200을 반환 (재시도 방지)
    // 실패한 경우 수동으로 처리하거나 별도 모니터링 필요
  }
}
