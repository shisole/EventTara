import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

import { loadCursiveFont, loadFaviconDataUri } from "@/lib/og/brand-assets";
import { resolveOrganizerProfile } from "@/lib/organizers/resolve-profile";
import { type Database } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Organizer Reviews on EventTara";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function StarRow({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <div
        key={i}
        style={{
          display: "flex",
          fontSize: 40,
          color: i <= Math.round(rating) ? "#f59e0b" : "#d1d5db",
        }}
      >
        &#9733;
      </div>,
    );
  }
  return <div style={{ display: "flex", gap: 4 }}>{stars}</div>;
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrUsername } = await params;
  const [fontData, faviconUri] = await Promise.all([loadCursiveFont(), loadFaviconDataUri()]);

  // Use a cookie-free client — OG images only read public data and cookies()
  // conflicts with ISR caching on Vercel, causing 500 errors.
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
        Reviews Not Found
      </div>,
      { ...size },
    );
  }

  const [{ data: profile }, { data: reviewRows }] = await Promise.all([
    supabase.from("organizer_profiles").select("org_name, logo_url").eq("id", orgId).single(),
    supabase.from("organizer_reviews").select("rating").eq("organizer_id", orgId),
  ]);

  const orgName = profile?.org_name ?? "Organizer";
  const totalReviews = reviewRows?.length ?? 0;
  const avgRating =
    totalReviews > 0 ? reviewRows!.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

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
          marginBottom: 32,
        }}
      >
        Organizer Reviews
      </div>

      {/* Org name */}
      <div
        style={{
          display: "flex",
          fontSize: 52,
          fontWeight: 800,
          color: "white",
          lineHeight: 1.2,
          marginBottom: 24,
          maxWidth: "90%",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {orgName.length > 50 ? orgName.slice(0, 47) + "..." : orgName}
      </div>

      {/* Stars + count */}
      {totalReviews > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <StarRow rating={avgRating} />
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "white",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            {avgRating.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            from {totalReviews} review{totalReviews === 1 ? "" : "s"}
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 16,
          }}
        >
          No reviews yet
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
