"use client";

import { ShieldAlert, Ban } from "lucide-react";
import type { UserStatus } from "@/lib/types";

interface AttentionUserProps {
  status: UserStatus;
  suspendedUntil?: string | null;
}

export const AttentionUser = ({ status, suspendedUntil }: AttentionUserProps) => {
  if (status === "active") return null;

  const isSuspended = status === "suspended";
  const isBlocked = status === "blocked";

  const suspendedDate = suspendedUntil
    ? new Date(suspendedUntil).toLocaleDateString("es-CU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 ${
            isSuspended
              ? "bg-warning/10 text-warning"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {isSuspended ? (
            <ShieldAlert size={40} />
          ) : (
            <Ban size={40} />
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-bold mb-3">
          {isSuspended ? "Cuenta Suspendida" : "Cuenta Bloqueada"}
        </h1>

        {/* Message */}
        {isSuspended && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu cuenta ha sido suspendida por <strong>3 días</strong> debido a
              comportamientos que van en contra de nuestras normas de convivencia.
            </p>
            {suspendedDate && (
              <p className="text-sm text-muted-foreground">
                Podrás volver a usar Dating Cuba a partir del{" "}
                <strong>{suspendedDate}</strong>.
              </p>
            )}
            <div className="rounded-xl bg-warning/5 border border-warning/20 p-4 mt-4">
              <p className="text-sm text-warning font-medium">
                Las reincidencias pueden resultar en el bloqueo permanente de tu
                cuenta. Por favor, revisa nuestros Términos de Uso.
              </p>
            </div>
          </div>
        )}

        {isBlocked && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lamentamos informarte que tu cuenta ha sido bloqueada de forma
              permanente debido a comportamientos que violan los términos y normas
              de Dating Cuba.
            </p>
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 mt-4">
              <p className="text-sm text-destructive font-medium">
                Esta decisión es definitiva. Si crees que se trata de un error,
                puedes contactarnos a través de nuestros canales oficiales.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
