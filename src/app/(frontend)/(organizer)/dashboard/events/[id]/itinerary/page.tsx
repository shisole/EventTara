import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ItineraryManager from "@/components/dashboard/ItineraryManager";
import { ChevronLeftIcon } from "@/components/icons";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Event Itinerary — EventTara" };

export default async function EventItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("id, title").eq("id", id).single();

  if (!event) notFound();

  const { data: entries } = await supabase
    .from("event_itinerary")
    .select("id, time, title, sort_order")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto">
      <BreadcrumbTitle title={event.title} />
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Event
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Event Itinerary</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Optional — leave empty to hide from participants.
        </p>
      </div>
      <ItineraryManager eventId={id} initialEntries={entries ?? []} />
    </div>
  );
}
