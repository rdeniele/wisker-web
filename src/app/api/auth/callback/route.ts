import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { userService } from "@/service/user.service";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL(
          "/login?message=Authentication failed. Please try again.",
          requestUrl.origin,
        ),
      );
    }

    // Create or update user in Prisma database
    if (data.user) {
      try {
        // Check if user exists in database
        const existingUser = await userService.getUserById(data.user.id);
        console.log("User already exists:", existingUser.email);
      } catch (_err) {
        // User doesn't exist, create them
        try {
          const newUser = await userService.createUser(
            data.user.email || data.user.id,
            "FREE",
            data.user.id, // Pass Supabase user ID
          );
          console.log("Created new user in database:", newUser.email);
        } catch (createError) {
          console.error("Failed to create user in database:", createError);
          // Continue anyway - the user is authenticated in Supabase
        }
      }
    }

    // Handle password recovery flow
    // if (type === "recovery") {
    //     return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
    // }

    // Successful authentication - redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  // No code present, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
