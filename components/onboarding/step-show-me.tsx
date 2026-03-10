"use client";

import { ArrowLeft } from "lucide-react";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const SHOW_ME_OPTIONS = [
    { value: "hombres" as const, label: "Hombres", emoji: "👨" },
    { value: "mujeres" as const, label: "Mujeres", emoji: "👩" },
    { value: "ambos" as const, label: "Ambos", emoji: "💜" },
];

export function StepShowMe({ data, updateData, onNext, onBack }: Props) {
    const handleSelect = (value: "hombres" | "mujeres" | "ambos") => {
        updateData({ show_me: value });
        // Auto-advance after selection
        setTimeout(onNext, 300);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
                <h1 className="text-2xl font-bold">¿Qué te interesa? 😏</h1>
                <p className="text-muted-foreground mt-2">
                    Te vamos a mostrar gente según lo que escojas
                </p>
            </div>

            <div className="flex flex-col gap-3 mt-4">
                {SHOW_ME_OPTIONS.map((option) => {
                    const isSelected = data.show_me === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`
                flex items-center gap-4 px-6 py-5 rounded-2xl border-2 text-left
                transition-all duration-200 active:scale-[0.98]
                ${isSelected
                                    ? "border-primary bg-primary/10 shadow-md"
                                    : "border-border hover:border-primary/40 bg-card"
                                }
              `}
                        >
                            <span className="text-4xl">{option.emoji}</span>
                            <span className={`text-xl font-semibold ${isSelected ? "text-primary" : ""}`}>
                                {option.label}
                            </span>
                            {isSelected && (
                                <span className="ml-auto text-primary text-xl">✓</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
