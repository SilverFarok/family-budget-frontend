import { NextResponse } from "next/server";

const PAYLOAD_BASE = process.env.PAYLOAD_URL!;

export async function POST(req: Request) {
    const body = await req.text();
    const cookie = req.headers.get("cookie") ?? "";

    const res = await fetch(`${PAYLOAD_BASE}/api/users/invite`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...(cookie ? { cookie } : {}),
        },
        body,
        credentials: "include",
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}
