/**
 * Admin Stats API Route
 * Provides dashboard statistics for admin panel
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-auth";

export async function GET() {
  try {
    // Check admin access
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get early users count
    const earlyUsers = await prisma.user.count({
      where: { isEarlyUser: true },
    });

    // Get plan distribution
    const planCounts = await prisma.user.groupBy({
      by: ["planType"],
      _count: true,
    });

    const freeUsers =
      planCounts.find((p) => p.planType === "FREE")?._count || 0;
    const proUsers = planCounts.find((p) => p.planType === "PRO")?._count || 0;
    const premiumUsers =
      planCounts.find((p) => p.planType === "PREMIUM")?._count || 0;

    // Get active subscriptions
    const activeSubscriptions = await prisma.user.count({
      where: {
        subscriptionStatus: "active",
        planType: { not: "FREE" },
      },
    });

    // Get marketing opt-ins
    const marketingOptIns = await prisma.user.count({
      where: { marketingOptIn: true },
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        email: true,
        planType: true,
        createdAt: true,
      },
    });

    // Calculate total revenue (placeholder - would need payment records)
    const totalRevenue = 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        earlyUsers,
        freeUsers,
        proUsers,
        premiumUsers,
        activeSubscriptions,
        marketingOptIns,
        totalRevenue,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
