import type { Metadata } from "next";
import Link from "next/link";

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

  // Fetch initial clubs
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
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Discover Clubs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Find your community of outdoor adventure enthusiasts
          </p>
        </div>
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
      </div>

      <ClubGrid
        initialClubs={clubList}
        initialTotal={total ?? 0}
        initialMemberCounts={memberCounts}
      />
    </div>
  );
}
