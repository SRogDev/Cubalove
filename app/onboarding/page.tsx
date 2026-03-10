"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { completeOnboarding } from "@/app/actions/onboarding";
import { StepPhoto } from "@/components/onboarding/step-photo";
import { StepNameAge } from "@/components/onboarding/step-name-age";
import { StepGender } from "@/components/onboarding/step-gender";
import { StepShowMe } from "@/components/onboarding/step-show-me";
import { StepBio } from "@/components/onboarding/step-bio";
import { StepInterests } from "@/components/onboarding/step-interests";
import { StepLocation } from "@/components/onboarding/step-location";
import { StepTutorial } from "@/components/onboarding/step-tutorial";
import { EVENTS } from "@/lib/posthog/events";

// Safe PostHog capture — posthog-js may not be installed yet
function trackEvent(event: string, properties?: Record<string, unknown>) {
    try {
        if (typeof window !== "undefined" && window.posthog) {
            window.posthog.capture(event, properties);
        }
    } catch {
        // Analytics not available — no-op
    }
}

// Extend window for posthog
declare global {
    interface Window {
        posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void };
    }
}

// ---------------------------------------------------------------------------
// Onboarding Data Shape (persisted in localStorage)
// ---------------------------------------------------------------------------
export interface OnboardingData {
    photoUrl: string | null;
    display_name: string;
    date_of_birth: string;
    gender: "hombre" | "mujer" | "otro" | null;
    show_me: "hombres" | "mujeres" | "ambos" | null;
    bio: string;
    interests: string[];
    city: string;
    latitude: number | null;
    longitude: number | null;
}

const INITIAL_DATA: OnboardingData = {
    photoUrl: null,
    display_name: "",
    date_of_birth: "",
    gender: null,
    show_me: null,
    bio: "",
    interests: [],
    city: "",
    latitude: null,
    longitude: null,
};

const STORAGE_KEY = "empatando_onboarding";
const TOTAL_STEPS = 8;

const STEP_LABELS = [
    "Foto",
    "Nombre",
    "Género",
    "Interés",
    "Bio",
    "Gustos",
    "Ubicación",
    "Tutorial",
];

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------
export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load saved progress from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setData((prev) => ({ ...prev, ...parsed }));
            }
        } catch {
            // Ignore parse errors
        }
        // Track onboarding start
        trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, { step: "started" });
    }, []);

    // Persist to localStorage on data change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // localStorage full or unavailable — no-op
        }
    }, [data]);

    const updateData = useCallback((partial: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...partial }));
    }, []);

    const next = useCallback(() => {
        setDirection(1);
        setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
        trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, {
            step: STEP_LABELS[step],
            step_number: step + 1,
        });
    }, [step]);

    const back = useCallback(() => {
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 0));
    }, []);

    const handleComplete = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);
        setError(null);

        try {
            const result = await completeOnboarding({
                display_name: data.display_name,
                date_of_birth: data.date_of_birth,
                gender: data.gender!,
                show_me: data.show_me!,
                bio: data.bio || null,
                interests: data.interests,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
            });

            if (result.error) {
                setError(result.error);
                setSubmitting(false);
                return;
            }

            // Clear localStorage
            localStorage.removeItem(STORAGE_KEY);

            trackEvent(EVENTS.ONBOARDING_COMPLETED);

            router.push("/discover");
        } catch {
            setError("Algo salió mal. Inténtalo de nuevo.");
            setSubmitting(false);
        }
    }, [data, submitting, router]);

    // Animation variants
    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return <StepPhoto data={data} updateData={updateData} onNext={next} />;
            case 1:
                return <StepNameAge data={data} updateData={updateData} onNext={next} onBack={back} />;
            case 2:
                return <StepGender data={data} updateData={updateData} onNext={next} onBack={back} />;
            case 3:
                return <StepShowMe data={data} updateData={updateData} onNext={next} onBack={back} />;
            case 4:
                return <StepBio data={data} updateData={updateData} onNext={next} onBack={back} />;
            case 5:
                return <StepInterests data={data} updateData={updateData} onNext={next} onBack={back} />;
            case 6:
                return <StepLocation data={data} updateData={updateData} onNext={next} onBack={back} />;
            case 7:
                return (
                    <StepTutorial
                        onComplete={handleComplete}
                        onBack={back}
                        submitting={submitting}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-svh px-6 py-8 max-w-lg mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-1.5 mb-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{
                            backgroundColor: i <= step
                                ? "hsl(var(--primary))"
                                : "hsl(var(--muted))",
                        }}
                    />
                ))}
            </div>

            {/* Step counter */}
            <p className="text-xs text-muted-foreground mb-6 text-center">
                {step + 1} de {TOTAL_STEPS}
            </p>

            {/* Error banner */}
            {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg mb-4 text-center">
                    {error}
                </div>
            )}

            {/* Animated step content */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
                        className="h-full"
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
