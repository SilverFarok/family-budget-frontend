import { NextResponse } from "next/server";

const PAYLOAD_BASE = process.env.PAYLOAD_URL!;

export async function POST(req: Request) {
    const body = await req.text();

    const res = await fetch(`${PAYLOAD_BASE}/api/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
        credentials: "include",
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: {
            "content-type": "application/json",
            // дуже важливо — прокидаємо cookie
            "set-cookie": res.headers.get("set-cookie") ?? "",
        },
    });
}
