import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getMatches } from "@/lib/cache";

/**
 * GET /api/matches — Fetch user's match list.
 * Used by SWR in the matches page (client component).
 * Uses React.cache() for per-request deduplication.
 */
export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getMatches(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { matches: data },
    { headers: { "Cache-Control": "private, no-cache" } },
  );
}
