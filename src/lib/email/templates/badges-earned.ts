import { emailButton, emailLayout } from "./layout";

interface BadgesEarnedProps {
  userName: string;
  badges: {
    title: string;
    description: string;
    imageUrl: string; // emoji string for system badges
  }[];
}

function emojiCircle(emoji: string, size: number): string {
  const fontSize = size === 120 ? 48 : 32;
  return `<table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;"><tr><td style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#a3e635,#065f46);text-align:center;vertical-align:middle;border:4px solid #a3e635;">
    <span style="font-size:${fontSize}px;line-height:1;">${emoji}</span>
  </td></tr></table>`;
}

function singleBadgeBody(userName: string, badge: BadgesEarnedProps["badges"][0]): string {
  return `
    <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Congratulations, ${userName}!</h2>
    <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
      You earned a new badge.
    </p>
    ${emojiCircle(badge.imageUrl, 120)}
    <h3 style="color:#f1f5f9;margin:0 0 8px;font-size:18px;">${badge.title}</h3>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.5;">${badge.description}</p>`;
}

function multiBadgeBody(userName: string, badges: BadgesEarnedProps["badges"]): string {
  const rows: string[] = [];
  for (let i = 0; i < badges.length; i += 2) {
    const left = badges[i];
    const right = badges[i + 1];
    const leftCell = `
      <td width="50%" style="text-align:center;padding:16px 8px;vertical-align:top;">
        ${emojiCircle(left.imageUrl, 80)}
        <p style="color:#f1f5f9;font-size:14px;font-weight:600;margin:0 0 4px;">${left.title}</p>
        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.4;">${left.description}</p>
      </td>`;
    const rightCell = right
      ? `<td width="50%" style="text-align:center;padding:16px 8px;vertical-align:top;">
          ${emojiCircle(right.imageUrl, 80)}
          <p style="color:#f1f5f9;font-size:14px;font-weight:600;margin:0 0 4px;">${right.title}</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.4;">${right.description}</p>
        </td>`
      : `<td width="50%" style="padding:16px 8px;"></td>`;
    rows.push(`<tr>${leftCell}${rightCell}</tr>`);
  }

  return `
    <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:20px;">Congratulations, ${userName}!</h2>
    <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.5;">
      You earned ${badges.length} new badges.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${rows.join("")}
    </table>`;
}

export function badgesEarnedHtml({ userName, badges }: BadgesEarnedProps): string {
  const isSingle = badges.length === 1;
  const subtitle = isSingle ? "Achievement Unlocked!" : "New Achievements!";
  const body = isSingle ? singleBadgeBody(userName, badges[0]) : multiBadgeBody(userName, badges);

  const content = `
    <div style="text-align:center;">
      ${body}
      ${emailButton("View Your Achievements", "https://eventtara.com/achievements")}
    </div>`;

  return emailLayout({
    title: subtitle,
    content,
    footerText: "You received this email because you earned achievement badges on EventTara.",
  });
}
