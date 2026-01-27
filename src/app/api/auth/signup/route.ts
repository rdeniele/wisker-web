import { NextResponse } from "next/server";
import { signUp } from "../../../../../service/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await signUp(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
