interface PaymentRejectedProps {
  userName: string;
  eventTitle: string;
}

export function paymentRejectedHtml({ userName, eventTitle }: PaymentRejectedProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Issue</title>
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
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Payment Issue</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Hey ${userName}, your payment for <strong>${eventTitle}</strong> could not be verified. Please check your payment or upload a new payment screenshot from your My Events page.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you booked an event on EventTara.
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
