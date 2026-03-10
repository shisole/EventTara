import { ACTIVITY_TYPE_LABELS } from "@/lib/constants/activity-types";

interface EventPublishedProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  clubName: string;
  eventId: string;
}

export function eventPublishedHtml({
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  eventType,
  clubName,
  eventId,
}: EventPublishedProps): string {
  const typeLabel =
    ACTIVITY_TYPE_LABELS[eventType as keyof typeof ACTIVITY_TYPE_LABELS] || eventType;

  const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com"}/events/${eventId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Event from ${clubName}</title>
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
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">New Event Published</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#0891b2;margin:0 0 8px;font-size:20px;">New Event from ${clubName}!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Hey ${userName}, <strong>${clubName}</strong> just published a new event. Check it out!
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
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${eventUrl}" style="display:inline-block;background:linear-gradient(135deg,#2D5A3D,#3A7A52);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      View Event
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you are a member of ${clubName} on EventTara.
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
