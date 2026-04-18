import { NextResponse } from "next/server";

import { isPaymentPauseEnabled } from "@/lib/cms/cached";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";
import { findOverlappingEvent, formatOverlapDate } from "@/lib/events/overlap";
import { createNotification, createNotifications } from "@/lib/notifications/create";
import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { sanitizeName } from "@/lib/utils/sanitize-name";

interface CompanionInput {
  full_name: string;
  phone: string | null;
  event_distance_id?: string | null;
}

interface RentalItemInput {
  rental_item_id: string;
  quantity: number;
  size?: string | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body — FormData (e-wallet with proof) or JSON (cash/free)
  const contentType = request.headers.get("content-type") || "";
  let eventId: string;
  let paymentMethod: string;
  let proofFile: File | null = null;
  let mode: "self" | "friend" = "self";
  let companions: CompanionInput[] = [];
  let eventDistanceId: string | null = null;
  let participantNotes: string | null = null;
  let waiverAcceptedAt: string | null = null;
  let rentalItems: RentalItemInput[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    eventId = formData.get("event_id") as string;
    paymentMethod = formData.get("payment_method") as string;
    proofFile = formData.get("payment_proof") as File | null;
    mode = (formData.get("mode") as string) === "friend" ? "friend" : "self";
    eventDistanceId = (formData.get("event_distance_id") as string) || null;
    participantNotes = (formData.get("participant_notes") as string) || null;
    waiverAcceptedAt = (formData.get("waiver_accepted_at") as string) || null;
    const companionsStr = formData.get("companions") as string | null;
    if (companionsStr) {
      try {
        companions = JSON.parse(companionsStr);
      } catch {
        /* ignore */
      }
    }
    const rentalItemsStr = formData.get("rental_items") as string | null;
    if (rentalItemsStr) {
      try {
        rentalItems = JSON.parse(rentalItemsStr);
      } catch {
        /* ignore */
      }
    }
  } else {
    const body = await request.json();
    eventId = body.event_id;
    paymentMethod = body.payment_method;
    mode = body.mode === "friend" ? "friend" : "self";
    companions = body.companions || [];
    eventDistanceId = body.event_distance_id || null;
    participantNotes = body.participant_notes || null;
    waiverAcceptedAt = body.waiver_accepted_at || null;
    rentalItems = body.rental_items || [];
  }

