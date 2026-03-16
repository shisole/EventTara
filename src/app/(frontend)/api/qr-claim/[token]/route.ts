import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { welcomeQrClaimHtml } from "@/lib/email/templates/welcome-qr-claim";
import { createNotification } from "@/lib/notifications/create";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, string> = {};
  if (contentType.includes("application/json")) {
    body = await request.json();
  }

  const { existing_user_id, email, password, full_name } = body as {
    existing_user_id?: string;
    email?: string;
    password?: string;
    full_name?: string;
  };

  let userId: string;
  let isNewUser = false;

  if (existing_user_id) {
    // Existing user — verify they are authenticated as this user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== existing_user_id) {
      return NextResponse.json({ error: "Authentication mismatch" }, { status: 403 });
    }
    userId = existing_user_id;
  } else {
    // Check if current session is authenticated (legacy flow — no body)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
    } else if (email && password && full_name) {
      // New user — create account via service client
      const admin = createServiceClient();
      const { data: adminUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      if (!adminUser.user) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      userId = adminUser.user.id;
      isNewUser = true;

      // Upsert public users row
      await admin.from("users").upsert(
        {
          id: userId,
          email,
          full_name,
          role: "user",
        },
        { onConflict: "id" },
      );
    } else {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  }

  // Use service client for new users (no session), regular client for existing
  const rpcClient = isNewUser ? createServiceClient() : supabase;

  // Call atomic RPC
  const { data, error } = await rpcClient.rpc("claim_qr_code", {
    p_token: token,
    p_user_id: userId,
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
    const notifClient = isNewUser ? createServiceClient() : supabase;
    void createNotification(notifClient, {
      userId,
      type: "badge_earned",
      title: "Badge Earned!",
      body: `You earned the "${result.badge_title}" badge`,
      href: "/achievements",
    });
  }

  // Send welcome + badge email to new users (fire-and-forget)
  if (isNewUser && email && full_name && result.badge_title) {
    void sendEmail({
      to: email,
      subject: `Welcome to EventTara! You claimed the "${result.badge_title}" badge`,
      html: welcomeQrClaimHtml({
        userName: full_name,
        email,
        badgeTitle: result.badge_title,
        badgeDescription: result.badge_description ?? null,
        badgeImageUrl: result.badge_image_url ?? null,
        badgeRarity: result.badge_rarity ?? "common",
        serialNumber: result.serial_number ?? 0,
        batchQuantity: result.batch_quantity ?? 0,
      }),
    });
  }

  return NextResponse.json({ ...result, is_new_user: isNewUser });
}
