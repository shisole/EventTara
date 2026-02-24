"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-setup";

interface MapDisplayProps {
  lat: number;
  lng: number;
  label?: string;
}

export default function MapDisplay({ lat, lng, label }: MapDisplayProps) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ height: 250 }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>{label && <Popup>{label}</Popup>}</Marker>
      </MapContainer>
    </div>
  );
}
