import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "EventTara — Tara na! Book Your Next Adventure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
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
        {/* Logo circle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "white",
            marginBottom: 24,
            fontSize: 48,
          }}
        >
          ET
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: 12,
          }}
        >
          EventTara
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: 32,
          }}
        >
          Tara na! Book Your Next Adventure
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Hiking", "Mountain Biking", "Road Biking", "Running", "Trail Running"].map(
            (cat) => (
              <div
                key={cat}
                style={{
                  padding: "8px 20px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontSize: 18,
                }}
              >
                {cat}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
