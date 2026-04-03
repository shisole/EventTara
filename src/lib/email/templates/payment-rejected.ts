import { emailLayout } from "./layout";

interface PaymentRejectedProps {
  userName: string;
  eventTitle: string;
}

export function paymentRejectedHtml({ userName, eventTitle }: PaymentRejectedProps): string {
  const content = `
    <h1 style="color:#fbbf24;font-size:24px;font-weight:700;margin:0 0 16px;">
      Payment Issue
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hi <strong style="color:#f1f5f9;">${userName}</strong>, your payment for
      <strong style="color:#f1f5f9;">${eventTitle}</strong> could not be verified.
    </p>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 0;">
      Please re-upload a valid proof of payment or contact the event organizer
      for assistance.
    </p>
  `;

  return emailLayout({
    title: "Payment Issue",
    content,
    footerText: "You received this email because you booked an event on EventTara.",
  });
}
