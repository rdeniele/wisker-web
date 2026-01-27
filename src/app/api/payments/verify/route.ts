import { NextRequest, NextResponse } from 'next/server';
import { retrieveCheckoutSession } from '@/service/payment.service';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateSubscriptionPlan } from '@/service/subscription.service';
import { PlanType } from '@prisma/client';

/**
 * GET /api/payments/verify?session_id=xxx
 * Verify payment status and update user subscription
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from PayMongo
    const checkoutSession = await retrieveCheckoutSession(sessionId);

    const status = checkoutSession.attributes.payment_status;
    const metadata = checkoutSession.attributes.metadata;

    // Check if payment was successful
    if (status === 'paid') {
      // Map plan name to PlanType enum
      const planName = (metadata.planName as string)?.toUpperCase();
      const planType: PlanType = planName === 'PRO' ? 'PRO' : planName === 'PREMIUM' ? 'PREMIUM' : 'FREE';
      const billingPeriod = (metadata.billingPeriod as string) === 'yearly' ? 'yearly' : 'monthly';

      // Update user subscription using the subscription service
      await updateSubscriptionPlan(user.id, planType, billingPeriod, true);

      return NextResponse.json({
        success: true,
        status: 'paid',
        message: 'Payment successful',
        data: {
          planName: metadata.planName,
          billingPeriod: metadata.billingPeriod,
        },
      });
    }

    return NextResponse.json({
      success: false,
      status: status,
      message: status === 'unpaid' ? 'Payment pending' : 'Payment failed',
    });
  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify payment' 
      },
      { status: 500 }
    );
  }
}
