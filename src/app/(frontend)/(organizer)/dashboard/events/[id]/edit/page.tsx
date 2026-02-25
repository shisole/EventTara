import { notFound } from "next/navigation";

import EventForm from "@/components/dashboard/EventForm";
import { createClient } from "@/lib/supabase/server";

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

  // Fetch mountains for hiking events
  let initialMountains: {
    mountain_id: string;
    name: string;
    province: string;
    difficulty_level: number;
    elevation_masl: number | null;
    route_name: string;
    difficulty_override: number | null;
    sort_order: number;
  }[] = [];

  if (event.type === "hiking") {
    const { data: emRows } = await supabase
      .from("event_mountains")
      .select("mountain_id, route_name, difficulty_override, sort_order")
      .eq("event_id", id)
      .order("sort_order");

    if (emRows && emRows.length > 0) {
      const mountainIds = emRows.map((em) => em.mountain_id);
      const { data: mountains } = await supabase
        .from("mountains")
        .select("id, name, province, difficulty_level, elevation_masl")
        .in("id", mountainIds);

      const mountainMap = new Map((mountains || []).map((m) => [m.id, m]));

      initialMountains = emRows.map((em) => {
        const mountain = mountainMap.get(em.mountain_id);
        return {
          mountain_id: em.mountain_id,
          name: mountain?.name ?? "",
          province: mountain?.province ?? "",
          difficulty_level: mountain?.difficulty_level ?? 0,
          elevation_masl: mountain?.elevation_masl ?? null,
          route_name: em.route_name ?? "",
          difficulty_override: em.difficulty_override,
          sort_order: em.sort_order,
        };
      });
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
          end_date: event.end_date,
          location: event.location,
          coordinates: event.coordinates as { lat: number; lng: number } | null,
          max_participants: event.max_participants,
          price: event.price,
          cover_image_url: event.cover_image_url,
          status: event.status,
          initialGuideIds,
          initialMountains: initialMountains,
          difficulty_level: event.difficulty_level,
        }}
      />
    </div>
  );
}
