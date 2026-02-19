import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { UIBadge } from "@/components/ui";
import EventGallery from "@/components/events/EventGallery";
import OrganizerCard from "@/components/events/OrganizerCard";
import BookingButton from "@/components/events/BookingButton";

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, cover_image_url, type, date, price, location")
    .eq("id", id)
    .single();

  if (!event) return { title: "Event Not Found" };

  const description = event.description
    ? event.description.slice(0, 160)
    : `Join this ${typeLabels[event.type] || event.type} adventure on EventTara!`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      ...(event.cover_image_url && {
        images: [
          {
            url: event.cover_image_url,
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      ...(event.cover_image_url && { images: [event.cover_image_url] }),
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch event with organizer profile
  const { data: event } = await supabase
    .from("events")
    .select("*, organizer_profiles:organizer_id(*, users:user_id(*))")
    .eq("id", id)
    .single();

  if (!event || event.status !== "published") {
    notFound();
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from("event_photos")
    .select("*")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  // Fetch booking count
  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id)
    .in("status", ["pending", "confirmed"]);

  // Fetch organizer event count
  const { count: orgEventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("organizer_id", event.organizer_id)
    .eq("status", "published");

  const spotsLeft = event.max_participants - (bookingCount || 0);
  const formattedDate = new Date(event.date).toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const formattedTime = new Date(event.date).toLocaleTimeString("en-PH", {
    hour: "numeric", minute: "2-digit",
  });

  const organizer = event.organizer_profiles as any;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-coral-100 to-forest-100 mb-8">
        {event.cover_image_url && (
          <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <UIBadge variant={event.type as any} className="mb-3">
              {typeLabels[event.type] || event.type}
            </UIBadge>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <span>{formattedDate} at {formattedTime}</span>
              <span>{event.location}</span>
            </div>
          </div>

          {event.description && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-3">About This Event</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          <EventGallery photos={photos || []} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 space-y-4 lg:sticky lg:top-24">
            <div className="text-center">
              <span className="text-3xl font-bold text-coral-500">
                {Number(event.price) === 0 ? "Free" : `\u20B1${Number(event.price).toLocaleString()}`}
              </span>
            </div>

            <div className="text-center text-sm text-gray-500">
              <span className="font-medium text-gray-700">{bookingCount || 0}</span> adventurer{(bookingCount || 0) !== 1 ? "s" : ""} joined
              {" \u00B7 "}
              <span className={spotsLeft <= 5 ? "text-red-500 font-medium" : ""}>
                {spotsLeft <= 0 ? "Fully booked" : `${spotsLeft} spots left`}
              </span>
            </div>

            <BookingButton eventId={id} spotsLeft={spotsLeft} price={Number(event.price)} />
          </div>

          {organizer && (
            <OrganizerCard
              orgName={organizer.org_name}
              logoUrl={organizer.logo_url}
              eventCount={orgEventCount || 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
