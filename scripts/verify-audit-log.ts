/**
 * Writes, lists and filters audit entries, then deletes the ones it created.
 *   npx tsx scripts/verify-audit-log.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { diffFields, listAudit, recordAudit } from "@/service/audit.service";

const ACTOR = "verify-audit@example.invalid";
let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`);
};

async function main() {
  try {
    const diff = diffFields(
      { planType: "FREE", adminNotes: null, isEarlyUser: false } as Record<string, unknown>,
      { planType: "PRO", adminNotes: null, isEarlyUser: false },
    );
    check("diff keeps only changed fields", diff, { before: { planType: "FREE" }, after: { planType: "PRO" } });

    await recordAudit({ actor: { email: ACTOR }, action: "user.update", targetType: "user", targetId: "u-1", targetLabel: "someone@example.invalid", metadata: diff });
    await recordAudit({ actor: { email: ACTOR }, action: "promo.create", targetType: "promo_code", targetLabel: "TESTCODE" });

    const all = await listAudit({ page: 1, pageSize: 10, q: ACTOR });
    check("search by actor finds both", all.total, 2);
    check("newest first", all.items.map((i) => i.action), ["promo.create", "user.update"]);
    const users = await listAudit({ page: 1, pageSize: 10, action: "user.", q: ACTOR });
    check("action prefix filter", users.items.map((i) => i.action), ["user.update"]);
    const byTarget = await listAudit({ page: 1, pageSize: 10, targetId: "u-1" });
    check("target filter", byTarget.items.some((i) => i.actorEmail === ACTOR), true);
    const page = await listAudit({ page: 2, pageSize: 1, q: ACTOR });
    check("pagination", [page.total, page.items.length], [2, 1]);
  } finally {
    const del = await prisma.adminAuditLog.deleteMany({ where: { actorEmail: ACTOR } });
    console.log(`cleanup: removed ${del.count} test rows`);
    await prisma.$disconnect();
  }
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
