"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUBA_PROVINCES, getMunicipalities } from "@/lib/constants/cuba-locations";
import type { OnboardingData } from "@/app/onboarding/page";

interface Props {
    data: OnboardingData;
    updateData: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepLocation({ data, updateData, onNext, onBack }: Props) {
    const [province, setProvince] = useState(() => {
        // Try to extract province from existing city
        if (data.city) {
            const parts = data.city.split(", ");
            if (parts.length === 2) return parts[1];
        }
        return "";
    });

    const [municipality, setMunicipality] = useState(() => {
        if (data.city) {
            const parts = data.city.split(", ");
            if (parts.length === 2) return parts[0];
        }
        return "";
    });

    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    const municipalities = province ? getMunicipalities(province) : [];

    const handleProvinceChange = (val: string) => {
        setProvince(val);
        setMunicipality("");
        updateData({ city: "" });
    };

    const handleMunicipalityChange = (val: string) => {
        setMunicipality(val);
        if (val && province) {
            updateData({ city: `${val}, ${province}` });
        }
    };

    const requestGeolocation = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setGeoError("Tu dispositivo no soporta geolocalización");
            return;
        }

        setGeoLoading(true);
        setGeoError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                updateData({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGeoLoading(false);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setGeoError("Le diste a no permitir. Tranqui, no pasa nada.");
                } else {
                    setGeoError("No pudimos obtener tu ubicación exacta");
                }
                setGeoLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    }, [updateData]);

    const canProceed = !!data.city;

    return (
        <div className="flex flex-col h-full gap-6">
            <button onClick={onBack} className="self-start text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
                <h1 className="text-2xl font-bold">¿Dónde estás? 📍</h1>
                <p className="text-muted-foreground mt-2">
                    Pa&apos; mostrarte gente que esté cerca tuyo
                </p>
            </div>

            <div className="space-y-4 mt-2">
                {/* Province */}
                <div>
                    <label htmlFor="province" className="text-sm font-medium mb-1.5 block">
                        Provincia
                    </label>
                    <select
                        id="province"
                        value={province}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full h-12 rounded-xl border-2 border-border bg-card px-4 text-base focus:border-primary focus:outline-none transition-colors appearance-none"
                    >
                        <option value="">Escoge tu provincia...</option>
                        {CUBA_PROVINCES.map((p) => (
                            <option key={p.name} value={p.name}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Municipality */}
                {province && (
                    <div>
                        <label htmlFor="municipality" className="text-sm font-medium mb-1.5 block">
                            Municipio
                        </label>
                        <select
                            id="municipality"
                            value={municipality}
                            onChange={(e) => handleMunicipalityChange(e.target.value)}
                            className="w-full h-12 rounded-xl border-2 border-border bg-card px-4 text-base focus:border-primary focus:outline-none transition-colors appearance-none"
                        >
                            <option value="">Escoge tu municipio...</option>
                            {municipalities.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Geolocation button */}
                {canProceed && !data.latitude && (
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={requestGeolocation}
                            disabled={geoLoading}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary transition-colors"
                        >
                            {geoLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <MapPin className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                                {geoLoading ? "Buscando..." : "Activar ubicación exacta"}
                            </span>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1.5 text-center">
                            Opcional, pero ayuda a encontrar gente más cerca
                        </p>
                    </div>
                )}

                {data.latitude && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <MapPin className="w-4 h-4" />
                        <span>Ubicación exacta activada ✓</span>
                    </div>
                )}

                {geoError && (
                    <p className="text-sm text-muted-foreground text-center">{geoError}</p>
                )}
            </div>

            <Button
                onClick={onNext}
                disabled={!canProceed}
                size="lg"
                className="w-full text-lg mt-auto"
            >
                Siguiente →
            </Button>
        </div>
    );
}
