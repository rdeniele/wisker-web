/**
 * Admin audit log: an append-only record of who changed what in the admin area.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuditActor {
  id?: string | null;
  email: string;
}

export interface AuditEntryInput {
  actor: AuditActor;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Write an audit entry. Audit failures are logged but never block the admin
 * action that was already performed.
 */
export async function recordAudit(entry: AuditEntryInput): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actor.id ?? null,
        actorEmail: entry.actor.email,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel ?? null,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to write admin audit log:", error);
  }
}

/** Fields worth diffing for the audit trail: only what actually changed. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): { before: Prisma.InputJsonObject; after: Prisma.InputJsonObject } {
  const json = (v: unknown): Prisma.InputJsonValue | null =>
    v instanceof Date ? v.toISOString() : ((v ?? null) as Prisma.InputJsonValue | null);
  const b: Record<string, Prisma.InputJsonValue | null> = {};
  const a: Record<string, Prisma.InputJsonValue | null> = {};
  for (const key of Object.keys(after) as Array<keyof T & string>) {
    if (after[key] === undefined) continue;
    const prev = before[key];
    const next = after[key];
    const same =
      prev instanceof Date && next instanceof Date
        ? prev.getTime() === next.getTime()
        : prev === next;
    if (!same) {
      b[key] = json(prev);
      a[key] = json(next);
    }
  }
  return { before: b, after: a };
}

export interface AuditQuery {
  page: number;
  pageSize: number;
  action?: string;
  q?: string;
  targetId?: string;
}

export async function listAudit(query: AuditQuery) {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (query.action) where.action = { startsWith: query.action };
  if (query.targetId) where.targetId = query.targetId;
  if (query.q) {
    where.OR = [
      { actorEmail: { contains: query.q, mode: "insensitive" } },
      { targetLabel: { contains: query.q, mode: "insensitive" } },
      { action: { contains: query.q, mode: "insensitive" } },
    ];
  }
  const [total, items] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { total, items };
}
