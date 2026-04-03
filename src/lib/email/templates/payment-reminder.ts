import { emailButton, emailLayout } from "./layout";

interface PaymentReminderProps {
  userName: string;
  eventTitle: string;
  eventUrl: string;
}

export function paymentReminderHtml({
  userName,
  eventTitle,
  eventUrl,
}: PaymentReminderProps): string {
  const content = `
    <h1 style="color:#fbbf24;font-size:24px;font-weight:700;margin:0 0 16px;">
      Payment Reminder
    </h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 8px;">
      Hey ${userName}, your booking for
      <strong style="color:#f1f5f9">${eventTitle}</strong> will expire soon.
    </p>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Please upload your proof of payment to secure your slot.
    </p>
    <div style="text-align:center;">
      ${emailButton("Upload Payment Proof", eventUrl)}
    </div>
  `;

  return emailLayout({
    title: "Payment Reminder",
    content,
    footerText: "You received this email because you booked an event on EventTara.",
  });
}
