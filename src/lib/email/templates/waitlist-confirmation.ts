interface WaitlistConfirmationProps {
  orgName: string;
}

export function waitlistConfirmationHtml({ orgName }: WaitlistConfirmationProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the Waitlist!</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d9488,#2D5A3D);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Organizer Waitlist</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">&#127881;</div>
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:22px;">You're on the list!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.6;">
                Thanks for signing up, <strong>${orgName}</strong>! We're building something great for event organizers in the Philippine outdoor adventure space.
              </p>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.6;">
                We'll reach out as soon as we're ready to onboard new organizers. In the meantime, feel free to explore upcoming events on EventTara.
              </p>
              <!-- CTA -->
              <a href="https://eventtara.com/events" style="display:inline-block;background-color:#2D5A3D;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                Explore Events
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you joined the EventTara organizer waitlist.
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
