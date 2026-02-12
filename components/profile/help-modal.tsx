"use client";

import { X, Heart, Star, ArrowLeftRight, MessageCircle, Crown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const HELP_ITEMS = [
  {
    icon: Heart,
    color: "text-primary bg-primary/10",
    title: "Like",
    description:
      'Desliza la tarjeta a la derecha o toca el corazón. Si la otra persona también te da like, ¡hacen match! Así de fácil, asere.',
  },
  {
    icon: Star,
    color: "text-info bg-info/10",
    title: "Super Like",
    description:
      "Desliza hacia arriba o toca la estrella. Es como decirle al otro que te encanta de verdad. Solo tienes unos pocos al día, ¡úsalos bien!",
  },
  {
    icon: ArrowLeftRight,
    color: "text-muted-foreground bg-muted",
    title: "Pasar (Nope)",
    description:
      "Desliza a la izquierda o toca la X. No pasa nada, la otra persona no se entera. Sin drama.",
  },
  {
    icon: MessageCircle,
    color: "text-success bg-success/10",
    title: "WhatsApp",
    description:
      "Cuando haces match puedes hablar directo por WhatsApp. Nada de estar esperando mensajes dentro de la app. Rápido y sin rodeos.",
  },
  {
    icon: Crown,
    color: "text-gold bg-gold/10",
    title: "Plus & VIP",
    description:
      "Con Plus tienes likes ilimitados y puedes deshacer el último swipe. Con VIP puedes ver quién te dio like antes de decidir. Tremenda ventaja.",
  },
];

export const HelpModal = ({ open, onClose }: HelpModalProps) => {
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
          aria-label="Ayuda"
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
                Cómo funciona esto
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar ayuda"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
              <p className="text-sm text-muted-foreground">
                Dale, que esto es facilito. Aquí te explico cómo va la cosa:
              </p>

              {HELP_ITEMS.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <item.icon size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-sm">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 mt-2">
                <p className="text-sm text-primary font-medium text-center">
                  ¿Dudas? Escríbenos por Instagram o Telegram. Estamos pa&rsquo; ti.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
