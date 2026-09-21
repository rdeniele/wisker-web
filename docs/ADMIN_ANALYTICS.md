# Admin analytics dashboard

`/admin` is a business-intelligence and operations dashboard. Every figure comes from the
database; nothing is estimated or mocked, and metrics the data can't support say so on screen.

## What feeds it

| Source | Used for |
| --- | --- |
| `users`, `subjects`, `notes`, `learning_tools` | signups, content created, feature usage, activity from before visit tracking existed |
| `user_activity` (new) | authenticated visits, one row per user per UTC hour, written from `getAuthenticatedUser()` |
| `payment_transactions` (new) | revenue, failed payments, refunds, MRR/ARR, LTV. Filled by PayMongo webhooks (`checkout_session.payment.paid`, `payment.failed`, `payment.refunded`) and by `/api/payments/verify` |
| `admin_audit_logs` (new) | who changed what in the admin area (`/admin/audit`) |
| `auth.users` (Supabase) | sign-up provider, unverified emails, accounts that never entered the app, last sign-in |
| `ai_operation_logs` | AI usage and cost. Nothing writes to it today, so the dashboard reports it as unavailable |

**Active user** = any recorded activity in the period: a visit, or creating a subject, note or
study tool, or an AI operation. Visit tracking began on the day the migration was applied;
earlier activity is inferred from content creation and is therefore a lower bound.

**Revenue** is only ever the sum of ledger rows. Paid plans are split into *paying* (a recorded
payment still covers today), *promo* and *granted/unrecorded*; only paying ones count toward MRR.

## Setup

```bash
npx prisma migrate deploy   # applies 20260921120000_add_admin_analytics
```

The migration is additive and idempotent (new tables, `suspended_at` columns, indexes, RLS on
the new tables). Set `SUPABASE_SERVICE_ROLE_KEY` so suspending a user also bans them in Supabase Auth.
Optional: `DB_POOL_MAX` (default 5) caps this instance's Postgres connections.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/admin/analytics?range=today\|7d\|30d\|90d\|12m\|custom&from=&to=&tz=&refresh=1` | whole dashboard in one response |
| `GET /api/admin/users?q=&plan=&account=&activity=&sort=&dir=&page=&pageSize=` | server-side search/filter/sort/pagination |
| `GET/PATCH /api/admin/users/:id` | detail view; `{action: "suspend" \| "reactivate"}` |
| `GET /api/admin/audit` | paginated audit log |

All admin endpoints require a confirmed admin email. Responses are `private, no-store`. Results
are cached for 60 s per server instance (keyed by timezone and range, de-duplicated while in
flight) and cleared when an admin changes a user. `refresh=1` bypasses the cache.

Ranges are calendar-aligned in the viewer's timezone. The comparison period is the same length,
shifted back by one period, and covers the same elapsed time while the current period is in progress.

## Verifying the numbers

These scripts recompute the figures from raw rows with independent code and compare:

```bash
npx tsx scripts/verify-admin-analytics.ts 12m Asia/Manila
npx tsx scripts/verify-admin-analytics.ts custom America/New_York 2026-03-01 2026-05-15
npx tsx scripts/verify-admin-users.ts
npx tsx scripts/verify-payment-ledger.ts   # inserts synthetic ledger rows, then deletes them
npx tsx scripts/verify-audit-log.ts        # inserts synthetic audit rows, then deletes them
```
