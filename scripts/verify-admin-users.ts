/**
 * Smoke-tests the admin user list/detail queries against the real database
 * (read-only): pagination, sorting, filters and the detail view.
 *   npx tsx scripts/verify-admin-users.ts
 */
import "dotenv/config";
import { getUserDetail, listUsers } from "@/service/admin-users.service";

async function main() {
  const base = { sort: "createdAt", dir: "desc", page: 1, pageSize: 10 } as const;
  const all = await listUsers(base);
  console.log("total", all.total, "summary", all.summary, "page rows", all.users.length);

  const page2 = await listUsers({ ...base, pageSize: 10, page: 2 });
  const ids = new Set([...all.users, ...page2.users].map((u) => u.id));
  console.log("pages don't overlap:", ids.size === all.users.length + page2.users.length);

  const pro = await listUsers({ ...base, plan: "PRO" });
  console.log("PRO filter:", pro.total, "all PRO:", pro.users.every((u) => u.planType === "PRO"));

  const search = await listUsers({ ...base, q: all.users[0].email.slice(0, 6).toUpperCase() });
  console.log("search (case-insensitive) finds first user:", search.users.some((u) => u.id === all.users[0].id));

  const injected = await listUsers({ ...base, q: "'; DROP TABLE users; --" });
  console.log("injection-shaped search is inert:", injected.total === 0);

  const byActive = await listUsers({ ...base, sort: "lastActive", dir: "desc" });
  console.log("lastActive order:", byActive.users.slice(0, 3).map((u) => u.lastActiveAt));

  const detail = await getUserDetail(all.users[0].id);
  console.log("detail:", { usage: detail.usage, auth: detail.auth, activity: detail.activity.length, payments: detail.payments.length });
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
