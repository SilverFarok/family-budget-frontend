import { NextResponse } from "next/server";

const PAYLOAD_BASE = process.env.PAYLOAD_URL!;

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const body = await req.text();

    const res = await fetch(`${PAYLOAD_BASE}/api/expenses/${params.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body,
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const res = await fetch(`${PAYLOAD_BASE}/api/expenses/${params.id}`, {
        method: "DELETE",
    });

    const data = await res.text();

    return new NextResponse(data, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}
