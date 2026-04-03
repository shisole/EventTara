import { emailButton, emailLayout } from "./layout";

interface BookingCancelledProps {
  userName: string;
  eventTitle: string;
  eventUrl: string;
}

export function bookingCancelledHtml({
  userName,
  eventTitle,
  eventUrl,
}: BookingCancelledProps): string {
  const content = `
    <h1 style="color:#f87171;font-size:24px;font-weight:700;margin:0 0 16px;">
      Booking Cancelled
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hi <strong style="color:#f1f5f9;">${userName}</strong>, your booking for
      <strong style="color:#f1f5f9;">${eventTitle}</strong> has been cancelled.
    </p>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
      If you change your mind, you can rebook if spots are still available.
    </p>
    ${emailButton("View Event", eventUrl)}
  `;

  return emailLayout({
    title: "Booking Cancelled",
    content,
    footerText: "You received this email because you booked an event on EventTara.",
  });
}
