"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

function calculateAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export function StepNameAge({ data, updateData, onNext, onBack }: Props) {
    const [nameError, setNameError] = useState<string | null>(null);
    const [dobError, setDobError] = useState<string | null>(null);

    const handleNext = () => {
        setNameError(null);
        setDobError(null);

        const name = data.display_name.trim();
        if (name.length < 2) {
            setNameError("Pon tu nombre, mi vida, al menos 2 letras");
            return;
        }

        if (!data.date_of_birth) {
            setDobError("Necesitamos tu fecha de nacimiento");
            return;
        }

        const age = calculateAge(data.date_of_birth);
        if (age < 18) {
            setDobError("Tienes que ser mayor de 18 pa' entrar aquí 🔞");
            return;
        }

        if (age > 120) {
            setDobError("Asere, revisa esa fecha que algo no cuadra");
            return;
        }

        onNext();
    };

    // Max date = 18 years ago today
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    // Min date = 100 years ago
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);
    const minDateStr = minDate.toISOString().split("T")[0];

    return (
        <div className="flex flex-col h-full gap-6">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
                <h1 className="text-2xl font-bold">¿Cómo te llamas? 👋</h1>
                <p className="text-muted-foreground mt-2">
                    Y dinos cuándo naciste pa&apos; saber tu edad
                </p>
            </div>

            <div className="space-y-4 mt-4">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="text-sm font-medium mb-1.5 block">
                        Tu nombre
                    </label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Ej: Yanelis, Dairon, etc."
                        value={data.display_name}
                        onChange={(e) => updateData({ display_name: e.target.value })}
                        maxLength={50}
                        className="text-lg h-12"
                        autoFocus
                    />
                    {nameError && <p className="text-destructive text-sm mt-1">{nameError}</p>}
                </div>

                {/* Date of birth */}
                <div>
                    <label htmlFor="dob" className="text-sm font-medium mb-1.5 block">
                        Fecha de nacimiento
                    </label>
                    <Input
                        id="dob"
                        type="date"
                        value={data.date_of_birth}
                        onChange={(e) => updateData({ date_of_birth: e.target.value })}
                        min={minDateStr}
                        max={maxDateStr}
                        className="text-lg h-12"
                    />
                    {dobError && <p className="text-destructive text-sm mt-1">{dobError}</p>}
                    {data.date_of_birth && calculateAge(data.date_of_birth) >= 18 && (
                        <p className="text-muted-foreground text-sm mt-1">
                            {calculateAge(data.date_of_birth)} años 🎂
                        </p>
                    )}
                </div>
            </div>

            <Button
                onClick={handleNext}
                size="lg"
                className="w-full text-lg mt-auto"
            >
                Siguiente →
            </Button>
        </div>
    );
}
