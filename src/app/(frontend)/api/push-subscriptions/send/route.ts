import { NextResponse } from "next/server";
import { sendNotification, setVapidDetails } from "web-push";

import { createClient } from "@/lib/supabase/server";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  setVapidDetails(
    "mailto:noreply@eventtara.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

const PUSH_TYPES = new Set([
  "booking_confirmed",
  "event_reminder",
  "badge_earned",
  "border_earned",
  "event_published",
]);

interface SupabaseWebhookPayload {
  type: string;
  table: string;
  record: {
    user_id?: string;
    type?: string;
    title?: string;
    body?: string;
    href?: string | null;
  };
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhook = (await request.json()) as SupabaseWebhookPayload;
  const record = webhook.record;

  if (!record?.user_id || !record?.title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Only send push for specific notification types
  if (!record.type || !PUSH_TYPES.has(record.type)) {
    return NextResponse.json({ skipped: true });
  }

  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", record.user_id);

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const payload = JSON.stringify({
    title: record.title,
    body: record.body ?? "",
    icon: "/favicon-192x192.png",
    href: record.href ?? "/",
  });

  const expiredIds: string[] = [];
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        payload,
      );
      sent++;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        expiredIds.push(sub.id);
      } else {
        console.error(`Push failed for ${sub.endpoint}:`, error);
      }
    }
  }

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return NextResponse.json({ sent, expired: expiredIds.length });
}
