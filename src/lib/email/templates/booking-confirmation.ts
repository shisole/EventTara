import { emailInfoCard, emailLayout } from "./layout";

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

  const content = `
    <h1 style="color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 16px;">
      Booking Confirmed!
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Hi <strong style="color:#f1f5f9;">${userName}</strong>, your spot is secured! Here are your booking details:
    </p>
    ${emailInfoCard(`
      <p style="margin:0 0 12px;">
        <span style="color:#a3e635;font-weight:600;">Event:</span>
        <span style="color:#94a3b8;"> ${eventTitle}</span>
      </p>
      <p style="margin:0 0 12px;">
        <span style="color:#a3e635;font-weight:600;">Date:</span>
        <span style="color:#94a3b8;"> ${eventDate}</span>
      </p>
      <p style="margin:0 0 12px;">
        <span style="color:#a3e635;font-weight:600;">Location:</span>
        <span style="color:#94a3b8;"> ${eventLocation}</span>
      </p>
      <p style="margin:0;">
        <span style="color:#a3e635;font-weight:600;">Booking ID:</span>
        <span style="color:#94a3b8;"> ${bookingId}</span>
      </p>
    `)}
    <div style="text-align:center;margin:32px 0 16px;">
      <p style="color:#f1f5f9;font-size:14px;font-weight:600;margin:0 0 12px;">
        Your Check-in QR Code
      </p>
      <img
        src="${qrCodeUrl}"
        alt="Check-in QR Code"
        width="200"
        height="200"
        style="border:3px solid #a3e635;border-radius:8px;"
      />
      <p style="color:#64748b;font-size:12px;margin:12px 0 0;">
        Show this QR code at the event for quick check-in.
      </p>
    </div>
  `;

  return emailLayout({
    title: "Booking Confirmed",
    content,
    footerText: "You received this email because you booked an event on EventTara.",
  });
}
