import OrganizerAlertStrip from "@/components/home/OrganizerAlertStrip";
import { createClient } from "@/lib/supabase/server";

interface HomeOrganizerStripProps {
  managedClubIds: string[];
}

export default async function HomeOrganizerStrip({ managedClubIds }: HomeOrganizerStripProps) {
  if (managedClubIds.length === 0) return null;

  const supabase = await createClient();

  const { data: managedEvents } = await supabase
    .from("events")
    .select("id")
    .in("club_id", managedClubIds);

  const managedEventIds = (managedEvents ?? []).map((e) => e.id);
  if (managedEventIds.length === 0) return null;

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .in("event_id", managedEventIds);

  const pendingCount = count ?? 0;
  if (pendingCount === 0) return null;

  return <OrganizerAlertStrip pendingCount={pendingCount} clubCount={managedClubIds.length} />;
}
