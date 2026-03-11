import { NextResponse } from "next/server";

import { isAvatarShopEnabled } from "@/lib/cms/cached";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

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
            role: "user",
          },
          { onConflict: "id", ignoreDuplicates: false },
        );

        if (upsertErr) {
          console.error("[auth/callback] upsert error:", upsertErr.message);
        }

        // Check if user needs onboarding steps (avatar picker, username)
        const { data: profile, error: profileErr } = await admin
          .from("users")
          .select("username, has_picked_avatar")
          .eq("id", user.id)
          .maybeSingle();

        console.log("[auth/callback] onboarding check:", {
          username: profile?.username,
          has_picked_avatar: profile?.has_picked_avatar,
          error: profileErr?.message,
        });

        // Chain: /setup-avatar → /setup-username → destination (only if avatar shop enabled)
        const avatarShopOn = await isAvatarShopEnabled();
        if (avatarShopOn && !profile?.has_picked_avatar) {
          const avatarNext = profile?.username
            ? next
            : `/setup-username?next=${encodeURIComponent(next)}`;
          return NextResponse.redirect(
            `${origin}/setup-avatar?next=${encodeURIComponent(avatarNext)}`,
          );
        }

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
