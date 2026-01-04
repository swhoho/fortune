/**
 * Stripe Checkout Session 생성 API
 * POST /api/payment/create-checkout-session
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, CREDIT_PACKAGES } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/supabase/server';

interface CreateCheckoutRequest {
  packageId: string;
  credits: number;
  amount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCheckoutRequest;
    const { packageId, credits, amount } = body;

    // 패키지 검증
    const selectedPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!selectedPackage) {
      return NextResponse.json({ error: '유효하지 않은 패키지입니다' }, { status: 400 });
    }

    // 금액 검증
    if (amount !== selectedPackage.price) {
      return NextResponse.json({ error: '금액이 일치하지 않습니다' }, { status: 400 });
    }

    // 사용자 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Stripe Checkout Session 생성
    const stripe = getStripeServer();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `크레딧 ${credits}C`,
              description: `Master's Insight AI 크레딧 충전`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        packageId,
        credits: credits.toString(),
        userId: user.id,
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '결제 세션 생성에 실패했습니다',
      },
      { status: 500 }
    );
  }
}
