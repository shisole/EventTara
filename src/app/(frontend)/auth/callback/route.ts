import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Generate a sanitized username from a name or email prefix.
 */
function toUsername(preferredName: string | undefined, email: string): string {
  const prefix = preferredName?.trim()
    ? preferredName
        .trim()
        .toLowerCase()
        .replaceAll(/\s+/g, ".")
        .replaceAll(/[^a-z0-9._-]/g, "")
    : email
        .trim()
        .split("@")[0]
        .toLowerCase()
        .replaceAll(/[^a-z0-9._-]/g, "");
  return prefix || "user";
}

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
        let username = toUsername(preferredName, user.email ?? "");

        // Check collision
        const { data: taken } = await admin
          .from("users")
          .select("id")
          .eq("username", username)
          .neq("id", user.id)
          .maybeSingle();

        if (taken) {
          username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
        }

        // Upsert with service role to bypass RLS
        const { error: upsertError } = await admin.from("users").upsert(
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

        // Fallback: if upsert failed or username still NULL, do explicit UPDATE
        if (upsertError) {
          console.error("[auth/callback] upsert failed:", upsertError.message);
          await admin.from("users").update({ username }).eq("id", user.id);
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
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
