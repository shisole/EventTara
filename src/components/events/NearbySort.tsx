"use client";

import { useState, useCallback, useRef } from "react";

import { LocationPinIcon, SpinnerIcon } from "@/components/icons";
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
            <SpinnerIcon className="h-4 w-4 animate-spin mr-1.5" />
            Locating...
          </>
        ) : (
          <>
            <LocationPinIcon className="w-4 h-4 mr-1" />
            Near me
          </>
        )}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
