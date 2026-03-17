import Link from "next/link";

import { Avatar, DemoBadge } from "@/components/ui";
import { isClubReviewsEnabled } from "@/lib/cms/cached";
import { REVIEW_TAGS } from "@/lib/constants/review-tags";
import { createClient } from "@/lib/supabase/server";

interface ClubCard {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  member_count: number;
  event_count: number;
  avgRating: number | null;
  reviewCount: number;
  topTag: string | null;
  is_demo: boolean;
  visibility: "public" | "private";
}

export default async function ClubsSection() {
  const supabase = await createClient();

  // Fetch all public clubs
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url, is_demo, visibility")
    .order("created_at", { ascending: true })
    .limit(12);

  if (!clubs || clubs.length === 0) return null;

  const clubIds = clubs.map((c) => c.id);

  // Fetch member counts and event counts in parallel
  const [memberRows, eventRows] = await Promise.all([
    supabase.from("club_members").select("club_id").in("club_id", clubIds),
    supabase
      .from("events")
      .select("club_id")
      .in("club_id", clubIds)
      .in("status", ["published", "completed"]),
  ]);

  const memberCounts: Record<string, number> = {};
  for (const row of memberRows.data || []) {
    memberCounts[row.club_id] = (memberCounts[row.club_id] || 0) + 1;
  }

  const eventCounts: Record<string, number> = {};
  for (const row of eventRows.data || []) {
    if (row.club_id) {
      eventCounts[row.club_id] = (eventCounts[row.club_id] || 0) + 1;
    }
  }

  const clubList = clubs.map((club) => ({
    id: club.id,
    name: club.name,
    slug: club.slug,
    logo_url: club.logo_url,
    member_count: memberCounts[club.id] || 0,
    event_count: eventCounts[club.id] || 0,
    is_demo: club.is_demo,
    visibility: club.visibility,
  }));

  // Fetch review stats if feature is enabled
  const reviewsEnabled = await isClubReviewsEnabled();
  const reviewStatsMap: Record<
    string,
    { avgRating: number; reviewCount: number; topTag: string | null }
  > = {};

  if (reviewsEnabled) {
    const { data: reviewRows } = await supabase
      .from("club_reviews")
      .select("club_id, rating, tags")
      .in("club_id", clubIds);

    if (reviewRows && reviewRows.length > 0) {
      const grouped: Record<string, { ratings: number[]; tagCounts: Record<string, number> }> = {};
      for (const row of reviewRows) {
        if (!grouped[row.club_id]) {
          grouped[row.club_id] = { ratings: [], tagCounts: {} };
        }
        grouped[row.club_id].ratings.push(row.rating);
        if (Array.isArray(row.tags)) {
          for (const tag of row.tags) {
            grouped[row.club_id].tagCounts[tag] = (grouped[row.club_id].tagCounts[tag] || 0) + 1;
          }
        }
      }

      for (const [clubId, stats] of Object.entries(grouped)) {
        const avgRating = stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length;

        // Find the most popular positive tag
        const positiveTagKeys = new Set(
          REVIEW_TAGS.filter((t) => t.sentiment === "positive").map((t) => t.key),
        );
        let topTag: string | null = null;
        let topTagCount = 0;
        for (const [tag, count] of Object.entries(stats.tagCounts)) {
          if (positiveTagKeys.has(tag) && count > topTagCount) {
            topTag = tag;
            topTagCount = count;
          }
        }

        reviewStatsMap[clubId] = {
          avgRating,
          reviewCount: stats.ratings.length,
          topTag,
        };
      }
    }
  }

  const cards: ClubCard[] = clubList.map((club) => {
    const stats = reviewStatsMap[club.id];
    return {
      ...club,
      avgRating: stats?.avgRating ?? null,
      reviewCount: stats?.reviewCount ?? 0,
      topTag: stats?.topTag ?? null,
    };
  });

  const tagLabelMap = Object.fromEntries(REVIEW_TAGS.map((t) => [t.key, t.label]));

  return (
    <section className="bg-white py-12 dark:bg-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Community Clubs
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {cards.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.slug}`}
              className="group flex w-36 flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-lime-200 hover:bg-lime-50/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-lime-900 dark:hover:bg-lime-950/20"
            >
              <Avatar
                src={club.logo_url}
                alt={club.name}
                size="lg"
                className="mb-3 ring-2 ring-transparent transition-all group-hover:scale-105 group-hover:ring-lime-500"
              />
              <span className="mb-1 max-w-full truncate text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                {club.name}
              </span>
              {club.is_demo && <DemoBadge className="mb-1" />}
              {club.visibility === "private" && (
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" />
                  </svg>
                  Invite only
                </span>
              )}

              {reviewsEnabled && club.reviewCount > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-amber-500">&#9733;</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {club.avgRating === null ? "--" : club.avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({club.reviewCount})
                    </span>
                  </div>
                  {club.topTag && (
                    <span className="mt-1.5 inline-block max-w-full truncate rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-medium text-lime-700 dark:bg-lime-900/40 dark:text-lime-400">
                      {tagLabelMap[club.topTag] || club.topTag}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {club.member_count} member{club.member_count === 1 ? "" : "s"}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
