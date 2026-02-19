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
  const typeLabels: Record<string, string> = {
    hiking: "Hiking",
    mtb: "Mountain Biking",
    road_bike: "Road Cycling",
    running: "Running",
    trail_run: "Trail Running",
  };

  const typeLabel = typeLabels[eventType] || eventType;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2D5A3D,#3A7A52);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Event Reminder</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#0891b2;margin:0 0 8px;font-size:20px;">Your Event is Tomorrow!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Hey ${userName}, just a friendly reminder that your adventure is coming up soon. Get ready!
              </p>
              <!-- Event details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;color:#333;font-size:16px;font-weight:600;">${eventTitle}</p>
                    <p style="margin:0 0 8px;color:#666;font-size:14px;">
                      <span style="color:#2D5A3D;font-weight:600;">Type:</span> ${typeLabel}
                    </p>
                    <p style="margin:0 0 8px;color:#666;font-size:14px;">
                      <span style="color:#2D5A3D;font-weight:600;">Date:</span> ${eventDate}
                    </p>
                    <p style="margin:0;color:#666;font-size:14px;">
                      <span style="color:#2D5A3D;font-weight:600;">Location:</span> ${eventLocation}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Checklist -->
              <h3 style="color:#333;font-size:16px;margin:0 0 12px;">Quick Checklist:</h3>
              <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
                <li>Check the weather forecast for ${eventLocation}</li>
                <li>Prepare your gear and equipment</li>
                <li>Stay hydrated and get a good night&apos;s sleep</li>
                <li>Have your QR check-in code ready on your phone</li>
              </ul>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you have an upcoming event on EventTara.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
