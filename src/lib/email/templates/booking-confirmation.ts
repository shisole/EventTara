interface BookingConfirmationProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  bookingId: string;
  qrCode: string;
}

export function bookingConfirmationHtml({
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  bookingId,
  qrCode,
}: BookingConfirmationProps): string {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E8614D, #D4503F);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Adventure Awaits</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Booking Confirmed!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Hey ${userName}, your spot is secured! Here are your booking details:
              </p>
              <!-- Event details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;color:#333;font-size:16px;font-weight:600;">${eventTitle}</p>
                    <p style="margin:0 0 8px;color:#666;font-size:14px;">
                      <span style="color:#E8614D;font-weight:600;">Date:</span> ${eventDate}
                    </p>
                    <p style="margin:0 0 8px;color:#666;font-size:14px;">
                      <span style="color:#E8614D;font-weight:600;">Location:</span> ${eventLocation}
                    </p>
                    <p style="margin:0;color:#666;font-size:14px;">
                      <span style="color:#E8614D;font-weight:600;">Booking ID:</span> ${bookingId}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0;">
                    <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 12px;">Your Check-in QR Code</p>
                    <img src="${qrCodeUrl}" alt="Check-in QR Code" width="200" height="200" style="border:4px solid #2D5A3D;border-radius:8px;" />
                    <p style="color:#888;font-size:12px;margin:12px 0 0;">Show this QR code at the event for quick check-in</p>
                  </td>
                </tr>
              </table>
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
