# Dynamic Pricing System

## Overview

Your Wisker application now has a fully dynamic pricing system where subscription plans are stored in the database and can be easily updated without code changes.

## Features

- ✅ Plans stored in PostgreSQL database
- ✅ Dynamic pricing updates (monthly & yearly)
- ✅ Feature list management per plan
- ✅ Discount configuration
- ✅ Most popular badge control
- ✅ Plan ordering/sorting
- ✅ Active/inactive plan status
- ✅ Automatic cache clearing after updates

## Database Schema

The `plans` table includes:

```typescript
{
  id: string              // UUID
  name: string            // Internal name (e.g., "free", "pro")
  planType: PlanType      // FREE, PRO, PREMIUM (enum)
  displayName: string     // Display name (e.g., "Pro")
  description: string?    // Optional description
  monthlyPrice: number    // Price in PHP for monthly billing
  yearlyPrice: number     // Price in PHP for yearly billing
  dailyCredits: number    // Credits per day
  notesLimit: number      // Max notes (-1 = unlimited)
  subjectsLimit: number   // Max subjects (-1 = unlimited)
  features: string[]      // Array of feature strings
  isActive: boolean       // Whether plan is shown
  sortOrder: number       // Display order (lower = first)
  isMostPopular: boolean  // Show "Most Popular" badge
  discountPercent: number? // Optional discount (e.g., 50 = 50% off)
  discountLabel: string?  // Optional discount label
}
```

## API Endpoints

### Public Endpoints

#### GET /api/plans
Fetch all active subscription plans.

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "uuid",
      "name": "free",
      "planType": "FREE",
      "displayName": "Free",
      "monthlyPrice": 0,
      "yearlyPrice": 0,
      "features": ["..."],
      // ... other fields
    }
  ]
}
```

### Admin Endpoints

⚠️ **IMPORTANT**: Currently open for development. Add authentication before production!

#### GET /api/plans/admin
Fetch all plans (including inactive ones).

#### POST /api/plans/admin
Create a new plan.

**Request Body:**
```json
{
  "name": "premium",
  "planType": "PREMIUM",
  "displayName": "Premium",
  "description": "The ultimate learning experience",
  "monthlyPrice": 150,
  "yearlyPrice": 1440,
  "dailyCredits": 4000,
  "notesLimit": -1,
  "subjectsLimit": -1,
  "features": [
    "4000 daily credits",
    "All Pro perks",
    "Early access"
  ],
  "isActive": true,
  "sortOrder": 3,
  "isMostPopular": false,
  "discountPercent": null,
  "discountLabel": null
}
```

#### PUT /api/plans/admin
Update an existing plan.

**Request Body:**
```json
{
  "id": "plan-uuid",
  "monthlyPrice": 199,
  "yearlyPrice": 1990,
  // ... other fields to update
}
```

#### DELETE /api/plans/admin?id={plan-id}
Delete a plan.

## Managing Plans

### 1. Using the Seed Script

Edit `prisma/seed.ts` and run:

```bash
npm run prisma:seed
```

### 2. Using the API

#### Example: Update Pro Plan Pricing

```bash
curl -X PUT http://localhost:3000/api/plans/admin \
  -H "Content-Type: application/json" \
  -d '{
    "id": "your-plan-id",
    "monthlyPrice": 75,
    "yearlyPrice": 720
  }'
```

#### Example: Add a New Feature to Free Plan

```bash
curl -X PUT http://localhost:3000/api/plans/admin \
  -H "Content-Type: application/json" \
  -d '{
    "id": "free-plan-id",
    "features": [
      "10 daily credits",
      "AI Cat Quizzes",
      "AI Flashcat Cards",
      "AI Cat-nnected Concept Maps",
      "NEW FEATURE HERE"
    ]
  }'
```

### 3. Using Prisma Studio

```bash
npx prisma studio
```

Navigate to the `plans` table and edit directly in the GUI.

### 4. Direct Database Access

```sql
-- Update Pro plan pricing
UPDATE plans 
SET monthly_price = 75, yearly_price = 720 
WHERE plan_type = 'PRO';

-- Add a discount to Premium plan
UPDATE plans 
SET discount_percent = 25, discount_label = '25% OFF Limited Time' 
WHERE plan_type = 'PREMIUM';

