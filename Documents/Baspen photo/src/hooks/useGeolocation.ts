"use client";

import { useState, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook for browser Geolocation API.
 * Call requestLocation() to prompt for permission and get coordinates.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "geolocation_not_supported" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          error: err.code === 1 ? "permission_denied" : "position_unavailable",
          loading: false,
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { ...state, requestLocation };
}
