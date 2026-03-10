import { z } from "zod/v4";

export const createReportSchema = z.object({
    targetUserId: z.uuid("ID de usuario inválido"),
    reason: z.enum(["fake", "inappropriate", "harassment", "minor", "spam", "other"]),
    details: z
        .string()
        .max(500, "Los detalles no pueden exceder 500 caracteres")
        .optional(),
}).check(
    (ctx) => {
        if (ctx.value.reason === "other" && (!ctx.value.details || ctx.value.details.trim().length === 0)) {
            ctx.issues.push({
                code: "custom",
                message: "Por favor especifica el motivo",
                path: ["details"],
            });
        }
    }
);

export type CreateReportInput = z.infer<typeof createReportSchema>;
