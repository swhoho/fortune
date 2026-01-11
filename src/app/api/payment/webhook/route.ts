/**
 * Stripe Webhook 처리 API
 * POST /api/payment/webhook
 *
 * 처리 이벤트:
 * - checkout.session.completed: 결제 완료 시 크레딧 충전
 * credit_transactions 테이블에 기록 (2년 만료)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { addCredits } from '@/lib/credits';
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
 * - Purchase 레코드 생성
 * - credit_transactions 기록 (2년 만료)
 * - users.credits 동기화
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
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        amount: amountPaid,
        credits: creditsToAdd,
        stripe_session_id: session.id,
        status: 'completed',
      })
      .select('id')
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      throw purchaseError;
    }

    // 2. credit_transactions 기록 + users.credits 동기화 (2년 만료)
    const { success, newBalance } = await addCredits({
      userId,
      amount: creditsToAdd,
      type: 'purchase',
      purchaseId: purchase.id,
      expiresInMonths: 24, // 2년
      description: 'Stripe 결제',
      supabase,
    });

    if (!success) {
      console.error('Failed to add credits to credit_transactions');
      throw new Error('Failed to add credits');
    }

    console.log(
      `Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`
    );
  } catch (error) {
    console.error('Error processing checkout completion:', error);
    // 에러가 발생해도 Stripe에는 200을 반환 (재시도 방지)
    // 실패한 경우 수동으로 처리하거나 별도 모니터링 필요
  }
}