-- Change features
UPDATE plans 
SET features = ARRAY[
  '1000 daily credits',
  'AI Cat Quizzes',
  'New Feature Here'
]
WHERE plan_type = 'PRO';
```

## Common Tasks

### Change Pricing

1. **Via API** (Recommended):
   ```javascript
   await fetch('/api/plans/admin', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       id: 'plan-id',
       monthlyPrice: 99,
       yearlyPrice: 950
     })
   });
   ```

2. **Via Prisma Studio**: Open Prisma Studio → plans table → Edit

3. **Via Database**: Run SQL UPDATE query

### Add/Remove Features

```javascript
await fetch('/api/plans/admin', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'plan-id',
    features: [
      'Feature 1',
      'Feature 2',
      'New Feature 3'
    ]
  })
});
```

### Enable/Disable a Plan

```javascript
await fetch('/api/plans/admin', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'plan-id',
    isActive: false  // Hide from pricing page
  })
});
```

### Change Display Order

```javascript
// Lower sortOrder appears first
await fetch('/api/plans/admin', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'premium-plan-id',
    sortOrder: 1  // Show first
  })
});
```

### Add Promotional Discount

```javascript
await fetch('/api/plans/admin', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'pro-plan-id',
    discountPercent: 50,
    discountLabel: '50% OFF for Early Users'
  })
});
```

## Architecture

### Files Modified/Created

1. **Database**:
   - `prisma/schema.prisma` - Added Plan model
   - `prisma/seed.ts` - Seed script for initial plans

2. **Services**:
   - `service/subscription.service.ts` - Updated to use database plans with caching

3. **API Routes**:
   - `src/app/api/plans/route.ts` - Public endpoint for fetching plans
   - `src/app/api/plans/admin/route.ts` - Admin CRUD endpoints

4. **Frontend**:
   - `src/app/(authenticated)/upgrade/page.tsx` - Now fetches plans dynamically
   - `src/app/(authenticated)/upgrade/page-static-backup.tsx` - Backup of hardcoded version

### Caching

The subscription service caches plan configurations for 5 minutes to reduce database queries. The cache is automatically cleared when plans are updated via the API.

To manually clear the cache:
```typescript
import { clearPlanConfigsCache } from '@/service/subscription.service';
clearPlanConfigsCache();
```

## Migration from Hardcoded Plans

Your previous hardcoded plans in `PLAN_CONFIGS` have been replaced with database queries. The initial plans have been seeded with the same values.

Old code:
```typescript
const config = PLAN_CONFIGS[planType];
```

New code:
```typescript
const config = await getPlanConfig(planType);
```

## Security Considerations

⚠️ **IMPORTANT**: The admin API endpoints (`/api/plans/admin`) are currently unprotected!

Before deploying to production:

1. Add authentication middleware
2. Check for admin role
3. Add rate limiting
4. Add audit logging

Example protection:
```typescript
// In /api/plans/admin/route.ts
export async function POST(request: NextRequest) {
  // Add authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }
  
  // ... rest of the code
}
```

## Testing

### Test Fetching Plans
```bash
curl http://localhost:3000/api/plans
```

### Test Updating a Plan
```bash
# First, get plan ID from the GET request above
curl -X PUT http://localhost:3000/api/plans/admin \
  -H "Content-Type: application/json" \
  -d '{"id":"YOUR_PLAN_ID","monthlyPrice":199}'
```

### Verify on UI
1. Navigate to `/upgrade`
2. Plans should reflect database values
3. Toggle between Monthly/Yearly to see correct prices

## Troubleshooting

### Plans not updating on frontend
- Check browser console for API errors
- Clear browser cache
- Verify database connection
- Check that `isActive` is true for the plan

### Database connection errors
- Verify `DATABASE_URL` in `.env.local`
- Run `npx prisma db push` to sync schema
- Check Supabase connection

### Cache issues
- Plans are cached for 5 minutes
- Wait or clear cache manually
- Check that API calls `clearPlanConfigsCache()`

## Next Steps

1. **Add Admin UI**: Create an admin dashboard to manage plans
2. **Add Authentication**: Protect admin endpoints
3. **Add Validation**: Validate price ranges, feature lists, etc.
4. **Add Audit Trail**: Log all plan changes
5. **Add Webhooks**: Notify when plans change
6. **Add Plan History**: Track pricing changes over time

## Support

For questions or issues:
1. Check console logs
2. Verify database schema matches Prisma schema
3. Test API endpoints independently
4. Check Prisma Studio for data integrity
