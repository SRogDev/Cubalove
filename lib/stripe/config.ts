import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// Stripe Price IDs — configurar en Stripe Dashboard
export const STRIPE_PRICES = {
  plus: process.env.STRIPE_PRICE_PLUS_ID ?? "price_plus_placeholder",
  vip: process.env.STRIPE_PRICE_VIP_ID ?? "price_vip_placeholder",
} as const;

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

export const WHATSAPP_ADMIN_NUMBER = "5356710196";
