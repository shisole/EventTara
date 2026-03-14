import Link from "next/link";
import { notFound } from "next/navigation";

import EventForm from "@/components/dashboard/EventForm";
import { ChevronLeftIcon } from "@/components/icons";
import { isPaymentPauseEnabled } from "@/lib/cms/cached";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();
  return { title: club ? `Create Event — ${club.name}` : "Create Event" };
}

export default async function ClubNewEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/clubs/${slug}/events`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Events
      </Link>
      <h1 className="text-2xl font-heading font-bold mb-8 dark:text-white">Create New Event</h1>
      <EventForm
        mode="create"
        clubId={club.id}
        paymentPauseEnabled={await isPaymentPauseEnabled()}
      />
    </div>
  );
}
