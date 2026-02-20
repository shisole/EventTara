import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import UpcomingBookings from "@/components/participant/UpcomingBookings";
import PastEvents from "@/components/participant/PastEvents";

export const metadata = { title: "My Events — EventTara" };

export default async function MyEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if guest
  const { data: profile } = await supabase.from("users").select("is_guest").eq("id", user.id).single();

  // Upcoming bookings
  const { data: upcomingData } = await supabase
    .from("bookings")
    .select("id, qr_code, payment_status, payment_method, payment_proof_url, events(id, title, type, date, location)")
    .eq("user_id", user.id)
    .in("status", ["confirmed", "pending"])
    .order("booked_at", { ascending: false });

  const upcoming = (upcomingData || [])
    .filter((b: any) => b.events && new Date(b.events.date) >= new Date())
    .map((b: any) => ({
      id: b.id,
      qrCode: b.qr_code || "",
      eventTitle: b.events.title,
      eventType: b.events.type,
      eventDate: b.events.date,
      eventLocation: b.events.location,
      eventId: b.events.id,
      paymentStatus: b.payment_status,
      paymentMethod: b.payment_method,
      paymentProofUrl: b.payment_proof_url,
    }));

  // Past events
  const pastBookings = (upcomingData || [])
    .filter((b: any) => b.events && new Date(b.events.date) < new Date());

  const pastEventIds = pastBookings.map((b: any) => b.events.id);

  // Get check-ins and badges for past events
  let checkins: any[] = [];
  let userBadges: any[] = [];

  if (pastEventIds.length > 0) {
    const { data: c } = await supabase
      .from("event_checkins")
      .select("event_id")
      .eq("user_id", user.id)
      .in("event_id", pastEventIds);
    checkins = c || [];

    const { data: ub } = await supabase
      .from("user_badges")
      .select("badges(event_id, title, image_url)")
      .eq("user_id", user.id);
    userBadges = ub || [];
  }

  const checkinSet = new Set(checkins.map((c: any) => c.event_id));
  const badgeMap = new Map(
    userBadges.map((ub: any) => [ub.badges?.event_id, { title: ub.badges?.title, imageUrl: ub.badges?.image_url }])
  );

  const past = pastBookings.map((b: any) => ({
    eventId: b.events.id,
    eventTitle: b.events.title,
    eventType: b.events.type,
    eventDate: b.events.date,
    badgeTitle: badgeMap.get(b.events.id)?.title || null,
    badgeImageUrl: badgeMap.get(b.events.id)?.imageUrl || null,
    checkedIn: checkinSet.has(b.events.id),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-2xl font-heading font-bold">My Events</h1>

      {profile?.is_guest && (
        <div className="bg-golden-50 border border-golden-200 rounded-2xl p-5 text-center">
          <p className="font-medium mb-2">Create an account to keep your badges forever!</p>
          <Link href="/signup"><Button size="sm">Create Account</Button></Link>
        </div>
      )}

      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Upcoming</h2>
        <UpcomingBookings bookings={upcoming} />
      </section>

      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Past Adventures</h2>
        <PastEvents events={past} />
      </section>
    </div>
  );
}
