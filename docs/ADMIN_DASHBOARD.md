# Admin Dashboard - Quick Guide

## 🎯 Overview

Your Wisker app now has a comprehensive admin dashboard with:

- **User management** - View and edit all users
- **Subscription control** - Grant free access, apply discounts
- **Early user tracking** - Automatically track first 50 users for 50% discount
- **Email marketing** - Export opted-in emails for campaigns
- **Analytics** - View user stats and plan distribution

## 🔐 Admin Access

Only these emails have admin access:

- `rondenielep13@gmail.com`
- Any email ending in `@wisker.app`
- Any email ending in `@acqron.com`

## 📍 Admin Pages

### Dashboard

**URL**: `http://localhost:3000/admin`

- View total users, early users, active subscriptions
- See plan distribution and recent signups
- Quick links to user and plan management

### User Management

**URL**: `http://localhost:3000/admin/users`

- View all users with search and filters
- Edit user subscriptions and plans
- Grant custom discounts
- Mark users as "early users"
- Add admin notes
- Export marketing emails

### Plan Management

**URL**: `http://localhost:3000/admin/plans`

- Edit plan pricing and features
- Toggle plan visibility
- Add promotional discounts

## 🎁 Early User Program

### How It Works

1. First 50 registered users automatically get "Early User" status
2. Early users receive **50% discount** on all paid plans
3. Each early user gets a number (1-50)
4. Tracked in the database for marketing campaigns

### Mark First 50 Users

```bash
npm run admin:mark-early-users
```

This command:

- Finds the first 50 users by registration date
- Marks them as early users with sequential numbers
- Safe to run multiple times (won't duplicate)

### Manual Override

Admins can manually mark/unmark users as early users via the Users page.

## 💰 Managing User Subscriptions

### Give a User Free Pro/Premium

1. Go to `/admin/users`
2. Click "Edit" on the user
3. Change "Plan Type" to Pro or Premium
4. Set "Subscription Status" to Active
5. Click "Save Changes"

### Apply Custom Discount

1. Edit the user
2. Set "Admin Discount (%)" to any percentage (0-100)
3. Example: 100 = completely free, 50 = half price
4. This discount stacks with early user discount

### Add Admin Notes

- Track special arrangements
- Note why a user got free access
- Record any customer support interactions

## 📧 Marketing Emails

### Export Email List

1. Go to `/admin/users`
2. Click "📧 Export Marketing Emails" button
3. Downloads a `.txt` file with all opted-in emails
4. One email per line, ready for import to email service

### Marketing Opt-In Status

- Users are **opted-in by default** when they sign up
- Green 📧 badge indicates opted-in users
- Track total opt-ins on the dashboard

## 📊 Dashboard Stats

### Metrics Tracked

- **Total Users** - All registered users
- **Early Users** - First 50 users (with progress bar)
- **Active Subscriptions** - Paid plans currently active
- **Marketing Opt-ins** - Users who consent to emails
- **Plan Distribution** - Free vs Pro vs Premium breakdown
- **Recent Users** - Last 5 signups

### Real-Time Updates

- Click "Refresh" button to reload stats
- Stats update automatically when you edit users

## 🛠️ Common Admin Tasks

### Task 1: Give VIP User Free Premium

```
1. Go to /admin/users
2. Search for user email
3. Click Edit
4. Plan Type: Premium
5. Subscription Status: Active
6. Admin Discount: 100
7. Admin Notes: "VIP - Lifetime free premium"
8. Save
```

### Task 2: Apply Launch Discount

```
1. Go to /admin/plans
2. Edit Pro plan
3. Discount Percent: 50
4. Discount Label: "🚀 Launch Special - 50% OFF"
5. Save
```

### Task 3: Export First 50 Users for Thank You Email

```
1. Go to /admin/users
2. Filter will show early users with ⭐ badge
3. Export marketing emails
4. Send personalized thank you campaign
```

### Task 4: Check Who's Paying

```
1. Go to /admin
2. View "Active Subscriptions" stat
3. Click "Manage Users"
4. Look for green "active" badges
```

## 🔧 API Endpoints

### Get Dashboard Stats

```bash
GET /api/admin/stats
```

### List All Users

```bash
GET /api/admin/users
```

### Update User

```bash
PUT /api/admin/users
Body: {
  userId: "uuid",
  planType: "PRO",
  subscriptionStatus: "active",
  adminDiscountPercent: 50,
  isEarlyUser: true,
  adminNotes: "Notes..."
}
```

### Grant Free Subscription

```bash
POST /api/admin/users
Body: {
  userId: "uuid",
  planType: "PREMIUM",
  durationMonths: 3
}
```

## 🔒 Security Notes

### Current Setup

- Admin access checked via email domain/whitelist
- No separate admin table (uses Supabase auth)
- Works for small team/early stage

### Before Production

Consider adding:

1. Separate admin role in database
2. Admin action audit logs
3. Rate limiting on admin endpoints
4. Two-factor authentication
5. Admin invite system

### Protecting Admin Routes

All admin API routes check for admin access:

```typescript
const { isAdmin } = await getAdminUser();
if (!isAdmin) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 403 },
  );
}
```

## 💡 Tips

1. **Track Everything**: Use admin notes liberally for customer context
2. **Export Early**: Back up email lists before major campaigns
3. **Be Generous**: Free access builds goodwill and referrals
4. **Monitor Daily**: Check dashboard daily for growth trends
5. **Early Users Matter**: These 50 people are your advocates

## 📝 Database Schema

### New User Fields

```prisma
isEarlyUser           Boolean   @default(false)
earlyUserNumber       Int?      // 1-50
adminDiscountPercent  Float?    // 0-100
adminNotes            String?   // Internal notes
marketingOptIn        Boolean   @default(true)
lastMarketingEmailAt  DateTime? // Track sends
```

## 🚀 Quick Start Checklist

- [ ] Run `npm run admin:mark-early-users` to set up first 50
- [ ] Visit `/admin` to see dashboard
- [ ] Try editing a user in `/admin/users`
- [ ] Export marketing emails
- [ ] Bookmark admin URLs for quick access

## 📞 Support

Need help?

- Check API responses in browser console
- Verify admin email in code: `src/lib/admin-auth.ts`
- Test with: Your wisker.app email should work instantly

---

**Remember**: With great power comes great responsibility. Be fair, be generous, and take care of your early users! 🎉
