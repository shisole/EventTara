import { ImageResponse } from "next/og";

import { loadCursiveFont, loadFaviconDataUri } from "@/lib/og/brand-assets";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Adventure Profile on EventTara";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [fontData, faviconUri, supabase] = await Promise.all([
    loadCursiveFont(),
    loadFaviconDataUri(),
    createClient(),
  ]);

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("username", username)
    .single();

  if (!user) {
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
        Profile Not Found
      </div>,
      { ...size },
    );
  }

  const { count: badgeCount } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const badges = badgeCount ?? 0;
  const badgeLabel = badges === 1 ? "Badge Earned" : "Badges Earned";
  const displayName =
    user.full_name.length > 28 ? user.full_name.slice(0, 25) + "..." : user.full_name;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0891b2 0%, #ca8a04 50%, #166534 100%)",
        fontFamily: "sans-serif",
        padding: 60,
      }}
    >
      {/* Adventure Profile label */}
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          padding: "8px 24px",
          borderRadius: 9999,
          backgroundColor: "rgba(255,255,255,0.2)",
          color: "white",
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 32,
          border: "1px solid rgba(255,255,255,0.35)",
        }}
      >
        Adventure Profile
      </div>

      {/* Display name */}
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 800,
          color: "white",
          lineHeight: 1.15,
          marginBottom: 16,
        }}
      >
        {displayName}
      </div>

      {/* Subtitle */}
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "rgba(255,255,255,0.85)",
          fontWeight: 400,
          marginBottom: 0,
        }}
      >
        @{username}
      </div>

      {/* Spacer */}
      <div style={{ display: "flex", flex: 1 }} />

      {/* Badge count card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          backgroundColor: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 16,
          padding: "20px 32px",
          marginBottom: 32,
          alignSelf: "flex-start",
        }}
      >
        {/* Badge icon circle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#ca8a04",
            fontSize: 28,
            fontWeight: 800,
            color: "white",
          }}
        >
          {badges}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.1,
            }}
          >
            {badgeLabel}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.7)",
              marginTop: 4,
            }}
          >
            on EventTara
          </div>
        </div>
      </div>

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
