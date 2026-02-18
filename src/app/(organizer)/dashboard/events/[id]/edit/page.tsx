import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventForm from "@/components/dashboard/EventForm";

export const metadata = { title: "Edit Event — EventTara" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) notFound();

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-8">Edit Event</h1>
      <EventForm
        mode="edit"
        initialData={{
          id: event.id,
          title: event.title,
          description: event.description || "",
          type: event.type,
          date: event.date,
          location: event.location,
          max_participants: event.max_participants,
          price: Number(event.price),
          cover_image_url: event.cover_image_url,
          status: event.status,
        }}
      />
    </div>
  );
}
