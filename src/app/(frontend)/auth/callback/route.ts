import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { buildUsername } from "@/lib/utils/generate-username";

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
        const preferredName = meta?.full_name ?? meta?.name;
        const username = await buildUsername(admin, preferredName, user.email ?? "");

        // Upsert with service role to bypass RLS — the DB trigger creates the
        // row with elevated privileges, so the user's client can't UPDATE it.
        await admin.from("users").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            full_name: preferredName ?? "User",
            avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
            role: "participant",
            username,
          },
          { onConflict: "id", ignoreDuplicates: false },
        );

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
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
