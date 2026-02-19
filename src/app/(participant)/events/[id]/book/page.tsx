import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "@/components/booking/BookingForm";

export default async function BookEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, price")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!event) notFound();

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-heading font-bold mb-8 text-center">Book Your Spot</h1>
      <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
        <BookingForm
          eventId={event.id}
          eventTitle={event.title}
          eventDate={event.date}
          price={Number(event.price)}
        />
      </div>
    </div>
  );
}
