import { emailButton, emailInfoCard, emailLayout } from "./layout";

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
  const content = `
    <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Thanks for Joining!</h2>
    <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
      Hey ${userName}, thanks for joining ${eventTitle}! Your feedback helps ${clubName} improve and helps other adventurers decide.
    </p>
    ${emailInfoCard(`
      <p style="margin:0 0 12px;color:#f1f5f9;font-size:16px;font-weight:600;">${eventTitle}</p>
      <p style="margin:0;color:#94a3b8;font-size:14px;">
        <span style="color:#a3e635;font-weight:600;">Date:</span> ${eventDate}
      </p>
    `)}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 0;">
          ${emailButton("Leave a Review", reviewUrl)}
        </td>
      </tr>
    </table>
    <p style="color:#64748b;font-size:13px;text-align:center;margin:16px 0 0;line-height:1.5;">
      It only takes a minute — rate your experience and optionally add tags or photos.
    </p>
    <p style="color:#a3e635;font-size:13px;text-align:center;margin:8px 0 0;line-height:1.5;font-weight:600;">
      &#x1FA99; Earn 5 coins for your review — plus 10 bonus coins if you include photos!
    </p>`;

  return emailLayout({
    title: "Leave a Review",
    content,
    footerText: "You received this email because you participated in an event on EventTara.",
  });
}
