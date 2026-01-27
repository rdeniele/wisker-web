import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/service/payment.service';
import { updateSubscriptionPlan } from '@/service/subscription.service';
import { PlanType } from '@prisma/client';

interface PayMongoEvent {
  data: {
    attributes: {
      type: string;
      data: {
        attributes: {
          metadata?: {
            userId?: string;
            planName?: string;
            billingPeriod?: string;
          };
        };
      };
    };
  };
}

/**
 * POST /api/payments/webhook
 * Handle PayMongo webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('paymongo-signature');

    // Verify webhook signature
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.data.attributes.type;

    console.log('Received webhook event:', eventType);

    // Handle different event types
    switch (eventType) {
      case 'payment.paid':
        await handlePaymentPaid(event);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      case 'checkout_session.payment.paid':
        await handleCheckoutSessionPaid(event);
        break;
      default:
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentPaid(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  console.log('Payment paid:', data);
  // Implement your business logic here
}

async function handlePaymentFailed(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  console.log('Payment failed:', data);
  // Implement your business logic here
}

async function handleCheckoutSessionPaid(event: unknown) {
  const paymongoEvent = event as PayMongoEvent;
  const data = paymongoEvent.data.attributes.data;
  const metadata = data.attributes.metadata;
  
  console.log('Checkout session paid:', data);

  if (metadata && metadata.userId) {
    // Map plan name to PlanType enum
    const planName = metadata.planName?.toString().toUpperCase();
    const planType: PlanType = planName === 'PRO' ? 'PRO' : planName === 'PREMIUM' ? 'PREMIUM' : 'FREE';
    const billingPeriod = metadata.billingPeriod?.toString() === 'yearly' ? 'yearly' : 'monthly';

    // Update user subscription using the subscription service
    await updateSubscriptionPlan(metadata.userId.toString(), planType, billingPeriod, true);
  }
}
