import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ClubProfileHeader from "@/components/clubs/ClubProfileHeader";
import ClubRoleBadge from "@/components/clubs/ClubRoleBadge";
import EventCard from "@/components/events/EventCard";
import { Avatar } from "@/components/ui";
import { type ClubRole } from "@/lib/clubs/types";
import { fetchEventEnrichments, mapEventToCard } from "@/lib/events/map-event-card";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!club) return { title: "Club Not Found" };

  return {
    title: `${club.name} -- EventTara`,
    description: club.description || `Check out ${club.name} on EventTara`,
  };
}

export default async function ClubProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch club
  const { data: club, error } = await supabase.from("clubs").select("*").eq("slug", slug).single();

  if (error || !club) {
    console.error("Club page query error:", error?.message, error?.code, "slug:", slug);
    notFound();
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch counts, members, events, and current membership in parallel
  const today = new Date().toISOString().split("T")[0];

  const [
    memberCountResult,
    eventCountResult,
    membersResult,
    eventsResult,
    currentMembershipResult,
  ] = await Promise.all([
    supabase
      .from("club_members")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .in("status", ["published", "completed"]),
    supabase
      .from("club_members")
      .select("id, user_id, role, joined_at, users(id, full_name, username, avatar_url)")
      .eq("club_id", club.id)
      .order("joined_at", { ascending: true })
      .limit(50),
    supabase
      .from("events")
      .select("*, bookings(count), clubs(name)")
      .eq("club_id", club.id)
      .in("status", ["published", "completed"])
      .order("date", { ascending: true })
      .limit(6),
    user
      ? supabase
          .from("club_members")
          .select("role")
          .eq("club_id", club.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Debug: log any query errors
  if (memberCountResult.error)
    console.error("Club page memberCount error:", memberCountResult.error.message);
  if (eventCountResult.error)
    console.error("Club page eventCount error:", eventCountResult.error.message);
  if (membersResult.error) console.error("Club page members error:", membersResult.error.message);
  if (eventsResult.error) console.error("Club page events error:", eventsResult.error.message);

  const { count: memberCount } = memberCountResult;
  const { count: eventCount } = eventCountResult;
  const { data: members } = membersResult;
  const { data: events } = eventsResult;

  // Build current membership
  const currentMembership: { role: ClubRole; userId: string } | null =
    currentMembershipResult.data && user
      ? { role: currentMembershipResult.data.role as ClubRole, userId: user.id }
      : null;

  // Sort members by role hierarchy
  const roleOrder: Record<string, number> = { owner: 0, admin: 1, moderator: 2, member: 3 };
  const sortedMembers = (members ?? []).sort((a, b) => {
    const ra = roleOrder[a.role] ?? 99;
    const rb = roleOrder[b.role] ?? 99;
    if (ra !== rb) return ra - rb;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  // Map events for EventCard
  const eventList = events ?? [];
  const enrichments = await fetchEventEnrichments(supabase, eventList);
  const eventCards = eventList.map((event: any) => mapEventToCard(event, today, enrichments));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile header */}
      <ClubProfileHeader
        name={club.name}
        slug={club.slug}
        description={club.description}
        logo_url={club.logo_url}
        cover_url={club.cover_url}
        activity_types={club.activity_types}
        visibility={club.visibility}
        location={club.location}
        member_count={memberCount ?? 0}
        event_count={eventCount ?? 0}
        currentUserId={user?.id ?? null}
        currentMembership={currentMembership}
      />

      {/* Upcoming Events Section */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">Events</h2>
        {eventCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventCards.map((event) => (
              <EventCard key={event.id} {...event} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <svg
              className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No events yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              This club hasn&apos;t created any events
            </p>
          </div>
        )}
      </section>

      {/* Members Section */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">
          Members{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal text-base">
            ({memberCount ?? 0})
          </span>
        </h2>
        {sortedMembers.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedMembers.map((member) => {
                const userData = Array.isArray(member.users) ? member.users[0] : member.users;
                const displayName = userData?.full_name || userData?.username || "Unknown";

                return (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center gap-1.5 py-2"
                  >
                    <Avatar src={userData?.avatar_url ?? null} alt={displayName} size="md" />
                    <div className="min-w-0 w-full">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      {member.role !== "member" && (
                        <ClubRoleBadge role={member.role as ClubRole} className="mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <p className="text-gray-500 dark:text-gray-400">No members yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
