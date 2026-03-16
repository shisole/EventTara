import { notFound, redirect } from "next/navigation";

import WelcomePageEditor from "@/components/dashboard/WelcomePageEditor";
import WelcomeQRCode from "@/components/dashboard/WelcomeQRCode";
import { createClient } from "@/lib/supabase/server";
import { type Database } from "@/lib/supabase/types";

import GenerateEventWelcomeButton from "./GenerateEventWelcomeButton";

/** Deterministic code for an event welcome page */
function eventWelcomeCode(slug: string, eventId: string) {
  return `${slug}-${eventId.slice(0, 8)}`;
}

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

  // Fetch welcome page — try by event_id first, fall back to deterministic code
  type WelcomePageRow = Database["public"]["Tables"]["welcome_pages"]["Row"];
  let welcomePage: WelcomePageRow | null = null;

  const { data: byEventId } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byEventId) {
    welcomePage = byEventId;
  } else {
    // Fallback: query by deterministic code pattern
    const expectedCode = eventWelcomeCode(club.slug, id);
    const { data: byCode } = await supabase
      .from("welcome_pages")
      .select("*")
      .eq("code", expectedCode)
      .maybeSingle();
    welcomePage = byCode;
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
        <div className="rounded-2xl bg-white py-12 text-center shadow-md dark:bg-gray-900 dark:shadow-gray-950/30">
          <h3 className="mb-2 text-lg font-heading font-bold dark:text-white">
            No welcome page yet
          </h3>
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            Generate a welcome page for {event.title} to create a scannable QR code.
          </p>
          <GenerateEventWelcomeButton
            clubSlug={club.slug}
            clubName={club.name}
            eventId={id}
            eventTitle={event.title}
          />
        </div>
      )}
    </div>
  );
}
