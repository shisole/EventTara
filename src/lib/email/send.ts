import { Resend } from "resend";

const FROM_EMAIL = "EventTara <noreply@eventtara.com>";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const resend = getResend();

  // Skip sending if no API key is configured
  if (!resend) {
    console.log("[Email] RESEND_API_KEY not set, skipping email send:", {
      to,
      subject,
    });
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}
