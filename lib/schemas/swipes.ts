import { z } from "zod/v4";

export const createSwipeSchema = z.object({
    targetId: z.uuid("ID de usuario inválido"),
    type: z.enum(["like", "nope", "superlike"]),
});

export type CreateSwipeInput = z.infer<typeof createSwipeSchema>;
