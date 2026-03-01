import type { Metadata } from "next";

import FeedList from "@/components/feed/FeedList";
import { isBadgeShowcaseEnabled } from "@/lib/payload/cached";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Activity Feed",
  description:
    "See what adventurers are up to — events booked, completed, badges earned, and more.",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    badgeShowcase,
  ] = await Promise.all([supabase.auth.getUser(), isBadgeShowcaseEnabled()]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold dark:text-white mb-6">Activity Feed</h1>
      <FeedList
        initialItems={[]}
        initialHasMore={true}
        isAuthenticated={!!user}
        currentUserId={user?.id || null}
        badgeShowcase={badgeShowcase}
      />
    </div>
  );
}
