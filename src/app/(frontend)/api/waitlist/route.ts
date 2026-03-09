// DEPRECATED: Organizer waitlist is no longer needed — clubs are self-service.
// This route is kept for backward compatibility with the existing organizer_waitlist table.
import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { waitlistConfirmationHtml } from "@/lib/email/templates/waitlist-confirmation";
import { createClient } from "@/lib/supabase/server";

function roundCount(count: number): { display: string; raw: number } {
  if (count === 0) return { display: "Be the first to join!", raw: 0 };
  if (count < 10)
    return { display: `${count} organizer${count === 1 ? "" : "s"} waiting`, raw: count };
  if (count < 100) {
    const rounded = Math.floor(count / 10) * 10;
    return { display: `${rounded}+ organizers waiting`, raw: rounded };
  }
  const rounded = Math.floor(count / 50) * 50;
  return { display: `${rounded}+ organizers waiting`, raw: rounded };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; org_name?: string };
    const { email, org_name } = body;

    if (!email || !org_name) {
      return NextResponse.json(
        { error: "Email and organization name are required." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const trimmedOrgName = org_name.trim();
    if (trimmedOrgName.length < 2 || trimmedOrgName.length > 100) {
      return NextResponse.json(
        { error: "Organization name must be between 2 and 100 characters." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error: insertError } = await supabase
      .from("organizer_waitlist")
      .insert({ email: email.toLowerCase().trim(), org_name: trimmedOrgName });

    if (insertError) {
      // Unique constraint violation on email
      if (insertError.code === "23505") {
        // Still get count for the response
        const { count } = await supabase
          .from("organizer_waitlist")
          .select("*", { count: "exact", head: true });

        return NextResponse.json({
          success: true,
          already_registered: true,
          message: "This email is already on the waitlist!",
          ...roundCount(count ?? 0),
        });
      }
      console.error("[Waitlist] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to join waitlist." }, { status: 500 });
    }

    // Get updated count
    const { count } = await supabase
      .from("organizer_waitlist")
      .select("*", { count: "exact", head: true });

    // Send confirmation email (non-blocking)
    sendEmail({
      to: email.toLowerCase().trim(),
      subject: "You're on the EventTara organizer waitlist!",
      html: waitlistConfirmationHtml({ orgName: trimmedOrgName }),
    }).catch((error) => console.error("[Waitlist] Email error:", error));

    return NextResponse.json({
      success: true,
      already_registered: false,
      message: "You're on the list!",
      ...roundCount(count ?? 0),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
