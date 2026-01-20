import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { createClient } from '@/lib/supabase/server'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'your-supabase-database-url-here') {
  throw new Error(
    'DATABASE_URL is not configured. Please set it in your .env.local file.\n' +
    'Get your database URL from: Supabase Dashboard → Settings → Database → Connection String (Direct connection)'
  );
}

// Create a shared pool for the default Prisma client (admin access)
const pool = globalForPrisma.pool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

// Default Prisma client with admin access (bypasses RLS)
// Use this only in API routes where you need admin operations
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

/**
 * Get a Prisma client with RLS enabled for the current authenticated user.
 * This creates a connection with the user's JWT, so RLS policies apply.
 * 
 * @returns PrismaClient configured for the authenticated user
 * @throws Error if user is not authenticated
 */
export async function getPrismaWithRLS(): Promise<PrismaClient> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('User not authenticated');
  }

  // Parse the DATABASE_URL and add the JWT
  const dbUrl = new URL(process.env.DATABASE_URL!);
  const searchParams = dbUrl.search || '';
  const connectionString = `postgresql://${dbUrl.username}:${dbUrl.password}@${dbUrl.host}${dbUrl.pathname}${searchParams}`;
  
  // Create a new pool with the user's JWT in the connection options
  const userPool = new pg.Pool({
    connectionString,
    // Set PostgreSQL session variables for RLS
    application_name: 'wisker-rls',
    options: `--search_path=public -c request.jwt.claim.sub=${session.user.id}`,
  });

  const userAdapter = new PrismaPg(userPool);
  
  return new PrismaClient({
    adapter: userAdapter,
    log: ['error'],
  });
}
