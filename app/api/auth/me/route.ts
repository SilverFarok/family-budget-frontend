import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const PAYLOAD_BASE = process.env.PAYLOAD_URL!;
        const cookie = req.headers.get("cookie") ?? "";

        const res = await fetch(`${PAYLOAD_BASE}/api/users/me`, {
            headers: {
                cookie,
            },
            credentials: "include",
            cache: "no-store",
        });

        const text = await res.text();

        return new NextResponse(text, {
            status: res.status,
            headers: {
                "content-type": "application/json",
                "set-cookie": res.headers.get("set-cookie") ?? "",
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Auth me failed" },
            { status: 500 }
        );
    }
}
