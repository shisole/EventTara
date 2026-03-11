import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Call atomic RPC
  const { data, error } = await supabase.rpc("claim_qr_code", {
    p_token: token,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[qr-claim] RPC error:", error.message);
    return NextResponse.json({ error: "Failed to claim QR code" }, { status: 500 });
  }

  const result: {
    success?: boolean;
    error?: string;
    badge_title?: string;
    already_had_badge?: boolean;
    serial_number?: number;
    batch_quantity?: number;
    batch_name?: string;
    badge_description?: string;
    badge_image_url?: string;
    badge_category?: string;
    badge_rarity?: string;
  } = data as Record<string, unknown>;

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  // Send notification if badge was newly awarded (fire-and-forget)
  if (!result.already_had_badge && result.badge_title) {
    void createNotification(supabase, {
      userId: user.id,
      type: "badge_earned",
      title: "Badge Earned!",
      body: `You earned the "${result.badge_title}" badge`,
      href: "/achievements",
    });
  }

  return NextResponse.json(result);
}
