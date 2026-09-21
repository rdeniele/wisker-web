import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { createClient } from "@/lib/supabase/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Check if DATABASE_URL is configured
if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL === "your-supabase-database-url-here"
) {
  throw new Error(
    "DATABASE_URL is not configured. Please set it in your .env.local file.\n" +
      "Get your database URL from: Supabase Dashboard → Settings → Database → Connection String (Direct connection)",
  );
}

// Create a shared pool for the default Prisma client (admin access)
//
// The Supabase pooler only has a handful of client slots (15 on the session
// pooler) shared by every instance of the app, so keep each instance's pool
// small and let idle connections go instead of hoarding slots. Override with
// DB_POOL_MAX when running against a bigger pooler.
const poolMax = Number.parseInt(process.env.DB_POOL_MAX ?? "", 10) || 5;
const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: poolMax,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

// Default Prisma client with admin access (bypasses RLS)
// Use this only in API routes where you need admin operations
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Only log errors in production, log queries only in development if DEBUG is set
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : process.env.DEBUG?.includes("prisma")
          ? ["query", "error", "warn"]
          : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

/**
 * Get a Prisma client with RLS enabled for the current authenticated user.
 * This creates a connection with the user's JWT, so RLS policies apply.
 *
 * @returns PrismaClient configured for the authenticated user
 * @throws Error if user is not authenticated
 */
export async function getPrismaWithRLS(): Promise<PrismaClient> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User not authenticated");
  }

  // Parse the DATABASE_URL and add the JWT
  const dbUrl = new URL(process.env.DATABASE_URL!);
  const searchParams = dbUrl.search || "";
  const connectionString = `postgresql://${dbUrl.username}:${dbUrl.password}@${dbUrl.host}${dbUrl.pathname}${searchParams}`;

  // Create a new pool with the user's JWT in the connection options
  const userPool = new pg.Pool({
    connectionString,
    // Set PostgreSQL session variables for RLS
    application_name: "wisker-rls",
    options: `--search_path=public -c request.jwt.claim.sub=${session.user.id}`,
  });

  const userAdapter = new PrismaPg(userPool);

  return new PrismaClient({
    adapter: userAdapter,
    log: ["error"],
  });
}
