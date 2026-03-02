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

interface SendPushBody {
  user_id?: string;
  title?: string;
  body?: string;
  href?: string;
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SendPushBody;

  if (!body.user_id || !body.title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", body.user_id);

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const payload = JSON.stringify({
    title: body.title,
    body: body.body ?? "",
    icon: "/favicon-192x192.png",
    href: body.href ?? "/",
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
