import { NextRequest, NextResponse } from "next/server";
import { precomputeQueues } from "@/lib/services/precompute";

// ---------------------------------------------------------------------------
// POST /api/discovery/precompute
//
// Trigger manual precomputation of discovery queues.
// Protected by INTERNAL_API_SECRET — call from cron or admin.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const stats = await precomputeQueues();
  return NextResponse.json(stats);
}
