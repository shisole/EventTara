interface ReviewRequestProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  clubName: string;
  reviewUrl: string;
}

export function reviewRequestHtml({
  userName,
  eventTitle,
  eventDate,
  clubName,
  reviewUrl,
}: ReviewRequestProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Leave a Review</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2, #0e7490);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Adventure Awaits</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Thanks for Joining!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Hey ${userName}, thanks for joining ${eventTitle}! Your feedback helps ${clubName} improve and helps other adventurers decide.
              </p>
              <!-- Event details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;color:#333;font-size:16px;font-weight:600;">${eventTitle}</p>
                    <p style="margin:0;color:#666;font-size:14px;">
                      <span style="color:#0891b2;font-weight:600;">Date:</span> ${eventDate}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <a href="${reviewUrl}" style="display:inline-block;background: linear-gradient(135deg, #0891b2, #0e7490);color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Review</a>
                  </td>
                </tr>
              </table>
              <!-- Subtitle -->
              <p style="color:#888;font-size:13px;text-align:center;margin:16px 0 0;line-height:1.5;">
                It only takes a minute — rate your experience and optionally add tags or photos.
              </p>
              <p style="color:#0891b2;font-size:13px;text-align:center;margin:8px 0 0;line-height:1.5;font-weight:600;">
                🪙 Earn 5 coins for your review — plus 10 bonus coins if you include photos!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you participated in an event on EventTara.
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
