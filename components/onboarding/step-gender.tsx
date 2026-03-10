"use client";

import { ArrowLeft } from "lucide-react";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const GENDER_OPTIONS = [
    { value: "hombre" as const, label: "Hombre", emoji: "👨" },
    { value: "mujer" as const, label: "Mujer", emoji: "👩" },
    { value: "otro" as const, label: "Otro", emoji: "🌈" },
];

export function StepGender({ data, updateData, onNext, onBack }: Props) {
    const handleSelect = (value: "hombre" | "mujer" | "otro") => {
        updateData({ gender: value });
        // Auto-advance after selection (Tinder-like behavior)
        setTimeout(onNext, 300);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
                <h1 className="text-2xl font-bold">¿Qué eres? 🤔</h1>
                <p className="text-muted-foreground mt-2">
                    Escoge lo que te represente
                </p>
            </div>

            <div className="flex flex-col gap-3 mt-4">
                {GENDER_OPTIONS.map((option) => {
                    const isSelected = data.gender === option.value;
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
