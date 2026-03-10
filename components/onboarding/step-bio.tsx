"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const PLACEHOLDER_BIOS = [
    "Me gusta el reggaetón, el malecón y las buenas conversaciones...",
    "Busco a alguien pa' compartir un helado de Coppelia 🍦",
    "Si me haces reír ya tienes medio camino ganado 😂",
    "Fan del dominó, la playa y los frijoles negros de mamá...",
];

export function StepBio({ data, updateData, onNext, onBack }: Props) {
    const [placeholder] = useState(
        () => PLACEHOLDER_BIOS[Math.floor(Math.random() * PLACEHOLDER_BIOS.length)],
    );

    const charCount = data.bio?.length || 0;

    return (
        <div className="flex flex-col h-full gap-6">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
                <h1 className="text-2xl font-bold">Cuéntanos de ti ✍️</h1>
                <p className="text-muted-foreground mt-2">
                    Escribe algo que te represente. No tiene que ser un poema, tranqui.
                </p>
            </div>

            <div className="relative mt-4">
                <textarea
                    value={data.bio || ""}
                    onChange={(e) => updateData({ bio: e.target.value })}
                    placeholder={placeholder}
                    maxLength={300}
                    rows={5}
                    className="w-full resize-none rounded-xl border-2 border-border bg-card px-4 py-3 text-base placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
                    autoFocus
                />
                <span className={`absolute bottom-3 right-3 text-xs ${charCount > 280 ? "text-destructive" : "text-muted-foreground"}`}>
                    {charCount}/300
                </span>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <Button
                    onClick={onNext}
                    size="lg"
                    className="w-full text-lg"
                >
                    {data.bio && data.bio.trim().length > 0 ? "Siguiente →" : "Siguiente →"}
                </Button>

                {!data.bio?.trim() && (
                    <button
                        onClick={onNext}
                        className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                        Saltar por ahora
                    </button>
                )}
            </div>
        </div>
    );
}
