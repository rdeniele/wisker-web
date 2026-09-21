/**
 * Admin analytics API
 * One request feeds the whole dashboard: KPIs with period comparison,
 * series, funnel, cohorts, revenue and product breakdowns.
 */

import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { resolveRange } from "@/lib/admin-range";
import { errorResponse } from "@/lib/api-response";
import { getAnalytics } from "@/service/analytics.service";

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();

    const p = request.nextUrl.searchParams;
    const range = resolveRange({
      range: p.get("range"),
      from: p.get("from"),
      to: p.get("to"),
      tz: p.get("tz"),
    });
    const data = await getAnalytics(range, { refresh: p.get("refresh") === "1" });

    // Admin-only, per-request data: never let a shared cache store it.
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
