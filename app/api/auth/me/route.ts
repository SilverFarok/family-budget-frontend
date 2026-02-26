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
        const headers = new Headers({
            "content-type": "application/json",
        });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            headers.set("set-cookie", setCookie);
        }

        return new NextResponse(text, {
            status: res.status,
            headers,
        });
    } catch {
        return NextResponse.json({ error: "Auth me failed" }, { status: 500 });
    }
}
