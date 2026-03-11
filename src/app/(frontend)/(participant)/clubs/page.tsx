import type { Metadata } from "next";
import Link from "next/link";

import ClubCard from "@/components/clubs/ClubCard";
import ClubGrid from "@/components/clubs/ClubGrid";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Discover Clubs -- EventTara",
  description:
    "Find and join outdoor adventure clubs for hiking, mountain biking, road biking, running, and trail running.",
};

export default async function ClubsPage() {
  const supabase = await createClient();

  // Fetch user's clubs if logged in (wrapped in try-catch to avoid crashing the page)
  let myClubs: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    activity_types: string[];
    visibility: "public" | "private";
    description: string | null;
    is_demo: boolean;
  }[] = [];
  let myClubMemberCounts: Record<string, number> = {};

  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user ?? null;

    if (user) {
      const { data: memberships } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id);

      if (memberships && memberships.length > 0) {
        const clubIds = memberships.map((m) => m.club_id);
        const { data: userClubs } = await supabase
          .from("clubs")
          .select("*")
          .in("id", clubIds)
          .order("name");

        myClubs = (userClubs ?? []) as typeof myClubs;

        // Fetch member counts for user's clubs
        if (myClubs.length > 0) {
          const { data: memberRows } = await supabase
            .from("club_members")
            .select("club_id")
            .in("club_id", clubIds);

          for (const row of memberRows ?? []) {
            myClubMemberCounts[row.club_id] = (myClubMemberCounts[row.club_id] ?? 0) + 1;
          }
        }
      }
    }
  } catch {
    // If auth or club queries fail, just show the browse view
    myClubs = [];
    myClubMemberCounts = {};
  }

  // Fetch initial public clubs
  const { data: clubs } = await supabase
    .from("clubs")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(0, 11);

  const { count: total } = await supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .eq("visibility", "public");

  const clubList = clubs ?? [];

  // Fetch member counts for initial clubs
  const memberCounts: Record<string, number> = {};
  if (clubList.length > 0) {
    const clubIds = clubList.map((c) => c.id);
    const { data: memberRows } = await supabase
      .from("club_members")
      .select("club_id")
      .in("club_id", clubIds);

    // Count members per club
    for (const row of memberRows ?? []) {
      memberCounts[row.club_id] = (memberCounts[row.club_id] ?? 0) + 1;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* My Clubs section */}
      {myClubs.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl font-bold">My Clubs</h2>
            <Link href="/clubs/new">
              <Button size="sm" variant="ghost">
                <svg
                  className="h-4 w-4 mr-1.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                New Club
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClubs.map((club) => (
              <ClubCard
                key={club.id}
                slug={club.slug}
                name={club.name}
                logo_url={club.logo_url}
                activity_types={club.activity_types}
                member_count={myClubMemberCounts[club.id] ?? 0}
                visibility={club.visibility}
                description={club.description}
                is_demo={club.is_demo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Discover Clubs header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Discover Clubs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Find your community of outdoor adventure enthusiasts
          </p>
        </div>
        {myClubs.length === 0 && (
          <Link href="/clubs/new">
            <Button size="sm">
              <svg
                className="h-4 w-4 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Create Club
            </Button>
          </Link>
        )}
      </div>

      <ClubGrid
        initialClubs={clubList}
        initialTotal={total ?? 0}
        initialMemberCounts={memberCounts}
      />
    </div>
  );
}
