import { z } from "zod/v4";

export const coupleRequestSchema = z.object({
    phone: z.string().min(6, "Teléfono inválido").max(20),
    name: z.string().min(2, "Nombre muy corto").max(50),
});

export type CoupleRequestInput = z.infer<typeof coupleRequestSchema>;

export const diaryEntrySchema = z.object({
    roomId: z.uuid("ID de room inválido"),
    content: z.string().min(1, "Escribe algo").max(500, "Máximo 500 caracteres"),
});

export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;
