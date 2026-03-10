import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";
import { validateWelcomePage } from "@/lib/welcome/validate";

export async function POST(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch welcome page
  const { data: page, error: pageError } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (pageError || !page) {
    return NextResponse.json({ error: "Welcome page not found" }, { status: 404 });
  }

  // Get claim count
  const { count: claimCount } = await supabase
    .from("welcome_page_claims")
    .select("id", { count: "exact", head: true })
    .eq("welcome_page_id", page.id);

  // Validate
  const validation = validateWelcomePage({
    is_active: page.is_active,
    expires_at: page.expires_at,
    max_claims: page.max_claims,
    claimCount: claimCount ?? 0,
  });

  if (!validation.valid) {
    const messages: Record<string, string> = {
      inactive: "This welcome page is no longer active",
      expired: "This offer has expired",
      max_claims_reached: "All rewards have been claimed",
    };
    return NextResponse.json({ error: messages[validation.error] }, { status: 410 });
  }

  // Check existing claim (also guarded by DB unique constraint)
  const { data: existingClaim } = await supabase
    .from("welcome_page_claims")
    .select("id")
    .eq("welcome_page_id", page.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingClaim) {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }

  // Insert claim
  const { error: claimError } = await supabase.from("welcome_page_claims").insert({
    welcome_page_id: page.id,
    user_id: user.id,
  });

  if (claimError) {
    // Unique constraint violation = race condition double claim
    if (claimError.code === "23505") {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 });
    }
    console.error("[welcome-claim] Insert failed:", claimError.message);
    return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 });
  }

  // Award badge if linked
  let badgeAwarded = false;
  if (page.badge_id) {
    // Check if user already has badge
    const { data: existingBadge } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", user.id)
      .eq("badge_id", page.badge_id)
      .maybeSingle();

    if (!existingBadge) {
      const { error: badgeError } = await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_id: page.badge_id,
      });

      if (badgeError) {
        console.error("[welcome-claim] Badge award failed:", badgeError.message);
      } else {
        badgeAwarded = true;

        // Get badge title for notification
        const { data: badge } = await supabase
          .from("badges")
          .select("title")
          .eq("id", page.badge_id)
          .single();

        if (badge) {
          await createNotification(supabase, {
            userId: user.id,
            type: "badge_earned",
            title: "Badge Earned!",
            body: `You earned the "${badge.title}" badge`,
            href: "/achievements",
          });
        }
      }
    }
  }

  return NextResponse.json({ success: true, badge_awarded: badgeAwarded });
}