  if (!eventId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate companion names
  for (const c of companions) {
    if (!c.full_name?.trim()) {
      return NextResponse.json({ error: "Companion names cannot be empty" }, { status: 400 });
    }
  }

  // Check event exists and is published
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("status", "published")
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check for overlapping bookings by this participant
  const { data: userBookings } = await supabase
    .from("bookings")
    .select("event_id")
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"]);

  if (userBookings && userBookings.length > 0) {
    const bookedEventIds = userBookings.map((b) => b.event_id).filter((id) => id !== eventId);

    if (bookedEventIds.length > 0) {
      const { data: bookedEvents } = await supabase
        .from("events")
        .select("id, title, date, end_date")
        .in("id", bookedEventIds)
        .in("status", ["published"]);

      if (bookedEvents) {
        const overlap = findOverlappingEvent(event.date, event.end_date, bookedEvents);
        if (overlap) {
          return NextResponse.json(
            {
              error: `You can't book this event — you already have "${overlap.title}" on ${formatOverlapDate(overlap.date, overlap.end_date)}. Cancel that booking first if you'd like to join this one instead.`,
            },
            { status: 409 },
          );
        }
      }
    }
  }

  // Check capacity — per-distance if distances are involved, otherwise event-level
  const requestedSlots = mode === "self" ? 1 + companions.length : companions.length;

  // Collect all distance IDs involved in this booking (booker's + companions')
  const allDistanceIds = new Set<string>();
  if (eventDistanceId) allDistanceIds.add(eventDistanceId);
  for (const c of companions) {
    if (c.event_distance_id) allDistanceIds.add(c.event_distance_id);
  }

  if (allDistanceIds.size > 0) {
    // Fetch all involved distances in one query
    const { data: distanceRows } = await supabase
      .from("event_distances")
      .select("id, max_participants")
      .eq("event_id", eventId)
      .in("id", [...allDistanceIds]);

    const distanceMap = new Map((distanceRows || []).map((d) => [d.id, d.max_participants]));

    // Validate all distance IDs belong to this event
    for (const dId of allDistanceIds) {
      if (!distanceMap.has(dId)) {
        return NextResponse.json({ error: "Invalid distance selection" }, { status: 400 });
      }
    }

    // Count how many slots this request needs per distance
    const requestedPerDistance = new Map<string, number>();
    if (eventDistanceId && mode === "self") {
      requestedPerDistance.set(
        eventDistanceId,
        (requestedPerDistance.get(eventDistanceId) || 0) + 1,
      );
    }
    for (const c of companions) {
      if (c.event_distance_id) {
        requestedPerDistance.set(
          c.event_distance_id,
          (requestedPerDistance.get(c.event_distance_id) || 0) + 1,
        );
      }
    }

    // Check capacity per distance
    for (const [distId, requested] of requestedPerDistance) {
      const maxP = distanceMap.get(distId) || 0;

      // Count bookings with this distance
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("event_distance_id", distId)
        .in("status", ["pending", "confirmed"]);

      // Count companions with this distance
      const { count: companionCount } = await supabase
        .from("booking_companions")
        .select("id", { count: "exact", head: true })
        .eq("event_distance_id", distId)
        .in("status", ["pending", "confirmed"]);

      const current = (bookingCount || 0) + (companionCount || 0);
      if (current + requested > maxP) {
        return NextResponse.json(
          { error: "Not enough spots available for this distance" },
          { status: 400 },
        );
      }
    }
  } else {
    // Event-level capacity check using RPC (accounts for companions)
    const { data: totalParticipants } = await supabase.rpc("get_total_participants", {
      p_event_id: eventId,
    });

    if ((totalParticipants || 0) + requestedSlots > event.max_participants) {
      return NextResponse.json({ error: "Not enough spots available" }, { status: 400 });
    }
  }

  // Check for existing booking
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"])
    .single();

  if (mode === "self" && existingBooking) {
    return NextResponse.json({ error: "You have already booked this event" }, { status: 400 });
  }

  if (mode === "friend" && !existingBooking) {
    return NextResponse.json({ error: "You need to book for yourself first" }, { status: 400 });
  }

  if (mode === "friend" && companions.length === 0) {
    return NextResponse.json({ error: "Please add at least one companion" }, { status: 400 });
  }

  const paymentPauseFlagEnabled = await isPaymentPauseEnabled();
  const isPaymentPaused = paymentPauseFlagEnabled && event.payment_paused;
  const isFree = !isPaymentPaused && (event.price === 0 || paymentMethod === "free");
  const isEwallet = !isPaymentPaused && (paymentMethod === "gcash" || paymentMethod === "maya");
  const isCash = !isPaymentPaused && paymentMethod === "cash";

  // Validate payment method when not paused
  if (!isPaymentPaused && !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Determine booking status and payment status
  let bookingStatus: "confirmed" | "pending";
  let paymentStatus: "paid" | "pending";
  let qrCode: string | null = null;

  if (isPaymentPaused) {
    bookingStatus = "pending";
    paymentStatus = "pending";
    qrCode = null;
  } else if (isFree) {
    bookingStatus = "confirmed";
    paymentStatus = "paid";
    qrCode = `eventtara:checkin:${eventId}:${user.id}`;
  } else if (isCash) {
    bookingStatus = "pending";
    paymentStatus = "pending";
    qrCode = `eventtara:checkin:${eventId}:${user.id}`;
  } else {
    bookingStatus = "pending";
    paymentStatus = "pending";
    qrCode = null;
  }

  let bookingId: string;
  let bookingRecord: any;

  if (mode === "self") {
    // Create new booking (or reactivate a cancelled one)
    // E-wallet bookings expire in 30 minutes if unpaid; free/cash/paused don't expire
    const expiresAt =
      isEwallet && paymentStatus === "pending"
        ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
        : null;

    // Check if a cancelled booking exists for this user+event (unique constraint)
    const { data: cancelledBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("status", "cancelled")
      .single();

    const bookingPayload = {
      event_id: eventId,
      user_id: user.id,
      payment_method:
        isFree || isPaymentPaused ? null : (paymentMethod as "gcash" | "maya" | "cash"),
      qr_code: qrCode,
      status: bookingStatus,
      payment_status: paymentStatus,
      event_distance_id: eventDistanceId,
      participant_notes: participantNotes,
      waiver_accepted_at: waiverAcceptedAt,
      expires_at: expiresAt,
      payment_proof_url: null,
      payment_verified_at: null,
      payment_verified_by: null,
      payment_reminder_sent_at: null,
    };

    let booking: any;
    let error: any;

    if (cancelledBooking) {
      // Reactivate the cancelled booking with fresh data
      const result = await supabase
        .from("bookings")
        .update(bookingPayload)
        .eq("id", cancelledBooking.id)
        .select()
        .single();
      booking = result.data;
      error = result.error;
    } else {
      const result = await supabase.from("bookings").insert(bookingPayload).select().single();
      booking = result.data;
      error = result.error;
    }

    if (error) {
      console.error("[bookings POST] DB error:", error.message);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    bookingId = booking.id;
    bookingRecord = booking;

    // Upload proof file if e-wallet
    if (isEwallet && proofFile) {
      const fileExt = proofFile.name.split(".").pop() || "jpg";
      const key = `payment-proofs/${eventId}/${booking.id}.${fileExt}`;
      const buffer = Buffer.from(await proofFile.arrayBuffer());

      try {
        const proofUrl = await uploadToR2(key, buffer, proofFile.type || "image/jpeg");

        await supabase
          .from("bookings")
          .update({ payment_proof_url: proofUrl })
          .eq("id", booking.id);

        bookingRecord.payment_proof_url = proofUrl;

        // Notify club moderators+ about the proof upload
        const { data: clubMods } = await supabase
          .from("club_members")
          .select("user_id")
          .eq("club_id", event.club_id)
          .in("role", ["owner", "admin", "moderator"]);

        if (clubMods && clubMods.length > 0) {
          const { data: userProfile } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .single();

          createNotifications(
            supabase,
            clubMods.map((m) => ({
              userId: m.user_id,
              type: "payment_proof_uploaded" as const,
              title: "Payment Proof Uploaded",
              body: `${userProfile?.full_name ?? "A participant"} uploaded payment proof for ${event.title}`,
              href: `/dashboard/clubs/${event.club_id}`,
              actorId: user.id,
            })),
          ).catch(() => null);
        }
      } catch {
        // Non-critical: booking was created, proof upload failed silently
      }
    }
  } else {
    // Friend mode: attach companions to existing booking
    bookingId = existingBooking!.id;
    // Re-fetch the full booking record
    const { data: fullBooking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    bookingRecord = fullBooking;
  }

  // Insert companions if any
  let insertedCompanions: any[] = [];
  if (companions.length > 0) {
    const companionStatus = isFree ? ("confirmed" as const) : ("pending" as const);
    const generateQr = isFree || isCash;

    const companionRows = companions.map((c) => {
      const id = crypto.randomUUID();
      return {
        id,
        booking_id: bookingId,
        full_name: sanitizeName(c.full_name),
        phone: c.phone || null,
        status: companionStatus,
        qr_code: generateQr ? `eventtara:checkin:${eventId}:companion:${id}` : null,
        event_distance_id: c.event_distance_id || null,
      };
    });

    const { data: inserted, error: compError } = await supabase
      .from("booking_companions")
      .insert(companionRows)
      .select();

    if (compError) {
      console.error("[Companions] Insert failed:", compError);
    } else {
      insertedCompanions = inserted || [];
    }
  }

  // Insert booking rentals if any
  if (rentalItems.length > 0) {
    // Fetch current prices for snapshot
    const rentalItemIds = rentalItems.map((r) => r.rental_item_id);
    const { data: rentalPrices } = await supabase
      .from("club_rental_items")
      .select("id, rental_price")
      .in("id", rentalItemIds);

    const priceMap = new Map((rentalPrices || []).map((r) => [r.id, r.rental_price]));

    const rentalRows = rentalItems
      .filter((r) => priceMap.has(r.rental_item_id))
      .map((r) => ({
        booking_id: bookingId,
        rental_item_id: r.rental_item_id,
        quantity: r.quantity,
        size: r.size ?? null,
        unit_price: priceMap.get(r.rental_item_id) ?? 0,
      }));

    if (rentalRows.length > 0) {
      const { error: rentalError } = await supabase.from("booking_rentals").insert(rentalRows);
      if (rentalError) {
        console.error("[BookingRentals] Insert failed:", rentalError);
      }
    }
  }

  // Send confirmation email for free events
  if (mode === "self" && isFree) {
    try {
      const { data: userProfile } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const emailAddress = user.email ?? userProfile?.email;

      if (emailAddress) {
        const eventDate = new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        sendEmail({
          to: emailAddress,
          subject: `Booking Confirmed: ${event.title}`,
          html: bookingConfirmationHtml({
            userName: userProfile?.full_name ?? "",
            eventTitle: event.title,
            eventDate,
            eventLocation: event.location,
            bookingId,
            qrCode: qrCode!,
          }),
        }).catch((error) => {
          console.error("[Email] Booking confirmation failed:", error);
        });
      }
    } catch (error) {
      console.error("[Email] Error preparing booking confirmation:", error);
    }
  }

  // Notify participant of booking (fire-and-forget)
  createNotification(supabase, {
    userId: user.id,
    type: "booking_confirmed",
    title: bookingStatus === "confirmed" ? "Booking Confirmed" : "Spot Reserved",
    body:
      bookingStatus === "confirmed"
        ? `Your booking for ${event.title} has been confirmed.`
        : `Your spot for ${event.title} has been reserved. Payment is pending.`,
    href: `/events/${eventId}`,
  }).catch(() => null);

  return NextResponse.json({
    booking: bookingRecord,
    companions: insertedCompanions,
    mode,
  });
}
