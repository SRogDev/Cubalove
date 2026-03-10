import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/me — Returns the current user's ID.
 * Reads the x-user-id header injected by proxy.ts.
 */
export async function GET() {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
        { userId },
        { headers: { "Cache-Control": "private, max-age=60" } },
    );
}
