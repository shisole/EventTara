import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventForm from "@/components/dashboard/EventForm";

export const metadata = { title: "Edit Event — EventTara" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();

  if (!event) notFound();

  // Fetch existing event guides for pre-population
  let initialGuideIds: string[] = [];
  if (event.type === "hiking") {
    const { data: eventGuides } = await supabase
      .from("event_guides")
      .select("guide_id")
      .eq("event_id", id);
    if (eventGuides) {
      initialGuideIds = eventGuides.map((eg) => eg.guide_id);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-8 dark:text-white">Edit Event</h1>
      <EventForm
        mode="edit"
        initialData={{
          id: event.id,
          title: event.title,
          description: event.description || "",
          type: event.type,
          date: event.date,
          location: event.location,
          coordinates: event.coordinates as { lat: number; lng: number } | null,
          max_participants: event.max_participants,
          price: Number(event.price),
          cover_image_url: event.cover_image_url,
          status: event.status,
          initialGuideIds,
        }}
      />
    </div>
  );
}
