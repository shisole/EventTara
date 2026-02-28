import { ImageResponse } from "next/og";

import { loadFaviconDataUri } from "@/lib/og/brand-assets";

export const runtime = "nodejs";
export const alt = "EventTara — Outdoor Adventure Events in Panay Island";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const faviconUri = await loadFaviconDataUri();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #166534 0%, #15803d 40%, #0891b2 100%)",
        fontFamily: "sans-serif",
      }}
    >
      {/* Favicon icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUri}
        alt=""
        width={120}
        height={120}
        style={{ borderRadius: 24, marginBottom: 32 }}
      />

      {/* Brand name */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: "#84cc16",
        }}
      >
        EventTara
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 28,
          color: "rgba(255, 255, 255, 0.85)",
          marginTop: 12,
        }}
      >
        Outdoor Adventure Events in Panay Island
      </div>
    </div>,
    { ...size },
  );
}
