interface BadgeAwardedProps {
  userName: string;
  badgeTitle: string;
  badgeDescription: string | null;
  badgeImageUrl: string | null;
  eventTitle: string;
}

export function badgeAwardedHtml({
  userName,
  badgeTitle,
  badgeDescription,
  badgeImageUrl,
  eventTitle,
}: BadgeAwardedProps): string {
  const badgeImage = badgeImageUrl
    ? `<img src="${badgeImageUrl}" alt="${badgeTitle}" width="120" height="120" style="border-radius:50%;border:4px solid #DAA520;margin-bottom:16px;" />`
    : `<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#DAA520,#E8614D);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;border:4px solid #DAA520;">
        <span style="font-size:48px;">&#127942;</span>
      </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Badge Awarded</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#DAA520,#E8614D);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Achievement Unlocked!</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;text-align:center;">
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">Congratulations, ${userName}!</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                You have earned a new badge for participating in <strong>${eventTitle}</strong>.
              </p>
              <!-- Badge display -->
              ${badgeImage}
              <h3 style="color:#333;margin:0 0 8px;font-size:18px;">${badgeTitle}</h3>
              ${badgeDescription ? `<p style="color:#666;font-size:14px;margin:0 0 24px;line-height:1.5;">${badgeDescription}</p>` : ""}
              <!-- CTA -->
              <a href="#" style="display:inline-block;background-color:#2D5A3D;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                View Your Badges
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you were awarded a badge on EventTara.
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
