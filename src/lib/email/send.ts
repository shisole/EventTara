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
  replyTo?: string;
}

export interface BatchEmailItem {
  to: string;
  subject: string;
  html: string;
}

export async function sendBatchEmails(emails: BatchEmailItem[]) {
  const resend = getResend();

  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set, skipping batch send:", {
      count: emails.length,
    });
    return { success: true, skipped: true, sent: 0, failed: 0 };
  }

  try {
    // Resend batch API supports up to 100 emails per call
    const BATCH_SIZE = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const { data, error } = await resend.batch.send(
        batch.map((e) => ({
          from: FROM_EMAIL,
          to: [e.to],
          subject: e.subject,
          html: e.html,
        })),
      );

      if (error) {
        console.error("[Email] Batch send error:", error);
        failed += batch.length;
      } else {
        sent += data?.data?.length ?? batch.length;
      }
    }

    return { success: true, sent, failed };
  } catch (error) {
    console.error("[Email] Batch unexpected error:", error);
    return { success: false, error, sent: 0, failed: emails.length };
  }
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  const resend = getResend();

  // Skip sending if no API key is configured
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email send:", {
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
      ...(replyTo && { replyTo }),
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return { success: false, error: error };
  }
}
