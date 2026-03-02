const PUSH_TYPES = new Set([
  "booking_confirmed",
  "event_reminder",
  "badge_earned",
  "border_earned",
]);

Deno.serve(async (req) => {
  const { record } = await req.json();

  if (!record?.type || !PUSH_TYPES.has(record.type)) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const appUrl = Deno.env.get("APP_URL")!;
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET")!;

  const res = await fetch(`${appUrl}/api/push-subscriptions/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": webhookSecret,
    },
    body: JSON.stringify({
      user_id: record.user_id,
      title: record.title,
      body: record.body,
      href: record.href,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
