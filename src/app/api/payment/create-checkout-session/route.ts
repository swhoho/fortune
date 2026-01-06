/**
 * Stripe Checkout Session 생성 API
 * POST /api/payment/create-checkout-session
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, CREDIT_PACKAGES } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import {
  AUTH_ERRORS,
  PAYMENT_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

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
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.INVALID_PACKAGE);
      return NextResponse.json(errorResponse, { status: getStatusCode(PAYMENT_ERRORS.INVALID_PACKAGE) });
    }

    // 금액 검증
    if (amount !== selectedPackage.price) {
      const errorResponse = createErrorResponse(PAYMENT_ERRORS.AMOUNT_MISMATCH);
      return NextResponse.json(errorResponse, { status: getStatusCode(PAYMENT_ERRORS.AMOUNT_MISMATCH) });
    }

    // 사용자 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      const errorResponse = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(errorResponse, { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) });
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
    const errorResponse = createErrorResponse(
      PAYMENT_ERRORS.SESSION_CREATE_FAILED,
      undefined,
      error instanceof Error ? error.message : undefined
    );
    return NextResponse.json(errorResponse, { status: getStatusCode(PAYMENT_ERRORS.SESSION_CREATE_FAILED) });
  }
}
