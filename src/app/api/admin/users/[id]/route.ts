/**
 * Admin single-user API Route
 * GET   - full detail: profile, subscription, usage, activity, payments, audit trail
 * PATCH - account controls (suspend / reactivate)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { validateRequest } from "@/lib/validation";
import { getUserDetail, setSuspended } from "@/service/admin-users.service";
import { recordAudit } from "@/service/audit.service";
import { clearAnalyticsCache } from "@/service/analytics.service";

const idSchema = z.string().uuid("Invalid user ID");

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal("reactivate") }),
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdmin();
    const id = validateRequest(idSchema, (await params).id);
    return successResponse(await getUserDetail(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await assertAdmin();
    const id = validateRequest(idSchema, (await params).id);
    const body = validateRequest(patchSchema, await request.json().catch(() => null));

    const result = await setSuspended({
      userId: id,
      suspend: body.action === "suspend",
      reason: body.action === "suspend" ? body.reason : undefined,
      actorId: admin.id,
    });

    await recordAudit({
      actor: admin,
      action: body.action === "suspend" ? "user.suspend" : "user.reactivate",
      targetType: "user",
      targetId: id,
      targetLabel: result.email,
      metadata: {
        ...(body.action === "suspend" && body.reason ? { reason: body.reason } : {}),
        authBanApplied: result.authBanApplied,
      },
    });
    clearAnalyticsCache();

    return successResponse({ ok: true, authBanApplied: result.authBanApplied });
  } catch (error) {
    return errorResponse(error);
  }
}
