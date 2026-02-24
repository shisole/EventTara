"use client";

import { useState, useCallback, useRef } from "react";

import { Button } from "@/components/ui";

interface NearbyState {
  active: boolean;
  lat: number;
  lng: number;
}

interface NearbySortProps {
  onLocationChange: (state: NearbyState | null) => void;
  active: boolean;
}

export default function NearbySort({ onLocationChange, active }: NearbySortProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cachedCoords = useRef<{ lat: number; lng: number } | null>(null);

  const handleToggle = useCallback(() => {
    if (active) {
      onLocationChange(null);
      return;
    }

    // Reuse cached coordinates if available
    if (cachedCoords.current) {
      onLocationChange({
        active: true,
        lat: cachedCoords.current.lat,
        lng: cachedCoords.current.lng,
      });
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        cachedCoords.current = coords;
        onLocationChange({ active: true, ...coords });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied"
            : "Could not get your location",
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [active, onLocationChange]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={active ? "primary" : "ghost"}
        size="sm"
        className="whitespace-nowrap shrink-0 min-h-[44px]"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin mr-1.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
              />
            </svg>
            Locating...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            Near me
          </>
        )}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
