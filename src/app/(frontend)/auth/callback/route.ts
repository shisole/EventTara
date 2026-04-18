import { NextResponse } from "next/server";

import { isAvatarShopEnabled } from "@/lib/cms/cached";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";
import { safeRedirectUrl } from "@/lib/utils/safe-redirect";
import { sanitizeName } from "@/lib/utils/sanitize-name";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectUrl(searchParams.get("next"), "/feed");

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
            full_name: sanitizeName(preferredName ?? "User"),
            avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
            role: "user",
          },
          { onConflict: "id", ignoreDuplicates: false },
        );

        if (upsertErr) {
          console.error("[auth/callback] upsert error:", upsertErr.message);
        }

        // Award signup bonus tokens (idempotent — skips if already awarded)
        void (async () => {
          const { data: existingTx } = await admin
            .from("token_transactions")
            .select("id")
            .eq("user_id", user.id)
            .eq("reference_id", "signup")
            .limit(1)
            .maybeSingle();
          if (!existingTx) {
            await awardTokens(admin, user.id, TOKEN_REWARDS.signup, "milestone", "signup");
          }
        })().catch(() => null);

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

        // Chain: /setup-avatar → /setup-username → destination
        // Only show avatar picker for NEW users (no username yet) when avatar shop is enabled
        const avatarShopOn = await isAvatarShopEnabled();
        if (avatarShopOn && !profile?.has_picked_avatar && !profile?.username) {
          return NextResponse.redirect(
            `${origin}/setup-avatar?next=${encodeURIComponent(`/setup-username?next=${encodeURIComponent(next)}`)}`,
          );
        }

        if (!profile?.username) {
          console.log("[auth/callback] redirecting to /setup-username");
          return NextResponse.redirect(
            `${origin}/setup-username?next=${encodeURIComponent("/welcome")}`,
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
