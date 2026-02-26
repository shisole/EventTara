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
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#DAA520,#0891b2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:4px solid #DAA520;">
    <span style="font-size:${fontSize}px;">${emoji}</span>
  </div>`;
}

function singleBadgeBody(userName: string, badge: BadgesEarnedProps["badges"][0]): string {
  return `
    <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Congratulations, ${userName}!</h2>
    <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
      You earned a new badge.
    </p>
    <!-- Badge display -->
    ${emojiCircle(badge.imageUrl, 120)}
    <h3 style="color:#333;margin:0 0 8px;font-size:18px;">${badge.title}</h3>
    <p style="color:#666;font-size:14px;margin:0 0 24px;line-height:1.5;">${badge.description}</p>`;
}

function multiBadgeBody(userName: string, badges: BadgesEarnedProps["badges"]): string {
  // Build 2-column table rows
  const rows: string[] = [];
  for (let i = 0; i < badges.length; i += 2) {
    const left = badges[i];
    const right = badges[i + 1];
    const leftCell = `
      <td width="50%" style="text-align:center;padding:16px 8px;vertical-align:top;">
        ${emojiCircle(left.imageUrl, 80)}
        <p style="color:#333;font-size:14px;font-weight:600;margin:0 0 4px;">${left.title}</p>
        <p style="color:#666;font-size:12px;margin:0;line-height:1.4;">${left.description}</p>
      </td>`;
    const rightCell = right
      ? `<td width="50%" style="text-align:center;padding:16px 8px;vertical-align:top;">
          ${emojiCircle(right.imageUrl, 80)}
          <p style="color:#333;font-size:14px;font-weight:600;margin:0 0 4px;">${right.title}</p>
          <p style="color:#666;font-size:12px;margin:0;line-height:1.4;">${right.description}</p>
        </td>`
      : `<td width="50%" style="padding:16px 8px;"></td>`;
    rows.push(`<tr>${leftCell}${rightCell}</tr>`);
  }

  return `
    <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Congratulations, ${userName}!</h2>
    <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
      You earned ${badges.length} new badges.
    </p>
    <!-- Badges grid -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${rows.join("")}
    </table>`;
}

export function badgesEarnedHtml({ userName, badges }: BadgesEarnedProps): string {
  const isSingle = badges.length === 1;
  const subtitle = isSingle ? "Achievement Unlocked!" : "New Achievements!";
  const body = isSingle ? singleBadgeBody(userName, badges[0]) : multiBadgeBody(userName, badges);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subtitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#DAA520,#0891b2);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">${subtitle}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;text-align:center;">
              ${body}
              <!-- CTA -->
              <a href="https://eventtara.com/achievements" style="display:inline-block;background-color:#2D5A3D;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                View Your Achievements
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you earned achievement badges on EventTara.
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
