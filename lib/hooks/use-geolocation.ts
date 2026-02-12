"use client";

import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATE: GeolocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  loading: false,
  error: null,
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(DEFAULT_STATE);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "La geolocalización no está disponible en este dispositivo",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (err) => {
        let errorMessage = "Error al obtener ubicación";
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = "Permiso de ubicación denegado";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = "Ubicación no disponible";
        } else if (err.code === err.TIMEOUT) {
          errorMessage = "Tiempo de espera agotado";
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      }
    );
  }, []);

  // Request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, requestLocation };
}

/**
 * Format distance for display — Tinder style
 * Less than 1km → "a menos de 1 km"
 * Otherwise → "a X km"
 */
export function formatDistanceLabel(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    if (meters < 100) return "muy cerca";
    return `a ${meters} m`;
  }
  return `a ${Math.round(km)} km`;
}
