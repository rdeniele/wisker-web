import { NextResponse } from "next/server";
import { signUp } from "../../../../../service/auth.service";

export async function POST(req: Request) {
    const body = await req.json();
    const result = await signUp(body);

    if (!result.success) {
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
}