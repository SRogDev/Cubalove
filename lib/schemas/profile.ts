import { z } from "zod/v4";

export const updateProfileSchema = z.object({
    display_name: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(50, "El nombre no puede exceder 50 caracteres")
        .optional(),
    date_of_birth: z
        .string()
        .date("Fecha de nacimiento inválida")
        .optional(),
    gender: z.enum(["hombre", "mujer", "otro"]).optional(),
    show_me: z.enum(["hombres", "mujeres", "ambos"]).optional(),
    bio: z
        .string()
        .max(300, "La bio no puede exceder 300 caracteres")
        .nullable()
        .optional(),
    work_study: z
        .string()
        .max(100, "El trabajo/estudio no puede exceder 100 caracteres")
        .nullable()
        .optional(),
    phone: z
        .string()
        .max(20, "Teléfono inválido")
        .nullable()
        .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateInterestsSchema = z.object({
    interests: z
        .array(z.string().min(1).max(50))
        .max(10, "Máximo 10 intereses"),
});

export type UpdateInterestsInput = z.infer<typeof updateInterestsSchema>;

export const updatePromptSchema = z.object({
    position: z.number().int().min(1).max(3),
    prompt_text: z.string().min(1).max(200, "Máximo 200 caracteres"),
    answer_text: z.string().min(1).max(100, "Máximo 100 caracteres"),
});

export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
