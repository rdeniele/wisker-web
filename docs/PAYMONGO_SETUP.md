# PayMongo Payment Integration Guide

This guide will help you set up PayMongo payments in your Wisker application.

## Prerequisites

1. A PayMongo account (sign up at https://www.paymongo.com/)
2. Access to your PayMongo Dashboard

## Step 1: Get Your API Keys

### Test Keys (for development)

1. Log in to your PayMongo Dashboard
2. Go to **Developers** → **API Keys**
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. Copy your **Test Public Key** (starts with `pk_test_`)

### Live Keys (for production)

1. Complete your PayMongo account verification
2. In the Dashboard, go to **Developers** → **API Keys**
3. Copy your **Live Secret Key** (starts with `sk_live_`)
4. Copy your **Live Public Key** (starts with `pk_live_`)

## Step 2: Update Environment Variables

Update your `.env` file with your PayMongo keys:

```env
# PayMongo API Keys
# Production Keys (Use these in production)
PAYMONGO_SECRET_KEY="sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY"
PAYMONGO_PUBLIC_KEY="pk_live_YOUR_ACTUAL_LIVE_PUBLIC_KEY"

# Test Keys (Use these for development/testing)
PAYMONGO_TEST_SECRET_KEY="sk_test_YOUR_ACTUAL_TEST_SECRET_KEY"
PAYMONGO_TEST_PUBLIC_KEY="pk_test_YOUR_ACTUAL_TEST_PUBLIC_KEY"

# Set to 'test' for development, 'live' for production
PAYMONGO_MODE="test"

# Public key exposed to client (automatically selects based on mode)
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY="pk_test_YOUR_ACTUAL_TEST_PUBLIC_KEY"

# Optional: Webhook Secret (for webhook signature verification)
PAYMONGO_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important:**

- Replace all placeholder values with your actual keys
- Never commit real API keys to version control
- Use test keys during development
- Switch to live keys only in production

## Step 3: Test Payment Flow

### Using Test Cards

PayMongo provides test card numbers for testing:

**Successful Payment:**

- Card Number: `4343 4343 4343 4345`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

**Failed Payment:**

- Card Number: `4571 7360 0000 0008`
- Expiry: Any future date
- CVC: Any 3 digits

**3D Secure (Authentication Required):**

- Card Number: `4571 7360 0000 0016`
- Expiry: Any future date
- CVC: Any 3 digits

### Testing E-Wallets

When testing GCash, GrabPay, or PayMaya in test mode:

1. Click on the e-wallet option
2. You'll be redirected to a PayMongo test page
3. Click "Authorize Test Payment" to simulate successful payment

## Step 4: Set Up Webhooks (Optional but Recommended)

Webhooks allow PayMongo to notify your application about payment events.

1. Go to **Developers** → **Webhooks** in your PayMongo Dashboard
2. Click **Create Webhook**
3. Enter your webhook URL:
   - Development: Use a tool like **ngrok** to create a public URL
   - Production: `https://yourdomain.com/api/payments/webhook`
4. Select the events you want to receive:
   - `checkout_session.payment.paid` - When payment is completed
   - `payment.paid` - When payment is successful
   - `payment.failed` - When payment fails
5. Copy the **Webhook Secret** and add it to your `.env` file

### Using ngrok for Local Development

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL + /api/payments/webhook as your webhook URL
# Example: https://abc123.ngrok.io/api/payments/webhook
```

## Step 5: Update Prisma Schema (Optional)

Add subscription fields to your User model if needed:

```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  // ... existing fields ...

  // Subscription fields
  subscriptionStatus    String?  // 'active', 'inactive', 'cancelled'
  subscriptionPlan      String?  // 'Free', 'Pro', 'Premium'
  subscriptionPeriod    String?  // 'monthly', 'yearly'
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run:

```bash
npx prisma migrate dev --name add_subscription_fields
```

## Step 6: Test the Integration

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `/upgrade` in your browser

3. Select a plan and click "Choose Plan"

4. You'll be redirected to the PayMongo checkout page

5. Use the test card details above to complete payment

6. After successful payment, you'll be redirected to `/upgrade/success`

## Payment Flow Overview

```
User clicks "Choose Plan"
        ↓
POST /api/payments/checkout
        ↓
Creates PayMongo Checkout Session
        ↓
Redirects to PayMongo hosted page
        ↓
User completes payment
        ↓
PayMongo redirects to /upgrade/success?session_id=xxx
        ↓
GET /api/payments/verify
        ↓
Updates user subscription in database
        ↓
Shows success message
```

## Supported Payment Methods

- **Credit/Debit Cards** - Visa, Mastercard, JCB
- **GCash** - Popular Philippine e-wallet
- **GrabPay** - Ride-hailing app wallet
- **PayMaya** - Digital wallet and virtual card

## Security Best Practices

1. **Never expose secret keys** - Keep them server-side only
2. **Use HTTPS in production** - Required for payment processing
3. **Verify webhook signatures** - Prevents fake webhook calls
4. **Log all transactions** - For audit and debugging
5. **Handle errors gracefully** - Provide clear user feedback

## Troubleshooting

### "PayMongo secret key is not configured"

- Check that your `.env` file has the correct keys
- Restart your development server after updating `.env`

### Payment succeeds but user not updated

- Check the webhook configuration
- Verify the user ID is correctly passed in metadata
- Check server logs for errors

### Redirect URL not working

- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- For production, use your actual domain
- For local dev, use `http://localhost:3000`

## Going Live

Before deploying to production:

1. Switch `PAYMONGO_MODE` from `test` to `live`
2. Update to use live API keys
3. Update `NEXT_PUBLIC_APP_URL` to your production URL
4. Update webhook URL in PayMongo Dashboard
5. Test thoroughly with small transactions first

## Additional Resources

- [PayMongo Documentation](https://developers.paymongo.com/)
- [PayMongo API Reference](https://developers.paymongo.com/reference)
- [PayMongo Dashboard](https://dashboard.paymongo.com/)

## Support

If you encounter issues:

- Check PayMongo Dashboard for transaction status
- Review server logs for error messages
- Contact PayMongo support: support@paymongo.com
