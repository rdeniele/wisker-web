import { createClient } from "@/lib/supabase/server";
import { userService } from "@/service/user.service";
import { NotFoundError } from "@/lib/errors";
import { User } from "@supabase/supabase-js";

/**
 * Get the authenticated user and ensure they exist in the Prisma database.
 * If the user doesn't exist in Prisma, they will be created automatically.
 *
 * @throws Error if user is not authenticated
 * @returns The authenticated Supabase user
 */
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Ensure user exists in Prisma database (sync if needed)
  try {
    await userService.getUserById(user.id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      // User doesn't exist in Prisma, create them
      try {
        // Get T&C acceptance from user metadata if available
        const acceptedTerms = user.user_metadata?.accepted_terms || false;
        const acceptedPrivacy = user.user_metadata?.accepted_privacy || false;

        await userService.createUser(
          user.email || user.id,
          "FREE",
          user.id,
          acceptedTerms,
          acceptedPrivacy,
        );
      } catch (createError) {
        console.error(`Failed to create user ${user.id}:`, createError);
        throw createError;
      }
    } else {
      console.error(`Database error while fetching user ${user.id}:`, error);
      throw error;
    }
  }

  return user;
}
