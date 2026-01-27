/**
 * PayMongo Payment Service
 * Handles payment processing via PayMongo API
 */

import crypto from 'crypto';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// Get the appropriate secret key based on mode
const getSecretKey = () => {
  const mode = process.env.PAYMONGO_MODE || 'test';
  return mode === 'test'
    ? process.env.PAYMONGO_TEST_SECRET_KEY
    : process.env.PAYMONGO_SECRET_KEY;
};

// Base64 encode the secret key for Basic Auth
const getAuthHeader = () => {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error('PayMongo secret key is not configured');
  }
  return `Basic ${Buffer.from(secretKey).toString('base64')}`;
};

export interface PaymentIntentData {
  amount: number; // Amount in cents (e.g., 10000 = PHP 100.00)
  currency?: string;
  description?: string;
  statement_descriptor?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethodData {
  type: 'card' | 'gcash' | 'grab_pay' | 'paymaya';
  billing?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  // For card payments
  card?: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
}

export interface CreatePaymentIntentResponse {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    status: string;
    client_key: string;
    livemode: boolean;
    created_at: number;
    updated_at: number;
    metadata?: Record<string, unknown>;
  };
}

export interface AttachPaymentIntentResponse {
  id: string;
  type: string;
  attributes: {
    status: string;
    payment_method_allowed: string[];
    payments: unknown[];
    next_action?: {
      type: string;
      redirect?: {
        url: string;
        return_url: string;
      };
    };
  };
}

/**
 * Create a Payment Intent
 * This is the first step in processing a payment
 */
export async function createPaymentIntent(
  data: PaymentIntentData
): Promise<CreatePaymentIntentResponse> {
  const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: data.amount,
          currency: data.currency || 'PHP',
          description: data.description,
          statement_descriptor: data.statement_descriptor,
          metadata: data.metadata,
          payment_method_allowed: [
            'card',
            'gcash',
            'grab_pay',
            'paymaya',
          ],
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a Payment Method
 * This creates a payment method (card, e-wallet, etc.)
 */
export async function createPaymentMethod(
  data: PaymentMethodData
): Promise<{ id: string; type: string; attributes: Record<string, unknown> }> {
  const response = await fetch(`${PAYMONGO_API_URL}/payment_methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: data,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Attach a Payment Method to a Payment Intent
 * This completes the payment process
 */
export async function attachPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string,
  clientKey: string,
  returnUrl?: string
): Promise<AttachPaymentIntentResponse> {
  const response = await fetch(
    `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
            return_url: returnUrl,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Retrieve a Payment Intent
 * Check the status of a payment intent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<CreatePaymentIntentResponse> {
  const response = await fetch(
    `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a Payment Link (for e-wallets like GCash, GrabPay, PayMaya)
 * This is simpler than Payment Intents for e-wallet payments
 */
export async function createPaymentLink(data: {
  amount: number;
  description: string;
  remarks?: string;
}): Promise<{ id: string; type: string; attributes: Record<string, unknown> }> {
  const response = await fetch(`${PAYMONGO_API_URL}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: data.amount,
          description: data.description,
          remarks: data.remarks,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Retrieve a Payment Link
 */
export async function retrievePaymentLink(linkId: string): Promise<{ id: string; type: string; attributes: Record<string, unknown> }> {
  const response = await fetch(`${PAYMONGO_API_URL}/links/${linkId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a Checkout Session (Recommended for simple integrations)
 * This creates a hosted checkout page
 */
export async function createCheckoutSession(data: {
  lineItems: Array<{
    name: string;
    amount: number;
    currency?: string;
    description?: string;
    quantity?: number;
  }>;
  successUrl: string;
  cancelUrl?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; type: string; attributes: { checkout_url: string; payment_status: string; metadata: Record<string, unknown> } }> {
  const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: data.lineItems.map((item) => ({
            name: item.name,
            amount: item.amount,
            currency: item.currency || 'PHP',
            description: item.description,
            quantity: item.quantity || 1,
          })),
          payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
          description: data.description,
          metadata: data.metadata,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Retrieve a Checkout Session
 */
export async function retrieveCheckoutSession(sessionId: string): Promise<{ id: string; type: string; attributes: { payment_status: string; metadata: Record<string, unknown> } }> {
  const response = await fetch(
    `${PAYMONGO_API_URL}/checkout_sessions/${sessionId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`
    );
  }

  const result = await response.json();
  return result.data;
}

/**
 * Webhook verification
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}
