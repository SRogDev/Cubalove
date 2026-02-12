"use client";

import { useState } from "react";
import { Megaphone, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishChisme } from "../actions";

const CHISME_TYPES = [
  { value: "tip", label: "Consejo" },
  { value: "stat", label: "Dato / Estadística" },
  { value: "milestone", label: "Logro / Hito" },
  { value: "success", label: "Historia de Éxito" },
];

export default function AdsPage() {
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePublish = async (formData: FormData) => {
    setLoading(true);
    setResult(null);
    const res = await publishChisme(formData);
    setResult(res);
    setLoading(false);
    if (res.success) {
      // Reset form
      const form = document.getElementById("chisme-form") as HTMLFormElement;
      form?.reset();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Chismes Ads</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Publicar mensajes en el feed de Chismes
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold">Nuevo Chisme</h3>
              <p className="text-xs text-muted-foreground">
                Este mensaje será visible para todos los usuarios
              </p>
            </div>
          </div>

          <form id="chisme-form" action={handlePublish} className="space-y-4">
            <div>
              <label
                htmlFor="text"
                className="block text-sm font-medium mb-1.5"
              >
                Texto del chisme
              </label>
              <textarea
                id="text"
                name="text"
                rows={4}
                maxLength={500}
                required
                placeholder="Escribe el mensaje que verán todos los usuarios en la sección de Chismes..."
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium mb-1.5"
              >
                Tipo de contenido
              </label>
              <select
                id="type"
                name="type"
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CHISME_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="image_url"
                className="block text-sm font-medium mb-1.5"
              >
                URL de imagen{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <input
                id="image_url"
                name="image_url"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl gradient-primary text-white"
            >
              {loading ? "Publicando..." : "Publicar Chisme"}
            </Button>

            {result && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
                  result.success
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{result.message || result.error}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
