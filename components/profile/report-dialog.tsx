"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportUser } from "@/app/actions/reports";
import { REPORT_REASONS, type ReportReasonKey } from "@/lib/constants/subscription";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  targetUserId: string;
  targetName: string;
  open: boolean;
  onClose: () => void;
}

const REASON_KEYS = Object.keys(REPORT_REASONS) as ReportReasonKey[];

export const ReportDialog = ({
  targetUserId,
  targetName,
  open,
  onClose,
}: ReportDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<ReportReasonKey | null>(null);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setLoading(true);
    setError(null);

    const result = await reportUser(
      targetUserId,
      selectedReason,
      selectedReason === "other" ? details : details || undefined,
    );

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails("");
    setError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto safe-bottom"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3 bg-background rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Flag size={18} className="text-destructive" />
                <h2 className="font-display text-lg font-bold">
                  Reportar a {targetName}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <CheckCircle size={48} className="text-success mb-3" />
                <h3 className="font-display text-lg font-bold mb-1">
                  Reporte enviado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revisaremos tu reporte lo antes posible. Gracias por ayudar a
                  mantener una comunidad segura.
                </p>
              </div>
            ) : (
              <div className="px-5 pb-6">
                {/* Reason label */}
                <p className="text-sm text-muted-foreground mb-3">
                  Motivo del reporte:
                </p>

                {/* Reason options */}
                <div className="space-y-2 mb-4">
                  {REASON_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedReason(key)}
                      className={cn(
                        "w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-colors border",
                        selectedReason === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/30 text-foreground hover:bg-muted/50",
                      )}
                    >
                      {REPORT_REASONS[key]}
                    </button>
                  ))}
                </div>

                {/* Details field - shown always, required for "other" */}
                {selectedReason && (
                  <div className="mb-4">
                    <label
                      htmlFor="report-details"
                      className="text-sm text-muted-foreground mb-1.5 block"
                    >
                      {selectedReason === "other"
                        ? "Especifica el motivo *"
                        : "Detalles adicionales (opcional)"}
                    </label>
                    <textarea
                      id="report-details"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Describe la situación..."
                      maxLength={500}
                      rows={3}
                      className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-sm text-destructive mb-3">{error}</p>
                )}

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedReason || loading}
                  className="w-full rounded-xl"
                  variant="destructive"
                >
                  {loading ? "Enviando..." : "Enviar reporte"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
