"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
    updateProfileSchema,
    updateInterestsSchema,
    updatePromptSchema,
    type UpdateProfileInput,
    type UpdateInterestsInput,
    type UpdatePromptInput,
} from "@/lib/schemas";
import * as UsersRepo from "@/lib/repositories/users";
import * as RecommendationsRepo from "@/lib/repositories/recommendations";

// ---------------------------------------------------------------------------
// Update profile fields (display_name, bio, gender, etc.)
// ---------------------------------------------------------------------------
export async function updateProfile(input: UpdateProfileInput) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Datos de perfil inválidos" };
    }

    const supabase = await createClient();
    const { error } = await UsersRepo.updateProfile(supabase, userId, parsed.data);

    if (error) return { error: "Error al actualizar perfil" };
    return { success: true };
}

// ---------------------------------------------------------------------------
// Update interests (replace all)
// ---------------------------------------------------------------------------
export async function updateInterests(input: UpdateInterestsInput) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const parsed = updateInterestsSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Intereses inválidos" };
    }

    const supabase = await createClient();

    // Delete existing + insert new in a transaction-like manner
    const { error: deleteError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", userId);

    if (deleteError) return { error: "Error al actualizar intereses" };

    if (parsed.data.interests.length > 0) {
        const rows = parsed.data.interests.map((interest) => ({
            user_id: userId,
            interest,
        }));

        const { error: insertError } = await supabase
            .from("user_interests")
            .insert(rows);

        if (insertError) return { error: "Error al guardar intereses" };
    }

    return { success: true };
}

// ---------------------------------------------------------------------------
// Upsert a prompt (create or update at position)
// ---------------------------------------------------------------------------
export async function upsertPrompt(input: UpdatePromptInput) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const parsed = updatePromptSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Datos de prompt inválidos" };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from("user_prompts")
        .upsert(
            {
                user_id: userId,
                position: parsed.data.position,
                prompt_text: parsed.data.prompt_text,
                answer_text: parsed.data.answer_text,
            },
            { onConflict: "user_id,position" },
        );

    if (error) return { error: "Error al guardar prompt" };
    return { success: true };
}

// ---------------------------------------------------------------------------
// Upload photo (position 1-6)
// ---------------------------------------------------------------------------
export async function uploadPhoto(formData: FormData) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const file = formData.get("file") as File | null;
    const position = Number(formData.get("position"));

    if (!file || file.size === 0) return { error: "No se seleccionó archivo" };
    if (file.size > 2 * 1024 * 1024) return { error: "La imagen no puede exceder 2MB" };
    if (position < 1 || position > 6) return { error: "Posición de foto inválida" };

    const supabase = await createClient();

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${position}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) return { error: "Error al subir imagen" };

    const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);

    // Upsert photo record
    const { error: dbError } = await supabase
        .from("user_photos")
        .upsert(
            {
                user_id: userId,
                url: urlData.publicUrl,
                position,
            },
            { onConflict: "user_id,position" },
        );

    if (dbError) return { error: "Error al guardar foto" };
    return { success: true, url: urlData.publicUrl };
}

// ---------------------------------------------------------------------------
// Delete photo by position
// ---------------------------------------------------------------------------
export async function deletePhoto(position: number) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    if (position < 1 || position > 6) return { error: "Posición inválida" };

    const supabase = await createClient();

    // Delete from storage (all extensions)
    const { data: files } = await supabase.storage
        .from("profile-photos")
        .list(userId);

    const toRemove = (files ?? [])
        .filter((f) => f.name.startsWith(`${position}.`))
        .map((f) => `${userId}/${f.name}`);

    if (toRemove.length > 0) {
        await supabase.storage.from("profile-photos").remove(toRemove);
    }

    // Delete DB record
    const { error } = await supabase
        .from("user_photos")
        .delete()
        .eq("user_id", userId)
        .eq("position", position);

    if (error) return { error: "Error al eliminar foto" };
    return { success: true };
}

// ---------------------------------------------------------------------------
// Get current user profile (for client-side hydration)
// ---------------------------------------------------------------------------
export async function getMyProfile() {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const supabase = await createClient();
    const { data, error } = await UsersRepo.getById(supabase, userId);

    if (error || !data) return { error: "Error al cargar perfil" };
    return { success: true, data };
}

// ---------------------------------------------------------------------------
// Get the user's ideal partner description (for editing in profile)
// ---------------------------------------------------------------------------
export async function getIdealDescription() {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado", description: null };

    const service = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await RecommendationsRepo.getIdealPartnerDescription(service, userId);
    if (error) return { error, description: null };
    return { description: data ?? null };
}
