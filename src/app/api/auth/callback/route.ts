import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    // const type = requestUrl.searchParams.get("type");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Auth callback error:", error);
            return NextResponse.redirect(
                new URL("/login?message=Authentication failed. Please try again.", requestUrl.origin)
            );
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
