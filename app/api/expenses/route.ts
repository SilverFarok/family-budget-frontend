import { NextResponse } from "next/server";

const PAYLOAD_BASE = process.env.PAYLOAD_URL!;

export async function GET(req: Request) {
    const url = new URL(req.url);
    const qs = url.searchParams.toString();

    const res = await fetch(`${PAYLOAD_BASE}/api/expenses${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}

export async function POST(req: Request) {
    const body = await req.text();

    const res = await fetch(`${PAYLOAD_BASE}/api/expenses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}
