/** Planes de suscripción y sus features (sin Stripe) */
export const PLANS = {
    plus: {
        name: "Plus",
        price_usd: 2,
        features: [
            "Likes ilimitados",
            "Deshacer último swipe",
            "1 Super Like extra al día",
            "Sin anuncios",
        ],
    },
    vip: {
        name: "VIP",
        price_usd: 8,
        features: [
            "Todo lo de Plus",
            "Ver quién te dio like",
            "5 Super Likes al día",
            "Perfil destacado (Boost)",
            "Filtros avanzados",
            "Insignia VIP",
        ],
    },
} as const;

/**
 * Número de WhatsApp del admin para pagos en CUP.
 * En producción mover a variable de entorno WHATSAPP_ADMIN_NUMBER.
 */
export const WHATSAPP_ADMIN_NUMBER =
    process.env.WHATSAPP_ADMIN_NUMBER ?? "5356710196";
