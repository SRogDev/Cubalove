"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface IdealPartnerModalProps {
  /** Controlled open state — parent decides when to show this */
  open: boolean;
  onClose: (saved: boolean) => void;
  /**
   * When true: user has no existing description yet.
   * Shows a stronger "this is required" message and changes skip label.
   */
  isFirstTime?: boolean;
  /** Pre-populate the textarea with an existing description (for editing) */
  initialText?: string;
}

export function IdealPartnerModal({ open, onClose, isFirstTime = false, initialText = "" }: IdealPartnerModalProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset text (pre-populate if editing) when reopened
  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  const dismiss = () => onClose(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/recommendations/ideal-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text.trim() }),
      });
      onClose(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl max-w-lg mx-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              onClick={dismiss}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
              <Sparkles size={24} className="text-primary" />
            </div>

            <h2 className="font-display text-xl font-bold mb-1">
              ¿Cómo es tu persona ideal?
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Descríbela con tus propias palabras — carácter, valores, lo que
              más te importa en alguien.
            </p>

            {isFirstTime && (
              <p className="text-xs font-semibold text-primary mb-4 leading-snug">
                ✦ Esto activa el sistema de recomendaciones. Sin tu descripción
                no podemos encontrar compatibilidades reales para ti.
              </p>
            )}
            {!isFirstTime && <div className="mb-4" />}

            <textarea
              className="w-full rounded-xl border bg-muted/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              rows={4}
              maxLength={500}
              placeholder="Ej: alguien alegre y honesto, que valore la familia, con quien pueda reír y hablar de todo…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right mt-1 mb-5">
              {text.length}/500
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 h-11 rounded-full border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {isFirstTime ? "Quizás luego" : "Cancelar"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || text.trim().length < 10}
                className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-opacity active:scale-[0.97]"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
