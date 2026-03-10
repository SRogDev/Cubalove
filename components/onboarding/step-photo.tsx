"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadOnboardingPhoto } from "@/app/actions/onboarding";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
}

export function StepPhoto({ data, updateData, onNext }: Props) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadOnboardingPhoto(formData);
        setUploading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        if (result.url) {
            updateData({ photoUrl: result.url });
        }

        // Reset input
        e.target.value = "";
    };

    const hasPhoto = !!data.photoUrl;

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
                <h1 className="text-2xl font-bold">Pon tu mejor foto 📸</h1>
                <p className="text-muted-foreground mt-2">
                    Esta es la primera que van a ver. Dale, que la primera impresión cuenta.
                </p>
            </div>

            {/* Photo circle */}
            <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="relative w-48 h-48 rounded-full border-4 border-dashed border-primary/30 hover:border-primary/60 transition-colors overflow-hidden flex items-center justify-center bg-muted"
            >
                {data.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={data.photoUrl}
                        alt="Tu foto"
                        className="w-full h-full object-cover"
                    />
                ) : uploading ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Camera className="w-10 h-10" />
                        <span className="text-sm font-medium">Toca pa&apos; subir</span>
                    </div>
                )}
            </button>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {error && (
                <p className="text-destructive text-sm">{error}</p>
            )}

            {hasPhoto && (
                <p className="text-sm text-muted-foreground">
                    Se ve bien 🔥 Puedes tocar la foto pa&apos; cambiarla
                </p>
            )}

            <Button
                onClick={onNext}
                disabled={!hasPhoto || uploading}
                size="lg"
                className="w-full max-w-xs text-lg mt-auto"
            >
                Siguiente →
            </Button>
        </div>
    );
}
