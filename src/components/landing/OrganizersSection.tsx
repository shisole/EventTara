import Link from "next/link";

import { Avatar } from "@/components/ui";
import { isOrganizerReviewsEnabled } from "@/lib/cms/cached";
import { REVIEW_TAGS } from "@/lib/constants/review-tags";
import { createClient } from "@/lib/supabase/server";

interface OrganizerCard {
  id: string;
  org_name: string;
  logo_url: string | null;
  event_count: number;
  avgRating: number | null;
  reviewCount: number;
  topTag: string | null;
}

export default async function OrganizersSection() {
  const supabase = await createClient();

  const { data: organizers } = await supabase
    .from("organizer_profiles")
    .select("id, org_name, logo_url, events!inner(id)")
    .eq("events.status", "published")
    .limit(12);

  // Dedupe (inner join can return multiples) and sort by event count
  const uniqueOrganizers = organizers
    ? Object.values(
        organizers.reduce<
          Record<
            string,
            { id: string; org_name: string; logo_url: string | null; event_count: number }
          >
        >((acc, org: any) => {
          if (!acc[org.id]) {
            acc[org.id] = {
              id: org.id,
              org_name: org.org_name,
              logo_url: org.logo_url,
              event_count: 0,
            };
          }
          acc[org.id].event_count += Array.isArray(org.events) ? org.events.length : 1;
          return acc;
        }, {}),
      ).sort((a, b) => b.event_count - a.event_count)
    : [];

  if (uniqueOrganizers.length === 0) return null;

  // Fetch review stats if feature is enabled
  const reviewsEnabled = await isOrganizerReviewsEnabled();
  const reviewStatsMap: Record<
    string,
    { avgRating: number; reviewCount: number; topTag: string | null }
  > = {};

  if (reviewsEnabled) {
    const orgIds = uniqueOrganizers.map((o) => o.id);
    const { data: reviewRows } = await supabase
      .from("organizer_reviews")
      .select("organizer_id, rating, tags")
      .in("organizer_id", orgIds);

    if (reviewRows && reviewRows.length > 0) {
      const grouped: Record<string, { ratings: number[]; tagCounts: Record<string, number> }> = {};
      for (const row of reviewRows) {
        if (!grouped[row.organizer_id]) {
          grouped[row.organizer_id] = { ratings: [], tagCounts: {} };
        }
        grouped[row.organizer_id].ratings.push(row.rating);
        if (Array.isArray(row.tags)) {
          for (const tag of row.tags) {
            grouped[row.organizer_id].tagCounts[tag] =
              (grouped[row.organizer_id].tagCounts[tag] || 0) + 1;
          }
        }
      }

      for (const [orgId, stats] of Object.entries(grouped)) {
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

        reviewStatsMap[orgId] = {
          avgRating,
          reviewCount: stats.ratings.length,
          topTag,
        };
      }
    }
  }

  const cards: OrganizerCard[] = uniqueOrganizers.map((org) => {
    const stats = reviewStatsMap[org.id];
    return {
      ...org,
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
          Pioneer Organizers
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cards.map((org) => (
            <Link
              key={org.id}
              href={`/organizers/${org.id}`}
              className="group flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-lime-200 hover:bg-lime-50/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-lime-900 dark:hover:bg-lime-950/20"
            >
              <Avatar
                src={org.logo_url}
                alt={org.org_name}
                size="lg"
                className="mb-3 ring-2 ring-transparent transition-all group-hover:scale-105 group-hover:ring-lime-500"
              />
              <span className="mb-1 max-w-full truncate text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                {org.org_name}
              </span>

              {reviewsEnabled && org.reviewCount > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-amber-500">&#9733;</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {org.avgRating === null ? "—" : org.avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({org.reviewCount})
                    </span>
                  </div>
                  {org.topTag && (
                    <span className="mt-1.5 inline-block max-w-full truncate rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-medium text-lime-700 dark:bg-lime-900/40 dark:text-lime-400">
                      {tagLabelMap[org.topTag] || org.topTag}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {org.event_count} event{org.event_count === 1 ? "" : "s"}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
