"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Phone, User, Loader2 } from "lucide-react";

interface CoupleLinkFormProps {
  onSubmit: (phone: string, name: string) => Promise<{ error?: string }>;
}

export function CoupleLinkForm({ onSubmit }: CoupleLinkFormProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim()) return;

    setLoading(true);
    setError(null);

    const result = await onSubmit(phone.trim(), name.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <Heart size={36} className="text-green-600" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">
          Solicitud enviada
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu pareja recibirá una notificación para aceptar la vinculación.
          Cuando acepte, el modo pareja se activará para ambos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <div className="h-24 w-24 rounded-full bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center mb-6">
        <Heart size={42} className="text-primary" />
      </div>

      <h2 className="font-display text-xl font-bold text-center mb-2">
        Vincula tu pareja
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
        Ingresa el número de teléfono y nombre de tu pareja como aparece en
        Cubalove para enviarle una solicitud de vinculación.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Name input */}
        <div>
          <label
            htmlFor="partner-name"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block"
          >
            Nombre en Cubalove
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="partner-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de tu pareja"
              className="w-full rounded-2xl bg-muted pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
        </div>

        {/* Phone input */}
        <div>
          <label
            htmlFor="partner-phone"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block"
          >
            Número de teléfono
          </label>
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="partner-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+53 5XXXXXXX"
              className="w-full rounded-2xl bg-muted pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading || !phone.trim() || !name.trim()}
          className="w-full gradient-primary text-white rounded-full h-12 text-base font-semibold"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Heart size={18} className="mr-2" />
              Enviar solicitud
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
