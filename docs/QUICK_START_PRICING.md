# Dynamic Pricing System - Quick Start Guide

## 🎉 Setup Complete!

Your Wisker app now has a fully functional database-driven pricing system. All plan configurations (pricing, features, limits) are now stored in your PostgreSQL database and can be updated without touching any code!

## Quick Reference

### View Plans on Your Site

- **User-facing page**: Navigate to `/upgrade`
- **Admin management**: Navigate to `/admin/plans`

### Update Plans

#### Option 1: Admin UI (Easiest) ⭐

1. Go to `http://localhost:3000/admin/plans`
2. Click "Edit" on any plan
3. Modify pricing, features, limits, etc.
4. Click "Save Changes"
5. Done! Changes are live immediately

#### Option 2: API (Programmatic)

```javascript
// Update pricing
await fetch("/api/plans/admin", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: "your-plan-id",
    monthlyPrice: 99,
    yearlyPrice: 950,
  }),
});
```

#### Option 3: Prisma Studio (Visual DB Editor)

```bash
npx prisma studio
```

- Opens at http://localhost:5555
- Click on "plans" table
- Edit any field directly
- Save changes

#### Option 4: Direct SQL

```sql
UPDATE plans
SET monthly_price = 99, yearly_price = 950
WHERE plan_type = 'PRO';
```

## What Can You Change?

✅ **Pricing**: Monthly and yearly prices  
✅ **Features**: Add, remove, or modify feature list  
✅ **Limits**: Daily credits, max notes, max subjects  
✅ **Display**: Sort order, "Most Popular" badge  
✅ **Discounts**: Promotional discounts and labels  
✅ **Visibility**: Show or hide plans

## Common Tasks

### Change Pro Plan Price to ₱99/month

**Admin UI**: Edit → Change "Monthly Price" to 99 → Save  
**Prisma Studio**: plans table → Pro row → monthly_price = 99  
**SQL**: `UPDATE plans SET monthly_price = 99 WHERE plan_type = 'PRO';`

### Add a New Feature

**Admin UI**: Edit → Add Feature → Enter text → Save  
**API**: Include feature in the `features` array when updating

### Enable a 30% Discount

**Admin UI**: Edit → Discount Percent = 30, Discount Label = "30% OFF" → Save

### Hide a Plan Temporarily

**Admin UI**: Edit → Uncheck "Active" → Save

### Change Display Order

**Admin UI**: Edit → Change "Sort Order" (lower = first) → Save

## API Endpoints

### GET /api/plans

Fetch all active plans (public)

### GET /api/plans/admin

Fetch all plans including inactive (admin)

### PUT /api/plans/admin

Update a plan

### POST /api/plans/admin

Create a new plan

### DELETE /api/plans/admin?id={id}

Delete a plan

## Files Changed

```
✅ prisma/schema.prisma        - Added Plan model
✅ prisma/seed.ts              - Initial plan data
✅ service/subscription.service.ts - Now uses DB
✅ src/app/api/plans/route.ts  - Public API
✅ src/app/api/plans/admin/route.ts - Admin API
✅ src/app/(authenticated)/upgrade/page.tsx - Dynamic page
✅ src/app/(authenticated)/admin/plans/page.tsx - Admin UI
✅ docs/DYNAMIC_PRICING.md     - Full documentation
✅ scripts/test-dynamic-pricing.ts - Test script
```

## Testing

### Run Tests

```bash
npx tsx scripts/test-dynamic-pricing.ts
```

### Manual Testing

1. ✅ Visit `/upgrade` - should show plans from database
2. ✅ Visit `/admin/plans` - should show management UI
3. ✅ Edit a price → refresh `/upgrade` → verify change
4. ✅ Toggle billing period → verify correct prices shown
5. ✅ Try checkout flow with a plan

## Important Notes

⚠️ **Admin endpoints are currently unprotected!**  
Before production, add authentication to `/api/plans/admin` routes.

💡 **Plans are cached for 5 minutes**  
Changes via API clear the cache automatically. Direct DB changes may take up to 5 minutes to reflect.

🔄 **Backup available**  
Your original hardcoded pricing page is saved at:  
`src/app/(authenticated)/upgrade/page-static-backup.tsx`

## Example: Black Friday Sale

Want to run a 50% off sale on all plans?

**Admin UI**:

1. Visit `/admin/plans`
2. Edit each paid plan
3. Set "Discount Percent" to 50
4. Set "Discount Label" to "🎉 BLACK FRIDAY - 50% OFF"
5. Save each plan

Done! The discount badge and crossed-out original prices will automatically appear on `/upgrade`.

## Need Help?

📖 Full documentation: `docs/DYNAMIC_PRICING.md`  
🧪 Test suite: `scripts/test-dynamic-pricing.ts`  
🎨 Admin UI: `http://localhost:3000/admin/plans`  
💾 Database UI: `npx prisma studio`

## What's Next?

Consider adding:

- [ ] Authentication for admin routes
- [ ] Email notifications when plans change
- [ ] Plan history/audit trail
- [ ] A/B testing different pricing
- [ ] Analytics on plan conversions
- [ ] Scheduled price changes
- [ ] Multi-currency support

---

**You're all set!** 🚀 Your pricing is now 100% flexible and database-driven.
