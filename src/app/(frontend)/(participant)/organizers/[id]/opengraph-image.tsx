import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

import { loadCursiveFont, loadFaviconDataUri } from "@/lib/og/brand-assets";
import { resolveOrganizerProfile } from "@/lib/organizers/resolve-profile";
import { type Database } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Organizer Profile on EventTara";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrUsername } = await params;
  const [fontData, faviconUri] = await Promise.all([loadCursiveFont(), loadFaviconDataUri()]);

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const orgId = await resolveOrganizerProfile(supabase, idOrUsername);

  if (!orgId) {
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
        Organizer Not Found
      </div>,
      { ...size },
    );
  }

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("org_name, description, logo_url")
    .eq("id", orgId)
    .single();

  const orgName = profile?.org_name ?? "Organizer";
  const description = profile?.description?.slice(0, 120) ?? "";
  const logoUrl = profile?.logo_url;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        fontFamily: "sans-serif",
        background: "linear-gradient(135deg, #166534 0%, #15803d 50%, #ca8a04 100%)",
        padding: 60,
        position: "relative",
      }}
    >
      {/* Top label */}
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          padding: "8px 24px",
          borderRadius: 9999,
          backgroundColor: "rgba(255,255,255,0.2)",
          color: "white",
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 40,
        }}
      >
        Event Organizer
      </div>

      {/* Logo + Name row */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 20 }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            width={100}
            height={100}
            style={{ borderRadius: 20, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 100,
              height: 100,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            {orgName.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          style={{
            display: "flex",
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            maxWidth: "70%",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {orgName.length > 40 ? orgName.slice(0, 37) + "..." : orgName}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.4,
            maxWidth: "85%",
            textShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        >
          {description}
          {(profile?.description?.length ?? 0) > 120 ? "..." : ""}
        </div>
      )}

      {/* Spacer */}
      <div style={{ display: "flex", flex: 1 }} />

      {/* Branding footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          EventTara
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Dancing Script", data: fontData, style: "normal", weight: 700 }],
    },
  );
}
