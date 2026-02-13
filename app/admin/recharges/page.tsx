"use client";

import { useState } from "react";
import { CreditCard, DollarSign, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createManualSubscription, updateCupPrices } from "../actions";

export default function RechargesPage() {
  const [subResult, setSubResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [priceResult, setPriceResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

  const handleCreateSubscription = async (formData: FormData) => {
    setSubLoading(true);
    setSubResult(null);
    const result = await createManualSubscription(formData);
    setSubResult(result);
    setSubLoading(false);
  };

  const handleUpdatePrices = async (formData: FormData) => {
    setPriceLoading(true);
    setPriceResult(null);
    const result = await updateCupPrices(formData);
    setPriceResult(result);
    setPriceLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Recargas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestionar suscripciones manuales en CUP
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crear suscripción manual */}
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold">Crear Suscripción</h3>
              <p className="text-xs text-muted-foreground">
                Activar plan para usuario que pagó en CUP
              </p>
            </div>
          </div>

          <form action={handleCreateSubscription} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1.5"
              >
                Número de teléfono
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+5352XXXXXXX"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="plan"
                className="block text-sm font-medium mb-1.5"
              >
                Plan
              </label>
              <select
                id="plan"
                name="plan"
                required
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="plus">Plus ($2 USD)</option>
                <option value="vip">VIP ($8 USD)</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={subLoading}
              className="w-full rounded-xl gradient-primary text-white"
            >
              {subLoading ? "Creando..." : "Crear Suscripción"}
            </Button>

            {subResult && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
                  subResult.success
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {subResult.success ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{subResult.message || subResult.error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Configurar precios CUP */}
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold">Precios en CUP</h3>
              <p className="text-xs text-muted-foreground">
                Ajustar según la tasa de cambio actual
              </p>
            </div>
          </div>

          <form action={handleUpdatePrices} className="space-y-4">
            <div>
              <label
                htmlFor="plus_price"
                className="block text-sm font-medium mb-1.5"
              >
                Plus (CUP)
              </label>
              <input
                id="plus_price"
                name="plus_price"
                type="number"
                defaultValue={1000}
                min={1}
                required
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="vip_price"
                className="block text-sm font-medium mb-1.5"
              >
                VIP (CUP)
              </label>
              <input
                id="vip_price"
                name="vip_price"
                type="number"
                defaultValue={4000}
                min={1}
                required
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              disabled={priceLoading}
              variant="outline"
              className="w-full rounded-xl"
            >
              {priceLoading ? "Guardando..." : "Guardar Precios"}
            </Button>

            {priceResult && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
                  priceResult.success
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {priceResult.success ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{priceResult.message || priceResult.error}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
