import ClubUpdatesSection, { type ClubUpdateEvent } from "@/components/home/ClubUpdatesSection";
import { createClient } from "@/lib/supabase/server";

interface HomeClubUpdatesProps {
  memberClubIds: string[];
}

export default async function HomeClubUpdates({ memberClubIds }: HomeClubUpdatesProps) {
  if (memberClubIds.length === 0) return null;

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [clubEventsResult, clubsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, date, location, type, club_id")
      .in("club_id", memberClubIds)
      .eq("status", "published")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(4),
    supabase.from("clubs").select("id, name, slug, logo_url").in("id", memberClubIds),
  ]);

  const clubUpdateEvents: ClubUpdateEvent[] = (clubEventsResult.data ?? []) as ClubUpdateEvent[];
  const clubMap = new Map(
    (
      (clubsResult.data ?? []) as {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
      }[]
    ).map((c) => [c.id, { name: c.name, slug: c.slug, logo_url: c.logo_url }]),
  );

  return <ClubUpdatesSection events={clubUpdateEvents} clubMap={clubMap} />;
}
