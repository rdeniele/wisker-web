/**
 * Admin Plans API Route
 * Manage subscription plans (CRUD operations)
 * 
 * NOTE: This should be protected by admin authentication in production!
 * For now, it's open for development purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlanType } from '@prisma/client';
import { clearPlanConfigsCache } from '@/service/subscription.service';

// GET all plans (including inactive)
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch plans',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      planType,
      displayName,
      description,
      monthlyPrice,
      yearlyPrice,
      dailyCredits,
      notesLimit,
      subjectsLimit,
      features,
      isActive,
      sortOrder,
      isMostPopular,
      discountPercent,
      discountLabel,
    } = body;

    // Validate required fields
    if (!name || !planType || !displayName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, planType, displayName',
        },
        { status: 400 }
      );
    }

    // Create the plan
    const plan = await prisma.plan.create({
      data: {
        name,
        planType: planType as PlanType,
        displayName,
        description,
        monthlyPrice: monthlyPrice || 0,
        yearlyPrice: yearlyPrice || 0,
        dailyCredits: dailyCredits || 10,
        notesLimit: notesLimit || 50,
        subjectsLimit: subjectsLimit || 10,
        features: features || [],
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
        isMostPopular: isMostPopular || false,
        discountPercent,
        discountLabel,
      },
    });

    // Clear cache
    clearPlanConfigsCache();

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error: unknown) {
    console.error('Error creating plan:', error);
    
    // Handle unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'A plan with this name or type already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create plan',
      },
      { status: 500 }
    );
  }
}

// PUT - Update a plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan ID is required',
        },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Clear cache
    clearPlanConfigsCache();

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error: unknown) {
    console.error('Error updating plan:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update plan',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan ID is required',
        },
        { status: 400 }
      );
    }

    await prisma.plan.delete({
      where: { id },
    });

    // Clear cache
    clearPlanConfigsCache();

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting plan:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete plan',
      },
      { status: 500 }
    );
  }
}
