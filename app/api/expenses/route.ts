import { NextResponse } from "next/server";

const PAYLOAD_BASE = process.env.PAYLOAD_URL!;

export async function GET(req: Request) {
    const url = new URL(req.url);
    const qs = url.searchParams.toString();
    const cookie = req.headers.get("cookie") ?? "";

    const res = await fetch(`${PAYLOAD_BASE}/api/expenses${qs ? `?${qs}` : ""}`, {
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

export async function POST(req: Request) {
    const body = await req.text();
    const cookie = req.headers.get("cookie") ?? "";

    const res = await fetch(`${PAYLOAD_BASE}/api/expenses`, {
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
