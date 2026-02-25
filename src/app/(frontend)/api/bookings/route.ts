import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";
import { createClient } from "@/lib/supabase/server";

interface CompanionInput {
  full_name: string;
  phone: string | null;
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

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    eventId = formData.get("event_id") as string;
    paymentMethod = formData.get("payment_method") as string;
    proofFile = formData.get("payment_proof") as File | null;
    mode = (formData.get("mode") as string) === "friend" ? "friend" : "self";
    eventDistanceId = (formData.get("event_distance_id") as string) || null;
    const companionsStr = formData.get("companions") as string | null;
    if (companionsStr) {
      try {
        companions = JSON.parse(companionsStr);
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
  }

  if (!eventId || !paymentMethod) {
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

  // Check capacity — per-distance if a distance is selected, otherwise event-level
  const requestedSlots = mode === "self" ? 1 + companions.length : companions.length;

  if (eventDistanceId) {
    // Validate the distance belongs to this event
    const { data: distance } = await supabase
      .from("event_distances")
      .select("id, max_participants")
      .eq("id", eventDistanceId)
      .eq("event_id", eventId)
      .single();

    if (!distance) {
      return NextResponse.json({ error: "Invalid distance selection" }, { status: 400 });
    }

    // Count current bookings for this specific distance
    const { data: distanceBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", eventId)
      .eq("event_distance_id", eventDistanceId)
      .in("status", ["pending", "confirmed"]);

    const distanceBookingCount = distanceBookings?.length || 0;

    // Count companions attached to those bookings
    let distanceCompanionCount = 0;
    if (distanceBookings && distanceBookings.length > 0) {
      const bookingIds = distanceBookings.map((b) => b.id);
      const { count } = await supabase
        .from("booking_companions")
        .select("id", { count: "exact", head: true })
        .in("booking_id", bookingIds)
        .in("status", ["pending", "confirmed"]);
      distanceCompanionCount = count || 0;
    }

    const totalDistanceParticipants = distanceBookingCount + distanceCompanionCount;

    if (totalDistanceParticipants + requestedSlots > distance.max_participants) {
      return NextResponse.json(
        { error: "Not enough spots available for this distance" },
        { status: 400 },
      );
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

  const isFree = event.price === 0 || paymentMethod === "free";
  const isEwallet = paymentMethod === "gcash" || paymentMethod === "maya";
  const isCash = paymentMethod === "cash";

  // Determine booking status and payment status
  let bookingStatus: "confirmed" | "pending";
  let paymentStatus: "paid" | "pending";
  let qrCode: string | null = null;

  if (isFree) {
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
    // Create new booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        event_id: eventId,
        user_id: user.id,
        payment_method: isFree ? null : (paymentMethod as "gcash" | "maya" | "cash"),
        qr_code: qrCode,
        status: bookingStatus,
        payment_status: paymentStatus,
        event_distance_id: eventDistanceId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    bookingId = booking.id;
    bookingRecord = booking;

    // Upload proof file if e-wallet
    if (isEwallet && proofFile) {
      const fileExt = proofFile.name.split(".").pop() || "jpg";
      const filePath = `${eventId}/${booking.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proofFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);

        await supabase
          .from("bookings")
          .update({ payment_proof_url: urlData.publicUrl })
          .eq("id", booking.id);

        bookingRecord.payment_proof_url = urlData.publicUrl;
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
        full_name: c.full_name.trim(),
        phone: c.phone || null,
        status: companionStatus,
        qr_code: generateQr ? `eventtara:checkin:${eventId}:companion:${id}` : null,
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

  return NextResponse.json({
    booking: bookingRecord,
    companions: insertedCompanions,
    mode,
  });
}
