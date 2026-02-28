import { ImageResponse } from "next/og";

import { loadCursiveFont, loadFaviconDataUri, loadSansFont } from "@/lib/og/brand-assets";

export const runtime = "nodejs";
export const alt = "EventTara — Tara na! Book Your Next Adventure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [cursiveFont, sansFont, faviconUri] = await Promise.all([
    loadCursiveFont(),
    loadSansFont(),
    loadFaviconDataUri(),
  ]);

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
        fontFamily: "Inter",
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

      {/* Brand name in cursive */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          fontFamily: "Dancing Script",
          color: "#84cc16",
          marginBottom: 16,
        }}
      >
        EventTara
      </div>

      {/* Caption in sans-serif */}
      <div
        style={{
          fontSize: 30,
          fontFamily: "Inter",
          color: "rgba(255, 255, 255, 0.9)",
        }}
      >
        Tara na! Book your next adventure!
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Dancing Script", data: cursiveFont, style: "normal", weight: 700 },
        { name: "Inter", data: sansFont, style: "normal", weight: 400 },
      ],
    },
  );
}
