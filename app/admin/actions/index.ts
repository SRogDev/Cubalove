"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("No autorizado");

  return { supabase, userId: user.id };
}

// ===== RECHARGES: Crear suscripción manual (CUP) =====
export async function createManualSubscription(formData: FormData) {
  const { supabase } = await verifyAdmin();
  const phone = formData.get("phone") as string;
  const plan = formData.get("plan") as string;

  if (!phone || !plan) {
    return { error: "Teléfono y plan son requeridos" };
  }

  // Buscar usuario por teléfono
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_id, display_name")
    .eq("phone", phone)
    .single();

  if (userError || !user) {
    return { error: "No se encontró un usuario con ese número de teléfono" };
  }

  // Crear o actualizar suscripción
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

  const { error: subError } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: user.user_id,
        plan,
        status: "active",
        payment_method: "cup_manual",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (subError) {
    return { error: "Error al crear la suscripción: " + subError.message };
  }

  revalidatePath("/admin/recharges");
  return {
    success: true,
    message: `Suscripción ${plan.toUpperCase()} creada para ${user.display_name}`,
  };
}

// ===== RECHARGES: Actualizar precios CUP =====
export async function updateCupPrices(formData: FormData) {
  const { supabase, userId } = await verifyAdmin();
  const plusPrice = parseInt(formData.get("plus_price") as string);
  const vipPrice = parseInt(formData.get("vip_price") as string);

  if (isNaN(plusPrice) || isNaN(vipPrice) || plusPrice <= 0 || vipPrice <= 0) {
    return { error: "Los precios deben ser números positivos" };
  }

  const { error: e1 } = await supabase
    .from("cup_prices")
    .update({ price_cup: plusPrice, updated_by: userId })
    .eq("plan", "plus");

  const { error: e2 } = await supabase
    .from("cup_prices")
    .update({ price_cup: vipPrice, updated_by: userId })
    .eq("plan", "vip");

  if (e1 || e2) {
    return { error: "Error al actualizar precios" };
  }

  revalidatePath("/admin/recharges");
  return { success: true, message: "Precios actualizados" };
}

// ===== ADS: Publicar chisme =====
export async function publishChisme(formData: FormData) {
  const { supabase, userId } = await verifyAdmin();
  const text = formData.get("text") as string;
  const type = (formData.get("type") as string) || "tip";
  const imageUrl = formData.get("image_url") as string;

  if (!text || text.trim().length === 0) {
    return { error: "El texto del chisme es requerido" };
  }

  const { error } = await supabase.from("chismes").insert({
    content: { text: text.trim(), type },
    image_url: imageUrl?.trim() || null,
    created_by: userId,
  });

  if (error) {
    return { error: "Error al publicar: " + error.message };
  }

  revalidatePath("/admin/ads");
  revalidatePath("/chismes");
  return { success: true, message: "Chisme publicado exitosamente" };
}

// ===== MODERATION: Suspender usuario (3 días) =====
export async function suspendUser(userId: string) {
  const { supabase } = await verifyAdmin();

  const suspendedUntil = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("users")
    .update({ status: "suspended", suspended_until: suspendedUntil })
    .eq("user_id", userId);

  if (error) {
    return { error: "Error al suspender usuario: " + error.message };
  }

  revalidatePath("/admin/moderation");
  return { success: true, message: "Usuario suspendido por 3 días" };
}

// ===== MODERATION: Bloquear usuario permanente =====
export async function blockUser(userId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("users")
    .update({ status: "blocked", suspended_until: null })
    .eq("user_id", userId);

  if (error) {
    return { error: "Error al bloquear usuario: " + error.message };
  }

  revalidatePath("/admin/moderation");
  return { success: true, message: "Usuario bloqueado permanentemente" };
}

// ===== MODERATION: Reactivar usuario =====
export async function reactivateUser(userId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("users")
    .update({ status: "active", suspended_until: null })
    .eq("user_id", userId);

  if (error) {
    return { error: "Error al reactivar usuario: " + error.message };
  }

  revalidatePath("/admin/moderation");
  return { success: true, message: "Usuario reactivado" };
}
