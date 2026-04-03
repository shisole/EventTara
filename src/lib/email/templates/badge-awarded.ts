import { emailButton, emailLayout } from "./layout";

interface BadgeAwardedProps {
  userName: string;
  badgeTitle: string;
  badgeDescription: string | null;
  badgeImageUrl: string | null;
  eventTitle: string;
  username?: string;
  badgeId: string;
}

export function badgeAwardedHtml({
  userName,
  badgeTitle,
  badgeDescription,
  badgeImageUrl,
  eventTitle,
  username,
  badgeId,
}: BadgeAwardedProps): string {
  const badgeImage = badgeImageUrl
    ? `<img src="${badgeImageUrl}" alt="${badgeTitle}" width="120" height="120" style="border-radius:50%;border:4px solid #DAA520;margin-bottom:16px;" />`
    : `<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#DAA520,#a3e635);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:4px solid #DAA520;">
        <span style="font-size:48px;">&#127942;</span>
      </div>`;

  const badgesUrl = username
    ? `https://eventtara.com/profile/${username}`
    : `https://eventtara.com/my-events`;

  const content = `
    <div style="text-align:center;">
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Congratulations, ${userName}!</h2>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
        You have earned a new badge for participating in <strong style="color:#f1f5f9">${eventTitle}</strong>.
      </p>
      ${badgeImage}
      <h3 style="color:#f1f5f9;margin:0 0 8px;font-size:18px;">${badgeTitle}</h3>
      ${badgeDescription ? `<p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.5;">${badgeDescription}</p>` : ""}
      <div style="margin-bottom:16px;">
        ${emailButton("View Your Badges", badgesUrl)}
      </div>
      <div>
        <a href="https://eventtara.com/badges/${badgeId}" style="display:inline-block;background-color:transparent;color:#a3e635;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;border:2px solid #a3e635;">
          Leave a Review
        </a>
      </div>
    </div>`;

  return emailLayout({
    title: "Badge Awarded",
    content,
    footerText: "You received this email because you were awarded a badge on EventTara.",
  });
}
