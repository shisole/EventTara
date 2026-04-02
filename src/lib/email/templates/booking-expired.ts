import { emailButton, emailLayout } from "./layout";

interface BookingExpiredProps {
  userName: string;
  eventTitle: string;
  eventUrl: string;
}

export function bookingExpiredHtml({
  userName,
  eventTitle,
  eventUrl,
}: BookingExpiredProps): string {
  const content = `
    <h1 style="color:#fbbf24;font-size:24px;font-weight:700;margin:0 0 16px;">
      Booking Expired
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hi <strong style="color:#f1f5f9;">${userName}</strong>, your booking for
      <strong style="color:#f1f5f9;">${eventTitle}</strong> has expired due to
      incomplete payment.
    </p>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
      If you're still interested, you can view the event and book again.
    </p>
    ${emailButton("View Event", eventUrl)}
  `;

  return emailLayout({
    title: "Booking Expired",
    content,
    footerText: "You received this email because you booked an event on EventTara.",
  });
}
