/**
 * Admin audit log API Route
 * Read-only, paginated view of admin actions (the log is append-only).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { paginationSchema, validateRequest } from "@/lib/validation";
import { listAudit } from "@/service/audit.service";

const querySchema = paginationSchema.extend({
  action: z.string().trim().max(60).optional(),
  q: z.string().trim().max(200).optional(),
  targetId: z.string().trim().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
    const params = Object.fromEntries(
      [...request.nextUrl.searchParams].filter(([, v]) => v !== ""),
    );
    const query = validateRequest(querySchema, params);
    const { total, items } = await listAudit(query);
    return successResponse({
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: items.map((e) => ({
        id: e.id,
        actorEmail: e.actorEmail,
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        targetLabel: e.targetLabel,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
