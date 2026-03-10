"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ONBOARDING_INTERESTS } from "@/lib/constants/onboarding-interests";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const MAX_INTERESTS = 10;

export function StepInterests({ data, updateData, onNext, onBack }: Props) {
    const selected = data.interests || [];

    const toggleInterest = (label: string) => {
        if (selected.includes(label)) {
            updateData({ interests: selected.filter((i) => i !== label) });
        } else if (selected.length < MAX_INTERESTS) {
            updateData({ interests: [...selected, label] });
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
                <h1 className="text-2xl font-bold">¿Qué te gusta? 🎯</h1>
                <p className="text-muted-foreground mt-1">
                    Escoge hasta {MAX_INTERESTS} cosas que te definan.
                    Así encontramos gente que va contigo.
                </p>
                <p className="text-sm text-primary font-medium mt-1">
                    {selected.length}/{MAX_INTERESTS} escogidos
                </p>
            </div>

            {/* Scrollable interests */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-5 pb-4">
                {ONBOARDING_INTERESTS.map((category) => (
                    <div key={category.name}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {category.name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {category.interests.map((interest) => {
                                const isActive = selected.includes(interest.label);
                                const isDisabled = !isActive && selected.length >= MAX_INTERESTS;
                                return (
                                    <button
                                        key={interest.label}
                                        type="button"
                                        onClick={() => toggleInterest(interest.label)}
                                        disabled={isDisabled}
                                        className={`
                      inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                      border transition-all duration-150 active:scale-95
                      ${isActive
                                                ? "border-primary bg-primary/15 text-primary"
                                                : isDisabled
                                                    ? "border-border bg-muted text-muted-foreground/50 cursor-not-allowed"
                                                    : "border-border bg-card text-foreground hover:border-primary/40"
                                            }
                    `}
                                    >
                                        <span>{interest.emoji}</span>
                                        <span>{interest.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <Button
                    onClick={onNext}
                    size="lg"
                    className="w-full text-lg"
                >
                    {selected.length > 0 ? "Siguiente →" : "Siguiente →"}
                </Button>

                {selected.length === 0 && (
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
