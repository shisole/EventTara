import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateUsername } from "@/lib/utils/generate-username";

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
        const provider = user.app_metadata?.provider;

        // Ensure public.users row exists (trigger may not have fired yet for OAuth)
        const { data: existingRow } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingRow) {
          const meta = user.user_metadata;
          await supabase.from("users").insert({
            id: user.id,
            email: user.email ?? null,
            full_name: meta?.full_name ?? meta?.name ?? "User",
            avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
            role: "participant",
          });
        }

        // Sync Google profile data to users table
        if (provider === "google") {
          const meta = user.user_metadata;
          const updates: Record<string, string | null> = {};

          if (meta?.full_name) updates.full_name = meta.full_name;
          if (meta?.avatar_url) updates.avatar_url = meta.avatar_url;

          if (Object.keys(updates).length > 0) {
            await supabase.from("users").update(updates).eq("id", user.id);
          }

          // Generate username if not set
          await generateUsername(supabase, user.id, user.email ?? "");
        }

        // Handle organizer signup metadata
        if (user.user_metadata?.role === "organizer") {
          const meta = user.user_metadata;

          await supabase.from("organizer_profiles").upsert(
            {
              user_id: user.id,
              org_name: meta.org_name,
              description: meta.org_description ?? null,
              logo_url: meta.org_logo_url ?? null,
            },
            { onConflict: "user_id" },
          );

          await supabase.from("users").update({ role: "organizer" }).eq("id", user.id);

          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
