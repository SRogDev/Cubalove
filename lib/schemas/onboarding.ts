import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Onboarding Wizard — Step Validation Schemas
// ---------------------------------------------------------------------------

/** Paso 1: Foto principal */
export const onboardingPhotoSchema = z.object({
    photoUrl: z.string().url("La foto es obligatoria"),
});

/** Paso 2: Nombre y fecha de nacimiento */
export const onboardingNameAgeSchema = z.object({
    display_name: z
        .string()
        .min(2, "Tu nombre debe tener al menos 2 letras")
        .max(50, "Máximo 50 caracteres"),
    date_of_birth: z
        .string()
        .date("Fecha inválida")
        .refine((val) => {
            const dob = new Date(val);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            const dayDiff = today.getDate() - dob.getDate();
            const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
            return actualAge >= 18;
        }, "Tienes que tener 18 años o más"),
});

/** Paso 3: Género */
export const onboardingGenderSchema = z.object({
    gender: z.enum(["hombre", "mujer", "otro"]),
});

/** Paso 4: Preferencia (show_me) */
export const onboardingShowMeSchema = z.object({
    show_me: z.enum(["hombres", "mujeres", "ambos"]),
});

/** Paso 5: Bio (opcional) */
export const onboardingBioSchema = z.object({
    bio: z
        .string()
        .max(300, "Máximo 300 caracteres")
        .nullable()
        .optional(),
});

/** Paso 5.5: Intereses (opcional, máx 10) */
export const onboardingInterestsSchema = z.object({
    interests: z
        .array(z.string().min(1).max(50))
        .max(10, "Máximo 10 intereses")
        .optional()
        .default([]),
});

/** Paso 6: Ubicación */
export const onboardingLocationSchema = z.object({
    city: z.string().min(1, "Selecciona tu ubicación"),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
});

/** Schema completo — todo el onboarding junto para el submit final */
export const completeOnboardingSchema = z.object({
    display_name: z.string().min(2).max(50),
    date_of_birth: z.string().date(),
    gender: z.enum(["hombre", "mujer", "otro"]),
    show_me: z.enum(["hombres", "mujeres", "ambos"]),
    bio: z.string().max(300).nullable().optional(),
    interests: z.array(z.string().min(1).max(50)).max(10).optional().default([]),
    city: z.string().min(1),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
