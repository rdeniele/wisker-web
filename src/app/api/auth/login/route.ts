import { NextResponse } from "next/server";
import { signIn } from "../../../../../service/auth.service";

export async function POST(req: Request) {
    const body = await req.json();
    const result = await signIn(body);

    if (!result.success) {
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
}