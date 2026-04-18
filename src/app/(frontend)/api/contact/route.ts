import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { contactInquiryHtml } from "@/lib/email/templates/contact-inquiry";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    // Type and length validation
    if (typeof name !== "string" || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Name is too long (max 100 characters)." },
        { status: 400 },
      );
    }
    if (typeof email !== "string" || email.trim().length > 254) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (typeof message !== "string" || message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Strip newlines from name to prevent email header injection
    const safeName = name.replaceAll(/[\r\n]/g, "");

    const result = await sendEmail({
      to: "info@eventtara.com",
      subject: `Contact Form: ${safeName}`,
      html: contactInquiryHtml({ name, email, message }),
      replyTo: email,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
