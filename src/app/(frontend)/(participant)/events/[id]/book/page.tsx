import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "@/components/booking/BookingForm";

export default async function BookEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ for?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const isFriendMode = search.for === "friend";
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, price, max_participants, organizer_id")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user already booked
  let existingBooking: { id: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .single();
    existingBooking = data;
  }

  // If user already booked and not in friend mode, redirect
  if (existingBooking && !isFriendMode) {
    redirect("/my-events");
  }

  // Get spots left via RPC
  const { data: totalParticipants } = await supabase
    .rpc("get_total_participants", { p_event_id: id });
  const spotsLeft = event.max_participants - (totalParticipants || 0);

  // Fetch organizer payment info
  let organizerPaymentInfo = null;
  if (Number(event.price) > 0) {
    const { data: organizer } = await supabase
      .from("organizer_profiles")
      .select("payment_info")
      .eq("id", event.organizer_id)
      .single();

    organizerPaymentInfo = organizer?.payment_info as {
      gcash_number?: string;
      maya_number?: string;
    } | null;
  }

  const mode = isFriendMode && existingBooking ? "friend" : "self";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-heading font-bold mb-8 text-center">
        {mode === "friend" ? "Book for a Friend" : "Book Your Spot"}
      </h1>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-8">
        <BookingForm
          eventId={event.id}
          eventTitle={event.title}
          eventDate={event.date}
          price={Number(event.price)}
          organizerPaymentInfo={organizerPaymentInfo}
        />
      </div>
    </div>
  );
}
