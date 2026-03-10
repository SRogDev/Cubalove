import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAllWithReportCounts } from "@/lib/repositories/users";

/**
 * GET /api/admin/users — Fetch all users with report counts.
 * Requires admin role (checked by proxy.ts).
 */
export async function GET() {
    const supabase = await createServiceClient();
    const { data, error } = await getAllWithReportCounts(supabase);

    if (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    return NextResponse.json({ users: data });
}
