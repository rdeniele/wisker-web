import { NextResponse } from "next/server";
import { signIn } from "../../../../../service/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await signIn(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Always answer with JSON. An uncaught throw becomes an HTML error page,
    // which the login form can't parse.
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: "We couldn't sign you in right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
