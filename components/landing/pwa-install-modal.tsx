"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus, MoreVertical, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform("ios");
    } else if (/Android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Instalar aplicación"
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-6 pb-8 safe-bottom animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Instalar Dating Cuba</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {platform === "ios" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para instalar en tu iPhone:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                  <Share size={20} aria-hidden="true" />
                </div>
                <p className="text-sm">
                  <span className="font-semibold">1.</span> Abre en Safari y toca el botón de compartir
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                  <Plus size={20} aria-hidden="true" />
                </div>
                <p className="text-sm">
                  <span className="font-semibold">2.</span> Selecciona &ldquo;Añadir a pantalla de inicio&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {platform === "android" && (
          <div className="space-y-4">
            {deferredPrompt ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Instala la app para la mejor experiencia.
                </p>
                <Button
                  onClick={handleInstall}
                  className="w-full h-12 rounded-full gradient-primary text-white font-semibold text-base shadow-lg shadow-primary/30"
                >
                  Instalar ahora
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Para instalar en tu Android:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                      <MoreVertical size={20} aria-hidden="true" />
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">1.</span> Toca el menú de Chrome (tres puntos)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                      <Plus size={20} aria-hidden="true" />
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">2.</span> Selecciona &ldquo;Añadir a pantalla de inicio&rdquo;
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {platform === "desktop" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Monitor size={32} aria-hidden="true" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              La mejor experiencia es en móvil. Visita{" "}
              <span className="font-semibold text-foreground">datingcuba.com</span>{" "}
              desde tu teléfono para instalar la app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
