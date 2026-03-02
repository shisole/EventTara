import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

interface CreateNotificationParams {
  userId: string;
  type: NotificationInsert["type"];
  title: string;
  body: string;
  href?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget helper to insert a single notification.
 * Skips self-notifications (actorId === userId).
 */
export async function createNotification(
  supabase: SupabaseClient<Database>,
  params: CreateNotificationParams,
): Promise<void> {
  if (params.actorId && params.actorId === params.userId) return;

  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    href: params.href ?? null,
    actor_id: params.actorId ?? null,
    metadata: params.metadata ?? {},
  });
}

/**
 * Fire-and-forget helper to insert multiple notifications at once.
 * Filters out self-notifications.
 */
export async function createNotifications(
  supabase: SupabaseClient<Database>,
  paramsList: CreateNotificationParams[],
): Promise<void> {
  const rows: NotificationInsert[] = paramsList
    .filter((p) => !p.actorId || p.actorId !== p.userId)
    .map((p) => ({
      user_id: p.userId,
      type: p.type,
      title: p.title,
      body: p.body,
      href: p.href ?? null,
      actor_id: p.actorId ?? null,
      metadata: p.metadata ?? {},
    }));

  if (rows.length === 0) return;

  await supabase.from("notifications").insert(rows);
}
