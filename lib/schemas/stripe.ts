import { z } from "zod/v4";

// Esquema para el checkout de suscripciones.
// Planes válidos: "plus" y "vip" (ver tabla user_subscriptions en database.sql).
// Nota: el flujo de pago automatizado con Stripe no está activo en Cuba;
// las suscripciones reales se crean manualmente vía /admin/recharges
// (payment_method "cup_manual"). Este schema valida el plan elegido.
export const checkoutSchema = z.object({
    plan: z.enum(["plus", "vip"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
