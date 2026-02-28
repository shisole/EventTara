import { ImageResponse } from "next/og";

import { loadCursiveFont, loadFaviconDataUri } from "@/lib/og/brand-assets";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/format-date";

export const runtime = "nodejs";
export const alt = "Event on EventTara";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

const typeColors: Record<string, string> = {
  hiking: "#166534",
  mtb: "#92400e",
  road_bike: "#1e40af",
  running: "#0891b2",
  trail_run: "#7c3aed",
};

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [fontData, faviconUri, supabase] = await Promise.all([
    loadCursiveFont(),
    loadFaviconDataUri(),
    createClient(),
  ]);

  const { data: event } = await supabase
    .from("events")
    .select("title, type, date, end_date, price, location, cover_image_url")
    .eq("id", id)
    .single();

  if (!event) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#166534",
          color: "white",
          fontSize: 48,
          fontFamily: "sans-serif",
        }}
      >
        Event Not Found
      </div>,
      { ...size },
    );
  }

  const typeBadgeColor = typeColors[event.type] || "#166534";
  const formattedDate = formatEventDate(event.date, event.end_date, { short: true });
  const price = event.price === 0 ? "Free" : `\u20B1${event.price.toLocaleString()}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Background: event cover image or gradient fallback */}
      {event.cover_image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_image_url}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Dark overlay for text readability */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        </>
      ) : (
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #166534 0%, #15803d 50%, #ca8a04 100%)",
          }}
        />
      )}

      {/* Content overlay */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 60,
          position: "relative",
        }}
      >
        {/* Type badge */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 24px",
            borderRadius: 9999,
            backgroundColor: typeBadgeColor,
            color: "white",
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          {typeLabels[event.type] || event.type}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            marginBottom: 24,
            maxWidth: "90%",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {event.title.length > 60 ? event.title.slice(0, 57) + "..." : event.title}
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Bottom info row */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Date */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.8)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              Date
            </div>
            <div
              style={{
                fontSize: 24,
                color: "white",
                fontWeight: 600,
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {formattedDate}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                }}
              >
                Location
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: "white",
                  fontWeight: 600,
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                }}
              >
                {event.location.length > 30 ? event.location.slice(0, 27) + "..." : event.location}
              </div>
            </div>
          )}

          {/* Price */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.8)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              Price
            </div>
            <div
              style={{
                fontSize: 24,
                color: "white",
                fontWeight: 600,
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {price}
            </div>
          </div>
        </div>

        {/* Branding footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            gap: 12,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={faviconUri} alt="" width={36} height={36} style={{ borderRadius: 8 }} />
          <div
            style={{
              fontSize: 24,
              fontFamily: "Dancing Script",
              fontWeight: 700,
              color: "#84cc16",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            EventTara
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Dancing Script", data: fontData, style: "normal", weight: 700 }],
    },
  );
}
