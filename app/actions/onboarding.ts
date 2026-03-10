"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { completeOnboardingSchema, type CompleteOnboardingInput } from "@/lib/schemas/onboarding";

// ---------------------------------------------------------------------------
// Complete Onboarding — Saves all wizard data in one shot
// ---------------------------------------------------------------------------
export async function completeOnboarding(input: CompleteOnboardingInput) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const parsed = completeOnboardingSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Datos inválidos. Revisa todos los campos." };
    }

    const {
        display_name,
        date_of_birth,
        gender,
        show_me,
        bio,
        interests,
        city,
        latitude,
        longitude,
    } = parsed.data;

    const supabase = await createClient();

    // 1. Update user profile + mark onboarding as completed
    const { error: profileError } = await supabase
        .from("users")
        .update({
            display_name,
            date_of_birth,
            gender,
            show_me,
            bio: bio || null,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    if (profileError) {
        return { error: "Error al guardar tu perfil" };
    }

    // 2. Upsert location
    const { error: locationError } = await supabase
        .from("user_location")
        .upsert(
            {
                user_id: userId,
                city,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        );

    if (locationError) {
        console.error("Error saving location:", locationError);
        // Non-blocking — profile is already saved
    }

    // 3. Save interests (delete old + insert new)
    if (interests && interests.length > 0) {
        await supabase
            .from("user_interests")
            .delete()
            .eq("user_id", userId);

        const rows = interests.map((interest) => ({
            user_id: userId,
            interest,
        }));

        const { error: interestsError } = await supabase
            .from("user_interests")
            .insert(rows);

        if (interestsError) {
            console.error("Error saving interests:", interestsError);
            // Non-blocking
        }
    }

    return { success: true };
}

// ---------------------------------------------------------------------------
// Upload onboarding photo — position 1 always (main photo)
// ---------------------------------------------------------------------------
export async function uploadOnboardingPhoto(formData: FormData) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "Selecciona una foto" };
    if (file.size > 2 * 1024 * 1024) return { error: "La foto no puede pesar más de 2MB" };

    const supabase = await createClient();

    // Upload to storage
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/1.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) return { error: "Error al subir la foto" };

    const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);

    // Upsert photo record at position 1
    const { error: dbError } = await supabase
        .from("user_photos")
        .upsert(
            {
                user_id: userId,
                url: urlData.publicUrl,
                position: 1,
            },
            { onConflict: "user_id,position" },
        );

    if (dbError) return { error: "Error al guardar la foto" };
    return { success: true, url: urlData.publicUrl };
}
