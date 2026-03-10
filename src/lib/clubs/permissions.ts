import { createClient } from "@/lib/supabase/client";

import { type ClubRole } from "./types";

const ROLE_HIERARCHY: Record<ClubRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
};

export async function checkClubPermission(
  userId: string,
  clubId: string,
  minimumRole: ClubRole,
): Promise<ClubRole | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  const memberRole: ClubRole = data.role;
  if (ROLE_HIERARCHY[memberRole] >= ROLE_HIERARCHY[minimumRole]) return memberRole;
  return null;
}

export async function checkClubPermissionServer(
  userId: string,
  clubId: string,
  minimumRole: ClubRole,
): Promise<ClubRole | null> {
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  const memberRole: ClubRole = data.role;
  if (ROLE_HIERARCHY[memberRole] >= ROLE_HIERARCHY[minimumRole]) return memberRole;
  return null;
}

export const CLUB_PERMISSIONS = {
  create_event: "admin" as ClubRole,
  edit_event: "moderator" as ClubRole,
  delete_event: "admin" as ClubRole,
  manage_bookings: "moderator" as ClubRole,
  invite_members: "admin" as ClubRole,
  remove_members: "admin" as ClubRole,
  edit_settings: "admin" as ClubRole,
  manage_payment: "owner" as ClubRole,
  delete_club: "owner" as ClubRole,
  promote_roles: "owner" as ClubRole,
  view_events: "member" as ClubRole,
  create_thread: "member" as ClubRole,
  create_announcement: "admin" as ClubRole,
  pin_thread: "admin" as ClubRole,
  lock_thread: "moderator" as ClubRole,
  delete_any_thread: "moderator" as ClubRole,
  delete_any_reply: "moderator" as ClubRole,
  manage_categories: "admin" as ClubRole,
} as const;
