import { NextResponse } from "next/server";

import { onEventCompleted } from "@/lib/badges/award-event-badge";
import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";
import { sendEmail } from "@/lib/email/send";
import { eventPublishedHtml } from "@/lib/email/templates/event-published";
import { findOverlappingEvent, formatOverlapDate } from "@/lib/events/overlap";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase.from("events").select("*").eq("id", id).single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Fetch distances for this event
  const { data: distances } = await supabase
    .from("event_distances")
    .select("id, event_id, distance_km, label, price, max_participants")
    .eq("event_id", id)
    .order("distance_km", { ascending: true });

  return NextResponse.json({ event, distances: distances ?? [] });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the event to check club_id for permission
  const { data: currentEvent } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", id)
    .single();

  if (!currentEvent?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Verify user has permission to edit events in this club (moderator+)
  const role = await checkClubPermissionServer(
    user.id,
    currentEvent.club_id,
    CLUB_PERMISSIONS.edit_event,
  );
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Use provided coordinates, or fall back to province centroid lookup
  let coordinates = body.coordinates === undefined ? undefined : body.coordinates;
  if (coordinates === undefined && body.location) {
    const province = findProvinceFromLocation(body.location);
    if (province) {
      coordinates = { lat: province.lat, lng: province.lng };
    }
  }

  // Check for overlapping events by this club (when date is being changed)
  if (body.date) {
    const { data: clubEvents } = await supabase
      .from("events")
      .select("id, title, date, end_date")
      .eq("club_id", currentEvent.club_id)
      .in("status", ["draft", "published"]);

    if (clubEvents) {
      const overlap = findOverlappingEvent(
        body.date,
        body.end_date === undefined ? null : body.end_date,
        clubEvents,
        id, // exclude the event being updated
      );
      if (overlap) {
        return NextResponse.json(
          {
            error: `Cannot update this event — it would overlap with your club's event "${overlap.title}" on ${formatOverlapDate(overlap.date, overlap.end_date)}. Adjust the date/time or update the other event first.`,
          },
          { status: 409 },
        );
      }
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({
      title: body.title,
      description: body.description,
      type: body.type,
      date: body.date,
      ...(body.end_date !== undefined && { end_date: body.end_date }),
      location: body.location,
      ...(coordinates !== undefined && { coordinates }),
      max_participants: body.max_participants,
      price: body.price,
      cover_image_url: body.cover_image_url,
      ...(body.difficulty_level !== undefined && { difficulty_level: body.difficulty_level }),
      ...(body.waiver_text !== undefined && { waiver_text: body.waiver_text }),
      ...(body.members_only !== undefined && { members_only: body.members_only }),
      ...(body.payment_paused !== undefined && { payment_paused: body.payment_paused }),
      ...(body.contact_url !== undefined && { contact_url: body.contact_url }),
      ...(body.status && { status: body.status }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-award event badge when marked as completed (fire-and-forget)
  if (body.status === "completed") {
    onEventCompleted(id, supabase).catch(() => null);
  }

  // Notify club members when event is published (fire-and-forget)
  if (body.status === "published" && event.club_id) {
    (async () => {
      // Get club name and members (excluding the publishing user)
      const [{ data: club }, { data: members }] = await Promise.all([
        supabase.from("clubs").select("name").eq("id", event.club_id).single(),
        supabase
          .from("club_members")
          .select("user_id")
          .eq("club_id", event.club_id)
          .neq("user_id", user.id),
      ]);

      if (!members?.length) return;

      const clubName = club?.name ?? "Your club";
      const eventDate = event.date
        ? new Date(event.date).toLocaleDateString("en-PH", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "TBA";

      // Batch-insert in-app notifications
      await createNotifications(
        supabase,
        members.map((m) => ({
          userId: m.user_id,
          type: "event_published" as const,
          title: `New event: ${event.title}`,
          body: `${clubName} published "${event.title}"`,
          href: `/events/${id}`,
          actorId: user.id,
          metadata: { event_id: id, club_id: event.club_id },
        })),
      );

      // Send emails to members (query emails, fire-and-forget)
      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in(
          "id",
          members.map((m) => m.user_id),
        );

      if (users?.length) {
        const emailPromises = users
          .filter((u) => u.email)
          .map((u) =>
            sendEmail({
              to: u.email!,
              subject: `New event from ${clubName}: ${event.title}`,
              html: eventPublishedHtml({
                userName: u.full_name || "Member",
                eventTitle: event.title,
                eventDate,
                eventLocation: event.location || "TBA",
                eventType: event.type || "",
                clubName,
                eventId: id,
              }),
            }),
          );
        await Promise.allSettled(emailPromises);
      }
    })().catch((error_) => console.error("[EventPublished] Notification error:", error_));
  }

  // Replace distances if provided (delete all then re-insert)
  let distances: {
    id: string;
    event_id: string;
    distance_km: number;
    label: string | null;
    price: number;
    max_participants: number;
  }[] = [];
  if (Array.isArray(body.distances)) {
    // Delete existing distances for this event
    await supabase.from("event_distances").delete().eq("event_id", id);

    // Re-insert if non-empty
    if (body.distances.length > 0) {
      const distanceRows = body.distances.map(
        (d: {
          distance_km: number;
          label?: string | null;
          price: number;
          max_participants: number;
        }) => ({
          event_id: id,
          distance_km: d.distance_km,
          label: d.label ?? null,
          price: d.price,
          max_participants: d.max_participants,
        }),
      );

      const { data: insertedDistances, error: distError } = await supabase
        .from("event_distances")
        .insert(distanceRows)
        .select();

      if (distError) {
        return NextResponse.json({ error: distError.message }, { status: 500 });
      }
      distances = insertedDistances ?? [];
    }
  } else {
    // If distances not provided in body, return current distances
    const { data: currentDistances } = await supabase
      .from("event_distances")
      .select("id, event_id, distance_km, label, price, max_participants")
      .eq("event_id", id)
      .order("distance_km", { ascending: true });
    distances = currentDistances ?? [];
  }

  return NextResponse.json({ event, distances });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the event to check club_id for permission
  const { data: event } = await supabase.from("events").select("club_id").eq("id", id).single();

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Verify user has permission to delete events in this club (admin+)
  const role = await checkClubPermissionServer(
    user.id,
    event.club_id,
    CLUB_PERMISSIONS.delete_event,
  );
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("events").update({ status: "cancelled" }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
