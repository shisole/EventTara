"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-setup";

interface MapPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number } | null) => void;
  center?: { lat: number; lng: number };
}

// Philippines center
const PH_CENTER = { lat: 12.8797, lng: 121.774 };
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 12;

function ClickHandler({ onChange }: { onChange: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterMap({
  center,
  hasPin,
}: {
  center: { lat: number; lng: number };
  hasPin: boolean;
}) {
  const map = useMap();
  const prevCenterRef = useRef(center);

  useEffect(() => {
    if (center.lat !== prevCenterRef.current.lat || center.lng !== prevCenterRef.current.lng) {
      map.flyTo([center.lat, center.lng], hasPin ? PIN_ZOOM : 10, { duration: 0.8 });
      prevCenterRef.current = center;
    }
  }, [center, hasPin, map]);

  return null;
}

export default function MapPicker({ value, onChange, center }: MapPickerProps) {
  const mapCenter = center || (value ? { lat: value.lat, lng: value.lng } : PH_CENTER);
  const zoom = value ? PIN_ZOOM : DEFAULT_ZOOM;

  const handleClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      onChange(coords);
    },
    [onChange],
  );

  const markerPosition = useMemo(
    (): [number, number] | null => (value ? [value.lat, value.lng] : null),
    [value],
  );

  return (
    <div className="space-y-2">
      <div
        className="relative z-0 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600"
        style={{ height: 300 }}
      >
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={handleClick} />
          <RecenterMap center={mapCenter} hasPin={!!value} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      {value && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
            }}
            className="text-red-500 hover:text-red-600 transition-colors"
          >
            Remove pin
          </button>
        </div>
      )}
      {!value && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click on the map to drop a pin at the event location
        </p>
      )}
    </div>
  );
}
