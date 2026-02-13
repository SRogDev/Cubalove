"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ReportReason } from "@/lib/types";

const VALID_REASONS: ReportReason[] = [
  "fake",
  "inappropriate",
  "harassment",
  "minor",
  "spam",
  "other",
];

export async function reportUser(
  targetUserId: string,
  reason: string,
  details?: string,
) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  if (!userId) {
    return { error: "No autorizado" };
  }

  if (userId === targetUserId) {
    return { error: "No puedes reportarte a ti mismo" };
  }

  if (!VALID_REASONS.includes(reason as ReportReason)) {
    return { error: "Motivo de reporte no válido" };
  }

  if (reason === "other" && (!details || details.trim().length === 0)) {
    return { error: "Por favor especifica el motivo" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reported_id: targetUserId,
    reason,
    details: details?.trim() || null,
  });

  if (error) {
    return { error: "Error al enviar el reporte. Intenta de nuevo." };
  }

  return { success: true };
}
