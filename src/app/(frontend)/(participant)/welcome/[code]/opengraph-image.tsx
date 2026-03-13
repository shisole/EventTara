import { ImageResponse } from "next/og";

import { loadCursiveFont, loadFaviconDataUri } from "@/lib/og/brand-assets";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Welcome page on EventTara";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [fontData, faviconUri, supabase] = await Promise.all([
    loadCursiveFont(),
    loadFaviconDataUri(),
    createClient(),
  ]);

  const { data: page } = await supabase
    .from("welcome_pages")
    .select("title, subtitle, hero_image_url, clubs(name, logo_url)")
    .eq("code", code)
    .maybeSingle();

  if (!page) {
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
        Page Not Found
      </div>,
      { ...size },
    );
  }

  const club = page.clubs as { name: string; logo_url: string | null } | null;

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
      {/* Background: hero image or gradient fallback */}
      {page.hero_image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.hero_image_url}
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
            background: "linear-gradient(135deg, #0d9488 0%, #166534 50%, #15803d 100%)",
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
        {/* Welcome pill badge */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 24px",
            borderRadius: 9999,
            backgroundColor: "#0d9488",
            color: "white",
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Welcome
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            marginBottom: 16,
            maxWidth: "90%",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {page.title.length > 60 ? page.title.slice(0, 57) + "..." : page.title}
        </div>

        {/* Subtitle */}
        {page.subtitle && (
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.4,
              maxWidth: "80%",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {page.subtitle.length > 100 ? page.subtitle.slice(0, 97) + "..." : page.subtitle}
          </div>
        )}

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Bottom row: club info (left) + branding (right) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Club info */}
          {club ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {club.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={club.logo_url}
                  alt=""
                  width={40}
                  height={40}
                  style={{ borderRadius: 9999, objectFit: "cover" }}
                />
              )}
              <div
                style={{
                  fontSize: 22,
                  color: "white",
                  fontWeight: 600,
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                }}
              >
                {club.name}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}

          {/* Branding footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Dancing Script", data: fontData, style: "normal", weight: 700 }],
    },
  );
}
