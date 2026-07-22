import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/user/sync
 * Sync the current authenticated Supabase user to Prisma database
 */
export async function POST(_request: NextRequest) {
  try {
    // Get authenticated user (supports both web cookies and mobile Bearer token)
    const user = await getAuthenticatedUser();

    // Check if user exists in Prisma
    let prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!prismaUser) {
      // Create user in Prisma database
      prismaUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
        },
      });
    }

    return successResponse(prismaUser, 200);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
