"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  Flame,
  Megaphone,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const Toggle = ({ enabled, onToggle, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    disabled={disabled}
    onClick={onToggle}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      enabled ? "bg-primary" : "bg-muted-foreground/30",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
        enabled ? "translate-x-[22px]" : "translate-x-[2px]"
      )}
    />
  </button>
);

const NOTIFICATION_OPTIONS = [
  {
    key: "matches",
    icon: Heart,
    color: "text-primary bg-primary/10",
    label: "Matches",
    description: "Cuando alguien empata contigo",
  },
  {
    key: "messages",
    icon: MessageCircle,
    color: "text-success bg-success/10",
    label: "Mensajes",
    description: "Nuevos mensajes de tus matches",
  },
  {
    key: "chismes",
    icon: Flame,
    color: "text-gold bg-gold/10",
    label: "Chismes",
    description: "Cuando hay chismes nuevos",
  },
  {
    key: "promotions",
    icon: Megaphone,
    color: "text-info bg-info/10",
    label: "Promociones",
    description: "Boosts, Super Likes y ofertas",
  },
] as const;

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationSettings = ({
  open,
  onClose,
}: NotificationSettingsProps) => {
  const push = usePushNotifications();
  const [settings, setSettings] = useState({
    enabled: true,
    matches: true,
    messages: true,
    chismes: true,
    promotions: true,
  });

  const handleMainToggle = async () => {
    if (!settings.enabled) {
      // Activar: solicitar permiso push si no lo tiene
      if (!push.isSubscribed) {
        await push.subscribe();
      }
      setSettings((prev) => ({ ...prev, enabled: true }));
    } else {
      // Desactivar
      if (push.isSubscribed) {
        await push.unsubscribe();
      }
      setSettings((prev) => ({ ...prev, enabled: false }));
    }
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Configuración de notificaciones"
        >
          <motion.div
            className="w-full max-w-md max-h-[85svh] rounded-t-3xl sm:rounded-3xl bg-card overflow-hidden flex flex-col safe-bottom"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{ overscrollBehavior: "contain" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
              <h2 className="font-display text-xl font-bold">
                Notificaciones
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
              {/* Main toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      settings.enabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {settings.enabled ? (
                      <Bell size={20} aria-hidden="true" />
                    ) : (
                      <BellOff size={20} aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      Notificaciones push
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {settings.enabled ? "Activadas" : "Desactivadas"}
                    </p>
                  </div>
                </div>
                <Toggle
                  enabled={settings.enabled}
                  onToggle={handleMainToggle}
                  disabled={push.loading}
                />
              </div>

              {/* Push permission warning */}
              {settings.enabled && !push.isSupported && (
                <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
                  <p className="text-xs text-warning">
                    Tu navegador no soporta notificaciones push. Prueba con
                    Chrome o Safari actualizado.
                  </p>
                </div>
              )}

              {settings.enabled &&
                push.isSupported &&
                push.permission === "denied" && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3">
                    <p className="text-xs text-destructive">
                      Las notificaciones están bloqueadas en tu navegador. Ve a
                      la configuración del navegador para permitirlas.
                    </p>
                  </div>
                )}

              {/* Individual toggles */}
              {settings.enabled && (
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Tipo de notificación
                  </p>
                  {NOTIFICATION_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isEnabled =
                      settings[option.key as keyof typeof settings];
                    return (
                      <div
                        key={option.key}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg",
                              option.color
                            )}
                          >
                            <Icon size={18} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <Toggle
                          enabled={!!isEnabled}
                          onToggle={() => handleToggle(option.key)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Frequency note */}
              <div className="rounded-xl bg-muted/50 p-3 mt-2">
                <p className="text-xs text-muted-foreground text-center">
                  No te enviaremos más de 1 notificación por hora (excepto para
                  matches, esos son inmediatos).
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
