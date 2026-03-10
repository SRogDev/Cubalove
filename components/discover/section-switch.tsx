"use client";

import { cn } from "@/lib/utils";

interface SectionSwitchProps {
    value: "buscar" | "recomendado";
    onChange: (val: "buscar" | "recomendado") => void;
}

export function SectionSwitch({ value, onChange }: SectionSwitchProps) {
    return (
        <div className="flex items-center justify-center px-4 pt-3 pb-1">
            <div className="relative flex items-center bg-muted rounded-full p-1 gap-0 h-10 w-full max-w-[280px]">
                {/* Sliding pill */}
                <div
                    aria-hidden="true"
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-full bg-primary shadow-sm transition-transform duration-150 ease-in-out",
                        value === "recomendado" && "translate-x-[calc(100%+4px)]",
                    )}
                />

                {/* Buscar */}
                <button
                    type="button"
                    onClick={() => onChange("buscar")}
                    className={cn(
                        "relative z-10 flex-1 h-full rounded-full text-sm font-semibold transition-colors duration-150",
                        value === "buscar"
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground active:text-foreground",
                    )}
                >
                    Buscar
                </button>

                {/* Recomendado */}
                <button
                    type="button"
                    onClick={() => onChange("recomendado")}
                    className={cn(
                        "relative z-10 flex-1 h-full rounded-full text-sm font-semibold transition-colors duration-150",
                        value === "recomendado"
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground active:text-foreground",
                    )}
                >
                    Recomendado
                </button>
            </div>
        </div>
    );
}
