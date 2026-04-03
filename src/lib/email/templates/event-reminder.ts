import { ACTIVITY_TYPE_LABELS } from "@/lib/constants/activity-types";

import { emailInfoCard, emailLayout } from "./layout";

// Cron integration note: eventReminderHtml() is intended to be called from a
// scheduled job (e.g. Supabase Edge Function via pg_cron, Vercel Cron Job, or
// any external cron service). The job should query events happening in the next
// 24 hours, fetch confirmed bookings and their user emails, then send reminders
// via sendEmail(). Example pg_cron schedule:
//   select cron.schedule('event-reminders', '0 8 * * *', $$
//     select net.http_post(
//       url := 'https://your-app.com/api/cron/event-reminders',
//       headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
//     );
//   $$);

interface EventReminderProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
}

export function eventReminderHtml({
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  eventType,
}: EventReminderProps): string {
  const typeLabel =
    ACTIVITY_TYPE_LABELS[eventType as keyof typeof ACTIVITY_TYPE_LABELS] || eventType;

  const content = `
    <h1 style="color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 16px;">
      Your Event is Tomorrow!
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Hey ${userName}, just a friendly reminder that your adventure is coming up soon. Get ready!
    </p>
    ${emailInfoCard(`
      <p style="color:#f1f5f9;font-size:18px;font-weight:600;margin:0 0 12px;">${eventTitle}</p>
      <p style="margin:0 0 8px;">
        <span style="color:#a3e635;font-weight:600;">Type:</span>
        <span style="color:#94a3b8;"> ${typeLabel}</span>
      </p>
      <p style="margin:0 0 8px;">
        <span style="color:#a3e635;font-weight:600;">Date:</span>
        <span style="color:#94a3b8;"> ${eventDate}</span>
      </p>
      <p style="margin:0;">
        <span style="color:#a3e635;font-weight:600;">Location:</span>
        <span style="color:#94a3b8;"> ${eventLocation}</span>
      </p>
    `)}
    <div style="margin:32px 0 0;">
      <h2 style="color:#f1f5f9;font-size:16px;font-weight:600;margin:0 0 12px;">
        Quick Checklist:
      </h2>
      <ul style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
        <li>Check the weather forecast</li>
        <li>Prepare your gear and equipment</li>
        <li>Bring enough water and snacks</li>
        <li>Charge your phone and GPS device</li>
        <li>Get a good night's rest</li>
      </ul>
    </div>
  `;

  return emailLayout({
    title: "Your Event is Tomorrow!",
    content,
    footerText: "You received this email because you have an upcoming event on EventTara.",
  });
}
