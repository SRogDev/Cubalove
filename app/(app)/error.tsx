"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to your error reporting service
        console.error("[AppError]", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                <AlertTriangle size={28} />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">
                Algo salió mal
            </h2>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
                Ocurrió un error inesperado. Intenta de nuevo o vuelve más tarde.
            </p>
            <Button
                onClick={reset}
                variant="outline"
                className="rounded-full gap-2"
            >
                <RotateCcw size={16} />
                Intentar de nuevo
            </Button>
        </div>
    );
}
