import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/service/payment.service';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * POST /api/payments/checkout
 * Create a checkout session for subscription payment
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const { planName, amount, billingPeriod } = body;

    if (!planName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: planName, amount' },
        { status: 400 }
      );
    }

    // Get the base URL for redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   request.headers.get('origin') || 
                   'http://localhost:3000';

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          name: `Wisker ${planName} Plan`,
          amount: amount * 100, // Convert to cents
          currency: 'PHP',
          description: `${planName} subscription - ${billingPeriod || 'monthly'}`,
          quantity: 1,
        },
      ],
      successUrl: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/upgrade`,
      description: `Wisker ${planName} Subscription`,
      metadata: {
        userId: user.id,
        planName,
        billingPeriod: billingPeriod || 'monthly',
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.attributes.checkout_url,
      sessionId: checkoutSession.id,
    });
  } catch (error: unknown) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create checkout session' 
      },
      { status: 500 }
    );
  }
}
