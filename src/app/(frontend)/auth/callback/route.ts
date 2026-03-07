import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/events";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = createServiceClient();
        const meta = user.user_metadata;
        const preferredName: string | undefined = meta?.full_name ?? meta?.name;

        console.log("[auth/callback] user:", user.id, "provider:", user.app_metadata?.provider);

        // Upsert user row (without username — that's handled by /setup-username)
        const { error: upsertErr } = await admin.from("users").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            full_name: preferredName ?? "User",
            avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
            role: "participant",
          },
          { onConflict: "id", ignoreDuplicates: false },
        );

        if (upsertErr) {
          console.error("[auth/callback] upsert error:", upsertErr.message);
        }

        // Handle organizer signup metadata
        if (meta?.role === "organizer") {
          await admin.from("organizer_profiles").upsert(
            {
              user_id: user.id,
              org_name: meta.org_name,
              description: meta.org_description ?? null,
              logo_url: meta.org_logo_url ?? null,
            },
            { onConflict: "user_id" },
          );

          await admin.from("users").update({ role: "organizer" }).eq("id", user.id);

          return NextResponse.redirect(`${origin}/dashboard`);
        }

        // Check if user needs to set up username
        const { data: profile, error: profileErr } = await admin
          .from("users")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        console.log("[auth/callback] username check:", {
          username: profile?.username,
          error: profileErr?.message,
        });

        if (!profile?.username) {
          console.log("[auth/callback] redirecting to /setup-username");
          return NextResponse.redirect(`${origin}/setup-username?next=${encodeURIComponent(next)}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
