/**
 * Admin Users API Route
 * Manage users and their subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/lib/admin-auth';
import { PlanType } from '@prisma/client';

// GET all users
export async function GET() {
  try {
    // Check admin access
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        planType: true,
        subscriptionStatus: true,
        dailyCredits: true,
        creditsUsedToday: true,
        isEarlyUser: true,
        earlyUserNumber: true,
        adminDiscountPercent: true,
        adminNotes: true,
        marketingOptIn: true,
        createdAt: true,
        subscriptionEndDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT - Update a user
export async function PUT(request: NextRequest) {
  try {
    // Check admin access
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
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
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the plan configuration for the new plan type
    const plan = await prisma.plan.findFirst({
      where: { planType: planType as PlanType },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // If marking as early user, assign the next early user number
    let earlyUserNumber: number | undefined;
    if (isEarlyUser) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isEarlyUser: true, earlyUserNumber: true },
      });

      // Only assign number if not already an early user
      if (!currentUser?.isEarlyUser) {
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// POST - Grant free subscription
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const { isAdmin } = await getAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, planType, durationMonths } = body;

    if (!userId || !planType) {
      return NextResponse.json(
        { success: false, error: 'User ID and plan type are required' },
        { status: 400 }
      );
    }

    // Get the plan configuration
    const plan = await prisma.plan.findFirst({
      where: { planType: planType as PlanType },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
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
        subscriptionStatus: 'active',
        subscriptionPeriod: 'monthly',
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        dailyCredits: plan.dailyCredits,
        notesLimit: plan.notesLimit,
        subjectsLimit: plan.subjectsLimit,
        adminNotes: `Free ${planType} subscription granted by admin for ${durationMonths || 1} month(s)`,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error granting free subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant subscription' },
      { status: 500 }
    );
  }
}
