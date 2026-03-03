import { NextResponse } from "next/server";

const PAYLOAD_BASE = process.env.PAYLOAD_URL!;

export async function GET(req: Request) {
    const cookie = req.headers.get("cookie") ?? "";

    const res = await fetch(`${PAYLOAD_BASE}/api/users/connections`, {
        cache: "no-store",
        headers: cookie ? { cookie } : undefined,
        credentials: "include",
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}
