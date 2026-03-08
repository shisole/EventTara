import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard — EventTara",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get clubs where user has a management role
  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "moderator"]);

  if (!memberships?.length) redirect("/events");

  const clubIds = memberships.map((m) => m.club_id);

  // Fetch club details
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url, activity_types")
    .in("id", clubIds)
    .order("created_at", { ascending: false });

  // Fetch member counts per club
  const memberCounts: Record<string, number> = {};
  const eventCounts: Record<string, number> = {};

  if (clubs && clubs.length > 0) {
    const [memberResults, eventResults] = await Promise.all([
      supabase.from("club_members").select("club_id", { count: "exact" }).in("club_id", clubIds),
      supabase
        .from("events")
        .select("club_id")
        .in("club_id", clubIds)
        .in("status", ["draft", "published", "completed"]),
    ]);

    // Count members per club
    if (memberResults.data) {
      for (const m of memberResults.data) {
        memberCounts[m.club_id] = (memberCounts[m.club_id] || 0) + 1;
      }
    }

    // Count events per club
    if (eventResults.data) {
      for (const e of eventResults.data) {
        if (e.club_id) {
          eventCounts[e.club_id] = (eventCounts[e.club_id] || 0) + 1;
        }
      }
    }
  }

  // Build role lookup
  const roleByClubId: Record<string, string> = {};
  for (const m of memberships) {
    roleByClubId[m.club_id] = m.role;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(clubs ?? []).map((club) => (
          <Link
            key={club.id}
            href={`/dashboard/clubs/${club.slug}`}
            className="group bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 hover:shadow-lg dark:hover:shadow-gray-950/50 transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              {club.logo_url ? (
                <Image
                  src={club.logo_url}
                  alt={club.name}
                  width={48}
                  height={48}
                  className="rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-lime-600 dark:text-lime-400">
                    {club.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-heading font-bold dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors truncate">
                  {club.name}
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {roleByClubId[club.id]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {memberCounts[club.id] || 0} members
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {eventCounts[club.id] || 0} events
              </span>
            </div>

            {club.activity_types && club.activity_types.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {club.activity_types.slice(0, 3).map((type) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {(!clubs || clubs.length === 0) && (
        <div className="bg-golden-50 dark:bg-golden-900/20 border border-golden-200 dark:border-golden-800 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-heading font-bold mb-2 dark:text-white">No Clubs Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don&apos;t manage any clubs yet. Create one to start organizing events.
          </p>
          <Button variant="secondary">Create a Club</Button>
        </div>
      )}
    </div>
  );
}
