"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  Star,
  Check,
  Zap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PLANS, WHATSAPP_ADMIN_NUMBER } from "@/lib/stripe/config";
import { createCheckoutSession } from "@/lib/stripe/actions";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/types";
import Link from "next/link";

// Mock CUP prices — en producción se cargan de la DB
const MOCK_CUP_PRICES = { plus: 1000, vip: 4000 };

export default function PremiumPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async (plan: SubscriptionPlan) => {
    setLoading(true);
    try {
      const result = await createCheckoutSession(plan);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setLoading(false);
    }
  };

  const handleCupPayment = (plan: SubscriptionPlan) => {
    const price = MOCK_CUP_PRICES[plan];
    const message = encodeURIComponent(
      `Hola! Quiero suscribirme al plan ${plan.toUpperCase()} (${price} CUP) en Empatando.`
    );
    window.open(
      `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${message}`,
      "_blank"
    );
  };

  // Success/canceled states
  if (success) {
    return (
      <div className="min-h-full flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">
            Bienvenido al club!
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Tu suscripción está activa. Disfruta de todas las ventajas.
          </p>
          <Link href="/discover">
            <Button className="rounded-full gradient-primary text-white">
              Seguir descubriendo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (canceled) {
    return (
      <div className="min-h-full flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <XCircle size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">
            Pago cancelado
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            No te preocupes, puedes intentarlo cuando quieras.
          </p>
          <Link href="/premium">
            <Button variant="outline" className="rounded-full">
              Ver planes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-6">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown size={22} className="text-gold" aria-hidden="true" />
          <h1 className="font-display text-xl font-bold">Hazte Premium</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Desbloquea funciones que te dan ventaja
        </p>
      </div>

      {/* Plan cards */}
      <div className="px-4 space-y-4 mt-2">
        {(Object.entries(PLANS) as [SubscriptionPlan, (typeof PLANS)[SubscriptionPlan]][]).map(
          ([planKey, plan], i) => {
            const isVip = planKey === "vip";
            const isSelected = selectedPlan === planKey;
            const cupPrice = MOCK_CUP_PRICES[planKey];

            return (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlan(isSelected ? null : planKey)
                  }
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-5 transition-all",
                    isSelected
                      ? isVip
                        ? "border-gold bg-gold/5 shadow-lg shadow-gold/10"
                        : "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-card hover:border-border"
                  )}
                >
                  {/* Plan header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          isVip
                            ? "bg-gold/10 text-gold"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {isVip ? <Crown size={20} /> : <Star size={20} />}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg">
                          {plan.name}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-2xl font-bold",
                          isVip ? "text-gold" : "text-primary"
                        )}
                      >
                        ${plan.price_usd}
                      </p>
                      <p className="text-xs text-muted-foreground">/mes</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check
                          size={14}
                          className={
                            isVip ? "text-gold" : "text-primary"
                          }
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </button>

                {/* Payment options (shown when selected) */}
                {isSelected && (
                  <motion.div
                    className="mt-3 space-y-2 px-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    {/* Stripe payment */}
                    <Button
                      onClick={() => handleStripeCheckout(planKey)}
                      disabled={loading}
                      className={cn(
                        "w-full h-12 rounded-xl text-white font-semibold shadow-md",
                        isVip
                          ? "gradient-gold shadow-gold/20"
                          : "gradient-primary shadow-primary/20"
                      )}
                    >
                      <Zap size={16} className="mr-2" />
                      {loading
                        ? "Redirigiendo..."
                        : `Pagar $${plan.price_usd} USD`}
                    </Button>

                    {/* CUP payment via WhatsApp */}
                    <Button
                      onClick={() => handleCupPayment(planKey)}
                      variant="outline"
                      className="w-full h-12 rounded-xl font-semibold"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 mr-2 text-success"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      Pagar {cupPrice.toLocaleString("es-CU")} CUP
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            );
          }
        )}
      </div>

      {/* Info note */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl bg-muted/50 border border-border/50 p-4 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Los pagos en USD se procesan de forma segura con Stripe. Para pagos
            en CUP, te redirigimos a WhatsApp para coordinar con nuestro equipo.
            Las suscripciones se activan al instante.
          </p>
        </div>
      </div>
    </div>
  );
}
