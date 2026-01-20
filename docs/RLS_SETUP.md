# Row Level Security (RLS) Setup

## What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access in database tables. Even if someone gains access to your database credentials, RLS ensures they can only see their own data.

## Current Setup

✅ **RLS is now ENABLED** on all tables:

- `users`
- `subjects`
- `notes`
- `learning_tools`
- `learning_tool_notes`

## How to Use

### Option 1: Use Default Prisma Client (Bypasses RLS)

```typescript
import { prisma } from "@/lib/prisma";

// This bypasses RLS - use only when you need admin operations
// Make sure to manually filter by userId!
const subjects = await prisma.subject.findMany({
  where: { userId: session.user.id }, // ⚠️ MUST filter manually
});
```

### Option 2: Use RLS-Enabled Client (Recommended)

```typescript
import { getPrismaWithRLS } from "@/lib/prisma";

// This respects RLS policies - database enforces user isolation
const prismaWithRLS = await getPrismaWithRLS();
const subjects = await prismaWithRLS.subject.findMany();
// No need to filter by userId - RLS does it automatically!
```

## Migration Applied

Migration `20260120075713_enable_rls` has been applied, which:

1. **Enabled RLS** on all tables
2. **Created policies** for each table:
   - Users can only view/update their own user record
   - Users can only access subjects they own
   - Users can only access notes from their subjects
   - Users can only access learning tools from their subjects/notes

## Security Benefits

- ✅ **Defense in depth**: Even with leaked credentials, users can't access others' data
- ✅ **Automatic enforcement**: Database enforces isolation, not just application code
- ✅ **Prevents bugs**: If you forget to filter by `userId`, RLS still protects you

## Important Notes

### Using `getPrismaWithRLS()`:

- Requires authenticated user (uses Supabase JWT)
- Creates a new connection per call - use sparingly
- Best for read operations where you want automatic user filtering
- **DO NOT** use in loops - create once and reuse

### Using default `prisma` client:

- Bypasses RLS (uses service role credentials)
- **MUST** manually filter by `userId` in all queries
- Best for admin operations or when you need full database access
- Slightly faster (reuses connection pool)

## Example API Route

```typescript
import { prisma, getPrismaWithRLS } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  // Authenticate user
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Option 1: Manual filtering (current approach)
  const subjects = await prisma.subject.findMany({
    where: { userId: session.user.id },
  });

  // Option 2: RLS-enabled (database enforces)
  const prismaWithRLS = await getPrismaWithRLS();
  const subjects = await prismaWithRLS.subject.findMany();
  // No where clause needed!

  return Response.json({ subjects });
}
```

## Migration Files

- **Created**: `prisma/migrations/20260120075713_enable_rls/migration.sql`
- **Reference**: `scripts/enable-rls.sql` (same SQL for manual application)

## Testing RLS

To verify RLS is working:

1. Create a subject as User A
2. Try to access it as User B using direct SQL:
   ```sql
   SELECT * FROM subjects WHERE id = '<subject-id>';
   ```
3. Should return empty result set (RLS blocks access)

## Performance Note

RLS policies use `EXISTS` subqueries which are generally fast, but for high-traffic routes consider:

- Using the default `prisma` client with manual filtering (what you're doing now)
- Adding indexes on foreign keys (already present)
- Monitoring query performance

## Rollback (if needed)

To disable RLS:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tool_notes DISABLE ROW LEVEL SECURITY;
```

But **don't disable RLS in production** - it's your last line of defense!
