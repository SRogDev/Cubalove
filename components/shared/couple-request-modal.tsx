"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShieldAlert, X } from "lucide-react";

interface CoupleRequestModalProps {
  requesterName: string;
  requesterPhone: string;
  requesterPhotoUrl?: string;
  requestId: string;
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string, report: boolean) => Promise<void>;
  onClose: () => void;
}

export function CoupleRequestModal({
  requesterName,
  requesterPhone,
  requesterPhotoUrl,
  requestId,
  onAccept,
  onReject,
  onClose,
}: CoupleRequestModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await onAccept(requestId);
    setLoading(false);
  };

  const handleReject = async (report: boolean) => {
    setLoading(true);
    await onReject(requestId, report);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-pink-200 mb-3">
            {requesterPhotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={requesterPhotoUrl}
                alt={requesterName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <Heart size={32} className="text-muted-foreground" />
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-center">
            Solicitud de Pareja
          </h2>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          <span className="font-semibold text-foreground">{requesterName}</span>{" "}
          ({requesterPhone}) quiere vincularse contigo como pareja.
        </p>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="w-full gradient-primary text-white rounded-full h-12 text-base font-semibold"
          >
            <Heart size={18} className="mr-2" />
            Aceptar
          </Button>

          <Button
            variant="outline"
            onClick={() => handleReject(false)}
            disabled={loading}
            className="w-full rounded-full h-10"
          >
            No, gracias
          </Button>

          <button
            type="button"
            onClick={() => handleReject(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive/70 hover:text-destructive py-2 transition-colors"
          >
            <ShieldAlert size={14} />
            Reportar como acoso
          </button>
        </div>
      </div>
    </div>
  );
}
