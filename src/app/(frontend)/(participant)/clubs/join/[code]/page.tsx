import type { Metadata } from "next";
import Image from "next/image";

import JoinViaInviteButton from "@/components/clubs/JoinViaInviteButton";
import { ACTIVITY_TYPE_BADGE_COLORS, ACTIVITY_TYPE_LABELS } from "@/lib/constants/activity-types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Join Club -- EventTara",
  description: "Join a club via invite link on EventTara.",
};

const logoColors: string[] = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-lime-500",
  "bg-forest-500",
];

function getLogoColor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (char.codePointAt(0) ?? 0) + ((hash << 5) - hash);
  }
  return logoColors[Math.abs(hash) % logoColors.length];
}

export default async function JoinClubPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  // Validate invite code
  const { data: invite, error: inviteError } = await supabase
    .from("club_invites")
    .select("id, club_id, invite_code, max_uses, uses, expires_at")
    .eq("invite_code", code)
    .maybeSingle();

  // Check for errors
  if (inviteError || !invite) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8">
          <svg
            className="h-16 w-16 text-red-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h1 className="font-heading text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This invite link is invalid or does not exist. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  // Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8">
          <svg
            className="h-16 w-16 text-amber-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="font-heading text-2xl font-bold mb-2">Invite Expired</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This invite link has expired. Please ask the club admin for a new invite.
          </p>
        </div>
      </div>
    );
  }

  // Check max uses
  if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8">
          <svg
            className="h-16 w-16 text-amber-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <h1 className="font-heading text-2xl font-bold mb-2">Invite Limit Reached</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This invite link has reached its maximum number of uses. Please ask the club admin for a
            new invite.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the club info
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, description, logo_url, activity_types, visibility")
    .eq("id", invite.club_id)
    .single();

  if (!club) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8">
          <h1 className="font-heading text-2xl font-bold mb-2">Club Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400">
            The club associated with this invite no longer exists.
          </p>
        </div>
      </div>
    );
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("club_members")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if already a member
  let isAlreadyMember = false;
  if (user) {
    const { data: existing } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isAlreadyMember = !!existing;
  }

  const initial = club.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-8 text-center">
        {/* Club logo */}
        <div className="flex justify-center mb-4">
          {club.logo_url ? (
            <Image
              src={club.logo_url}
              alt={club.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-md",
                getLogoColor(club.name),
              )}
            >
              {initial}
            </div>
          )}
        </div>

        {/* Club name */}
        <h1 className="font-heading text-2xl font-bold mb-1">You&apos;ve been invited to join</h1>
        <p className="font-heading text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">
          {club.name}
        </p>

        {/* Description */}
        {club.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {club.description}
          </p>
        )}

        {/* Activity badges */}
        {club.activity_types.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {club.activity_types.map((type) => (
              <span
                key={type}
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                  ACTIVITY_TYPE_BADGE_COLORS[type as keyof typeof ACTIVITY_TYPE_BADGE_COLORS] ??
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                )}
              >
                {ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] ?? type}
              </span>
            ))}
          </div>
        )}

        {/* Member count */}
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
          {memberCount ?? 0} {(memberCount ?? 0) === 1 ? "member" : "members"}
        </p>

        {/* Join button */}
        <JoinViaInviteButton
          clubSlug={club.slug}
          inviteCode={code}
          isLoggedIn={!!user}
          isAlreadyMember={isAlreadyMember}
        />
      </div>
    </div>
  );
}
