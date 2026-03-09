import Link from "next/link";
import { notFound } from "next/navigation";

import ClubEventsTable from "@/components/dashboard/ClubEventsTable";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();
  return { title: club ? `Events — ${club.name}` : "Club Events" };
}

export default async function ClubEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data } = await supabase
    .from("events")
    .select("*, bookings(count)")
    .eq("club_id", club.id)
    .order("date", { ascending: true });

  const events = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Events</h1>
        <Link href={`/dashboard/clubs/${slug}/events/new`}>
          <Button>Create Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <h2 className="text-lg font-heading font-bold mb-2 dark:text-white">No events yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first event for this club!
          </p>
          <Link href={`/dashboard/clubs/${slug}/events/new`}>
            <Button>Create Event</Button>
          </Link>
        </div>
      ) : (
        <ClubEventsTable events={events} clubSlug={slug} />
      )}
    </div>
  );
}
