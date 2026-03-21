import Link from "next/link";
import { notFound } from "next/navigation";

import EventPhotosClient from "@/components/events/EventPhotosClient";
import { ChevronLeftIcon } from "@/components/icons";
import { cdnUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title").eq("id", id).single();

  if (!event) return { title: "Event Not Found" };

  return {
    title: `Photos — ${event.title}`,
    description: `Browse and share photos from ${event.title}`,
  };
}

export default async function EventPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("id, title, club_id")
    .eq("id", id)
    .single();

  if (!event) notFound();

  // Fetch photos with uploader info
  const { data: photos } = await supabase
    .from("event_photos")
    .select(
      "id, event_id, user_id, image_url, caption, sort_order, uploaded_at, users(full_name, username, avatar_url)",
    )
    .eq("event_id", id)
    .order("uploaded_at", { ascending: false });

  // Check if current user can upload
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let canUpload = false;
  if (authUser) {
    const [{ data: checkin }, { data: membership }] = await Promise.all([
      supabase
        .from("event_checkins")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", authUser.id)
        .maybeSingle(),
      supabase
        .from("club_members")
        .select("id")
        .eq("club_id", event.club_id)
        .eq("user_id", authUser.id)
        .maybeSingle(),
    ]);
    canUpload = !!checkin || !!membership;
  }

  // Check if user is club admin (for delete permissions on any photo)
  let isClubAdmin = false;
  if (authUser) {
    const { data: adminCheck } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", event.club_id)
      .eq("user_id", authUser.id)
      .maybeSingle();
    isClubAdmin = adminCheck?.role === "owner" || adminCheck?.role === "admin";
  }

  const mappedPhotos = (photos ?? []).map((p) => {
    const user = p.users as {
      full_name: string;
      username: string | null;
      avatar_url: string | null;
    } | null;
    return {
      id: p.id,
      event_id: p.event_id,
      user_id: p.user_id,
      image_url: cdnUrl(p.image_url) ?? p.image_url,
      raw_image_url: p.image_url,
      caption: p.caption,
      uploaded_at: p.uploaded_at,
      userName: user?.full_name ?? "Unknown",
      userUsername: user?.username ?? null,
      userAvatarUrl: user?.avatar_url ?? null,
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to event
      </Link>

      <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">{event.title}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {mappedPhotos.length} photo{mappedPhotos.length === 1 ? "" : "s"} shared
      </p>

      <EventPhotosClient
        eventId={id}
        initialPhotos={mappedPhotos}
        canUpload={canUpload}
        isClubAdmin={isClubAdmin}
        currentUserId={authUser?.id ?? null}
      />
    </div>
  );
}
