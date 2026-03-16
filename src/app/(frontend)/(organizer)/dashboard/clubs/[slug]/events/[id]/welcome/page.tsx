import { notFound, redirect } from "next/navigation";

import WelcomePageEditor from "@/components/dashboard/WelcomePageEditor";
import WelcomeQRCode from "@/components/dashboard/WelcomeQRCode";
import { createClient } from "@/lib/supabase/server";

export default async function EventWelcomePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  // Check permission
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect(`/dashboard/clubs/${slug}`);
  }

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("id, title, club_id")
    .eq("id", id)
    .single();
  if (event?.club_id !== club.id) notFound();

  // Fetch welcome page for this event
  const { data: welcomePage, error: wpError } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (wpError) {
    console.error("[event-welcome] Query failed:", wpError.message, wpError.code);
  }

  // Get claim count if welcome page exists
  let claimCount = 0;
  if (welcomePage) {
    const { count } = await supabase
      .from("welcome_page_claims")
      .select("id", { count: "exact", head: true })
      .eq("welcome_page_id", welcomePage.id);
    claimCount = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold dark:text-white">
        Welcome Page — {event.title}
      </h1>

      {welcomePage ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <WelcomePageEditor
            welcomePage={welcomePage}
            claimCount={claimCount}
            clubSlug={club.slug}
            eventId={id}
            eventTitle={event.title}
          />
          <WelcomeQRCode code={welcomePage.code} clubName={club.name} title={welcomePage.title} />
        </div>
      ) : (
        <GenerateEventWelcomePage
          clubSlug={club.slug}
          clubName={club.name}
          eventId={id}
          eventTitle={event.title}
        />
      )}
    </div>
  );
}

function GenerateEventWelcomePage({
  clubSlug,
  clubName,
  eventId,
  eventTitle,
}: {
  clubSlug: string;
  clubName: string;
  eventId: string;
  eventTitle: string;
}) {
  return (
    <div className="rounded-2xl bg-white py-12 text-center shadow-md dark:bg-gray-900 dark:shadow-gray-950/30">
      <h3 className="mb-2 text-lg font-heading font-bold dark:text-white">No welcome page yet</h3>
      <p className="mb-4 text-gray-500 dark:text-gray-400">
        Generate a welcome page for {eventTitle} to create a scannable QR code.
      </p>
      <GenerateButton clubSlug={clubSlug} clubName={clubName} eventId={eventId} />
    </div>
  );
}

function GenerateButton({
  clubSlug,
  clubName,
  eventId,
}: {
  clubSlug: string;
  clubName: string;
  eventId: string;
}) {
  async function generate() {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: club } = await supabase
      .from("clubs")
      .select("id, name, slug")
      .eq("slug", clubSlug)
      .single();
    if (!club) return;

    const { data: event } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .single();
    if (!event) return;

    const code = `${club.slug}-${eventId.slice(0, 8)}`;

    const { error } = await supabase.from("welcome_pages").insert({
      code,
      title: `Welcome to ${event.title}!`,
      subtitle: `Hosted by ${clubName}`,
      club_id: club.id,
      event_id: eventId,
      redirect_url: `/events/${eventId}`,
      is_active: true,
      created_by: user.id,
    });

    if (error) {
      // Code collision — append random suffix and retry once
      if (error.code === "23505") {
        const retryCode = `${code}-${Math.random().toString(36).slice(2, 6)}`;
        const { error: retryError } = await supabase.from("welcome_pages").insert({
          code: retryCode,
          title: `Welcome to ${event.title}!`,
          subtitle: `Hosted by ${clubName}`,
          club_id: club.id,
          event_id: eventId,
          redirect_url: `/events/${eventId}`,
          is_active: true,
          created_by: user.id,
        });
        if (retryError) {
          console.error("[event-welcome] Insert retry failed:", retryError.message);
          return;
        }
      } else {
        console.error("[event-welcome] Insert failed:", error.message);
        return;
      }
    }

    redirect(`/dashboard/clubs/${clubSlug}/events/${eventId}/welcome`);
  }

  return (
    <form action={generate}>
      <button
        type="submit"
        className="rounded-lg bg-lime-500 px-6 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-lime-400"
      >
        Generate Welcome Page
      </button>
    </form>
  );
}
