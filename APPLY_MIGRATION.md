# Apply Promo Code Migration

The "failed to fetch user" error occurs because the database doesn't have the new promo code tracking columns yet.

## Option 1: Automatic Script (Recommended)
```powershell
cd d:\work\acqron\wisker\wisker-web
npx tsx scripts/apply-promo-migration.ts
```

## Option 2: Manual SQL
Connect to your database and run:
```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "applied_promo_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promo_start_date" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promo_end_date" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promo_months_free" INTEGER;
```

## Option 3: Prisma Migrate (if using local dev DB)
```powershell
npx prisma migrate deploy
```

## After Migration:
1. Restart your development server: `npm run dev`
2. Try the checkout flow again

The new columns track:
- `applied_promo_code` - Which promo code was used
- `promo_start_date` - When the free period started
- `promo_end_date` - When user needs to start paying
- `promo_months_free` - Number of free months granted
