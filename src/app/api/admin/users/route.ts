/**
 * Admin Users API Route
 * Search / filter / sort / paginate users, and manage their subscriptions.
 * Every change is written to the admin audit log.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertAdmin, getAdminUser } from "@/lib/admin-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { paginationSchema, validateRequest } from "@/lib/validation";
import { PlanType } from "@prisma/client";
import { diffFields, recordAudit } from "@/service/audit.service";
import { clearAnalyticsCache } from "@/service/analytics.service";
import {
  listMarketingEmails,
  listUsers,
  USER_SORTS,
} from "@/service/admin-users.service";

const listQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  plan: z.enum(["FREE", "PRO", "PREMIUM"]).optional(),
  account: z.enum(["active", "suspended"]).optional(),
  activity: z.enum(["active7", "dormant30", "never"]).optional(),
  sort: z.enum(USER_SORTS).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  export: z.literal("marketing").optional(),
});

// GET - Paginated, filtered, sorted users (or ?export=marketing for opt-in emails)
export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdmin();

    const params = Object.fromEntries(
      [...request.nextUrl.searchParams].filter(([, v]) => v !== ""),
    );
    const { export: exportKind, ...query } = validateRequest(listQuerySchema, params);

    if (exportKind === "marketing") {
      const emails = await listMarketingEmails();
      await recordAudit({
        actor: admin,
        action: "users.export_marketing_emails",
        targetType: "users",
        metadata: { count: emails.length },
      });
      return new NextResponse(emails.join("\n"), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-store",
        },
      });
    }

    const result = await listUsers(query);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT - Update a user
export async function PUT(request: NextRequest) {
  try {
    // Check admin access
    const { user: actor, isAdmin } = await getAdminUser();
    if (!isAdmin || !actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      userId,
      planType,
      subscriptionStatus,
      adminDiscountPercent,
      adminNotes,
      isEarlyUser,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    if (
      adminDiscountPercent !== null &&
      adminDiscountPercent !== undefined &&
      !(typeof adminDiscountPercent === "number" &&
        adminDiscountPercent >= 0 &&
        adminDiscountPercent <= 100)
    ) {
      return NextResponse.json(
        { success: false, error: "Discount must be between 0 and 100" },
        { status: 400 },
      );
    }

    // Get the plan configuration for the new plan type
    const plan = await prisma.plan.findFirst({
      where: { planType: planType as PlanType },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Invalid plan type" },
        { status: 400 },
      );
    }

    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        planType: true,
        subscriptionStatus: true,
        adminDiscountPercent: true,
        adminNotes: true,
        isEarlyUser: true,
        earlyUserNumber: true,
      },
    });
    if (!before) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // If marking as early user, assign the next early user number
    let earlyUserNumber: number | undefined;
    if (isEarlyUser) {
      // Only assign number if not already an early user
      if (!before.isEarlyUser) {
        const maxEarlyUserNumber = await prisma.user.aggregate({
          _max: { earlyUserNumber: true },
          where: { isEarlyUser: true },
        });

        const nextNumber = (maxEarlyUserNumber._max.earlyUserNumber || 0) + 1;

        // Only assign if we haven't reached 50
        if (nextNumber <= 50) {
          earlyUserNumber = nextNumber;
        }
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        planType: planType as PlanType,
        subscriptionStatus,
        dailyCredits: plan.dailyCredits,
        notesLimit: plan.notesLimit,
        subjectsLimit: plan.subjectsLimit,
        adminDiscountPercent,
        adminNotes,
        isEarlyUser,
        ...(earlyUserNumber !== undefined && { earlyUserNumber }),
        // If removing early user status, clear the number
        ...(!isEarlyUser && { earlyUserNumber: null }),
      },
    });

    const changes = diffFields(before, {
      planType: updatedUser.planType,
      subscriptionStatus: updatedUser.subscriptionStatus,
      adminDiscountPercent: updatedUser.adminDiscountPercent,
      adminNotes: updatedUser.adminNotes,
      isEarlyUser: updatedUser.isEarlyUser,
    });
    await recordAudit({
      actor: { id: actor.id, email: actor.email ?? "" },
      action: "user.update",
      targetType: "user",
      targetId: userId,
      targetLabel: before.email,
      metadata: changes,
    });
    clearAnalyticsCache();

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// POST - Grant free subscription
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const { user: actor, isAdmin } = await getAdminUser();
    if (!isAdmin || !actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, planType, durationMonths } = body;

    if (!userId || !planType) {
      return NextResponse.json(
        { success: false, error: "User ID and plan type are required" },
        { status: 400 },
      );
    }

    // Get the plan configuration
    const plan = await prisma.plan.findFirst({
      where: { planType: planType as PlanType },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Invalid plan type" },
        { status: 400 },
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

    // Update the user with free subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        planType: planType as PlanType,
        subscriptionStatus: "active",
        subscriptionPeriod: "monthly",
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        dailyCredits: plan.dailyCredits,
        notesLimit: plan.notesLimit,
        subjectsLimit: plan.subjectsLimit,
        adminNotes: `Free ${planType} subscription granted by admin for ${durationMonths || 1} month(s)`,
      },
    });

    await recordAudit({
      actor: { id: actor.id, email: actor.email ?? "" },
      action: "user.grant_subscription",
      targetType: "user",
      targetId: userId,
      targetLabel: updatedUser.email,
      metadata: { planType, durationMonths: durationMonths || 1, endsAt: endDate.toISOString() },
    });
    clearAnalyticsCache();

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error granting free subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to grant subscription" },
      { status: 500 },
    );
  }
}
