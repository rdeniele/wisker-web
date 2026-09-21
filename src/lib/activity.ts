/**
 * Records that a user was active, at hour granularity, for admin analytics.
 *
 * Called from the authenticated request path, so it must never slow a request
 * down or fail one: the write is fire-and-forget, deduplicated in memory to at
 * most one INSERT per user per hour per server instance, and any error (for
 * example the table not being migrated yet) is swallowed.
 */
import { prisma } from "@/lib/prisma";

const seen = new Map<string, number>(); // "userId" -> hour bucket last written
let disabledUntil = 0;

export function trackActivity(userId: string): void {
  const now = Date.now();
  if (now < disabledUntil) return;

  const hour = Math.floor(now / 3_600_000);
  if (seen.get(userId) === hour) return;
  seen.set(userId, hour);

  // Keep the map bounded on long-lived instances.
  if (seen.size > 5_000) {
    for (const [id, h] of seen) if (h !== hour) seen.delete(id);
  }

  // Columns are UTC-naive timestamps: pass an explicit instant and convert.
  const hourStart = new Date(hour * 3_600_000).toISOString();
  prisma
    .$executeRaw`INSERT INTO user_activity (user_id, hour_start) VALUES (${userId}, ${hourStart}::timestamptz AT TIME ZONE 'UTC') ON CONFLICT DO NOTHING`
    .catch((error: unknown) => {
      seen.delete(userId);
      // Back off for a few minutes rather than failing on every request.
      disabledUntil = Date.now() + 5 * 60_000;
      console.error("Failed to record user activity:", error);
    });
}
