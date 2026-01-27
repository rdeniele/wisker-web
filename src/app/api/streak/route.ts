import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getStreakData } from '@/service/streak.service';

/**
 * GET /api/streak
 * Get user's streak data
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const streakData = await getStreakData(user.id);

    return NextResponse.json({
      success: true,
      data: streakData,
    });
  } catch (error) {
    console.error('Get streak error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get streak data',
      },
      { status: 500 }
    );
  }
}
