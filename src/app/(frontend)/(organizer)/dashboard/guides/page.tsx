import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Avatar } from "@/components/ui";

export const metadata = { title: "My Guides — EventTara" };

export default async function GuidesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let guides: any[] = [];

  if (user) {
    const { data: guideRows } = await supabase
      .from("guides")
      .select("*")
      .eq("created_by", user!.id)
      .order("created_at", { ascending: false });

    const guideIds = (guideRows || []).map((g) => g.id);

    let eventCounts: Record<string, number> = {};
    let reviewStats: Record<string, { avg: number; count: number }> = {};

    if (guideIds.length > 0) {
      const { data: eventGuideRows } = await supabase
        .from("event_guides")
        .select("guide_id")
        .in("guide_id", guideIds);

      if (eventGuideRows) {
        for (const row of eventGuideRows) {
          eventCounts[row.guide_id] = (eventCounts[row.guide_id] || 0) + 1;
        }
      }

      const { data: reviews } = await supabase
        .from("guide_reviews")
        .select("guide_id, rating")
        .in("guide_id", guideIds);

      if (reviews) {
        const perGuide: Record<string, { sum: number; count: number }> = {};
        for (const r of reviews) {
          if (!perGuide[r.guide_id]) perGuide[r.guide_id] = { sum: 0, count: 0 };
          perGuide[r.guide_id].sum += r.rating;
          perGuide[r.guide_id].count++;
        }
        for (const [gid, stats] of Object.entries(perGuide)) {
          reviewStats[gid] = { avg: stats.sum / stats.count, count: stats.count };
        }
      }
    }

    guides = (guideRows || []).map((guide) => ({
      ...guide,
      event_count: eventCounts[guide.id] || 0,
      avg_rating: reviewStats[guide.id]?.avg || null,
      review_count: reviewStats[guide.id]?.count || 0,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold dark:text-white">My Guides</h1>
        <Link href="/dashboard/guides/new">
          <Button>Add Guide</Button>
        </Link>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <h2 className="text-lg font-heading font-bold mb-2 dark:text-white">No guides yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add your first guide to assign them to events.
          </p>
          <Link href="/dashboard/guides/new">
            <Button>Add Guide</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/dashboard/guides/${guide.id}`}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={guide.avatar_url} alt={guide.full_name} size="lg" />
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-gray-900 dark:text-white truncate">
                    {guide.full_name}
                  </h3>
                  {guide.contact_number && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {guide.contact_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                  {guide.event_count} {guide.event_count === 1 ? "event" : "events"}
                </span>

                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-golden-400"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {guide.avg_rating ? guide.avg_rating.toFixed(1) : "N/A"}
                  {guide.review_count > 0 && (
                    <span className="text-gray-400 dark:text-gray-500">({guide.review_count})</span>
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
